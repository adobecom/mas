import { expect } from '@esm-bundle/chai';
import { LitElement } from 'lit';
import {
    SearchableListMixin,
    computeSelectAllChecked,
    computeSelectAllIndeterminate,
    computeSelectionCountLabel,
} from '../../../src/common/utils/selectable-list.js';

class SearchableListTestHost extends SearchableListMixin(LitElement) {
    static properties = { searchQuery: { type: String, state: true } };

    constructor() {
        super();
        this.searchQuery = '';
    }
}
customElements.define('searchable-list-test-host', SearchableListTestHost);

describe('selectable-list', () => {
    describe('computeSelectAllChecked', () => {
        it('returns false when there are no selectable items', () => {
            expect(computeSelectAllChecked(0, 0)).to.be.false;
        });

        it('returns true when every selectable item is selected', () => {
            expect(computeSelectAllChecked(3, 3)).to.be.true;
        });

        it('returns false when only some items are selected', () => {
            expect(computeSelectAllChecked(3, 2)).to.be.false;
        });
    });

    describe('computeSelectAllIndeterminate', () => {
        it('returns false when nothing is selected', () => {
            expect(computeSelectAllIndeterminate(3, 0)).to.be.false;
        });

        it('returns true when some but not all items are selected', () => {
            expect(computeSelectAllIndeterminate(3, 1)).to.be.true;
        });

        it('returns false when every item is selected', () => {
            expect(computeSelectAllIndeterminate(3, 3)).to.be.false;
        });
    });

    describe('computeSelectionCountLabel', () => {
        it('shows the total with the plural noun when nothing is selected', () => {
            expect(computeSelectionCountLabel(0, 3, 'geo')).to.equal('3 geos');
        });

        it('singularizes the total noun when there is exactly one item', () => {
            expect(computeSelectionCountLabel(0, 1, 'geo')).to.equal('1 geo');
        });

        it('shows "N <noun> selected" when items are selected', () => {
            expect(computeSelectionCountLabel(2, 3, 'geo')).to.equal('2 geos selected');
        });

        it('singularizes the selected noun when exactly one is selected', () => {
            expect(computeSelectionCountLabel(1, 3, 'geo')).to.equal('1 geo selected');
        });

        it('derives the default plural by appending "s" when none is provided', () => {
            expect(computeSelectionCountLabel(0, 3, 'language')).to.equal('3 languages');
        });

        it('uses an explicit plural noun when the default "s" suffix would be wrong', () => {
            expect(computeSelectionCountLabel(2, 3, 'country', 'countries')).to.equal('2 countries selected');
        });
    });

    describe('SearchableListMixin', () => {
        let host;

        beforeEach(() => {
            host = new SearchableListTestHost();
        });

        it('sets searchQuery from a search input event', () => {
            host.handleSearch({ target: { value: 'fr' } });
            expect(host.searchQuery).to.equal('fr');
        });

        it('returns all items unfiltered when searchQuery is empty', () => {
            const items = ['a', 'b', 'c'];
            expect(host.filterBySearchQuery(items, (item) => item)).to.deep.equal(items);
        });

        it('filters items case-insensitively by the extracted searchable text', () => {
            host.searchQuery = 'FR';
            const items = ['mas:pzn/country/fr', 'mas:pzn/country/ae'];
            expect(host.filterBySearchQuery(items, (item) => item)).to.deep.equal(['mas:pzn/country/fr']);
        });

        it('applies getSearchableText per item rather than filtering the raw item', () => {
            host.searchQuery = 'en';
            const items = [{ locale: 'en_US' }, { locale: 'fr_FR' }];
            expect(host.filterBySearchQuery(items, (item) => item.locale)).to.deep.equal([{ locale: 'en_US' }]);
        });
    });
});
