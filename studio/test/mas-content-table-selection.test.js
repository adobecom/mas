import { expect } from '@open-wc/testing';
import {
    getParentFragmentIds,
    getParentRowSelection,
    mergeParentTableSelection,
    stripNestedVariationSelectControls,
} from '../src/mas-content-table-selection.js';

describe('mas-content-table-selection', () => {
    const makeStore = (id) => ({
        get: () => ({ id }),
    });

    it('getParentFragmentIds collects ids from loaded fragment stores', () => {
        const ids = getParentFragmentIds([makeStore('parent-1'), makeStore('parent-2')]);
        expect([...ids]).to.deep.equal(['parent-1', 'parent-2']);
    });

    it('getParentRowSelection filters variation ids out of Store.selection', () => {
        const selection = getParentRowSelection([makeStore('parent-1')], ['parent-1', 'variation-1']);
        expect(selection).to.deep.equal(['parent-1']);
    });

    it('mergeParentTableSelection preserves variation ids when parent rows change', () => {
        const merged = mergeParentTableSelection(
            new Set(['parent-2']),
            [makeStore('parent-1'), makeStore('parent-2')],
            ['parent-1', 'variation-1'],
        );
        expect(merged).to.deep.equal(['parent-2', 'variation-1']);
    });

    it('stripNestedVariationSelectControls no-ops when nested rows are already clean', () => {
        const root = document.createElement('div');
        expect(stripNestedVariationSelectControls(root)).to.be.false;
    });

    it('stripNestedVariationSelectControls removes injected nested checkbox cells', () => {
        const root = document.createElement('div');
        const nestedRow = document.createElement('sp-table-row');
        nestedRow.setAttribute('selected', '');
        nestedRow.selected = true;
        nestedRow.selectable = true;
        nestedRow.appendChild(document.createElement('sp-table-checkbox-cell'));

        const nestedTable = document.createElement('mas-fragment-table');
        nestedTable.classList.add('nested-fragment');
        nestedTable.appendChild(nestedRow);

        const variations = document.createElement('mas-fragment-variations');
        variations.appendChild(nestedTable);
        root.appendChild(variations);

        expect(stripNestedVariationSelectControls(root)).to.be.true;
        expect(nestedRow.querySelector('sp-table-checkbox-cell')).to.be.null;
        expect(nestedRow.hasAttribute('selected')).to.be.false;
        expect(nestedRow.selectable).to.be.false;
    });
});
