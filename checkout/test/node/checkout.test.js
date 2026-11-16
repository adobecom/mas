import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCheckoutUrl, applyPageLocaleToCheckoutUrl } from '../../src/buildCheckoutUrl.js';
import { resolveCheckoutData, resolveCheckoutIntent } from '../../src/checkout.js';
import { urlCases, offerCases } from '../fixtures/cases.js';

describe('checkout URLs without browser globals', () => {
    for (const { id, data, pageContext, expected } of urlCases) {
        it(`preserves the golden URL for ${id}`, () => {
            assert.equal(buildCheckoutUrl(data, pageContext), expected);
        });
    }

    for (const key of ['env', 'workflowStep', 'clientId', 'country', 'items']) {
        it(`rejects commitment data missing ${key}`, () => {
            const data = { ...urlCases[0].data };
            delete data[key];
            assert.throws(() => buildCheckoutUrl(data), {
                message: `Argument "checkoutData" is not valid, missing: ${key}`,
            });
        });
    }

    it('does not require items for segmentation', () => {
        const url = new URL(
            buildCheckoutUrl({
                ...urlCases[2].data,
                items: undefined,
            }),
        );
        assert.equal(url.searchParams.get('pa'), 'main');
        assert.equal(url.searchParams.has('q'), false);
    });

    it('uses the second item as addon when the primary arrangement is absent', () => {
        const url = new URL(
            buildCheckoutUrl({
                ...urlCases[2].data,
                productArrangementCode: undefined,
            }),
        );
        assert.equal(url.searchParams.get('ao'), 'stock');
    });

    it('uses creative for CRM but leaves a disabled 3-in-1 URL unchanged', () => {
        const data = { ...urlCases[3].data, modal: 'crm' };
        assert.equal(new URL(buildCheckoutUrl(data)).searchParams.get('cli'), 'creative');
        const disabled = new URL(buildCheckoutUrl({ ...data, is3in1: false }));
        assert.equal(disabled.searchParams.get('cli'), 'testClient');
        assert.equal(disabled.searchParams.has('rtc'), false);
        assert.equal(disabled.searchParams.get('af'), 'p_draft_landscape');
    });

    it('retains the serializer preselection rules', () => {
        const data = { ...urlCases[2].data, marketSegment: undefined, customerSegment: undefined };
        assert.equal(new URL(buildCheckoutUrl({ ...data, preselectPlan: 'EDU' })).searchParams.get('ms'), 'EDU');
        assert.equal(new URL(buildCheckoutUrl({ ...data, preselectPlan: 'TEAM' })).searchParams.get('cs'), 'TEAM');
    });

    it('preserves invalid custom action URLs with or without locale context', () => {
        assert.equal(applyPageLocaleToCheckoutUrl('not-a-url', { pathnames: ['/tw/'] }), 'not-a-url');
        assert.equal(applyPageLocaleToCheckoutUrl('not-a-url'), 'not-a-url');
    });
});

describe('resolved checkout data and intent', () => {
    for (const { id, offers, options, expected, intent } of offerCases) {
        it(`resolves the golden checkout for ${id}`, () => {
            const data = resolveCheckoutData(offers, options, { landscape: 'published' });
            assert.deepEqual(
                { url: buildCheckoutUrl(data), intent: resolveCheckoutIntent(offers[0]) },
                { url: expected, intent },
            );
        });
    }

    it('uses the primary quantity for all offers and resolves the 3-in-1 addon', () => {
        const { offers, options } = offerCases[4];
        const data = resolveCheckoutData(
            offers,
            { ...options, checkoutWorkflowStep: 'segmentation', quantity: [3, 9], modal: 'twp' },
            { is3in1: true },
        );
        assert.deepEqual(data.items, [
            { id: 'test-offer', quantity: 3, productArrangementCode: 'test-pac' },
            { id: 'test-offer-2', quantity: 3, productArrangementCode: 'stock' },
        ]);
        const params = new URL(buildCheckoutUrl(data)).searchParams;
        assert.equal(params.get('ao'), 'stock');
        assert.equal(params.get('q'), '3');
        assert.equal(params.get('ctx'), 'if');
        assert.equal(params.get('cli'), 'mini_plans');
    });

    it('prefers explicit segment options over offer segments', () => {
        const { offers, options } = offerCases[0];
        const params = new URL(buildCheckoutUrl(resolveCheckoutData(offers, { ...options, ms: 'EDU', cs: 'TEAM' })))
            .searchParams;
        assert.equal(params.get('ms'), 'EDU');
        assert.equal(params.get('cs'), 'TEAM');
    });

    it('falls back to the checkout market segment when the offer has none', () => {
        const { offers, options } = offerCases[0];
        const data = resolveCheckoutData([{ ...offers[0], marketSegments: [] }], { ...options, checkoutMarketSegment: 'GOV' });
        assert.equal(new URL(buildCheckoutUrl(data)).searchParams.get('ms'), 'GOV');
    });

    it('preserves extra-option precedence over mapped fields and execution context', () => {
        const { offers, options } = offerCases[0];
        const data = resolveCheckoutData(
            offers,
            { ...options, ms: 'EDU', marketSegment: 'GOV', context: 'caller' },
            { context: 'if' },
        );
        const params = new URL(buildCheckoutUrl(data)).searchParams;
        assert.equal(params.get('ms'), 'GOV');
        assert.equal(params.get('ctx'), 'caller');
    });
});
