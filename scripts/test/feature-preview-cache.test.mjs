import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FeaturePreviewCache } from '../../studio/src/mas-chat/preview-cache.js';

function createCache() {
    const cache = new Map();
    cache.remove = (key) => cache.delete(key);
    return cache;
}

test('feature previews do not overwrite authoritative IDs or originalId aliases', () => {
    const cache = createCache();
    const authoritative = { id: 'card', fields: [] };
    cache.set('card', authoritative);
    const previews = new FeaturePreviewCache(cache);
    const previewId = previews.add({ id: 'card', fields: { originalId: 'parent', title: 'Draft' } });
    assert.notEqual(previewId, 'card');
    assert.equal(cache.get('card'), authoritative);
    assert.equal(cache.has('parent'), false);
    assert.equal(cache.get(previewId).fields.originalId, previewId);
    assert.equal(previews.owns(previewId), true);
    assert.equal(previews.owns('card'), false);
});

test('repeat preview updates reuse only the feature-owned identity', () => {
    const cache = createCache();
    const previews = new FeaturePreviewCache(cache);
    const previewId = previews.add({ id: 'card', title: 'Before', fields: [] });
    assert.equal(previews.add({ id: 'card', title: 'After', fields: [] }), previewId);
    assert.equal(cache.get(previewId).title, 'After');
    assert.equal(previews.getId('card'), previewId);
    assert.equal(previews.has('card'), true);
});

test('different feature instances cannot share mutable preview entries', () => {
    const cache = createCache();
    const first = new FeaturePreviewCache(cache);
    const second = new FeaturePreviewCache(cache);
    assert.notEqual(first.add({ id: 'card', fields: [] }), second.add({ id: 'card', fields: [] }));
});

test('teardown removes only owned previews', () => {
    const cache = createCache();
    cache.set('card', { id: 'card' });
    const previews = new FeaturePreviewCache(cache);
    const previewId = previews.add({ id: 'card', fields: [] });
    previews.clear();
    assert.equal(cache.has(previewId), false);
    assert.equal(cache.has('card'), true);
    assert.equal(previews.has('card'), false);
});

test('unused previews can be disposed before the web component is available', () => {
    assert.doesNotThrow(() => new FeaturePreviewCache().clear());
});

test('preview mutations cannot change the authoritative response object', () => {
    const cache = createCache();
    const previews = new FeaturePreviewCache(cache);
    const fragment = { id: 'card', fields: [{ name: 'title', values: ['Original'] }] };
    const previewId = previews.add(fragment);
    cache.get(previewId).fields[0].values[0] = 'Changed';
    assert.equal(fragment.fields[0].values[0], 'Original');
});

test('teardown invalidates pending template writes', () => {
    const previews = new FeaturePreviewCache(createCache());
    const generation = previews.generation;
    previews.clear();
    assert.notEqual(previews.generation, generation);
});
