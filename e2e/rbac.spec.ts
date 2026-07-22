import { test, expect } from '@playwright/test';

test.describe('RBAC route guards', () => {
  test('unauthenticated user is redirected from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from admin pipeline', async ({ page }) => {
    await page.goto('/admin/applications');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from documents vault', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await expect(page).toHaveURL(/\/login/);
  });
});
