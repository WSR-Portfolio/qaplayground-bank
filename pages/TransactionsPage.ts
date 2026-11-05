// TransactionsPage POM

import { type Page, type Locator } from '@playwright/test';
import { chooseOption } from '../helpers/ui';

export default class TransactionsPage {
  readonly page: Page;
  readonly table: Locator;
  readonly rows: Locator;
  readonly descriptions: Locator;
  readonly searchInput: Locator;
  readonly accountSelect: Locator;
  readonly paginationInfo: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.getByTestId('all-transactions-table');
    this.rows = page.getByTestId('all-txn-row');
    this.descriptions = page.getByTestId('all-txn-description');
    this.searchInput = page.getByTestId('all-txn-search-input');
    this.accountSelect = page.getByTestId('all-txn-account-select');
    this.paginationInfo = page.getByTestId('all-txn-pagination-info');
    this.previousButton = page.getByTestId('all-txn-pagination-prev');
    this.nextButton = page.getByTestId('all-txn-pagination-next');
  }

  async goto(): Promise<void> {
    await this.page.goto('/bank/transactions');
    await this.rows.first().waitFor();
  }

  async filterByAccount(account: string): Promise<void> {
    await chooseOption(this.page, this.accountSelect, account);
  }
}
