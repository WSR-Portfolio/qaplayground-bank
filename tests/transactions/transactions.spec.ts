// Transactions spec — IDs match SecureBank's /bank/test-cases catalogue.

import { test, expect } from '../../fixtures/auth';
import TransactionsPage from '../../pages/TransactionsPage';
import { ACCOUNTS } from '../../helpers/testData';

test.describe('Transactions', () => {
  test('TC-TXN-001: page loads and shows recent activity', { annotation: { type: 'testId', description: 'TC-TXN-001' } }, async ({ standardPage }) => {
    const transactions = new TransactionsPage(standardPage);
    await transactions.goto();
    await expect(transactions.table).toBeVisible();
    expect(await transactions.rows.count()).toBeGreaterThan(0);
  });

  test('TC-TXN-002: account filter shows only that account', { annotation: { type: 'testId', description: 'TC-TXN-002' } }, async ({ standardPage }) => {
    const transactions = new TransactionsPage(standardPage);
    await transactions.goto();
    await transactions.filterByAccount(ACCOUNTS.savings);
    await expect(transactions.rows.filter({ hasText: ACCOUNTS.checking })).toHaveCount(0);
    await expect(transactions.rows.filter({ hasText: ACCOUNTS.savings }).first()).toBeVisible();
  });

  test('TC-TXN-003: search filters the list', { annotation: { type: 'testId', description: 'TC-TXN-003' } }, async ({ standardPage }) => {
    const transactions = new TransactionsPage(standardPage);
    await transactions.goto();
    await transactions.searchInput.fill('Whole Foods');
    await expect(transactions.descriptions).toHaveText(['Whole Foods Market']);
  });

  test('TC-TXN-005: pagination moves between pages', { annotation: { type: 'testId', description: 'TC-TXN-005' } }, async ({ standardPage }) => {
    const transactions = new TransactionsPage(standardPage);
    await transactions.goto();
    await expect(transactions.paginationInfo).toContainText('Showing 1–10');
    await expect(transactions.previousButton).toBeDisabled();

    await transactions.nextButton.click();
    await expect(transactions.paginationInfo).toContainText('Showing 11–');
    await expect(transactions.previousButton).toBeEnabled();

    await transactions.previousButton.click();
    await expect(transactions.paginationInfo).toContainText('Showing 1–10');
  });
});
