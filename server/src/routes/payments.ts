import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { env } from '../config/env.js';
import { getSupabaseUserClient, tryGetSupabaseAdmin } from '../lib/supabase.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js';

const serviceCatalog = {
  cv_preparation: {
    name: 'CV Preparation',
    description: 'Professional international CV written for overseas recruitment.',
    amount: 39,
  },
  document_verification: {
    name: 'Document Verification',
    description: 'Verification of passport, certificates, and application documents.',
    amount: 25,
  },
  police_clearance: {
    name: 'Police Clearance Assistance',
    description: 'Guidance and processing support for police clearance certificates.',
    amount: 35,
  },
  medical_appointment: {
    name: 'Medical Appointment Assistance',
    description: 'Scheduling and checklist support for pre-departure medical exams.',
    amount: 45,
  },
  interview_preparation: {
    name: 'Interview Preparation',
    description: 'Coaching session before employer or embassy interviews.',
    amount: 30,
  },
} as const;

const checkoutSchema = z.object({
  serviceId: z.enum([
    'cv_preparation',
    'document_verification',
    'police_clearance',
    'medical_appointment',
    'interview_preparation',
  ]),
});

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY on the server.');
  }
  return new Stripe(env.STRIPE_SECRET_KEY);
}

function appUrl(): string {
  return env.PUBLIC_APP_URL ?? env.CLIENT_ORIGIN;
}

async function markSessionPaid(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) return;
  const serviceId = session.metadata?.serviceId as keyof typeof serviceCatalog | undefined;
  const service = serviceId ? serviceCatalog[serviceId] : undefined;

  const admin = tryGetSupabaseAdmin();
  if (!admin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to process payment webhooks.');

  const { error } = await admin
    .from('payments')
    .update({
      status: 'succeeded',
      paid_at: new Date().toISOString(),
      external_payment_id: session.id,
      external_invoice_id: typeof session.invoice === 'string' ? session.invoice : null,
      receipt_url: null,
      metadata: {
        ...(serviceId ? { serviceId } : {}),
        ...(service ? { serviceName: service.name } : {}),
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === 'string' ? session.payment_intent : null,
        stripePaymentStatus: session.payment_status,
      },
    })
    .eq('id', paymentId)
    .eq('status', 'pending');
  if (error) throw error;
}

export const paymentsRouter = Router();

paymentsRouter.post('/checkout', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid checkout payload', details: parsed.error.flatten() });
    }
    if (!env.STRIPE_SECRET_KEY) {
      return res.status(503).json({
        error: 'Stripe is not configured. Set STRIPE_SECRET_KEY on the server.',
      });
    }

    const service = serviceCatalog[parsed.data.serviceId];
    const userId = req.authUserId!;
    const client = getSupabaseUserClient(req.authToken!);
    const { data: payment, error: insertError } = await client
      .from('payments')
      .insert({
        user_id: userId,
        payer_user_id: userId,
        provider: 'stripe',
        status: 'pending',
        amount: service.amount,
        currency: 'USD',
        description: service.description,
        metadata: { serviceId: parsed.data.serviceId, serviceName: service.name },
      })
      .select('id')
      .single();
    if (insertError) throw insertError;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: req.authEmail,
      client_reference_id: payment.id,
      metadata: { paymentId: payment.id, serviceId: parsed.data.serviceId },
      success_url: `${appUrl()}/dashboard/payments?paid=1`,
      cancel_url: `${appUrl()}/dashboard/payments?cancelled=1`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(service.amount * 100),
            product_data: { name: service.name, description: service.description },
          },
        },
      ],
    });

    if (!session.url) throw new Error('Stripe did not return a Checkout URL.');
    return res.status(201).json({ url: session.url, paymentId: payment.id });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to create checkout.' });
  }
});

paymentsRouter.post('/webhook', async (req, res) => {
  try {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({ error: 'Stripe webhook is not configured.' });
    }
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string' || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: 'Missing or invalid Stripe signature.' });
    }

    const event = getStripe().webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed') {
      await markSessionPaid(event.data.object as Stripe.Checkout.Session);
    }
    return res.json({ received: true });
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid Stripe webhook.' });
  }
});

paymentsRouter.get('/mine', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const client = getSupabaseUserClient(req.authToken!);
    const { data, error } = await client
      .from('payments')
      .select('*')
      .eq('user_id', req.authUserId!)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ payments: data ?? [] });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load payments.' });
  }
});

paymentsRouter.post('/dev-simulate-complete', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (env.APP_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  const paymentId = z.object({ paymentId: z.string().uuid() }).safeParse(req.body);
  if (!paymentId.success) return res.status(400).json({ error: 'paymentId is required.' });

  try {
    const admin = tryGetSupabaseAdmin();
    if (!admin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for the development payment simulator.');
    const { data, error } = await admin
      .from('payments')
      .update({
        status: 'succeeded',
        paid_at: new Date().toISOString(),
        metadata: { simulated: true, simulatedAt: new Date().toISOString() },
      })
      .eq('id', paymentId.data.paymentId)
      .eq('user_id', req.authUserId!)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Pending payment not found.' });
    return res.json({ paymentId: data.id, status: 'succeeded' });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to simulate payment.' });
  }
});
