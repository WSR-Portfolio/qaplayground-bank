# SecureBank Playwright Test Suite

End-to-end test suite for [SecureBank](https://qaplayground.com/bank), a purpose-built
demo banking application used for practicing test automation. Built with Playwright and
TypeScript using the Page Object Model pattern.

This project is part of my QA portfolio, demonstrating test design, authentication
fixture patterns, role-based access validation, and CI integration with GitHub Actions.

## What's Here

- 5 spec files, 34 tests covering auth, dashboard, accounts, transactions, and RBAC
- Page Object Model — one class per page, tests never reference selectors directly
- Custom fixtures (`adminPage`, `viewerPage`) for role-based test setup
- Test ID annotations on every test, mapped back to the original test plan
- GitHub Actions CI workflow with HTML report artifact on failure

## Test Coverage

| Module | Tests | What's Covered |
|--------|-------|----------------|
| Auth | AUTH-01 – AUTH-07 | Login happy path for both roles, invalid credentials, empty field validation, session handling, protected route access |
| Dashboard | DASH-01 – DASH-05 | Stat cards, quick actions, drag-to-reorder pinned accounts, recent transactions list |
| Accounts | ACC-01 – ACC-11 | Create via 3-step wizard, inline edit, edit modal, delete with confirmation, search, type filter, balance sort, pagination |
| Transactions | TXN-01 – TXN-08 | Deposit and withdrawal creation with balance verification, filter by account/type/date, summary chips, CSV export, detail page navigation |
| RBAC | RBAC-01 – RBAC-03 | Viewer role restrictions on account and transaction write actions |

## App Findings

Several real bugs and behavioral quirks were uncovered during development and are documented inline in the relevant spec files:

- **Logout bug** — the Logout button does not clear `sessionStorage`; the session persists within the same tab (AUTH-06)
- **RBAC gap** — the viewer role has no guard on the transaction creation flow; the form opens and the submit button is fully enabled (RBAC-03, marked `test.fail()`)
- **Dashboard data inconsistency** — stat card totals read from a server-side source that resets on navigation, inconsistent with the localStorage-backed accounts and transactions pages
- **Date filter behavior** — same-day From=To ranges return zero results; the filter appears to use an exclusive upper bound

## What's Not Here

- SecureBank has no real banking backend — there are no API endpoints to probe, no database queries to fuzz, and no server-side security surface to test
- All account and transaction data is stored in `localStorage`; there is no persistent state to test across sessions or devices
- No payment processing exists in the app, so payment validation, declined cards, and financial edge cases have no surface area
- Cross-browser testing is scoped to Chromium; adding Firefox and WebKit is a one-line change in `playwright.config.ts` once the suite is stable

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

Credentials are loaded from a `.env` file at the project root. `.env` is listed in `.gitignore` and is never committed.

```
BASE_URL=https://qaplayground.com/bank
ADMIN_USERNAME=
ADMIN_PASSWORD=
VIEWER_USERNAME=
VIEWER_PASSWORD=
```

This suite targets the public demo at qaplayground.com/bank. The demo credentials are published openly on that site.

## CI (GitHub Actions)

The workflow in `.github/workflows/playwright.yml` runs the full suite on every push to `main` and on pull requests. To run CI on a fork, add the five variables above as repository secrets under **Settings → Secrets and variables → Actions**. The Playwright HTML report is uploaded as an artifact (retained 7 days) on any test failure.

## A Note on AI-Assisted Development

This project was built using Claude Code as a development partner. Prompting an AI
effectively — knowing what to ask for, how to verify the output, and when to push
back — is a skill in itself, and one I've deliberately built into my workflow. The
test strategy, architecture decisions, and quality bar are mine; Claude helped
implement them.
