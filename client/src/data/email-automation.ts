import { dispatchLifecycleEmail } from '@/lib/comms';

export type EmailTemplateId =
  | 'account_created'
  | 'email_verified'
  | 'application_submitted'
  | 'shortlisted'
  | 'rejected'
  | 'interview_scheduled'
  | 'interview_reminder'
  | 'medical_requested'
  | 'police_clearance_requested'
  | 'visa_processing_started'
  | 'visa_approved'
  | 'flight_booked'
  | 'travel_date_assigned'
  | 'welcome_after_arrival'
  | 'status_update';

export function sendLifecycleEmail(
  template: EmailTemplateId,
  input: { to: string; userId?: string; variables?: Record<string, string> },
) {
  const serverTemplate =
    template === 'police_clearance_requested' ? 'police_clearance_requested' : template;
  void dispatchLifecycleEmail({
    to: input.to,
    userId: input.userId,
    template: serverTemplate,
    variables: input.variables ?? {},
  });
}
