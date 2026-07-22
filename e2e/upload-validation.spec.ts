import { test, expect } from '@playwright/test';
import { validateSecureUpload } from '../client/src/lib/security';

function fileLike(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(Math.min(size, 64))], { type });
  return new File([blob], name, { type });
}

test.describe('Upload validation', () => {
  test('rejects oversize files', () => {
    const file = fileLike('big.pdf', 'application/pdf', 8 * 1024 * 1024 + 1);
    Object.defineProperty(file, 'size', { value: 8 * 1024 * 1024 + 1 });
    expect(validateSecureUpload(file)).toMatch(/too large/i);
  });

  test('rejects disallowed MIME types', () => {
    const file = fileLike('x.exe', 'application/x-msdownload', 100);
    expect(validateSecureUpload(file)).toMatch(/not allowed/i);
  });

  test('accepts PDF within size limit', () => {
    const file = fileLike('ok.pdf', 'application/pdf', 1024);
    Object.defineProperty(file, 'size', { value: 1024 });
    expect(validateSecureUpload(file)).toBeNull();
  });
});
