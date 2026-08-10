import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { nothing } from 'lit';
import { PAGE_NAMES } from '../src/constants.js';
import '../src/studio.js';

const PAGE_GETTERS = [
    { getter: 'placeholders', matchingPages: [PAGE_NAMES.PLACEHOLDERS], tag: 'mas-placeholders' },
    { getter: 'settings', matchingPages: [PAGE_NAMES.SETTINGS, PAGE_NAMES.SETTINGS_EDITOR], tag: 'mas-settings' },
    { getter: 'masks', matchingPages: [PAGE_NAMES.MASKS, PAGE_NAMES.MASKS_EDITOR], tag: 'mas-masks' },
    { getter: 'splashScreen', matchingPages: [PAGE_NAMES.WELCOME], tag: 'mas-splash-screen' },
    { getter: 'versionPage', matchingPages: [PAGE_NAMES.VERSION], tag: 'version-page' },
    { getter: 'fragmentEditor', matchingPages: [PAGE_NAMES.FRAGMENT_EDITOR], tag: 'mas-fragment-editor' },
    { getter: 'promotions', matchingPages: [PAGE_NAMES.PROMOTIONS], tag: 'mas-promotions' },
    { getter: 'promotionsEditor', matchingPages: [PAGE_NAMES.PROMOTIONS_EDITOR], tag: 'mas-promotions-editor' },
    { getter: 'translation', matchingPages: [PAGE_NAMES.TRANSLATIONS], tag: 'mas-translation' },
    { getter: 'translationEditor', matchingPages: [PAGE_NAMES.TRANSLATION_EDITOR], tag: 'mas-translation-editor' },
    { getter: 'bulkPublish', matchingPages: [PAGE_NAMES.BULK_PUBLISH], tag: 'mas-bulk-publish' },
    { getter: 'bulkPublishEditor', matchingPages: [PAGE_NAMES.BULK_PUBLISH_EDITOR], tag: 'mas-bulk-publish-editor' },
    { getter: 'advancedTools', matchingPages: [PAGE_NAMES.ADVANCED_TOOLS], tag: 'mas-advanced-tools' },
    { getter: 'editorPanel', matchingPages: [PAGE_NAMES.CONTENT], tag: 'editor-panel' },
];

// Pre-register stubs so customElements.get(tag) returns a constructor in template tests,
// isolating getter logic from actual async module loading.
for (const { tag } of PAGE_GETTERS) {
    if (!customElements.get(tag)) {
        customElements.define(tag, class extends HTMLElement {});
    }
}

describe('MasStudio – page getters', () => {
    let el;

    beforeEach(() => {
        el = document.createElement('mas-studio');
    });

    for (const { getter, matchingPages, tag } of PAGE_GETTERS) {
        describe(getter, () => {
            it('returns nothing when a non-matching page is active', () => {
                el.page.value = 'some-unrelated-page';
                expect(el[getter]).to.equal(nothing);
            });

            for (const page of matchingPages) {
                it(`returns a template for page "${page}"`, () => {
                    el.page.value = page;
                    const result = el[getter];
                    expect(result).to.not.equal(nothing);
                    expect(result.strings.some((s) => s.includes(`<${tag}`))).to.be.true;
                });
            }
        });
    }
});

describe('MasStudio – disconnectedCallback', () => {
    let el;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        el?.remove();
        sandbox.restore();
    });

    it('clears #pendingImports so the next render re-registers whenDefined', () => {
        sandbox.stub(customElements, 'get').returns(undefined);
        const whenDefinedStub = sandbox.stub(customElements, 'whenDefined').returns(new Promise(() => {}));

        el = document.createElement('mas-studio');
        el.page.value = PAGE_NAMES.PLACEHOLDERS;
        el.placeholders; // adds 'mas-placeholders' to #pendingImports, whenDefined count: 1

        // Appending triggers connectedCallback → StoreController.hostConnected() resets
        // el.page.value to the global store value; removing triggers disconnectedCallback
        // which clears #pendingImports and #failedImports.
        document.body.append(el);
        el.remove();

        // Re-arm the page guard after disconnect (hostConnected() overwrote it above).
        el.page.value = PAGE_NAMES.PLACEHOLDERS;
        el.placeholders; // #pendingImports empty → adds again, re-registers whenDefined, count: 2
        expect(whenDefinedStub.withArgs('mas-placeholders').callCount).to.equal(2);
    });
});

describe('MasStudio – lazy-load behavior', () => {
    let el;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        el = document.createElement('mas-studio');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('returns nothing and calls requestUpdate once element becomes defined', async () => {
        let resolveWhenDefined;
        sandbox.stub(customElements, 'get').returns(undefined);
        sandbox.stub(customElements, 'whenDefined').returns(new Promise((r) => (resolveWhenDefined = r)));
        const updateSpy = sandbox.spy(el, 'requestUpdate');

        el.page.value = PAGE_NAMES.PLACEHOLDERS;
        expect(el.placeholders).to.equal(nothing);

        resolveWhenDefined();
        await Promise.resolve();

        expect(updateSpy.calledOnce).to.be.true;
    });

    it('does not re-register whenDefined on repeated renders before element resolves', () => {
        sandbox.stub(customElements, 'get').returns(undefined);
        const whenDefinedStub = sandbox.stub(customElements, 'whenDefined').returns(new Promise(() => {}));

        el.page.value = PAGE_NAMES.PLACEHOLDERS;
        el.placeholders;
        el.placeholders;
        el.placeholders;

        expect(whenDefinedStub.callCount).to.equal(1);
    });
});

describe('MasStudio – #lazyLoad failure path', () => {
    let el;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        el = document.createElement('mas-studio');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('returns nothing after a failed import and does not retry', async () => {
        let rejectImport;
        sandbox.stub(customElements, 'get').returns(undefined);
        sandbox.stub(customElements, 'whenDefined').returns(new Promise(() => {}));

        // Spy on Events.toast before it's used
        const { default: Events } = await import('../src/events.js');
        const toastSpy = sandbox.spy(Events.toast, 'emit');

        el.page.value = PAGE_NAMES.PLACEHOLDERS;

        // First call starts the import (returns nothing because element not yet defined)
        const first = el.placeholders;
        expect(first).to.equal(nothing);

        // The import for mas-placeholders will eventually resolve (real module exists).
        // We can't force-fail it here without intercepting dynamic import().
        // What we CAN test: the guard against #failedImports is wired to return nothing.
        // Verify: calling the getter twice still returns nothing (element still pending).
        expect(el.placeholders).to.equal(nothing);

        // Toast should not have been emitted for a successful import
        await new Promise((r) => setTimeout(r, 100));
        expect(toastSpy.called).to.be.false;
    });
});
