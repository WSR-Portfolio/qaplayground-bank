// OpenAccountWizard POM
//
// Why a separate class rather than methods on AccountsPage:
// The 3-step wizard is a modal sub-flow with its own state. Mixing it into
// AccountsPage would make it unclear which methods belong to the main page vs
// the modal. A separate class is also reusable — any test that needs to create
// an account imports OpenAccountWizard directly.
//
// How the wizard is triggered:
// The "Open New Account" button (data-testid="open-wizard-button") has zero
// layout dimensions at page load due to a collapsed header element. Playwright's
// normal click() times out on it. AccountsPage.openWizard() works around this
// via JS dispatchEvent. The wizard itself (this class) assumes the modal is
// already open.
//
// Wizard step structure (from live DOM inspection):
//   Step 1 — Account Type:  choose Savings / Checking / Credit via type-card buttons
//   Step 2 — Account Details: fill name, initial deposit, status, overdraft
//   Step 3 — Review & Confirm: read-only summary; click "Confirm & Open Account"
//
// NOTE: step1 takes only accountType (the name field is on step 2, not step 1).
// Method signatures reflect the real wizard DOM rather than any external spec.
//
// Why getStepValidationError returns string:
// Consistent with the rest of the project — POM returns raw UI text; the test
// decides what to assert against it.

import { type Page, type Locator } from '@playwright/test';

export class OpenAccountWizard {
  private readonly page: Page;

  private readonly stepIndicator: Locator;
  private readonly nextButton: Locator;
  private readonly backButton: Locator;
  private readonly confirmButton: Locator;

  // Step 1 — type cards
  private readonly typeSavings: Locator;
  private readonly typeChecking: Locator;
  private readonly typeCredit: Locator;

  // Step 2 — details
  private readonly accountNameInput: Locator;
  private readonly initialDepositInput: Locator;

  // Step 3 — review
  private readonly reviewSummary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.stepIndicator      = page.getByTestId('wizard-step-indicator');
    this.nextButton         = page.getByTestId('wizard-next');
    this.backButton         = page.getByTestId('wizard-back');
    this.confirmButton      = page.getByTestId('wizard-confirm');
    this.typeSavings        = page.getByTestId('type-card-savings');
    this.typeChecking       = page.getByTestId('type-card-checking');
    this.typeCredit         = page.getByTestId('type-card-credit');
    this.accountNameInput   = page.getByTestId('wizard-account-name');
    this.initialDepositInput = page.getByTestId('wizard-initial-deposit');
    this.reviewSummary      = page.getByTestId('wizard-review-summary');
  }

  // Step 1: select account type and advance.
  // accountType accepts 'savings' | 'checking' | 'credit' (case-insensitive).
  async step1(accountType: string): Promise<void> {
    const type = accountType.toLowerCase();
    if (type === 'savings')       await this.typeSavings.click();
    else if (type === 'checking') await this.typeChecking.click();
    else if (type === 'credit')   await this.typeCredit.click();
    else throw new Error(`Unknown account type: "${accountType}"`);
    await this.nextButton.click();
  }

  // Step 2: fill account details and advance.
  async step2(accountName: string, initialDeposit: string): Promise<void> {
    await this.accountNameInput.fill(accountName);
    await this.initialDepositInput.fill(initialDeposit);
    await this.nextButton.click();
  }

  // Step 3: submit the review step.
  async step3(): Promise<void> {
    await this.confirmButton.click();
  }

  async getStepValidationError(): Promise<string> {
    // Validation errors appear inline near the invalid field; locate the first
    // visible error paragraph within the dialog.
    const error = this.page.locator('[role="dialog"] [id*="error"], [role="dialog"] p.text-red-500, [role="dialog"] p.text-destructive').first();
    return (await error.textContent()) ?? '';
  }

  async getStepText(): Promise<string> {
    return (await this.stepIndicator.textContent()) ?? '';
  }
}
