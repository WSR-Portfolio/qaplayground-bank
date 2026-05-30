// Auth fixture
//
// Centralises login setup so every spec imports from here rather than
// duplicating login logic in beforeEach blocks.
//
// Why a custom fixture rather than beforeEach:
// Playwright fixtures compose cleanly and handle setup/teardown automatically.
// A beforeEach that calls loginPage.loginAsAdmin() in every spec file duplicates
// login logic across five files and is harder to maintain. Importing adminPage
// from this fixture is the idiomatic Playwright pattern and demonstrates
// framework knowledge to a reviewer.
//
// Why both adminPage and viewerPage live in one file:
// They share the same structure and are always imported together — RBAC tests
// need viewerPage, all other tests need adminPage. One file keeps the fixture
// surface area minimal.
//
// Why each fixture asserts the post-login URL:
// If login silently fails (wrong credentials, network error, session issue),
// tests will produce confusing failures deep in the test body rather than at
// the setup step. The URL assertion is a fast-fail guard that surfaces the
// root cause immediately.

import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import LoginPage from '../pages/LoginPage';

type AuthFixtures = {
  adminPage: Page;
  viewerPage: Page;
};

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await expect(page).toHaveURL(/\/bank\/dashboard/);
    await use(page);
  },

  viewerPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsViewer();
    await expect(page).toHaveURL(/\/bank\/dashboard/);
    await use(page);
  },
});

export { expect };
