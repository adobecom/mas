const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createContext, runInContext } = require('node:vm');

const { CardDetector } = require('../../utils/card-detector.js');
const F = require('./fixtures/homepage-cc-lapsed.js');
const { AUTHORED, GROUPED, PROMO_VAR, MANIFEST, PROMO_PROJECT } = F;

const SCRIPTS = [
    'utils/locales.js',
    'utils/fragment-parser.js',
    'utils/merge-mirror.js',
    'utils/mep-state.js',
    'utils/source-engine.js',
    'content/sources.js',
];
const CONTENT = ':scope > [data-role="mas-field-content"]';
const OVERRIDES = 'div.mas-overrides aem-fragment[fragment]';
const SERVICE_CONFIG = { masIOUrl: 'https://mas.adobe.com/io', wcsApiKey: 'test-api-key' };
// The authored default card, as the card-name fetch caches it.
const AUTHORED_DATA = {
    id: AUTHORED,
    path: '/content/dam/mas/acom/en_US/homepage-cpro-individuals',
    fields: { cardTitle: 'CC Pro', description: { mimeType: 'text/html', value: '<p>All the apps</p>' }, variations: [] },
};
const FRAGMENTS = { [PROMO_VAR]: F.inputs.variationData, [GROUPED]: F.groupedData, [AUTHORED]: AUTHORED_DATA };
const STALE_STATE = { preview: true, swaps: [] };
const STAMP_ATTRS = {
    resolvedId: 'fragment-id',
    variationId: 'variation-id',
    maskId: 'mask-id',
    promoProject: 'data-promotion-project',
    promoVariationProject: 'data-promotion-variation-project',
};
const EMPTY = { groupKey: null, entries: [], mixed: false, focusField: null };

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

function fakeElement({
    attrs = {},
    classes = [],
    children = {},
    commerce = null,
    parentElement = null,
    visible = false,
    card = null,
} = {}) {
    return {
        visible,
        parentElement,
        getAttribute: (name) => attrs[name] ?? null,
        hasAttribute: (name) => name in attrs,
        querySelector: (selector) => children[selector] ?? (selector.includes('inline-price') ? commerce : null),
        closest: (selector) => (selector.includes('merch-card') ? card : null),
        classList: { contains: (name) => classes.includes(name) },
    };
}

function stampAttrs(stamps) {
    return Object.fromEntries(
        Object.entries(STAMP_ATTRS)
            .filter(([key]) => stamps[key])
            .map(([key, name]) => [name, stamps[key]]),
    );
}

function masField(
    stamps,
    { visible = true, card = null, content = fakeElement({ visible }), commerce = null, parentVisible = visible } = {},
) {
    const fragment = fakeElement({ attrs: { fragment: stamps.requestedId }, classes: stamps.failed ? ['error'] : [] });
    return fakeElement({
        attrs: { field: stamps.field, ...stampAttrs(stamps) },
        children: { 'aem-fragment': fragment, [CONTENT]: content },
        commerce,
        parentElement: fakeElement({ visible: parentVisible }),
        card,
    });
}

// The homepage card on a load where the swapped description rendered from its grouped replacement.
function homepageLoaded() {
    const shortDescription = masField(F.stamps.shortDescription);
    const description = masField({ ...F.stamps.description, failed: false, resolvedId: GROUPED });
    return { fields: [shortDescription, description], detected: [['field-2', badged(shortDescription, 'field')]] };
}

function unvaried(stamps) {
    return { ...stamps, variationId: null, promoProject: null, promoVariationProject: null };
}

function badged(element, elementType, extra = {}) {
    return { element, anchorElement: element, elementType, locale: 'en_US', country: 'US', cardName: 'CC Pro', ...extra };
}

// The homepage CC Lapsed card: the detector badged shortDescription; the failed description has no fragment-id.
function homepage(extra = {}) {
    const shortDescription = masField(F.stamps.shortDescription);
    return {
        fields: [shortDescription, masField(F.stamps.description, { visible: false })],
        detected: [['field-2', badged(shortDescription, 'field', extra)]],
    };
}

// A bare CTA from the swapped grouped fragment, unwrapped from its mas-field.
const swappedCta = () => fakeElement({ attrs: { 'fragment-id': GROUPED }, visible: true });

