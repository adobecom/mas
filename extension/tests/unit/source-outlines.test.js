const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');

const outlineSource = readFileSync(resolve(__dirname, '../../content/source-outlines.js'), 'utf8');
const overlaySource = readFileSync(resolve(__dirname, '../../content/overlay.js'), 'utf8');

function fakeElement(title) {
    const classes = new Set();
    const attributes = new Map();
    if (title !== undefined) attributes.set('title', title);
    return {
        classList: {
            add: (...names) => names.forEach((name) => classes.add(name)),
            remove: (...names) => names.forEach((name) => classes.delete(name)),
            contains: (name) => classes.has(name),
            toggle: (name, force) => (force ? classes.add(name) : classes.delete(name)),
        },
        getAttribute: (name) => (attributes.has(name) ? attributes.get(name) : null),
        setAttribute: (name, value) => attributes.set(name, String(value)),
        removeAttribute: (name) => attributes.delete(name),
        hasAttribute: (name) => attributes.has(name),
    };
}

function sourceEntry(overlayId, field, source, label, reason) {
    return { field, source, label, reason, overlayId };
}

function createFixture({ priorTitle, cardEntries } = {}) {
    const anchors = {
        shortDescription: fakeElement(priorTitle),
        title: fakeElement(),
    };
    const cardElement = fakeElement();
    const cards = {
        'field-1': { anchorElement: anchors.shortDescription, element: anchors.shortDescription, elementType: 'field' },
        'field-2': { anchorElement: anchors.title, element: anchors.title, elementType: 'field' },
        'card-1': { anchorElement: cardElement, element: cardElement, elementType: 'card' },
    };
    const groups = [
        {
            groupKey: 'g1',
            cardName: 'Card',
            mixed: true,
            overlayIds: ['field-1', 'field-2'],
            entries: [
                sourceEntry('field-1', 'shortDescription', 'promo', 'Promo variation', 'Promo applied'),
                sourceEntry('field-2', 'title', 'default', 'Default card', 'Authored'),
                sourceEntry(null, 'cta', 'failed', 'Failed', 'Never rendered'),
            ],
        },
        {
            groupKey: 'g2',
            cardName: 'Whole',
            mixed: true,
            overlayIds: ['card-1'],
            entries: cardEntries || [
                sourceEntry('card-1', 'title', 'default', 'Default card', 'a'),
                sourceEntry('card-1', 'description', 'promo', 'Promo variation', 'b'),
                sourceEntry('card-1', 'price', 'promo', 'Promo variation', 'c'),
                sourceEntry('card-1', 'cta', 'promo', 'Promo variation', 'd'),
            ],
        },
    ];
    const groupOf = (overlayId) => groups.find((group) => group.overlayIds.includes(overlayId));
    const window = {
        MASCardDetector: { getCardByFragmentId: (id) => cards[id] },
        MASSources: {
            getPageGroups: async () => groups,
            getSourcesFor: async (overlayId) => ({ ...groupOf(overlayId), focusField: null }),
        },
    };
    runInNewContext(outlineSource, { window });
    return { window, groups, outlines: window.MASSourceOutlines, anchors, cardElement };
}

function createOverlay() {
    const window = {};
    runInNewContext(overlaySource, { window });
    const overlay = window.MASCardOverlay;
    const badge = fakeElement();
    overlay.overlays.set('field-1', { badge, cardData: {} });
    return { overlay, badge };
}

test('enabling outlines tags each inline field anchor with its source class', async () => {
    const { outlines, anchors } = createFixture();
    await outlines.enable();
    assert.ok(anchors.shortDescription.classList.contains('mas-ext-src-outline'));
    assert.ok(anchors.shortDescription.classList.contains('mas-ext-src-outline-promo'));
    assert.ok(anchors.title.classList.contains('mas-ext-src-outline-default'));
});

test('disabling removes every outline class', async () => {
    const { outlines, anchors, cardElement } = createFixture();
    await outlines.enable();
    outlines.disable();
    assert.equal(anchors.shortDescription.classList.contains('mas-ext-src-outline'), false);
    assert.equal(anchors.shortDescription.classList.contains('mas-ext-src-outline-promo'), false);
    assert.equal(cardElement.classList.contains('mas-ext-src-outline'), false);
});

test('outlineClassFor returns the base and source classes', () => {
    const { outlines } = createFixture();
    assert.equal(outlines.outlineClassFor({ source: 'locale' }), 'mas-ext-src-outline mas-ext-src-outline-locale');
});

test('hover title is label and reason', async () => {
    const { outlines, anchors } = createFixture();
    await outlines.enable();
    assert.equal(anchors.shortDescription.getAttribute('title'), 'Promo variation — Promo applied');
});

