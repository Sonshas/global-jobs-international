import { test, expect } from '@playwright/test';
import { DOCUMENT_KIND_TO_TYPE_SLUG } from '../client/src/lib/document-kinds';

test.describe('Document type mapping', () => {
  test('every applicant document kind maps to a document_types slug', () => {
    const kinds = Object.keys(DOCUMENT_KIND_TO_TYPE_SLUG);
    expect(kinds).toHaveLength(10);
    for (const kind of kinds) {
      const slug = DOCUMENT_KIND_TO_TYPE_SLUG[kind as keyof typeof DOCUMENT_KIND_TO_TYPE_SLUG];
      expect(slug).toBeTruthy();
      expect(slug).toMatch(/^[a-z0-9_]+$/);
    }
  });
});
