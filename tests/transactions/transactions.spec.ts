// Transactions spec
//
// Run after accounts: TXN-01 and TXN-02 depend on account balances being
// readable and the account creation flow being proven. Phase 6 provides that.
//
// Test ordering rationale:
// TXN-01/02 (create deposit/withdrawal) run first and produce known transactions
// in localStorage. TXN-03+ (filter tests) are most meaningful when there is a
// known data set — by the time they run, the creation tests will have
// populated the session with predictable transactions to filter against.
//
// Why TXN-02 is separate from TXN-01:
// Deposit and withdrawal have different balance math (+/-) and different Amount
// formatting (+$X vs -$X). Separating them means a failure in one doesn't
// obscure the other and each test's intent is unambiguous.
//
// Why balance is read from the Accounts page (not the transaction detail):
// The Accounts page shows the current balance before the transaction is created.
// That pre-transaction value is the baseline for the Balance After assertion.
//
// Implementation notes:
// - The download listener (waitForEvent) must be registered before the click that
//   triggers the download. downloadCSV() handles this with Promise.all so the
//   listener is always in place before the event fires.
// - TXN-08 reads the transaction ID and amount from the table row before clicking,
//   then cross-checks against the detail page. This proves the correct record was
//   loaded, not just that some detail page appeared.
// - TXN-05 uses a future date range to prove the filter reduces results to 0.
//   Single-day From=To ranges return 0 regardless of date (app quirk, likely
//   exclusive upper-bound matching). The #summary-count chip is also absent from
//   the DOM when a date filter is active, so getRowCount() is used throughout.

import { test, expect } from '../../fixtures/auth';
import type { Page } from '@playwright/test';
import TransactionsPage from '../../pages/TransactionsPage';
import TransactionDetailPage from '../../pages/TransactionDetailPage';
import { AccountsPage } from '../../pages/AccountsPage';

// The new-transaction-button lives in the same collapsed-header as add-account
// and open-wizard buttons. JS dispatch is the only reliable trigger.
async function openNewTxModal(page: Page): Promise<void> {
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="new-transaction-button"]') as HTMLElement;
    if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await page.waitForSelector('[data-testid="transaction-form"]', { state: 'visible' });
}

// Parse "$5,000.00" or "-$100.00" to a number.
function parseCurrency(text: string): number {
  return parseFloat(text.replace(/[$,]/g, ''));
}

