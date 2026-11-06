// The stage homepage CC Lapsed card, captured in the MWPW-212853 spike (2026-10-23).
// Live: AUTHORED_RESOLVED, GROUPED, PROMO_VAR, CCI_PROMO, the manifest, the promo project, the MEP swaps,
// the stamps, and which variationData fields carry a value.
// Synthetic:
// - AUTHORED (only its 8-char prefix was captured) and MASK_ID.
// - variationData pairs PROMO_VAR (the stamped variation-id) with the CCI promo's field shapes; the
//   features/customFields values and fields.tags are stand-ins.
// - groupedData's path and field values (only its /pzn/ placement and the cc-lapsed tag are real).
const ORIGIN = 'https://www.stage.adobe.com';
const AUTHORED = '4e3e071a-1111-4222-8333-444455556666';
const AUTHORED_RESOLVED = '2dd8b980-2196-487a-b7d1-103c92cfb89c';
const GROUPED = '369630bd-47aa-4eeb-9660-0fa52158d910';
const PROMO_VAR = 'da021c0a-51de-4cda-a033-766cd6ea9d73';
const CCI_PROMO = 'c724d6ba-721d-42ce-86b8-e085af199851';
const MASK_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const MANIFEST = 'hp-09-21-26-mas-implementation-pzn.json';
const PROMO_PROJECT = 'GlobalIntroPricingHPandGNAV';
// The promo variation's folder, named after the project's mas:promotion tag.
const PROMO_FOLDER = 'globalintropricinghpandgnav';

const stamps = {
    shortDescription: {
        field: 'shortDescription',
        requestedId: AUTHORED,
        resolvedId: AUTHORED_RESOLVED,
        variationId: PROMO_VAR,
        maskId: null,
        promoProject: PROMO_PROJECT,
        promoVariationProject: PROMO_PROJECT,
        failed: false,
        loading: false,
    },
    description: {
        field: 'description',
        requestedId: GROUPED,
        resolvedId: null,
        variationId: null,
        maskId: null,
        promoProject: null,
        promoVariationProject: null,
        failed: true,
        loading: false,
    },
};

const mepState = {
    preview: true,
    swaps: [
        { authoredId: AUTHORED, field: 'description', replacementId: GROUPED, manifestId: MANIFEST },
        { authoredId: AUTHORED, field: 'ctas[2u25ddjvjn]', replacementId: GROUPED, manifestId: MANIFEST },
    ],
};

// Fetched by the stamped variation-id; field shapes are the CCI promo's (CCI_PROMO) as IO returned them live.
const variationData = {
    id: PROMO_VAR,
    path: '/content/dam/mas/acom/en_US/promotions/globalintropricinghpandgnav/homepage-cpro-headless-individuals-default',
    fields: {
        badge: { mimeType: 'text/html' },
        trialBadge: { mimeType: 'text/html' },
        prices: { mimeType: 'text/html' },
        description: { mimeType: 'text/html' },
        shortDescription: { mimeType: 'text/html', value: 'Save 55% on Creative Cloud Pro' },
        callout: { mimeType: 'text/html' },
        ctas: { mimeType: 'text/html' },
        features: { mimeType: 'text/html', value: '<ul><li>20+ creative apps</li></ul>' },
        customFields: { mimeType: 'application/json', value: '{"promoLabel":"Save 55%"}' },
        image: { mimeType: 'text/html' },
        backgrounds: { mimeType: 'text/html' },
        variations: [],
        pznTags: [],
        tags: ['mas:product_code/ccsn'],
    },
};

const groupedData = {
    id: GROUPED,
    path: '/content/dam/mas/acom/en_US/pzn/homepage-cpro-cc-lapsed',
    fields: {
        description: { mimeType: 'text/html', value: '<p>Welcome back to Creative Cloud Pro</p>' },
        ctas: { mimeType: 'text/html', value: '<a href="#">Buy now</a>' },
        variations: [],
        pznTags: ['mas:pzn/cc-lapsed'],
    },
};

const inputs = {
    mepState,
    overrideIds: new Set([GROUPED]),
    variationData,
    requestedData: null,
    maskData: null,
    isRegionLocale: false,
};

function entry(field, requestedId, variationId) {
    const source = variationId
        ? { source: 'promo', label: `Promotion variation · ${PROMO_PROJECT}`, reason: `IO applied promo ${PROMO_PROJECT}` }
        : { source: 'default', label: 'Default card', reason: 'No variation applied' };
    const ioMerged = Boolean(variationId);
    return { field, ...source, requestedId, variationId, authoredId: requestedId, manifestId: null, swapped: false, ioMerged };
}

// What the source engine resolves for the two stamped fields above.
const entries = [
    {
        field: 'shortDescription',
        source: 'promo',
        label: `Promotion variation · ${PROMO_PROJECT}`,
        reason: `IO applied promo ${PROMO_PROJECT}`,
        requestedId: AUTHORED,
        variationId: PROMO_VAR,
        authoredId: AUTHORED,
        manifestId: null,
        swapped: false,
        ioMerged: true,
        supplierId: PROMO_VAR,
        promotion: { name: PROMO_FOLDER, title: PROMO_PROJECT },
    },
    {
        field: 'description',
        source: 'failed',
        label: 'Failed to load',
        reason: `Fragment 369630bd did not load; Swapped by MEP · ${MANIFEST}`,
        requestedId: GROUPED,
        variationId: null,
        authoredId: AUTHORED,
        manifestId: MANIFEST,
        swapped: true,
        ioMerged: false,
        supplierId: GROUPED,
        promotion: null,
    },
];

const result = { groupKey: AUTHORED, entries, mixed: true, focusField: 'shortDescription' };
const groups = [{ groupKey: AUTHORED, cardName: 'CC Pro', entries, mixed: true }];

module.exports = {
    ORIGIN,
    AUTHORED,
    AUTHORED_RESOLVED,
    GROUPED,
    PROMO_VAR,
    CCI_PROMO,
    MASK_ID,
    MANIFEST,
    PROMO_PROJECT,
    PROMO_FOLDER,
    stamps,
    inputs,
    groupedData,
    entry,
    result,
    groups,
};
