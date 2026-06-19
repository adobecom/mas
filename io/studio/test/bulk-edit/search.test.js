const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

function fetchResponse(body) {
    return { ok: true, status: 200, statusText: 'OK', json: async () => body };
}

const commonStub = { fetchOdin: async () => ({}), getValues: () => null };
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
        expect(extractLocale('/content/dam/mas/acom/en_US/photoshop-abm')).to.equal('en_US');
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
            { field: 'calloutText', value: '<p>AI Assistant add-on</p>' },
        ]);
    });
    it('matches button text inside the ctas field', () => {
        const m = svc.findMatches(fragment, 'buttonText', 'buy now', false);
        expect(m).to.have.lengthOf(1);
        expect(m[0].field).to.equal('buttonText');
    });
    it('matches the fragment top-level title', () => {
        expect(svc.findMatches(fragment, 'fragmentTitle', 'all apps', false)).to.deep.equal([
            { field: 'fragmentTitle', value: 'CCD Slice Wide CC All Apps' },
        ]);
    });
    it('matches a tag id under the tags scope', () => {
        expect(svc.findMatches(fragment, 'tags', 'plan_type/abm', false)).to.deep.equal([
            { field: 'tags', value: 'mas:plan_type/abm' },
        ]);
    });
    it('everywhere scans all fields plus title/description', () => {
        const fieldsHit = svc.findMatches(fragment, '*', 'school', false).map((x) => x.field);
        expect(fieldsHit).to.include('subtitle');
        expect(fieldsHit).to.include('description');
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
        expect(fieldsHit).to.include('description');
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
        const q = svc.buildSearchQuery({ path: '/content/dam/mas/acom', find: 'school' });
        expect(q.filter.path).to.equal('/content/dam/mas/acom');
        expect(q.filter.fullText).to.deep.equal({ text: 'school', queryMode: 'EDGES' });
        expect(q.filter.modelIds).to.deep.equal(svc.BULK_EDIT_MODEL_IDS);
        expect(q.sort).to.deep.equal([{ on: 'created', order: 'ASC' }]);
    });
    it('narrows the path to a locale when given', () => {
        expect(svc.buildSearchQuery({ path: '/content/dam/mas/acom/de_DE', find: 'x' }).filter.path).to.equal(
            '/content/dam/mas/acom/de_DE',
        );
    });
    it('adds tags and status filters when provided', () => {
        const q = svc.buildSearchQuery({
            surface: 'acom',
            find: 'x',
            tags: ['mas:customer_segment/individual'],
            status: 'PUBLISHED',
        });
        expect(q.filter.tags).to.deep.equal(['mas:customer_segment/individual']);
        expect(q.filter.status).to.deep.equal(['PUBLISHED']);
    });
    it('omits fullText when find is empty', () => {
        expect(svc.buildSearchQuery({ path: '/content/dam/mas/acom', find: '' }).filter.fullText).to.equal(undefined);
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
        expect(buildSearchPaths('acom', null)).to.deep.equal(['/content/dam/mas/acom']);
    });
    it('builds one path per locale', () => {
        expect(buildSearchPaths('acom', ['fr_FR', 'en_US'])).to.deep.equal([
            '/content/dam/mas/acom/en_US',
            '/content/dam/mas/acom/fr_FR',
        ]);
    });
    it('builds a single locale path from a string', () => {
        expect(buildSearchPaths('acom', 'de_DE')).to.deep.equal(['/content/dam/mas/acom/de_DE']);
    });
});

describe('bulk-edit/search: searchPages', () => {
    const searchParams = {
        odinEndpoint: 'https://odin.example',
        authToken: 't',
        query: { sort: [], filter: { path: '/content/dam/mas/acom' } },
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

    it('retries on 429 and succeeds on the second attempt', async () => {
        const fetchOdinStub = sinon.stub();
        fetchOdinStub.onFirstCall().rejects(new Error('GET /adobe/sites/cf/fragments/search failed with status 429: Too Many Requests'));
        fetchOdinStub.onSecondCall().resolves(fetchResponse({ items: [{ id: 'a' }], cursor: null }));
        const mod = load({ fetchOdin: fetchOdinStub });

        const clock = sinon.useFakeTimers();
        const promise = collectIds(mod.searchPages);
        await clock.tickAsync(2000);
        const ids = await promise;
        clock.restore();

        expect(ids).to.deep.equal(['a']);
        expect(fetchOdinStub.callCount).to.equal(2);
    });

    it('does not retry on non-retryable 401', async () => {
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

    it('retries on 500 until maxRetries then throws', async () => {
        const fetchOdinStub = sinon.stub();
        fetchOdinStub.rejects(new Error('GET /adobe/sites/cf/fragments/search failed with status 500: Internal Server Error'));
        const mod = load({ fetchOdin: fetchOdinStub });

        const clock = sinon.useFakeTimers();
        let error;
        const run = collectIds(mod.searchPages, { ...searchParams, maxRetries: 3 }).catch((e) => {
            error = e;
        });
        await clock.tickAsync(10000);
        await run;
        clock.restore();

        expect(error).to.be.an.instanceOf(Error);
        expect(error.message).to.include('status 500');
        expect(fetchOdinStub.callCount).to.equal(3);
    });
});
