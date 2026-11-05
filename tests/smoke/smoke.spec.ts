// Smoke spec
//
// SecureBank is a third-party demo that can change without notice; a rebuild
// once failed this whole suite as dozens of unrelated timeouts. This test checks
// the login form and dashboard contract, so a failure here means "the site
// changed" and should be read before any other result.

import { test, expect } from '@playwright/test';
import LoginPage from '../../pages/LoginPage';
import DashboardPage from '../../pages/DashboardPage';
import { USERS } from '../../helpers/testData';

test('SMOKE-01: login form and dashboard match what this suite expects', { annotation: { type: 'testId', description: 'SMOKE-01' } }, async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await expect(loginPage.usernameInput, 'login form changed: the site may have been rebuilt').toBeVisible();

  await loginPage.login(USERS.standard.username, USERS.standard.password);
  await expect(page, 'demo login rejected: published credentials may have changed').toHaveURL(/\/bank\/dashboard/);
  await expect(new DashboardPage(page).welcomeMessage, 'dashboard changed: the site may have been rebuilt').toBeVisible();
});
