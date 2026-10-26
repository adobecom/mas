const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    PROMOTIONS_LIST_URL,
    fetchPromotionProjects,
    findPromotionProjectId,
    createPromotionLookup,
} = require('../../api/promotion-lookup.js');

const PROJECT_ID = '68546840-ae2b-4ffe-980a-2679fdd1211a';
const DC_PROJECT_ID = '10a1295e-5068-42fe-a8ee-8c8c97009f71';
const PROJECTS = [
    { id: DC_PROJECT_ID, fields: { title: 'GlobalIntroPricingDC', tags: ['mas:promotion/globalintropricingdc'] } },
    { id: PROJECT_ID, fields: { title: 'GlobalIntroPricingHPandGNAV', tags: ['mas:promotion/globalintropricinghpandgnav'] } },
];

function stubFetch(pages) {
    const urls = [];
    global.fetch = async (url) => {
        urls.push(url);
        const page = pages[urls.length - 1];
        if (!page) return { ok: false, status: 500, json: async () => ({}) };
        return { ok: true, status: 200, json: async () => page };
    };
    return urls;
}

// A lookup whose listing answers from replies in order; null rejects that listing.
function lookupWith(replies) {
    let calls = 0;
    const lookup = createPromotionLookup(async () => {
        const reply = replies[Math.min(calls++, replies.length - 1)];
        if (!reply) throw new Error('listing failed');
        return reply;
    });
    return { lookup, calls: () => calls };
}

test('finds a project by the promotion tag its variation folder is named after', () => {
    assert.equal(findPromotionProjectId(PROJECTS, { name: 'globalintropricinghpandgnav' }), PROJECT_ID);
});

test('falls back to the project title IO stamps on the card', () => {
    assert.equal(findPromotionProjectId(PROJECTS, { title: 'GlobalIntroPricingHPandGNAV' }), PROJECT_ID);
});

test('the promotion tag wins over a title naming another project', () => {
    const id = findPromotionProjectId(PROJECTS, { name: 'globalintropricinghpandgnav', title: 'GlobalIntroPricingDC' });
    assert.equal(id, PROJECT_ID);
});

test('no matching name or title finds no project', () => {
    assert.equal(findPromotionProjectId(PROJECTS, { name: 'blackfriday', title: 'Black Friday' }), null);
});

test('lists the public promotions folder and follows its cursor', async () => {
    const urls = stubFetch([{ items: [PROJECTS[0]], cursor: 'c1' }, { items: [PROJECTS[1]] }]);
    const projects = await fetchPromotionProjects();
    assert.deepEqual(
        projects.map((project) => project.id),
        [DC_PROJECT_ID, PROJECT_ID],
    );
    assert.deepEqual(urls, [PROMOTIONS_LIST_URL, `${PROMOTIONS_LIST_URL}&cursor=c1`]);
});

test('a failed listing page rejects', async () => {
    stubFetch([]);
    await assert.rejects(() => fetchPromotionProjects(), /HTTP 500/);
});

test('the listing is fetched once across lookups', async () => {
    const { lookup, calls } = lookupWith([PROJECTS]);
    await lookup.resolveProjectId({ name: 'globalintropricinghpandgnav' });
    await lookup.resolveProjectId({ name: 'globalintropricingdc' });
    assert.equal(calls(), 1);
});

test('a failed listing is retried on the next lookup', async () => {
    const { lookup, calls } = lookupWith([null, PROJECTS]);
    await assert.rejects(() => lookup.resolveProjectId({ name: 'globalintropricinghpandgnav' }));
    assert.equal(await lookup.resolveProjectId({ name: 'globalintropricinghpandgnav' }), PROJECT_ID);
    assert.equal(calls(), 2);
});

test('a title that is already a project id needs no listing', async () => {
    const { lookup, calls } = lookupWith([PROJECTS]);
    assert.equal(await lookup.resolveProjectId({ title: PROJECT_ID }), PROJECT_ID);
    assert.equal(calls(), 0);
});

test('a found project opens in the promotions editor', async () => {
    const { lookup } = lookupWith([PROJECTS]);
    const request = await lookup.linkRequest({ promotionName: 'globalintropricinghpandgnav', promotionTitle: null });
    assert.deepEqual(request, { view: 'promotions-editor', promotionId: PROJECT_ID });
});

test('a project missing from the published listing opens the promotions list', async () => {
    const { lookup } = lookupWith([PROJECTS]);
    assert.deepEqual(await lookup.linkRequest({ promotionName: 'draft-promo' }), { view: 'promotions' });
});

test('a failed listing opens the promotions list', async () => {
    const { lookup } = lookupWith([null]);
    assert.deepEqual(await lookup.linkRequest({ promotionTitle: 'GlobalIntroPricingHPandGNAV' }), { view: 'promotions' });
});
