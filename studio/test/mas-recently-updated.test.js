import { expect, fixture, html } from '@open-wc/testing';
import '../src/swc.js';
import { Fragment } from '../src/aem/fragment.js';
import { CARD_MODEL_PATH } from '../src/constants.js';
import Store from '../src/store.js';
import generateFragmentStore from '../src/reactivity/source-fragment-store.js';
import '../src/mas-recently-updated.js';

describe('MasRecentlyUpdated', () => {
    let data;
    let loading;

    beforeEach(() => {
        data = Store.fragments.recentlyUpdated.data.value;
        loading = Store.fragments.recentlyUpdated.loading.get();
        Store.fragments.recentlyUpdated.loading.set(false);
    });

    afterEach(() => {
        Store.fragments.recentlyUpdated.data.value = data;
        Store.fragments.recentlyUpdated.loading.set(loading);
    });

    const makeStore = (id, variant) =>
        generateFragmentStore(
            new Fragment({
                id,
                path: `/content/dam/mas/acom/en_US/cards/${id}`,
                model: { path: CARD_MODEL_PATH },
                fields: [{ name: 'variant', values: [variant] }],
                tags: [],
            }),
        );

    it('keeps stored bizpro fragments visible', async () => {
        Store.fragments.recentlyUpdated.data.value = [makeStore('legacy-pro', 'bizpro'), makeStore('unknown', 'unknown')];

        const el = await fixture(html`<mas-recently-updated></mas-recently-updated>`);
        await el.updateComplete;

        const fragments = el.querySelectorAll('mas-fragment');
        expect(fragments).to.have.lengthOf(1);
        expect(fragments[0].fragmentStore.get().id).to.equal('legacy-pro');
    });
});
