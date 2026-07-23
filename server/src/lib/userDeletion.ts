import type { SupabaseClient } from '@supabase/supabase-js';

const DOCUMENTS_BUCKET = 'documents';
const REMOVE_BATCH_SIZE = 100;

/**
 * Recursively collect object paths under a storage prefix.
 * Supabase folders appear as list entries without an `id`.
 */
async function listStoragePathsRecursive(
  service: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const paths: string[] = [];
  const queue = [prefix.replace(/^\/+|\/+$/g, '')];

  while (queue.length > 0) {
    const folder = queue.shift()!;
    const { data, error } = await service.storage.from(bucket).list(folder, {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) {
      // Empty / missing folder is fine — user may have no uploads.
      if (/not found|does not exist/i.test(error.message)) continue;
      throw new Error(`Failed to list storage folder "${folder || '/'}": ${error.message}`);
    }

    for (const item of data ?? []) {
      if (!item.name) continue;
      const fullPath = folder ? `${folder}/${item.name}` : item.name;
      // Supabase Storage: folders have null id; files have a uuid id.
      if (item.id == null) {
        queue.push(fullPath);
      } else {
        paths.push(fullPath);
      }
    }
  }

  return paths;
}

async function removeStoragePaths(service: SupabaseClient, bucket: string, paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  for (let i = 0; i < unique.length; i += REMOVE_BATCH_SIZE) {
    const chunk = unique.slice(i, i + REMOVE_BATCH_SIZE);
    const { error } = await service.storage.from(bucket).remove(chunk);
    if (error) {
      throw new Error(`Failed to remove storage objects: ${error.message}`);
    }
  }
}

/**
 * Delete every file owned by the user in the documents bucket via Storage API.
 * Uses document row paths plus a recursive prefix walk for orphans.
 */
export async function deleteUserDocumentFiles(
  service: SupabaseClient,
  userId: string,
): Promise<{ removedPaths: number }> {
  const pathSet = new Set<string>();

  const { data: docs, error: docsError } = await service
    .from('documents')
    .select('storage_path, storage_bucket')
    .eq('user_id', userId);

  if (docsError) {
    throw new Error(`Failed to load document paths: ${docsError.message}`);
  }

  for (const row of docs ?? []) {
    const path = typeof row.storage_path === 'string' ? row.storage_path.trim() : '';
    if (path) pathSet.add(path);
  }

  // Upload path convention: {user_id}/...
  const listed = await listStoragePathsRecursive(service, DOCUMENTS_BUCKET, userId);
  for (const path of listed) pathSet.add(path);

  await removeStoragePaths(service, DOCUMENTS_BUCKET, [...pathSet]);
  return { removedPaths: pathSet.size };
}

/**
 * Ordered user purge:
 * 1) Storage API file cleanup
 * 2) public.users (+ cascaded app rows)
 * 3) auth.users
 */
export async function purgeUserAccount(service: SupabaseClient, userId: string) {
  const storage = await deleteUserDocumentFiles(service, userId);

  // Explicit DB cleanup before auth delete so cascades run without the storage trigger.
  const { error: publicDeleteError } = await service.from('users').delete().eq('id', userId);
  if (publicDeleteError) {
    throw new Error(`Failed to delete public user records: ${publicDeleteError.message}`);
  }

  const { error: authError } = await service.auth.admin.deleteUser(userId);
  if (authError) {
    const { error: rpcError } = await service.rpc('admin_delete_user', { p_user_id: userId });
    if (rpcError) {
      throw new Error(authError.message || rpcError.message || 'Failed to delete auth user.');
    }
  }

  return { removedPaths: storage.removedPaths };
}
