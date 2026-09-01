import { expect, test } from '@playwright/test';
import { features, settingsFeatures } from './mini.spec.js';
import MiniCard from './mini.page.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../utils/commerce.js';

let miniCard;

const TRIAL_CTA_SELECTOR =
    '[data-analytics-id="free-trial"], [data-analytics-id="start-free-trial"], [data-analytics-id="seven-day-trial"], [data-analytics-id="fourteen-day-trial"], [data-analytics-id="thirty-day-trial"]';

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [
        { name: 'US', url: DOCS_GALLERY_PATH.CCD_MINI.US },
        { name: 'FR', url: DOCS_GALLERY_PATH.CCD_MINI.FR },
        { name: 'AU', url: DOCS_GALLERY_PATH.CCD_MINI.AU },
        { name: 'KR_SETTINGS', url: settingsFeatures[0].path },
        { name: 'US_SETTINGS', url: settingsFeatures[1].path },
    ],
});

test.describe('CCD Mini Cards Feature', () => {
    test.beforeAll(async ({ browser, baseURL }) => {
        await workerSetup.setupWorkerPages({ browser, baseURL });
    });

    test.afterAll(async () => {
        await workerSetup.cleanupWorkerPages();
    });

    test.afterEach(async ({}, testInfo) => {
        workerSetup.attachWorkerErrorsToFailure(testInfo);
    });

    features.forEach((feature) => {
        test(`${feature.name},${feature.tags}`, async () => {
            const { data } = feature;

            // Determine which worker page to use based on the feature path
            const pageName = Object.keys(DOCS_GALLERY_PATH.CCD_MINI).find(
                (k) => DOCS_GALLERY_PATH.CCD_MINI[k] === feature.path,
            );
            const page = workerSetup.getPage(pageName);

            await test.step('1. Verify CCD Mini Card page is loaded', async () => {
                miniCard = new MiniCard(page);
                await workerSetup.verifyPageURL(pageName, feature.path, expect);
            });

            await test.step('2. Verify CCD Mini Card content', async () => {
                const cardLocator = await miniCard.getCard(data.fragment);
                await expect(cardLocator).toBeVisible();
                await cardLocator.evaluate((card) => card.checkReady());

                const title = await cardLocator.evaluate((card) => card.title);
                expect(title).toBe(data.title);

                if (data.regularPrice) {
                    const regularPrice = await cardLocator.evaluate((card) => card.regularPrice);
                    expect(regularPrice).toBe(data.regularPrice);
                }

                if (data.annualPrice) {
                    const annualPrice = await cardLocator.evaluate((card) => card.annualPrice);
                    expect(annualPrice).toBe(data.annualPrice);
                }

                const unitText = await cardLocator.evaluate((card) => card.unitText);
                expect(unitText ?? '').toBe(data.unitText ?? '');

                const promoPrice = await cardLocator.evaluate((card) => card.promoPrice);
                expect(promoPrice).toBe(data.promoPrice);

                const promotionCode = await cardLocator.evaluate((card) => card.promotionCode);
                expect(promotionCode).toBe(data.promotionCode);

                if (data.planTypeText) {
                    const planTypeText = await cardLocator.evaluate((card) => card.planTypeText);
                    expect(planTypeText).toBe(data.planTypeText);
                }

                const recurrenceText = await cardLocator.evaluate((card) => card.recurrenceText);
                expect(recurrenceText).toBe(data.recurrenceText);

                if (data.renewalText) {
                    const renewalText = await cardLocator.evaluate((card) => card.renewalText);
                    expect(renewalText).toBe(data.renewalText);
                }

                if (data.promoDurationText) {
                    const promoDurationText = await cardLocator.evaluate((card) => card.promoDurationText);
                    expect(promoDurationText).toBe(data.promoDurationText);
                }

                if (data.seeTerms) {
                    const seeTerms = await cardLocator.evaluate((card) => card.seeTermsInfo);
                    expect(seeTerms.text).toBe(data.seeTerms.text);
                    expect(seeTerms.analyticsId).toBe(data.seeTerms.analyticsId);
                    expect(seeTerms.href).toBe(data.seeTerms.href);
                }

                if (data.primaryCta) {
                    const primaryCta = await cardLocator.evaluate((card) => card.primaryCta);
                    expect(primaryCta.text).toBe(data.primaryCta.text);
                    expect(primaryCta.analyticsId).toBe(data.primaryCta.analyticsId);
                    expect(primaryCta.href).toBe(data.primaryCta.href);
                }

                if (data.secondaryCta) {
                    const secondaryCta = await cardLocator.evaluate((card) => card.secondaryCta);
                    expect(secondaryCta.text).toBe(data.secondaryCta.text);
                    expect(secondaryCta.analyticsId).toBe(data.secondaryCta.analyticsId);
                    expect(secondaryCta.href).toBe(data.secondaryCta.href);
                }
            });
        });
    });

    test(`${settingsFeatures[0].name},${settingsFeatures[0].tags}`, async () => {
        const { data, path } = settingsFeatures[0];
        const page = workerSetup.getPage('KR_SETTINGS');

        await test.step('1. Verify the KR CCD Mini page and target card are loaded', async () => {
            miniCard = new MiniCard(page);
            await workerSetup.verifyPageURL('KR_SETTINGS', path, expect);
            await expect(miniCard.getCard(data.fragment)).toBeVisible();
        });

        await test.step('2. Verify the KR geo override hides the trial CTA', async () => {
            const trialCta = miniCard.getCard(data.fragment).locator(TRIAL_CTA_SELECTOR);
            await expect(trialCta).not.toBeVisible();
        });
    });

    test(`${settingsFeatures[1].name},${settingsFeatures[1].tags}`, async () => {
        const { data, path } = settingsFeatures[1];
        const page = workerSetup.getPage('US_SETTINGS');

        await test.step('1. Verify the US CCD Mini page and target card are loaded', async () => {
            miniCard = new MiniCard(page);
            await workerSetup.verifyPageURL('US_SETTINGS', path, expect);
            await expect(miniCard.getCard(data.fragment)).toBeVisible();
        });

        await test.step('2. Verify the trial CTA remains visible outside KR', async () => {
            const trialCta = miniCard.getCard(data.fragment).locator(TRIAL_CTA_SELECTOR);
            await expect(trialCta).toBeVisible();
            await expect(trialCta).toContainText(data.trialCta, { ignoreCase: true });
        });
    });
});
