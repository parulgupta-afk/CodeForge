import { test, expect } from '@playwright/test';

async function skipIntro(page: import('@playwright/test').Page) {
  const skip = page.getByRole('button', { name: /skip/i }).first();
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
  }
}

test.describe('Portfolio smoke', () => {
  test('home page loads hero', async ({ page }) => {
    await page.goto('/');
    await skipIntro(page);
    await expect(page.getByRole('heading', { name: /Parul Gupta/i }).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('recruiter path: summary and projects', async ({ page }) => {
    await page.goto('/');
    await skipIntro(page);
    await expect(page.locator('#summary')).toBeVisible();
    await expect(page.locator('#projects')).toBeVisible();
  });

  test('navigation to projects section', async ({ page }) => {
    await page.goto('/');
    await skipIntro(page);
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await expect(page.getByText(/Priceloop|PriceLoop/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('project modal opens and closes', async ({ page }) => {
    await page.goto('/');
    await skipIntro(page);
    await page
      .locator('#projects button')
      .filter({ hasText: /Priceloop|PriceLoop/i })
      .first()
      .click();
    await expect(page.getByText(/FastAPI|price|track/i).first()).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
  });

  test('command center opens with Control+K', async ({ page }) => {
    await page.goto('/');
    await skipIntro(page);
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/Search portfolio/i)).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
  });

  test('whoami command navigates', async ({ page }) => {
    await page.goto('/');
    await skipIntro(page);
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder(/Search portfolio/i).fill('whoami');
    await page.keyboard.press('Enter');
    await expect(page.locator('#about')).toBeVisible({ timeout: 5000 });
  });

  test('sudo inspect parul opens recruiter', async ({ page }) => {
    await page.goto('/');
    await skipIntro(page);
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder(/Search portfolio/i).fill('sudo inspect');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  });

  test('trace codeforge works', async ({ page }) => {
    await page.goto('/');
    await skipIntro(page);
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder(/Search portfolio/i).fill('trace codeforge');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  });

  test('open resume command', async ({ page }) => {
    await page.goto('/');
    await skipIntro(page);
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder(/Search portfolio/i).fill('open resume');
    await page.keyboard.press('Enter');
    await expect(page.locator('#resume')).toBeVisible({ timeout: 5000 });
  });

  test('contact section reachable', async ({ page }) => {
    await page.goto('/');
    await skipIntro(page);
    await page.locator('#connect').first().scrollIntoViewIfNeeded();
    await expect(page.locator('#connect').first()).toBeVisible();
  });

  test('mobile viewport does not overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await skipIntro(page);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('reduced motion does not break UI', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await skipIntro(page);
    await expect(page.getByRole('heading', { name: /Parul Gupta/i }).first()).toBeVisible({
      timeout: 15000,
    });
  });
});
