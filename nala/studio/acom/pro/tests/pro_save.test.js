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

        await test.step('step-5: Select Dark theme and Edu size', async () => {
            await expect(editor.backgroundColor).toBeVisible();
            await expect(editor.backgroundColor).toHaveAttribute('value', 'Light');
            await editor.backgroundColor.scrollIntoViewIfNeeded();
            await editor.backgroundColor.click();
            const lightOption = page.getByRole('option', { name: 'Light', exact: true });
            const darkOption = page.getByRole('option', { name: data.theme, exact: true });
            await expect(lightOption).toBeVisible();
            await expect(darkOption).toBeVisible();
            await expect(page.getByRole('option', { name: 'Transparent', exact: true })).not.toBeVisible();
            await darkOption.click();
            await expect(editor.backgroundColor).toHaveAttribute('value', data.theme);

            await expect(editor.size).toBeVisible();
            await editor.size.scrollIntoViewIfNeeded();
            await editor.size.click();
            const wideOption = page.getByRole('option', { name: 'Wide', exact: true });
            const eduOption = page.getByRole('option', { name: data.size, exact: true });
            await expect(wideOption).toBeVisible();
            await expect(eduOption).toBeVisible();
            await eduOption.click();
            await expect(editor.size).toHaveAttribute('value', data.size.toLowerCase());
        });

        await test.step('step-6: Save card with all changes', async () => {
            await studio.saveCard();
        });

        await test.step('step-7: Validate all field changes in parallel', async () => {
            const validationLabels = ['title', 'whats included label', 'theme and size'];

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

                test.step('Validation-3: Verify Theme and Size saved', async () => {
                    await expect(editor.backgroundColor).toHaveAttribute('value', data.theme);
                    await expect(editor.size).toHaveAttribute('value', data.size.toLowerCase());
                    await expect(clonedCard).toHaveAttribute('background-color', data.theme.toLowerCase());
                    await expect(clonedCard).toHaveAttribute('size', data.size.toLowerCase());
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
