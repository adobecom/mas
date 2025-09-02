import { expect, test } from '@playwright/test';
import StudioPage from '../../studio.page.js';
import EditorPage from '../../editor.page.js';

const cardId = '5a5ca143-a417-4087-b466-5b72ac68a830'; // Acrobat Pro card
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    editor = new EditorPage(page);
});

test.describe('M@S Studio Icon Field Detection', () => {
    test('@studio-icon-field-detection - Check which icon field type is available', async ({ page, baseURL }) => {
        const testPage = `${baseURL}/studio.html${miloLibs}#page=content&path=nala&query=${cardId}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(cardId);
            await expect(card).toBeVisible({ timeout: 10000 });
            await card.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Detect and log field type', async () => {
            // Wait a bit for fields to render
            await page.waitForTimeout(1000);

            // Check for mnemonic field
            const hasMnemonicField = await editor.mnemonicField.isVisible({ timeout: 2000 }).catch(() => false);

            // Check for old icon field
            const hasIconField = await editor.iconURL.isVisible({ timeout: 2000 }).catch(() => false);

            // Check for icon in multifield
            const hasMultifieldIcon = await editor.panel
                .locator('mas-multifield #mnemonics')
                .isVisible({ timeout: 2000 })
                .catch(() => false);

            console.log('Field Detection Results:');
            console.log(`- Has mnemonic field: ${hasMnemonicField}`);
            console.log(`- Has old icon URL field: ${hasIconField}`);
            console.log(`- Has multifield mnemonics: ${hasMultifieldIcon}`);

            // Log what's actually visible in the editor
            const visibleFields = await editor.panel.locator('sp-field-group').all();
            console.log(`- Total visible field groups: ${visibleFields.length}`);

            for (let i = 0; i < Math.min(visibleFields.length, 10); i++) {
                const fieldId = await visibleFields[i].getAttribute('id');
                const fieldLabel = await visibleFields[i]
                    .locator('sp-field-label')
                    .textContent()
                    .catch(() => 'N/A');
                console.log(`  Field ${i + 1}: ID="${fieldId}", Label="${fieldLabel}"`);
            }

            // Check if we can see the icon on the card itself
            const cardIcon = await page.locator(`merch-card[id="${cardId}"] merch-icon`);
            const iconSrc = await cardIcon.getAttribute('src').catch(() => 'N/A');
            console.log(`- Card icon src: ${iconSrc}`);

            // Determine what we can test
            if (hasMnemonicField) {
                console.log('✅ Can test mnemonic modal functionality');
            } else if (hasIconField) {
                console.log('⚠️ Can only test old icon URL field (no modal)');
            } else {
                console.log('❌ No icon field found - cannot test icon functionality');
            }
        });
    });
});
