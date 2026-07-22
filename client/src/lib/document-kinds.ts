import type { ApplicationDocumentKind } from '@/data/applications';
import type { ApplicantDocumentKind } from '@/data/recruitment-pipeline';

/** Maps UI document kind to `document_types.slug` in Postgres. */
export const DOCUMENT_KIND_TO_TYPE_SLUG: Record<ApplicantDocumentKind, string> = {
  passport: 'passport',
  cv: 'resume',
  certificates: 'certificate',
  national_id: 'national_id',
  driving_licence: 'driving_licence',
  academic_certificates: 'academic_certificate',
  police_clearance: 'police_clearance',
  medical_report: 'medical_report',
  passport_photo: 'passport_photo',
  ielts: 'ielts_certificate',
};

export function documentTypeSlugForKind(kind: ApplicantDocumentKind | ApplicationDocumentKind): string {
  return DOCUMENT_KIND_TO_TYPE_SLUG[kind as ApplicantDocumentKind];
}

const SLUG_TO_KIND = Object.fromEntries(
  Object.entries(DOCUMENT_KIND_TO_TYPE_SLUG).map(([kind, slug]) => [slug, kind]),
) as Record<string, ApplicantDocumentKind>;

export function documentKindFromTypeSlug(slug: string): ApplicantDocumentKind | null {
  return SLUG_TO_KIND[slug] ?? null;
}
