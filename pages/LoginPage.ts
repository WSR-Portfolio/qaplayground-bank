// LoginPage POM
//
// All selectors live in page objects so a broken one is fixed once, not across
// several spec files. login() stays public for the tests that exercise the form
// directly (wrong password, locked account, empty fields).

import { type Page, type Locator } from '@playwright/test';

export default class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByTestId('login-username-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-btn');
    this.errorMessage = page.getByTestId('login-error-message');
  }

  async goto(): Promise<void> {
    await this.page.goto('/bank/login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
