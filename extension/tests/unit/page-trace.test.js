const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createContext, runInContext } = require('node:vm');

const F = require('./fixtures/homepage-cc-lapsed.js');
const { AUTHORED, GROUPED } = F;

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

const { buildPageTrace, resolveField, resolveCard, groupKey } = loadEngine();
const plain = (value) => JSON.parse(JSON.stringify(value));

const { MANIFEST, PROMO_VAR, PROMO_PROJECT } = F;
const LOADED_DESCRIPTION = { ...F.stamps.description, failed: false, resolvedId: GROUPED };
const CARD = { ...F.stamps.description, field: '', requestedId: AUTHORED, resolvedId: AUTHORED, failed: false };

// The trace for one group built the way sources.js builds it: the engine's own entries and group key.
function stepsFor(stamps, entries, mepState) {
    const group = { groupKey: groupKey(stamps, mepState), cardName: 'Card', entries, mixed: false };
    return plain(buildPageTrace([group], mepState).cards[0].steps);
}

function wholeCardMap(manifestId) {
    return { preview: true, swaps: [{ authoredId: AUTHORED, field: '', replacementId: GROUPED, manifestId }] };
}

test('lists the manifest that swapped fields with its swap count', () => {
    const t = buildPageTrace(F.groups, F.inputs.mepState);
    assert.deepEqual(plain(t.mep.manifests), [
        {
            manifestId: 'hp-09-21-26-mas-implementation-pzn.json',
            swaps: [
                { authoredId: AUTHORED, field: 'description', replacementId: GROUPED },
                { authoredId: AUTHORED, field: 'ctas[2u25ddjvjn]', replacementId: GROUPED },
            ],
        },
    ]);
});

test('the homepage card chain reads request, MEP swap, IO merge, failure', () => {
    assert.deepEqual(plain(buildPageTrace(F.groups, F.inputs.mepState).cards[0].steps), [
        'Page asks for 4e3e071a',
        'MEP swaps description, ctas → 369630bd (hp-09-21-26-mas-implementation-pzn.json)',
        'IO merges Promo · GlobalIntroPricingHPandGNAV (da021c0a) into shortDescription',
        'Failed to load: description (369630bd)',
    ]);
});

test('the homepage card links each fragment id and the promo label in its steps', () => {
    assert.deepEqual(plain(buildPageTrace(F.groups, F.inputs.mepState).cards[0].links), [
        { text: '4e3e071a', fragmentId: AUTHORED },
        { text: '369630bd', fragmentId: GROUPED },
        { text: 'da021c0a', fragmentId: PROMO_VAR },
        { text: `Promo · ${PROMO_PROJECT}`, promotion: { name: F.PROMO_FOLDER, title: PROMO_PROJECT } },
    ]);
});

test('a card without merged variations links only its fragment ids', () => {
    const stamps = { ...CARD, failed: true };
    const entries = resolveCard(stamps, { mepState: null }, { variant: 'plans' });
    const group = { groupKey: groupKey(stamps, null), cardName: 'Card', entries, mixed: false };
    assert.deepEqual(plain(buildPageTrace([group], null).cards[0].links), [{ text: '4e3e071a', fragmentId: AUTHORED }]);
});

test('hidden twins of the same field are counted once', () => {
    const twin = { ...F.groups[0], entries: [...F.groups[0].entries, ...F.groups[0].entries] };
    assert.equal(buildPageTrace([twin], F.inputs.mepState).cards[0].steps.length, 4);
});

test('without MEP state the trace says details are unavailable', () => {
    const t = buildPageTrace(F.groups, null);
    assert.equal(t.mep.available, false);
    assert.deepEqual(plain(t.mep), { available: false, preview: false, manifests: [] });
});

test('without MEP state swap steps come from swapped entries with manifest unknown', () => {
    const steps = buildPageTrace(F.groups, null).cards[0].steps;
    assert.equal(steps[1], 'MEP swaps description → 369630bd (manifest unknown)');
});

