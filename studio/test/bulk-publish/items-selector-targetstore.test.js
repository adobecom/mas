import { fixture, html, expect } from '@open-wc/testing';
import { ReactiveStore } from '../../src/reactivity/reactive-store.js';
import '../../src/translation/mas-items-selector.js';
import Store from '../../src/store.js';

describe('mas-items-selector targetStore', () => {
    it('defaults to Store.translationProjects', async () => {
        const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
        expect(el.targetStore).to.equal(Store.translationProjects);
    });

    it('reads selection from the provided targetStore', async () => {
        const fakeStore = {
            selectedCards: new ReactiveStore([{ id: 'a' }]),
            selectedCollections: new ReactiveStore([]),
            selectedPlaceholders: new ReactiveStore([]),
            showSelected: new ReactiveStore(false),
        };
        const el = await fixture(html` <mas-items-selector .targetStore=${fakeStore}></mas-items-selector> `);
        await el.updateComplete;
        expect(el.targetStore).to.equal(fakeStore);
    });
});
