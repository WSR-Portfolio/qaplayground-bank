// AccountsPage POM
//
// Built before any test so tests reference named methods.
//
// Selector notes from live DOM inspection:
// - The "Showing (Filtered)" stat card uses data-testid="summary-filtered-accounts"
//   and contains just the numeric count (e.g. "2"). The pagination-page-info element
//   contains the full "Showing 1–2 of 2" string. Both are available; each method
//   uses the right one for its purpose.
// - filter-type-select and sort-by-select are Radix UI <button> elements, not
//   native <select>s. Interaction requires clicking to open the listbox, then
//   clicking the desired option by its visible text.
// - rows-per-page-select follows the same Radix UI pattern.
// - Edit and Delete buttons per row use data-testids of the form
//   "edit-account-<id>" and "delete-account-<id>". They are scoped to
//   their parent row locator via .nth(index) to avoid dynamic-id fragility.
// - The account-name cell (data-testid="account-name") is shared across all rows
//   so row-level operations use the row locator as scope.
// - The open-wizard-button has zero layout dimensions at page load (parent header
//   collapses). scrollIntoViewIfNeeded() forces the browser to lay out its
//   ancestors and makes the click reliable.
//
// Why getShowingCount returns the full pagination string not just a number:
// The full string ("Showing 1–2 of 2") is what ACC-05 asserts — it conveys both
// the current page range and the total. Parsing it into parts would force
// assumptions about format; let the test do that if needed.
//
// Why getFilteredCount returns number not string:
// ACC-07 and ACC-08 use this value for direct numeric comparison (e.g. count
// dropped from 2 to 1 after filtering). The stat card text is already a plain
// integer string so parseInt is trivial and belongs here once, not in every test.
//
// Why inlineEditAccountName is a single atomic method:
// The double-click → clear → type → Enter sequence is always used as a unit.
// Exposing the steps separately would let tests leave the cell in edit mode if
// a step is skipped. One method ensures the edit is always completed cleanly.

import { type Page, type Locator } from '@playwright/test';
export { OpenAccountWizard } from './OpenAccountWizard';

export class AccountsPage {
  readonly page: Page;

  private readonly filteredCountSpan: Locator;
  private readonly pagingInfo: Locator;
  private readonly searchInput: Locator;
  private readonly filterTypeButton: Locator;
  private readonly sortByButton: Locator;
  private readonly resetFiltersButton: Locator;
  private readonly tableBody: Locator;
  private readonly tableRows: Locator;
  private readonly accountNameCells: Locator;
  private readonly accountTypeCells: Locator;
  private readonly deleteModal: Locator;
  private readonly confirmDeleteButton: Locator;
  private readonly cancelDeleteButton: Locator;
  private readonly rowsPerPageButton: Locator;
  private readonly openWizardButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.filteredCountSpan    = page.getByTestId('summary-filtered-accounts');
    this.pagingInfo           = page.getByTestId('pagination-page-info');
    this.searchInput          = page.getByTestId('search-input');
    this.filterTypeButton     = page.getByTestId('filter-type-select');
    this.sortByButton         = page.getByTestId('sort-by-select');
    this.resetFiltersButton   = page.getByTestId('reset-filters-button');
    this.tableBody            = page.getByTestId('accounts-tbody');
    // Rows use the dynamic-id prefix pattern; scoped to tbody to exclude TC accordion rows.
    this.tableRows            = page.locator('[data-testid^="account-row-"]');
    this.accountNameCells     = page.locator('[data-testid="account-name"]');
    this.accountTypeCells     = page.locator('[data-testid="account-type"]');
    this.deleteModal          = page.getByTestId('delete-modal');
    this.confirmDeleteButton  = page.getByTestId('confirm-delete-button');
    this.cancelDeleteButton   = page.getByTestId('cancel-delete-button');
    this.rowsPerPageButton    = page.getByTestId('rows-per-page-select');
    this.openWizardButton     = page.getByTestId('open-wizard-button');
  }

  async getShowingCount(): Promise<string> {
    return (await this.pagingInfo.textContent()) ?? '';
  }

  async searchFor(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }

  // Radix UI select: click to open the listbox, then click the matching option.
  async filterByType(type: string): Promise<void> {
    await this.filterTypeButton.click();
    await this.page.getByRole('option', { name: type }).click();
  }

  async sortBy(field: string): Promise<void> {
    await this.sortByButton.click();
    await this.page.getByRole('option', { name: field }).click();
  }

  async resetFilters(): Promise<void> {
    await this.resetFiltersButton.click();
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async getAccountNames(): Promise<string[]> {
    const count = await this.accountNameCells.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      names.push((await this.accountNameCells.nth(i).textContent()) ?? '');
    }
    return names;
  }

  async getAccountBalances(): Promise<string[]> {
    const cells = this.page.locator('[data-testid="account-balance"]');
    const count = await cells.count();
    const balances: string[] = [];
    for (let i = 0; i < count; i++) {
      balances.push((await cells.nth(i).textContent()) ?? '');
    }
    return balances;
  }

  async getAccountTypes(): Promise<string[]> {
    const count = await this.accountTypeCells.count();
    const types: string[] = [];
    for (let i = 0; i < count; i++) {
      types.push((await this.accountTypeCells.nth(i).textContent()) ?? '');
    }
    return types;
  }

  async clickEditOnRow(index: number): Promise<void> {
    const row = this.tableRows.nth(index);
    await row.locator('[data-testid^="edit-account-"]').click();
  }

  async clickDeleteOnRow(index: number): Promise<void> {
    const row = this.tableRows.nth(index);
    await row.locator('[data-testid^="delete-account-"]').click();
  }

  async confirmDeleteDialog(): Promise<void> {
    await this.confirmDeleteButton.click();
  }

  async cancelDeleteDialog(): Promise<void> {
    await this.cancelDeleteButton.click();
  }

  // Single atomic method — see design decision comment at top of file.
  // Double-click triggers inline edit mode (an <input> replaces the link text).
  // Pressing Enter saves and then navigates to the account detail page — callers
  // must navigate back to /bank/accounts and re-wait for rows before asserting.
  async inlineEditAccountName(index: number, newName: string): Promise<void> {
    const nameCell = this.accountNameCells.nth(index);
    await nameCell.dblclick();
    const inlineInput = nameCell.locator('input');
    await inlineInput.waitFor({ state: 'visible', timeout: 3000 });
    await inlineInput.clear();
    await inlineInput.fill(newName);
    await inlineInput.press('Enter');
  }

  async setRowsPerPage(value: number): Promise<void> {
    await this.rowsPerPageButton.click();
    // exact: true prevents "5" from matching "25" and "50" as substrings.
    await this.page.getByRole('option', { name: String(value), exact: true }).click();
  }

  async getFilteredCount(): Promise<number> {
    const text = (await this.filteredCountSpan.textContent()) ?? '0';
    return parseInt(text.trim(), 10);
  }

  // The open-wizard-button lives inside a header element that collapses to 0
  // height due to a CSS layout issue on the accounts page. scrollIntoViewIfNeeded
  // is not sufficient — the browser reports the element as not visible even after
  // scroll. JS dispatchEvent is the only reliable trigger for this button.
  // After dispatch, wait for the wizard step bar to confirm the modal opened.
  async openWizard(): Promise<void> {
    await this.page.evaluate(() => {
      const btn = document.querySelector('[data-testid="open-wizard-button"]') as HTMLElement;
      if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await this.page.waitForSelector('[data-testid="wizard-step-bar"]', { state: 'visible' });
  }
}
