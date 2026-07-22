export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type DbJobStatus = 'draft' | 'published' | 'paused' | 'closed' | 'archived';
export type DbApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'interview'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'hired';

export type DbJobRow = {
  id: string;
  employer_id: string;
  category_id: string | null;
  country_id: string;
  city_id: string | null;
  title: string;
  slug: string;
  summary: string | null;
  description: string;
  responsibilities: string | null;
  benefits: string | null;
  employment_type: string;
  experience_level: string;
  status: DbJobStatus;
  vacancies: number;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_period: string;
  is_salary_public: boolean;
  visa_sponsorship: boolean;
  relocation_assistance: boolean;
  remote_option: boolean;
  application_deadline: string | null;
  published_at: string | null;
  closed_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type DbApplicationRow = {
  id: string;
  job_id: string;
  applicant_id: string;
  status: DbApplicationStatus;
  cover_letter: string | null;
  expected_salary: number | null;
  expected_salary_currency: string | null;
  available_from: string | null;
  source: string | null;
  reviewer_user_id: string | null;
  submitted_at: string;
  decided_at: string | null;
  withdrawn_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type DbEmployerRow = {
  id: string;
  owner_user_id: string;
  legal_name: string;
  trading_name: string | null;
  website_url: string | null;
  industry: string | null;
  company_size: string | null;
  is_verified: boolean;
  status: string;
  metadata: Json;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
};

export type DbEmployerProfileRow = {
  id: string;
  employer_id: string;
  tagline: string | null;
  about: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  benefits: string[] | null;
  created_at: string;
  updated_at: string;
};

export type DbApplicantRow = {
  id: string;
  user_id: string;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type DbRoleSlug = 'super_admin' | 'admin' | 'employer' | 'applicant' | 'advisor';

export type DbSavedJobRow = {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
};

export type DbConversationKind = 'application' | 'support';

export type DbConversationRow = {
  id: string;
  subject: string | null;
  job_id: string | null;
  application_id: string | null;
  applicant_user_id: string | null;
  employer_user_id: string;
  employer_id: string | null;
  kind: DbConversationKind;
  staff_user_id: string | null;
  last_message_at: string | null;
  is_archived_by_applicant: boolean;
  is_archived_by_employer: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type DbMessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  attachment_document_id: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type DbInterviewStatus = 'scheduled' | 'rescheduled' | 'completed' | 'cancelled' | 'no_show';
export type DbInterviewMode = 'video' | 'phone' | 'in_person' | 'async';

export type DbInterviewRow = {
  id: string;
  application_id: string;
  job_id: string;
  applicant_id: string;
  employer_id: string;
  scheduled_by: string | null;
  interviewer_user_id: string | null;
  status: DbInterviewStatus;
  mode: DbInterviewMode;
  scheduled_start_at: string;
  scheduled_end_at: string | null;
  timezone: string;
  meeting_url: string | null;
  location_text: string | null;
  feedback: string | null;
  rating: number | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type DbSettingRow = {
  id: string;
  user_id: string | null;
  key: string;
  value: Json;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};
