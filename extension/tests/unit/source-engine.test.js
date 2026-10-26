const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createContext, runInContext } = require('node:vm');

const F = require('./fixtures/homepage-cc-lapsed.js');
const { AUTHORED, AUTHORED_RESOLVED, GROUPED, PROMO_VAR, MASK_ID, MANIFEST, PROMO_PROJECT, PROMO_FOLDER } = F;

const UTILS = ['fragment-parser.js', 'merge-mirror.js', 'mep-state.js', 'source-engine.js'];

function loadEngine() {
    const sandbox = { location: { origin: F.ORIGIN }, addEventListener: () => {}, postMessage: () => {} };
    sandbox.window = sandbox;
    sandbox.self = sandbox;
    const context = createContext(sandbox);
    for (const file of UTILS) {
        runInContext(readFileSync(resolve(__dirname, '../../utils', file), 'utf8'), context, { filename: file });
    }
    return sandbox.MASSourceEngine;
}

const { readStamps, swapFor, resolveField, resolveCard, groupKey, isMixed } = loadEngine();

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

function fakeElement({ attrs = {}, classes = [], fragment = null, owner = null } = {}) {
    return {
        getAttribute: (name) => (name in attrs ? attrs[name] : null),
        hasAttribute: (name) => name in attrs,
        querySelector: (selector) => (selector === 'aem-fragment' ? fragment : null),
        closest: (selector) => (selector === 'mas-field[field]' ? owner : null),
        classList: { contains: (name) => classes.includes(name) },
    };
}

function aemFragment(id, classes = []) {
    return fakeElement({ attrs: { fragment: id }, classes });
}

const CARD = {
    field: '',
    requestedId: AUTHORED,
    resolvedId: AUTHORED,
    variationId: PROMO_VAR,
    maskId: null,
    promoProject: PROMO_PROJECT,
    promoVariationProject: PROMO_PROJECT,
    failed: false,
    loading: false,
};

test('acceptance: the unswapped shortDescription comes from the IO-applied promo', () => {
    const e = resolveField(F.stamps.shortDescription, F.inputs);
    assert.equal(e.source, 'promo');
    assert.equal(e.reason, 'IO applied promo GlobalIntroPricingHPandGNAV');
});

test('acceptance: the MEP-swapped description that failed to load says so and names the manifest', () => {
    const e = resolveField(F.stamps.description, F.inputs);
    assert.equal(e.source, 'failed');
    assert.equal(e.reason, 'Fragment 369630bd did not load; Swapped by MEP · hp-09-21-26-mas-implementation-pzn.json');
});

test('a swapped grouped field that loads is labeled grouped with the manifest', () => {
    const e = resolveField(
        { ...F.stamps.description, failed: false, resolvedId: GROUPED },
        { ...F.inputs, requestedData: F.groupedData },
    );
    assert.equal(e.source, 'grouped');
    assert.equal(e.label, 'Grouped · cc-lapsed');
});

test('without MEP state a field listed in mas-overrides is swapped with the ?mep hint', () => {
    const e = resolveField(
        { ...F.stamps.description, failed: false },
        { ...F.inputs, mepState: null, requestedData: F.groupedData },
    );
    assert.equal(e.reason, 'Swapped by MEP — add ?mep to the URL to see which manifest');
});

test('a field the variation left empty is inherited from the default card', () => {
    const e = resolveField({ ...F.stamps.shortDescription, field: 'description' }, F.inputs);
    assert.equal(e.source, 'default');
    assert.equal(e.reason, 'Inherited from default card — variation left it empty');
});

test('missing variation data is unknown, never default', () => {
    const e = resolveField(F.stamps.shortDescription, { ...F.inputs, variationData: null });
    assert.equal(e.source, 'unknown');
    assert.equal(e.reason, 'Variation fields unavailable');
});

test('a card mixing an MEP-swapped field with an IO-merged field is mixed', () => {
    assert.equal(isMixed([F.entry('shortDescription', AUTHORED, PROMO_VAR), F.entry('description', GROUPED, null)]), true);
});

test('variation and inherited fields from one fetch are not mixed', () => {
    assert.equal(isMixed([F.entry('shortDescription', AUTHORED, PROMO_VAR), F.entry('cardTitle', AUTHORED, PROMO_VAR)]), false);
});

test('a swapped field groups under its authored card id', () => {
    assert.equal(groupKey(F.stamps.description, F.inputs.mepState), AUTHORED);
});

