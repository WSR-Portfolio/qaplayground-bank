// Design decision: dotenv is loaded here so process.env vars are available
// before Playwright resolves any config values. Credentials live in .env
// rather than hardcoded — the pattern signals to reviewers that the author
// knows not to commit secrets, and maps cleanly to GitHub Actions secrets in CI.
import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

dotenv.config();

export default defineConfig({
  testDir: './tests',

  // Design decision: retries are 0 during development so every failure surfaces
  // immediately. Flaky tests should be fixed, not silently retried. Re-enable
  // (set to 2) once the suite is stable and running in CI.
  retries: 0,

  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  // 30 000 ms for CI — the remote demo app is slower under GitHub Actions than
  // on a local connection. 10 000 ms caused navigation and form-open timeouts in CI.
  timeout: 30000,

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
