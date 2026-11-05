import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import { ReactiveStore } from '../../src/reactivity/reactive-store.js';
import '../../src/swc.js';
import '../../src/common/components/mas-region-picker.js';

const items = [
    { value: 'US', country: 'US' },
    { value: 'FR', country: 'FR' },
    { value: 'DE', country: 'DE' },
    { value: 'JP', country: 'JP' },
    { value: 'XX', country: 'XX' },
];

describe('MasRegionPicker', () => {
    let sandbox;
    let store;

    const mount = () => fixture(html`<mas-region-picker .items=${items} .store=${store}></mas-region-picker>`);
    const itemCheckboxes = (el) => [...el.shadowRoot.querySelectorAll('.locale-col sp-checkbox')];

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        store = new ReactiveStore([]);
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
    });

    describe('items', () => {
        it('sorts items by value', async () => {
            const el = await mount();
            expect(el.sortedItems.map(({ value }) => value)).to.deep.equal(['DE', 'FR', 'JP', 'US', 'XX']);
        });

        it('groups items by region with unknown countries in Other', async () => {
            const el = await mount();
            const groups = el.groupedItems.map(({ name, items: groupItems }) => [name, groupItems.map(({ value }) => value)]);
            expect(groups).to.deep.equal([
                ['LATAM/Americas', ['US']],
                ['JAPAC', ['JP']],
                ['EMEA', ['DE', 'FR']],
                ['Other', ['XX']],
            ]);
        });

        it('filters items by search query', async () => {
            const el = await mount();
            el.searchQuery = 'f';
            expect(el.filteredItems.map(({ value }) => value)).to.deep.equal(['FR']);
        });

        it('renders an empty state when nothing matches the search', async () => {
            const el = await mount();
            el.searchQuery = 'zzz';
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.no-results')).to.exist;
        });

        it('renders one checkbox per item', async () => {
            const el = await mount();
            expect(itemCheckboxes(el).length).to.equal(items.length);
        });
    });

    describe('store', () => {
        it('re-renders when the store changes', async () => {
            const el = await mount();
            store.set(['FR']);
            await el.updateComplete;
            expect(itemCheckboxes(el).find((cb) => cb.textContent.trim() === 'FR').checked).to.be.true;
        });

        it('subscribes to a reassigned store', async () => {
            const el = await mount();
            const other = new ReactiveStore([]);
            el.store = other;
            await el.updateComplete;
            const spy = sandbox.spy(el, 'requestUpdate');
            other.set(['FR']);
            expect(spy.called).to.be.true;
        });

        it('unsubscribes from the previous store when reassigned', async () => {
            const el = await mount();
            el.store = new ReactiveStore([]);
            await el.updateComplete;
            const spy = sandbox.spy(el, 'requestUpdate');
            store.set(['DE']);
            expect(spy.called).to.be.false;
        });

        it('keeps a single controller across reconnects', async () => {
            const el = await mount();
            const controller = el.storeController;
            const parent = el.parentNode;
            el.remove();
            parent.appendChild(el);
            expect(el.storeController).to.equal(controller);
        });
    });

    describe('selection', () => {
        it('selects all items', async () => {
            const el = await mount();
            el.selectAll({ target: { checked: true } });
            expect(store.value).to.deep.equal(['DE', 'FR', 'JP', 'US', 'XX']);
        });

        it('deselects all items', async () => {
            store.set(['DE', 'FR']);
            const el = await mount();
            el.selectAll({ target: { checked: false } });
            expect(store.value).to.deep.equal([]);
        });

        it('adds a toggled item and keeps existing selections', async () => {
            store.set(['DE']);
            const el = await mount();
            el.toggleItem({ target: { checked: true, textContent: ' FR ' }, stopPropagation: sandbox.stub() });
            expect(store.value).to.deep.equal(['DE', 'FR']);
        });

        it('removes an untoggled item', async () => {
            store.set(['DE', 'FR']);
            const el = await mount();
            el.toggleItem({ target: { checked: false, textContent: 'FR' }, stopPropagation: sandbox.stub() });
            expect(store.value).to.deep.equal(['DE']);
        });

        it('stops propagation of item change events', async () => {
            const el = await mount();
            const stopPropagation = sandbox.stub();
            el.toggleItem({ target: { checked: true, textContent: 'FR' }, stopPropagation });
            expect(stopPropagation.calledOnce).to.be.true;
        });

        it('selects a whole region', async () => {
            const el = await mount();
            const emea = el.groupedItems.find(({ name }) => name === 'EMEA');
            el.toggleRegion(emea.items, { target: { indeterminate: false } });
            expect(store.value).to.have.members(['DE', 'FR']);
        });

        it('clears a partially selected region', async () => {
            store.set(['FR', 'US']);
            const el = await mount();
            const emea = el.groupedItems.find(({ name }) => name === 'EMEA');
            el.toggleRegion(emea.items, { target: { indeterminate: true } });
            expect(store.value).to.deep.equal(['US']);
        });

        it('reports region selection state', async () => {
            store.set(['FR']);
            const el = await mount();
            const emea = el.groupedItems.find(({ name }) => name === 'EMEA');
            expect(el.isRegionAllSelected(emea.items)).to.be.false;
            expect(el.isRegionIndeterminate(emea.items)).to.be.true;
        });

        it('selects via the select-all checkbox', async () => {
            const el = await mount();
            const selectAll = el.shadowRoot.querySelector('.select-all-row sp-checkbox');
            selectAll.checked = true;
            selectAll.dispatchEvent(new Event('change'));
            expect(store.value).to.have.length(items.length);
        });

        it('checks select-all when every item is selected', async () => {
            const el = await mount();
            store.set(items.map(({ value }) => value));
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.select-all-row sp-checkbox').checked).to.be.true;
        });
    });

    describe('labels', () => {
        it('uses the default noun', async () => {
            const el = await mount();
            expect(el.shadowRoot.querySelector('.locale-count').textContent).to.equal('5 items');
        });

        it('renders the custom noun and search placeholder', async () => {
            store.set(['FR']);
            const el = await fixture(html`
                <mas-region-picker
                    .items=${items}
                    .store=${store}
                    noun="country"
                    noun-plural="countries"
                    search-placeholder="Search country"
                ></mas-region-picker>
            `);
            expect(el.shadowRoot.querySelector('.locale-count').textContent).to.equal('1 country selected');
            expect(el.shadowRoot.querySelector('sp-search').getAttribute('placeholder')).to.equal('Search country');
        });
    });
});
