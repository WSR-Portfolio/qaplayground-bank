// Test data helper
//
// Why Date.now() for unique names rather than a UUID library:
// No additional dependency needed. Millisecond precision is sufficient to avoid
// collisions within a single test run, and the output is human-readable in test
// logs and failure reports. A UUID would work but adds a dependency for no
// practical benefit here.
//
// Why deposit/withdrawal amounts are hardcoded strings rather than random numbers:
// Randomised amounts make balance-math assertions fragile and harder to debug.
// Fixed amounts ("500", "100") mean a developer reading a failure can immediately
// calculate the expected balance without reconstructing what the random value was.
//
// Why amounts are strings not numbers:
// POM methods (TransactionsPage, OpenAccountWizard) accept string amounts because
// they model the UI's text inputs directly. Keeping amounts as strings here
// avoids String() conversions at every call site.

export function makeAccountName(): string {
  return `Test Account ${Date.now()}`;
}

export function makeDepositAmount(): string {
  return '500';
}

export function makeWithdrawalAmount(): string {
  return '100';
}

export function makeAccountType(type: 'Savings' | 'Checking' = 'Savings'): 'Savings' | 'Checking' {
  return type;
}
