const { expect } = require('chai');
const proxyquire = require('proxyquire');

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
