import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { PreviewFragmentStore } from '../../src/reactivity/preview-fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import Store from '../../src/store.js';

describe('PreviewFragmentStore', () => {
    let sandbox;
    let placeholderSubscribers;
    let originalPlaceholdersPreview;
    let originalSurface;
    let originalLocaleOrRegion;

    const createFragment = (overrides = {}) =>
        new Fragment({
            id: 'test-fragment-id',
            path: '/content/dam/mas/test/en_US/fragment',
            model: { path: '/conf/mas/settings/dam/cfm/models/card' },
            fields: [
                { name: 'variant', values: ['catalog'] },
                { name: 'title', values: ['Test'] },
            ],
            ...overrides,
        });

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        placeholderSubscribers = [];
        originalPlaceholdersPreview = Store.placeholders.preview;

        Store.placeholders.preview = {
            value: { key: 'value' },
            subscribe: (fn) => {
                placeholderSubscribers.push(fn);
                return fn;
            },
            unsubscribe: sandbox.stub(),
        };

        originalSurface = Store.surface;
        Store.surface = sandbox.stub().returns('acom');

        originalLocaleOrRegion = Store.localeOrRegion;
        Store.localeOrRegion = sandbox.stub().returns('en_US');

        sandbox.stub(customElements, 'get').returns(null);
    });

    afterEach(() => {
        sandbox.restore();
        Store.placeholders.preview = originalPlaceholdersPreview;
        Store.surface = originalSurface;
        Store.localeOrRegion = originalLocaleOrRegion;
    });

    it('lazy: true does NOT call resolveFragment in constructor', () => {
        const fragment = createFragment();
        const store = new PreviewFragmentStore(fragment, null, { lazy: true });
        expect(store.lazy).to.be.true;
        expect(store.resolved).to.be.false;
        store.dispose();
    });

    it('lazy: true ignores placeholder subscription updates', () => {
        const fragment = createFragment();
        const store = new PreviewFragmentStore(fragment, null, { lazy: true });

        placeholderSubscribers.forEach((fn) => fn());

        expect(store.lazy).to.be.true;
        expect(store.resolved).to.be.false;
        store.dispose();
    });

    it('resolveFragment sets lazy to false', () => {
        const fragment = createFragment();
        const store = new PreviewFragmentStore(fragment, null, { lazy: true });
        expect(store.lazy).to.be.true;

        store.resolveFragment();
        expect(store.lazy).to.be.false;
        store.dispose();
    });
});
