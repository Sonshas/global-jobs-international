import type { User } from '@supabase/supabase-js';
import type { DocumentRecord } from '@/data/recruitment-pipeline';

export type ProfileCompletionInput = {
  user: User | null;
  documents?: DocumentRecord[];
  applicationCount?: number;
  /** True when a CV-preparation payment has succeeded (from `payments.repository`). */
  cvPaid?: boolean;
};

export type ProfileCompletionResult = {
  percent: number;
  completed: string[];
  missing: string[];
};

const FACTORS: Array<{ id: string; label: string }> = [
  { id: 'fullName', label: 'Full name' },
  { id: 'email', label: 'Email address' },
  { id: 'phone', label: 'Phone number' },
  { id: 'countryOfResidence', label: 'Country of residence' },
  { id: 'preferredWorkCountry', label: 'Preferred work country' },
  { id: 'passport', label: 'Passport / ID document' },
  { id: 'cv', label: 'CV on file' },
  { id: 'application', label: 'At least one application' },
];

/**
 * Real profile completion percentage, derived from auth metadata, uploaded
 * documents, CV payment status, and application history — no static placeholder.
 */
export function computeProfileCompletion(input: ProfileCompletionInput): ProfileCompletionResult {
  const meta = (input.user?.user_metadata ?? {}) as Record<string, unknown>;
  const documents = input.documents ?? [];

  const hasPassportDoc = documents.some(
    (doc) => (doc.kind === 'passport' || doc.kind === 'national_id') && doc.status !== 'pending',
  );
  const hasCvDoc = documents.some((doc) => doc.kind === 'cv' && doc.status !== 'pending');
  const hasCvMeta = meta.has_cv === true || meta.has_cv === 'yes';

  const checks: Record<string, boolean> = {
    fullName: Boolean(typeof meta.full_name === 'string' && meta.full_name.trim()),
    email: Boolean(input.user?.email),
    phone: Boolean(typeof meta.phone === 'string' && meta.phone.trim()),
    countryOfResidence: Boolean(
      typeof meta.country_of_residence === 'string' && meta.country_of_residence.trim(),
    ),
    preferredWorkCountry: Boolean(
      typeof meta.preferred_work_country === 'string' && meta.preferred_work_country.trim(),
    ),
    passport:
      hasPassportDoc || meta.passport_status === 'valid' || meta.passport_status === 'expired',
    cv: hasCvDoc || hasCvMeta || Boolean(input.cvPaid),
    application: (input.applicationCount ?? 0) > 0,
  };

  const completed = FACTORS.filter((factor) => checks[factor.id]).map((factor) => factor.label);
  const missing = FACTORS.filter((factor) => !checks[factor.id]).map((factor) => factor.label);
  const percent = Math.round((completed.length / FACTORS.length) * 100);

  return { percent, completed, missing };
}
