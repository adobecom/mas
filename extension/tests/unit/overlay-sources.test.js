const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createContext, runInContext, runInNewContext } = require('node:vm');
const escape = require('../../utils/escape.js');
const legend = require('../../utils/source-legend.js');
const F = require('./fixtures/homepage-cc-lapsed.js');

const source = readFileSync(resolve(__dirname, '../../content/overlay.js'), 'utf8');
const empty = { groupKey: null, entries: [], mixed: false, focusField: null };

function createOverlay() {
    const window = { MASEscape: escape, MASSourceLegend: legend };
    runInNewContext(source, { window, chrome: { runtime: {} } });
    return window.MASCardOverlay;
}

function createPanel(links = []) {
    const nodes = {
        '.mas-ext-section-variation': { hidden: true },
        '.mas-ext-sources-content': { innerHTML: '', querySelectorAll: () => links },
        '.mas-ext-variation-content': { innerHTML: '' },
    };
    return { nodes, panel: { querySelector: (selector) => nodes[selector] || null } };
}

// A rendered link that records its click listener, like the anchors the panel binds.
function fakeLink(dataset) {
    const link = { dataset, listeners: [] };
    link.addEventListener = (type, listener) => link.listeners.push(listener);
    link.click = () => link.listeners.forEach((listener) => listener({ preventDefault: () => {} }));
    return link;
}

const overlay = createOverlay();

test('a row links to the fragment that supplied its field', () => {
    const html = overlay.contentSourcesHtml(F.result);
    assert.match(html, new RegExp(`class="mas-ext-src-link" data-fragment-id="${F.PROMO_VAR}"`));
    assert.match(html, new RegExp(`class="mas-ext-src-link" data-fragment-id="${F.GROUPED}"`));
});

test('a promo row also links to its project by folder name and title', () => {
    const html = overlay.contentSourcesHtml(F.result);
    assert.match(
        html,
        new RegExp(`data-promotion-name="${F.PROMO_FOLDER}" data-promotion-title="${F.PROMO_PROJECT}">Promo project<`),
    );
});

test('a row with no supplying fragment has no Open link', () => {
    const html = overlay.contentSourcesHtml({ ...F.result, entries: [{ ...F.result.entries[1], supplierId: null }] });
    assert.doesNotMatch(html, /mas-ext-src-link/);
});

test('a hostile promotion title stays escaped in its link', () => {
    const entry = { ...F.result.entries[0], promotion: { name: 'x', title: '"><script>' } };
    const html = overlay.contentSourcesHtml({ ...F.result, entries: [entry] });
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /data-promotion-title="&quot;&gt;&lt;script&gt;"/);
});

test('clicking a source link opens its target in Studio', () => {
    const opened = [];
    const window = {
        MASEscape: escape,
        MASSourceLegend: legend,
        MASStudioLinker: { openLink: (dataset) => opened.push(dataset) },
    };
    runInNewContext(source, { window, chrome: { runtime: {} } });
    const link = fakeLink({ fragmentId: F.PROMO_VAR });
    const { panel } = createPanel([link]);
    window.MASCardOverlay.overlays.set('o7', { panel });
    window.MASCardOverlay.renderContentSources('o7', F.result);
    link.click();
    assert.deepEqual(opened, [{ fragmentId: F.PROMO_VAR }]);
});

