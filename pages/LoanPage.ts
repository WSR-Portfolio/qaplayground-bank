// LoanPage POM
//
// The history total counts only active and pending loans, so it is not simply
// the sum of the visible rows. Tests compare it before and after an application.

import { type Page, type Locator } from '@playwright/test';
import { chooseOption } from '../helpers/ui';
import { parseMoney } from '../helpers/testData';

export default class LoanPage {
  readonly page: Page;
  readonly openButton: Locator;
  readonly frozenBanner: Locator;
  readonly dialog: Locator;
  readonly typeSelect: Locator;
  readonly amountInput: Locator;
  readonly termSelect: Locator;
  readonly rateInput: Locator;
  readonly accountSelect: Locator;
  readonly purposeInput: Locator;
  readonly reviewButton: Locator;
  readonly confirmButton: Locator;
  readonly error: Locator;
  readonly successHeading: Locator;
  readonly reference: Locator;
  readonly historyReferences: Locator;
  readonly total: Locator;

  constructor(page: Page) {
    this.page = page;
    this.openButton = page.getByTestId('open-apply-loan-btn');
    this.frozenBanner = page.getByTestId('apply-loan-frozen-banner');
    this.dialog = page.getByTestId('apply-loan-dialog');
    this.typeSelect = page.getByTestId('loan-type-select');
    this.amountInput = page.getByTestId('loan-amount-input');
    this.termSelect = page.getByTestId('loan-term-select');
    this.rateInput = page.getByTestId('loan-interest-rate-input');
    this.accountSelect = page.getByTestId('loan-account-select');
    // The purpose field has no data-testid; it is the form's only textarea.
    this.purposeInput = page.getByTestId('apply-loan-form').locator('textarea');
    this.reviewButton = page.getByTestId('review-loan-btn');
    this.confirmButton = page.getByTestId('confirm-loan-btn');
    this.error = page.getByTestId('apply-loan-error-message');
    this.successHeading = page.getByTestId('loan-success-heading');
    this.reference = page.getByTestId('loan-ref-id');
    this.historyReferences = page.getByTestId('loan-history-table');
    this.total = page.getByTestId('loan-history-total-value');
  }

  async goto(): Promise<void> {
    await this.page.goto('/bank/apply-loan');
    await this.openButton.waitFor();
  }

  async open(): Promise<void> {
    await this.openButton.click();
    await this.dialog.waitFor();
  }

  async fill(amount: string, account: string, purpose: string): Promise<void> {
    await chooseOption(this.page, this.typeSelect, 'Personal');
    await this.amountInput.fill(amount);
    await chooseOption(this.page, this.accountSelect, new RegExp(account));
    await this.purposeInput.fill(purpose);
  }

  async apply(amount: string, account: string, purpose: string): Promise<void> {
    await this.open();
    await this.fill(amount, account, purpose);
    await this.reviewButton.click();
    await this.confirmButton.click();
    await this.successHeading.waitFor();
  }

  async totalValue(): Promise<number> {
    return parseMoney(await this.total.innerText());
  }
}
