import { getAuthErrorMessage } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';
import type { EmployerSignUpProfile, SignUpProfile } from '@/components/providers/auth-context';

type SaveProfileArgs = {
  userId: string;
  email: string;
  profile: SignUpProfile;
};

type SaveEmployerProfileArgs = {
  userId: string;
  email: string;
  profile: EmployerSignUpProfile;
};

/**
 * Persists registration profile to public.users (and applicants when available).
 * Auth metadata remains the source of truth if migrations are not applied yet.
 */
export async function saveRegistrationProfile({
  userId,
  email,
  profile,
}: SaveProfileArgs): Promise<string | null> {
  const metadata = {
    full_name: profile.fullName,
    phone: profile.phoneE164,
    phone_country_iso: profile.phoneCountryIso,
    phone_dial_code: profile.phoneDialCode,
    country_of_residence: profile.countryOfResidence,
    preferred_work_country: profile.preferredWorkCountry,
    preferred_job_category: profile.preferredJobCategory,
    passport_status: profile.passportStatus,
    has_cv: profile.hasCv === 'yes',
    role: 'applicant',
    account_type: 'applicant',
  };

  const { data: countryRow } = await supabase
    .from('countries')
    .select('id')
    .eq('name', profile.countryOfResidence)
    .maybeSingle();

  const { error: userError } = await supabase.from('users').upsert(
    {
      id: userId,
      email,
      full_name: profile.fullName,
      phone: profile.phoneE164,
      account_type: 'applicant',
      status: 'pending',
      country_id: countryRow?.id ?? null,
      metadata,
    },
    { onConflict: 'id' },
  );

  if (userError) {
    // Table may not exist yet — keep auth signup successful.
    console.warn('[auth] users profile upsert skipped:', userError.message);
    return null;
  }

  const { data: applicantRow } = await supabase
    .from('applicants')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (applicantRow?.id) {
    const { error: applicantError } = await supabase
      .from('applicants')
      .update({
        residence_country_id: countryRow?.id ?? null,
        has_passport: profile.passportStatus === 'valid' || profile.passportStatus === 'expired',
        metadata: {
          preferred_work_country: profile.preferredWorkCountry,
          preferred_job_category: profile.preferredJobCategory,
          passport_status: profile.passportStatus,
          has_cv: profile.hasCv === 'yes',
          phone: profile.phoneE164,
        },
      })
      .eq('id', applicantRow.id);

    if (applicantError) {
      console.warn('[auth] applicants profile update skipped:', applicantError.message);
    }
  }

  return null;
}

export function buildAuthMetadata(profile: SignUpProfile) {
  return {
    full_name: profile.fullName,
    phone: profile.phoneE164,
    phone_country_iso: profile.phoneCountryIso,
    phone_dial_code: profile.phoneDialCode,
    country_of_residence: profile.countryOfResidence,
    preferred_work_country: profile.preferredWorkCountry,
    preferred_job_category: profile.preferredJobCategory,
    passport_status: profile.passportStatus,
    has_cv: profile.hasCv,
    role: 'applicant',
    account_type: 'applicant',
  };
}

export function buildEmployerAuthMetadata(profile: EmployerSignUpProfile) {
  return {
    full_name: profile.fullName,
    company_name: profile.companyName,
    phone: profile.phoneE164,
    phone_country_iso: profile.phoneCountryIso,
    phone_dial_code: profile.phoneDialCode,
    country_of_residence: profile.countryOfResidence,
    industry: profile.industry,
    website: profile.website || undefined,
    role: 'employer',
    account_type: 'employer',
  };
}

/**
 * Persists an employer registration to public.users + public.employers.
 * CRITICAL: this must be the only profile-save path used for employer signups —
 * calling saveRegistrationProfile() for an employer would overwrite account_type
 * back to 'applicant' and break RBAC / approval routing.
 */
export async function saveEmployerRegistrationProfile({
  userId,
  email,
  profile,
}: SaveEmployerProfileArgs): Promise<string | null> {
  const metadata = buildEmployerAuthMetadata(profile);

  const { data: countryRow } = await supabase
    .from('countries')
    .select('id')
    .eq('name', profile.countryOfResidence)
    .maybeSingle();

  const { error: userError } = await supabase.from('users').upsert(
    {
      id: userId,
      email,
      full_name: profile.fullName,
      phone: profile.phoneE164,
      account_type: 'employer',
      status: 'pending',
      country_id: countryRow?.id ?? null,
      metadata,
    },
    { onConflict: 'id' },
  );

  if (userError) {
    console.warn('[auth] employer users profile upsert skipped:', userError.message);
    return null;
  }

  const { data: existingEmployer } = await supabase
    .from('employers')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle();

  const employerPayload = {
    owner_user_id: userId,
    legal_name: profile.companyName,
    website_url: profile.website || null,
    industry: profile.industry,
    status: 'pending',
    is_verified: false,
    metadata: { accountStatus: 'pending', hqCountry: profile.countryOfResidence },
  };

  const { error: employerError } = existingEmployer?.id
    ? await supabase.from('employers').update(employerPayload).eq('id', existingEmployer.id)
    : await supabase.from('employers').insert(employerPayload);

  if (employerError) {
    console.warn('[auth] employers profile upsert skipped:', employerError.message);
  }

  return null;
}

export { getAuthErrorMessage };
