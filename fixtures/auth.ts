// Auth fixtures
//
// One fixture per persona, so a test declares the account state it needs in its
// signature. Each browser context starts empty and the app keeps its state in
// localStorage, so every test gets freshly seeded data and tests cannot affect
// each other.
//
// Why each fixture asserts the post-login URL:
// A failed login should stop in setup with a clear error, not surface later as
// a confusing failure deep in the test body.

import { test as base, expect, type Page } from '@playwright/test';
import LoginPage from '../pages/LoginPage';
import { USERS } from '../helpers/testData';

type Persona = keyof typeof USERS;

async function loginAs(page: Page, persona: Persona): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(USERS[persona].username, USERS[persona].password);
  await expect(page).toHaveURL(/\/bank\/dashboard/);
}

type AuthFixtures = {
  standardPage: Page;
  frozenPage: Page;
  overdraftPage: Page;
  errorPage: Page;
};

export const test = base.extend<AuthFixtures>({
  standardPage: async ({ page }, use) => {
    await loginAs(page, 'standard');
    await use(page);
  },
  frozenPage: async ({ page }, use) => {
    await loginAs(page, 'frozen');
    await use(page);
  },
  overdraftPage: async ({ page }, use) => {
    await loginAs(page, 'overdraft');
    await use(page);
  },
  errorPage: async ({ page }, use) => {
    await loginAs(page, 'error');
    await use(page);
  },
});

export { expect };
