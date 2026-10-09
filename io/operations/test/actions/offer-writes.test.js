import { expect } from 'chai';
import { Ims } from '@adobe/aio-lib-ims';
import stateLib from '@adobe/aio-lib-state';
import { main as link } from '../../src/actions/link-card-to-offer.js';
import { main as release } from '../../src/actions/create-release-cards.js';
import { main as update } from '../../src/actions/update-card.js';
const selector = 'AYWFYb2BjlsnXgYwWJzBPN2anVXjJPsDtW49Ozqb1Qw';
const offerId = 'F5B3D59867BC5B6020EFA0763C3AE92A';
const params = {
    AEM_BASE_URL: 'https://aem.example.com',
    AOS_URL: 'https://aos.example.com',
    AOS_API_KEY: 'test',
    __ow_headers: { authorization: 'Bearer test' },
};
const product = { offer_id: offerId, product_arrangement_code: 'firefly', merchandising: { copy: { name: 'Firefly' } } };
const fragment = {
    id: 'card',
    title: 'Firefly',
    path: '/content/dam/mas/acom/en_US/card',
    fields: [
        { name: 'osi', values: ['old'] },
        { name: 'mnemonicIcon', values: ['icon.svg'] },
    ],
};
describe('offer writes validate AOS before mutation', () => {
    let originalFetch;
    let originalValidate;
    let originalInit;
    let offers;
    let writes;
    let wcsOffers;
    let requireArrangement;
    beforeEach(() => {
        originalFetch = globalThis.fetch;
        originalValidate = Ims.prototype.validateTokenAllowList;
        originalInit = stateLib.init;
        Ims.prototype.validateTokenAllowList = async () => ({ valid: true });
        stateLib.init = async () => ({
            get: async () => ({
                value: JSON.stringify([{ userPrincipalName: 'caller@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]),
            }),
        });
        offers = [product];
        writes = [];
        wcsOffers = [{ offerSelectorIds: [selector], offerId }];
        requireArrangement = false;
        globalThis.fetch = async (input, init = {}) => {
            const url = new URL(input);
            if (url.hostname === 'www.adobe.com') return new Response(JSON.stringify({ resolvedOffers: wcsOffers }));
            if (url.hostname === 'aos.example.com')
                return new Response(
                    JSON.stringify(requireArrangement && url.searchParams.get('arrangement_code') !== 'firefly' ? [] : offers),
                );
            if (url.hostname.includes('adobelogin')) return new Response(JSON.stringify({ email: 'caller@adobe.com' }));
            if (url.pathname.includes('csrf')) return new Response(JSON.stringify({ token: 'csrf' }));
            if (init.method && init.method !== 'GET') writes.push(JSON.parse(init.body || '{}'));
            return new Response(JSON.stringify(init.method === 'PUT' ? { ...fragment, ...writes.at(-1) } : fragment), {
                headers: { Etag: 'etag' },
            });
        };
    });
    afterEach(() => {
        globalThis.fetch = originalFetch;
        Ims.prototype.validateTokenAllowList = originalValidate;
        stateLib.init = originalInit;
    });
    for (const action of ['link', 'update', 'release']) {
        it(`rejects coherent unfiltered AOS responses for ${action}`, async () => {
            wcsOffers = [{ offerSelectorIds: ['differentSelector'], offerId }];
            const result =
                action === 'link'
                    ? await link({ ...params, cardId: 'card', offerSelectorId: selector })
                    : action === 'update'
                      ? await update({ ...params, id: 'card', fields: { osi: selector } })
                      : await release({
                            ...params,
                            arrangement_code: 'firefly',
                            variants: ['plans'],
                            parentPath: '/content/dam/mas/acom/en_US',
                            osi: selector,
                        });
            expect(writes).to.deep.equal([]);
            expect(result.statusCode).to.equal(400);
        });
    }
    it('rejects AOS metadata whose offer identity is absent from WCS', async () => {
        wcsOffers = [{ offerSelectorIds: [selector], offerId: 'A'.repeat(32) }];
        const result = await link({ ...params, cardId: 'card', offerSelectorId: selector });
        expect(writes).to.deep.equal([]);
        expect(result.statusCode).to.equal(400);
    });
    it('uses the known arrangement to resolve raw offer ids during release', async () => {
        requireArrangement = true;
        const result = await release({
            ...params,
            arrangement_code: 'firefly',
            variants: ['plans'],
            parentPath: '/content/dam/mas/acom/en_US',
            osi: offerId,
        });
        expect(result.statusCode).to.equal(200);
        expect(writes[0].fields.find((field) => field.name === 'osi').values).to.deep.equal([offerId]);
    });
    it('does not link an unresolved selector', async () => {
        offers = [];
        const result = await link({ ...params, cardId: 'card', offerSelectorId: selector });
        expect(writes).to.deep.equal([]);
        expect(result.statusCode).to.equal(400);
    });
    it('links osi while preserving mnemonicIcon', async () => {
        const result = await link({ ...params, cardId: 'card', offerSelectorId: selector });
        expect(result.statusCode).to.equal(200);
        expect(writes[0].fields.find((field) => field.name === 'osi').values).to.deep.equal([selector]);
        expect(writes[0].fields.find((field) => field.name === 'mnemonicIcon').values).to.deep.equal(['icon.svg']);
    });
    it('does not release cards for another arrangement', async () => {
        const result = await release({
            ...params,
            arrangement_code: 'photoshop',
            variants: ['plans'],
            parentPath: '/content/dam/mas/acom/en_US',
            osi: selector,
        });
        expect(writes).to.deep.equal([]);
        expect(result.statusCode).to.equal(400);
    });
    for (const fields of [
        { osi: selector },
        { prices: `<span data-wcs-osi="${selector}"></span>` },
        { ctas: `<a data-wcs-osi='${selector}'>Buy</a>` },
        { description: `<span data-wcs-osi=${selector}></span>` },
    ]) {
        it(`rejects unresolved selectors in ${Object.keys(fields)[0]}`, async () => {
            offers = [];
            const result = await update({ ...params, id: 'card', fields });
            expect(writes).to.deep.equal([]);
            expect(result.statusCode).to.equal(400);
        });
    }
    it('permits clearing osi', async () => {
        offers = [];
        const result = await update({ ...params, id: 'card', fields: { osi: [] } });
        expect(result.statusCode).to.equal(200);
        expect(writes[0].fields.find((field) => field.name === 'osi').values).to.deep.equal([]);
    });
    it('preserves title-only updates with null fields', async () => {
        const result = await update({ ...params, id: 'card', title: 'New title', fields: null });
        expect(result.statusCode).to.equal(200);
        expect(writes[0].title).to.equal('New title');
        expect(writes[0].fields.find((field) => field.name === 'osi').values).to.deep.equal(['old']);
    });
    it('validates every bundle selector in array HTML fields', async () => {
        const result = await update({
            ...params,
            id: 'card',
            fields: { ctas: [`<a data-wcs-osi="${selector},bogus!">Buy</a>`] },
        });
        expect(writes).to.deep.equal([]);
        expect(result.statusCode).to.equal(400);
    });
    it('preserves verified bundle selectors in HTML', async () => {
        const html = `<a data-wcs-osi="${selector},${offerId}">Buy</a>`;
        const result = await update({ ...params, id: 'card', fields: { ctas: [html] } });
        expect(result.statusCode).to.equal(200);
        expect(writes[0].fields.find((field) => field.name === 'ctas').values).to.deep.equal([html]);
    });
    it('creates release cards with validated osi and checkout HTML', async () => {
        const result = await release({
            ...params,
            arrangement_code: 'firefly',
            variants: ['plans'],
            parentPath: '/content/dam/mas/acom/en_US',
            osi: selector,
        });
        expect(result.statusCode).to.equal(200);
        expect(writes[0].fields.find((field) => field.name === 'osi').values).to.deep.equal([selector]);
        expect(writes[0].fields.find((field) => field.name === 'ctas').values[0]).to.include(`data-wcs-osi="${selector}"`);
    });

    it('builds trial and buy CTAs from their own OSIs when a trialOsi is supplied', async () => {
        const trialSelector = 'TR1ALxbVYb2BjlsnXgYwWJzBPN2anVXjJPsDtW49Ozqb';
        wcsOffers = [{ offerSelectorIds: [selector, trialSelector], offerId }];
        const result = await release({
            ...params,
            arrangement_code: 'firefly',
            variants: ['catalog'],
            parentPath: '/content/dam/mas/acom/en_US',
            osi: selector,
            trialOsi: trialSelector,
        });
        expect(result.statusCode).to.equal(200);
        const ctas = writes[0].fields.find((field) => field.name === 'ctas').values[0];
        expect(ctas).to.include('>Free trial<');
        expect(ctas).to.include(`data-wcs-osi="${trialSelector}"`);
        expect(ctas).to.include(`data-wcs-osi="${selector}"`);
    });

    it('rejects a non-string variant before creating any card', async () => {
        const result = await release({
            ...params,
            arrangement_code: 'firefly',
            variants: ['plans', 42],
            parentPath: '/content/dam/mas/acom/en_US',
            osi: selector,
        });
        expect(result.statusCode).to.equal(400);
        expect(writes).to.deep.equal([]);
    });
    it('updates verified osi fields', async () => {
        const result = await update({ ...params, id: 'card', fields: { osi: selector } });
        expect(result.statusCode).to.equal(200);
        expect(writes[0].fields.find((field) => field.name === 'osi').values).to.deep.equal([selector]);
    });
    it('rejects raw offer id when the lookup returns another offer', async () => {
        offers = [{ ...product, offer_id: 'A'.repeat(32) }];
        const result = await link({ ...params, cardId: 'card', offerSelectorId: offerId });
        expect(writes).to.deep.equal([]);
        expect(result.statusCode).to.equal(400);
    });
    it('accepts an exact raw offer id', async () => {
        const result = await link({ ...params, cardId: 'card', offerSelectorId: offerId });
        expect(result.statusCode).to.equal(200);
        expect(writes[0].fields.find((field) => field.name === 'osi').values).to.deep.equal([offerId]);
    });
});
