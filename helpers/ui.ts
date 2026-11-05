// Shared UI helpers
//
// Why a helper for dropdowns:
// SecureBank's selects are custom comboboxes, not <select> elements, so
// Playwright's selectOption() does not apply. Every form uses the same
// open-then-click sequence, so it is written once here.

import { type Locator, type Page } from '@playwright/test';

export async function chooseOption(page: Page, trigger: Locator, name: string | RegExp): Promise<void> {
  await trigger.click();
  await page.getByRole('option', { name }).first().click();
}

// Returns a dropdown's options, then closes it so the form stays usable.
export async function readOptions(page: Page, trigger: Locator): Promise<string[]> {
  await trigger.click();
  const options = page.getByRole('option');
  await options.first().waitFor();
  const texts = await options.allInnerTexts();
  await page.keyboard.press('Escape');
  return texts;
}