test('an existing title is restored on disable', async () => {
    const { outlines, anchors } = createFixture({ priorTitle: 'Original' });
    await outlines.enable();
    outlines.disable();
    assert.equal(anchors.shortDescription.getAttribute('title'), 'Original');
});

test('a missing title is removed again on disable', async () => {
    const { outlines, anchors } = createFixture();
    await outlines.enable();
    outlines.disable();
    assert.equal(anchors.title.hasAttribute('title'), false);
});

test('enabling twice keeps the original title', async () => {
    const { outlines, anchors } = createFixture({ priorTitle: 'Original' });
    await outlines.enable();
    await outlines.enable();
    assert.equal(anchors.shortDescription.getAttribute('title'), 'Promo variation — Promo applied');
    outlines.disable();
    assert.equal(anchors.shortDescription.getAttribute('title'), 'Original');
});

test('a whole card gets one outline in its dominant source', async () => {
    const { outlines, cardElement } = createFixture();
    await outlines.enable();
    assert.ok(cardElement.classList.contains('mas-ext-src-outline-promo'));
    assert.equal(cardElement.classList.contains('mas-ext-src-outline-default'), false);
    assert.equal(cardElement.getAttribute('title'), '4 fields from Default card, Promo variation');
});

test('markMixed adds and removes the badge class and label', () => {
    const { overlay, badge } = createOverlay();
    overlay.markMixed('field-1', true);
    assert.ok(badge.classList.contains('mas-ext-badge-mixed'));
    assert.equal(badge.getAttribute('aria-label'), 'This card mixes content sources');
    overlay.markMixed('field-1', false);
    assert.equal(badge.classList.contains('mas-ext-badge-mixed'), false);
    assert.equal(badge.hasAttribute('aria-label'), false);
});

test('markMixed ignores an unknown overlay id', () => {
    const { overlay, badge } = createOverlay();
    overlay.markMixed('nope', true);
    assert.equal(badge.classList.contains('mas-ext-badge-mixed'), false);
});

test('a dominant-source tie goes to the first source in entry order', async () => {
    const { outlines, cardElement } = createFixture({
        cardEntries: [
            sourceEntry('card-1', 'title', 'locale', 'Locale', 'a'),
            sourceEntry('card-1', 'description', 'promo', 'Promo variation', 'b'),
        ],
    });
    await outlines.enable();
    assert.ok(cardElement.classList.contains('mas-ext-src-outline-locale'));
    assert.equal(cardElement.classList.contains('mas-ext-src-outline-promo'), false);
});

test('disable during an in-flight enable leaves nothing outlined', async () => {
    const { window, groups, outlines, anchors } = createFixture();
    let release;
    window.MASSources.getPageGroups = () => new Promise((resolve) => (release = () => resolve(groups)));
    const pending = outlines.enable();
    outlines.disable();
    release();
    await pending;
    assert.equal(anchors.shortDescription.classList.contains('mas-ext-src-outline'), false);
});

test('outline tags only the newly detected field with its own source', async () => {
    const { outlines, anchors } = createFixture();
    await outlines.outline('field-1');
    assert.ok(anchors.shortDescription.classList.contains('mas-ext-src-outline-promo'));
    assert.equal(anchors.shortDescription.getAttribute('title'), 'Promo variation — Promo applied');
    assert.equal(anchors.title.classList.contains('mas-ext-src-outline'), false);
});

test('outline uses the detected field’s own entry, not its group’s first', async () => {
    const { outlines, anchors } = createFixture();
    await outlines.outline('field-2');
    assert.ok(anchors.title.classList.contains('mas-ext-src-outline-default'));
    assert.equal(anchors.title.getAttribute('title'), 'Default card — Authored');
});

test('outline gives a newly detected whole card its dominant source', async () => {
    const { outlines, cardElement } = createFixture();
    await outlines.outline('card-1');
    assert.ok(cardElement.classList.contains('mas-ext-src-outline-promo'));
    assert.equal(cardElement.getAttribute('title'), '4 fields from Default card, Promo variation');
});

test('outline after enable keeps the original title for disable to restore', async () => {
    const { outlines, anchors } = createFixture({ priorTitle: 'Original' });
    await outlines.enable();
    await outlines.outline('field-1');
    outlines.disable();
    assert.equal(anchors.shortDescription.getAttribute('title'), 'Original');
});

test('disable during an in-flight outline leaves nothing outlined', async () => {
    const { window, groups, outlines, anchors } = createFixture();
    let release;
    window.MASSources.getSourcesFor = () => new Promise((resolve) => (release = () => resolve(groups[0])));
    const pending = outlines.outline('field-1');
    outlines.disable();
    release();
    await pending;
    assert.equal(anchors.shortDescription.classList.contains('mas-ext-src-outline'), false);
});
