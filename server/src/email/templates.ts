export type LifecycleEmailTemplateId =
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

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

const BRAND = 'Global Jobs International';
const SUPPORT = 'hello@globaljobs.international';

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title></head>
<body style="margin:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="background:#0052CC;padding:24px 28px;">
          <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">${BRAND}</p>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${title}</h1>
          ${bodyHtml}
          <p style="margin:24px 0 0;font-size:13px;color:#64748b;">Questions? Contact <a href="mailto:${SUPPORT}" style="color:#0052CC;">${SUPPORT}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${text}</p>`;
}

function vars(input: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, value ?? '']),
  ) as Record<string, string>;
}

export function renderLifecycleEmail(
  template: LifecycleEmailTemplateId,
  variables: Record<string, string | undefined> = {},
): RenderedEmail {
  const v = vars(variables);

  switch (template) {
    case 'application_submitted':
      return {
        subject: `Application received — ${v.applicationNumber}`,
        html: layout(
          'Application received',
          `${p(`Hello ${v.name || 'there'},`)}${p(
            `We received your application <strong>${v.applicationNumber}</strong> for <strong>${v.jobTitle}</strong> in <strong>${v.country}</strong>.`,
          )}${p('Our recruitment team and the employer will review your profile. You can track progress anytime in your dashboard.')}`,
        ),
        text: `Application ${v.applicationNumber} for ${v.jobTitle} in ${v.country} was submitted.`,
      };
    case 'shortlisted':
      return {
        subject: `Shortlisted — ${v.applicationNumber}`,
        html: layout(
          'Congratulations — you are shortlisted',
          `${p(`Your application <strong>${v.applicationNumber}</strong> for <strong>${v.jobTitle}</strong> has been shortlisted.`)}${p(
            'Please keep your documents up to date and watch for interview instructions.',
          )}`,
        ),
        text: `Shortlisted: ${v.applicationNumber} — ${v.jobTitle}`,
      };
    case 'rejected':
      return {
        subject: `Application update — ${v.applicationNumber}`,
        html: layout(
          'Application update',
          `${p(`Thank you for applying. Application <strong>${v.applicationNumber}</strong> was not successful at this stage.`)}${
            v.note ? p(v.note) : ''
          }${p('You may apply for other roles that match your profile.')}`,
        ),
        text: `Application ${v.applicationNumber} was not successful. ${v.note || ''}`,
      };
    case 'interview_scheduled':
      return {
        subject: `Interview scheduled — ${v.applicationNumber}`,
        html: layout(
          'Interview scheduled',
          `${p(`An interview has been scheduled for application <strong>${v.applicationNumber}</strong>.`)}${
            v.note ? p(`<strong>Details:</strong> ${v.note}`) : ''
          }`,
        ),
        text: `Interview scheduled for ${v.applicationNumber}. ${v.note || ''}`,
      };
    case 'interview_reminder':
      return {
        subject: `Reminder: interview soon — ${v.applicationNumber}`,
        html: layout(
          'Interview reminder',
          `${p(`This is a reminder that your interview for application <strong>${v.applicationNumber}</strong> is scheduled for <strong>${v.when || 'soon'}</strong>.`)}${
            v.meetingUrl ? p(`Join link: <a href="${v.meetingUrl}">${v.meetingUrl}</a>`) : ''
          }`,
        ),
        text: `Reminder: interview for ${v.applicationNumber} is scheduled for ${v.when || 'soon'}. ${v.meetingUrl || ''}`,
      };
    case 'medical_requested':
      return {
        subject: `Medical examination required — ${v.applicationNumber}`,
        html: layout(
          'Medical examination required',
          p(
            `Please complete the medical examination for application <strong>${v.applicationNumber}</strong> and upload results in your document vault.`,
          ),
        ),
        text: `Medical required for ${v.applicationNumber}.`,
      };
    case 'police_clearance_requested':
      return {
        subject: `Police clearance required — ${v.applicationNumber}`,
        html: layout(
          'Police clearance required',
          p(
            `Please upload police clearance for application <strong>${v.applicationNumber}</strong> in your document vault.`,
          ),
        ),
        text: `Police clearance required for ${v.applicationNumber}.`,
      };
    case 'visa_processing_started':
      return {
        subject: `Visa processing started — ${v.applicationNumber}`,
        html: layout(
          'Visa processing started',
          p(`Visa processing has started for application <strong>${v.applicationNumber}</strong>.`),
        ),
        text: `Visa processing started for ${v.applicationNumber}.`,
      };
    case 'visa_approved':
      return {
        subject: `Visa / work permit update — ${v.applicationNumber}`,
        html: layout(
          'Visa approved',
          p(`Visa or work permit documentation was approved for <strong>${v.applicationNumber}</strong>.`),
        ),
        text: `Visa approved for ${v.applicationNumber}.`,
      };
    case 'flight_booked':
      return {
        subject: `Flight booking update — ${v.applicationNumber}`,
        html: layout(
          'Flight booked',
          `${p(`Flight details were recorded for <strong>${v.applicationNumber}</strong>.`)}${
            v.note ? p(v.note) : ''
          }`,
        ),
        text: `Flight booked for ${v.applicationNumber}.`,
      };
    case 'welcome_after_arrival':
      return {
        subject: `Welcome to ${v.country}`,
        html: layout(
          'Welcome',
          p(
            `Welcome to <strong>${v.country}</strong>! Application <strong>${v.applicationNumber}</strong> is marked as arrived. Our team will support your next steps.`,
          ),
        ),
        text: `Welcome to ${v.country} — ${v.applicationNumber}`,
      };
    case 'status_update':
    default:
      return {
        subject: v.subject || 'Application update',
        html: layout(v.subject || 'Application update', p(v.body || 'Your application status was updated.')),
        text: v.body || 'Your application status was updated.',
      };
  }
}
