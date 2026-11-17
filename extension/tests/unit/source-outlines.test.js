const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');

const legend = require('../../utils/source-legend.js');
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

const ORIGIN = 'https://www.adobe.com';
const PLANS_SLOTS = {
    title: { tag: 'h3', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    ctas: { slot: 'footer' },
};

// A merch-card whose slotted children are looked up by the selector the outliner builds.
function fakeCard(variant, slotted = {}) {
    const card = fakeElement();
    const { getAttribute } = card;
    card.getAttribute = (name) => (name === 'variant' ? (variant ?? null) : getAttribute(name));
    card.queried = [];
    card.querySelectorAll = (selector) => {
        card.queried.push(selector);
        return slotted[selector] ?? [];
    };
    return card;
}

function createFixture({ priorTitle, cardEntries, variant, slots = {} } = {}) {
    const slotted = {
        ':scope > h3[slot="heading-xs"]': [fakeElement()],
        ':scope > div[slot="body-xs"]': [fakeElement('Truncated text')],
        ':scope > [slot="footer"]': [fakeElement()],
        ':scope > merch-icon[slot="icons"]': [fakeElement(), fakeElement()],
    };
    const fieldElements = {
        cardTitle: slotted[':scope > h3[slot="heading-xs"]'][0],
        description: slotted[':scope > div[slot="body-xs"]'][0],
        ctas: slotted[':scope > [slot="footer"]'][0],
        icons: slotted[':scope > merch-icon[slot="icons"]'],
    };
    const listeners = [];
    const slotRequests = [];
    const anchors = {
        shortDescription: fakeElement(priorTitle),
        title: fakeElement(),
    };
    const cardElement = fakeCard(variant, slotted);
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
        addEventListener: (type, listener) => listeners.push(listener),
        // The page bridge answers each field-slots request with the variant's mapping.
        postMessage: (message) => {
            slotRequests.push(message.variant);
            const data = {
                source: 'mas-ext-page-bridge',
                type: 'FIELD_SLOTS',
                variant: message.variant,
                slots: JSON.stringify(slots[message.variant] ?? {}),
            };
            Promise.resolve().then(() => listeners.forEach((listener) => listener({ source: window, origin: ORIGIN, data })));
        },
        MASSourceLegend: legend,
        MASCardDetector: { getCardByFragmentId: (id) => cards[id] },
        MASSources: {
            getPageGroups: async () => groups,
            getSourcesFor: async (overlayId) => ({ ...groupOf(overlayId), focusField: null }),
        },
    };
    runInNewContext(outlineSource, { window, location: { origin: ORIGIN } });
    return { window, groups, outlines: window.MASSourceOutlines, anchors, cardElement, fieldElements, slotRequests };
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

test('a whole card whose variant has no known slots gets one outline in its dominant source', async () => {
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

const MIXED_CARD = [
    sourceEntry('card-1', 'cardTitle', 'default', 'Default card', 'No variation applied'),
    sourceEntry('card-1', 'description', 'promo', 'Promo variation', 'IO applied promo'),
    sourceEntry('card-1', 'ctas', 'grouped', 'Grouped variation', 'Swapped by MEP'),
    sourceEntry('card-1', 'mnemonicIcon', 'promo', 'Promo variation', 'IO applied promo'),
    sourceEntry('card-1', 'osi', 'default', 'Default card', 'No variation applied'),
];

function mixedCard(extra = {}) {
    return createFixture({ cardEntries: MIXED_CARD, variant: 'plans', slots: { plans: PLANS_SLOTS }, ...extra });
}

test('a whole card outlines each rendered field in that field’s own source', async () => {
    const { outlines, fieldElements } = mixedCard();
    await outlines.enable();
    assert.deepEqual(
        [fieldElements.cardTitle, fieldElements.description, fieldElements.ctas, ...fieldElements.icons].map((element) =>
            ['default', 'promo', 'grouped'].find((source) => element.classList.contains(`mas-ext-src-outline-${source}`)),
        ),
        ['default', 'promo', 'grouped', 'promo', 'promo'],
    );
});

test('a whole card’s field shows its own source and reason on hover', async () => {
    const { outlines, fieldElements } = mixedCard();
    await outlines.enable();
    assert.equal(fieldElements.ctas.getAttribute('title'), 'Grouped variation — Swapped by MEP');
});

test('a whole card outlined per field carries no card-wide outline', async () => {
    const { outlines, cardElement } = mixedCard();
    await outlines.enable();
    assert.equal(cardElement.classList.contains('mas-ext-src-outline'), false);
});

test('a newly detected whole card is outlined per field', async () => {
    const { outlines, fieldElements } = mixedCard();
    await outlines.outline('card-1');
    assert.ok(fieldElements.description.classList.contains('mas-ext-src-outline-promo'));
});

test('disabling restores a card field’s outline and its own title', async () => {
    const { outlines, fieldElements } = mixedCard();
    await outlines.enable();
    outlines.disable();
    assert.deepEqual(
        [fieldElements.description.classList.contains('mas-ext-src-outline'), fieldElements.description.getAttribute('title')],
        [false, 'Truncated text'],
    );
});

test('cards of one variant outlined together ask the page for its slots once', async () => {
    const { outlines, slotRequests } = mixedCard();
    await Promise.all([outlines.outline('card-1'), outlines.outline('card-1')]);
    assert.deepEqual(slotRequests, ['plans']);
});

test('disable while a card’s slots are being read leaves its fields unoutlined', async () => {
    const { outlines, fieldElements } = mixedCard();
    const pending = outlines.enable();
    await new Promise(setImmediate);
    outlines.disable();
    await pending;
    assert.equal(fieldElements.description.classList.contains('mas-ext-src-outline'), false);
});

test('a slot name that is not a plain identifier is never used as a selector', async () => {
    const slots = { plans: { description: { tag: 'div', slot: 'body-xs"], body *[x="' } } };
    const { outlines, cardElement } = mixedCard({ slots });
    await outlines.enable();
    assert.deepEqual(cardElement.queried, [':scope > merch-icon[slot="icons"]']);
});
