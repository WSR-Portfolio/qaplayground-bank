// Auth spec
//
// These are not in the site's test-case catalogue, which starts after login.
// They use the plain page fixture because logging in is what is under test.

import { test, expect } from '@playwright/test';
import LoginPage from '../../pages/LoginPage';
import DashboardPage from '../../pages/DashboardPage';
import { USERS } from '../../helpers/testData';

test.describe('Auth', () => {
  test('AUTH-01: valid credentials reach the dashboard', { annotation: { type: 'testId', description: 'AUTH-01' } }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(USERS.standard.username, USERS.standard.password);
    await expect(page).toHaveURL(/\/bank\/dashboard/);
    await expect(new DashboardPage(page).welcomeMessage).toContainText('Welcome back');
  });

  test('AUTH-02: wrong password shows an error and stays on login', { annotation: { type: 'testId', description: 'AUTH-02' } }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(USERS.standard.username, 'wrong_password');
    await expect(loginPage.errorMessage).toHaveText('The username or password you entered is incorrect.');
    await expect(page).toHaveURL(/\/bank\/login/);
  });

  test('AUTH-03: locked account is refused with a suspension message', { annotation: { type: 'testId', description: 'AUTH-03' } }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(USERS.locked.username, USERS.locked.password);
    await expect(loginPage.errorMessage).toContainText('suspended');
    await expect(page).toHaveURL(/\/bank\/login/);
  });

  test('AUTH-04: empty form asks for a username', { annotation: { type: 'testId', description: 'AUTH-04' } }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submitButton.click();
    await expect(loginPage.errorMessage).toHaveText('Please enter your username.');
  });

  test('AUTH-05: logout returns to login and blocks protected pages', { annotation: { type: 'testId', description: 'AUTH-05' } }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(USERS.standard.username, USERS.standard.password);
    const dashboard = new DashboardPage(page);
    await dashboard.logoutButton.click();
    await expect(page).toHaveURL(/\/bank\/login/);

    await dashboard.goto();
    await expect(page).toHaveURL(/\/bank\/login/);
  });

  test('AUTH-06: protected page redirects to login when logged out', { annotation: { type: 'testId', description: 'AUTH-06' } }, async ({ page }) => {
    await page.goto('/bank/accounts');
    await expect(page).toHaveURL(/\/bank\/login/);
    await expect(new LoginPage(page).usernameInput).toBeVisible();
  });
});
