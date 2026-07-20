import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/promotions/mas-promo-variation-geos.js';

describe('MasPromoVariationGeos', () => {
    afterEach(() => {
        fixtureCleanup();
    });

    const geos = ['mas:pzn/country/ar', 'mas:pzn/country/ae', 'mas:pzn/country/fr'];

    describe('rendering', () => {
        it('renders one checkbox per geo', async () => {
            const el = await fixture(html`<mas-promo-variation-geos .geos=${geos}></mas-promo-variation-geos>`);
            const checkboxes = el.shadowRoot.querySelectorAll('sp-checkbox[value]');
            expect(checkboxes).to.have.lengthOf(3);
        });

        it('shows the last path segment as the checkbox label while keeping the full tag id as the value', async () => {
            const el = await fixture(html`<mas-promo-variation-geos .geos=${geos}></mas-promo-variation-geos>`);
            const checkbox = el.shadowRoot.querySelector('sp-checkbox[value="mas:pzn/country/ar"]');
            expect(checkbox.textContent.trim()).to.equal('ar');
            expect(checkbox.getAttribute('value')).to.equal('mas:pzn/country/ar');
        });

        it('checks the checkboxes for geos already in value', async () => {
            const el = await fixture(
                html`<mas-promo-variation-geos .geos=${geos} .value=${['mas:pzn/country/fr']}></mas-promo-variation-geos>`,
            );
            const checkbox = el.shadowRoot.querySelector('sp-checkbox[value="mas:pzn/country/fr"]');
            expect(checkbox.checked).to.be.true;
        });

        it('disables checkboxes for geos already used by a sibling variation', async () => {
            const el = await fixture(
                html`<mas-promo-variation-geos
                    .geos=${geos}
                    .disabledGeos=${['mas:pzn/country/ar']}
                ></mas-promo-variation-geos>`,
            );
            const disabled = el.shadowRoot.querySelector('sp-checkbox[value="mas:pzn/country/ar"]');
            const enabled = el.shadowRoot.querySelector('sp-checkbox[value="mas:pzn/country/ae"]');
            expect(disabled.disabled).to.be.true;
            expect(enabled.disabled).to.be.false;
        });

        it('shows a "no results" message when the search matches nothing', async () => {
            const el = await fixture(html`<mas-promo-variation-geos .geos=${geos}></mas-promo-variation-geos>`);
            el.searchQuery = 'zzz-no-match';
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.no-results')).to.exist;
        });
    });

    describe('search', () => {
        it('filters the visible geos by the search query', async () => {
            const el = await fixture(html`<mas-promo-variation-geos .geos=${geos}></mas-promo-variation-geos>`);
            el.searchQuery = 'fr';
            await el.updateComplete;
            const checkboxes = el.shadowRoot.querySelectorAll('sp-checkbox[value]');
            expect(checkboxes).to.have.lengthOf(1);
            expect(checkboxes[0].getAttribute('value')).to.equal('mas:pzn/country/fr');
        });

        it('updates searchQuery from the search input event', async () => {
            const el = await fixture(html`<mas-promo-variation-geos .geos=${geos}></mas-promo-variation-geos>`);
            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'ae';
            search.dispatchEvent(new Event('input'));
            await el.updateComplete;
            expect(el.searchQuery).to.equal('ae');
        });
    });

    describe('toggling a geo', () => {
        it('adds the geo to value and emits change when checked', async () => {
            const el = await fixture(html`<mas-promo-variation-geos .geos=${geos}></mas-promo-variation-geos>`);
            const changeSpy = new Promise((resolve) => el.addEventListener('change', (e) => resolve(e.detail)));

            const checkbox = el.shadowRoot.querySelector('sp-checkbox[value="mas:pzn/country/ae"]');
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));

            const detail = await changeSpy;
            expect(detail.value).to.deep.equal(['mas:pzn/country/ae']);
            expect(el.value).to.deep.equal(['mas:pzn/country/ae']);
        });

        it('removes the geo from value and emits change when unchecked', async () => {
            const el = await fixture(
                html`<mas-promo-variation-geos .geos=${geos} .value=${['mas:pzn/country/ae', 'mas:pzn/country/fr']}>
                </mas-promo-variation-geos>`,
            );
            const changeSpy = new Promise((resolve) => el.addEventListener('change', (e) => resolve(e.detail)));

            const checkbox = el.shadowRoot.querySelector('sp-checkbox[value="mas:pzn/country/ae"]');
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change'));

            const detail = await changeSpy;
            expect(detail.value).to.deep.equal(['mas:pzn/country/fr']);
        });
    });

    describe('select all', () => {
        it('selects every non-disabled geo when checked', async () => {
            const el = await fixture(
                html`<mas-promo-variation-geos
                    .geos=${geos}
                    .disabledGeos=${['mas:pzn/country/ar']}
                ></mas-promo-variation-geos>`,
            );
            const selectAll = el.shadowRoot.querySelector('.select-all-row sp-checkbox');
            selectAll.checked = true;
            selectAll.dispatchEvent(new Event('change'));
            await el.updateComplete;

            expect(el.value).to.deep.equal(['mas:pzn/country/ae', 'mas:pzn/country/fr']);
        });

        it('clears the selection when unchecked', async () => {
            const el = await fixture(html`<mas-promo-variation-geos .geos=${geos} .value=${geos}></mas-promo-variation-geos>`);
            const selectAll = el.shadowRoot.querySelector('.select-all-row sp-checkbox');
            selectAll.checked = false;
            selectAll.dispatchEvent(new Event('change'));
            await el.updateComplete;

            expect(el.value).to.deep.equal([]);
        });

        it('is checked when every selectable geo is selected', async () => {
            const el = await fixture(html`<mas-promo-variation-geos .geos=${geos} .value=${geos}></mas-promo-variation-geos>`);
            expect(el.selectAllChecked).to.be.true;
        });

        it('is indeterminate when some but not all selectable geos are selected', async () => {
            const el = await fixture(
                html`<mas-promo-variation-geos .geos=${geos} .value=${['mas:pzn/country/fr']}></mas-promo-variation-geos>`,
            );
            expect(el.selectAllIndeterminate).to.be.true;
        });

        it('excludes disabled geos from the selectable count', async () => {
            const el = await fixture(
                html`<mas-promo-variation-geos
                    .geos=${geos}
                    .disabledGeos=${['mas:pzn/country/ar']}
                    .value=${['mas:pzn/country/ae', 'mas:pzn/country/fr']}
                ></mas-promo-variation-geos>`,
            );
            expect(el.selectAllChecked).to.be.true;
            expect(el.selectAllIndeterminate).to.be.false;
        });
    });

    describe('inherit hint', () => {
        it('shows the informational hint when nothing is selected and there is no geo-less sibling', async () => {
            const el = await fixture(html`<mas-promo-variation-geos .geos=${geos}></mas-promo-variation-geos>`);
            expect(el.showInheritHint).to.be.true;
            const hint = el.shadowRoot.querySelector('.inherit-hint');
            expect(hint).to.exist;
            expect(hint.classList.contains('blocked')).to.be.false;
            expect(hint.textContent).to.include('all geos');
        });

        it('shows the blocked hint when nothing is selected and a geo-less sibling already exists', async () => {
            const el = await fixture(
                html`<mas-promo-variation-geos .geos=${geos} .hasEmptyGeosVariation=${true}></mas-promo-variation-geos>`,
            );
            expect(el.showInheritHint).to.be.true;
            const hint = el.shadowRoot.querySelector('.inherit-hint');
            expect(hint).to.exist;
            expect(hint.classList.contains('blocked')).to.be.true;
            expect(hint.textContent).to.include('already exists');
        });

        it('hides the hint once any geo is checked', async () => {
            const el = await fixture(
                html`<mas-promo-variation-geos .geos=${geos} .value=${['mas:pzn/country/ar']}></mas-promo-variation-geos>`,
            );
            expect(el.showInheritHint).to.be.false;
            expect(el.shadowRoot.querySelector('.inherit-hint')).to.not.exist;
        });

        it('shows the hint even when every geo is already disabled (no selectable geos) — a geo-less variation is still valid', async () => {
            const el = await fixture(
                html`<mas-promo-variation-geos .geos=${geos} .disabledGeos=${geos}></mas-promo-variation-geos>`,
            );
            expect(el.showInheritHint).to.be.true;
            expect(el.shadowRoot.querySelector('.inherit-hint')).to.exist;
        });

        it('hides the hint in compact mode', async () => {
            const el = await fixture(html`<mas-promo-variation-geos .geos=${geos} compact></mas-promo-variation-geos>`);
            expect(el.shadowRoot.querySelector('.inherit-hint')).to.not.exist;
        });
    });
});
