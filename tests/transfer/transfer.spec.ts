// Transfer spec — IDs match SecureBank's /bank/test-cases catalogue.

import { test, expect } from '../../fixtures/auth';
import TransferPage from '../../pages/TransferPage';
import AccountsPage from '../../pages/AccountsPage';
import { ACCOUNTS, AMOUNT, FUTURE_DATE, OVER_BALANCE, PAST_DATE } from '../../helpers/testData';

test.describe('Transfer', () => {
  test('TC-XFER-001: form loads with from and to dropdowns', { annotation: { type: 'testId', description: 'TC-XFER-001' } }, async ({ standardPage }) => {
    const transfer = new TransferPage(standardPage);
    await transfer.goto();
    await expect(transfer.fromSelect).toBeVisible();
    await expect(transfer.toSelect).toBeVisible();
  });

  // The catalogue expects an error for matching accounts. The app prevents the
  // state instead: the To list leaves out the selected From account, and an
  // error can't be reached through the UI. This asserts the real safeguard.
  test('TC-XFER-002: the From account cannot also be chosen as To', { annotation: { type: 'testId', description: 'TC-XFER-002' } }, async ({ standardPage }) => {
    const transfer = new TransferPage(standardPage);
    await transfer.goto();
    await transfer.chooseFrom(ACCOUNTS.checking);

    const options = await transfer.toOptions();
    expect(options.join()).toContain(ACCOUNTS.savings);
    expect(options.join()).not.toContain(ACCOUNTS.checking);
  });

  test('TC-XFER-003: amount above balance is refused', { annotation: { type: 'testId', description: 'TC-XFER-003' } }, async ({ standardPage }) => {
    const transfer = new TransferPage(standardPage);
    await transfer.goto();
    await transfer.fill(ACCOUNTS.checking, ACCOUNTS.savings, OVER_BALANCE);
    await transfer.submitForReview();
    await transfer.confirm();
    await expect(transfer.error).toContainText('Insufficient funds');
    await expect(standardPage).toHaveURL(/\/bank\/transfer$/);
  });

  test('TC-XFER-004: successful transfer shows a confirmation page', { annotation: { type: 'testId', description: 'TC-XFER-004' } }, async ({ standardPage }) => {
    const transfer = new TransferPage(standardPage);
    await transfer.goto();
    await transfer.fill(ACCOUNTS.checking, ACCOUNTS.savings, String(AMOUNT.transfer));
    await transfer.submitForReview();
    await transfer.confirm();
    await expect(transfer.successHeading).toHaveText('Transfer Successful');
    await expect(transfer.reference).toContainText('TXN-');
  });

  test('TC-XFER-005: scheduled transfer requires a future date', { annotation: { type: 'testId', description: 'TC-XFER-005' } }, async ({ standardPage }) => {
    const transfer = new TransferPage(standardPage);
    await transfer.goto();
    await transfer.fill(ACCOUNTS.checking, ACCOUNTS.savings, String(AMOUNT.transfer));
    await transfer.scheduledOption.click();

    await transfer.submitForReview();
    await expect(transfer.error).toHaveText('Please select a transfer date.');

    await transfer.scheduledDateInput.fill(PAST_DATE);
    await transfer.submitForReview();
    await expect(transfer.error).toHaveText('Transfer date cannot be in the past.');

    await transfer.scheduledDateInput.fill(FUTURE_DATE);
    await transfer.submitForReview();
    await expect(transfer.confirmDialog).toBeVisible();
  });

  test('TC-XFER-006: balances update after a transfer', { annotation: { type: 'testId', description: 'TC-XFER-006' } }, async ({ standardPage }) => {
    const accounts = new AccountsPage(standardPage);
    await accounts.goto();
    const checking = await accounts.balanceOf(ACCOUNTS.checking);
    const savings = await accounts.balanceOf(ACCOUNTS.savings);

    const transfer = new TransferPage(standardPage);
    await transfer.goto();
    await transfer.fill(ACCOUNTS.checking, ACCOUNTS.savings, String(AMOUNT.transfer));
    await transfer.submitForReview();
    await transfer.confirm();
    await transfer.successHeading.waitFor();

    await accounts.goto();
    expect(await accounts.balanceOf(ACCOUNTS.checking)).toBe(checking - AMOUNT.transfer);
    expect(await accounts.balanceOf(ACCOUNTS.savings)).toBe(savings + AMOUNT.transfer);
  });
});
