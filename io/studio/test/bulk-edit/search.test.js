const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

function fetchResponse(body) {
    return { ok: true, status: 200, statusText: 'OK', json: async () => body };
}

const { CARD_MODEL_ID, COLLECTION_MODEL_ID } = require('../../src/common.js');
const commonStub = { fetchOdin: async () => ({}), getValues: () => null, CARD_MODEL_ID, COLLECTION_MODEL_ID };
const load = (overrides = {}) =>
    proxyquire('../../src/bulk-edit/search.js', { '../common.js': { ...commonStub, ...overrides } });

const { matchesText } = load();

describe('bulk-edit/search: matchesText', () => {
    it('matches a case-insensitive substring by default', () => {
        expect(matchesText('Back to School sale', 'school', false)).to.equal(true);
    });
    it('is case-sensitive when matchCase is true', () => {
        expect(matchesText('Back to School sale', 'school', true)).to.equal(false);
        expect(matchesText('Back to School sale', 'School', true)).to.equal(true);
    });
    it('returns false for null/undefined values', () => {
        expect(matchesText(null, 'x', false)).to.equal(false);
        expect(matchesText(undefined, 'x', false)).to.equal(false);
    });
});

describe('bulk-edit/search: extractLocale', () => {
    const { extractLocale } = load();
    it('pulls the locale segment from a mas fragment path', () => {
        expect(extractLocale('/content/dam/mas/sandbox/en_US/photoshop-abm')).to.equal('en_US');
    });
    it('returns null when the path does not match', () => {
        expect(extractLocale('/some/other/path')).to.equal(null);
        expect(extractLocale()).to.equal(null);
    });
});

describe('bulk-edit/search: findMatches', () => {
    const getValues = (fragment, name) => {
        const f = (fragment.fields || []).find((x) => x.name === name);
        return f ? { values: f.values, path: `/fields/${name}` } : null;
    };
    const svc = load({ getValues });

    const fragment = {
        title: 'CCD Slice Wide CC All Apps',
        description: 'Top-level fragment description with School in it',
        fields: [
            { name: 'subtitle', values: ['Best for school'] },
            { name: 'callout', values: ['<p>AI Assistant add-on</p>'] },
            { name: 'ctas', values: ['<a class="accent">Buy now</a>'] },
            { name: 'tags', values: ['mas:plan_type/abm', 'mas:offer_type/base'] },
        ],
    };

    it('matches a single mapped field (calloutText -> callout)', () => {
        expect(svc.findMatches(fragment, 'calloutText', 'assistant', false)).to.deep.equal([
            { field: 'callout', value: '<p>AI Assistant add-on</p>' },
        ]);
    });
    it('matches button text inside the ctas field', () => {
        const m = svc.findMatches(fragment, 'ctas', 'buy now', false);
        expect(m).to.have.lengthOf(1);
        expect(m[0].field).to.equal('ctas');
    });
    it('matches features, compareChart, and cardTitle under productDescription', () => {
        const withProductFields = {
            title: '',
            description: '',
            fields: [
                { name: 'cardTitle', values: ['Adobe Firefly Pro'] },
                { name: 'features', values: ['<p>firefly is good</p>'] },
                { name: 'compareChart', values: ['<div>Adobe Firefly Pro column</div>'] },
            ],
        };
        expect(svc.findMatches(withProductFields, 'productDescription', 'firefly', false)).to.deep.equal([
            { field: 'cardTitle', value: 'Adobe Firefly Pro' },
            { field: 'features', value: '<p>firefly is good</p>' },
            { field: 'compareChart', value: '<div>Adobe Firefly Pro column</div>' },
        ]);
    });
    it('matches fragment title via the fragmentTitle scope', () => {
        expect(svc.findMatches(fragment, 'fragmentTitle', 'all apps', false)).to.deep.equal([
            { field: 'fragmentTitle', value: 'CCD Slice Wide CC All Apps' },
        ]);
    });
    it('everywhere scans scoped fields only, not arbitrary fragment fields', () => {
        const withIcon = {
            ...fragment,
            fields: [
                ...fragment.fields,
                { name: 'mnemonicIcon', values: ['https://example.com/firefly.svg'] },
                { name: 'cardTitle', values: ['Adobe Firefly card'] },
            ],
        };
        const fieldsHit = svc.findMatches(withIcon, '*', 'firefly', false).map((x) => x.field);
        expect(fieldsHit).to.not.include('mnemonicIcon');
        expect(fieldsHit).to.include('cardTitle');
        expect(fieldsHit).to.not.include('productDescription');
    });
    it('everywhere scans scoped fields, fragment description, and fragment title but not fragment name', () => {
        const fieldsHit = svc.findMatches(fragment, '*', 'school', false).map((x) => x.field);
        expect(fieldsHit).to.include('subtitle');
        expect(fieldsHit).to.include('fragmentDescription');
        expect(fieldsHit).to.not.include('name');
    });
    it('everywhere matches fragment title when it is the only hit', () => {
        const titleOnly = { title: 'firefly card', name: 'firefly-card-slug', description: '', fields: [] };
        expect(svc.findMatches(titleOnly, '*', 'firefly', false)).to.deep.equal([
            { field: 'fragmentTitle', value: 'firefly card' },
        ]);
    });
    it('does not match top-level fragment name or the name field', () => {
        const byName = {
            title: 'Display title',
            name: 'internal-slug',
            description: '',
            fields: [{ name: 'name', values: ['card-node-name'] }],
        };
        expect(svc.findMatches(byName, '*', 'internal-slug', false)).to.deep.equal([]);
        expect(svc.findMatches(byName, '*', 'card-node-name', false)).to.deep.equal([]);
        expect(svc.findMatches(byName, 'fragmentTitle', 'Display', false)).to.deep.equal([
            { field: 'fragmentTitle', value: 'Display title' },
        ]);
    });
    it('matches a tag id under the tags scope', () => {
        expect(svc.findMatches(fragment, 'tags', 'plan_type/abm', false)).to.deep.equal([
            { field: 'tags', value: 'mas:plan_type/abm' },
        ]);
    });
    it('everywhere yields at most one match per field even with multiple matching values', () => {
        const multiValueFragment = {
            title: '',
            description: '',
            fields: [{ name: 'subtitle', values: ['school sale', 'back to school'] }],
        };
        const m = svc.findMatches(multiValueFragment, '*', 'school', false);
        expect(m).to.deep.equal([{ field: 'subtitle', value: 'school sale' }]);
    });
    it('returns [] for an unknown scope', () => {
        expect(svc.findMatches(fragment, 'bogus', 'x', false)).to.deep.equal([]);
    });
    it('matches across multiple scoped fields', () => {
        expect(svc.findMatches(fragment, ['subtitle', 'calloutText'], 'school', false)).to.deep.equal([
            { field: 'subtitle', value: 'Best for school' },
        ]);
    });
    it('combines hits from multiple scopes', () => {
        const fieldsHit = svc.findMatches(fragment, ['subtitle', 'fragmentDescription'], 'school', false).map((x) => x.field);
        expect(fieldsHit).to.include('subtitle');
        expect(fieldsHit).to.include('fragmentDescription');
    });
    it('treats * in a scope array as everywhere', () => {
        const fieldsHit = svc.findMatches(fragment, ['*', 'subtitle'], 'school', false).map((x) => x.field);
        expect(fieldsHit).to.include('subtitle');
        expect(fieldsHit).to.include('fragmentDescription');
    });
    it('ignores unknown scopes but still matches known ones', () => {
        expect(svc.findMatches(fragment, ['bogus', 'subtitle'], 'school', false)).to.deep.equal([
            { field: 'subtitle', value: 'Best for school' },
        ]);
    });
});