test('a mask that sets the field wins over the variation', () => {
    const stamps = { ...F.stamps.shortDescription, maskId: MASK_ID };
    const e = resolveField(stamps, { ...F.inputs, maskData: { fields: { shortDescription: { value: 'Masked' } } } });
    assert.equal(e.source, 'mask');
    assert.equal(e.reason, `Mask ${MASK_ID.slice(0, 8)} applied after the variation`);
});

test('a promo on a region-locale page notes the regional promo', () => {
    const e = resolveField(F.stamps.shortDescription, { ...F.inputs, isRegionLocale: true });
    assert.equal(e.reason, 'IO applied promo GlobalIntroPricingHPandGNAV; Regional promo may also apply');
});

test('an IO-merged field opens the variation that supplied it', () => {
    assert.equal(resolveField(F.stamps.shortDescription, F.inputs).supplierId, PROMO_VAR);
});

test('an MEP-swapped field opens its replacement fragment', () => {
    assert.equal(resolveField(F.stamps.description, F.inputs).supplierId, GROUPED);
});

test('a field inherited from the default card opens the requested card', () => {
    assert.equal(resolveField({ ...F.stamps.shortDescription, field: 'description' }, F.inputs).supplierId, AUTHORED);
});

test('a masked field has no fragment to open', () => {
    const stamps = { ...F.stamps.shortDescription, maskId: MASK_ID };
    const e = resolveField(stamps, { ...F.inputs, maskData: { fields: { shortDescription: { value: 'Masked' } } } });
    assert.equal(e.supplierId, null);
});

test('an IO-applied promo carries its project folder name and stamped title', () => {
    assert.deepEqual(plain(resolveField(F.stamps.shortDescription, F.inputs).promotion), {
        name: PROMO_FOLDER,
        title: PROMO_PROJECT,
    });
});

test('a field inherited from the default card carries no promotion', () => {
    assert.equal(resolveField({ ...F.stamps.shortDescription, field: 'description' }, F.inputs).promotion, null);
});

test('an MEP-swapped promo fragment carries the promotion named by its folder', () => {
    const promoData = { path: '/content/dam/mas/acom/en_US/promotions/blackfriday/card', fields: { description: {} } };
    const e = resolveField({ ...F.stamps.description, failed: false }, { ...F.inputs, requestedData: promoData });
    assert.deepEqual(plain(e.promotion), { name: 'blackfriday', title: null });
});

test('the fixture entries are what the engine resolves for the two stamped fields', () => {
    const entries = [resolveField(F.stamps.shortDescription, F.inputs), resolveField(F.stamps.description, F.inputs)];
    assert.deepEqual(plain(entries), F.result.entries);
});

test('a mas-field reads its requested id from the child aem-fragment and the rest from its own stamps', () => {
    const element = fakeElement({
        attrs: {
            field: 'shortDescription',
            'fragment-id': AUTHORED_RESOLVED,
            'variation-id': PROMO_VAR,
            'data-promotion-project': PROMO_PROJECT,
            'data-promotion-variation-project': PROMO_PROJECT,
        },
        fragment: aemFragment(AUTHORED),
    });
    assert.deepEqual(plain(readStamps(element, 'field')), F.stamps.shortDescription);
});

test('a mas-field whose aem-fragment has the error class failed rather than loading', () => {
    const element = fakeElement({ attrs: { field: 'description' }, fragment: aemFragment(GROUPED, ['error']) });
    const stamps = readStamps(element, 'field');
    assert.deepEqual([stamps.failed, stamps.loading], [true, false]);
});

test('a mas-field with no fragment-id and no error class is still loading', () => {
    const element = fakeElement({ attrs: { field: 'description' }, fragment: aemFragment(GROUPED) });
    const stamps = readStamps(element, 'field');
    assert.deepEqual([stamps.failed, stamps.loading], [false, true]);
});

test('a loading field is unknown until its fragment arrives', () => {
    const e = resolveField({ ...F.stamps.description, failed: false, loading: true }, F.inputs);
    assert.deepEqual([e.source, e.label, e.reason], ['unknown', 'Unknown', 'Fragment still loading']);
});

test('a merch-card uses its aem-fragment id as both requested and resolved id', () => {
    const element = fakeElement({ attrs: { 'variation-id': PROMO_VAR }, fragment: aemFragment(AUTHORED) });
    const stamps = readStamps(element, 'card');
    assert.deepEqual(
        [stamps.field, stamps.requestedId, stamps.resolvedId, stamps.variationId],
        ['', AUTHORED, AUTHORED, PROMO_VAR],
    );
});

