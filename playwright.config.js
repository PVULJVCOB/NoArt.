// Playwright configuration for running E2E tests against the static site served from root
/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  timeout: 30 * 1000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10 * 1000,
    navigationTimeout: 20 * 1000,
    baseURL: 'http://localhost:5000'
  },
  testDir: 'tests',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]]
};
