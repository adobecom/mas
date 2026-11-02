import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { LitElement, nothing } from 'lit';
import { PAGE_NAMES } from '../src/constants.js';
import Store from '../src/store.js';
import '../src/studio.js';

const curator = { userPrincipalName: 'curator@example.com', groups: ['GRP-ODIN-MAS-ACOM-CURATORS'] };
let originalAccessState;

beforeEach(() => {
    originalAccessState = {
        profile: Store.profile.get(),
        users: Store.users.get(),
        loaded: Store.users.getMeta('loaded'),
    };
    Store.profile.set({ email: 'curator@example.com' });
    Store.users.setMeta('loaded', true);
    Store.users.set([curator]);
});

afterEach(() => {
    Store.users.setMeta('loaded', originalAccessState.loaded);
    Store.users.set(originalAccessState.users);
    Store.profile.set(originalAccessState.profile);
});

const PAGE_GETTERS = [
    { getter: 'placeholders', matchingPages: [PAGE_NAMES.PLACEHOLDERS], tag: 'mas-placeholders' },
    { getter: 'settings', matchingPages: [PAGE_NAMES.SETTINGS, PAGE_NAMES.SETTINGS_EDITOR], tag: 'mas-settings' },
    { getter: 'masks', matchingPages: [PAGE_NAMES.MASKS, PAGE_NAMES.MASKS_EDITOR], tag: 'mas-masks' },
    { getter: 'offerMapping', matchingPages: [PAGE_NAMES.OFFER_MAPPING], tag: 'mas-offer-mapping' },
    { getter: 'splashScreen', matchingPages: [PAGE_NAMES.WELCOME], tag: 'mas-splash-screen' },
    { getter: 'versionPage', matchingPages: [PAGE_NAMES.VERSION], tag: 'version-page' },
    { getter: 'fragmentEditor', matchingPages: [PAGE_NAMES.FRAGMENT_EDITOR], tag: 'mas-fragment-editor' },
    { getter: 'promotions', matchingPages: [PAGE_NAMES.PROMOTIONS], tag: 'mas-promotions' },
    { getter: 'promotionsEditor', matchingPages: [PAGE_NAMES.PROMOTIONS_EDITOR], tag: 'mas-promotions-editor' },
    { getter: 'translation', matchingPages: [PAGE_NAMES.TRANSLATIONS], tag: 'mas-translation' },
    { getter: 'translationEditor', matchingPages: [PAGE_NAMES.TRANSLATION_EDITOR], tag: 'mas-translation-editor' },
    { getter: 'bulkPublish', matchingPages: [PAGE_NAMES.BULK_PUBLISH], tag: 'mas-bulk-publish' },
    { getter: 'bulkPublishEditor', matchingPages: [PAGE_NAMES.BULK_PUBLISH_EDITOR], tag: 'mas-bulk-publish-editor' },
    { getter: 'bulkEdit', matchingPages: [PAGE_NAMES.BULK_EDIT], tag: 'mas-bulk-edit' },
    { getter: 'bulkEditEditor', matchingPages: [PAGE_NAMES.BULK_EDIT_EDITOR], tag: 'mas-bulk-edit-editor' },
    { getter: 'advancedTools', matchingPages: [PAGE_NAMES.ADVANCED_TOOLS], tag: 'mas-advanced-tools' },
    { getter: 'baselines', matchingPages: [PAGE_NAMES.BASELINES], tag: 'mas-baselines' },
];

// Pre-register stubs so customElements.get(tag) returns a constructor in template tests,
// isolating getter logic from actual async module loading. Stubs log connect/disconnect
// order into pageTransitionLog so the transition-ordering suite below can assert the
// outgoing page view disconnects before the incoming one connects (see studio.js's
// single `currentPage` child part, which is what guarantees that ordering).
const pageTransitionLog = [];
for (const { tag } of PAGE_GETTERS) {
    if (!customElements.get(tag)) {
        customElements.define(
            tag,
            class extends HTMLElement {
                connectedCallback() {
                    pageTransitionLog.push([tag, 'connect']);
                }
                disconnectedCallback() {
                    pageTransitionLog.push([tag, 'disconnect']);
                }
            },
        );
    }
}