// The bridge posts onLoadState when the page loads, then answers every GET_MEP_STATE with replyState.
function loadSources(
    { fields = [], detected = [] },
    { onLoadState = F.inputs.mepState, replyState = F.inputs.mepState, misses = {} } = {},
) {
    const fetched = [];
    const messages = [];
    const marked = [];
    const listeners = [];
    const detectedCards = new Map(detected);
    const elements = { 'mas-field': fields, [OVERRIDES]: [fakeElement({ attrs: { fragment: GROUPED } })] };
    let contextWindow = null;
    const bridgePost = (state) => {
        const data = { source: 'mas-ext-page-bridge', type: 'MEP_STATE', state: JSON.stringify(state) };
        listeners.forEach((listener) => listener({ source: contextWindow, origin: F.ORIGIN, data }));
    };
    const sandbox = {
        location: { origin: F.ORIGIN },
        addEventListener: (type, listener) => listeners.push(listener),
        postMessage: (message) => {
            if (message?.type === 'GET_MEP_STATE') Promise.resolve().then(() => bridgePost(replyState));
        },
        document: { querySelectorAll: (selector) => elements[selector] ?? [] },
        chrome: {
            runtime: {
                sendMessage(message, callback) {
                    messages.push(message);
                    fetched.push(message.fragmentId);
                    const miss = misses[message.fragmentId];
                    const data = miss ? null : FRAGMENTS[message.fragmentId];
                    callback(data ? { success: true, data } : { success: false, error: 'fetch_failed', miss });
                },
            },
        },
        MASCardDetector: {
            detectedCards,
            currentLocale: () => ({ locale: 'en_US', country: 'US' }),
            getCardByFragmentId: (id) => detectedCards.get(id),
            hasBox: (element) => Boolean(element?.visible),
            fieldAnchor: CardDetector.prototype.fieldAnchor,
            getServiceConfig: () => SERVICE_CONFIG,
        },
        MASCardOverlay: { markMixed: (overlayId, mixed) => marked.push([overlayId, mixed]) },
    };
    sandbox.window = sandbox;
    sandbox.self = sandbox;
    const context = createContext(sandbox);
    for (const file of SCRIPTS) {
        runInContext(readFileSync(resolve(__dirname, '../..', file), 'utf8'), context, { filename: file });
    }
    // Inside the context, window is the context's global proxy, not the sandbox object itself.
    contextWindow = runInContext('window', context);
    bridgePost(onLoadState);
    return {
        sources: sandbox.MASSources,
        engine: sandbox.MASSourceEngine,
        mepState: sandbox.MASMepState,
        fetched,
        messages,
        marked,
    };
}

test('an inline field returns its whole card group with the clicked field focused', async () => {
    const { sources } = loadSources(homepage());
    const result = await sources.getSourcesFor('field-2');
    assert.equal(result.groupKey, AUTHORED);
    assert.deepEqual(plain(result.entries.map((e) => e.field).sort()), ['description', 'shortDescription']);
    assert.equal(result.focusField, 'shortDescription');
    assert.equal(result.mixed, true);
});

test('each variation is fetched once however many fields share it', async () => {
    const page = homepage();
    const features = masField({ ...F.stamps.shortDescription, field: 'features' });
    const { sources, fetched } = loadSources({ ...page, fields: [...page.fields, features] });
    await sources.getPageGroups();
    assert.equal(fetched.filter((id) => id === PROMO_VAR).length, 1);
});

test('an exhausted budget yields unknown entries instead of failing', async () => {
    const { sources } = loadSources(homepage());
    sources.consumeBudget(50);
    const result = await sources.getSourcesFor('field-2');
    assert.equal(result.entries.find((e) => e.field === 'shortDescription').source, 'unknown');
});

test('an exhausted budget is not consumed further', () => {
    const { sources } = loadSources(homepage());
    sources.consumeBudget(50);
    assert.equal(sources.consumeBudget(), false);
});

test('the homepage page groups match the captured sources and carry overlay ids', async () => {
    const { sources } = loadSources(homepage());
    const groups = await sources.getPageGroups();
    const [shortDescription, description] = F.groups[0].entries;
    const expected = {
        ...F.groups[0],
        overlayIds: ['field-2'],
        entries: [
            { ...shortDescription, overlayId: 'field-2' },
            { ...description, overlayId: null },
        ],
    };
    assert.deepEqual(plain(groups), [expected]);
});

test('a hidden responsive twin of shortDescription is deduped in favor of the shown one', async () => {
    const page = homepage();
    const twin = masField(F.stamps.shortDescription, { visible: false });
    const { sources } = loadSources({ ...page, fields: [twin, ...page.fields] });
    const result = await sources.getSourcesFor('field-2');
    const shortDescriptions = result.entries.filter((e) => e.field === 'shortDescription');
    assert.deepEqual(plain(shortDescriptions.map((e) => e.overlayId)), ['field-2']);
});

test('the fetch carries the element locale, country and service config', async () => {
    const { sources, messages } = loadSources(homepage());
    await sources.getSourcesFor('field-2');
    assert.deepEqual(plain(messages), [
        { type: 'FETCH_FRAGMENT_DATA', fragmentId: PROMO_VAR, locale: 'en_US', country: 'US', ...SERVICE_CONFIG },
        { type: 'FETCH_FRAGMENT_DATA', fragmentId: GROUPED, locale: 'en_US', country: 'US', ...SERVICE_CONFIG },
    ]);
});

