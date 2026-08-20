const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolvePromotion, readElementPromotion, CANCEL_CONTEXT_CODE } = require('../../utils/promo.js');

test('effective code comes from a child element code', () => {
    const promo = resolvePromotion({ contextCode: null, childCodes: ['SUMMER25'] });
    assert.equal(promo.effectiveCode, 'SUMMER25');
    assert.deepEqual(promo.childCodes, ['SUMMER25']);
    assert.equal(promo.hasCancelContext, false);
    assert.equal(promo.hasConflict, false);
});

test('falls back to the card context code when children carry none', () => {
    const promo = resolvePromotion({ contextCode: 'CTX10', childCodes: [] });
    assert.equal(promo.effectiveCode, 'CTX10');
    assert.equal(promo.contextCode, 'CTX10');
});

test('cancel-context is a sentinel, never surfaced as a code', () => {
    const promo = resolvePromotion({ contextCode: 'CTX10', childCodes: [CANCEL_CONTEXT_CODE] });
    assert.equal(promo.hasCancelContext, true);
    assert.deepEqual(promo.childCodes, [], 'sentinel must not appear in childCodes');
    assert.equal(promo.effectiveCode, 'CTX10', 'card-level fallback mirrors merch-card get promotionCode');
});

test('cancel-context as the context code yields no promotion', () => {
    const promo = resolvePromotion({ contextCode: CANCEL_CONTEXT_CODE, childCodes: [] });
    assert.equal(promo.effectiveCode, null);
    assert.equal(promo.contextCode, null);
    assert.equal(promo.hasCancelContext, true);
});

test('duplicate child codes are deduped and do not conflict', () => {
    const promo = resolvePromotion({ contextCode: null, childCodes: ['A', 'A', 'A'] });
    assert.equal(promo.effectiveCode, 'A');
    assert.equal(promo.hasConflict, false);
});

test('distinct child codes flag a conflict and keep the first', () => {
    const promo = resolvePromotion({ contextCode: null, childCodes: ['A', 'B'] });
    assert.equal(promo.effectiveCode, 'A');
    assert.equal(promo.hasConflict, true);
    assert.deepEqual(promo.childCodes, ['A', 'B']);
});

test('empty and null child codes are ignored', () => {
    const promo = resolvePromotion({ contextCode: null, childCodes: ['', null, undefined] });
    assert.equal(promo.effectiveCode, null);
    assert.equal(promo.hasCancelContext, false);
});

function fakeElement({ contextCode, childCodes }) {
    return {
        getAttribute(name) {
            return name === 'data-promotion-code' ? (contextCode ?? null) : null;
        },
        querySelectorAll(selector) {
            assert.match(selector, /data-promotion-code/);
            return childCodes.map((code) => ({
                getAttribute: () => code,
            }));
        },
    };
}

test('readElementPromotion reads context and child codes from an element', () => {
    const el = fakeElement({ contextCode: 'CTX10', childCodes: ['SUMMER25', CANCEL_CONTEXT_CODE] });
    const promo = readElementPromotion(el);
    assert.equal(promo.effectiveCode, 'SUMMER25');
    assert.equal(promo.contextCode, 'CTX10');
    assert.equal(promo.hasCancelContext, true);
});

test('readElementPromotion returns null when the element carries no promo markup', () => {
    const el = fakeElement({ contextCode: null, childCodes: [] });
    assert.equal(readElementPromotion(el), null);
});

test('readElementPromotion returns null for a missing element', () => {
    assert.equal(readElementPromotion(null), null);
});
