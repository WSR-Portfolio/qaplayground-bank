// DashboardPage POM

import { type Page, type Locator } from '@playwright/test';

export default class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly netWorth: Locator;
  readonly recentTransactions: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.getByTestId('dashboard-welcome-message');
    this.netWorth = page.getByTestId('stat-card-net-worth-value');
    this.recentTransactions = page.getByTestId('recent-txn-row');
    this.logoutButton = page.getByTestId('topbar-logout-btn');
  }

  async goto(): Promise<void> {
    await this.page.goto('/bank/dashboard');
  }
}
