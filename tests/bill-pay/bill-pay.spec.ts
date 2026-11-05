// Bill Pay spec — IDs match SecureBank's /bank/test-cases catalogue.

import { test, expect } from '../../fixtures/auth';
import BillPayPage from '../../pages/BillPayPage';
import { ACCOUNTS, AMOUNT, OVER_BALANCE, unique } from '../../helpers/testData';

const BILLER = 'City Electric Co.';

test.describe('Bill Pay', () => {
  test('TC-BILL-001: form loads with biller selection', { annotation: { type: 'testId', description: 'TC-BILL-001' } }, async ({ standardPage }) => {
    const bill = new BillPayPage(standardPage);
    await bill.goto();
    await bill.billerSearch.click();
    await expect(bill.billerOptions.first()).toBeVisible();
  });

  test('TC-BILL-002: an existing biller can be selected', { annotation: { type: 'testId', description: 'TC-BILL-002' } }, async ({ standardPage }) => {
    const bill = new BillPayPage(standardPage);
    await bill.goto();
    await bill.fill(ACCOUNTS.checking, BILLER, String(AMOUNT.bill));
    await bill.reviewButton.click();
    await expect(bill.confirmSummary).toContainText(BILLER);
  });

  test('TC-BILL-003: a new biller can be added', { annotation: { type: 'testId', description: 'TC-BILL-003' } }, async ({ standardPage }) => {
    const bill = new BillPayPage(standardPage);
    await bill.goto();
    const name = unique('Test Utility');
    await bill.addBiller(name, 'REF-1');

    await bill.billerSearch.click();
    await expect(bill.billerOptions.filter({ hasText: name })).toBeVisible();
  });

  test('TC-BILL-004: successful payment shows a confirmation', { annotation: { type: 'testId', description: 'TC-BILL-004' } }, async ({ standardPage }) => {
    const bill = new BillPayPage(standardPage);
    await bill.goto();
    await bill.fill(ACCOUNTS.checking, BILLER, String(AMOUNT.bill));
    await bill.reviewButton.click();
    await bill.confirmButton.click();
    await expect(bill.successHeading).toBeVisible();
    await expect(bill.reference).toContainText('BILL-');
    await expect(bill.confirmedBiller).toHaveText(BILLER);
  });

  test('TC-BILL-006: amount above balance is refused', { annotation: { type: 'testId', description: 'TC-BILL-006' } }, async ({ standardPage }) => {
    const bill = new BillPayPage(standardPage);
    await bill.goto();
    await bill.fill(ACCOUNTS.checking, BILLER, OVER_BALANCE);
    await bill.reviewButton.click();
    await bill.confirmButton.click();
    await expect(bill.error).toContainText('Insufficient funds');
  });
});
