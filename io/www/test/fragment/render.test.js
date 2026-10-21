import { expect } from 'chai';
import sinon from 'sinon';
import { readFile } from 'node:fs/promises';
import { transformer as render } from '../../src/fragment/transformers/render.js';
import { buildPriceHTML } from '@adobecom/mas-price';
import { baseOffer, cases, instant, priceInfo } from '../../../../price/test/fixtures/cases.js';

const golden = JSON.parse(await readFile(new URL('../../../../price/test/fixtures/price-html.expected.json', import.meta.url)));
const wrapper = '<span is="inline-price" data-wcs-osi="osi-base">';
const placeholder = `${wrapper}</span>`;
const resolvedOptions = (overrides = {}) => ({
    country: 'US',
    language: 'en',
    wcsOsi: ['osi-base'],
    promotionCodes: [''],
    promotionCode: '',
    displayTax: false,
    forceTaxExclusive: false,
    ...overrides,
});
const contextFor = (html = placeholder, offers = [structuredClone(baseOffer)]) => ({
    id: 'fragment',
    api_key: 'test',
    requestId: 'request',
    locale: 'en_US',
    body: {
        fields: { description: html },
        wcs: { prod: { 'osi-base-us-mult': offers } },
    },
});
const invocation = (options = resolvedOptions()) => ({
    environment: 'prod',
    resolveOptions: () => options,
});

async function expectFailure(context, inputs, message) {
    let error;
    try {
        await render.process(context, inputs);
    } catch (caught) {
        error = caught;
    }
    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.include(message);
}

