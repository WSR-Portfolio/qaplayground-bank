# SecureBank Playwright Test Suite

End-to-end test suite for [SecureBank](https://qaplayground.com/bank), a purpose-built
demo banking application used for practicing test automation. Built with Playwright and
TypeScript using the Page Object Model pattern.

This project is part of my QA portfolio, demonstrating test design, persona-based
fixtures, traceability to a test plan, and CI integration with GitHub Actions.

SecureBank was rebuilt after this suite's first version, which replaced its roles,
pages and test IDs. The suite was rewritten against the new app; the old version
remains in the git history.

## What's Here

- 9 spec files, 41 tests covering login, dashboard, accounts, transfers, payments, bills, transactions and loans
- Page Object Model: one class per page, and tests never reference selectors directly
- Custom fixtures for each persona (`standardPage`, `frozenPage`, `overdraftPage`, `errorPage`)
- A smoke test that reports "the site changed" clearly if the demo is rebuilt again
- Test IDs on every test, matching the catalogue the app publishes at `/bank/test-cases`
- GitHub Actions CI workflow with an HTML report artifact on failure

## Test Coverage

| Module | Tests | What's Covered |
|--------|-------|----------------|
| Smoke | SMOKE-01 | Login form and dashboard match what the suite expects |
| Auth | AUTH-01 – AUTH-06 | Valid login, wrong password, locked account, empty form, logout, protected routes |
| Dashboard | TC-DASH-001 – 003 | Welcome message, total balance against account balances, recent transactions |
| Accounts | TC-ACC-001 – 004, 006 | List, details, overdrawn indicator, frozen banner, adding an account |
| Transfer | TC-XFER-001 – 006 | Form, account selection, insufficient funds, success, scheduling rules, balance updates |
| Send Money | TC-SEND-001 – 006 | Form, payee validation, success, saved payees, insufficient funds, frozen block |
| Bill Pay | TC-BILL-001 – 004, 006 | Form, biller selection, adding a biller, success, insufficient funds |
| Transactions | TC-TXN-001 – 003, 005 | Load, account filter, search, pagination |
| Loans | TC-LOAN-001 – 005 | Form, maximum amount, success and history, known total bug, frozen block |

This covers all of the catalogue's P1 and P2 cases. The P3 cases are not automated yet.

## App Findings

- **Loan total bug** (TC-LOAN-004): for `error_user`, the history total leaves out the latest loan. The site lists this as a bug to reproduce, so the test asserts the correct behavior and is marked `test.fail()`. It will report a failure if the site fixes the bug.
- **Same-account transfers** (TC-XFER-002): the catalogue expects an error, but the To list leaves out the chosen From account, so that error can't be reached. The test asserts this safeguard.
- **Saved payees** (TC-SEND-004): the catalogue mentions a save checkbox, but the dialog has none and every new payee is saved. The test asserts the outcome.
- **Insufficient funds timing**: the review step accepts any amount, and the error appears only after confirming. Balances stay unchanged.
- **Overdraft indicator** (TC-ACC-003): overdrawn accounts show an Overdrawn status rather than a banner, which the catalogue allows.

## What's Not Here

- SecureBank is a demo app whose state is kept in the browser, so there is no persistence to test across devices
- `admin_user` saw the same controls as `standard_user` on the pages compared, so there is no role boundary to test
- Cross-browser testing is scoped to Chromium; adding Firefox and WebKit is a one-line change in `playwright.config.ts`

## Tech Stack

- [Playwright](https://playwright.dev/) — test runner and browser automation
- TypeScript (strict mode)
- Node.js

## Setup

```bash
npm install
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run a single spec file
npx playwright test tests/auth/login.spec.ts

# View HTML report after a run
npx playwright show-report
```

## Credentials

No setup is needed. The suite uses the demo logins SecureBank publishes on its own login page, kept in `helpers/testData.ts`.

## CI (GitHub Actions)

The workflow in `.github/workflows/playwright.yml` runs the full suite on every push to `main` and on pull requests, and can also be started manually from the Actions tab. It needs no secrets.

## A Note on AI-Assisted Development

This project was built using Claude Code as a development partner. Prompting an AI
effectively — knowing what to ask for, how to verify the output, and when to push
back — is a skill in itself, and one I've deliberately built into my workflow. The
test strategy, architecture decisions, and quality bar are mine; Claude helped
implement them.
