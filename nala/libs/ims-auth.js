import { expect } from '@playwright/test';

export async function signIn(page, { email, password, welcomeUrlPattern, timeout }) {
    await page.locator('#EmailPage-EmailField').fill(email, { timeout });
    await page.locator('[data-id=EmailPage-ContinueButton]').click({ timeout });
    await expect(page.getByText('Reset your password')).toBeVisible({ timeout });
    await expect(page.locator('#PasswordPage-PasswordField')).toBeVisible({ timeout });
    await page.locator('#PasswordPage-PasswordField').fill(password, { timeout });
    await page.locator('[data-id=PasswordPage-ContinueButton]').click({ timeout });
    const skipPasskey = page.locator('button:has-text("Skip"), [data-id="PasskeyNudgePage-SkipButton"]');
    await expect
        .poll(async () => welcomeUrlPattern.test(page.url()) || (await skipPasskey.isVisible()), { timeout })
        .toBe(true);
    if (!welcomeUrlPattern.test(page.url())) await skipPasskey.click({ timeout });
    await expect(page).toHaveURL(welcomeUrlPattern, { timeout });
}
