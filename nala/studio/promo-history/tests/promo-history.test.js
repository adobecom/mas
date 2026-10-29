import { test, expect, promoHistory, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import spec from '../specs/promo-history.spec.js';
import { getTitle } from '../../../utils/fragment-tracker.js';
import { beginFragmentCreation, finishFragmentCreation } from '../../../utils/fragment-ledger.js';

const { features } = spec;

test.describe('M@S Studio - Promo project history', () => {
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { path, browserParams, data } = features[0];
        const testPage = `${baseURL}${path}${miloLibs}${browserParams}`;
        setTestPage(testPage);
        await page.goto(testPage);
        await expect(page.locator('mas-promotions')).toBeVisible();
        const creation = beginFragmentCreation('promotion-history-project');
        const creationAudit = page.waitForResponse(
            (res) =>
                res.url().endsWith('/promo-history-record') &&
                res.request().method() === 'POST' &&
                res.request().postDataJSON().action === 'create' &&
                res.request().postDataJSON().phase !== 'prepare',
        );
        const fragment = await page.evaluate(
            async ({ title, promoCode }) => {
                const repository = document.querySelector('mas-repository');
                const { PROMOTION_MODEL_ID } = await import('/studio/src/constants.js');
                const created = await repository.createFragment(
                    {
                        name: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                        title,
                        parentPath: repository.getPromotionsPath(),
                        modelId: PROMOTION_MODEL_ID,
                        fields: [
                            { name: 'title', type: 'text', values: [title] },
                            { name: 'promoCode', type: 'text', values: [promoCode] },
                            { name: 'startDate', type: 'date-time', values: [new Date().toISOString()] },
                            { name: 'endDate', type: 'date-time', values: [] },
                            { name: 'tags', type: 'tag', multiple: true, values: [] },
                            { name: 'surfaces', type: 'text', multiple: true, values: ['nala'] },
                            { name: 'geos', type: 'tag', multiple: true, values: [] },
                            { name: 'fragments', type: 'content-fragment', multiple: true, values: [] },
                        ],
                    },
                    false,
                );
                if (!created) throw new Error('Failed to create the run-owned promotion project.');
                return { id: created.id, path: created.path, title: created.title };
            },
            { title: getTitle(), promoCode: data.originalCode },
        );
        finishFragmentCreation(creation, fragment);
        const creationResponse = await creationAudit;
        expect(creationResponse.ok()).toBeTruthy();
        const { event: initialEvent } = await creationResponse.json();
        expect(initialEvent.restoreMode).toBe('state');

        let savedEventId;
        await test.step('Open Version history without creating a manual backup', async () => {
            await promoHistory.open(fragment.id);
            await expect(promoHistory.panel).toBeVisible();
            await expect(promoHistory.panel.locator('#create-backup')).toHaveCount(0);
        });

        await test.step('Save a later draft value on the real project', async () => {
            const completion = page.waitForResponse(
                (res) =>
                    res.url().endsWith('/promo-history-record') &&
                    res.request().method() === 'POST' &&
                    res.request().postDataJSON().phase === 'complete',
            );
            await page.evaluate(
                async ({ id, code }) => {
                    const aem = document.querySelector('mas-repository').aem;
                    const current = await aem.sites.cf.fragments.getWithEtag(id);
                    current.fields.find((field) => field.name === 'promoCode').values = [code];
                    await aem.sites.cf.fragments.save(current, { refetchEtag: false });
                },
                { id: fragment.id, code: data.updatedCode },
            );
            const auditResponse = await completion;
            expect(auditResponse.ok()).toBeTruthy();
            const { event } = await auditResponse.json();
            expect(event.action).toBe('save');
            expect(event.targetId).toBe(fragment.id);
            expect(event.restoreMode).toBe('state');
            expect(event.afterSnapshot.fragments).toEqual([
                expect.objectContaining({ id: fragment.id, path: fragment.path, versionId: expect.any(String) }),
            ]);
            savedEventId = event.id;
            expect(event.changes).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        field: 'promoCode',
                        before: [data.originalCode],
                        after: [data.updatedCode],
                    }),
                ]),
            );
            await page.reload();
            await expect(promoHistory.panel.locator(`[data-event-id="${savedEventId}"]`)).toBeVisible();
        });

        await test.step('Restore the initial saved state and verify persisted draft content and audit', async () => {
            await promoHistory.panel.locator(`[data-event-id="${initialEvent.id}"]`).click();
            await promoHistory.panel.locator('[data-field="promoCode"] sp-checkbox').click();
            await expect(promoHistory.restoreSelectedButton).toBeEnabled();
            await promoHistory.restoreSelectedButton.click();
            await expect(promoHistory.confirmation).toBeVisible();
            const response = page.waitForResponse(
                (res) => res.url().endsWith('/promo-history-restore') && res.request().method() === 'POST',
            );
            await promoHistory.confirmRestore.click();
            const restoreResponse = await response;
            expect(restoreResponse.ok()).toBeTruthy();
            const { event } = await restoreResponse.json();
            expect(event.action).toBe('restore');
            expect(event.restoreMode).toBe('state');
            expect(event.sourceEventId).toBe(initialEvent.id);
            await expect(studio.toastPositive).toBeVisible();
            const restored = await page.evaluate(async (id) => {
                const fragment = await document.querySelector('mas-repository').aem.sites.cf.fragments.getById(id);
                return { code: fragment.fields.find((field) => field.name === 'promoCode').values[0], status: fragment.status };
            }, fragment.id);
            expect(restored.code).toBe(data.originalCode);
            expect(restored.status).toBe('DRAFT');
            await expect(promoHistory.cards.filter({ hasText: 'Selected fields restored' }).first()).toBeVisible();
        });
    });
});