describe('bulk-edit/search: buildSearchQuery', () => {
    const svc = load();
    it('searches the whole surface when no locale given', () => {
        const q = svc.buildSearchQuery({ path: '/content/dam/mas/sandbox', find: 'school' });
        expect(q.filter.path).to.equal('/content/dam/mas/sandbox');
        expect(q.filter.fullText).to.deep.equal({ text: 'school', queryMode: 'EDGES' });
        expect(q.filter.modelIds).to.deep.equal(svc.BULK_EDIT_MODEL_IDS);
        expect(q.sort).to.deep.equal([{ on: 'created', order: 'ASC' }]);
    });
    it('narrows the path to a locale when given', () => {
        expect(svc.buildSearchQuery({ path: '/content/dam/mas/sandbox/de_DE', find: 'x' }).filter.path).to.equal(
            '/content/dam/mas/sandbox/de_DE',
        );
    });
    it('adds tags and status filters when provided', () => {
        const q = svc.buildSearchQuery({
            surface: 'sandbox',
            find: 'x',
            tags: ['mas:customer_segment/individual'],
            status: 'PUBLISHED',
        });
        expect(q.filter.tags).to.deep.equal(['mas:customer_segment/individual']);
        expect(q.filter.status).to.deep.equal(['PUBLISHED']);
    });
    it('omits fullText when find is empty', () => {
        expect(svc.buildSearchQuery({ path: '/content/dam/mas/sandbox', find: '' }).filter.fullText).to.equal(undefined);
    });
    it('does not double-wrap an array status', () => {
        const q = svc.buildSearchQuery({ surface: 'sandbox', find: 'x', status: ['PUBLISHED'] });
        expect(q.filter.status).to.deep.equal(['PUBLISHED']);
    });
    it('omits status when given an empty array', () => {
        expect(svc.buildSearchQuery({ surface: 'sandbox', find: 'x', status: [] }).filter.status).to.equal(undefined);
    });
});

