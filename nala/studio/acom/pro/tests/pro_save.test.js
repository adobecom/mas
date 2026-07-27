import {
    test,
    expect,
    studio,
    editor,
    pro,
    setClonedCardID,
    getClonedCardID,
    miloLibs,
    setTestPage,
} from '../../../../libs/mas-test.js';
import ACOMProSpec from '../specs/pro_save.spec.js';

const { features } = ACOMProSpec;

test.describe('M@S Studio ACOM Pro card test suite', () => {
    // @studio-pro-save-edited-fields - Validate edits and save for pro card in mas studio
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
            data.clonedCardID = getClonedCardID();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
            await expect(await clonedCard).toHaveAttribute('variant', 'pro');
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.fill(data.title);
        });

        await test.step('step-4: Edit whats included label field', async () => {
            await expect(await editor.whatsIncludedLabel).toBeVisible();
            await editor.whatsIncludedLabel.fill(data.whatsIncludedLabel);
        });

        await test.step('step-5: Save card with all changes', async () => {
            await studio.saveCard();
        });

        await test.step('step-6: Validate all field changes in parallel', async () => {
            const validationLabels = ['title', 'whats included label'];

            const results = await Promise.allSettled([
                test.step('Validation-1: Verify title saved', async () => {
                    await expect(await editor.title).toContainText(data.title);
                    await expect(await clonedCard.locator(pro.cardTitle)).toHaveText(data.title);
                }),

                test.step('Validation-2: Verify whats included label saved', async () => {
                    await expect(await editor.whatsIncludedLabel).toHaveValue(data.whatsIncludedLabel);
                    await expect(await clonedCard.locator(pro.cardWhatsIncludedToggleLabel)).toHaveText(
                        data.whatsIncludedLabel,
                    );
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`\x1b[31m✘\x1b[0m Pro card field save validation failures:\n${failures.join('\n')}`);
            }
        });
    });
});
