import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import { nothing, render } from 'lit';
import '../src/mas-related-variations.js';
import { Fragment } from '../src/aem/fragment.js';
import { CARD_MODEL_PATH, VARIATION_TAB_NAME } from '../src/constants.js';
import { setItemsSelectionStore } from '../src/common/items-selection-store.js';
import Store from '../src/store.js';

describe('MasRelatedVariations', () => {
    let sandbox;
    let el;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        el = document.createElement('mas-related-variations');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('renders nothing when there is no target fragment', () => {
        el.targetFragment = null;
        expect(el.render()).to.equal(nothing);
    });

    it('renders nothing when target fragment has no variations', () => {
        const fragment = new Fragment({
            id: 'test-id',
            path: '/content/dam/mas/s/en_US/f',
            model: { path: CARD_MODEL_PATH },
            fields: [],
            tags: [],
        });
        el.fragment = fragment;
        el.targetFragment = fragment;
        el.isVariation = false;
        expect(el.render()).to.equal(nothing);
    });

    it('renders three independently-collapsible variation type sections, collapsed by default', () => {
        const fragment = new Fragment({
            id: 'test-id',
            path: '/content/dam/mas/sandbox/en_US/my-fragment',
            model: { path: CARD_MODEL_PATH },
            fields: [{ name: 'variations', values: ['/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-fragment'] }],
            references: [
                { id: 'ref-1', path: '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-fragment', tags: [] },
            ],
            tags: [],
        });
        el.fragment = fragment;
        el.targetFragment = fragment;
        el.isVariation = false;

        const container = document.createElement('div');
        render(el.render(), container);
        expect(container.textContent).to.include('Locale variations');
        expect(container.textContent).to.include('Promo variations');
        expect(container.textContent).to.include('Grouped variations');
        expect(container.querySelectorAll('.variation-type-toggle')).to.have.lengthOf(3);
        expect(container.querySelector('mas-collapsible-table-row')).to.be.null;
    });

    it('toggles a variation type section independently of the other two', () => {
        const fragment = new Fragment({
            id: 'test-id',
            path: '/content/dam/mas/sandbox/en_US/my-fragment',
            model: { path: CARD_MODEL_PATH },
            fields: [{ name: 'variations', values: ['/content/dam/mas/sandbox/en_BE/my-fragment'] }],
            references: [
                { id: 'ref-1', path: '/content/dam/mas/sandbox/en_BE/my-fragment', tags: [], title: 'My Fragment BE' },
            ],
            tags: [],
        });
        el.fragment = fragment;
        el.targetFragment = fragment;
        el.isVariation = false;

        const container = document.createElement('div');
        render(el.render(), container);
        const [localeButton] = container.querySelectorAll('.variation-type-toggle');
        localeButton.click();
        render(el.render(), container);

        expect(container.querySelector('mas-collapsible-table-row')).to.be.null;
        const headerCells = container.querySelectorAll('sp-table-head-cell');
        expect(Array.from(headerCells).map((c) => c.textContent.trim())).to.deep.equal(['Variation name', 'Path', 'Region']);
        expect(container.querySelectorAll('sp-table-row')).to.have.lengthOf(1);
    });

    describe('currentVariationType getter', () => {
        it('returns null when there is no fragment', () => {
            el.fragment = null;
            expect(el.currentVariationType).to.equal(null);
        });

        it('returns GROUPED when the fragment path is a pzn variation path', () => {
            el.fragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/sandbox/en_US/my-fragment/pzn/variant-1',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
            });
            expect(el.currentVariationType).to.equal(VARIATION_TAB_NAME.GROUPED);
        });

        it('returns PROMOTION when isPromoVariation is true', () => {
            el.fragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-fragment',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
            });
            el.isPromoVariation = true;
            expect(el.currentVariationType).to.equal(VARIATION_TAB_NAME.PROMOTION);
        });

        it('returns LOCALE otherwise', () => {
            el.fragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/sandbox/en_BE/my-fragment',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
            });
            expect(el.currentVariationType).to.equal(VARIATION_TAB_NAME.LOCALE);
        });
    });

    describe('sibling variations view (isVariation = true)', () => {
        it('renders only the current variation type section under a "Sibling variations" heading', () => {
            const childFragment = new Fragment({
                id: 'child-id',
                path: '/content/dam/mas/sandbox/en_BE/my-fragment',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
            });
            const parentFragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/sandbox/en_US/my-fragment',
                model: { path: CARD_MODEL_PATH },
                fields: [{ name: 'variations', values: [childFragment.path] }],
                references: [{ id: childFragment.id, path: childFragment.path, tags: [] }],
                tags: [],
            });
            el.fragment = childFragment;
            el.targetFragment = parentFragment;
            el.isVariation = true;

            const container = document.createElement('div');
            render(el.render(), container);

            expect(container.textContent).to.include('Sibling variations:');
            expect(container.querySelectorAll('.variation-type-toggle')).to.have.lengthOf(1);
            expect(container.textContent).to.include('Locale variations');
        });
    });

    describe('locale variations table', () => {
        const variation = {
            id: 'locale-var-id',
            path: '/content/dam/mas/sandbox/en_BE/my-fragment',
            title: 'My Fragment BE',
        };

        beforeEach(() => {
            const fragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/sandbox/en_US/my-fragment',
                model: { path: CARD_MODEL_PATH },
                fields: [{ name: 'variations', values: [variation.path] }],
                references: [{ id: variation.id, path: variation.path, tags: [], title: variation.title }],
                tags: [],
            });
            el.fragment = fragment;
            el.targetFragment = fragment;
            el.isVariation = false;
            el.expandedVariationTypes = new Set([VARIATION_TAB_NAME.LOCALE]);
        });

        it('renders variation name, path, and region for each locale variation', () => {
            const container = document.createElement('div');
            render(el.render(), container);

            const row = container.querySelector('sp-table-row');
            expect(row.textContent).to.include('My Fragment BE');
            expect(row.textContent).to.include('/content/dam/mas/sandbox/en_BE/my-fragment');
            expect(row.textContent).to.include('en_BE');
        });

        it('renders the path cell as plain wrapping text with no tooltip', () => {
            const container = document.createElement('div');
            render(el.render(), container);

            const pathCell = container.querySelector('sp-table-cell.path');
            expect(pathCell).to.not.be.null;
            expect(pathCell.querySelector('overlay-trigger')).to.be.null;
            expect(pathCell.querySelector('sp-tooltip')).to.be.null;
            expect(pathCell.textContent.trim()).to.equal('/content/dam/mas/sandbox/en_BE/my-fragment');
        });

        it('renders the variation name as a link to the fragment editor', () => {
            const container = document.createElement('div');
            render(el.render(), container);

            const link = container.querySelector('sp-table-cell a');
            expect(link).to.not.be.null;
            expect(link.textContent.trim()).to.equal('My Fragment BE');
            expect(link.getAttribute('href')).to.equal('#page=fragment-editor&fragmentId=locale-var-id');
            expect(link.getAttribute('target')).to.equal('_blank');
            expect(link.getAttribute('rel')).to.equal('noopener noreferrer');
        });

        it('stops the click on the variation link from bubbling to the row', () => {
            const container = document.createElement('div');
            render(el.render(), container);

            const row = container.querySelector('sp-table-row');
            const rowClickSpy = sandbox.spy();
            row.addEventListener('click', rowClickSpy);
            const link = container.querySelector('sp-table-cell a');
            // Real <a target="_blank">: a synthetic click has no user-activation, so Chrome
            // navigates the test page itself instead of popup-blocking it. preventDefault here
            // only guards the test run; it is not part of what's being asserted below.
            link.addEventListener('click', (e) => e.preventDefault());
            link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

            expect(rowClickSpy.called).to.be.false;
        });

        it('renders the variation name as plain text when the variation has no id', () => {
            const fragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/sandbox/en_US/my-fragment',
                model: { path: CARD_MODEL_PATH },
                fields: [{ name: 'variations', values: ['/content/dam/mas/sandbox/en_BE/my-fragment'] }],
                references: [{ path: '/content/dam/mas/sandbox/en_BE/my-fragment', tags: [], title: 'My Fragment BE' }],
                tags: [],
            });
            el.fragment = fragment;
            el.targetFragment = fragment;

            const container = document.createElement('div');
            render(el.render(), container);

            expect(container.querySelector('sp-table-cell a')).to.be.null;
            expect(container.querySelector('sp-table-row').textContent).to.include('My Fragment BE');
        });

        it('opens the fragment editor in a new tab on row double-click', () => {
            const openSpy = sandbox.stub(window, 'open');
            const container = document.createElement('div');
            render(el.render(), container);

            container
                .querySelector('sp-table-row')
                .dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));

            expect(openSpy.calledOnce).to.be.true;
            expect(openSpy.firstCall.args[0]).to.equal('#page=fragment-editor&fragmentId=locale-var-id');
        });

        it('shows an empty message when the target fragment has no locale variations', () => {
            const fragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/sandbox/en_US/my-fragment',
                model: { path: CARD_MODEL_PATH },
                fields: [
                    {
                        name: 'variations',
                        values: ['/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-fragment'],
                    },
                ],
                references: [
                    {
                        id: 'promo-ref-1',
                        path: '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-fragment',
                        tags: [],
                    },
                ],
                tags: [],
            });
            el.fragment = fragment;
            el.targetFragment = fragment;

            const container = document.createElement('div');
            render(el.render(), container);
            expect(container.textContent).to.include('No locale variations found');
        });
    });

    describe('promo variations table', () => {
        const variation = {
            id: 'promo-var-id',
            path: '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-card',
            tags: [{ id: 'mas:promotion/back-to-school', title: 'Back To School' }],
            fields: [],
        };

        afterEach(() => {
            Store.promotions.list.data.set([]);
            Store.promotions.inEdit.set(null);
        });

        beforeEach(() => {
            const fragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/sandbox/en_US/my-fragment',
                model: { path: CARD_MODEL_PATH },
                fields: [
                    {
                        name: 'variations',
                        values: ['/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-fragment'],
                    },
                ],
                references: [
                    {
                        id: 'ref-1',
                        path: '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-fragment',
                        tags: [],
                    },
                ],
                tags: [],
            });
            el.fragment = fragment;
            el.targetFragment = fragment;
            el.isVariation = false;
            el.expandedVariationTypes = new Set([VARIATION_TAB_NAME.PROMOTION]);
        });

        it('renders a plain sp-table with Variation name / Promotion project / Geos variation tags columns instead of mas-collapsible-table-row', () => {
            el.promoVariations = [variation];
            const container = document.createElement('div');
            render(el.render(), container);

            expect(container.querySelector('mas-collapsible-table-row')).to.be.null;
            const headerCells = container.querySelectorAll('sp-table-head-cell');
            expect(Array.from(headerCells).map((c) => c.textContent.trim())).to.deep.equal([
                'Variation name',
                'Promotion project',
                'Geos variation tags',
            ]);
            expect(container.querySelectorAll('sp-table-row')).to.have.lengthOf(1);
        });

        it('shows a loading skeleton while isLoadingPromoVariations is true', () => {
            el.isLoadingPromoVariations = true;
            el.promoVariations = [];
            const container = document.createElement('div');
            render(el.render(), container);
            expect(container.querySelectorAll('.skeleton-row').length).to.be.greaterThan(0);
        });

        it('shows an empty message when there are no promo variations', () => {
            el.promoVariations = [];
            const container = document.createElement('div');
            render(el.render(), container);
            expect(container.textContent).to.include('No promotion variations found');
        });

        it('renders the variation name as a link to the fragment editor', () => {
            el.promoVariations = [variation];
            const container = document.createElement('div');
            render(el.render(), container);

            const link = container.querySelector('sp-table-cell a');
            expect(link).to.not.be.null;
            expect(link.getAttribute('href')).to.equal('#page=fragment-editor&fragmentId=promo-var-id');
            expect(link.getAttribute('target')).to.equal('_blank');
            expect(link.getAttribute('rel')).to.equal('noopener noreferrer');
        });

        it('opens the fragment editor in a new tab on row double-click', () => {
            const openSpy = sandbox.stub(window, 'open');
            el.promoVariations = [variation];
            const container = document.createElement('div');
            render(el.render(), container);

            container
                .querySelector('sp-table-row')
                .dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));

            expect(openSpy.calledOnce).to.be.true;
            expect(openSpy.firstCall.args[0]).to.equal('#page=fragment-editor&fragmentId=promo-var-id');
        });

        it('links the promotion project cell when a matching project is found in the store list', () => {
            Store.promotions.list.data.set([
                { get: () => ({ id: 'promo-project-1', tags: [{ id: 'mas:promotion/back-to-school' }] }) },
            ]);
            el.promoVariations = [variation];
            const container = document.createElement('div');
            render(el.render(), container);

            const projectLink = container.querySelectorAll('sp-table-cell')[1].querySelector('a');
            expect(projectLink).to.not.be.null;
            expect(projectLink.getAttribute('href')).to.equal('#page=promotions-editor&promotionId=promo-project-1');
        });

        it('falls back to the in-edit promotion project when the store list has no match', () => {
            Store.promotions.list.data.set([]);
            Store.promotions.inEdit.set({ value: { id: 'promo-project-2', tags: [{ id: 'mas:promotion/back-to-school' }] } });
            el.promoVariations = [variation];
            const container = document.createElement('div');
            render(el.render(), container);

            const projectLink = container.querySelectorAll('sp-table-cell')[1].querySelector('a');
            expect(projectLink).to.not.be.null;
            expect(projectLink.getAttribute('href')).to.equal('#page=promotions-editor&promotionId=promo-project-2');
        });
    });

    describe('grouped variations table', () => {
        const variation = {
            id: 'grouped-var-id',
            path: '/content/dam/mas/sandbox/en_US/my-fragment/pzn/variant-1',
            title: 'Variant One',
            fieldTags: [{ name: 'plan-type/abm' }, { name: 'plan-type/team' }],
        };

        beforeEach(() => {
            const fragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/sandbox/en_US/my-fragment',
                model: { path: CARD_MODEL_PATH },
                fields: [
                    {
                        name: 'variations',
                        values: ['/content/dam/mas/sandbox/en_US/my-fragment/pzn/variant-1'],
                    },
                ],
                references: [
                    {
                        id: 'grouped-var-id',
                        path: '/content/dam/mas/sandbox/en_US/my-fragment/pzn/variant-1',
                        tags: [],
                    },
                ],
                tags: [],
            });
            el.fragment = fragment;
            el.targetFragment = fragment;
            el.isVariation = false;
            el.expandedVariationTypes = new Set([VARIATION_TAB_NAME.GROUPED]);
        });

        it('renders a plain sp-table with Variation name / Path / Grouped tags columns instead of mas-collapsible-table-row', () => {
            el.groupedVariations = [variation];
            const container = document.createElement('div');
            render(el.render(), container);

            expect(container.querySelector('mas-collapsible-table-row')).to.be.null;
            const headerCells = container.querySelectorAll('sp-table-head-cell');
            expect(Array.from(headerCells).map((c) => c.textContent.trim())).to.deep.equal([
                'Variation name',
                'Path',
                'Grouped tags',
            ]);
            const row = container.querySelector('sp-table-row');
            expect(row.textContent).to.include('Variant One');
            expect(row.textContent).to.include('/content/dam/mas/sandbox/en_US/my-fragment/pzn/variant-1');
            expect(row.textContent).to.include('plan-type/abm');
            expect(row.textContent).to.include('plan-type/team');
            expect(row.querySelector('sp-table-cell.path')).to.not.be.null;
        });

        it('shows a loading skeleton while isLoadingGroupedVariations is true', () => {
            el.isLoadingGroupedVariations = true;
            el.groupedVariations = [];
            const container = document.createElement('div');
            render(el.render(), container);
            expect(container.querySelectorAll('.skeleton-row').length).to.be.greaterThan(0);
        });

        it('shows an empty message when there are no grouped variations', () => {
            el.groupedVariations = [];
            const container = document.createElement('div');
            render(el.render(), container);
            expect(container.textContent).to.include('No grouped variations found');
        });

        it('renders the variation name as a link to the fragment editor', () => {
            el.groupedVariations = [variation];
            const container = document.createElement('div');
            render(el.render(), container);

            const link = container.querySelector('sp-table-cell a');
            expect(link).to.not.be.null;
            expect(link.textContent.trim()).to.equal('Variant One');
            expect(link.getAttribute('href')).to.equal('#page=fragment-editor&fragmentId=grouped-var-id');
            expect(link.getAttribute('target')).to.equal('_blank');
            expect(link.getAttribute('rel')).to.equal('noopener noreferrer');
        });

        it('opens the fragment editor in a new tab on row double-click', () => {
            const openSpy = sandbox.stub(window, 'open');
            el.groupedVariations = [variation];
            const container = document.createElement('div');
            render(el.render(), container);

            container
                .querySelector('sp-table-row')
                .dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));

            expect(openSpy.calledOnce).to.be.true;
            expect(openSpy.firstCall.args[0]).to.equal('#page=fragment-editor&fragmentId=grouped-var-id');
        });
    });

    describe('lazy loading (real component lifecycle)', () => {
        afterEach(() => {
            setItemsSelectionStore(null);
            Store.promotions.list.data.set([]);
        });

        it('does not fetch grouped variations on mount, only after the toggle is clicked and expanded', async () => {
            Store.fragmentEditor.itemsSelection.groupedVariationsByParent.set(new Map());
            setItemsSelectionStore(Store.fragmentEditor.itemsSelection);

            const fragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/sandbox/en_US/my-fragment',
                model: { path: CARD_MODEL_PATH },
                fields: [{ name: 'variations', values: ['/content/dam/mas/sandbox/en_US/my-fragment/pzn/variant-1'] }],
                references: [
                    { id: 'grouped-var-id', path: '/content/dam/mas/sandbox/en_US/my-fragment/pzn/variant-1', tags: [] },
                ],
                tags: [],
            });
            const getFragmentByPath = sinon.stub().resolves(null);
            const repository = { aem: { getFragmentByPath } };

            const el = await fixture(
                html`<mas-related-variations
                    .fragment=${fragment}
                    .targetFragment=${fragment}
                    .isVariation=${false}
                    .repository=${repository}
                ></mas-related-variations>`,
            );
            await el.updateComplete;

            expect(getFragmentByPath.called).to.be.false;

            const groupedButton = Array.from(el.shadowRoot.querySelectorAll('.variation-type-toggle')).find((button) =>
                button.textContent.includes('Grouped variations'),
            );
            groupedButton.click();
            await el.updateComplete;

            expect(getFragmentByPath.called).to.be.true;
        });

        it('only fetches grouped variation paths, excluding locale and promo variation paths', async () => {
            Store.fragmentEditor.itemsSelection.groupedVariationsByParent.set(new Map());
            setItemsSelectionStore(Store.fragmentEditor.itemsSelection);

            const groupedPath = '/content/dam/mas/sandbox/en_US/my-fragment/pzn/variant-1';
            const localePath = '/content/dam/mas/sandbox/en_BE/my-fragment';
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-fragment';
            const fragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/sandbox/en_US/my-fragment',
                model: { path: CARD_MODEL_PATH },
                fields: [{ name: 'variations', values: [groupedPath, localePath, promoPath] }],
                references: [
                    { id: 'grouped-var-id', path: groupedPath, tags: [] },
                    { id: 'locale-var-id', path: localePath, tags: [] },
                    { id: 'promo-var-id', path: promoPath, tags: [] },
                ],
                tags: [],
            });
            const getFragmentByPath = sinon.stub().resolves(null);
            const repository = { aem: { getFragmentByPath } };

            const el = await fixture(
                html`<mas-related-variations
                    .fragment=${fragment}
                    .targetFragment=${fragment}
                    .isVariation=${false}
                    .repository=${repository}
                ></mas-related-variations>`,
            );
            await el.updateComplete;

            const groupedButton = Array.from(el.shadowRoot.querySelectorAll('.variation-type-toggle')).find((button) =>
                button.textContent.includes('Grouped variations'),
            );
            groupedButton.click();
            await el.updateComplete;

            expect(getFragmentByPath.calledOnceWith(groupedPath)).to.be.true;
        });

        it('does not fetch promo variations on mount, only after the toggle is clicked and expanded', async () => {
            const fragment = new Fragment({
                id: 'test-id',
                path: '/content/dam/mas/sandbox/en_US/my-fragment',
                model: { path: CARD_MODEL_PATH },
                fields: [
                    {
                        name: 'variations',
                        values: ['/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-fragment'],
                    },
                ],
                references: [
                    {
                        id: 'ref-1',
                        path: '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-fragment',
                        tags: [],
                    },
                ],
                tags: [],
            });
            const loadPromotions = sinon.stub().resolves();
            const repository = { aem: {}, loadPromotions };

            const el = await fixture(
                html`<mas-related-variations
                    .fragment=${fragment}
                    .targetFragment=${fragment}
                    .isVariation=${false}
                    .repository=${repository}
                ></mas-related-variations>`,
            );
            await el.updateComplete;

            expect(loadPromotions.called).to.be.false;

            const promoButton = Array.from(el.shadowRoot.querySelectorAll('.variation-type-toggle')).find((button) =>
                button.textContent.includes('Promo variations'),
            );
            promoButton.click();
            await el.updateComplete;

            expect(loadPromotions.called).to.be.true;
        });
    });
});
