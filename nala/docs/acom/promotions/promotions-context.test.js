import { expect, test } from '@playwright/test';
import { features } from './promotions-context.spec.js';
import MasPlans from '../plans.page.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.PLANS.US }],
});

test.describe('ACOM MAS Promotions Context feature test suite', () => {
    test.beforeAll(async ({ browser, baseURL }) => {
        await workerSetup.setupWorkerPages({ browser, baseURL });
    });

    test.afterAll(async () => {
        await workerSetup.cleanupWorkerPages();
    });

    test.afterEach(async ({}, testInfo) => {
        workerSetup.attachWorkerErrorsToFailure(testInfo);
    });

    // @MAS-Promotions-Context-All-Prices
    test(`${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];
        const page = workerSetup.getPage('US');
        const acomPage = new MasPlans(page);

        await test.step('step-1: Verify all card prices are promotional', async () => {
            await workerSetup.verifyPageURL('US', features[0].path, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.regularPrice);

            await expect(acomPage.getCardPromoText(data.id)).toContainText(data.nonPromoPrice);
            await expect(acomPage.getCardPromoText(data.id)).not.toContainText(data.regularPrice);
            await expect(acomPage.getCardPromoText(data.id).locator(acomPage.price)).not.toHaveAttribute('data-promotion-code');

            await expect(acomPage.getCardDescription(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardDescription(data.id)).toContainText(data.regularPrice);
        });

        await test.step('step-2: Verify Buy Now CTA has apc parameter with promo code', async () => {
            await expect(acomPage.getCardCTA(data.id)).toHaveAttribute('href', new RegExp(`apc=${data.promoCode}`));
        });
    });

    // @MAS-Promotions-Context-Description-Changed-Promo-Code
    test(`${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];
        const page = workerSetup.getPage('US');
        const acomPage = new MasPlans(page);

        await test.step('step-1: Verify all card prices are promotional', async () => {
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.regularPrice);
            await expect(acomPage.getCardPromoText(data.id)).toContainText(data.nonPromoPrice);
            await expect(acomPage.getCardPromoText(data.id)).not.toContainText(data.regularPrice);
            await expect(acomPage.getCardDescription(data.id)).toContainText(data.nonPromoPrice);
        });

        await test.step('step-2: Verify promo text and description prices have data-promotion-code attribute', async () => {
            await expect(acomPage.getCardPromoText(data.id).locator(acomPage.price)).toHaveAttribute(
                'data-promotion-code',
                data.changedPromoCode,
            );
            await expect(acomPage.getCardDescription(data.id).locator(acomPage.price)).toHaveAttribute(
                'data-promotion-code',
                data.changedPromoCode,
            );
        });

        await test.step('step-3: Verify Free Trial CTA does not have apc parameter', async () => {
            await expect(acomPage.getCardCTA(data.id).first()).not.toHaveAttribute('href', /apc=/);
        });

        await test.step('step-4: Verify Buy Now CTA has apc parameter with promo code', async () => {
            await expect(acomPage.getCardCTA(data.id).last()).toHaveAttribute('href', new RegExp(`apc=${data.promoCode}`));
        });
    });

    // @MAS-Promotions-Context-Main-Price-Canceled-Context
    test(`${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];
        const page = workerSetup.getPage('US');
        const acomPage = new MasPlans(page);

        await test.step('step-1: Verify all card prices are promotional', async () => {
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.regularPrice);
            await expect(acomPage.getCardPrice(data.id)).not.toContainText(data.promoPrice);

            await expect(acomPage.getCardPromoText(data.id)).toContainText(data.nonPromoPrice);
            await expect(acomPage.getCardPromoText(data.id)).not.toContainText(data.promoPrice);

            await expect(acomPage.getCardDescription(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardDescription(data.id)).toContainText(data.regularPrice);
        });

        await test.step('step-2: Verify main price has data-promotion-code attribute', async () => {
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute(
                'data-promotion-code',
                data.mainPricePromoCode,
            );
        });

        await test.step('step-3: Verify Buy Now CTA has apc parameter with promo code', async () => {
            await expect(acomPage.getCardCTA(data.id)).toHaveAttribute('href', new RegExp(`apc=${data.promoCode}`));
        });
    });

    // @MAS-Promotions-Context-Main-Price-Only
    test(`${features[3].name},${features[3].tags}`, async () => {
        const { data } = features[3];
        const page = workerSetup.getPage('US');
        const acomPage = new MasPlans(page);

        await test.step('step-1: Verify main price is promotional', async () => {
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.regularPrice);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
        });

        await test.step('step-2: Verify main price has data-promotion-code attribute', async () => {
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute(
                'data-promotion-code',
                data.promoCode,
            );
        });

        await test.step('step-3: Verify promo text price has no promotion applied', async () => {
            await expect(acomPage.getCardPromoText(data.id)).toContainText(data.nonPromoPrice);
        });

        await test.step('step-4: Verify description price has no promotion applied', async () => {
            await expect(acomPage.getCardDescription(data.id)).toContainText(data.regularPrice);
            await expect(acomPage.getCardDescription(data.id)).not.toContainText(data.promoPrice);
        });

        await test.step('step-5: Verify CTA does not have apc parameter', async () => {
            await expect(acomPage.getCardCTA(data.id)).not.toHaveAttribute('href', /apc=/);
        });
    });
});
