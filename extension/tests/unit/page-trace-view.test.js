const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { renderPageTraceHtml, bindPageTrace } = require('../../popup/page-trace-view.js');

const trace = (overrides = {}) => ({
    mep: { available: true, preview: true, manifests: [] },
    cards: [],
    ...overrides,
});

test('escapes a hostile manifest name', () => {
    const html = renderPageTraceHtml(
        trace({ mep: { available: true, preview: false, manifests: [{ manifestId: '<img src=x onerror=1>', swaps: [{}] }] } }),
    );
    assert.ok(!html.includes('<img'));
    assert.ok(html.includes('&lt;img src=x onerror=1&gt; → 1 swaps'));
});

test('escapes a hostile card name and step', () => {
    const html = renderPageTraceHtml(
        trace({ cards: [{ groupKey: 'k', cardName: '<script>x</script>', mixed: false, steps: ['<b>'] }] }),
    );
    assert.ok(!html.includes('<script>'));
    assert.ok(!html.includes('<b>'));
});

test('shows the unavailable message when MEP details are missing', () => {
    const html = renderPageTraceHtml(trace({ mep: { available: false, preview: false, manifests: [] } }));
    assert.ok(html.includes('MEP details unavailable on this page'));
});

test('flags mixed cards only', () => {
    const cards = [
        { groupKey: 'a', cardName: 'A', mixed: true, steps: [] },
        { groupKey: 'b', cardName: 'B', mixed: false, steps: [] },
    ];
    const html = renderPageTraceHtml(trace({ cards }));
    assert.equal(html.split('mas-trace-mixed').length - 1, 1);
});

const AUTHORED = '4e3e071a-1111-4222-8333-444455556666';
const PROMO_LINK = { text: 'Promo · HPandGNAV', promotion: { name: 'globalintropricinghpandgnav', title: 'HPandGNAV' } };

function cardWith(steps, links) {
    return trace({ cards: [{ groupKey: 'k', cardName: 'CC Pro', mixed: false, steps, links }] });
}

test('links a fragment id in a step to that fragment', () => {
    const html = renderPageTraceHtml(cardWith(['Page asks for 4e3e071a'], [{ text: '4e3e071a', fragmentId: AUTHORED }]));
    assert.ok(html.includes(`Page asks for <a href="#" class="mas-trace-link" data-fragment-id="${AUTHORED}">4e3e071a</a>`));
});

test('links a promo label to its project by name and title', () => {
    const html = renderPageTraceHtml(cardWith(['IO merges Promo · HPandGNAV (da021c0a) into badge'], [PROMO_LINK]));
    assert.ok(
        html.includes(
            '<a href="#" class="mas-trace-link" data-promotion-name="globalintropricinghpandgnav" data-promotion-title="HPandGNAV">Promo · HPandGNAV</a>',
        ),
    );
});

test('a promo link without a title carries only its name', () => {
    const link = { ...PROMO_LINK, promotion: { name: 'blackfriday', title: null } };
    const html = renderPageTraceHtml(cardWith(['IO merges Promo · HPandGNAV (da021c0a) into badge'], [link]));
    assert.ok(html.includes('data-promotion-name="blackfriday">'));
});

test('a hostile promo label and title stay escaped when linked', () => {
    const link = { text: 'Promo · <b>', promotion: { name: 'x', title: '"><script>' } };
    const html = renderPageTraceHtml(cardWith(['IO merges Promo · <b> (da021c0a) into badge'], [link]));
    assert.ok(!html.includes('<b>'));
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('>Promo · &lt;b&gt;</a>'));
});

test('a card without links renders its steps as plain text', () => {
    const html = renderPageTraceHtml(cardWith(['Page asks for 4e3e071a']));
    assert.ok(!html.includes('mas-trace-link'));
});

const LOADED = trace({ cards: [{ groupKey: 'k', cardName: 'CC Pro', mixed: false, steps: ['Page asks for 4e3e071a'] }] });

// A closed <details> section with a hidden body; fetchTrace answers from replies in order.
function bound(replies = [LOADED]) {
    const listeners = [];
    const bodyListeners = [];
    const opened = [];
    const section = { open: false, addEventListener: (type, listener) => listeners.push([type, listener]) };
    const body = { innerHTML: '', hidden: true, addEventListener: (type, listener) => bodyListeners.push([type, listener]) };
    let fetches = 0;
    const fetchTrace = async () => replies[Math.min(fetches++, replies.length - 1)];
    const view = bindPageTrace({ section, body, fetchTrace, openLink: (dataset) => opened.push(dataset) });
    const toggle = async (open) => {
        section.open = open;
        listeners.filter(([type]) => type === 'toggle').forEach(([, listener]) => listener());
        await new Promise(setImmediate);
    };
    const click = (link) => {
        const event = {
            target: { closest: () => link },
            defaultPrevented: false,
            preventDefault: () => (event.defaultPrevented = true),
        };
        bodyListeners.filter(([type]) => type === 'click').forEach(([, listener]) => listener(event));
        return event;
    };
    return { view, section, body, toggle, click, opened, fetches: () => fetches };
}

test('clicking a trace link opens its target', () => {
    const { click, opened } = bound();
    const event = click({ dataset: { fragmentId: AUTHORED } });
    assert.deepEqual(opened, [{ fragmentId: AUTHORED }]);
    assert.equal(event.defaultPrevented, true);
});

test('a click outside a trace link opens nothing', () => {
    const { click, opened } = bound();
    click(null);
    assert.deepEqual(opened, []);
});

test('binding the trace fetches nothing until the section opens', () => {
    const { fetches } = bound();
    assert.equal(fetches(), 0);
});

test('the first open fetches the trace and shows its body', async () => {
    const { body, toggle } = bound();
    await toggle(true);
    assert.equal(body.hidden, false);
    assert.match(body.innerHTML, /CC Pro/);
});

test('reopening after a successful load does not fetch again', async () => {
    const { toggle, fetches } = bound();
    await toggle(true);
    await toggle(false);
    await toggle(true);
    assert.equal(fetches(), 1);
});

test('a failed load keeps the body hidden and the next open tries again', async () => {
    const { body, toggle, fetches } = bound([null, LOADED]);
    await toggle(true);
    assert.equal(body.hidden, true);
    await toggle(false);
    await toggle(true);
    assert.deepEqual([fetches(), body.hidden], [2, false]);
});

test('refresh reloads the trace while the section is open', async () => {
    const { view, toggle, fetches } = bound();
    await toggle(true);
    await view.refresh();
    assert.equal(fetches(), 2);
});

test('refresh fetches nothing while the section is closed', async () => {
    const { view, fetches } = bound();
    await view.refresh();
    assert.equal(fetches(), 0);
});

test('in the popup the view escapes through the shared MASEscape, without require', () => {
    const source = readFileSync(resolve(__dirname, '../../popup/page-trace-view.js'), 'utf8');
    const window = { MASEscape: { escapeHtmlText: (value) => `[${value}]` } };
    runInNewContext(source, { window });
    assert.match(window.MASPageTraceView.renderPageTraceHtml(LOADED), /\[CC Pro\]/);
});