test('a failed field is labeled with the reason IO gives for refusing it', async () => {
    const misses = { [GROUPED]: { kind: 'missing-locale', locale: 'en_GB' } };
    const { sources } = loadSources(homepage(), { misses });
    const result = await sources.getSourcesFor('field-2');
    const description = result.entries.find((e) => e.field === 'description');
    assert.deepEqual(
        [description.label, description.reason],
        ['Not in en_GB', `Fragment 369630bd has no en_GB copy, so this field renders empty; Swapped by MEP · ${MANIFEST}`],
    );
});

test('a field the detector has not badged yet fetches with the page locale', async () => {
    const { sources, messages } = loadSources({ fields: [masField(F.stamps.shortDescription)] });
    await sources.getPageGroups();
    assert.deepEqual(plain(messages.map(({ locale, country }) => ({ locale, country }))), [{ locale: 'en_US', country: 'US' }]);
});

test('a regional locale notes that a regional promo may also apply', async () => {
    const { sources } = loadSources(homepage({ locale: 'fr_CA', country: 'CA' }));
    const result = await sources.getSourcesFor('field-2');
    const entry = result.entries.find((e) => e.field === 'shortDescription');
    assert.equal(entry.reason, `IO applied promo ${PROMO_PROJECT}; Regional promo may also apply`);
});

test('a badged bare CTA joins its card group, labeled from its fetched replacement', async () => {
    const page = homepage();
    const { sources } = loadSources({ ...page, detected: [...page.detected, ['cta-3', badged(swappedCta(), 'cta')]] });
    const result = await sources.getSourcesFor('cta-3');
    const cta = result.entries.find((e) => e.overlayId === 'cta-3');
    assert.equal(result.groupKey, AUTHORED);
    assert.equal(result.focusField, 'ctas');
    assert.equal(cta.label, 'Grouped variation · cc-lapsed');
    assert.equal(cta.reason, `Swapped by MEP · ${MANIFEST}`);
});

test('markMixed is called for each overlay id in a mixed group', async () => {
    const page = homepage();
    const { sources, marked } = loadSources({ ...page, detected: [...page.detected, ['cta-3', badged(swappedCta(), 'cta')]] });
    await sources.getSourcesFor('field-2');
    assert.deepEqual(plain(marked), [
        ['field-2', true],
        ['cta-3', true],
    ]);
});

test('a mas-field inside a merch-card stays out of the inline groups', async () => {
    const page = homepage();
    const insideCard = masField({ ...F.stamps.shortDescription, field: 'features' }, { card: fakeElement() });
    const { sources } = loadSources({ ...page, fields: [...page.fields, insideCard] });
    const result = await sources.getSourcesFor('field-2');
    assert.equal(
        result.entries.some((e) => e.field === 'features'),
        false,
    );
});

test('a standalone offer gets the empty result', async () => {
    const offer = fakeElement({ attrs: { 'data-wcs-osi': 'osi-1' }, visible: true });
    const { sources, fetched } = loadSources({ detected: [['price-1', badged(offer, 'price')]] });
    assert.deepEqual(plain(await sources.getSourcesFor('price-1')), EMPTY);
    assert.equal(fetched.length, 0);
});

test('a collection gets the empty result', async () => {
    const collection = fakeElement({ children: { 'aem-fragment': fakeElement({ attrs: { fragment: AUTHORED } }) } });
    const { sources } = loadSources({ detected: [[AUTHORED, badged(collection, 'collection')]] });
    assert.deepEqual(plain(await sources.getSourcesFor(AUTHORED)), EMPTY);
});

// A whole merch-card requested by the authored id with the promo variation applied.
async function wholeCardSources(variant) {
    const card = fakeElement({
        attrs: stampAttrs({ variationId: PROMO_VAR, promoProject: PROMO_PROJECT, promoVariationProject: PROMO_PROJECT }),
        children: { 'aem-fragment': fakeElement({ attrs: { fragment: AUTHORED } }) },
    });
    const { sources } = loadSources({ detected: [[AUTHORED, badged(card, 'card', { variant })]] });
    const result = await sources.getSourcesFor(AUTHORED);
    return { ...result, byField: Object.fromEntries(result.entries.map((e) => [e.field, e])) };
}

test('a whole card resolves each variation field against its own overlay id', async () => {
    const result = await wholeCardSources('plans');
    assert.equal(result.groupKey, AUTHORED);
    assert.equal(result.focusField, null);
    assert.equal(result.byField.shortDescription.source, 'promo');
    assert.equal(result.byField.description.source, 'default');
    assert.ok(result.entries.every((e) => e.overlayId === AUTHORED));
});

