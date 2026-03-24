import { test, expect } from '@playwright/test';

test('core rules browsable', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByPlaceholder(/username/i).fill('RulesTestUser');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.goto('/rules');
  await expect(page.getByText('Core Rules')).toBeVisible();
});

test('codex shows factions', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByPlaceholder(/username/i).fill('CodexTestUser');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.goto('/codex');
  await expect(page.getByText(/Space Marines/i)).toBeVisible();
  await expect(page.getByText(/Orks/i)).toBeVisible();
});