test('a merch-card with the failed attribute failed', () => {
    const element = fakeElement({ attrs: { failed: '' }, fragment: aemFragment(AUTHORED) });
    assert.equal(readStamps(element, 'card').failed, true);
});

test('an unwrapped CTA has no requested id and reads its own stamps', () => {
    const element = fakeElement({ attrs: { 'fragment-id': AUTHORED_RESOLVED, 'mask-id': MASK_ID } });
    const stamps = readStamps(element, 'cta');
    assert.deepEqual(
        [stamps.field, stamps.requestedId, stamps.resolvedId, stamps.maskId, stamps.failed],
        ['ctas', null, AUTHORED_RESOLVED, MASK_ID, false],
    );
});

test('a bare price inside a mas-field takes the field name from the mas-field', () => {
    const owner = fakeElement({ attrs: { field: 'prices[0]' } });
    assert.equal(readStamps(fakeElement({ owner }), 'price').field, 'prices[0]');
});

test('a swapped field records the swap, its authored card and the manifest', () => {
    const e = resolveField(
        { ...F.stamps.description, failed: false, resolvedId: GROUPED },
        { ...F.inputs, requestedData: F.groupedData },
    );
    assert.deepEqual([e.swapped, e.authoredId, e.manifestId], [true, AUTHORED, MANIFEST]);
});

test('an unwrapped element with no requested id is matched to its swap by resolved id', () => {
    const stamps = { ...F.stamps.description, field: 'ctas', requestedId: null, resolvedId: GROUPED, failed: false };
    const e = resolveField(stamps, { ...F.inputs, requestedData: F.groupedData });
    assert.equal(e.swapped, true);
    assert.equal(e.source, 'grouped');
});

test('a field whose fragment is not an MEP replacement is not swapped without MEP state', () => {
    assert.equal(resolveField(F.stamps.shortDescription, { ...F.inputs, mepState: null }).swapped, false);
});

test('a swapped field whose replacement data is missing is unknown', () => {
    const e = resolveField({ ...F.stamps.description, failed: false }, F.inputs);
    assert.deepEqual([e.source, e.label], ['unknown', 'Unknown']);
    assert.equal(e.reason, `Swapped by MEP · ${MANIFEST}; Variation fields unavailable`);
});

test('a variation that IO merged onto a swapped fragment labels the fields it sets', () => {
    const stamps = { ...F.stamps.description, failed: false, variationId: PROMO_VAR, promoVariationProject: PROMO_PROJECT };
    const variationData = {
        ...F.inputs.variationData,
        fields: { description: { mimeType: 'text/html', value: 'Promo copy' } },
    };
    const e = resolveField(stamps, { ...F.inputs, requestedData: F.groupedData, variationData });
    assert.equal(e.source, 'promo');
    assert.equal(e.reason, `Swapped by MEP · ${MANIFEST}; IO applied promo ${PROMO_PROJECT}`);
});

test('a field the variation cleared keeps the variation as its source', () => {
    const variationData = { ...F.inputs.variationData, fields: { shortDescription: { mimeType: 'text/html', value: '' } } };
    const e = resolveField(F.stamps.shortDescription, { ...F.inputs, variationData });
    assert.equal(e.source, 'promo');
    assert.equal(e.reason, 'Variation cleared this field');
});

test('an IO-applied grouped variation names its audience', () => {
    const stamps = {
        ...F.stamps.shortDescription,
        field: 'description',
        variationId: GROUPED,
        promoProject: null,
        promoVariationProject: null,
    };
    const e = resolveField(stamps, { ...F.inputs, variationData: F.groupedData });
    assert.equal(e.label, 'Grouped · cc-lapsed');
    assert.equal(e.reason, 'IO applied grouped variation for cc-lapsed');
});

test('a field with no variation applied is the default card', () => {
    const stamps = { ...F.stamps.shortDescription, variationId: null, promoProject: null, promoVariationProject: null };
    const e = resolveField(stamps, F.inputs);
    assert.deepEqual([e.source, e.label, e.reason], ['default', 'Default card', 'No variation applied']);
});