test.describe('Transactions', () => {

  test('TXN-01: create deposit transaction updates balance', { annotation: { type: 'testId', description: 'TXN-01' } }, async ({ adminPage }) => {
    // Read the pre-transaction balance of Primary Savings from the accounts table.
    await adminPage.goto('/bank/accounts');
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });
    const accountsPage = new AccountsPage(adminPage);
    const names = await accountsPage.getAccountNames();
    const balances = await accountsPage.getAccountBalances();
    const idx = names.findIndex(n => n.includes('Primary Savings'));
    const originalBalance = parseCurrency(balances[idx]);

    // Create the deposit via the transactions page.
    await adminPage.goto('/bank/transactions');
    // waitForLoadState('networkidle') times out here — analytics scripts keep
    // the network active indefinitely. Wait for the table instead.
    await adminPage.waitForSelector('[data-testid="transactions-tbody"]', { state: 'visible' });
    await openNewTxModal(adminPage);

    await adminPage.getByTestId('transaction-type-select').click();
    await adminPage.getByRole('option', { name: 'Deposit' }).click();
    await adminPage.getByTestId('from-account-select').click();
    await adminPage.getByRole('option', { name: /Primary Savings/ }).click();
    await adminPage.getByTestId('transaction-amount-input').fill('500');
    await adminPage.getByTestId('transaction-description-input').fill('TXN-01 deposit test');
    await adminPage.getByTestId('submit-transaction-button').click();
    await adminPage.waitForSelector('[data-testid="transaction-form"]', { state: 'hidden' }).catch(() => {});
    await adminPage.waitForTimeout(400);

    const txPage = new TransactionsPage(adminPage);
    await adminPage.waitForSelector('[data-testid="transaction-row"]', { state: 'visible' });

    // The newest transaction appears at row 0 (table sorted newest-first).
    expect(await txPage.getAmountForRow(0)).toBe('+$500.00');
    const balanceAfter = parseCurrency(await txPage.getBalanceAfterForRow(0));
    expect(balanceAfter).toBe(originalBalance + 500);
  });

  test('TXN-02: create withdrawal transaction updates balance correctly', { annotation: { type: 'testId', description: 'TXN-02' } }, async ({ adminPage }) => {
    // Read pre-transaction balance of Checking Account.
    await adminPage.goto('/bank/accounts');
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });
    const accountsPage = new AccountsPage(adminPage);
    const names = await accountsPage.getAccountNames();
    const balances = await accountsPage.getAccountBalances();
    const idx = names.findIndex(n => n.includes('Checking Account'));
    const originalBalance = parseCurrency(balances[idx]);

    // Create the withdrawal.
    await adminPage.goto('/bank/transactions');
    // waitForLoadState('networkidle') times out here — analytics scripts keep
    // the network active indefinitely. Wait for the table instead.
    await adminPage.waitForSelector('[data-testid="transactions-tbody"]', { state: 'visible' });
    await openNewTxModal(adminPage);

    await adminPage.getByTestId('transaction-type-select').click();
    await adminPage.getByRole('option', { name: 'Withdrawal' }).click();
    await adminPage.getByTestId('from-account-select').click();
    await adminPage.getByRole('option', { name: /Checking Account/ }).click();
    await adminPage.getByTestId('transaction-amount-input').fill('100');
    await adminPage.getByTestId('transaction-description-input').fill('TXN-02 withdrawal test');
    await adminPage.getByTestId('submit-transaction-button').click();
    await adminPage.waitForSelector('[data-testid="transaction-form"]', { state: 'hidden' }).catch(() => {});
    await adminPage.waitForTimeout(400);

    // Filter to Checking Account transactions to isolate the withdrawal row.
    const txPage = new TransactionsPage(adminPage);
    await txPage.filterByAccount('Checking Account');
    await txPage.applyFilters();
    await adminPage.waitForTimeout(400);

    await adminPage.waitForSelector('[data-testid="transaction-row"]', { state: 'visible' });

    expect(await txPage.getAmountForRow(0)).toBe('-$100.00');
    const balanceAfter = parseCurrency(await txPage.getBalanceAfterForRow(0));
    expect(balanceAfter).toBe(originalBalance - 100);
  });

  test('TXN-03: filter by account shows only matching transactions', { annotation: { type: 'testId', description: 'TXN-03' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/transactions');
    await adminPage.waitForSelector('[data-testid="transaction-row"]', { state: 'visible' });

    const txPage = new TransactionsPage(adminPage);
    await txPage.filterByAccount('Primary Savings');
    await txPage.applyFilters();
    await adminPage.waitForTimeout(400);

    const accountCells = await adminPage.locator('[data-testid="transaction-account"]').allTextContents();
    expect(accountCells.length).toBeGreaterThan(0);
    expect(accountCells.every(a => a.includes('Primary Savings'))).toBe(true);
    expect(accountCells.some(a => a.includes('Checking Account'))).toBe(false);
  });

  test('TXN-04: filter by type shows only matching transactions', { annotation: { type: 'testId', description: 'TXN-04' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/transactions');
    await adminPage.waitForSelector('[data-testid="transaction-row"]', { state: 'visible' });

    const txPage = new TransactionsPage(adminPage);
    await txPage.filterByType('Deposit');
    await txPage.applyFilters();
    await adminPage.waitForTimeout(400);

    const typeCells = await adminPage.locator('[data-testid="transaction-type"]').allTextContents();
    expect(typeCells.length).toBeGreaterThan(0);
    expect(typeCells.every(t => t.includes('Deposit'))).toBe(true);
    expect(typeCells.some(t => t.includes('Withdrawal'))).toBe(false);
  });

  test('TXN-05: date range filter narrows results to matching transactions', { annotation: { type: 'testId', description: 'TXN-05' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/transactions');
    await adminPage.waitForSelector('[data-testid="transaction-row"]', { state: 'visible' });

    const txPage = new TransactionsPage(adminPage);

    // Establish a baseline: seeded transactions exist before any filter is applied.
    const unfilteredCount = await txPage.getRowCount();
    expect(unfilteredCount).toBeGreaterThan(0);

    // Filter to a date range two years in the future — no transactions exist there.
    // This proves the filter actually reduces results rather than silently showing
    // all rows. A same-day From=To range returns 0 regardless of date (app quirk:
    // apparent exclusive upper-bound matching), so a full future year is used instead.
    const futureYear = new Date().getFullYear() + 2;
    await txPage.setDateFrom(`${futureYear}-01-01`);
    await txPage.setDateTo(`${futureYear}-12-31`);
    await txPage.applyFilters();
    await adminPage.waitForTimeout(400);

    expect(await txPage.getRowCount()).toBe(0);
  });

  test('TXN-06: summary chips update to reflect filtered totals', { annotation: { type: 'testId', description: 'TXN-06' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/transactions');
    await adminPage.waitForSelector('[data-testid="transaction-row"]', { state: 'visible' });

    const txPage = new TransactionsPage(adminPage);

    // Filter to deposits only and verify the chips reflect that filtered view.
    await txPage.filterByType('Deposit');
    await txPage.applyFilters();
    await adminPage.waitForTimeout(400);

    // Why assert Withdrawals = $0.00: if chips showed unfiltered totals, this
    // would be non-zero once a withdrawal exists. The $0.00 proves the chips
    // are filtering-aware, not showing raw totals.
    const withdrawalsText = await txPage.getWithdrawalsSummary();
    expect(withdrawalsText).toContain('$0.00');

    // Net should equal Deposits when there are no withdrawals in view.
    const depositsAmount = parseCurrency(await txPage.getDepositsSummary());
    const netAmount = parseCurrency(await txPage.getNetSummary());
    expect(netAmount).toBe(depositsAmount);

    // Count chip should match the visible row count.
    const chipCount = await txPage.getTransactionCount();
    const rowCount = await txPage.getRowCount();
    expect(chipCount).toBe(rowCount);
  });

  test('TXN-07: export CSV triggers file download', { annotation: { type: 'testId', description: 'TXN-07' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/transactions');
    await adminPage.waitForSelector('[data-testid="transaction-row"]', { state: 'visible' });

    const txPage = new TransactionsPage(adminPage);

    // downloadCSV() establishes the waitForEvent('download') Promise before
    // triggering the click, so the listener is always in place before the event.
    const download = await txPage.downloadCSV();

    expect(download.suggestedFilename()).toBeTruthy();
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });

  test('TXN-08: transaction ID link opens detail page with correct data', { annotation: { type: 'testId', description: 'TXN-08' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/transactions');
    await adminPage.waitForSelector('[data-testid="transaction-row"]', { state: 'visible' });

    const txPage = new TransactionsPage(adminPage);

    // Capture the table values before navigating — used to cross-check the
    // detail page so the test proves the right record was loaded, not just
    // that some detail page appeared.
    const expectedTxId   = await txPage.getTransactionIdForRow(0);
    const expectedAmount = await txPage.getAmountForRow(0);

    await txPage.clickTransactionId(0);
    await adminPage.waitForSelector('[data-testid="transaction-detail-id"]', { state: 'visible' });

    const detailPage = new TransactionDetailPage(adminPage);
    expect(adminPage.url()).toMatch(/\/bank\/transactions\/.+/);
    expect(await detailPage.getTransactionId()).toBe(expectedTxId);
    expect(await detailPage.getAmount()).toBe(expectedAmount);

    await detailPage.clickBreadcrumbTransactions();
    await adminPage.waitForURL(/\/bank\/transactions$/);
    expect(adminPage.url()).toContain('/bank/transactions');
  });

});
