import {
    test,
    expect,
    studio,
    editor,
    fries,
    setClonedCardID,
    webUtil,
    miloLibs,
    setTestPage,
} from '../../../../libs/mas-test.js';
import COMFriesSpec from '../specs/fries_save.spec.js';

const { features } = COMFriesSpec;

test.describe('M@S Studio Commerce Fries card test suite', () => {
    // @studio-fries-save-edited-trial-badge - Validate edit trial badge for fries card in mas studio
    // combines: text, color and border color
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            setClonedCardID(await clonedCard.locator('aem-fragment').getAttribute('fragment'));
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Edit trial badge field', async () => {
            await expect(await editor.trialBadge).toBeVisible();
            await editor.trialBadge.fill(data.trialBadge);
        });

        await test.step('step-5: Edit trial badge color', async () => {
            await expect(await editor.trialBadgeColor).toBeVisible();
            await editor.trialBadgeColor.scrollIntoViewIfNeeded();
            await editor.trialBadgeColor.click();
            await expect(await editor.trialBadgeColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.trialBadgeColor.name, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Edit trial badge border color', async () => {
            await expect(await editor.trialBadgeBorderColor).toBeVisible();
            await editor.trialBadgeBorderColor.scrollIntoViewIfNeeded();
            await editor.trialBadgeBorderColor.click();
            await expect(await editor.trialBadgeBorderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.trialBadgeBorderColor.name, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-7: Save card with all changes', async () => {
            await studio.saveCard();
        });

        await test.step('step-8: Validate all field changes in parallel', async () => {
            const validationLabels = ['trial badge', 'trial badge color', 'trial badge border color'];

            const results = await Promise.allSettled([
                test.step('Validation-1: Verify trial badge saved', async () => {
                    await expect(await editor.trialBadge).toHaveValue(data.trialBadge);
                    await expect(await fries.trialBadge).toHaveText(data.trialBadge);
                }),

                test.step('Validation-2: Verify trial badge color saved', async () => {
                    await expect(await editor.trialBadgeColor).toContainText(data.trialBadgeColor.name);
                    expect(
                        await webUtil.verifyCSS(clonedCard.locator(fries.trialBadge), {
                            color: data.trialBadgeColor.css,
                        }),
                    ).toBeTruthy();
                }),

                test.step('Validation-3: Verify trial badge border color saved', async () => {
                    await expect(await editor.trialBadgeBorderColor).toContainText(data.trialBadgeBorderColor.name);
                    expect(
                        await webUtil.verifyCSS(clonedCard.locator(fries.trialBadge), {
                            'border-color': data.trialBadgeBorderColor.css,
                        }),
                    ).toBeTruthy();
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`\x1b[31m✘\x1b[0m Fries card trial badge save validation failures:\n${failures.join('\n')}`);
            }
        });
    });
});
