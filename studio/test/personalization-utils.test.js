import { expect } from '@esm-bundle/chai';
import { PZN_COUNTRY_TAG_PATH_PREFIX } from '../src/constants.js';
import {
    fragmentHasPersonalizationTag,
    isPznCountryTagId,
    isPznCountryTagPath,
    PZN_TAG_ID_PREFIX,
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
    });
});
