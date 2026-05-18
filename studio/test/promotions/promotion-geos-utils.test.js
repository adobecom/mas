import { expect } from '@esm-bundle/chai';
import {
    macroRegionForCountry,
    isPznGeoValue,
    normalizeGeosForTagPicker,
    localeCodeFromGeoValue,
    displayLocaleChip,
    groupLocalesForPromotionPicker,
    filterGeosGroupsByQuery,
    flattenMasIdsFromGroups,
    summarizePromotionGeosForDisplayLines,
    GROUP_ORDER,
    PROMOTION_GEOS_PICKER_SURFACE,
} from '../../src/promotions/promotion-geos-utils.js';

function promotionGeosSummaryOneLine(geos) {
    const parts = summarizePromotionGeosForDisplayLines(geos);
    return parts.length ? parts.join(' · ') : '—';
}

describe('macroRegionForCountry', () => {
    it('returns LATAM/Americas for US', () => {
        expect(macroRegionForCountry('US')).to.equal('LATAM/Americas');
    });

    it('returns JAPAC for JP', () => {
        expect(macroRegionForCountry('JP')).to.equal('JAPAC');
    });

    it('returns EMEA for DE', () => {
        expect(macroRegionForCountry('DE')).to.equal('EMEA');
    });

    it('defaults to EMEA for unknown country', () => {
        expect(macroRegionForCountry('XX')).to.equal('EMEA');
    });

    it('defaults to EMEA for null/undefined', () => {
        expect(macroRegionForCountry(null)).to.equal('EMEA');
        expect(macroRegionForCountry(undefined)).to.equal('EMEA');
        expect(macroRegionForCountry('')).to.equal('EMEA');
    });
});

describe('isPznGeoValue', () => {
    it('returns true for /pzn/ path values', () => {
        expect(isPznGeoValue('/content/cq:tags/mas/pzn/us')).to.be.true;
    });

    it('returns true for mas:pzn/ prefix', () => {
        expect(isPznGeoValue('mas:pzn/us')).to.be.true;
    });

    it('returns false for locale values', () => {
        expect(isPznGeoValue('mas:locale/en_US')).to.be.false;
    });

    it('returns false for plain locale codes', () => {
        expect(isPznGeoValue('en_US')).to.be.false;
    });

    it('returns false for null/empty', () => {
        expect(isPznGeoValue(null)).to.be.false;
        expect(isPznGeoValue('')).to.be.false;
        expect(isPznGeoValue(42)).to.be.false;
    });
});

describe('normalizeGeosForTagPicker', () => {
    it('passes through already-namespaced values unchanged', () => {
        expect(normalizeGeosForTagPicker(['mas:locale/en_US'])).to.deep.equal(['mas:locale/en_US']);
    });

    it('passes through CQ tag paths unchanged', () => {
        expect(normalizeGeosForTagPicker(['/content/cq:tags/mas/locale/en_US'])).to.deep.equal([
            '/content/cq:tags/mas/locale/en_US',
        ]);
    });

    it('normalizes plain locale codes to mas:locale/ format', () => {
        expect(normalizeGeosForTagPicker(['en_US', 'fr_FR'])).to.deep.equal(['mas:locale/en_US', 'mas:locale/fr_FR']);
    });

    it('handles null/empty input', () => {
        expect(normalizeGeosForTagPicker(null)).to.deep.equal([]);
        expect(normalizeGeosForTagPicker([])).to.deep.equal([]);
    });

    it('preserves PZN values', () => {
        const input = ['mas:pzn/us', 'en_US'];
        const result = normalizeGeosForTagPicker(input);
        expect(result[0]).to.equal('mas:pzn/us');
        expect(result[1]).to.equal('mas:locale/en_US');
    });
});

describe('localeCodeFromGeoValue', () => {
    it('returns empty string for PZN values', () => {
        expect(localeCodeFromGeoValue('mas:pzn/us')).to.equal('');
    });

    it('returns code as-is for plain locale codes', () => {
        expect(localeCodeFromGeoValue('en_US')).to.equal('en_US');
    });

    it('parses mas:locale/ prefix', () => {
        expect(localeCodeFromGeoValue('mas:locale/en_US')).to.equal('en_US');
    });

    it('parses /locale/ path segments', () => {
        expect(localeCodeFromGeoValue('/content/cq:tags/mas/locale/en_US')).to.equal('en_US');
    });

    it('converts hyphens to underscores in locale code', () => {
        expect(localeCodeFromGeoValue('mas:locale/en-US')).to.equal('en_US');
    });

    it('returns empty string for null/empty', () => {
        expect(localeCodeFromGeoValue(null)).to.equal('');
        expect(localeCodeFromGeoValue('')).to.equal('');
        expect(localeCodeFromGeoValue(42)).to.equal('');
    });

    it('returns empty for unrecognized format', () => {
        expect(localeCodeFromGeoValue('some-random-string')).to.equal('');
    });
});

describe('displayLocaleChip', () => {
    it('returns country_lang format for known locales', () => {
        const chip = displayLocaleChip('en_US');
        expect(chip).to.be.a('string');
        expect(chip.length).to.be.greaterThan(0);
    });

    it('returns the raw code for non-locale-format strings', () => {
        expect(displayLocaleChip('not-a-locale')).to.equal('not-a-locale');
    });
});