describe('bulk-edit/search: invalidSearchScopes', () => {
    const { invalidSearchScopes, VALID_SEARCH_SCOPES } = load();
    it('exposes the logical scope keys plus wildcard', () => {
        expect(VALID_SEARCH_SCOPES).to.include.members(['productDescription', 'fragmentTitle', '*']);
    });
    it('returns no invalid scopes for valid keys or wildcard', () => {
        expect(invalidSearchScopes('*')).to.deep.equal([]);
        expect(invalidSearchScopes('productDescription')).to.deep.equal([]);
        expect(invalidSearchScopes(['fragmentTitle', 'prices'])).to.deep.equal([]);
        expect(invalidSearchScopes(null)).to.deep.equal([]);
    });
    it('flags an Odin field name that is not a logical scope key', () => {
        expect(invalidSearchScopes('cardTitle')).to.deep.equal(['cardTitle']);
        expect(invalidSearchScopes(['prices', 'cardTitle'])).to.deep.equal(['cardTitle']);
    });
});

describe('bulk-edit/search: normalizeLocales', () => {
    const { normalizeLocales } = load();
    it('returns null for missing or wildcard locale', () => {
        expect(normalizeLocales(null)).to.equal(null);
        expect(normalizeLocales('')).to.equal(null);
        expect(normalizeLocales('*')).to.equal(null);
        expect(normalizeLocales(['*'])).to.equal(null);
    });
    it('normalizes a single locale to a one-item array', () => {
        expect(normalizeLocales('en_US')).to.deep.equal(['en_US']);
    });
    it('dedupes and sorts multiple locales', () => {
        expect(normalizeLocales(['fr_FR', 'en_US', 'fr_FR'])).to.deep.equal(['en_US', 'fr_FR']);
    });
});

describe('bulk-edit/search: buildSearchPaths', () => {
    const { buildSearchPaths } = load();
    it('searches the whole surface when no locale is given', () => {
        expect(buildSearchPaths('sandbox', null)).to.deep.equal(['/content/dam/mas/sandbox']);
    });
    it('builds one path per locale', () => {
        expect(buildSearchPaths('sandbox', ['fr_FR', 'en_US'])).to.deep.equal([
            '/content/dam/mas/sandbox/en_US',
            '/content/dam/mas/sandbox/fr_FR',
        ]);
    });
    it('builds a single locale path from a string', () => {
        expect(buildSearchPaths('sandbox', 'de_DE')).to.deep.equal(['/content/dam/mas/sandbox/de_DE']);
    });
});

describe('bulk-edit/search: searchPages', () => {
    const searchParams = {
        odinEndpoint: 'https://odin.example',
        authToken: 't',
        query: { sort: [], filter: { path: '/content/dam/mas/sandbox' } },
        limit: 50,
    };

    async function collectIds(searchPages, params = searchParams) {
        const ids = [];
        for await (const page of searchPages(params)) {
            ids.push(...page.map((i) => i.id));
        }
        return ids;
    }

    it('follows cursors and yields every item', async () => {
        const fetchOdinStub = sinon.stub();
        fetchOdinStub.onCall(0).resolves(fetchResponse({ items: [{ id: 'a' }], cursor: 'c1' }));
        fetchOdinStub.onCall(1).resolves(fetchResponse({ items: [{ id: 'b' }], cursor: null }));
        const mod = load({ fetchOdin: fetchOdinStub });

        const ids = await collectIds(mod.searchPages);

        expect(ids).to.deep.equal(['a', 'b']);
        expect(fetchOdinStub.callCount).to.equal(2);
        expect(fetchOdinStub.getCall(0).args[1]).to.contain('/adobe/sites/cf/fragments/search?');
        expect(fetchOdinStub.getCall(0).args[1]).to.contain('query=');
        expect(fetchOdinStub.getCall(1).args[1]).to.contain('cursor=c1');
    });

    it('sends the bulk-edit User-Agent on recall requests', async () => {
        const fetchOdinStub = sinon.stub();
        fetchOdinStub.onCall(0).resolves(fetchResponse({ items: [{ id: 'a' }], cursor: null }));
        const mod = load({ fetchOdin: fetchOdinStub });

        await collectIds(mod.searchPages);

        expect(fetchOdinStub.getCall(0).args[3]).to.deep.equal({ userAgent: 'mas-bulk-edit' });
    });

    it('propagates fetchOdin errors', async () => {
        const fetchOdinStub = sinon.stub();
        fetchOdinStub.rejects(new Error('GET /adobe/sites/cf/fragments/search failed with status 401: Unauthorized'));
        const mod = load({ fetchOdin: fetchOdinStub });

        let error;
        try {
            await collectIds(mod.searchPages);
        } catch (e) {
            error = e;
        }

        expect(error).to.be.an.instanceOf(Error);
        expect(error.message).to.include('status 401');
        expect(fetchOdinStub.callCount).to.equal(1);
    });
});
