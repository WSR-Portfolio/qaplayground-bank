// Accounts spec
//
// Run before transactions: transaction tests depend on account creation working
// correctly (they read balances before/after transactions). ACC-01 confirms the
// table renders. ACC-02 (happy path) runs before ACC-03 (validation) — positive
// before negative is the consistent ordering across all modules.
//
// Why ACC-02 uses +1 rather than an exact count:
// The exact starting row count depends on localStorage state at test time.
// A relative assertion is robust regardless of seeded data.

import { test, expect } from '../../fixtures/auth';
import { AccountsPage, OpenAccountWizard } from '../../pages/AccountsPage';
import { makeAccountName } from '../../helpers/testData';

test.describe('Accounts', () => {

  test('ACC-01: accounts table renders with correct columns and data', { annotation: { type: 'testId', description: 'ACC-01' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/accounts');
    // Wait for rows to populate — waitForSelector on the table alone does not
    // guarantee the tbody has been filled by React yet.
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });

    await expect(adminPage.getByTestId('accounts-table')).toBeVisible();

    // Column headers — use role-based selectors since not all have data-testids.
    for (const header of ['Account Number', 'Account Name', 'Type', 'Balance', 'Status', 'Actions']) {
      await expect(adminPage.getByRole('columnheader', { name: header })).toBeVisible();
    }

    const accountsPage = new AccountsPage(adminPage);
    expect(await accountsPage.getRowCount()).toBeGreaterThan(0);
  });

  test('ACC-02: create new account via wizard — happy path', { annotation: { type: 'testId', description: 'ACC-02' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/accounts');
    // Wait for rows — the same pattern as ACC-01; tbody visible alone does not
    // guarantee rows have been populated by React yet.
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });

    const accountsPage = new AccountsPage(adminPage);
    const initialCount = await accountsPage.getRowCount();
    const newName = makeAccountName();

    await accountsPage.openWizard();
    const wizard = new OpenAccountWizard(adminPage);

    // step1 selects account type (wizard step 1 = type selection).
    // step2 takes name + deposit (wizard step 2 = account details).
    await wizard.step1('Savings');
    await wizard.step2(newName, '1000');
    await wizard.step3();

    // Wait for modal to close and table to refresh.
    await adminPage.waitForSelector('[data-testid="wizard-step-bar"]', { state: 'hidden' }).catch(() => {});
    await adminPage.waitForTimeout(500);

    expect(await accountsPage.getRowCount()).toBe(initialCount + 1);
    const names = await accountsPage.getAccountNames();
    expect(names.some(n => n.includes(newName))).toBe(true);
  });

  test('ACC-03: wizard step 2 validation prevents advancing with empty name', { annotation: { type: 'testId', description: 'ACC-03' } }, async ({ adminPage }) => {
    // NOTE: the test plan described "step 1 empty name" but the actual wizard
    // has the name field on step 2 (step 1 is account type selection only).
    // This test validates step 2: advance through step 1 normally, then try to
    // advance step 2 without entering a name.
    await adminPage.goto('/bank/accounts');
    await adminPage.waitForSelector('[data-testid="accounts-tbody"]', { state: 'visible' });

    const accountsPage = new AccountsPage(adminPage);
    const wizard = new OpenAccountWizard(adminPage);

    await accountsPage.openWizard();
    await wizard.step1('Savings'); // reach step 2

    // Click Next without filling the account name.
    await adminPage.getByTestId('wizard-next').click();

    const error = await wizard.getStepValidationError();
    expect(error).not.toBe('');
    // Confirm wizard has not advanced past step 2.
    await expect(adminPage.getByTestId('wizard-step-indicator')).toContainText('Step 2');
  });

  test('ACC-04: inline edit account name via double-click saves change', { annotation: { type: 'testId', description: 'ACC-04' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/accounts');
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });

    const accountsPage = new AccountsPage(adminPage);
    const names = await accountsPage.getAccountNames();
    const originalName = names[0];

    await accountsPage.inlineEditAccountName(0, 'Renamed Account');
    // Saving the inline edit (Enter) navigates to the account detail page.
    // Navigate back to the accounts list before reading updated names.
    await adminPage.goto('/bank/accounts');
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });

    // Assert by table membership, not by index — the sort order can shift after
    // a rename (e.g. "Renamed Account" moves alphabetically relative to other rows).
    const updatedNames = await accountsPage.getAccountNames();
    expect(updatedNames.some(n => n.includes('Renamed Account'))).toBe(true);

    // Cleanup: find the renamed row's new index and restore the original name.
    // Navigate back after cleanup rename for the same reason.
    const renamedIndex = updatedNames.findIndex(n => n.includes('Renamed Account'));
    await accountsPage.inlineEditAccountName(renamedIndex, originalName);
    await adminPage.goto('/bank/accounts');
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });
  });

  test('ACC-05: edit account via Edit button saves changes', { annotation: { type: 'testId', description: 'ACC-05' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/accounts');
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });

    const accountsPage = new AccountsPage(adminPage);
    const newName = makeAccountName();

    await accountsPage.clickEditOnRow(0);
    // Edit modal uses the same form as Add Account but pre-filled.
    await adminPage.waitForSelector('[data-testid="account-name-input"]', { state: 'visible' });
    await adminPage.getByTestId('account-name-input').clear();
    await adminPage.getByTestId('account-name-input').fill(newName);
    await adminPage.getByTestId('save-account-button').click();

    await adminPage.waitForSelector('[data-testid="account-name-input"]', { state: 'hidden' }).catch(() => {});
    await adminPage.waitForTimeout(300);

    const names = await accountsPage.getAccountNames();
    expect(names.some(n => n.includes(newName))).toBe(true);
    // Confirm no server-side error message appeared.
    await expect(adminPage.locator('#alert-message')).not.toBeVisible();
  });

  test('ACC-06: delete account with confirmation removes row from table', { annotation: { type: 'testId', description: 'ACC-06' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/accounts');
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });

    const accountsPage = new AccountsPage(adminPage);
    const wizard = new OpenAccountWizard(adminPage);

    // Create a throwaway account rather than deleting a seed account.
    // Deleting Primary Savings or Checking Account would break later tests
    // that filter/search by those names.
    const throwawayName = makeAccountName();
    await accountsPage.openWizard();
    await wizard.step1('Savings');
    await wizard.step2(throwawayName, '100');
    await wizard.step3();
    await adminPage.waitForSelector('[data-testid="wizard-step-bar"]', { state: 'hidden' }).catch(() => {});
    await adminPage.waitForTimeout(500);

    const countAfterCreate = await accountsPage.getRowCount();

    // Find the throwaway row by name and delete it.
    const names = await accountsPage.getAccountNames();
    const throwawayIndex = names.findIndex(n => n.includes(throwawayName));
    expect(throwawayIndex).toBeGreaterThanOrEqual(0);

    await accountsPage.clickDeleteOnRow(throwawayIndex);
    await accountsPage.confirmDeleteDialog();
    await adminPage.waitForTimeout(500);

    expect(await accountsPage.getRowCount()).toBe(countAfterCreate - 1);
    const namesAfter = await accountsPage.getAccountNames();
    expect(namesAfter.some(n => n.includes(throwawayName))).toBe(false);
  });

  test('ACC-07: search filter narrows results in real time', { annotation: { type: 'testId', description: 'ACC-07' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/accounts');
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });

    const accountsPage = new AccountsPage(adminPage);
    const allNames = await accountsPage.getAccountNames();
    const originalCount = allNames.length;
    const searchTerm = allNames[0].substring(0, 4);

    await accountsPage.searchFor(searchTerm);
    // Allow time for the reactive filter to update the table.
    await adminPage.waitForTimeout(400);

    const filteredCount = await accountsPage.getRowCount();
    expect(filteredCount).toBeLessThanOrEqual(originalCount);

    const filteredNames = await accountsPage.getAccountNames();
    expect(filteredNames.every(n => n.toLowerCase().includes(searchTerm.toLowerCase()))).toBe(true);
  });

  test('ACC-08: account type dropdown filters to matching type only', { annotation: { type: 'testId', description: 'ACC-08' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/accounts');
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });

    const accountsPage = new AccountsPage(adminPage);
    await accountsPage.filterByType('Savings');
    await adminPage.waitForTimeout(400);

    const types = await accountsPage.getAccountTypes();
    expect(types.length).toBeGreaterThan(0);
    expect(types.every(t => t.toLowerCase().includes('savings'))).toBe(true);
    expect(types.some(t => t.toLowerCase().includes('checking'))).toBe(false);
  });

  test('ACC-09: sort by balance ascending then descending', { annotation: { type: 'testId', description: 'ACC-09' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/accounts');
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });

    const accountsPage = new AccountsPage(adminPage);

    // Click the Balance column header to sort ascending.
    await adminPage.getByTestId('sort-balance-header').click();
    await adminPage.waitForTimeout(400);

    const parseBalances = async (): Promise<number[]> => {
      const raw = await accountsPage.getAccountBalances();
      return raw.map(b => parseFloat(b.replace(/[$,]/g, '')));
    };

    const ascending = await parseBalances();
    for (let i = 1; i < ascending.length; i++) {
      // Why read from UI rather than known values: balances change as transaction
      // tests run. Asserting numeric order is more robust than asserting values.
      expect(ascending[i]).toBeGreaterThanOrEqual(ascending[i - 1]);
    }

    // Click again to reverse to descending.
    await adminPage.getByTestId('sort-balance-header').click();
    await adminPage.waitForTimeout(400);

    const descending = await parseBalances();
    for (let i = 1; i < descending.length; i++) {
      expect(descending[i]).toBeLessThanOrEqual(descending[i - 1]);
    }
  });

  test('ACC-10: reset filters button clears all active filters', { annotation: { type: 'testId', description: 'ACC-10' } }, async ({ adminPage }) => {
    await adminPage.goto('/bank/accounts');
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });

    const accountsPage = new AccountsPage(adminPage);
    const totalCount = await accountsPage.getRowCount();

    // Apply a type filter and a search term to narrow the results.
    await accountsPage.filterByType('Savings');
    await accountsPage.searchFor('Primary');
    await adminPage.waitForTimeout(400);

    expect(await accountsPage.getRowCount()).toBeLessThanOrEqual(totalCount);

    await accountsPage.resetFilters();
    await adminPage.waitForTimeout(400);

    await expect(adminPage.getByTestId('search-input')).toHaveValue('');
    await expect(adminPage.getByTestId('filter-type-select')).toContainText('All Types');
    expect(await accountsPage.getRowCount()).toBe(totalCount);
  });

  test('ACC-11: rows per page selector changes visible row count', { annotation: { type: 'testId', description: 'ACC-11' } }, async ({ adminPage }) => {
    // Create 4 throwaway accounts to guarantee more than 5 total exist,
    // regardless of what prior tests created or deleted.
    await adminPage.goto('/bank/accounts');
    await adminPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });

    const accountsPage = new AccountsPage(adminPage);
    const wizard = new OpenAccountWizard(adminPage);

    for (let i = 0; i < 4; i++) {
      await accountsPage.openWizard();
      await wizard.step1('Savings');
      await wizard.step2(makeAccountName(), '50');
      await wizard.step3();
      await adminPage.waitForSelector('[data-testid="wizard-step-bar"]', { state: 'hidden' }).catch(() => {});
      await adminPage.waitForTimeout(300);
    }

    const totalCount = await accountsPage.getRowCount();
    expect(totalCount).toBeGreaterThan(5);

    await accountsPage.setRowsPerPage(5);
    await adminPage.waitForTimeout(400);

    expect(await accountsPage.getRowCount()).toBe(5);
    // Pagination should show more than page 1 when rows are capped at 5.
    await expect(adminPage.locator('[data-testid^="pagination-page-"]').nth(1)).toBeVisible();

    // TODO: delete the 4 throwaway accounts as cleanup. Deferred — a delete-by-name
    // loop would add meaningful complexity for a low-risk side effect.
  });

});