describe('groupLocalesForPromotionPicker', () => {
    it('returns groups for the three macro regions', () => {
        const groups = groupLocalesForPromotionPicker(PROMOTION_GEOS_PICKER_SURFACE);
        const names = groups.map((g) => g.name);
        expect(names).to.deep.equal(GROUP_ORDER);
    });

    it('each group has items with code, masId, and country', () => {
        const groups = groupLocalesForPromotionPicker(PROMOTION_GEOS_PICKER_SURFACE);
        for (const group of groups) {
            expect(group.items).to.be.an('array');
            if (group.items.length > 0) {
                const item = group.items[0];
                expect(item).to.have.property('code').that.is.a('string');
                expect(item)
                    .to.have.property('masId')
                    .that.matches(/^mas:locale\//);
                expect(item).to.have.property('country').that.is.a('string');
            }
        }
    });

    it('items within each group are sorted alphabetically', () => {
        const groups = groupLocalesForPromotionPicker(PROMOTION_GEOS_PICKER_SURFACE);
        for (const group of groups) {
            const chips = group.items.map((it) => displayLocaleChip(it.code));
            const sorted = [...chips].sort((a, b) => a.localeCompare(b));
            expect(chips).to.deep.equal(sorted);
        }
    });
});

describe('filterGeosGroupsByQuery', () => {
    const groups = [
        {
            name: 'LATAM/Americas',
            items: [
                { code: 'en_US', masId: 'mas:locale/en_US', country: 'US' },
                { code: 'es_MX', masId: 'mas:locale/es_MX', country: 'MX' },
            ],
        },
        {
            name: 'EMEA',
            items: [{ code: 'fr_FR', masId: 'mas:locale/fr_FR', country: 'FR' }],
        },
    ];

    it('returns all groups when query is empty', () => {
        expect(filterGeosGroupsByQuery(groups, '')).to.deep.equal(groups);
        expect(filterGeosGroupsByQuery(groups, null)).to.deep.equal(groups);
    });

    it('filters items by locale chip text', () => {
        const result = filterGeosGroupsByQuery(groups, 'us');
        expect(result.length).to.be.greaterThan(0);
        const latam = result.find((g) => g.name === 'LATAM/Americas');
        expect(latam).to.exist;
    });

    it('excludes groups with no matching items', () => {
        const result = filterGeosGroupsByQuery(groups, 'fr');
        const names = result.map((g) => g.name);
        expect(names).to.include('EMEA');
        expect(names).to.not.include('LATAM/Americas');
    });

    it('filters by masId', () => {
        const result = filterGeosGroupsByQuery(groups, 'mas:locale/fr_FR');
        expect(result.length).to.equal(1);
        expect(result[0].name).to.equal('EMEA');
    });
});

describe('flattenMasIdsFromGroups', () => {
    it('returns all masIds from all groups', () => {
        const groups = [
            { name: 'A', items: [{ masId: 'mas:locale/en_US' }, { masId: 'mas:locale/es_MX' }] },
            { name: 'B', items: [{ masId: 'mas:locale/fr_FR' }] },
        ];
        expect(flattenMasIdsFromGroups(groups)).to.deep.equal(['mas:locale/en_US', 'mas:locale/es_MX', 'mas:locale/fr_FR']);
    });

    it('returns empty array for empty groups', () => {
        expect(flattenMasIdsFromGroups([])).to.deep.equal([]);
    });
});

describe('summarizePromotionGeosForDisplayLines', () => {
    it('returns empty array for empty geos', () => {
        expect(summarizePromotionGeosForDisplayLines([])).to.deep.equal([]);
        expect(summarizePromotionGeosForDisplayLines(null)).to.deep.equal([]);
    });

    it('returns one entry per macro region in GROUP_ORDER', () => {
        const geos = ['mas:locale/en_US', 'mas:locale/fr_FR', 'mas:locale/en_AU'];
        const lines = summarizePromotionGeosForDisplayLines(geos);
        expect(lines).to.have.lengthOf(3);
        expect(lines[0]).to.match(/^LATAM\/Americas:/);
        expect(lines[1]).to.match(/^JAPAC:/);
        expect(lines[2]).to.match(/^EMEA:/);
    });
});

describe('promotionGeosSummaryOneLine (from summarizePromotionGeosForDisplayLines)', () => {
    it('returns em dash for empty geos', () => {
        expect(promotionGeosSummaryOneLine([])).to.equal('—');
        expect(promotionGeosSummaryOneLine(null)).to.equal('—');
    });

    it('groups geos by macro region with dot separator', () => {
        const geos = ['mas:locale/en_US', 'mas:locale/fr_FR'];
        const result = promotionGeosSummaryOneLine(geos);
        expect(result).to.be.a('string');
        expect(result.length).to.be.greaterThan(0);
        expect(result).to.not.equal('—');
    });

    it('skips PZN values in summary', () => {
        const geos = ['mas:pzn/us', 'mas:locale/en_US'];
        const result = promotionGeosSummaryOneLine(geos);
        expect(result).to.not.include('pzn');
    });

    it('deduplicates chips within a region', () => {
        const geos = ['mas:locale/en_US', 'mas:locale/en_US'];
        const result = promotionGeosSummaryOneLine(geos);
        const usChip = result.match(/US_en/g);
        expect(usChip?.length ?? 0).to.be.at.most(1);
    });
});
