import { fixture, html, expect } from '@open-wc/testing';
import { fixtureCleanup } from '@open-wc/testing-helpers/pure';
import { ReactiveStore } from '../../src/reactivity/reactive-store.js';
import '../../src/translation/mas-translation-languages.js';
import Store from '../../src/store.js';

describe('mas-translation-languages targetStore', () => {
    let originalSearchValue;

    beforeEach(() => {
        originalSearchValue = Store.search.get();
        Store.search.set({ path: 'acom' });
        Store.translationProjects.targetLocales.set([]);
    });

    afterEach(() => {
        fixtureCleanup();
        Store.search.set(originalSearchValue);
        Store.translationProjects.targetLocales.set([]);
    });

    it('defaults to Store.translationProjects', async () => {
        const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
        expect(el.targetStore).to.equal(Store.translationProjects);
    });

    it('uses the provided targetStore for targetLocales', async () => {
        const fake = { targetLocales: new ReactiveStore(['fr_FR']) };
        const el = await fixture(html` <mas-translation-languages .targetStore=${fake}></mas-translation-languages> `);
        expect(el.targetStore).to.equal(fake);
    });
});
