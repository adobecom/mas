import { expect } from '@esm-bundle/chai';
import { nothing, render } from 'lit';
import {
    renderFragmentStatusCell,
    renderPromotionStatusCell,
    getItemTypeLabel,
    getItemTitle,
    shouldIgnoreRowClickForSelection,
    getStudioFragmentDisplayPath,
} from '../../../src/common/utils/render-utils.js';
import { generateCodeToUse } from '../../../src/utils.js';
import Store from '../../../src/store.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, DICTIONARY_MODEL_PATH, FRAGMENT_STATUS } from '../../../src/constants.js';

describe('render-utils', () => {
    describe('renderFragmentStatusCell', () => {
        it('returns nothing when status is missing', () => {
            expect(renderFragmentStatusCell()).to.equal(nothing);
            expect(renderFragmentStatusCell('')).to.equal(nothing);
        });

        it('renders published status with green class', () => {
            const container = document.createElement('div');
            render(renderFragmentStatusCell(FRAGMENT_STATUS.PUBLISHED), container);
            const statusLight = container.querySelector('sp-status-light');
            expect(statusLight?.getAttribute('variant')).to.equal('positive');
            expect(container.textContent).to.include('Published');
        });

        it('renders modified status with blue class', () => {
            const container = document.createElement('div');
            render(renderFragmentStatusCell(FRAGMENT_STATUS.MODIFIED), container);
            const statusLight = container.querySelector('sp-status-light');
            expect(statusLight?.getAttribute('variant')).to.equal('yellow');
            expect(container.textContent).to.include('Modified');
        });
    });

    describe('renderPromotionStatusCell', () => {
        it('renders active with green dot', () => {
            const container = document.createElement('div');
            render(renderPromotionStatusCell('active'), container);
            const dot = container.querySelector('.status-dot');
            expect(dot?.classList.contains('green')).to.be.true;
            expect(container.textContent).to.include('ACTIVE');
        });

        it('renders draft with blue dot', () => {
            const container = document.createElement('div');
            render(renderPromotionStatusCell('draft'), container);
            const dot = container.querySelector('.status-dot');
            expect(dot?.classList.contains('blue')).to.be.true;
            expect(container.textContent).to.include('DRAFT');
        });

        it('renders scheduled with yellow dot', () => {
            const container = document.createElement('div');
            render(renderPromotionStatusCell('scheduled'), container);
            const dot = container.querySelector('.status-dot');
            expect(dot?.classList.contains('yellow')).to.be.true;
            expect(container.textContent).to.include('SCHEDULED');
        });

        it('renders modified with yellow dot', () => {
            const container = document.createElement('div');
            render(renderPromotionStatusCell('modified'), container);
            const dot = container.querySelector('.status-dot');
            expect(dot?.classList.contains('yellow')).to.be.true;
            expect(container.textContent).to.include('MODIFIED');
        });
    });

    describe('getItemTypeLabel', () => {
        it('returns Unknown for falsy item', () => {
            expect(getItemTypeLabel(null)).to.equal('Unknown');
            expect(getItemTypeLabel(undefined)).to.equal('Unknown');
        });

        it('returns Grouped variation when path is a grouped variation path', () => {
            expect(getItemTypeLabel({ path: '/content/x/pzn/y/var' })).to.equal('Grouped variation');
        });

        it('returns Promotion for promo variation paths', () => {
            expect(getItemTypeLabel({ path: '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card' })).to.equal(
                'Promotion',
            );
        });

        it('returns Placeholder for dictionary model', () => {
            expect(getItemTypeLabel({ model: { path: `${DICTIONARY_MODEL_PATH}/foo` } })).to.equal('Placeholder');
        });

        it('returns Collection for collection model', () => {
            expect(getItemTypeLabel({ model: { path: COLLECTION_MODEL_PATH } })).to.equal('Collection');
        });

        it('returns Default for card model', () => {
            expect(getItemTypeLabel({ model: { path: CARD_MODEL_PATH } })).to.equal('Default');
        });
    });

    describe('getItemTitle', () => {
        it('returns dash for falsy item', () => {
            expect(getItemTitle(null)).to.equal('-');
        });

        it('truncates long card titles', () => {
            const long = 'a'.repeat(60);
            expect(getItemTitle({ model: { path: CARD_MODEL_PATH }, title: long }).length).to.be.lessThan(long.length);
            expect(getItemTitle({ model: { path: CARD_MODEL_PATH }, title: long })).to.include('...');
        });

        it('uses key for placeholder-like items', () => {
            expect(getItemTitle({ key: 'my-key' })).to.equal('my-key');
        });

        it('uses getFieldValue when present', () => {
            expect(
                getItemTitle({
                    getFieldValue: (f) => (f === 'key' ? 'from-field' : ''),
                }),
            ).to.equal('from-field');
        });
    });

    describe('getStudioFragmentDisplayPath', () => {
        const mockCardFragment = () => ({
            id: 'frag-123',
            model: { path: CARD_MODEL_PATH },
            title: 'CC Plans',
            getField: (name) =>
                ({
                    name: { values: ['card-name'] },
                    cardTitle: { values: ['Creative Cloud'] },
                    variant: { values: ['plans'] },
                })[name] || null,
            getTagTitle: () => null,
        });

        afterEach(() => {
            Store.promotions.itemPickerSurface.set(null);
        });

        it('returns the prefixed studio path (authorPath) for the active surface', () => {
            Store.search.set({ ...Store.search.get(), path: 'acom' });
            Store.page.set('content');
            const fragment = mockCardFragment();
            expect(getStudioFragmentDisplayPath(fragment)).to.equal(generateCodeToUse(fragment, 'acom', 'content').authorPath);
            expect(getStudioFragmentDisplayPath(fragment)).to.include('merch-card:');
        });

        it('returns an empty string when no web component maps to the model', () => {
            Store.search.set({ ...Store.search.get(), path: 'acom' });
            Store.page.set('content');
            const fragment = { id: 'x', model: { path: '/unknown/model' }, path: '/content/dam/mas/acom/en_US/x' };
            expect(getStudioFragmentDisplayPath(fragment)).to.equal('');
        });

        it('uses the surface from the fragment path when it differs from the active search surface', () => {
            Store.search.set({ ...Store.search.get(), path: 'sandbox' });
            Store.page.set('content');
            const fragment = { ...mockCardFragment(), path: '/content/dam/mas/nala/en_US/some-card' };
            const result = getStudioFragmentDisplayPath(fragment);
            expect(result).to.include('NALA');
            expect(result).not.to.include('SANDBOX');
        });

        it('uses itemPickerSurface instead of search path on promotions-editor page', () => {
            Store.search.set({ ...Store.search.get(), path: 'sandbox' });
            Store.page.set('promotions-editor');
            Store.promotions.itemPickerSurface.set('commerce');
            const fragment = mockCardFragment();
            const result = getStudioFragmentDisplayPath(fragment);
            expect(result).to.include('COMMERCE');
            expect(result).not.to.include('SANDBOX');
        });

        it('falls back to search path on promotions-editor when itemPickerSurface is null and fragment has no path', () => {
            Store.search.set({ ...Store.search.get(), path: 'sandbox' });
            Store.page.set('promotions-editor');
            Store.promotions.itemPickerSurface.set(null);
            const fragment = mockCardFragment();
            const result = getStudioFragmentDisplayPath(fragment);
            expect(result).to.include('SANDBOX');
        });

        it('uses the surface from fragment path in view-only mode (itemPickerSurface null)', () => {
            Store.search.set({ ...Store.search.get(), path: 'sandbox' });
            Store.page.set('promotions-editor');
            Store.promotions.itemPickerSurface.set(null);
            const fragment = {
                ...mockCardFragment(),
                path: '/content/dam/mas/express/en_US/some-card',
            };
            const result = getStudioFragmentDisplayPath(fragment);
            expect(result).to.include('EXPRESS');
            expect(result).not.to.include('SANDBOX');
        });
    });

    describe('shouldIgnoreRowClickForSelection', () => {
        const fakeEvent = (...nodes) => ({ composedPath: () => nodes });

        it('returns false when the path contains no interactive controls', () => {
            const cell = document.createElement('sp-table-cell');
            const row = document.createElement('sp-table-row');
            row.appendChild(cell);
            expect(shouldIgnoreRowClickForSelection(fakeEvent(cell, row))).to.be.false;
        });

        it('returns true when the path contains an sp-checkbox', () => {
            const checkbox = document.createElement('sp-checkbox');
            const cell = document.createElement('sp-table-cell');
            cell.appendChild(checkbox);
            expect(shouldIgnoreRowClickForSelection(fakeEvent(checkbox, cell))).to.be.true;
        });

        it('returns true when the path contains an element with the expand-button class', () => {
            const button = document.createElement('sp-button');
            button.classList.add('expand-button');
            const cell = document.createElement('sp-table-cell');
            cell.appendChild(button);
            expect(shouldIgnoreRowClickForSelection(fakeEvent(button, cell))).to.be.true;
        });

        it('returns true when the path contains an sp-action-button', () => {
            const button = document.createElement('sp-action-button');
            const cell = document.createElement('sp-table-cell');
            cell.appendChild(button);
            expect(shouldIgnoreRowClickForSelection(fakeEvent(button, cell))).to.be.true;
        });

        it('ignores non-Element nodes in the composed path', () => {
            const row = document.createElement('sp-table-row');
            expect(shouldIgnoreRowClickForSelection(fakeEvent(row, document, window))).to.be.false;
        });

        it('returns false when expand-button class is on an unrelated node not in the path', () => {
            const sibling = document.createElement('sp-button');
            sibling.classList.add('expand-button');
            const cell = document.createElement('sp-table-cell');
            expect(shouldIgnoreRowClickForSelection(fakeEvent(cell))).to.be.false;
        });
    });
});
