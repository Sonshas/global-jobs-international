export function sanitizeStorageFileName(fileName: string): string {
  const base = fileName.replace(/\\/g, '/').split('/').pop() || 'file';
  const cleaned = base.replace(/[^\w.\-()+ ]/g, '_').slice(0, 120);
  return cleaned || 'file';
}
