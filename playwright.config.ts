import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // 2 retries in CI absorbs transient network failures hitting the remote demo
  // site — timeouts on page.goto and auth redirects are environmental, not
  // test bugs. 0 retries locally keeps feedback immediate.
  retries: process.env.CI ? 2 : 0,

  // 1 worker in CI serialises requests to the remote demo site, preventing
  // rate-limiting and resource contention that caused intermittent page.goto
  // timeouts when multiple workers hit the site in parallel.
  workers: process.env.CI ? 1 : undefined,

  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,

  // 60 000 ms for CI — the fixture setup (goto + login + redirect) can consume
  // most of a 30 000 ms budget on the remote demo site, leaving the toHaveURL
  // assertion with no time remaining. 60s gives the full auth flow headroom.
  timeout: process.env.CI ? 60000 : 30000,

  // 15 000 ms for expect() assertions — the default 5 000 ms is too tight for
  // auth redirects on the remote demo site in CI.
  expect: { timeout: 15000 },

  reporter: 'html',

  use: {
    // SecureBank's demo logins are public, so no .env or secrets are needed.
    // BASE_URL can still be set to point the suite at another copy of the app.
    baseURL: process.env.BASE_URL ?? 'https://qaplayground.com/bank',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Design decision: Chromium only during the initial build phase.
    // Get all tests green here first; adding Firefox and WebKit is a
    // one-line change once the suite is stable.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
