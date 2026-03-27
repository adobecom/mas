import { expect, fixture, html } from '@open-wc/testing';
import Store from '../src/store.js';
import '../src/mas-fragment-variations.js';

describe('MasFragmentVariations', () => {
    const pathForLocale = (localeCode) => `/content/dam/mas/nala/${localeCode}/some-fragment`;

    let previousFilters;
    let previousSearch;

    beforeEach(() => {
        previousFilters = { ...Store.filters.get() };
        previousSearch = { ...Store.search.get() };
    });

    afterEach(() => {
        Store.filters.set(previousFilters);
        Store.search.set(previousSearch);
    });

    const createFragmentMock = (localeVariations, groupedVariations) => ({
        listLocaleVariations: () => localeVariations,
        listGroupedVariations: () => groupedVariations,
    });

    describe('localeVariations and groupedVariations', () => {
        it('includes only variations whose path locale matches the selected language', async () => {
            Store.filters.set({ locale: 'en_US' });
            Store.search.set({ ...previousSearch, region: null });

            const fragment = createFragmentMock(
                [
                    { id: 'loc-en', path: pathForLocale('en_US') },
                    { id: 'loc-fr', path: pathForLocale('fr_FR') },
                ],
                [
                    { id: 'grp-en', path: pathForLocale('en_US') },
                    { id: 'grp-fr', path: pathForLocale('fr_FR') },
                ],
            );

            const element = await fixture(html`<mas-fragment-variations .fragment=${fragment}></mas-fragment-variations>`);

            expect(element.localeVariations.map((variation) => variation.id)).to.deep.equal(['loc-en']);
            expect(element.groupedVariations.map((variation) => variation.id)).to.deep.equal(['grp-en']);
        });

        it('uses fr_FR when locale filter is fr_FR', async () => {
            Store.filters.set({ locale: 'fr_FR' });
            Store.search.set({ ...previousSearch, region: null });

            const fragment = createFragmentMock(
                [
                    { id: 'loc-en', path: pathForLocale('en_US') },
                    { id: 'loc-fr', path: pathForLocale('fr_FR') },
                ],
                [{ id: 'grp-fr', path: pathForLocale('fr_FR') }],
            );

            const element = await fixture(html`<mas-fragment-variations .fragment=${fragment}></mas-fragment-variations>`);

            expect(element.localeVariations.map((variation) => variation.id)).to.deep.equal(['loc-fr']);
            expect(element.groupedVariations.map((variation) => variation.id)).to.deep.equal(['grp-fr']);
        });

        it('prefers search region over filters locale for matching', async () => {
            Store.filters.set({ locale: 'fr_FR' });
            Store.search.set({ ...previousSearch, region: 'en_US' });

            const fragment = createFragmentMock([{ id: 'loc-en', path: pathForLocale('en_US') }], []);

            const element = await fixture(html`<mas-fragment-variations .fragment=${fragment}></mas-fragment-variations>`);

            expect(element.localeVariations.map((variation) => variation.id)).to.deep.equal(['loc-en']);
        });

        it('returns empty lists when no variation path matches current locale', async () => {
            Store.filters.set({ locale: 'de_DE' });
            Store.search.set({ ...previousSearch, region: null });

            const fragment = createFragmentMock(
                [{ id: 'loc-en', path: pathForLocale('en_US') }],
                [{ id: 'grp-fr', path: pathForLocale('fr_FR') }],
            );

            const element = await fixture(html`<mas-fragment-variations .fragment=${fragment}></mas-fragment-variations>`);

            expect(element.localeVariations).to.deep.equal([]);
            expect(element.groupedVariations).to.deep.equal([]);
        });
    });
});