test('renders one row per field with its source chip and reason', () => {
    const html = overlay.contentSourcesHtml(F.result);
    assert.match(html, /mas-ext-src-chip mas-ext-src-promo">Promotion variation · GlobalIntroPricingHPandGNAV</);
    assert.match(html, /IO applied promo GlobalIntroPricingHPandGNAV/);
    assert.match(html, /mas-ext-src-chip mas-ext-src-failed"/);
});

test('warns when the card mixes sources', () => {
    assert.match(overlay.contentSourcesHtml({ ...F.result, mixed: true }), /This card mixes sources/);
});

test('does not warn for a single-source card', () => {
    assert.doesNotMatch(overlay.contentSourcesHtml({ ...F.result, mixed: false }), /mas-ext-src-warning/);
});

test('escapes a hostile manifest name and field name', () => {
    const html = overlay.contentSourcesHtml({
        ...F.result,
        entries: [{ ...F.result.entries[0], field: '<img>', reason: 'Swapped by MEP · <script>.json' }],
    });
    assert.doesNotMatch(html, /<img>|<script>/);
});

test('highlights the clicked field row', () => {
    const html = overlay.contentSourcesHtml({ ...F.result, focusField: 'shortDescription' });
    assert.match(html, /mas-ext-src-focus[^>]*>\s*<span[^>]*>shortDescription/);
});

test('does not highlight a row when no field is focused', () => {
    assert.doesNotMatch(overlay.contentSourcesHtml({ ...F.result, focusField: null }), /mas-ext-src-focus/);
});

test('an unknown source class falls back to unknown', () => {
    const html = overlay.contentSourcesHtml({
        ...F.result,
        entries: [{ ...F.result.entries[0], source: 'x" onclick="y' }],
    });
    assert.match(html, /mas-ext-src-unknown/);
    assert.doesNotMatch(html, /onclick/);
});

test('empty entries render no rows and no warning', () => {
    const html = overlay.contentSourcesHtml({ ...empty, mixed: true });
    assert.equal(html, '');
});

test('renderContentSources fills only the sources container', () => {
    const { nodes, panel } = createPanel();
    overlay.overlays.set('o1', { panel });
    overlay.renderContentSources('o1', F.result);
    assert.match(nodes['.mas-ext-sources-content'].innerHTML, /mas-ext-src-chip/);
    assert.equal(nodes['.mas-ext-variation-content'].innerHTML, '');
    assert.equal(nodes['.mas-ext-section-variation'].hidden, false);
});

test('renderContentSources leaves the section hidden when entries are empty', () => {
    const { nodes, panel } = createPanel();
    overlay.overlays.set('o2', { panel });
    overlay.renderContentSources('o2', empty);
    assert.equal(nodes['.mas-ext-sources-content'].innerHTML, '');
    assert.equal(nodes['.mas-ext-section-variation'].hidden, true);
});

test('renderContentSources keeps the section visible when bucket links already rendered', () => {
    const { nodes, panel } = createPanel();
    nodes['.mas-ext-variation-content'].innerHTML = '<a>link</a>';
    overlay.overlays.set('o3', { panel });
    overlay.renderContentSources('o3', empty);
    assert.equal(nodes['.mas-ext-variation-content'].innerHTML, '<a>link</a>');
});

// An overlay with the real locale helpers and fragment parser, rendering into a fake panel.
function createParserOverlay({ response = null } = {}) {
    const sandbox = { MASEscape: escape, chrome: { runtime: { sendMessage: (message, callback) => callback(response) } } };
    sandbox.window = sandbox;
    sandbox.self = sandbox;
    sandbox.MASCardDetector = { getServiceConfig: () => ({}), isMasPreview: () => false };
    const context = createContext(sandbox);
    for (const file of ['utils/locales.js', 'utils/fragment-parser.js', 'content/overlay.js']) {
        runInContext(readFileSync(resolve(__dirname, '../..', file), 'utf8'), context, { filename: file });
    }
    return sandbox.MASCardOverlay;
}

function fakeContainer(innerHTML = '') {
    return { innerHTML, hidden: true, querySelector: () => null, querySelectorAll: () => [] };
}

function variationPanel() {
    const content = fakeContainer('<div class="mas-ext-loading">Loading variation data…</div>');
    const section = { hidden: true, querySelector: (selector) => (selector === '.mas-ext-variation-content' ? content : null) };
    const nodes = {
        '.mas-ext-section-variation': section,
        '.mas-ext-variation-content': content,
        '[data-section="details"] .mas-ext-section-content': fakeContainer(),
    };
    return { content, panel: { querySelector: (selector) => nodes[selector] || null } };
}

test('a grouped variation at the default locale shows no Parent row', () => {
    const overlay = createParserOverlay();
    const { content, panel } = variationPanel();
    overlay.overlays.set('o4', { panel });
    overlay.renderVariationInfo('o4', F.groupedData);
    assert.match(content.innerHTML, /Grouped variation/);
    assert.doesNotMatch(content.innerHTML, /Parent:/);
});

test('a regional locale variation shows its locale-default Parent row', () => {
    const overlay = createParserOverlay();
    const { content, panel } = variationPanel();
    overlay.overlays.set('o5', { panel });
    overlay.renderVariationInfo('o5', { path: '/content/dam/mas/acom/fr_CA/homepage-cpro', fields: {} });
    assert.match(content.innerHTML, /Parent:[\s\S]*\(fr_FR\)/);
});

test('a promotional variation also links to its project', () => {
    const overlay = createParserOverlay();
    const { content, panel } = variationPanel();
    overlay.overlays.set('o8', { panel });
    overlay.renderVariationInfo('o8', {
        path: '/content/dam/mas/acom/en_US/homepage-cpro',
        fields: { variations: ['v'] },
        references: { v: { id: F.PROMO_VAR, path: `/content/dam/mas/acom/en_US/promotions/${F.PROMO_FOLDER}/card`, tags: [] } },
    });
    assert.match(content.innerHTML, new RegExp(`mas-ext-promo-project-link" data-promotion-name="${F.PROMO_FOLDER}"`));
});

test('a failed fragment-details fetch clears the variation loading placeholder', () => {
    const overlay = createParserOverlay({ response: { success: false, error: 'fetch_failed' } });
    const { content, panel } = variationPanel();
    overlay.overlays.set('o6', { panel, cardData: { sourceFragmentId: F.AUTHORED, locale: 'en_US', country: 'US' } });
    overlay.loadFragmentDetails('o6');
    assert.equal(content.innerHTML, '');
});

test('the content sources section ends with the color key, collapsed', () => {
    const html = overlay.contentSourcesHtml(F.result);
    assert.ok(html.endsWith(legend.renderSourceLegend()));
});

test('a source the legend does not know is shown as unknown', () => {
    assert.equal(overlay.sourceClass('something-new'), 'unknown');
});
