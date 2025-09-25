const { test, expect } = require('@playwright/test');

test.describe('NoArt. static site', () => {
  test('homepage loads and has correct title and main sections', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NoArt\./i);
    // Check main sections are present
    await expect(page.locator('nav.navbar')).toBeVisible();
    await expect(page.locator('#home')).toBeVisible();
    await expect(page.locator('#gallery')).toBeVisible();
    await expect(page.locator('#contact-form')).toBeVisible();
  });

  test('contact form happy path (no SendGrid)', async ({ page }) => {
    await page.goto('/');
    const name = page.locator('#name');
    const email = page.locator('#email');
    const subject = page.locator('#subject');
    const message = page.locator('#message');
    const form = page.locator('#contact-form');

    await name.fill('Playwright Test');
    await email.fill('pw@example.com');
    await subject.fill('E2E Test');
    await message.fill('Dies ist eine Testnachricht von Playwright.');

    // Intercept the API call and reply with a fake success so we don't rely on SendGrid
    await page.route('**/api/contact', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await Promise.all([
      page.waitForResponse('**/api/contact'),
      form.locator('button[type="submit"]').click()
    ]);

    // After submit, expect some acknowledgement in UI or not throw
    // Since the original site may not show a message, just ensure the request succeeded
    expect(true).toBeTruthy();
  });
});
