/* eslint-disable import/no-import-module-exports */
import { expect } from '@playwright/test';

async function fillOutSignInForm(props, page) {
  expect(process.env.IMS_EMAIL, 'ERROR: No environment variable for email provided for IMS Test.').toBeTruthy();
  expect(process.env.IMS_PASS, 'ERROR: No environment variable for password provided for IMS Test.').toBeTruthy();

  await expect(page).toHaveTitle(/Adobe ID/);
  let heading = await page.locator('.spectrum-Heading1').first().innerText();
  expect(heading).toBe('Sign in');

  // Fill out Sign-in Form
  await expect(async () => {
    await page.locator('#EmailPage-EmailField').fill(process.env.IMS_EMAIL);
    await page.locator('[data-id=EmailPage-ContinueButton]').click();
    await expect(page.locator('text=Reset your password')).toBeVisible({ timeout: 45000 }); // Timeout accounting for how long IMS Login page takes to switch form
  }).toPass({
    intervals: [1_000],
    timeout: 10_000,
  });

  heading = await page.locator('.spectrum-Heading1', { hasText: 'Enter your password' }).first().innerText();
  expect(heading).toBe('Enter your password');
  await page.locator('#PasswordPage-PasswordField').fill(process.env.IMS_PASS);
  await page.locator('[data-id=PasswordPage-ContinueButton]').click();
  //await page.locator('div.ActionList-Item:nth-child(1)').click();
  await page.waitForURL(`${props.url}#`);
  await expect(page).toHaveURL(`${props.url}#`);
}

export default { fillOutSignInForm };
