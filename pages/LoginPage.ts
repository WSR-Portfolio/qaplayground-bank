// LoginPage POM
//
// All POM classes are written before any test so that tests reference
// named methods rather than re-describing DOM interactions. A broken
// selector is fixed here once, not across multiple spec files.
//
// Selector strategy (priority: data-* → role → placeholder → id):
// All interactive elements on this page expose data-testid attributes
// except the error message div, which has only an id ("alert-message").
// The remember-me checkbox is a Radix UI component rendered as a
// <button role="checkbox"> — getByTestId is used rather than getByRole
// to avoid strict-mode violations from multiple role="checkbox" elements.
//
// Why loginAsAdmin / loginAsViewer are separate convenience methods:
// Most tests just need to be logged in as a specific role; they shouldn't
// have to know or repeat the env var names. The underlying login() method
// remains public for the auth tests that need to exercise the form directly
// (wrong credentials, empty fields, etc.).
//
// Why isErrorVisible() returns boolean rather than only getErrorMessage():
// Several auth tests need to assert that an error appeared without caring
// about the exact wording. A boolean method keeps those assertions to one
// line. getErrorMessage() is kept for the cases where the text matters.
//
// Why getErrorMessage returns string not string | null:
// POM methods should return predictable types. If the element is absent the
// fallback '' is an honest representation of "no text visible" and avoids
// forcing every caller to null-check a value they only read after
// isErrorVisible() confirms it is present.

import { type Page, type Locator } from '@playwright/test';

export default class LoginPage {
  readonly page: Page;

  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly rememberMeCheckbox: Locator;
  private readonly loginButton: Locator;
  private readonly clearButton: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput     = page.getByTestId('username-input');
    this.passwordInput     = page.getByTestId('password-input');
    // Radix UI checkbox rendered as <button role="checkbox">; data-testid
    // avoids a strict-mode violation from any other role="checkbox" on page.
    this.rememberMeCheckbox = page.getByTestId('remember-checkbox');
    this.loginButton       = page.getByTestId('login-button');
    this.clearButton       = page.getByTestId('clear-button');
    // No data-testid on the error element; id is the next most stable hook.
    this.errorMessage      = page.locator('#alert-message');
  }

  async goto(): Promise<void> {
    // page.goto('/') resolves against the origin, not the baseURL — it would
    // navigate to https://qaplayground.com rather than /bank. Use BASE_URL
    // directly so this works both locally and in CI.
    await this.page.goto(process.env.BASE_URL ?? 'https://qaplayground.com/bank');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginAsAdmin(): Promise<void> {
    await this.login(
      process.env.ADMIN_USERNAME ?? '',
      process.env.ADMIN_PASSWORD ?? '',
    );
  }

  async loginAsViewer(): Promise<void> {
    await this.login(
      process.env.VIEWER_USERNAME ?? '',
      process.env.VIEWER_PASSWORD ?? '',
    );
  }

  async checkRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.click();
  }

  async clearForm(): Promise<void> {
    await this.clearButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }

  async isErrorVisible(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }
}
