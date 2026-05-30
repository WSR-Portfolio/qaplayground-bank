// Design decision: dotenv is loaded here so process.env vars are available
// before Playwright resolves any config values. Credentials live in .env
// rather than hardcoded — the pattern signals to reviewers that the author
// knows not to commit secrets, and maps cleanly to GitHub Actions secrets in CI.
import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

dotenv.config();

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
    // Design decision: baseURL is read from .env so the same config works
    // locally and in CI without code changes.
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
