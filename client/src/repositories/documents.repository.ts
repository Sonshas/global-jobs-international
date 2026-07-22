import type { ApplicationDocumentKind } from '@/data/applications';
import { supabase } from '@/lib/supabase';
import { documentKindFromTypeSlug, documentTypeSlugForKind } from '@/lib/document-kinds';
import { checkRateLimit, logAudit, validateSecureUpload } from '@/lib/security';
import {
  APPLICANT_DOCUMENT_KINDS,
  type ApplicantDocumentKind,
  type DocumentRecord,
  type DocumentReviewStatus,
} from '@/data/recruitment-pipeline';
import { getApplicantIdForUser } from '@/repositories/applications.repository';

const DOCUMENTS_BUCKET = 'documents';

export type StoredDocumentRow = {
  id: string;
  user_id: string;
  applicant_id: string | null;
  application_id: string | null;
  document_type_id: string;
  file_name: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  status: string;
  rejection_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  document_types?: { slug: string } | { slug: string }[] | null;
};

type DocumentTypeRow = { id: string; slug: string };

let documentTypeCache: Map<string, string> | null = null;

async function loadDocumentTypeIds(): Promise<Map<string, string>> {
  if (documentTypeCache) return documentTypeCache;
  const { data, error } = await supabase.from('document_types').select('id, slug');
  if (error) throw error;
  documentTypeCache = new Map((data as DocumentTypeRow[]).map((row) => [row.slug, row.id]));
  return documentTypeCache;
}

async function typeIdForKind(kind: ApplicantDocumentKind | ApplicationDocumentKind): Promise<string> {
  const slug = documentTypeSlugForKind(kind);
  const map = await loadDocumentTypeIds();
  const id = map.get(slug);
  if (!id) throw new Error(`Document type "${slug}" is not configured. Run database migrations.`);
  return id;
}

import { sanitizeStorageFileName } from '@/lib/upload-path';
function mapDbStatusToReview(status: string, hasFile: boolean): DocumentReviewStatus {
  if (!hasFile) return 'pending';
  switch (status) {
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'uploaded':
    case 'pending_review':
    default:
      return 'uploaded';
  }
}

function kindFromRow(row: StoredDocumentRow, typesById: Map<string, string>): ApplicantDocumentKind | null {
  const joined = row.document_types;
  const slugFromJoin = Array.isArray(joined) ? joined[0]?.slug : joined?.slug;
  const slug =
    slugFromJoin || (row.document_type_id ? typesById.get(row.document_type_id) : undefined);
  if (!slug) return null;
  return documentKindFromTypeSlug(slug);
}

export function mergeDocumentSlots(
  rows: StoredDocumentRow[],
  typesById: Map<string, string>,
): DocumentRecord[] {
  const byKind = new Map<ApplicantDocumentKind, DocumentRecord>();
  for (const row of rows) {
    const kind = kindFromRow(row, typesById);
    if (!kind) continue;
    const adminNote =
      typeof row.rejection_reason === 'string' && row.rejection_reason
        ? row.rejection_reason
        : typeof row.metadata?.adminNote === 'string'
          ? row.metadata.adminNote
          : undefined;
    byKind.set(kind, {
      kind,
      fileName: row.file_name,
      fileSize: row.file_size_bytes ?? undefined,
      uploadedAt: row.created_at,
      status: mapDbStatusToReview(row.status, Boolean(row.storage_path)),
      adminNote,
      documentId: row.id,
      storagePath: row.storage_path,
    });
  }
  return APPLICANT_DOCUMENT_KINDS.map(
    (kind) => byKind.get(kind) || ({ kind, status: 'pending' as const }),
  );
}

