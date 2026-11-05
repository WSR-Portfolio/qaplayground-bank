// Send Money spec — IDs match SecureBank's /bank/test-cases catalogue.

import { test, expect } from '../../fixtures/auth';
import SendMoneyPage from '../../pages/SendMoneyPage';
import AccountsPage from '../../pages/AccountsPage';
import { ACCOUNTS, AMOUNT, OVER_BALANCE, unique } from '../../helpers/testData';

const PAYEE = 'Rahul Sharma';
const VALID_ROUTING = '021000021';
const VALID_ACCOUNT = '123456789';

test.describe('Send Money', () => {
  test('TC-SEND-001: form loads with payee options', { annotation: { type: 'testId', description: 'TC-SEND-001' } }, async ({ standardPage }) => {
    const send = new SendMoneyPage(standardPage);
    await send.goto();
    expect((await send.payeeOptions()).join()).toContain(PAYEE);
  });

  test('TC-SEND-002: invalid routing and account numbers are rejected', { annotation: { type: 'testId', description: 'TC-SEND-002' } }, async ({ standardPage }) => {
    const send = new SendMoneyPage(standardPage);
    await send.goto();
    await send.openAddPayee();

    await send.submitPayee('Test Payee', 'Test Bank', '123', VALID_ACCOUNT);
    await expect(send.payeeError).toHaveText('Routing number must be exactly 9 digits.');

    await send.submitPayee('Test Payee', 'Test Bank', VALID_ROUTING, '12');
    await expect(send.payeeError).toHaveText('Account number must be 8–17 digits.');
    await expect(send.payeeDialog).toBeVisible();
  });

  test('TC-SEND-003: successful payment shows a confirmation and debits the account', { annotation: { type: 'testId', description: 'TC-SEND-003' } }, async ({ standardPage }) => {
    const accounts = new AccountsPage(standardPage);
    await accounts.goto();
    const before = await accounts.balanceOf(ACCOUNTS.checking);

    const send = new SendMoneyPage(standardPage);
    await send.goto();
    await send.fill(ACCOUNTS.checking, PAYEE, String(AMOUNT.send));
    await send.reviewButton.click();
    await send.confirmButton.click();
    await expect(send.successHeading).toHaveText('Money Sent Successfully');
    await expect(send.reference).toContainText('SND-');

    await accounts.goto();
    expect(await accounts.balanceOf(ACCOUNTS.checking)).toBe(before - AMOUNT.send);
  });

  // The catalogue mentions a save checkbox, but the dialog has none: every payee
  // added is saved. This asserts the outcome, including that it survives a reload.
  test('TC-SEND-004: a new payee is saved for future payments', { annotation: { type: 'testId', description: 'TC-SEND-004' } }, async ({ standardPage }) => {
    const send = new SendMoneyPage(standardPage);
    await send.goto();
    const name = unique('Test Payee');
    await send.openAddPayee();
    await send.submitPayee(name, 'Test Bank', VALID_ROUTING, VALID_ACCOUNT);
    await send.payeeDialog.waitFor({ state: 'hidden' });

    await send.goto();
    expect((await send.payeeOptions()).join()).toContain(name);
  });

  test('TC-SEND-005: amount above balance is refused', { annotation: { type: 'testId', description: 'TC-SEND-005' } }, async ({ standardPage }) => {
    const send = new SendMoneyPage(standardPage);
    await send.goto();
    await send.fill(ACCOUNTS.checking, PAYEE, OVER_BALANCE);
    await send.reviewButton.click();
    await send.confirmButton.click();
    await expect(send.error).toContainText('Insufficient funds');
  });

  test('TC-SEND-006: sending is disabled for a frozen account', { annotation: { type: 'testId', description: 'TC-SEND-006' } }, async ({ frozenPage }) => {
    await frozenPage.goto('/bank/send-money');
    const send = new SendMoneyPage(frozenPage);
    await expect(send.frozenBanner).toBeVisible();
    await expect(send.reviewButton).toBeDisabled();
    await expect(send.amountInput).toBeDisabled();
  });
});
