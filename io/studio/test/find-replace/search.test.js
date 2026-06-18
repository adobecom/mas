const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

function fetchResponse(body) {
    return { ok: true, status: 200, statusText: 'OK', json: async () => body };
}

const commonStub = { fetchOdin: async () => ({}), getValues: () => null };
const load = (overrides = {}) =>
    proxyquire('../../src/find-replace/search.js', { '../common.js': { ...commonStub, ...overrides } });

const { matchesText } = load();

describe('find-replace/search: matchesText', () => {
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

describe('find-replace/search: extractLocale', () => {
    const { extractLocale } = load();
    it('pulls the locale segment from a mas fragment path', () => {
        expect(extractLocale('/content/dam/mas/acom/en_US/photoshop-abm')).to.equal('en_US');
    });
    it('returns null when the path does not match', () => {
        expect(extractLocale('/some/other/path')).to.equal(null);
        expect(extractLocale()).to.equal(null);
    });
});

describe('find-replace/search: findMatches', () => {
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
        expect(svc.findMatches(fragment, 'calloutText', 'assistant', false))
            .to.deep.equal([{ field: 'calloutText', value: '<p>AI Assistant add-on</p>' }]);
    });
    it('matches button text inside the ctas field', () => {
        const m = svc.findMatches(fragment, 'buttonText', 'buy now', false);
        expect(m).to.have.lengthOf(1);
        expect(m[0].field).to.equal('buttonText');
    });
    it('matches the fragment top-level title', () => {
        expect(svc.findMatches(fragment, 'fragmentTitle', 'all apps', false))
            .to.deep.equal([{ field: 'fragmentTitle', value: 'CCD Slice Wide CC All Apps' }]);
    });
    it('matches a tag id under the tags scope', () => {
        expect(svc.findMatches(fragment, 'tags', 'plan_type/abm', false))
            .to.deep.equal([{ field: 'tags', value: 'mas:plan_type/abm' }]);
    });
    it('everywhere scans all fields plus title/description', () => {
        const fieldsHit = svc.findMatches(fragment, 'everywhere', 'school', false).map((x) => x.field);
        expect(fieldsHit).to.include('subtitle');
        expect(fieldsHit).to.include('description');
    });
    it('returns [] for an unknown scope', () => {
        expect(svc.findMatches(fragment, 'bogus', 'x', false)).to.deep.equal([]);
    });
});

describe('find-replace/search: buildSearchQuery', () => {
    const svc = load();
    it('searches the whole surface when no locale given', () => {
        const q = svc.buildSearchQuery({ surface: 'acom', find: 'school' });
        expect(q.filter.path).to.equal('/content/dam/mas/acom');
        expect(q.filter.fullText).to.deep.equal({ text: 'school', queryMode: 'EDGES' });
        expect(q.sort).to.deep.equal([{ on: 'created', order: 'ASC' }]);
    });
    it('narrows the path to a locale when given', () => {
        expect(svc.buildSearchQuery({ surface: 'acom', locale: 'de_DE', find: 'x' }).filter.path)
            .to.equal('/content/dam/mas/acom/de_DE');
    });
    it('adds tags and status filters when provided', () => {
        const q = svc.buildSearchQuery({
            surface: 'acom', find: 'x',
            tags: ['mas:customer_segment/individual'], status: 'PUBLISHED',
        });
        expect(q.filter.tags).to.deep.equal(['mas:customer_segment/individual']);
        expect(q.filter.status).to.deep.equal(['PUBLISHED']);
    });
    it('omits fullText when find is empty', () => {
        expect(svc.buildSearchQuery({ surface: 'acom', find: '' }).filter.fullText).to.equal(undefined);
    });
});

describe('find-replace/search: searchCandidates', () => {
    it('follows cursors and yields every item', async () => {
        const fetchOdinStub = sinon.stub();
        fetchOdinStub.onCall(0).resolves(fetchResponse({ items: [{ id: 'a' }], cursor: 'c1' }));
        fetchOdinStub.onCall(1).resolves(fetchResponse({ items: [{ id: 'b' }], cursor: null }));
        const mod = load({ fetchOdin: fetchOdinStub });

        const ids = [];
        for await (const item of mod.searchCandidates({
            odinEndpoint: 'https://odin.example', authToken: 't',
            query: { sort: [], filter: { path: '/content/dam/mas/acom' } }, limit: 50,
        })) {
            ids.push(item.id);
        }

        expect(ids).to.deep.equal(['a', 'b']);
        expect(fetchOdinStub.callCount).to.equal(2);
        expect(fetchOdinStub.getCall(0).args[1]).to.contain('/adobe/sites/cf/fragments/search?');
        expect(fetchOdinStub.getCall(0).args[1]).to.contain('query=');
        expect(fetchOdinStub.getCall(1).args[1]).to.contain('cursor=c1');
    });
});

describe('find-replace/search: runSearch', () => {
    it('returns only fragments whose scoped field matches, in the result shape', async () => {
        const items = [
            { id: 'f1', path: '/content/dam/mas/acom/en_US/a', title: 'A', status: 'PUBLISHED', etag: 'e1',
              fields: [{ name: 'subtitle', values: ['Back to school'] }] },
            { id: 'f2', path: '/content/dam/mas/acom/en_US/b', title: 'B', status: 'DRAFT', etag: 'e2',
              fields: [{ name: 'subtitle', values: ['Nothing here'] }] },
        ];
        const fetchOdinStub = sinon.stub().resolves(fetchResponse({ items, cursor: null }));
        const getValues = (fragment, name) => {
            const f = (fragment.fields || []).find((x) => x.name === name);
            return f ? { values: f.values, path: `/fields/${name}` } : null;
        };
        const mod = load({ fetchOdin: fetchOdinStub, getValues });

        const result = await mod.runSearch({
            odinEndpoint: 'https://odin.example', authToken: 't',
            surface: 'acom', find: 'school', searchIn: 'subtitle', matchCase: false,
        });

        expect(result.total).to.equal(1);
        expect(result.items).to.deep.equal([{
            id: 'f1', path: '/content/dam/mas/acom/en_US/a', locale: 'en_US',
            title: 'A', status: 'PUBLISHED', etag: 'e1',
            matches: [{ field: 'subtitle', value: 'Back to school' }],
        }]);
    });
});
