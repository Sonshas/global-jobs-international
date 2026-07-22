import { test, expect } from '@playwright/test';

test.describe('Marketing smoke', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Global Jobs International/i);
    await expect(page.getByRole('link', { name: /jobs/i }).first()).toBeVisible();
  });

  test('jobs browse loads', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