test('a whole card passes its variant to the merge rule', async () => {
    const { byField } = await wholeCardSources('compare-chart-column');
    assert.equal(byField.features.reason, 'Combined with default card features');
});

test('a stale empty MEP state from page load is replaced by the fresh reply before resolving', async () => {
    const { sources } = loadSources(homepageLoaded(), { onLoadState: STALE_STATE });
    const result = await sources.getSourcesFor('field-2');
    const description = result.entries.find((e) => e.field === 'description');
    assert.deepEqual([result.groupKey, result.mixed], [AUTHORED, true]);
    assert.deepEqual(
        [description.label, description.reason],
        ['Grouped variation · cc-lapsed', `Swapped by MEP · ${MANIFEST}`],
    );
});

test('after a stale load-time MEP state the page trace shows the MEP swap', async () => {
    const { sources, engine, mepState } = loadSources(homepageLoaded(), { onLoadState: STALE_STATE });
    const groups = await sources.getPageGroups();
    const [card] = engine.buildPageTrace(groups, mepState.latest()).cards;
    assert.equal(card.groupKey, AUTHORED);
    assert.ok(card.steps.includes(`MEP swaps description, ctas → 369630bd (${MANIFEST})`));
});

test('a field authored with an id in mas-overrides is not swapped once the fresh map lists other swaps', async () => {
    const title = masField({ ...F.stamps.description, field: 'title', failed: false, resolvedId: GROUPED });
    const { sources, fetched } = loadSources({ fields: [title] });
    const [group] = await sources.getPageGroups();
    assert.deepEqual([group.groupKey, group.entries[0].swapped], [GROUPED, false]);
    assert.equal(fetched.includes(GROUPED), false);
});

function wholeCard() {
    return fakeElement({ children: { 'aem-fragment': fakeElement({ attrs: { fragment: AUTHORED } }) } });
}

test('a whole card with no variation lists its own fields from the requested fragment', async () => {
    const { sources } = loadSources({ detected: [[AUTHORED, badged(wholeCard(), 'card', { variant: 'plans' })]] });
    const result = await sources.getSourcesFor(AUTHORED);
    assert.deepEqual(plain(result.entries.map((e) => [e.field, e.reason])), [
        ['cardTitle', 'No variation applied'],
        ['description', 'No variation applied'],
    ]);
});

test('a whole card reuses the card-name fetch of its requested fragment', async () => {
    const { sources, fetched } = loadSources({ detected: [[AUTHORED, badged(wholeCard(), 'card', { variant: 'plans' })]] });
    await sources.fetchFragment(AUTHORED, 'en_US', 'US');
    await sources.getSourcesFor(AUTHORED);
    assert.equal(fetched.filter((id) => id === AUTHORED).length, 1);
});

test('same-field members from different fetches are both kept', async () => {
    const page = homepageLoaded();
    const authoredDescription = masField(unvaried({ ...F.stamps.shortDescription, field: 'description' }));
    const { sources } = loadSources({ ...page, fields: [...page.fields, authoredDescription] });
    const result = await sources.getSourcesFor('field-2');
    const descriptions = result.entries.filter((e) => e.field === 'description');
    assert.deepEqual(plain(descriptions.map((e) => e.requestedId).sort()), [GROUPED, AUTHORED].sort());
});

test('a badged field is kept over a shown unbadged twin listed before it', async () => {
    const page = homepage();
    const twin = masField(F.stamps.shortDescription);
    const { sources } = loadSources({ ...page, fields: [twin, ...page.fields] });
    const result = await sources.getSourcesFor('field-2');
    const shortDescriptions = result.entries.filter((e) => e.field === 'shortDescription');
    assert.deepEqual(plain(shortDescriptions.map((e) => e.overlayId)), ['field-2']);
});

test('a price field that renders through its commerce child counts as shown', async () => {
    const stamps = unvaried({ ...F.stamps.shortDescription, field: 'prices' });
    const prices = masField(stamps, { content: null, commerce: fakeElement({ visible: true }), parentVisible: false });
    const { sources } = loadSources({ fields: [prices] });
    const [group] = await sources.getPageGroups();
    assert.deepEqual(plain(group.entries.map((e) => e.field)), ['prices']);
});

test('a field whose content span has no box is hidden even when its parent has one', async () => {
    const hidden = masField(F.stamps.shortDescription, { content: fakeElement({ visible: false }), parentVisible: true });
    const { sources } = loadSources({ fields: [hidden] });
    const [group] = await sources.getPageGroups();
    assert.deepEqual(plain(group.entries), []);
});