describe('MasStudio – page getters', () => {
    let el;

    beforeEach(() => {
        el = document.createElement('mas-studio');
    });

    it('routes the Baselines page through currentPage', () => {
        el.page.value = PAGE_NAMES.BASELINES;

        const result = el.currentPage;

        expect(result.strings.some((s) => s.includes('<mas-baselines'))).to.be.true;
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

describe('MasStudio – Bulk Publish authorization', () => {
    let el;
    let sandbox;
    let originalPage;

    beforeEach(() => {
        originalPage = Store.page.get();
        sandbox = sinon.createSandbox();
        el = document.createElement('mas-studio');
        sandbox.stub(el, 'render').callsFake(() => el.currentPage);
        LitElement.prototype.connectedCallback.call(el);
    });

    afterEach(() => {
        LitElement.prototype.disconnectedCallback.call(el);
        sandbox.restore();
        Store.page.set(originalPage);
    });

    for (const { matchingPages, tag } of PAGE_GETTERS.filter(({ getter }) => getter.startsWith('bulkPublish'))) {
        const [page] = matchingPages;

        it(`does not mount ${tag} while membership is loading`, async () => {
            Store.users.setMeta('loaded', false);
            Store.page.set(page);
            await el.updateComplete;

            expect(el.querySelector(tag)).to.equal(null);
            expect(Store.page.get()).to.equal(page);
        });

        it(`shows a loading indicator before mounting ${tag}`, async () => {
            Store.users.setMeta('loaded', false);
            Store.page.set(page);
            await el.updateComplete;

            const indicator = el.querySelector('sp-progress-circle');
            expect(indicator).to.not.equal(null);
            expect(indicator.hasAttribute('indeterminate')).to.equal(true);
            expect(indicator.getAttribute('label')).to.equal('Loading users');
        });

        it(`mounts ${tag} when membership confirms access`, async () => {
            Store.users.setMeta('loaded', false);
            Store.page.set(page);
            await el.updateComplete;
            expect(el.querySelector(tag)).to.equal(null);

            Store.users.setMeta('loaded', true);
            Store.users.notify();
            await el.updateComplete;

            expect(el.querySelector(tag)).to.not.equal(null);
            expect(el.querySelector('sp-progress-circle')).to.equal(null);
        });

        it(`removes the loading indicator when access to ${tag} is denied`, async () => {
            Store.users.setMeta('loaded', false);
            Store.page.set(page);
            await el.updateComplete;
            expect(el.querySelector('sp-progress-circle')).to.not.equal(null);

            Store.users.setMeta('loaded', true);
            Store.users.set([]);
            await el.updateComplete;

            expect(el.querySelector('sp-progress-circle')).to.equal(null);
            expect(el.querySelector(tag)).to.equal(null);
        });

        it(`does not mount ${tag} when membership denies access`, async () => {
            Store.users.set([]);
            Store.page.set(page);
            await el.updateComplete;

            expect(el.querySelector(tag)).to.equal(null);
        });

        it(`mounts ${tag} when the profile becomes authorized`, async () => {
            Store.profile.set({ email: 'other@example.com' });
            Store.page.set(page);
            await el.updateComplete;
            expect(el.querySelector(tag)).to.equal(null);

            Store.profile.set({ email: 'curator@example.com' });
            await el.updateComplete;

            expect(el.querySelector(tag)).to.not.equal(null);
        });
    }

    it('does not show membership loading on unrelated routes', async () => {
        Store.users.setMeta('loaded', false);
        Store.page.set(PAGE_NAMES.WELCOME);
        await el.updateComplete;

        expect(el.querySelector('sp-progress-circle')).to.equal(null);
        expect(el.querySelector('mas-splash-screen')).to.not.equal(null);
    });
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

    for (const [getter, page, path] of [
        ['bulkEdit', PAGE_NAMES.BULK_EDIT, './bulk-edit/mas-bulk-edit.js'],
        ['bulkEditEditor', PAGE_NAMES.BULK_EDIT_EDITOR, './bulk-edit/mas-bulk-edit-editor.js'],
    ]) {
        it(`${getter} returns nothing and imports its module until the element is defined`, () => {
            sandbox.stub(customElements, 'get').returns(undefined);
            sandbox.stub(customElements, 'whenDefined').returns(new Promise(() => {}));
            const importStub = sandbox.stub(el, 'importModule').resolves({});

            el.page.value = page;
            expect(el[getter]).to.equal(nothing);
            expect(importStub.calledOnceWith(path)).to.be.true;
        });
    }
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

    const flushAttempt = async (clock, delay) => {
        await Promise.resolve();
        await Promise.resolve();
        await clock.tickAsync(delay);
    };

    it('retries a failed import with a cache-busting URL', async () => {
        const clock = sandbox.useFakeTimers();
        sandbox.stub(customElements, 'get').returns(undefined);
        sandbox.stub(customElements, 'whenDefined').returns(new Promise(() => {}));
        const { default: Events } = await import('../src/events.js');
        const toastSpy = sandbox.spy(Events.toast, 'emit');
        const importStub = sandbox.stub(el, 'importModule');
        importStub.onFirstCall().rejects(new Error('429'));
        importStub.onSecondCall().resolves({});

        el.page.value = PAGE_NAMES.PLACEHOLDERS;
        expect(el.placeholders).to.equal(nothing);
        await flushAttempt(clock, 1000);
        await flushAttempt(clock, 0);

        expect(importStub.args.map(([path]) => path)).to.deep.equal([
            './placeholders/mas-placeholders.js',
            './placeholders/mas-placeholders.js?retry=1',
        ]);
        expect(toastSpy.called).to.be.false;
    });

    it('shows a toast and stops loading once retries are exhausted', async () => {
        const clock = sandbox.useFakeTimers();
        sandbox.stub(customElements, 'get').returns(undefined);
        sandbox.stub(customElements, 'whenDefined').returns(new Promise(() => {}));
        sandbox.stub(console, 'error');
        const { default: Events } = await import('../src/events.js');
        const toastSpy = sandbox.spy(Events.toast, 'emit');
        const importStub = sandbox.stub(el, 'importModule').rejects(new Error('429'));

        el.page.value = PAGE_NAMES.PLACEHOLDERS;
        el.placeholders;
        await flushAttempt(clock, 1000);
        await flushAttempt(clock, 2000);
        await flushAttempt(clock, 0);

        expect(importStub.callCount).to.equal(3);
        expect(toastSpy.calledOnceWith({ variant: 'negative', content: 'Failed to load page' })).to.be.true;
        expect(el.placeholders).to.equal(nothing);
        expect(importStub.callCount).to.equal(3);
    });
});

describe('MasStudio – page transition ordering', () => {
    let el;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        el = document.createElement('mas-studio');
        // renderCommerceService() reaches for a <mas-commerce-service> element that
        // real app markup provides outside this component's own render tree; stub it
        // so setting masJsReady doesn't throw in isolation.
        sandbox.stub(el, 'renderCommerceService');
        el.masJsReady = true;
        document.body.append(el);
        Store.users.set([curator]);
    });

    afterEach(() => {
        el.remove();
        sandbox.restore();
        Store.page.set(PAGE_NAMES.WELCOME);
    });

    const TRANSITIONS = [
        [PAGE_NAMES.TRANSLATION_EDITOR, PAGE_NAMES.PROMOTIONS_EDITOR],
        [PAGE_NAMES.PROMOTIONS_EDITOR, PAGE_NAMES.TRANSLATION_EDITOR],
        [PAGE_NAMES.PROMOTIONS_EDITOR, PAGE_NAMES.FRAGMENT_EDITOR],
        [PAGE_NAMES.TRANSLATION_EDITOR, PAGE_NAMES.FRAGMENT_EDITOR],
        [PAGE_NAMES.BULK_PUBLISH_EDITOR, PAGE_NAMES.PROMOTIONS_EDITOR],
        [PAGE_NAMES.BULK_EDIT, PAGE_NAMES.BULK_EDIT_EDITOR],
        [PAGE_NAMES.BULK_EDIT_EDITOR, PAGE_NAMES.BULK_EDIT],
    ];

    for (const [from, to] of TRANSITIONS) {
        it(`disconnects "${from}" before connecting "${to}"`, async () => {
            Store.page.set(from);
            await el.updateComplete;
            pageTransitionLog.length = 0;

            Store.page.set(to);
            await el.updateComplete;

            const disconnectIndex = pageTransitionLog.findIndex(([, phase]) => phase === 'disconnect');
            const connectIndex = pageTransitionLog.findIndex(([, phase]) => phase === 'connect');
            expect(disconnectIndex, 'expected a disconnect event').to.be.greaterThan(-1);
            expect(connectIndex, 'expected a connect event').to.be.greaterThan(-1);
            expect(disconnectIndex).to.be.lessThan(connectIndex);
        });
    }

    it('never has more than one page view mounted at a time', async () => {
        const tagFor = (page) => PAGE_GETTERS.find(({ matchingPages }) => matchingPages.includes(page)).tag;

        for (const page of [PAGE_NAMES.TRANSLATION_EDITOR, PAGE_NAMES.PROMOTIONS_EDITOR, PAGE_NAMES.FRAGMENT_EDITOR]) {
            Store.page.set(page);
            await el.updateComplete;
            const mounted = PAGE_GETTERS.filter(({ tag }) => el.querySelector(tag));
            expect(mounted.map(({ tag }) => tag)).to.deep.equal([tagFor(page)]);
        }
    });
});