describe('inactive inline-price render transformer', () => {
    beforeEach(() => {
        sinon.useFakeTimers({ now: new Date(instant), toFake: ['Date'] });
        sinon.stub(console, 'error');
        sinon.stub(console, 'log');
        sinon.stub(globalThis, 'fetch').throws(new Error('render must not fetch'));
    });
    afterEach(() => sinon.restore());

    it('exports the standard render transformer without an upstream init', () => {
        expect(render.name).to.equal('render');
        expect(render).not.to.have.property('init');
    });

    it('preserves the authored outer wrapper while replacing its contents', async () => {
        const context = contextFor(`${wrapper}old <span>price</span></span>`);
        await render.process(context, invocation());
        expect(context.body.fields.description).to.equal(
            `${wrapper}${golden.results['US-en/INDIVIDUAL/default/regular']}</span>`,
        );
    });

    it('returns the input context after successful processing', async () => {
        const context = contextFor();
        expect(await render.process(context, invocation())).to.equal(context);
    });

    it('renders the annual golden from a raw YEAR/MONTHLY offer without planType', async () => {
        const offer = structuredClone(baseOffer);
        delete offer.planType;
        const context = contextFor(placeholder, [offer]);
        const before = structuredClone(context.body.wcs);
        await render.process(context, invocation(resolvedOptions({ displayAnnual: true })));
        expect(context.body.fields.description).to.equal(
            `${wrapper}${golden.results['US-en/INDIVIDUAL/with-annual/regular']}</span>`,
        );
        expect(context.body.wcs).to.deep.equal(before);
    });

    for (const [commitment, term, planType] of [
        ['YEAR', 'MONTHLY', 'ABM'],
        ['YEAR', 'ANNUAL', 'PUF'],
        ['MONTH', 'MONTHLY', 'M2M'],
        ['PERPETUAL', undefined, 'PERPETUAL'],
        ['TERM_LICENSE', 'P3Y', 'P3Y'],
    ]) {
        it(`renders the ${planType} legal label from raw WCS dimensions without mutating cached offers`, async () => {
            const offer = { ...structuredClone(baseOffer), commitment, term };
            delete offer.planType;
            const context = contextFor(placeholder, [offer]);
            const before = structuredClone(context.body.wcs);
            const options = resolvedOptions({
                template: 'legal',
                displayPlanType: true,
                literals: { planTypeLabel: '{planType}' },
            });
            await render.process(context, invocation(options));
            expect(context.body.fields.description).to.equal(
                `${wrapper}${buildPriceHTML([{ ...offer, planType }], options)}</span>`,
            );
            expect(context.body.fields.description).to.include(`<span class="price-plan-type">${planType}</span>`);
            expect(context.body.wcs).to.deep.equal(before);
        });
    }

    it('requires an explicit environment even when no inline prices exist', async () => {
        await expectFailure(contextFor('plain content'), { resolveOptions: () => resolvedOptions() }, 'environment');
    });

    it('does not fall back to prod when the requested environment is absent', async () => {
        await expectFailure(contextFor(), { ...invocation(), environment: 'stage' }, 'stage');
    });

    it('uses only the explicitly selected cache environment', async () => {
        const context = contextFor();
        context.body.wcs.stage = context.body.wcs.prod;
        context.body.wcs.prod = {};
        await render.process(context, { ...invocation(), environment: 'stage' });
        expect(context.body.fields.description).to.include(golden.results['US-en/INDIVIDUAL/default/regular']);
    });

    it('looks up the environment cache once across multiple prices and fields', async () => {
        const context = contextFor(`${placeholder}${placeholder}`);
        context.body.fields.other = placeholder;
        const cache = context.body.wcs.prod;
        const readCache = sinon.stub().returns(cache);
        sinon.stub(context.body.wcs, 'prod').get(readCache);
        await render.process(context, invocation());
        expect(readCache.callCount).to.equal(1);
        const resolved = `${wrapper}${golden.results['US-en/INDIVIDUAL/default/regular']}</span>`;
        expect(context.body.fields.description).to.equal(`${resolved}${resolved}`);
        expect(context.body.fields.other).to.equal(resolved);
    });

    it('reports a missing environment cache before requesting per-price options', async () => {
        const context = contextFor('ordinary');
        context.body.fields.other = placeholder;
        delete context.body.wcs;
        const before = structuredClone(context);
        const resolveOptions = sinon.stub().returns(resolvedOptions());
        await expectFailure(context, { environment: 'prod', resolveOptions }, 'fragment.other (prod): No WCS cache');
        expect(resolveOptions.called).to.equal(false);
        expect(context).to.deep.equal(before);
    });

    it('requires a resolved-options provider instead of inferring browser policy', async () => {
        await expectFailure(contextFor(), { environment: 'prod' }, 'resolveOptions');
    });

    for (const key of ['country', 'language', 'wcsOsi', 'promotionCodes', 'promotionCode', 'displayTax', 'forceTaxExclusive']) {
        it(`rejects unresolved required ${key} input`, async () => {
            const options = resolvedOptions();
            delete options[key];
            await expectFailure(contextFor(), invocation(options), key);
        });
    }

    it('rejects an absent resolved-options result', async () => {
        await expectFailure(contextFor(), { ...invocation(), resolveOptions: () => undefined }, 'resolved options');
    });

    it('rejects an empty resolved OSI set', async () => {
        await expectFailure(contextFor(), invocation(resolvedOptions({ wcsOsi: [], promotionCodes: [] })), 'OSI');
    });

    it('rejects promotion codes that are not aligned with the OSIs', async () => {
        await expectFailure(contextFor(), invocation(resolvedOptions({ promotionCodes: [] })), 'promotionCodes');
    });

    it('rejects unresolved promotion cancellation sentinels', async () => {
        await expectFailure(
            contextFor(),
            invocation(resolvedOptions({ promotionCodes: ['cancel-context'] })),
            'cancel-context',
        );
    });

    it('rejects an unresolved cancellation sentinel in the rendering selector', async () => {
        await expectFailure(contextFor(), invocation(resolvedOptions({ promotionCode: 'cancel-context' })), 'cancel-context');
    });

    it('rejects a missing rendering selector before committing earlier fields', async () => {
        const context = contextFor();
        context.body.fields.other = placeholder;
        context.body.wcs.prod['osi-base-us-mult-promo'] = structuredClone(
            cases.find(({ id }) => id === 'US-en/INDIVIDUAL/promo-with-annual/promotion').offers,
        );
        const before = structuredClone(context);
        const options = resolvedOptions({ promotionCodes: ['PROMO'], displayAnnual: true });
        delete options.promotionCode;
        const resolveOptions = sinon.stub();
        resolveOptions.onFirstCall().returns(resolvedOptions());
        resolveOptions.onSecondCall().returns(options);
        await expectFailure(context, { environment: 'prod', resolveOptions }, 'promotionCode');
        expect(context).to.deep.equal(before);
    });

    it('renders the annual promotion golden with an explicitly supplied rendering selector', async () => {
        const id = 'US-en/INDIVIDUAL/promo-with-annual/promotion';
        const context = contextFor();
        context.body.wcs.prod = {
            'osi-base-us-mult-promo': structuredClone(cases.find((fixture) => fixture.id === id).offers),
        };
        const options = resolvedOptions({
            promotionCodes: ['PROMO'],
            promotionCode: 'PROMO',
            displayAnnual: true,
            instant,
        });
        await render.process(context, invocation(options));
        expect(context.body.fields.description).to.equal(`${wrapper}${golden.results[id]}</span>`);
    });

    it('honors an explicitly empty rendering selector even when the cache code is promotional', async () => {
        const id = 'US-en/INDIVIDUAL/with-annual/promotion';
        const context = contextFor();
        context.body.wcs.prod = {
            'osi-base-us-mult-promo': structuredClone(cases.find((fixture) => fixture.id === id).offers),
        };
        const options = resolvedOptions({
            promotionCodes: ['PROMO'],
            promotionCode: '',
            displayAnnual: true,
            instant,
        });
        await render.process(context, invocation(options));
        expect(context.body.fields.description).to.equal(`${wrapper}${golden.results[id]}</span>`);
    });

    it('keeps mixed bundle cache codes separate from the explicitly empty rendering selector', async () => {
        const { offers } = cases.find(({ id }) => id === 'US-en/INDIVIDUAL/promo-with-annual/promotion');
        const context = contextFor();
        context.body.wcs.prod = {
            'osi-base-us-mult-promo': structuredClone(offers),
            'addon-us-mult': [structuredClone(baseOffer)],
        };
        const options = resolvedOptions({
            wcsOsi: ['osi-base', 'addon'],
            promotionCodes: ['PROMO', ''],
            promotionCode: '',
        });
        await render.process(context, invocation(options));
        expect(context.body.fields.description).to.include('>79</span>').and.include('>98</span>');
    });

    it('rejects unresolved dictionary literals', async () => {
        const options = resolvedOptions({ literals: { recurrenceLabel: '{{price-literal-recurrence-label}}' } });
        await expectFailure(contextFor(), invocation(options), 'price-literal');
    });

    it('reports missing cache entries with fragment, field, environment and key', async () => {
        const context = contextFor();
        context.body.wcs.prod = {};
        await expectFailure(context, invocation(), 'fragment.description');
        expect(console.error.firstCall.args[0]).to.include('prod').and.include('osi-base-us-mult');
    });

    it('rejects empty cached offers rather than emitting a blank price', async () => {
        await expectFailure(contextFor(placeholder, []), invocation(), 'No cached offers');
    });

    it('keeps no-price fragments unchanged without requiring a cache', async () => {
        const context = contextFor('<a is="checkout-link">buy</a><span>ordinary</span>');
        delete context.body.wcs;
        const before = structuredClone(context);
        await render.process(context, invocation());
        expect(context).to.deep.equal(before);
    });

    it('passes decoded attributes and fragment identity to the options provider', async () => {
        const context = contextFor('<SPAN class=\'keep\' data-label="A&amp;B" is="inline-price" data-template="legal"></SPAN>');
        const resolveOptions = sinon.stub().resolves(resolvedOptions({ template: 'legal' }));
        await render.process(context, { environment: 'prod', resolveOptions });
        const input = resolveOptions.firstCall.args[0];
        expect(input).to.include({ context, fragment: context.body, fieldName: 'description' });
        expect(input.attributes).to.include({ 'data-label': 'A&B', 'data-template': 'legal' });
    });

    it('preserves original wrapper spelling, attribute quotes and surrounding bytes', async () => {
        const opening = '<SPAN class=\'keep\'\n data-label="A&amp;B" is="inline-price">';
        const context = contextFor(`before<!--keep-->${opening}<b>old</b></SPAN>after`);
        await render.process(context, invocation());
        expect(context.body.fields.description).to.equal(
            `before<!--keep-->${opening}${golden.results['US-en/INDIVIDUAL/default/regular']}</SPAN>after`,
        );
    });

    it('handles a price nested inside ordinary markup without replacing its parent', async () => {
        const context = contextFor(`<div><span class="outer">${placeholder}</span></div>`);
        await render.process(context, invocation());
        expect(context.body.fields.description).to.equal(
            `<div><span class="outer">${wrapper}${golden.results['US-en/INDIVIDUAL/default/regular']}</span></span></div>`,
        );
    });

    it('replaces prices in original source order when HTML parsing reparents table content', async () => {
        const html = `<table><tr><td>${placeholder}</td></tr>${placeholder}</table>`;
        const context = contextFor(html);
        await render.process(context, invocation());
        expect(context.body.fields.description).to.equal(
            `<table><tr><td>${wrapper}${golden.results['US-en/INDIVIDUAL/default/regular']}</span></td></tr>` +
                `${wrapper}${golden.results['US-en/INDIVIDUAL/default/regular']}</span></table>`,
        );
    });

    it('leaves comments and script text that resemble prices untouched', async () => {
        const html = `<!--${placeholder}--><script>const example = '${placeholder}'</script>`;
        const context = contextFor(html);
        await render.process(context, invocation());
        expect(context.body.fields.description).to.equal(html);
    });

    it('rejects prices inside inert HTML templates', async () => {
        await expectFailure(contextFor(`<template>${placeholder}</template>`), invocation(), 'template');
    });

    it('rejects malformed placeholders without an explicit closing wrapper', async () => {
        await expectFailure(contextFor(wrapper), invocation(), 'closing');
    });

    it('rejects nested inline prices instead of hiding an unresolved inner price', async () => {
        await expectFailure(contextFor(`${wrapper}${placeholder}</span>`), invocation(), 'Nested');
    });

    it('resolves each price with its own supplied options', async () => {
        const context = contextFor(`${placeholder}<br>${placeholder}`);
        const resolveOptions = sinon.stub();
        resolveOptions.onFirstCall().returns(resolvedOptions());
        resolveOptions.onSecondCall().returns(resolvedOptions({ template: 'legal', displayPlanType: true }));
        await render.process(context, { environment: 'prod', resolveOptions });
        expect(context.body.fields.description).to.equal(
            `${wrapper}${golden.results['US-en/INDIVIDUAL/default/regular']}</span><br>` +
                `${wrapper}${golden.results['US-en/INDIVIDUAL/legal/regular']}</span>`,
        );
    });

    it('renders wrapped rich text without changing its representation', async () => {
        const context = contextFor();
        context.body.fields.description = { mimeType: 'text/html', value: placeholder, custom: true };
        await render.process(context, invocation());
        expect(context.body.fields.description).to.include({ mimeType: 'text/html', custom: true });
        expect(context.body.fields.description.value).to.include(golden.results['US-en/INDIVIDUAL/default/regular']);
    });

    it('renders all entries of multi-value rich text', async () => {
        const context = contextFor();
        context.body.fields.customFields = { mimeType: 'text/html', value: ['plain', placeholder] };
        await render.process(context, invocation());
        expect(context.body.fields.customFields.value[0]).to.equal('plain');
        expect(context.body.fields.customFields.value[1]).to.include(golden.results['US-en/INDIVIDUAL/default/regular']);
    });

    it('preserves non-string field values and reference identifier arrays', async () => {
        const context = contextFor();
        Object.assign(context.body.fields, { cards: ['reference-id'], enabled: true, count: 2, missing: null });
        await render.process(context, invocation());
        expect(context.body.fields).to.include({ enabled: true, count: 2, missing: null });
        expect(context.body.fields.cards).to.deep.equal(['reference-id']);
    });

    it('retains array identity when a field contains no prices', async () => {
        const context = contextFor('plain');
        const cards = ['reference-id'];
        const customFields = { mimeType: 'text/html', value: ['ordinary', '<span>unchanged</span>'] };
        Object.assign(context.body.fields, { cards, customFields });
        const originalValues = customFields.value;
        await render.process(context, invocation());
        expect(context.body.fields.cards).to.equal(cards);
        expect(customFields.value).to.equal(originalValues);
    });

    it('preserves non-string entries in multi-value fields', async () => {
        const context = contextFor();
        context.body.fields.values = [null, 1, true, { value: 'not rich text' }, placeholder];
        await render.process(context, invocation());
        expect(context.body.fields.values.slice(0, 4)).to.deep.equal([null, 1, true, { value: 'not rich text' }]);
        expect(context.body.fields.values[4]).to.include(golden.results['US-en/INDIVIDUAL/default/regular']);
    });

    it('ignores references without fragments and fragments without fields', async () => {
        const context = contextFor('ordinary');
        context.body.references = { missing: {}, empty: { value: { id: 'empty' } } };
        const before = structuredClone(context);
        await render.process(context, invocation());
        expect(context).to.deep.equal(before);
    });

    it('rejects missing invocation inputs explicitly', async () => {
        await expectFailure(contextFor(), undefined, 'environment');
    });

    it('processes flattened references once even when entries share a fragment', async () => {
        const context = contextFor('root');
        const child = { id: 'child', fields: { description: placeholder } };
        context.body.references = { a: { value: child }, b: { value: child }, other: { value: { fields: {} } } };
        const resolveOptions = sinon.stub().returns(resolvedOptions());
        await render.process(context, { environment: 'prod', resolveOptions });
        expect(resolveOptions.callCount).to.equal(1);
        expect(child.fields.description).to.include(golden.results['US-en/INDIVIDUAL/default/regular']);
    });

    it('does not mutate cached offer order during shared selection', async () => {
        const offers = [{ ...structuredClone(baseOffer), language: 'EN' }, structuredClone(baseOffer)];
        const context = contextFor(placeholder, offers);
        const before = structuredClone(context.body.wcs);
        await render.process(context, invocation());
        expect(context.body.wcs).to.deep.equal(before);
    });

    it('uses the resolved commerce country rather than the content locale', async () => {
        const context = contextFor();
        context.body.wcs.prod = { 'osi-base-be-mult': [structuredClone(baseOffer)] };
        await render.process(context, invocation(resolvedOptions({ country: 'BE', language: 'fr' })));
        expect(context.body.fields.description).to.include('price-integer');
    });

    it('omits the WCS language component for GB cache entries', async () => {
        const context = contextFor();
        context.body.wcs.prod = { 'osi-base-gb': [structuredClone(baseOffer)] };
        await render.process(context, invocation(resolvedOptions({ country: 'GB' })));
        expect(context.body.fields.description).to.include('price-integer');
    });

    it('uses final substituted OSIs and per-offer promotion codes', async () => {
        const context = contextFor();
        context.body.wcs.prod = { 'replacement-us-mult-promo': [structuredClone(baseOffer)] };
        await render.process(context, invocation(resolvedOptions({ wcsOsi: ['replacement'], promotionCodes: ['PROMO'] })));
        expect(context.body.fields.description).to.include('price-integer');
    });

    it('honors resolved promotion cancellation without inheriting fragment promotion', async () => {
        const context = contextFor(placeholder.replace('osi-base"', 'osi-base" data-promotion-code="cancel-context"'));
        context.body.fields.promoCode = 'INHERITED';
        await render.process(context, invocation());
        expect(context.body.fields.description).to.include(golden.results['US-en/INDIVIDUAL/default/regular']);
    });

    it('sums all resolved OSI groups rather than using only the first price', async () => {
        const context = contextFor();
        context.body.wcs.prod['addon-us-mult'] = [structuredClone(baseOffer)];
        await render.process(context, invocation(resolvedOptions({ wcsOsi: ['osi-base', 'addon'], promotionCodes: ['', ''] })));
        expect(context.body.fields.description).to.include('>59</span>').and.include('>98</span>');
    });

    for (const preformatted of [false, true]) {
        it(`renders a two-offer discount against the reference price${preformatted ? ' ignoring stale priceInfo' : ''}`, async () => {
            const offerAt = (price) => ({
                ...structuredClone(baseOffer),
                ...(preformatted && { priceInfo: structuredClone(priceInfo) }),
                priceDetails: {
                    ...baseOffer.priceDetails,
                    price,
                    priceWithoutDiscount: price,
                    priceWithoutTax: price,
                    priceWithoutDiscountAndTax: price,
                },
            });
            const context = contextFor(placeholder, [offerAt(40)]);
            context.body.wcs.prod['reference-us-mult'] = [offerAt(100)];
            const before = structuredClone(context.body.wcs);
            const options = resolvedOptions({
                template: 'discount',
                wcsOsi: ['osi-base', 'reference'],
                promotionCodes: ['', ''],
            });
            await render.process(context, invocation(options));
            expect(context.body.fields.description).to.equal(`${wrapper}<span class="discount">60%</span></span>`);
            expect(context.body.wcs).to.deep.equal(before);
        });
    }

    it('uses selected tax-exclusive prices for the two-offer discount comparison', async () => {
        const discounted = structuredClone(baseOffer);
        const reference = structuredClone(baseOffer);
        Object.assign(discounted.priceDetails, { price: 40, priceWithoutDiscount: 40, priceWithoutTax: 20 });
        Object.assign(reference.priceDetails, { price: 100, priceWithoutDiscount: 100, priceWithoutTax: 80 });
        const context = contextFor(placeholder, [discounted]);
        context.body.wcs.prod['reference-us-mult'] = [reference];
        const before = structuredClone(context.body.wcs);
        await render.process(
            context,
            invocation(
                resolvedOptions({
                    template: 'discount',
                    wcsOsi: ['osi-base', 'reference'],
                    promotionCodes: ['', ''],
                    forceTaxExclusive: true,
                }),
            ),
        );
        expect(context.body.fields.description).to.equal(`${wrapper}<span class="discount">75%</span></span>`);
        expect(context.body.wcs).to.deep.equal(before);
    });

    it('keeps general summation for discount placeholders with more than two offers', async () => {
        const context = contextFor();
        context.body.wcs.prod['addon-us-mult'] = [structuredClone(baseOffer)];
        context.body.wcs.prod['third-us-mult'] = [structuredClone(baseOffer)];
        await render.process(
            context,
            invocation(
                resolvedOptions({
                    template: 'discount',
                    wcsOsi: ['osi-base', 'addon', 'third'],
                    promotionCodes: ['', '', ''],
                }),
            ),
        );
        expect(context.body.fields.description).to.equal(`${wrapper}<span class="discount">25%</span></span>`);
    });

    it('fails a missing bundle member without changing any field', async () => {
        const context = contextFor(`${placeholder}${placeholder}`);
        const before = structuredClone(context);
        const resolveOptions = sinon.stub();
        resolveOptions.onFirstCall().returns(resolvedOptions());
        resolveOptions.onSecondCall().returns(resolvedOptions({ wcsOsi: ['osi-base', 'missing'], promotionCodes: ['', ''] }));
        await expectFailure(context, { environment: 'prod', resolveOptions }, 'missing-us-mult');
        expect(context).to.deep.equal(before);
    });

    it('rejects a price without a supplied required field before committing other fields', async () => {
        const context = contextFor();
        context.body.fields.other = placeholder;
        const before = structuredClone(context);
        const resolveOptions = sinon.stub();
        resolveOptions.onFirstCall().returns(resolvedOptions());
        resolveOptions.onSecondCall().returns(undefined);
        await expectFailure(context, { environment: 'prod', resolveOptions }, 'resolved options');
        expect(context).to.deep.equal(before);
    });

    it('never makes an upstream call during direct processing', async () => {
        await render.process(contextFor(), invocation());
        expect(globalThis.fetch.called).to.equal(false);
    });

    it('logs shared summation warnings with render request context', async () => {
        const context = contextFor();
        context.body.wcs.prod['addon-us-mult'] = [{ ...structuredClone(baseOffer), commitment: 'MONTH' }];
        await render.process(context, invocation(resolvedOptions({ wcsOsi: ['osi-base', 'addon'], promotionCodes: ['', ''] })));
        expect(console.log.firstCall.args[0]).to.include('[render]').and.include('different commitment');
    });

    it('logs recoverable literal errors with render request context', async () => {
        await render.process(contextFor(), invocation(resolvedOptions({ literals: { recurrenceLabel: '{broken' } })));
        expect(console.error.firstCall.args[0]).to.include('[render]').and.include('Failed to format literal');
    });

    it('does not register or import render in the production pipeline', async () => {
        const source = await readFile(new URL('../../src/fragment/pipeline.js', import.meta.url), 'utf8');
        expect(source).not.to.include('transformers/render');
        expect(source).to.include(
            'const PIPELINE = [fetchFragment, defaultLanguage, promotions, mask, customize, settings, replace, wcs, corrector];',
        );
    });
});

