import { test, expect } from '@playwright/test';
import { sanitizeStorageFileName } from '../client/src/lib/upload-path';

test.describe('Document storage helpers', () => {
  test('sanitizeStorageFileName strips path segments and unsafe characters', () => {
    expect(sanitizeStorageFileName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeStorageFileName('my resume (final).pdf')).toContain('.pdf');
    expect(sanitizeStorageFileName('evil.exe')).toBe('evil.exe');
  });
});
