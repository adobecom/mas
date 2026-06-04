import { expect } from '@esm-bundle/chai';
import {
    CARD_MODEL_PATH,
    COLLECTION_MODEL_PATH,
    COMPARE_CHART_FIELD,
    TAG_MERCH_CARD,
    TAG_COMPARE_CHART,
    TAG_MERCH_CARD_COLLECTION,
    TAG_MODEL_ID_MAPPING,
} from '../../src/constants.js';
import {
    hasNonEmptyCompareChart,
    matchesContentTypeFilter,
    resolveContentTypeFilters,
} from '../../src/compare-chart/content-type-utils.js';

describe('content-type-utils', () => {
    describe('hasNonEmptyCompareChart', () => {
        it('reads via getFieldValues, getField().values, and fields[]', () => {
            expect(hasNonEmptyCompareChart({ getFieldValues: (n) => (n === COMPARE_CHART_FIELD ? ['<table>'] : []) })).to.be
                .true;
            expect(hasNonEmptyCompareChart({ getField: (n) => (n === COMPARE_CHART_FIELD ? { values: ['<table>'] } : null) }))
                .to.be.true;
            expect(hasNonEmptyCompareChart({ fields: [{ name: COMPARE_CHART_FIELD, values: ['<table>'] }] })).to.be.true;
        });

        it('is false for empty, missing, or whitespace-only values', () => {
            expect(hasNonEmptyCompareChart(undefined)).to.be.false;
            expect(hasNonEmptyCompareChart({ fields: [] })).to.be.false;
            expect(hasNonEmptyCompareChart({ fields: [{ name: COMPARE_CHART_FIELD, values: ['   '] }] })).to.be.false;
        });
    });

    describe('matchesContentTypeFilter', () => {
        it('passes everything when no content-type filter is set', () => {
            expect(matchesContentTypeFilter([], { model: { path: '/whatever' } })).to.be.true;
        });

        it('classifies a card by model path', () => {
            const card = { model: { path: CARD_MODEL_PATH } };
            expect(matchesContentTypeFilter([TAG_MERCH_CARD], card)).to.be.true;
            expect(matchesContentTypeFilter([TAG_COMPARE_CHART], card)).to.be.false;
        });

        it('distinguishes compare-chart collections from plain collections', () => {
            const compareChart = {
                model: { path: COLLECTION_MODEL_PATH },
                fields: [{ name: COMPARE_CHART_FIELD, values: ['<table>'] }],
            };
            const collection = { model: { path: COLLECTION_MODEL_PATH }, fields: [] };
            expect(matchesContentTypeFilter([TAG_COMPARE_CHART], compareChart)).to.be.true;
            expect(matchesContentTypeFilter([TAG_MERCH_CARD_COLLECTION], compareChart)).to.be.false;
            expect(matchesContentTypeFilter([TAG_MERCH_CARD_COLLECTION], collection)).to.be.true;
            expect(matchesContentTypeFilter([TAG_COMPARE_CHART], collection)).to.be.false;
        });

        it('rejects unknown model paths', () => {
            expect(matchesContentTypeFilter([TAG_MERCH_CARD], { model: { path: '/unknown' } })).to.be.false;
        });
    });

    describe('resolveContentTypeFilters', () => {
        it('keeps only content-type tags', () => {
            const { contentTypes } = resolveContentTypeFilters([TAG_MERCH_CARD, 'mas:variant/catalog', 'mas:custom/x']);
            expect(contentTypes).to.deep.equal([TAG_MERCH_CARD]);
        });

        it('maps compare-chart to the collection model id and de-dupes', () => {
            const { modelIds } = resolveContentTypeFilters([TAG_COMPARE_CHART, TAG_MERCH_CARD_COLLECTION]);
            expect(modelIds).to.deep.equal([TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD_COLLECTION]]);
        });

        it('maps merch-card to its own model id', () => {
            const { modelIds } = resolveContentTypeFilters([TAG_MERCH_CARD]);
            expect(modelIds).to.deep.equal([TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD]]);
        });

        it('returns empty for no content-type tags', () => {
            expect(resolveContentTypeFilters(['mas:variant/x', 'mas:custom/y'])).to.deep.equal({
                contentTypes: [],
                modelIds: [],
            });
        });
    });
});
