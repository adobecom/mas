import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/mas-fragment-render.js';

describe('MasFragmentRender', () => {
    let sandbox;
    let observerCallback;
    let observeStub;
    let disconnectStub;
    let originalIntersectionObserver;

    const createFragmentStore = (overrides = {}) => ({
        value: {
            id: 'fragment-1',
            path: '/test/path',
            model: { path: '/conf/mas/settings/dam/cfm/models/card' },
            fields: [{ name: 'variant', values: ['catalog'] }],
            statusVariant: 'draft',
            variant: 'catalog',
            title: 'Test Fragment',
            getField: sandbox.stub().returns({ values: [] }),
            ...overrides,
        },
        get() {
            return this.value;
        },
        subscribe: sandbox.stub().returns({ unsubscribe: sandbox.stub() }),
        unsubscribe: sandbox.stub(),
        resolvePreviewFragment: sandbox.stub(),
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        observeStub = sandbox.stub();
        disconnectStub = sandbox.stub();

        originalIntersectionObserver = window.IntersectionObserver;
        window.IntersectionObserver = class MockIntersectionObserver {
            constructor(callback, options) {
                observerCallback = callback;
                this.options = options;
                this.observe = observeStub;
                this.disconnect = disconnectStub;
            }
        };
    });

    afterEach(() => {
        sandbox.restore();
        window.IntersectionObserver = originalIntersectionObserver;
    });

    it('shows placeholder before intersection', async () => {
        const fragmentStore = createFragmentStore();
        const el = await fixture(html`<mas-fragment-render .fragmentStore=${fragmentStore}></mas-fragment-render>`);

        expect(el.visible).to.not.be.true;
        const placeholder = el.querySelector('.render-fragment-placeholder');
        expect(placeholder).to.exist;
        const skeletons = el.querySelectorAll('.skeleton-element');
        expect(skeletons.length).to.equal(3);
    });

    it('intersection triggers visibility and resolution', async () => {
        const fragmentStore = createFragmentStore();
        const el = await fixture(html`<mas-fragment-render .fragmentStore=${fragmentStore}></mas-fragment-render>`);

        observerCallback([{ isIntersecting: true }]);
        expect(el.visible).to.be.true;
        expect(fragmentStore.resolvePreviewFragment.calledOnce).to.be.true;
    });

    it('disconnects observer after intersection', async () => {
        const fragmentStore = createFragmentStore();
        await fixture(html`<mas-fragment-render .fragmentStore=${fragmentStore}></mas-fragment-render>`);

        observerCallback([{ isIntersecting: true }]);
        expect(disconnectStub.calledOnce).to.be.true;
    });
});
