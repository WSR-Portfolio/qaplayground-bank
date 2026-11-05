// Accounts spec — IDs match SecureBank's /bank/test-cases catalogue.

import { test, expect } from '../../fixtures/auth';
import AccountsPage from '../../pages/AccountsPage';
import { ACCOUNTS, parseMoney, unique } from '../../helpers/testData';

test.describe('Accounts', () => {
  test('TC-ACC-001: accounts page lists the user\'s accounts', { annotation: { type: 'testId', description: 'TC-ACC-001' } }, async ({ standardPage }) => {
    const accounts = new AccountsPage(standardPage);
    await accounts.goto();
    await expect(accounts.table).toBeVisible();
    await expect(accounts.row(ACCOUNTS.checking)).toBeVisible();
    await expect(accounts.row(ACCOUNTS.savings)).toBeVisible();
  });

  test('TC-ACC-002: account details show name, type and a masked number', { annotation: { type: 'testId', description: 'TC-ACC-002' } }, async ({ standardPage }) => {
    const accounts = new AccountsPage(standardPage);
    await accounts.goto();
    await accounts.openDetail(ACCOUNTS.checking);
    await expect(accounts.detailName).toHaveText(ACCOUNTS.checking);
    await expect(accounts.detailType).toHaveText('Checking');
    await expect(accounts.detailPage).toContainText(/\*{4}\d{4}/);
  });

  // The catalogue allows "a banner or indicator"; the app uses an Overdrawn status.
  test('TC-ACC-003: negative balance shows an Overdrawn indicator', { annotation: { type: 'testId', description: 'TC-ACC-003' } }, async ({ overdraftPage }) => {
    const accounts = new AccountsPage(overdraftPage);
    await accounts.goto();
    const row = accounts.row(ACCOUNTS.checking);
    await expect(row).toContainText('Overdrawn');
    expect(await accounts.balanceOf(ACCOUNTS.checking)).toBeLessThan(0);
  });

  test('TC-ACC-004: frozen account shows a prominent banner', { annotation: { type: 'testId', description: 'TC-ACC-004' } }, async ({ frozenPage }) => {
    const accounts = new AccountsPage(frozenPage);
    await accounts.goto();
    await expect(accounts.frozenBanner).toContainText('Account Frozen');
  });

  test('TC-ACC-006: user can add a savings account', { annotation: { type: 'testId', description: 'TC-ACC-006' } }, async ({ standardPage }) => {
    const accounts = new AccountsPage(standardPage);
    await accounts.goto();
    const before = await accounts.rows.count();
    const name = unique('Vacation Fund');

    await accounts.addAccount(name, 'Savings', '100');

    await expect(accounts.rows).toHaveCount(before + 1);
    await expect(accounts.row(name)).toContainText('Savings');
    expect(parseMoney(await accounts.row(name).getByTestId('account-row-balance').innerText())).toBe(100);
  });
});
