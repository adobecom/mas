const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SOURCES, renderSourceLegend } = require('../../utils/source-legend.js');

test('the legend covers every source the engine labels', () => {
    assert.deepEqual([...SOURCES].sort(), ['default', 'failed', 'grouped', 'locale', 'mask', 'promo', 'unknown']);
});

test('each legend swatch carries its label color and its page outline', () => {
    const html = renderSourceLegend();
    SOURCES.forEach((source) => assert.ok(html.includes(`mas-ext-src-${source} mas-ext-src-outline-${source}`), source));
});

test('the legend names personalized sources in plain words', () => {
    const html = renderSourceLegend();
    assert.match(html, /Grouped<\/span>\s*<span class="mas-ext-legend-meaning">Personalized for an audience \(PZN\)/);
    assert.match(html, /Promo<\/span>\s*<span class="mas-ext-legend-meaning">Promotion content/);
});

test('the legend explains the amber badge and MEP swaps', () => {
    const html = renderSourceLegend();
    assert.match(html, /amber badge means the card mixes sources/);
    assert.match(html, /"Swapped by MEP" means an MEP manifest replaced the field/);
});

test('the legend starts collapsed unless asked open', () => {
    assert.match(renderSourceLegend(), /^<details class="mas-ext-legend">/);
    assert.match(renderSourceLegend({ open: true }), /^<details class="mas-ext-legend" open>/);
});
