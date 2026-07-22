import { test, expect } from '@playwright/test';

const applicantEmail = process.env.E2E_APPLICANT_EMAIL;
const applicantPassword = process.env.E2E_APPLICANT_PASSWORD;
const employerEmail = process.env.E2E_EMPLOYER_EMAIL;
const employerPassword = process.env.E2E_EMPLOYER_PASSWORD;
const catalogJobId = process.env.E2E_CATALOG_JOB_ID;

const hasApplicant = Boolean(applicantEmail && applicantPassword);
const hasEmployer = Boolean(employerEmail && employerPassword);
const hasFullFlow = hasApplicant && hasEmployer && catalogJobId;

test.describe('Staging jobs & applications path', () => {
  test.skip(!hasApplicant, 'Set E2E_APPLICANT_EMAIL and E2E_APPLICANT_PASSWORD for staging sign-off.');

  test('applicant can sign in and open applications list', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(applicantEmail!);
    await page.locator('#password').fill(applicantPassword!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/dashboard/applications');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test.skip(!hasFullFlow, 'Set E2E_EMPLOYER_* and E2E_CATALOG_JOB_ID for full apply/status flow.');

  test('employer can sign in and open employer dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(employerEmail!);
    await page.locator('#password').fill(employerPassword!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.goto('/dashboard/employer');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('applicant apply wizard loads for catalog job', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(applicantEmail!);
    await page.locator('#password').fill(applicantPassword!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.goto(`/apply/${catalogJobId}`);
    await expect(page.getByText(/step/i).first()).toBeVisible();
  });
});
