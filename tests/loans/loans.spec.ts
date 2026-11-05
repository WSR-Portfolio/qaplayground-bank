// Loans spec — IDs match SecureBank's /bank/test-cases catalogue.

import { test, expect } from '../../fixtures/auth';
import LoanPage from '../../pages/LoanPage';
import { ACCOUNTS, AMOUNT } from '../../helpers/testData';

test.describe('Loans', () => {
  test('TC-LOAN-001: dialog opens with the required fields', { annotation: { type: 'testId', description: 'TC-LOAN-001' } }, async ({ standardPage }) => {
    const loan = new LoanPage(standardPage);
    await loan.goto();
    await loan.open();
    for (const field of [loan.typeSelect, loan.amountInput, loan.termSelect, loan.rateInput, loan.accountSelect, loan.purposeInput]) {
      await expect(field).toBeVisible();
    }
  });

  test('TC-LOAN-002: amount above $250,000 is refused', { annotation: { type: 'testId', description: 'TC-LOAN-002' } }, async ({ standardPage }) => {
    const loan = new LoanPage(standardPage);
    await loan.goto();
    await loan.open();
    await loan.fill('250001', ACCOUNTS.checking, 'Home repairs');
    await loan.reviewButton.click();
    await expect(loan.error).toHaveText('Loan amount cannot exceed $250,000.');
  });

  test('TC-LOAN-003: application completes and appears in history', { annotation: { type: 'testId', description: 'TC-LOAN-003' } }, async ({ standardPage }) => {
    const loan = new LoanPage(standardPage);
    await loan.goto();
    const before = await loan.totalValue();

    await loan.apply(String(AMOUNT.loan), ACCOUNTS.checking, 'Home repairs');
    const reference = await loan.reference.innerText();
    expect(reference).toContain('LOAN-');

    await loan.goto();
    await expect(loan.historyReferences).toContainText(reference);
    expect(await loan.totalValue()).toBe(before + AMOUNT.loan);
  });

  // Known bug in the app, listed by the site as a bug reproduction: for
  // error_user the total leaves out the latest loan. test.fail() asserts the
  // correct behaviour and expects it to fail, which keeps the bug documented
  // without turning CI red. If the site fixes it, this test will start failing
  // as "expected to fail but passed", prompting its removal.
  test('TC-LOAN-004: history total includes the latest loan', { annotation: [{ type: 'testId', description: 'TC-LOAN-004' }, { type: 'issue', description: 'Site bug: error_user total omits the latest loan' }] }, async ({ errorPage }) => {
    test.fail();
    const loan = new LoanPage(errorPage);
    await loan.goto();
    const before = await loan.totalValue();

    await loan.apply(String(AMOUNT.loan), ACCOUNTS.checking, 'Home repairs');
    await loan.goto();

    expect(await loan.totalValue()).toBe(before + AMOUNT.loan);
  });

  test('TC-LOAN-005: applying is disabled for a frozen account', { annotation: { type: 'testId', description: 'TC-LOAN-005' } }, async ({ frozenPage }) => {
    await frozenPage.goto('/bank/apply-loan');
    const loan = new LoanPage(frozenPage);
    await expect(loan.frozenBanner).toBeVisible();
    await expect(loan.openButton).toBeDisabled();
  });
});
