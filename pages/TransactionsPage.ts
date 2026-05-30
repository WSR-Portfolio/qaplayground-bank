// TransactionsPage POM
//
// Built before any test so tests reference named methods.
//
// Selector notes from live DOM inspection:
// - Filter dropdowns (account, type) are Radix UI <button> elements — same
//   two-step click pattern as AccountsPage: open then click option by role.
// - Date pickers open a react-day-picker (rdp) calendar in a Radix popover.
//   The popover has data-testid="date-picker-calendar". Day cells are plain
//   <button> elements with no data-testid; navigation uses the rdp CSS classes
//   .rdp-button_previous and .rdp-button_next. The caption element
//   (.rdp-month_caption) exposes the current "Month YYYY" string.
// - Summary chips have no data-testid — they use stable id attributes:
//   #summary-deposits, #summary-withdrawals, #summary-net, #summary-count.
//   The inner <span> is used to avoid picking up the icon SVG text.
// - Transaction rows all share data-testid="transaction-row" (not dynamic IDs
//   like the accounts page). Cell-level testids are also shared across rows;
//   row-level methods scope to .nth(index) on the row locator first.
// - The export button has no label text — icon only. data-testid="export-button".
//
// Why date methods accept string (YYYY-MM-DD) not Date:
// The calendar's expected input format is confirmed only by running tests.
// Accepting a string defers formatting to helpers/testData.ts, where a
// formatting function can be added without touching this POM. A Date parameter
// would force format assumptions here that may be wrong.
//
// Why downloadCSV returns the Download object:
// POM methods must not assert. Returning the Download event lets the test
// decide what to check (filename, file size, content). The POM only handles
// the interaction mechanics.
//
// Why getTransactionCount parses to number:
// The summary chip text is "N transaction(s)" — the count is always used for
// numeric comparison in tests. Parsing once here avoids repeating the regex
// in every test that uses it.

import { type Page, type Locator, type Download } from '@playwright/test';

export default class TransactionsPage {
  readonly page: Page;

  private readonly filterAccountButton: Locator;
  private readonly filterTypeButton: Locator;
  private readonly dateFromButton: Locator;
  private readonly dateToButton: Locator;
  private readonly applyButton: Locator;
  private readonly resetButton: Locator;
  private readonly exportButton: Locator;
  private readonly depositsChip: Locator;
  private readonly withdrawalsChip: Locator;
  private readonly netChip: Locator;
  private readonly countChip: Locator;
  private readonly tableRows: Locator;
  private readonly amountCells: Locator;
  private readonly balanceAfterCells: Locator;
  private readonly txIdLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    this.filterAccountButton  = page.getByTestId('filter-account-select');
    this.filterTypeButton     = page.getByTestId('filter-transaction-type-select');
    this.dateFromButton       = page.getByTestId('date-from-input');
    this.dateToButton         = page.getByTestId('date-to-input');
    this.applyButton          = page.getByTestId('apply-filters-button');
    this.resetButton          = page.getByTestId('reset-filters-button');
    this.exportButton         = page.getByTestId('export-button');
    // No data-testid on chips; stable id attributes are the next best hook.
    this.depositsChip         = page.locator('#summary-deposits span');
    this.withdrawalsChip      = page.locator('#summary-withdrawals span');
    this.netChip              = page.locator('#summary-net span');
    this.countChip            = page.locator('#summary-count span');
    // Rows share a single testid (not dynamic per-row ids like AccountsPage).
    this.tableRows            = page.locator('[data-testid="transaction-row"]');
    this.amountCells          = page.locator('[data-testid="transaction-amount"]');
    this.balanceAfterCells    = page.locator('[data-testid="balance-after"]');
    this.txIdLinks            = page.locator('[data-testid="transaction-id-link"]');
  }

  async filterByAccount(accountName: string): Promise<void> {
    await this.filterAccountButton.click();
    await this.page.getByRole('option', { name: accountName }).click();
  }

  async filterByType(type: string): Promise<void> {
    await this.filterTypeButton.click();
    await this.page.getByRole('option', { name: type }).click();
  }

  // Open a date picker and navigate to the target month, then click the day.
  // date must be in YYYY-MM-DD format. Navigation uses rdp CSS class selectors
  // because the calendar provides no data-testid on nav buttons.
  private async setDate(pickerButton: Locator, date: string): Promise<void> {
    const [year, month, day] = date.split('-').map(Number);
    await pickerButton.click();

    const calendar = this.page.getByTestId('date-picker-calendar');
    // .first() — two-month layout renders two prev/next buttons; scope to the
    // first to avoid strict mode violations during month navigation.
    const prevBtn = calendar.locator('.rdp-button_previous').first();
    const nextBtn = calendar.locator('.rdp-button_next').first();

    // Navigate months until the caption shows the target month/year.
    for (let i = 0; i < 48; i++) {
      // .first() — the calendar can show two months side by side; read only
      // the first month's caption to determine the current navigation position.
      const caption = (await calendar.locator('.rdp-month_caption').first().textContent()) ?? '';
      const parts = caption.trim().split(' ');
      const captionMonth = new Date(`${parts[0]} 1 ${parts[1]}`).getMonth() + 1;
      const captionYear  = parseInt(parts[1], 10);

      if (captionYear === year && captionMonth === month) break;

      if (captionYear > year || (captionYear === year && captionMonth > month)) {
        await prevBtn.click();
      } else {
        await nextBtn.click();
      }
    }

    // Use data-day attribute for an exact match. Outside-month days share the
    // same text content and have no disabled/aria attributes to distinguish them
    // from current-month days — data-day ("M/D/YYYY") is the only reliable key.
    // YYYY-MM-DD → M/D/YYYY to match the calendar's data-day format.
    const [y, mo, d] = date.split('-').map(Number);
    const dataDay = `${mo}/${d}/${y}`;
    // The calendar can render two months side by side, producing two buttons
    // with the same data-day. Scope to the first month panel to stay unambiguous.
    await calendar.locator(`[data-day="${dataDay}"]`).first().click();
  }

  async setDateFrom(date: string): Promise<void> {
    await this.setDate(this.dateFromButton, date);
  }

  async setDateTo(date: string): Promise<void> {
    await this.setDate(this.dateToButton, date);
  }

  async applyFilters(): Promise<void> {
    await this.applyButton.click();
  }

  async resetFilters(): Promise<void> {
    await this.resetButton.click();
  }

  async getDepositsSummary(): Promise<string> {
    return (await this.depositsChip.textContent()) ?? '';
  }

  async getWithdrawalsSummary(): Promise<string> {
    return (await this.withdrawalsChip.textContent()) ?? '';
  }

  async getNetSummary(): Promise<string> {
    return (await this.netChip.textContent()) ?? '';
  }

  async getTransactionCount(): Promise<number> {
    const text = (await this.countChip.textContent()) ?? '0';
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async getTransactionIdForRow(index: number): Promise<string> {
    return (await this.txIdLinks.nth(index).textContent()) ?? '';
  }

  async getAmountForRow(index: number): Promise<string> {
    return (await this.amountCells.nth(index).textContent()) ?? '';
  }

  async getBalanceAfterForRow(index: number): Promise<string> {
    return (await this.balanceAfterCells.nth(index).textContent()) ?? '';
  }

  async clickTransactionId(index: number): Promise<void> {
    await this.txIdLinks.nth(index).click();
  }

  // The download listener must be registered before the click that triggers it;
  // page.waitForEvent returns a Promise that resolves when the event fires.
  // Tests that call this method should await it to get the Download object.
  async downloadCSV(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.exportButton.click(),
    ]);
    return download;
  }
}
