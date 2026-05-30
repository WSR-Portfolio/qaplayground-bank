// DashboardPage POM
//
// Built before any test so that tests reference named methods rather than
// inline selectors or DOM descriptions.
//
// Selector notes from live DOM inspection:
// - Stat card values have dedicated data-testid attributes ("total-balance",
//   "accounts-count", "transactions-count") separate from their card containers.
// - Quick Action elements are <a> tags, not <button> — click() still works.
// - Draggable account cards use data-testids of the form
//   "draggable-account-<dynamic-id>". The [data-testid^="draggable-account-"]
//   prefix pattern is used to match all of them without hardcoding the dynamic
//   portion of the id.
// - Account names inside pinned cards have an id prefix "pinned-account-name-"
//   but no data-testid. The id prefix pattern is more stable than the class
//   name ("font-semibold truncate") which could change with restyling.
// - Transaction rows have a data-transaction-id attribute but no data-testid;
//   rows are selected as <tr> children of the [data-testid="transactions-tbody"].
//
// Why stat card methods return string not number:
// POM classes model the UI, not interpret it. Parsing "$375.00" to 375 is
// test logic that belongs in the test (DASH-02), where the assertion intent
// is explicit. Keeping it a string also avoids locale / currency assumptions
// in the POM layer.
//
// Why getRecentTransactionCount() returns number:
// DASH-05 uses this value purely as a before/after comparison (count went from
// N to N+1). Returning a number avoids a parseInt/parseFloat call in every
// test that uses it for arithmetic. No currency or formatting is involved.
//
// Why dragPinnedAccount is encapsulated here:
// Playwright drag-and-drop with small targets often requires non-obvious mouse
// event sequencing. Keeping it in the POM means the test reads a single method
// call. If the implementation needs to switch from dragTo() to explicit
// mouse.move/down/up choreography, it changes in one place.

import { type Page, type Locator } from '@playwright/test';

export default class DashboardPage {
  readonly page: Page;

  private readonly totalBalance: Locator;
  private readonly activeAccountsCount: Locator;
  private readonly totalTransactionsCount: Locator;
  private readonly addAccountLink: Locator;
  private readonly newTransactionLink: Locator;
  private readonly viewAllAccountsLink: Locator;
  private readonly pinnedCards: Locator;
  private readonly pinnedAccountNames: Locator;
  private readonly transactionRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.totalBalance            = page.getByTestId('total-balance');
    this.activeAccountsCount     = page.getByTestId('accounts-count');
    this.totalTransactionsCount  = page.getByTestId('transactions-count');
    this.addAccountLink          = page.getByTestId('quick-add-account');
    this.newTransactionLink      = page.getByTestId('quick-new-transaction');
    this.viewAllAccountsLink     = page.getByTestId('quick-view-accounts');
    // Prefix pattern covers all dynamic draggable-account-<id> testids.
    this.pinnedCards             = page.locator('[data-testid^="draggable-account-"]');
    // id prefix pattern — more stable than the class name on the inner <p>.
    this.pinnedAccountNames      = page.locator('[id^="pinned-account-name-"]');
    this.transactionRows         = page.locator('[data-testid="transactions-tbody"] tr');
  }

  async getTotalBalance(): Promise<string> {
    return (await this.totalBalance.textContent()) ?? '';
  }

  async getActiveAccountsCount(): Promise<string> {
    return (await this.activeAccountsCount.textContent()) ?? '';
  }

  async getTotalTransactionsCount(): Promise<string> {
    return (await this.totalTransactionsCount.textContent()) ?? '';
  }

  async clickAddAccount(): Promise<void> {
    await this.addAccountLink.click();
  }

  async clickNewTransaction(): Promise<void> {
    await this.newTransactionLink.click();
  }

  async clickViewAllAccounts(): Promise<void> {
    await this.viewAllAccountsLink.click();
  }

  async getPinnedAccountNames(): Promise<string[]> {
    const count = await this.pinnedAccountNames.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      names.push((await this.pinnedAccountNames.nth(i).textContent()) ?? '');
    }
    return names;
  }

  async dragPinnedAccount(fromIndex: number, toIndex: number): Promise<void> {
    const source = this.pinnedCards.nth(fromIndex);
    const target = this.pinnedCards.nth(toIndex);
    // dragTo() is the idiomatic Playwright approach. If the drag target proves
    // too small for reliable hit detection, replace with explicit
    // mouse.move / mouse.down / mouse.move / mouse.up choreography.
    await source.dragTo(target);
  }

  getRecentTransactionRows(): Locator {
    return this.transactionRows;
  }

  async getRecentTransactionCount(): Promise<number> {
    return this.transactionRows.count();
  }
}
