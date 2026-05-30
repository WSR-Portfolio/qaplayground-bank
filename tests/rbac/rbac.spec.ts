// RBAC spec
//
// Tests the viewer role's read-only restrictions across accounts and transactions.
// Run last among test modules because these tests navigate to accounts and
// transactions pages that are proven stable by Phases 6 and 7. A failure here
// points to the RBAC logic, not an untested underlying page.
//
// Dual assertion pattern (absent OR disabled):
// The app may enforce viewer restrictions by hiding write controls entirely or
// by rendering them as disabled. Both are valid. Each write-control assertion
// accepts either outcome so the test is not coupled to one implementation choice.
//
// Why RBAC-03 asserts read access before write restriction:
// A test that only checks "cannot create" would pass even if the viewer were
// redirected to a blank page. Asserting visible rows first confirms that the
// viewer role has the correct read permissions, not just blocked write permissions.
//
// Implementation notes:
// - RBAC-01 and RBAC-02 confirmed: the app correctly hides the wizard button
//   and all edit/delete controls for the viewer role.
// - RBAC-03 surfaces a real app bug: the transaction creation flow has no RBAC
//   enforcement. The dashboard quick-action link navigates the viewer to the form,
//   the modal opens, and the submit button is fully enabled. Marked test.fail().
// - quick-new-transaction is an <a> tag, not a <button> — toBeDisabled() does not
//   apply to anchor elements, which is why the dual assertion had to follow the
//   link rather than check the disabled attribute.

import { test, expect } from '../../fixtures/auth';
import { AccountsPage } from '../../pages/AccountsPage';
import DashboardPage from '../../pages/DashboardPage';

test.describe('Role-based access — viewer', () => {

  test('RBAC-01: viewer cannot access Add Account button or wizard', { annotation: { type: 'testId', description: 'RBAC-01' } }, async ({ viewerPage }) => {
    await viewerPage.goto('/bank/accounts');
    await viewerPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });

    const addBtn = viewerPage.getByTestId('open-wizard-button');
    const count = await addBtn.count();

    if (count === 0) {
      expect(count).toBe(0);
    } else {
      await expect(addBtn).toBeDisabled();
    }
  });

  test('RBAC-02: viewer cannot edit or delete accounts', { annotation: { type: 'testId', description: 'RBAC-02' } }, async ({ viewerPage }) => {
    await viewerPage.goto('/bank/accounts');
    await viewerPage.waitForSelector('[data-testid^="account-row-"]', { state: 'visible' });

    const editButtons   = viewerPage.locator('[data-testid^="edit-account-"]');
    const deleteButtons = viewerPage.locator('[data-testid^="delete-account-"]');

    const editCount = await editButtons.count();
    if (editCount === 0) {
      expect(editCount).toBe(0);
    } else {
      for (let i = 0; i < editCount; i++) {
        await expect(editButtons.nth(i)).toBeDisabled();
      }
    }

    const deleteCount = await deleteButtons.count();
    if (deleteCount === 0) {
      expect(deleteCount).toBe(0);
    } else {
      for (let i = 0; i < deleteCount; i++) {
        await expect(deleteButtons.nth(i)).toBeDisabled();
      }
    }
  });

  // APP BUG: The viewer role has no server- or client-side guard on the transaction
  // creation flow. The dashboard quick-action link navigates a viewer to
  // /bank/transactions?action=new, the modal opens, and the Submit Transaction
  // button is fully enabled. A viewer can create transactions they should not be
  // able to create. This test is marked test.fail() to document the expected
  // behavior as a regression spec — it will be promoted to a passing test once
  // the app enforces the restriction.
  test('RBAC-03: viewer can view transactions but not create them', { annotation: { type: 'testId', description: 'RBAC-03' } }, async ({ viewerPage }) => {
    test.fail(true, 'APP BUG: viewer role does not restrict transaction creation — modal opens and submit is enabled');

    // Confirm viewer has read access — test would pass on a blank page without this.
    await viewerPage.goto('/bank/transactions');
    await viewerPage.waitForSelector('[data-testid="transaction-row"]', { state: 'visible' });
    expect(await viewerPage.locator('[data-testid="transaction-row"]').count()).toBeGreaterThan(0);

    // Follow the dashboard quick-action link and verify the form does not allow submission.
    await viewerPage.goto('/bank/dashboard');
    await viewerPage.waitForSelector('[data-testid="total-balance"]', { state: 'visible' });

    await viewerPage.getByTestId('quick-new-transaction').click();
    await viewerPage.waitForSelector('[data-testid="transactions-tbody"]', { state: 'visible' });
    // Allow up to 3 seconds for the form dialog to open — in CI the modal can
    // render slightly after the tbody is visible.
    await viewerPage.waitForSelector('[data-testid="transaction-form"]', { state: 'visible', timeout: 3000 }).catch(() => {});

    const form = viewerPage.getByTestId('transaction-form');
    const formVisible = await form.isVisible().catch(() => false);

    if (!formVisible) {
      await expect(form).not.toBeVisible();
    } else {
      await expect(viewerPage.getByTestId('submit-transaction-button')).toBeDisabled();
    }
  });

});
