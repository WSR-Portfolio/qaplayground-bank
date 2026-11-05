// SendMoneyPage POM

import { type Page, type Locator } from '@playwright/test';
import { chooseOption, readOptions } from '../helpers/ui';

export default class SendMoneyPage {
  readonly page: Page;
  readonly form: Locator;
  readonly fromSelect: Locator;
  readonly payeeSelect: Locator;
  readonly amountInput: Locator;
  readonly reviewButton: Locator;
  readonly confirmButton: Locator;
  readonly error: Locator;
  readonly frozenBanner: Locator;
  readonly successHeading: Locator;
  readonly reference: Locator;
  readonly payeeDialog: Locator;
  readonly payeeError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId('send-money-form');
    this.fromSelect = page.getByTestId('send-from-account-select');
    this.payeeSelect = page.getByTestId('payee-select');
    this.amountInput = page.getByTestId('send-amount-input');
    this.reviewButton = page.getByTestId('review-send-btn');
    this.confirmButton = page.getByTestId('confirm-send-btn');
    this.error = page.getByTestId('send-money-error');
    this.frozenBanner = page.getByTestId('send-money-frozen-banner');
    this.successHeading = page.getByTestId('send-success-heading');
    this.reference = page.getByTestId('send-ref-id');
    this.payeeDialog = page.getByTestId('add-payee-dialog');
    this.payeeError = page.getByTestId('add-payee-error-message');
  }

  async goto(): Promise<void> {
    await this.page.goto('/bank/send-money');
    await this.form.waitFor();
  }

  async fill(from: string, payee: string, amount: string): Promise<void> {
    await chooseOption(this.page, this.fromSelect, new RegExp(from));
    await chooseOption(this.page, this.payeeSelect, new RegExp(payee));
    await this.amountInput.fill(amount);
  }

  async payeeOptions(): Promise<string[]> {
    return readOptions(this.page, this.payeeSelect);
  }

  async openAddPayee(): Promise<void> {
    await this.page.getByTestId('add-payee-btn').click();
    await this.payeeDialog.waitFor();
  }

  async submitPayee(name: string, bank: string, routing: string, account: string): Promise<void> {
    await this.page.getByTestId('add-payee-name-input').fill(name);
    await this.page.getByTestId('add-payee-bank-input').fill(bank);
    await this.page.getByTestId('add-payee-routing-input').fill(routing);
    await this.page.getByTestId('add-payee-account-input').fill(account);
    await this.page.getByTestId('save-add-payee-btn').click();
  }
}
