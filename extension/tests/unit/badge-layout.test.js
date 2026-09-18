const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveBadgeLayout } = require('../../utils/badge-layout.js');

const overlap = (a, b) => a.left < b.left + b.w && a.left + a.w > b.left && a.top < b.top + b.h && a.top + a.h > b.top;

test('leaves a non-overlapping badge at its desired position', () => {
    const input = [{ top: 100, left: 40, w: 90, h: 24 }];
    const out = resolveBadgeLayout(input, 1440);
    assert.deepEqual(out, [{ top: 100, left: 40 }]);
});

test('moves a coincident second badge to the right instead of stacking it', () => {
    const input = [
        { top: 8, left: 8, w: 90, h: 24 },
        { top: 8, left: 8, w: 90, h: 24 },
    ];
    const out = resolveBadgeLayout(input, 1440, { gap: 4 });
    assert.deepEqual(out[0], { top: 8, left: 8 });
    assert.equal(out[1].top, 8);
    assert.ok(out[1].left >= 8 + 90 + 4, 'second badge clears the first horizontally');
});

test('wraps to a new row when the current row runs out of width', () => {
    const input = Array.from({ length: 4 }, () => ({ top: 8, left: 8, w: 90, h: 24 }));
    const out = resolveBadgeLayout(input, 200, { gap: 4, margin: 8 });
    const rows = new Set(out.map((b) => b.top));
    assert.ok(rows.size > 1, 'badges spill onto more than one row');
    assert.ok(
        out.every((b) => b.left + 90 <= 200),
        'no badge extends past the viewport width',
    );
});

test('produces no overlapping pair for a pile of coincident badges', () => {
    const input = Array.from({ length: 9 }, () => ({ top: 8, left: 8, w: 90, h: 24 }));
    const out = resolveBadgeLayout(input, 1440).map((p, i) => ({ ...p, w: input[i].w, h: input[i].h }));
    for (let a = 0; a < out.length; a++) {
        for (let b = a + 1; b < out.length; b++) {
            assert.ok(!overlap(out[a], out[b]), `badges ${a} and ${b} must not overlap`);
        }
    }
});

test('returns one position per input badge, in input order', () => {
    const input = [
        { top: 300, left: 500, w: 90, h: 24 },
        { top: 8, left: 8, w: 90, h: 24 },
    ];
    const out = resolveBadgeLayout(input, 1440);
    assert.equal(out.length, 2);
    assert.deepEqual(out[0], { top: 300, left: 500 }, 'first input keeps its slot in the output');
});
