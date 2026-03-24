import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByPlaceholder(/username/i).fill('E2ETestUser');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/home/);
});

test('create campaign', async ({ page }) => {
  await page.goto('/create-campaign');
  await page.getByPlaceholder(/campaign name/i).fill('E2E Test Campaign');
  await page.getByPlaceholder(/commander name/i).fill('E2E Commander');
  // Select a faction (click on one)
  await page.locator('[data-faction-id]').first().click();
  await page.getByRole('button', { name: /create/i }).click();
  // Should redirect to active campaign
  await expect(page).toHaveURL(/\/campaign\/active/);
});

test('navigation tabs work', async ({ page }) => {
  // Test bottom nav
  await page.goto('/home');
  await page.getByText('Codex').click();
  await expect(page).toHaveURL(/\/codex/);
  await page.getByText('Rules').click();
  await expect(page).toHaveURL(/\/rules/);
});
