// Test data
//
// Why credentials live in source rather than secrets:
// SecureBank publishes every one of these logins on its own login page. They
// are demo personas, not credentials, and storing them as secrets would only
// add a setup step without protecting anything.
//
// Why each persona exists:
// The personas are the app's built-in test states. Reaching a frozen or
// overdrawn account through a persona is more reliable than building that
// state up through the UI first.

export const USERS = {
  standard: { username: 'standard_user', password: 'bank_sauce' },
  locked: { username: 'locked_user', password: 'bank_sauce' },
  frozen: { username: 'frozen_user', password: 'bank_sauce' },
  overdraft: { username: 'overdraft_user', password: 'bank_sauce' },
  error: { username: 'error_user', password: 'bank_sauce' },
} as const;

export const ACCOUNTS = { checking: 'Everyday Checking', savings: 'High-Yield Savings' } as const;

// An amount above Everyday Checking's seeded balance for standard_user.
export const OVER_BALANCE = '5000';

// Fixed amounts make balance assertions readable: a failure can be checked by
// hand without reconstructing a random value.
export const AMOUNT = { transfer: 25, send: 20, bill: 15, loan: 5000 } as const;

export function unique(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

// Converts display text such as "-$342.18" or "$17,050.00" to a number.
export function parseMoney(text: string): number {
  const value = Number(text.replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(value)) throw new Error(`Not a money value: "${text}"`);
  return value;
}

export function sum(values: number[]): number {
  return Math.round(values.reduce((total, v) => total + v, 0) * 100) / 100;
}

// A date far enough ahead that it stays valid for years of CI runs.
export const FUTURE_DATE = '2099-01-01';
export const PAST_DATE = '2020-01-01';
