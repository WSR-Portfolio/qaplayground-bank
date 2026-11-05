// BillPayPage POM
//
// The biller field is a search box with a results list rather than a combobox,
// so it has its own methods instead of using chooseOption().

import { type Page, type Locator } from '@playwright/test';
import { chooseOption } from '../helpers/ui';

export default class BillPayPage {
  readonly page: Page;
  readonly form: Locator;
  readonly fromSelect: Locator;
  readonly billerSearch: Locator;
  readonly billerOptions: Locator;
  readonly amountInput: Locator;
  readonly reviewButton: Locator;
  readonly confirmSummary: Locator;
  readonly confirmButton: Locator;
  readonly error: Locator;
  readonly successHeading: Locator;
  readonly reference: Locator;
  readonly confirmedBiller: Locator;
  readonly addBillerDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId('bill-pay-form');
    this.fromSelect = page.getByTestId('bill-pay-from-select');
    this.billerSearch = page.getByTestId('biller-search-input');
    this.billerOptions = page.getByTestId('biller-option');
    this.amountInput = page.getByTestId('bill-amount-input');
    this.reviewButton = page.getByTestId('review-bill-btn');
    this.confirmSummary = page.getByTestId('bill-confirm-summary');
    this.confirmButton = page.getByTestId('confirm-bill-btn');
    this.error = page.getByTestId('bill-pay-error');
    this.successHeading = page.getByTestId('bill-pay-success-heading');
    this.reference = page.getByTestId('bill-pay-ref-id');
    this.confirmedBiller = page.getByTestId('confirm-biller');
    this.addBillerDialog = page.getByTestId('add-biller-dialog');
  }

  async goto(): Promise<void> {
    await this.page.goto('/bank/bill-pay');
    await this.form.waitFor();
  }

  async chooseAccount(account: string): Promise<void> {
    await chooseOption(this.page, this.fromSelect, new RegExp(account));
  }

  async chooseBiller(biller: string): Promise<void> {
    await this.billerSearch.click();
    await this.billerOptions.filter({ hasText: biller }).first().click();
  }

  async fill(account: string, biller: string, amount: string): Promise<void> {
    await this.chooseAccount(account);
    await this.chooseBiller(biller);
    await this.amountInput.fill(amount);
  }

  async addBiller(name: string, reference: string): Promise<void> {
    await this.page.getByTestId('add-biller-btn').click();
    await this.addBillerDialog.waitFor();
    await this.page.getByTestId('add-biller-name-input').fill(name);
    // The reference field has no data-testid; its name attribute is the next most stable hook.
    await this.page.locator('input[name="biller_ref_field"]').fill(reference);
    await this.page.getByTestId('save-add-biller-btn').click();
    await this.addBillerDialog.waitFor({ state: 'hidden' });
  }
}
