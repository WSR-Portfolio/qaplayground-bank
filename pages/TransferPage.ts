// TransferPage POM
//
// The flow has three stages: form, confirm dialog, confirmation page. Balance
// rules are enforced when the dialog is confirmed, not at review, so
// submitForReview() and confirm() are separate steps.

import { type Page, type Locator } from '@playwright/test';
import { chooseOption, readOptions } from '../helpers/ui';

export default class TransferPage {
  readonly page: Page;
  readonly form: Locator;
  readonly fromSelect: Locator;
  readonly toSelect: Locator;
  readonly amountInput: Locator;
  readonly scheduledOption: Locator;
  readonly scheduledDateInput: Locator;
  readonly reviewButton: Locator;
  readonly confirmDialog: Locator;
  readonly confirmButton: Locator;
  readonly error: Locator;
  readonly successHeading: Locator;
  readonly reference: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId('transfer-form');
    this.fromSelect = page.getByTestId('transfer-from-select');
    this.toSelect = page.getByTestId('transfer-to-select');
    this.amountInput = page.getByTestId('transfer-amount-input');
    this.scheduledOption = page.getByTestId('date-type-scheduled');
    this.scheduledDateInput = page.getByTestId('transfer-scheduled-date-input');
    this.reviewButton = page.getByTestId('review-transfer-btn');
    this.confirmDialog = page.getByTestId('transfer-confirm-dialog');
    this.confirmButton = page.getByTestId('confirm-transfer-btn');
    this.error = page.getByTestId('transfer-error-message');
    this.successHeading = page.getByTestId('transfer-success-heading');
    this.reference = page.getByTestId('transfer-ref-id');
  }

  async goto(): Promise<void> {
    await this.page.goto('/bank/transfer');
    await this.form.waitFor();
  }

  async chooseFrom(account: string): Promise<void> {
    await chooseOption(this.page, this.fromSelect, new RegExp(account));
  }

  async toOptions(): Promise<string[]> {
    return readOptions(this.page, this.toSelect);
  }

  async fill(from: string, to: string, amount: string): Promise<void> {
    await this.chooseFrom(from);
    await chooseOption(this.page, this.toSelect, new RegExp(to));
    await this.amountInput.fill(amount);
  }

  async submitForReview(): Promise<void> {
    await this.reviewButton.click();
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }
}
