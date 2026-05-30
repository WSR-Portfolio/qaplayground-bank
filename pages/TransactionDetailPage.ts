// TransactionDetailPage POM
//
// Kept as a separate class from TransactionsPage so detail-page locator
// knowledge stays isolated and doesn't bleed into the transactions spec.
//
// Why a separate class:
// The detail page is a separate route (/bank/transactions/<id>) with its own DOM.
// Mixing its selectors into TransactionsPage would couple two pages in one class
// and scatter fixes across test files if the detail layout ever changes.
//
// TODO note (from prompt design decision — resolved by pre-test DOM inspection):
// The prompt originally called for a TODO warning that field names might need
// adjustment after seeing the real DOM. Pre-inspection confirmed that the detail
// page is fully instrumented with data-testid attributes matching the table
// column names exactly, so no adjustment was required. The original scaffolding
// concern is documented here for the audit trail.
//
// Selector notes from live DOM inspection:
// - All detail fields have data-testid attributes (transaction-detail-id,
//   -type, -amount, -datetime, -balance-after, -description).
// - The account field is a clickable link (data-testid="transaction-detail-account-link")
//   that navigates to the account detail page — getAccount() reads its text.
// - The breadcrumb nav has data-testid="breadcrumb"; individual crumb links are
//   data-testid="breadcrumb-item-1" (Dashboard), "breadcrumb-item-2" (Transactions),
//   "breadcrumb-item-3" (current TXN id, a <span> not a link).
// - Detail page URL pattern: /bank/transactions/<dynamic-id>
//   isOnDetailPage() matches any URL containing /bank/transactions/ with a
//   non-empty path segment after it, which is more robust than an exact match.

import { type Page, type Locator } from '@playwright/test';

export default class TransactionDetailPage {
  readonly page: Page;

  private readonly detailId: Locator;
  private readonly detailType: Locator;
  private readonly detailAmount: Locator;
  private readonly detailDatetime: Locator;
  private readonly detailAccountLink: Locator;
  private readonly detailBalanceAfter: Locator;
  private readonly detailDescription: Locator;
  private readonly breadcrumbTransactions: Locator;

  constructor(page: Page) {
    this.page = page;
    this.detailId               = page.getByTestId('transaction-detail-id');
    this.detailType             = page.getByTestId('transaction-detail-type');
    this.detailAmount           = page.getByTestId('transaction-detail-amount');
    this.detailDatetime         = page.getByTestId('transaction-detail-datetime');
    this.detailAccountLink      = page.getByTestId('transaction-detail-account-link');
    this.detailBalanceAfter     = page.getByTestId('transaction-detail-balance-after');
    this.detailDescription      = page.getByTestId('transaction-detail-description');
    // breadcrumb-item-2 is the "Transactions" link (item-1 is Dashboard, item-3 is current).
    this.breadcrumbTransactions = page.getByTestId('breadcrumb-item-2');
  }

  async getTransactionId(): Promise<string> {
    return (await this.detailId.textContent()) ?? '';
  }

  async getType(): Promise<string> {
    return (await this.detailType.textContent()) ?? '';
  }

  async getAccount(): Promise<string> {
    return (await this.detailAccountLink.textContent()) ?? '';
  }

  async getAmount(): Promise<string> {
    return (await this.detailAmount.textContent()) ?? '';
  }

  async getBalanceAfter(): Promise<string> {
    return (await this.detailBalanceAfter.textContent()) ?? '';
  }

  async getDescription(): Promise<string> {
    return (await this.detailDescription.textContent()) ?? '';
  }

  async clickBreadcrumbTransactions(): Promise<void> {
    await this.breadcrumbTransactions.click();
  }

  isOnDetailPage(): boolean {
    return /\/bank\/transactions\/.+/.test(this.page.url());
  }
}