describe('inactive transformer golden output', () => {
    before(() => {
        sinon.useFakeTimers({ now: new Date(instant), toFake: ['Date'] });
        sinon.stub(console, 'error');
    });
    after(() => sinon.restore());
    for (const { id, offers, options } of cases) {
        if (id === 'empty-offers' || id === 'missing-options') {
            it(`rejects incomplete transformer input for the package's ${id} fixture`, async () => {
                const context = contextFor(placeholder, structuredClone(offers));
                const inputs = id === 'missing-options' ? { ...invocation(), resolveOptions: () => undefined } : invocation();
                await expectFailure(context, inputs, id === 'empty-offers' ? 'No cached offers' : 'resolved options');
            });
            continue;
        }
        it(`preserves exact golden price contents from raw WCS offers for ${id}`, async () => {
            const context = contextFor(placeholder, structuredClone(offers));
            const promotionCode = options.promotionCode ?? '';
            const key = [
                'osi-base',
                options.country.toLowerCase(),
                options.country === 'GB' ? '' : 'mult',
                promotionCode.toLowerCase(),
            ]
                .filter(Boolean)
                .join('-');
            const rawOffers = structuredClone(offers);
            for (const offer of rawOffers) delete offer.planType;
            context.body.wcs.prod = { [key]: rawOffers };
            const resolved = resolvedOptions({ ...options, promotionCodes: [promotionCode], promotionCode });
            await render.process(context, invocation(resolved));
            expect(context.body.fields.description).to.equal(`${wrapper}${golden.results[id]}</span>`);
        });
    }
});