test('groups sharing a groupKey stay separate cards', () => {
    const inline = { ...F.groups[0], cardName: 'Inline' };
    assert.equal(buildPageTrace([F.groups[0], inline], null).cards.length, 2);
});

test('a swap known only from mas-overrides gets a manifest-unknown step while the MEP map is empty', () => {
    const mepState = { preview: true, swaps: [] };
    const inputs = { mepState, overrideIds: new Set([GROUPED]), requestedData: F.groupedData };
    const entry = resolveField(LOADED_DESCRIPTION, inputs);
    assert.deepEqual(stepsFor(LOADED_DESCRIPTION, [entry], mepState), [
        'Page asks for 369630bd',
        'MEP swaps description → 369630bd (manifest unknown)',
    ]);
});

test('a whole-card swap reads whole card with its manifest', () => {
    const mepState = wholeCardMap(MANIFEST);
    const stamps = { ...CARD, requestedId: GROUPED, resolvedId: GROUPED };
    const entries = resolveCard(stamps, { mepState, requestedData: F.groupedData }, { variant: 'plans' });
    assert.deepEqual(stepsFor(stamps, entries, mepState), [
        'Page asks for 4e3e071a',
        `MEP swaps whole card → 369630bd (${MANIFEST})`,
    ]);
});

test('a whole-card swap without a manifest reads manifest unknown', () => {
    const mepState = wholeCardMap(null);
    const stamps = { ...CARD, requestedId: GROUPED, resolvedId: GROUPED };
    const entries = resolveCard(stamps, { mepState, requestedData: F.groupedData }, { variant: 'plans' });
    assert.equal(stepsFor(stamps, entries, mepState)[1], 'MEP swaps whole card → 369630bd (manifest unknown)');
});

test('a failed card reads Failed to load: card', () => {
    const stamps = { ...CARD, failed: true };
    const entries = resolveCard(stamps, { mepState: null }, { variant: 'plans' });
    assert.deepEqual(stepsFor(stamps, entries, null), ['Page asks for 4e3e071a', 'Failed to load: card (4e3e071a)']);
});

test('a failed field missing in the page language reads with its label', () => {
    const miss = { kind: 'missing-locale', locale: 'en_GB' };
    const entry = resolveField(F.stamps.description, { ...F.inputs, miss });
    const group = { groupKey: AUTHORED, cardName: 'CC Pro', entries: [entry], mixed: false };
    assert.equal(buildPageTrace([group], F.inputs.mepState).cards[0].steps.at(-1), 'Not in en_GB: description (369630bd)');
});

test('a swapped field with an IO-merged variation also gets its IO step', () => {
    const mepState = {
        preview: true,
        swaps: [{ authoredId: AUTHORED, field: 'shortDescription', replacementId: GROUPED, manifestId: MANIFEST }],
    };
    const stamps = {
        ...LOADED_DESCRIPTION,
        field: 'shortDescription',
        variationId: PROMO_VAR,
        promoVariationProject: PROMO_PROJECT,
    };
    const entry = resolveField(stamps, { ...F.inputs, mepState, requestedData: F.groupedData });
    assert.deepEqual(stepsFor(stamps, [entry], mepState), [
        'Page asks for 4e3e071a',
        `MEP swaps shortDescription → 369630bd (${MANIFEST})`,
        `IO merges Promo · ${PROMO_PROJECT} (da021c0a) into shortDescription`,
    ]);
});

test('a swapped field whose stamped variation left it gets no IO step', () => {
    const stamps = { ...LOADED_DESCRIPTION, variationId: PROMO_VAR, promoVariationProject: PROMO_PROJECT };
    const entry = resolveField(stamps, { ...F.inputs, requestedData: F.groupedData });
    assert.deepEqual(stepsFor(stamps, [entry], F.inputs.mepState), [
        'Page asks for 4e3e071a',
        `MEP swaps description, ctas → 369630bd (${MANIFEST})`,
    ]);
});