test('a mask whose fields were not fetched makes the field unknown', () => {
    const e = resolveField({ ...F.stamps.shortDescription, maskId: MASK_ID }, F.inputs);
    assert.deepEqual(
        [e.source, e.label, e.reason],
        ['unknown', 'Unknown', `IO applied promo ${PROMO_PROJECT}; Mask 9a8b7c6d fields unavailable`],
    );
});

test('a mask that leaves the field keeps the content source', () => {
    const stamps = { ...F.stamps.shortDescription, maskId: MASK_ID };
    const e = resolveField(stamps, { ...F.inputs, maskData: { fields: { shortDescription: { mimeType: 'text/html' } } } });
    assert.deepEqual([e.source, e.reason], ['promo', `IO applied promo ${PROMO_PROJECT}`]);
});

test('a field inherited on a region-locale promo card also notes the regional promo', () => {
    const e = resolveField({ ...F.stamps.shortDescription, field: 'description' }, { ...F.inputs, isRegionLocale: true });
    assert.equal(e.reason, 'Inherited from default card — variation left it empty; Regional promo may also apply');
});

test('a card with a variation gets one entry per variation field', () => {
    const sources = Object.fromEntries(resolveCard(CARD, F.inputs, { variant: 'plans' }).map((e) => [e.field, e.source]));
    assert.deepEqual(plain(sources), {
        badge: 'default',
        trialBadge: 'default',
        prices: 'default',
        description: 'default',
        shortDescription: 'promo',
        callout: 'default',
        ctas: 'default',
        features: 'promo',
        customFields: 'promo',
        image: 'default',
        backgrounds: 'default',
    });
});

test('a card without a variation lists its own fields as the default card', () => {
    const stamps = { ...CARD, variationId: null, promoProject: null, promoVariationProject: null };
    const requestedData = { fields: { cardTitle: 'CC Pro', description: { mimeType: 'text/html' }, variations: [], tags: [] } };
    const entries = resolveCard(stamps, { ...F.inputs, requestedData }, { variant: 'plans' });
    assert.deepEqual(plain(entries.map((e) => [e.field, e.reason])), [
        ['cardTitle', 'No variation applied'],
        ['description', 'No variation applied'],
    ]);
});

test('a card swapped as a whole marks every field swapped', () => {
    const mepState = {
        preview: true,
        swaps: [{ authoredId: AUTHORED, field: '', replacementId: GROUPED, manifestId: MANIFEST }],
    };
    const stamps = {
        ...CARD,
        requestedId: GROUPED,
        resolvedId: GROUPED,
        variationId: null,
        promoProject: null,
        promoVariationProject: null,
    };
    const entries = resolveCard(stamps, { ...F.inputs, mepState, requestedData: F.groupedData }, { variant: 'plans' });
    assert.deepEqual(plain(entries.map((e) => [e.field, e.label, e.swapped])), [
        ['description', 'Grouped · cc-lapsed', true],
        ['ctas', 'Grouped · cc-lapsed', true],
    ]);
});

test('a failed card is a single failed entry', () => {
    const entries = resolveCard({ ...CARD, failed: true }, F.inputs, { variant: 'plans' });
    assert.deepEqual(plain(entries.map((e) => [e.field, e.source])), [['', 'failed']]);
});

test('an unswapped field groups under its requested id', () => {
    assert.equal(groupKey(F.stamps.shortDescription, F.inputs.mepState), AUTHORED);
});

test('an unwrapped element without a swap groups under its resolved id', () => {
    const stamps = { ...F.stamps.shortDescription, requestedId: null };
    assert.equal(groupKey(stamps, F.inputs.mepState), AUTHORED_RESOLVED);
});

const BARE_CTA = {
    field: 'ctas',
    requestedId: null,
    resolvedId: AUTHORED_RESOLVED,
    variationId: null,
    maskId: null,
    promoProject: null,
    promoVariationProject: null,
    failed: false,
    loading: false,
};

test('a field listed in mas-overrides is swapped even when the MEP map has no swaps yet', () => {
    const inputs = { ...F.inputs, mepState: { preview: false, swaps: [] }, requestedData: F.groupedData };
    const e = resolveField({ ...F.stamps.description, failed: false }, inputs);
    assert.deepEqual(
        [e.swapped, e.label, e.reason],
        [true, 'Grouped · cc-lapsed', 'Swapped by MEP — add ?mep to the URL to see which manifest'],
    );
});

