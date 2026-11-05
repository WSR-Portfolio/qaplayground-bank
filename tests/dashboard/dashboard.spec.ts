// Dashboard spec — IDs match SecureBank's /bank/test-cases catalogue.

import { test, expect } from '../../fixtures/auth';
import DashboardPage from '../../pages/DashboardPage';
import AccountsPage from '../../pages/AccountsPage';
import { parseMoney, sum } from '../../helpers/testData';

test.describe('Dashboard', () => {
  test('TC-DASH-001: dashboard loads with a welcome message', { annotation: { type: 'testId', description: 'TC-DASH-001' } }, async ({ standardPage }) => {
    await expect(new DashboardPage(standardPage).welcomeMessage).toContainText('Welcome back');
  });

  test('TC-DASH-002: total balance equals the sum of account balances', { annotation: { type: 'testId', description: 'TC-DASH-002' } }, async ({ standardPage }) => {
    const total = parseMoney(await new DashboardPage(standardPage).netWorth.innerText());

    const accounts = new AccountsPage(standardPage);
    await accounts.goto();
    expect(total).toBe(sum(await accounts.allBalances()));
  });

  test('TC-DASH-003: recent transactions shows at most five rows', { annotation: { type: 'testId', description: 'TC-DASH-003' } }, async ({ standardPage }) => {
    const rows = new DashboardPage(standardPage).recentTransactions;
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeLessThanOrEqual(5);
  });
});