export async function fetchApplicantDocuments(userId: string): Promise<DocumentRecord[]> {
  const applicantId = await getApplicantIdForUser(userId);
  const { data, error } = await supabase
    .from('documents')
    .select(
      'id, user_id, applicant_id, application_id, document_type_id, file_name, storage_bucket, storage_path, mime_type, file_size_bytes, status, rejection_reason, metadata, created_at, updated_at, document_types ( slug )',
    )
    .eq('applicant_id', applicantId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  const typeMap = await loadDocumentTypeIds();
  const typesById = new Map([...typeMap.entries()].map(([slug, id]) => [id, slug]));
  return mergeDocumentSlots((data ?? []) as unknown as StoredDocumentRow[], typesById);
}

async function removeStoredObject(path: string) {
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
  if (error) throw error;
}

async function findExistingForKind(applicantId: string, typeId: string): Promise<StoredDocumentRow | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, storage_path, storage_bucket')
    .eq('applicant_id', applicantId)
    .eq('document_type_id', typeId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as StoredDocumentRow | null;
}

export type UploadApplicantDocumentResult = {
  documentId: string;
  storagePath: string;
  record: DocumentRecord;
};

export async function uploadApplicantDocument(input: {
  userId: string;
  kind: ApplicantDocumentKind | ApplicationDocumentKind;
  file: File;
  applicationId?: string;
}): Promise<UploadApplicantDocumentResult> {
  const validationError = validateSecureUpload(input.file);
  if (validationError) throw new Error(validationError);
  if (!checkRateLimit(`doc-upload:${input.userId}`, 30, 60_000)) {
    throw new Error('Too many uploads. Please wait a minute and try again.');
  }

  const applicantId = await getApplicantIdForUser(input.userId);
  const typeId = await typeIdForKind(input.kind);
  const documentId = crypto.randomUUID();
  const safeName = sanitizeStorageFileName(input.file.name);
  const storagePath = `${input.userId}/${applicantId}/${documentId}/${safeName}`;

  const existing = await findExistingForKind(applicantId, typeId);
  if (existing?.storage_path) {
    try {
      await removeStoredObject(existing.storage_path);
    } catch {
      // continue — new upload will use a new path
    }
    await supabase.from('documents').delete().eq('id', existing.id);
  }

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, input.file, {
      contentType: input.file.type || 'application/octet-stream',
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from('documents')
    .insert({
      id: documentId,
      user_id: input.userId,
      applicant_id: applicantId,
      application_id: input.applicationId ?? null,
      document_type_id: typeId,
      file_name: safeName,
      storage_bucket: DOCUMENTS_BUCKET,
      storage_path: storagePath,
      mime_type: input.file.type || null,
      file_size_bytes: input.file.size,
      status: 'uploaded',
      metadata: { kind: input.kind },
    })
    .select(
      'id, user_id, applicant_id, application_id, document_type_id, file_name, storage_bucket, storage_path, mime_type, file_size_bytes, status, rejection_reason, metadata, created_at, updated_at, document_types ( slug )',
    )
    .single();

  if (insertError) {
    await removeStoredObject(storagePath);
    throw insertError;
  }

  const typeMap = await loadDocumentTypeIds();
  const typesById = new Map([...typeMap.entries()].map(([slug, id]) => [id, slug]));
  const [record] = mergeDocumentSlots([data as unknown as StoredDocumentRow], typesById);

  logAudit({
    actorUserId: input.userId,
    action: 'document.upload',
    detail: `${input.kind}:${documentId}`,
  });

  return { documentId, storagePath, record };
}

export async function createSignedDocumentUrl(documentId: string, expiresInSeconds = 120): Promise<string> {
  const { data: row, error } = await supabase
    .from('documents')
    .select('storage_bucket, storage_path, user_id')
    .eq('id', documentId)
    .maybeSingle();
  if (error) throw error;
  if (!row?.storage_path) throw new Error('Document not found.');

  const bucket = (row.storage_bucket as string) || DOCUMENTS_BUCKET;
  const { data: signed, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(row.storage_path as string, expiresInSeconds);
  if (signError) throw signError;
  if (!signed?.signedUrl) throw new Error('Could not create download link.');

  logAudit({
    actorUserId: row.user_id as string,
    action: 'document.download',
    detail: documentId,
  });

  return signed.signedUrl;
}

export async function linkDocumentsToApplication(
  applicationId: string,
  documentIds: string[],
): Promise<void> {
  const ids = [...new Set(documentIds.filter(Boolean))];
  if (!ids.length) return;
  const { error } = await supabase
    .from('documents')
    .update({ application_id: applicationId })
    .in('id', ids);
  if (error) throw error;
}

export async function markApplicantDocumentRequested(
  userId: string,
  kind: ApplicantDocumentKind,
  note?: string,
): Promise<void> {
  const applicantId = await getApplicantIdForUser(userId);
  const typeId = await typeIdForKind(kind);
  const existing = await findExistingForKind(applicantId, typeId);
  if (!existing) return;

  const { error } = await supabase
    .from('documents')
    .update({
      status: 'rejected',
      rejection_reason: note?.trim() || 'Please upload an updated document.',
    })
    .eq('id', existing.id);
  if (error) throw error;
}