test('an unwrapped element that matches no swap for its swapped field is unknown, not default', () => {
    const e = resolveField(BARE_CTA, F.inputs);
    assert.deepEqual([e.source, e.label, e.reason], ['unknown', 'Unknown', 'Could not match this element to an MEP swap']);
});

test('an element with neither a requested nor a resolved id is not linked to a fragment', () => {
    const e = resolveField({ ...BARE_CTA, resolvedId: null }, F.inputs);
    assert.deepEqual([e.source, e.label, e.reason], ['unknown', 'Unknown', 'Not linked to a MAS fragment']);
});

test('variation data whose fields are not an object is unavailable', () => {
    const variationData = { ...F.inputs.variationData, fields: [{ name: 'shortDescription', values: ['Save'] }] };
    const e = resolveField(F.stamps.shortDescription, { ...F.inputs, variationData });
    assert.deepEqual([e.source, e.reason], ['unknown', 'Variation fields unavailable']);
});

test('compare-chart features combined with the default card keep the variation label', () => {
    const variationData = { ...F.inputs.variationData, fields: { features: { value: ['f'] } } };
    const [e] = resolveCard(CARD, { ...F.inputs, variationData }, { variant: 'compare-chart-column' });
    assert.deepEqual(
        [e.field, e.source, e.label, e.reason],
        ['features', 'promo', `Promo · ${PROMO_PROJECT}`, 'Combined with default card features'],
    );
});

test('a failed fragment with no id has no gap in its reason', () => {
    const e = resolveField({ ...F.stamps.description, requestedId: null }, F.inputs);
    assert.equal(e.reason, 'Fragment did not load');
});

const OVERRIDES = new Set([GROUPED]);
const LOADED_DESCRIPTION = { ...F.stamps.description, failed: false, resolvedId: GROUPED };
const TITLE_ONLY_MAP = {
    preview: true,
    swaps: [{ authoredId: AUTHORED, field: 'title', replacementId: AUTHORED_RESOLVED, manifestId: MANIFEST }],
};

test('swapFor reports the map swap with its authored card and manifest', () => {
    assert.deepEqual(plain(swapFor(LOADED_DESCRIPTION, F.inputs.mepState, OVERRIDES)), {
        swapped: true,
        authoredId: AUTHORED,
        manifestId: MANIFEST,
    });
});

test('swapFor ignores mas-overrides once the MEP map lists swaps', () => {
    assert.equal(swapFor(LOADED_DESCRIPTION, TITLE_ONLY_MAP, OVERRIDES).swapped, false);
});

test('swapFor falls back to mas-overrides while the MEP map is empty', () => {
    assert.equal(swapFor(LOADED_DESCRIPTION, { preview: false, swaps: [] }, OVERRIDES).swapped, true);
});

test('swapFor falls back to mas-overrides without MEP state', () => {
    assert.equal(swapFor(LOADED_DESCRIPTION, null, OVERRIDES).swapped, true);
});

test('a field authored with an id in mas-overrides is not swapped when a populated map does not list it', () => {
    const e = resolveField(LOADED_DESCRIPTION, { ...F.inputs, mepState: TITLE_ONLY_MAP, overrideIds: OVERRIDES });
    assert.deepEqual([e.swapped, e.source], [false, 'default']);
});

test('a swap without a manifest under MEP preview says the manifest is unknown, not the ?mep hint', () => {
    const inputs = { ...F.inputs, mepState: { preview: true, swaps: [] }, requestedData: F.groupedData };
    assert.equal(resolveField(LOADED_DESCRIPTION, inputs).reason, 'Swapped by MEP — manifest unknown');
});

test('a failed swap without a manifest under MEP preview says the manifest is unknown', () => {
    const e = resolveField(F.stamps.description, { ...F.inputs, mepState: { preview: true, swaps: [] } });
    assert.equal(e.reason, 'Fragment 369630bd did not load; Swapped by MEP — manifest unknown');
});

test('an IO-merged field is flagged ioMerged', () => {
    assert.equal(resolveField(F.stamps.shortDescription, F.inputs).ioMerged, true);
});

test('a swapped field whose stamped variation left it is labeled by its replacement and not ioMerged', () => {
    const stamps = { ...LOADED_DESCRIPTION, variationId: PROMO_VAR, promoVariationProject: PROMO_PROJECT };
    const e = resolveField(stamps, { ...F.inputs, requestedData: F.groupedData });
    assert.deepEqual([e.source, e.ioMerged], ['grouped', false]);
});
