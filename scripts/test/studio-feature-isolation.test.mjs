import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { getStudioFeatures, isFeaturePageEnabled } from '../../studio/src/mas-chat/features.js';
import { PAGE_NAMES } from '../../studio/src/constants.js';
import postcss from 'postcss';

const configuration = (values = {}) => ({
    querySelector: (selector) => (selector in values ? { content: values[selector] } : null),
});
const source = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('optional features default off when configuration is missing', () => {
    assert.deepEqual(getStudioFeatures(configuration()), { assistant: false, offers: false });
});

test('assistant rollout does not implicitly enable Offers', () => {
    assert.deepEqual(getStudioFeatures(configuration({ 'meta[name="mas-assistant-enabled"]': 'true' })), {
        assistant: true,
        offers: false,
    });
});

test('Offers rollout does not implicitly enable the assistant', () => {
    assert.deepEqual(getStudioFeatures(configuration({ 'meta[name="mas-offers-enabled"]': 'true' })), {
        assistant: false,
        offers: true,
    });
});

test('malformed flag values do not enable features', () => {
    assert.deepEqual(getStudioFeatures(configuration({ 'meta[name="mas-assistant-enabled"]': 'false' })), {
        assistant: false,
        offers: false,
    });
});

test('disabled features reject their direct routes', () => {
    for (const page of [PAGE_NAMES.AI_ASSISTANT, PAGE_NAMES.PRODUCT_CATALOG, PAGE_NAMES.PRODUCT_DETAIL]) {
        assert.equal(isFeaturePageEnabled(page, { assistant: false, offers: false }), false);
    }
});

test('existing fragment editor remains available with both features disabled', () => {
    assert.equal(isFeaturePageEnabled(PAGE_NAMES.FRAGMENT_EDITOR, { assistant: false, offers: false }), true);
});

test('enabled feature routes remain independently reachable', () => {
    assert.equal(isFeaturePageEnabled(PAGE_NAMES.AI_ASSISTANT, { assistant: true, offers: false }), true);
    assert.equal(isFeaturePageEnabled(PAGE_NAMES.PRODUCT_DETAIL, { assistant: false, offers: true }), true);
});

test('chat routing does not eagerly import feature implementations', async () => {
    const router = await source('studio/src/mas-chat/chat-router.js');
    assert.equal(/^import\s+['"].*(?:mas-chat|mas-product)[^'"]*['"]/m.test(router), false);
});

test('opening the assistant does not write the shared landscape', async () => {
    assert.equal(/Store\.landscape\.set/.test(await source('studio/src/mas-chat/chat-router.js')), false);
});

test('the shared Studio stylesheet does not load feature styles', async () => {
    assert.equal(/@import.*chat\.css/.test(await source('studio/style.css')), false);
});

test('feature stylesheet selectors cannot match unrelated Studio content', async () => {
    const stylesheet = postcss.parse(await source('studio/src/styles/chat.css'));
    const unscoped = [];
    stylesheet.walkRules((rule) => {
        if (rule.parent.type === 'atrule' && rule.parent.name.endsWith('keyframes')) return;
        for (const selector of rule.selectors) {
            if (!selector.startsWith(':where(.mas-feature)') && !selector.startsWith('mas-top-nav:has(.top-nav-search)')) {
                unscoped.push(selector);
            }
        }
    });
    assert.equal(unscoped.length, 0, `Unscoped selector: ${unscoped[0]}`);
});

test('shared price error styling remains available without feature CSS', async () => {
    const stylesheet = await source('studio/style.css');
    assert.equal(stylesheet.includes("span[is='inline-price'].placeholder-failed .price-error-message"), true);
});

test('local Studio commands do not depend on a missing feature launcher', async () => {
    const manifest = JSON.parse(await source('package.json'));
    assert.equal(manifest.scripts.studio, 'cd studio && npm run proxy & aem up');
});

test('Studio does not pin an older ProseMirror engine than the shared workspace', async () => {
    const manifest = JSON.parse(await source('studio/package.json'));
    assert.equal(
        Object.keys(manifest.dependencies).some((name) => name.startsWith('prosemirror-')),
        false,
    );
});

test('all template-preview callers provide their own cache', async () => {
    for (const component of ['mas-product-catalog', 'mas-product-detail', 'mas-chat-confirmation-summary']) {
        const componentSource = await source(`studio/src/${component}.js`);
        assert.equal(/precacheTemplatePreviews\([^,]+, this\.previewCache\)/.test(componentSource), true, component);
    }
});
