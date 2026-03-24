import { test, expect } from '@playwright/test';

test('sign up flow', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.getByText('Sign In')).toBeVisible();
  // Enter username
  await page.getByPlaceholder(/username/i).fill('TestCommander');
  await page.getByRole('button', { name: /sign in/i }).click();
  // Should redirect to home
  await expect(page).toHaveURL(/\/home/);
});

test('sign out flow', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByPlaceholder(/username/i).fill('TestCommander2');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/home/);
  // Navigate to settings
  await page.goto('/settings');
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/sign-in/);
});
