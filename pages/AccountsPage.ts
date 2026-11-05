// AccountsPage POM
//
// Covers the accounts list, the account detail page and the add-account dialog,
// which all belong to the same area of the app.

import { type Page, type Locator } from '@playwright/test';
import { chooseOption } from '../helpers/ui';
import { parseMoney } from '../helpers/testData';

export default class AccountsPage {
  readonly page: Page;
  readonly table: Locator;
  readonly rows: Locator;
  readonly names: Locator;
  readonly balances: Locator;
  readonly frozenBanner: Locator;
  readonly detailName: Locator;
  readonly detailType: Locator;
  readonly detailBalance: Locator;
  readonly detailPage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.getByTestId('accounts-table');
    this.rows = page.getByTestId('account-row');
    this.names = page.getByTestId('account-row-name');
    this.balances = page.getByTestId('account-row-balance');
    this.frozenBanner = page.getByTestId('frozen-account-banner');
    this.detailPage = page.getByTestId('account-detail-page');
    this.detailName = page.getByTestId('account-detail-name');
    this.detailType = page.getByTestId('account-detail-type-badge');
    this.detailBalance = page.getByTestId('account-detail-balance');
  }

  async goto(): Promise<void> {
    await this.page.goto('/bank/accounts');
    await this.rows.first().waitFor();
  }

  row(accountName: string): Locator {
    return this.rows.filter({ has: this.page.getByTestId('account-row-name').getByText(accountName, { exact: true }) });
  }

  async balanceOf(accountName: string): Promise<number> {
    return parseMoney(await this.row(accountName).getByTestId('account-row-balance').innerText());
  }

  async allBalances(): Promise<number[]> {
    return (await this.balances.allInnerTexts()).map(parseMoney);
  }

  async openDetail(accountName: string): Promise<void> {
    await this.row(accountName).getByTestId('view-account-btn').click();
    await this.detailName.waitFor();
  }

  async addAccount(name: string, type: 'Checking' | 'Savings' | 'Credit', startingBalance: string): Promise<void> {
    await this.page.getByTestId('add-account-btn').click();
    await this.page.getByTestId('account-form-name-input').fill(name);
    await chooseOption(this.page, this.page.getByTestId('account-form-type-select'), type);
    // The balance field has no data-testid; its name attribute is the next most stable hook.
    await this.page.locator('input[name="account_balance_field"]').fill(startingBalance);
    await this.page.getByTestId('account-form-accept-terms-checkbox').click();
    await this.page.getByTestId('save-account-form-btn').click();
    await this.page.getByTestId('add-account-dialog').waitFor({ state: 'hidden' });
  }
}
