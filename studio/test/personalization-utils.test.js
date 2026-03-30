import { expect } from '@esm-bundle/chai';
import { Fragment } from '../src/aem/fragment.js';
import { PZN_COUNTRY_TAG_PATH_PREFIX } from '../src/constants.js';
import {
    fragmentHasPersonalizationTag,
    isPznCountryTagId,
    isPznCountryTagPath,
    PZN_TAG_ID_PREFIX,
    tagRefToTagId,
} from '../src/common/utils/personalization-utils.js';

describe('personalization-utils', () => {
    describe('PZN_TAG_ID_PREFIX', () => {
        it('is the mas:pzn/ id prefix', () => {
            expect('mas:pzn/general'.startsWith(PZN_TAG_ID_PREFIX)).to.be.true;
        });
    });

    describe('isPznCountryTagPath', () => {
        it('returns false for empty or missing path', () => {
            expect(isPznCountryTagPath('')).to.be.false;
            expect(isPznCountryTagPath(undefined)).to.be.false;
        });

        it('matches country root and descendants', () => {
            expect(isPznCountryTagPath(PZN_COUNTRY_TAG_PATH_PREFIX)).to.be.true;
            expect(isPznCountryTagPath(`${PZN_COUNTRY_TAG_PATH_PREFIX}/fr_FR`)).to.be.true;
        });

        it('returns false for non-country pzn paths', () => {
            expect(isPznCountryTagPath('/content/cq:tags/mas/pzn/general')).to.be.false;
        });
    });

    describe('isPznCountryTagId', () => {
        it('returns false for empty id', () => {
            expect(isPznCountryTagId('')).to.be.false;
        });

        it('matches country tag ids', () => {
            expect(isPznCountryTagId('mas:pzn/country')).to.be.true;
            expect(isPznCountryTagId('mas:pzn/country/fr_FR')).to.be.true;
        });

        it('returns false for non-country mas:pzn ids', () => {
            expect(isPznCountryTagId('mas:pzn/general')).to.be.false;
            expect(isPznCountryTagId('mas:pzn/segment')).to.be.false;
        });
    });

    describe('tagRefToTagId', () => {
        it('maps CQ tag path to mas id', () => {
            expect(tagRefToTagId('/content/cq:tags/mas/pzn/general')).to.equal('mas:pzn/general');
        });

        it('passes through mas id strings', () => {
            expect(tagRefToTagId('mas:pzn/country/fr_FR')).to.equal('mas:pzn/country/fr_FR');
        });
    });

    describe('fragmentHasPersonalizationTag', () => {
        it('returns false for null, missing tags, or empty tags', () => {
            expect(fragmentHasPersonalizationTag(null)).to.be.false;
            expect(fragmentHasPersonalizationTag({})).to.be.false;
            expect(fragmentHasPersonalizationTag({ tags: [] })).to.be.false;
        });

        it('returns true when a non-country mas:pzn tag is present', () => {
            expect(fragmentHasPersonalizationTag({ tags: [{ id: 'mas:pzn/general' }] })).to.be.true;
        });

        it('returns false when only country pzn tags exist', () => {
            expect(fragmentHasPersonalizationTag({ tags: [{ id: 'mas:pzn/country/fr_FR' }] })).to.be.false;
        });

        it('returns false when tags are not in the pzn namespace', () => {
            expect(fragmentHasPersonalizationTag({ tags: [{ id: 'mas:product/x' }] })).to.be.false;
        });

        it('finds personalization after skipping country pzn in the same list', () => {
            expect(
                fragmentHasPersonalizationTag({
                    tags: [{ id: 'mas:pzn/country/fr_FR' }, { id: 'mas:pzn/segment' }],
                }),
            ).to.be.true;
        });

        it('detects non-country pzn on collection tagFilters field when fragment.tags is empty', () => {
            expect(
                fragmentHasPersonalizationTag({
                    tags: [],
                    fields: [{ name: 'tagFilters', values: ['mas:pzn/general'] }],
                }),
            ).to.be.true;
        });

        it('returns false when tagFilters only has country pzn', () => {
            expect(
                fragmentHasPersonalizationTag({
                    tags: [],
                    fields: [{ name: 'tagFilters', values: ['mas:pzn/country/fr_FR'] }],
                }),
            ).to.be.false;
        });

        it('detects pznTags on a Fragment instance', () => {
            const fragment = new Fragment({
                id: 'c1',
                path: '/content/dam/mas/acom/en_US/collections/x',
                tags: [],
                fields: [{ name: 'pznTags', values: ['mas:pzn/general'] }],
            });
            expect(fragmentHasPersonalizationTag(fragment)).to.be.true;
        });

        it('treats as personalization when country and non-country pzn appear as CQ paths without id', () => {
            expect(
                fragmentHasPersonalizationTag({
                    tags: [{ path: '/content/cq:tags/mas/pzn/country/fr_FR' }, { path: '/content/cq:tags/mas/pzn/general' }],
                }),
            ).to.be.true;
        });

        it('detects non-country pzn in tagFilters when values are CQ paths', () => {
            expect(
                fragmentHasPersonalizationTag({
                    tags: [],
                    fields: [{ name: 'tagFilters', values: ['/content/cq:tags/mas/pzn/general'] }],
                }),
            ).to.be.true;
        });
    });
});
