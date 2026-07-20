import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    appendSuffixToLeaf,
    buildCandidateCollisionPath,
    buildPromoVariationPath,
    buildPromoVariationPathForTag,
    canProbePromoVariationsForFragment,
    findPromotionProjectIdByTag,
    fragmentIsPromoVariation,
    getCandidateDefaultLeaves,
    getFragmentByPathOrNull,
    getPromoNameFromPromoVariationPath,
    getPromoNameFromTag,
    getPromotionInfo,
    getPromotionTagFromFragment,
    isFragmentNotFoundError,
    isPromoVariationPath,
    isSafePromoFolderName,
    resolveDefaultPathFromPromoVariation,
} from '../../src/promotions/promotion-model.js';

describe('promotion-model', () => {
    const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
    const promoVariationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
    const nestedDefault = '/content/dam/mas/sandbox/en_US/cards/my-card';
    const nestedPromo = '/content/dam/mas/sandbox/en_US/promotions/this/is/my/promo/cards/my-card';

    describe('isPromoVariationPath', () => {
        it('returns true for paths under promotions folder', () => {
            expect(isPromoVariationPath(promoVariationPath)).to.be.true;
            expect(isPromoVariationPath(nestedPromo)).to.be.true;
        });

        it('returns false for default fragment paths', () => {
            expect(isPromoVariationPath(defaultPath)).to.be.false;
            expect(isPromoVariationPath('/content/dam/mas/promotions/black-friday')).to.be.false;
            expect(isPromoVariationPath('')).to.be.false;
        });
    });

    describe('canProbePromoVariationsForFragment', () => {
        it('returns false for collection fragments and non-DAM paths', () => {
            expect(
                canProbePromoVariationsForFragment({
                    path: '/content/mas/collections/all',
                    model: { path: '/conf/mas/settings/dam/cfm/models/collection' },
                }),
            ).to.be.false;
            expect(canProbePromoVariationsForFragment({ path: '/content/mas/collections/all' })).to.be.false;
        });

        it('returns true for default MAS card paths', () => {
            expect(
                canProbePromoVariationsForFragment({
                    path: defaultPath,
                    model: { path: '/conf/mas/settings/dam/cfm/models/card' },
                }),
            ).to.be.true;
        });
    });

    describe('getPromoNameFromTag', () => {
        it('strips mas:promotion/ prefix', () => {
            expect(getPromoNameFromTag('mas:promotion/black-friday')).to.equal('black-friday');
            expect(getPromoNameFromTag('mas:promotion/this/is/my/promo')).to.equal('this/is/my/promo');
        });

        it('returns null for non-promotion tags', () => {
            expect(getPromoNameFromTag('mas:status/draft')).to.be.null;
        });

        it('returns null for unsafe promo folder names', () => {
            expect(getPromoNameFromTag('mas:promotion/../escape')).to.be.null;
            expect(getPromoNameFromTag('mas:promotion/')).to.be.null;
        });
    });

    describe('isSafePromoFolderName', () => {
        it('accepts normal nested promo folder names', () => {
            expect(isSafePromoFolderName('black-friday')).to.be.true;
            expect(isSafePromoFolderName('this/is/my/promo')).to.be.true;
        });

        it('rejects path traversal segments', () => {
            expect(isSafePromoFolderName('../evil')).to.be.false;
            expect(isSafePromoFolderName('foo/../bar')).to.be.false;
            expect(isSafePromoFolderName('/absolute')).to.be.false;
        });
    });

    describe('findPromotionProjectIdByTag', () => {
        it('returns the matching promotion project id', () => {
            const id = findPromotionProjectIdByTag('mas:promotion/black-friday', [
                { id: 'promo-1', tags: [{ id: 'mas:promotion/black-friday' }] },
                { id: 'promo-2', tags: [{ id: 'mas:promotion/sale' }] },
            ]);
            expect(id).to.equal('promo-1');
        });

        it('returns null when no project matches', () => {
            expect(findPromotionProjectIdByTag('mas:promotion/missing', [{ id: 'promo-1', tags: [] }])).to.be.null;
        });
    });

    describe('buildPromoVariationPath', () => {
        it('builds promo variation path from default path and promo name', () => {
            expect(buildPromoVariationPath(defaultPath, 'black-friday')).to.equal(promoVariationPath);
        });

        it('supports multi-segment promo names and nested fragment paths', () => {
            expect(buildPromoVariationPath(nestedDefault, 'this/is/my/promo')).to.equal(nestedPromo);
        });

        it('returns null when default path is already a promo variation', () => {
            expect(buildPromoVariationPath(promoVariationPath, 'black-friday')).to.be.null;
        });
    });

    describe('buildPromoVariationPathForTag', () => {
        it('builds path from default fragment path and mas:promotion/ tag', () => {
            expect(buildPromoVariationPathForTag(defaultPath, 'mas:promotion/black-friday')).to.equal(promoVariationPath);
        });

        it('returns null for invalid promotion tags', () => {
            expect(buildPromoVariationPathForTag(defaultPath, 'mas:status/draft')).to.be.null;
        });

        it('passes the suffixIndex through to buildPromoVariationPath', () => {
            expect(buildPromoVariationPathForTag(defaultPath, 'mas:promotion/black-friday', 2)).to.equal(
                '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2',
            );
        });
    });

    describe('appendSuffixToLeaf', () => {
        it('returns the path unchanged when no index or index is 1', () => {
            expect(appendSuffixToLeaf('Individual/com/my-card')).to.equal('Individual/com/my-card');
            expect(appendSuffixToLeaf('Individual/com/my-card', 1)).to.equal('Individual/com/my-card');
        });

        it('appends the index to the leaf segment only, for index 2 and above', () => {
            expect(appendSuffixToLeaf('Individual/com/my-card', 2)).to.equal('Individual/com/my-card-2');
            expect(appendSuffixToLeaf('my-card', 3)).to.equal('my-card-3');
        });

        it('returns the path unchanged for a falsy path', () => {
            expect(appendSuffixToLeaf('', 2)).to.equal('');
            expect(appendSuffixToLeaf(null, 2)).to.equal(null);
        });
    });

    describe('buildPromoVariationPath with suffixIndex', () => {
        it('builds the exact same unsuffixed path as before when suffixIndex is omitted', () => {
            expect(buildPromoVariationPath(defaultPath, 'black-friday')).to.equal(promoVariationPath);
        });

        it('appends a numeric suffix to the leaf segment for suffixIndex >= 2', () => {
            expect(buildPromoVariationPath(defaultPath, 'black-friday', 2)).to.equal(
                '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2',
            );
        });

        it('supports nested fragment paths with a suffix', () => {
            expect(buildPromoVariationPath(nestedDefault, 'this/is/my/promo', 3)).to.equal(
                '/content/dam/mas/sandbox/en_US/promotions/this/is/my/promo/cards/my-card-3',
            );
        });

        it('returns null when defaultPath or promoName is missing', () => {
            expect(buildPromoVariationPath('', 'black-friday')).to.be.null;
            expect(buildPromoVariationPath(defaultPath, '')).to.be.null;
        });
    });

    describe('buildCandidateCollisionPath', () => {
        it('builds the default-space path a variation suffix would collide with', () => {
            expect(buildCandidateCollisionPath(defaultPath, 2)).to.equal('/content/dam/mas/sandbox/en_US/my-card-2');
        });

        it('returns null for an unparsable path', () => {
            expect(buildCandidateCollisionPath('', 2)).to.be.null;
        });
    });

    describe('getCandidateDefaultLeaves', () => {
        it('returns the leaf unchanged as the only candidate when it has no numeric suffix', () => {
            expect(getCandidateDefaultLeaves('Individual/com/my-card')).to.deep.equal(['Individual/com/my-card']);
        });

        it('returns both the unstripped and the stripped candidate when the leaf ends in "-<digits>"', () => {
            expect(getCandidateDefaultLeaves('Individual/com/my-card-2')).to.deep.equal([
                'Individual/com/my-card-2',
                'Individual/com/my-card',
            ]);
        });

        it('returns an empty array for a falsy path', () => {
            expect(getCandidateDefaultLeaves('')).to.deep.equal([]);
        });
    });

    describe('resolveDefaultPathFromPromoVariation', () => {
        it('returns only the unsuffixed candidate when the leaf has no numeric suffix', () => {
            expect(resolveDefaultPathFromPromoVariation(promoVariationPath, 'black-friday')).to.deep.equal([defaultPath]);
            expect(resolveDefaultPathFromPromoVariation(nestedPromo, 'this/is/my/promo')).to.deep.equal([nestedDefault]);
        });

        it('returns both interpretations, unstripped first, when the leaf ends in "-<digits>"', () => {
            const suffixedPromoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2';
            expect(resolveDefaultPathFromPromoVariation(suffixedPromoPath, 'black-friday')).to.deep.equal([
                '/content/dam/mas/sandbox/en_US/my-card-2',
                '/content/dam/mas/sandbox/en_US/my-card',
            ]);
        });

        it('returns an empty array when promo name does not match path', () => {
            expect(resolveDefaultPathFromPromoVariation(promoVariationPath, 'other-promo')).to.deep.equal([]);
        });

        it('returns an empty array when promoPath or promoName is missing', () => {
            expect(resolveDefaultPathFromPromoVariation('', 'black-friday')).to.deep.equal([]);
            expect(resolveDefaultPathFromPromoVariation(promoVariationPath, '')).to.deep.equal([]);
        });

        it('returns an empty array when promoPath does not match the DAM path pattern', () => {
            expect(resolveDefaultPathFromPromoVariation('not-a-dam-path', 'black-friday')).to.deep.equal([]);
        });

        it('returns an empty array when nothing remains after stripping the promo name prefix', () => {
            expect(
                resolveDefaultPathFromPromoVariation('/content/dam/mas/sandbox/en_US/promotions/black-friday/', 'black-friday'),
            ).to.deep.equal([]);
        });
    });

    describe('getPromotionTagFromFragment', () => {
        it('returns first mas:promotion/ tag', () => {
            const fragment = {
                getFieldValues: (name) => (name === 'tags' ? ['mas:status/draft', 'mas:promotion/black-friday'] : []),
            };
            expect(getPromotionTagFromFragment(fragment)).to.equal('mas:promotion/black-friday');
        });

        it('reads from tags array when no getFieldValues', () => {
            expect(getPromotionTagFromFragment({ tags: [{ id: 'mas:promotion/sale' }] })).to.equal('mas:promotion/sale');
        });

        it('returns null for a falsy fragment', () => {
            expect(getPromotionTagFromFragment(null)).to.be.null;
        });

        it('returns null when the fragment has neither getFieldValues nor tags', () => {
            expect(getPromotionTagFromFragment({})).to.be.null;
        });
    });

    describe('fragmentIsPromoVariation', () => {
        it('returns true for promo variation paths and promotion tags', () => {
            expect(fragmentIsPromoVariation({ path: promoVariationPath })).to.be.true;
            expect(fragmentIsPromoVariation({ tags: [{ id: 'mas:promotion/sale' }] })).to.be.true;
            expect(fragmentIsPromoVariation({ path: defaultPath })).to.be.false;
        });
    });

    describe('getPromoNameFromPromoVariationPath', () => {
        it('parses promo name from variation path', () => {
            expect(getPromoNameFromPromoVariationPath(promoVariationPath)).to.equal('black-friday');
        });

        it('returns null for non-promo variation paths', () => {
            expect(getPromoNameFromPromoVariationPath(defaultPath)).to.be.null;
        });
    });

    describe('isFragmentNotFoundError', () => {
        it('returns true for 404 status or not-found messages', () => {
            expect(isFragmentNotFoundError({ status: 404 })).to.be.true;
            expect(isFragmentNotFoundError(new Error('Fragment not found'))).to.be.true;
            expect(isFragmentNotFoundError(new Error('Request failed with 404'))).to.be.true;
        });

        it('returns false for other errors', () => {
            expect(isFragmentNotFoundError(new Error('network timeout'))).to.be.false;
            expect(isFragmentNotFoundError({ status: 500 })).to.be.false;
        });
    });

    describe('getPromotionInfo', () => {
        it('returns promotionName from tag title and promoProject from the tag id', () => {
            const fragment = {
                tags: [{ id: 'mas:promotion/black-friday', title: 'Black Friday Campaign' }],
            };
            const { promotionName, promoProject } = getPromotionInfo(fragment);
            expect(promoProject).to.equal('black-friday');
            expect(promotionName).to.equal('Black Friday Campaign');
        });

        it('falls back to promoProject as promotionName when the tag has no title', () => {
            const fragment = { tags: [{ id: 'mas:promotion/summer-sale' }] };
            const { promotionName, promoProject } = getPromotionInfo(fragment);
            expect(promoProject).to.equal('summer-sale');
            expect(promotionName).to.equal('summer-sale');
        });

        it('returns dashes for both fields when no promotion tag exists', () => {
            const fragment = { tags: [{ id: 'mas:status/draft' }] };
            const { promotionName, promoProject } = getPromotionInfo(fragment);
            expect(promotionName).to.equal('-');
            expect(promoProject).to.equal('-');
        });

        it('reads promotion tag from getFieldValues when available', () => {
            const fragment = {
                getFieldValues: (name) => (name === 'tags' ? ['mas:promotion/cyber-monday'] : []),
                tags: [{ id: 'mas:promotion/cyber-monday', title: 'Cyber Monday' }],
            };
            const { promotionName, promoProject } = getPromotionInfo(fragment);
            expect(promoProject).to.equal('cyber-monday');
            expect(promotionName).to.equal('Cyber Monday');
        });
    });

    describe('getFragmentByPathOrNull', () => {
        it('returns null for not-found errors', async () => {
            const fragmentsApi = {
                getByPath: sinon.stub().rejects(new Error('Fragment not found')),
            };
            const result = await getFragmentByPathOrNull(fragmentsApi, promoVariationPath);
            expect(result).to.be.null;
        });

        it('rethrows non-not-found errors', async () => {
            const fragmentsApi = {
                getByPath: sinon.stub().rejects(new Error('Server error')),
            };
            try {
                await getFragmentByPathOrNull(fragmentsApi, promoVariationPath);
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).to.equal('Server error');
            }
        });
    });
});
