import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import { mockLana } from './mocks/lana.js';
import { mockFetch } from './mocks/fetch.js';

import { pushState } from '../src/deeplink.js';

import {
    appendMiloStyles,
    delay,
    toggleDesktop,
    toggleLargeDesktop,
    toggleMobile,
} from './utils.js';

import '../src/sidenav/merch-sidenav.js';
import '../src/merch-card-collection.js';

import { withWcs } from './mocks/wcs.js';
import { withAem } from './mocks/aem.js';
import '../src/mas.js';

const searchParams = new URLSearchParams(document.location.search);

const prepareTemplate = (
    id,
    updateSearch = true,
    content = document.getElementById('content'),
) => {
    content.innerHTML = '';
    const template = document.getElementById(id);
    const templateContent = template.content.cloneNode(true);
    const merchCards = templateContent.querySelector('merch-card-collection');
    const header = templateContent.querySelector(
        'merch-card-collection-header',
    );
    return [
        merchCards,
        () => {
            content.appendChild(templateContent);
            if (updateSearch && id !== searchParams.get('template')) {
                searchParams.set('template', id);
                document.location.search = searchParams.toString();
            }
        },
        header,
    ];
};

window['prepareTemplate'] = prepareTemplate;

const sidenav = document.getElementById('sidenav');
if (sidenav) {
    const templates = [...document.getElementsByTagName('template')].map(
        ({ id, title }) =>
            `<button onclick="(prepareTemplate('${id}')[1])()">${title}</button>`,
    );
    sidenav.appendChild(
        document.createRange().createContextualFragment(templates.join('\n')),
    );
    const currentTemplate = searchParams.get('template');
    if (currentTemplate) {
        const [, render] = prepareTemplate(currentTemplate);
        render();
    }
}
const visibleCards = (index) => {
    const cards = Array.from(document.querySelectorAll('merch-card'))
        .filter((card) => card.style.display !== 'none')
        .sort((a, b) => Number(a.style.order) - Number(b.style.order));
    if (isNaN(index)) {
        return cards;
    } else {
        return cards[index];
    }
};

let merchCards, header;
const shouldSkipTests = sessionStorage.getItem('skipTests') ? 'true' : 'false';
runTests(async () => {
    let render;
    appendMiloStyles();
    mockLana();
    await mockFetch(withWcs, withAem);

    if (shouldSkipTests === 'true') return;

    describe('merch-card-collection-header web component', () => {
        const renderWithSidenav = async () => {
            render();
            await delay(100);
            const sidenav = document.querySelector('merch-sidenav');
            merchCards.sidenav = sidenav;
            header.collection = merchCards;
            header.requestUpdate();
            await header.updateComplete;
        };

        before(async () => {
            await toggleMobile();
        });

        beforeEach(() => {
            [merchCards, render, header] = prepareTemplate(
                'catalogCollectionWithHeader',
                false,
            );
        });

        afterEach(() => {
            document.querySelector('merch-sidenav').removeAttribute('modal');
            document.body.classList.remove('merch-modal');
        });

        it('sets the class for modal when opening filters in a modal', async () => {
            await renderWithSidenav();
            expect(document.body.classList.contains('merch-modal')).to.be.false;
            header.shadowRoot.querySelector('#filter').click();
            await delay(100);
            expect(document.body.classList.contains('merch-modal')).to.be.true;
        });

        it('removes the class for modal when closing the filters modal by clicking the "Close" button', async () => {
            await renderWithSidenav();
            header.shadowRoot.querySelector('#filter').click();
            await delay(100);
            document
                .querySelector('merch-sidenav')
                .shadowRoot.querySelector('#sidenav')
                .querySelector('sp-link')
                .click();
            expect(document.body.classList.contains('merch-modal')).to.be.false;
        });

        it('removes the class for modal when closing the filters modal by clicking outside the modal', async () => {
            await renderWithSidenav();
            header.shadowRoot.querySelector('#filter').click();
            await delay(100);
            document
                .querySelector('merch-sidenav')
                .shadowRoot.querySelector('sp-overlay')
                .dispatchEvent(new CustomEvent('close'));
            await delay(100);
            expect(document.body.classList.contains('merch-modal')).to.be.false;
        });

        it('should refine result on search with multiple words', async () => {
            await renderWithSidenav();
            document.location.hash = '';
            pushState({ search: 'Connect' });
            await delay(100);
            expect(header.resultSlotName).to.equal('searchResultMobileText');
        });

        it('should refine result on search', async () => {
            await renderWithSidenav();
            document.location.hash = '';
            pushState({ search: 'acrobat' });
            await delay(100);
            expect(visibleCards().length).to.equal(2);
            expect(header.resultSlotName).to.equal('searchResultsMobileText');
            pushState({ search: 'stager' });
            await delay(100);
            expect(visibleCards().length).to.equal(1);
            expect(header.resultSlotName).to.equal('searchResultMobileText');
            pushState({ search: 'cafebabe' });
            await delay(100);
            expect(visibleCards().length).to.equal(0);
            expect(header.resultSlotName).to.equal('noSearchResultsMobileText');
        });

        it('should have touch-friendly search input on mobile', async () => {
            await renderWithSidenav();
            const searchInput =
                header.shadowRoot.querySelector('#search sp-search');
            expect(searchInput).to.exist;
            const styles = window.getComputedStyle(searchInput);
            const minHeight = parseInt(styles.minHeight);
            expect(minHeight).to.be.at.least(44); // Minimum touch target size
        });

        it('should have proper mobile grid layout with search, filter, and sort', async () => {
            await renderWithSidenav();
            const headerElement = header.shadowRoot.querySelector('#header');
            expect(headerElement).to.exist;
            const styles = window.getComputedStyle(headerElement);
            expect(styles.display).to.equal('grid');
            // Verify search is visible on mobile
            const searchElement = header.shadowRoot.querySelector('#search');
            const filterElement = header.shadowRoot.querySelector('#filter');
            const sortElement = header.shadowRoot.querySelector('#sort');
            expect(searchElement).to.exist;
            expect(filterElement).to.exist;
            expect(sortElement).to.exist;
        });

        it('should have accessible aria-label on search input', async () => {
            await renderWithSidenav();
            const searchInput =
                header.shadowRoot.querySelector('#search sp-search');
            expect(searchInput).to.exist;
            expect(searchInput.hasAttribute('aria-label')).to.be.true;
            const ariaLabel = searchInput.getAttribute('aria-label');
            expect(ariaLabel).to.be.a('string');
            expect(ariaLabel.length).to.be.greaterThan(0);
        });
    });

    describe('merch-card-collection web component on desktop', () => {
        before(async () => {
            await toggleLargeDesktop();
        });

        beforeEach(async () => {
            document.location.hash = '';
            [merchCards, render] = prepareTemplate('catalogCards', false);
        });

        it('renders merch-card-collection element', async () => {
            document.location.hash = '';
            render();
            await delay(100);
            expect(visibleCards().length).to.equal(93);
        });

        it('observes/applies deep link parameters', async () => {
            document.location.hash = 'filter=photo';
            render();
            await delay(100);
            expect(visibleCards().length).to.equal(5);
            expect(visibleCards(0).size).to.equal('super-wide');
            document.location.hash = 'filter=photo&types=web';
            await delay(100);
            expect(visibleCards().length).to.equal(4);
            document.location.hash = 'filter=photo&types=web,desktop';
            await delay(100);
            expect(visibleCards().length).to.equal(5);
        });

        it('should make single_app card the second card', async () => {
            document.location.hash = 'single_app=illustrator';
            render();
            await delay(100);
            expect(visibleCards(1).name).to.equal('illustrator');
        });

        it('should display a Show More button', async () => {
            merchCards.setAttribute('limit', 16);
            merchCards.setAttribute('page', 1);
            render();
            await delay(100);
            expect(visibleCards().length).to.equal(16);
            const showMoreButton =
                merchCards.shadowRoot.querySelector('#footer sp-button');
            expect(showMoreButton.isConnected).to.be.true;
            showMoreButton.click();
            await delay(100);
            showMoreButton.click();
            await delay(100);
            expect(visibleCards().length).to.equal(48);
            pushState({ page: 6 });
            await delay(100);
            expect(showMoreButton.isConnected).to.be.false;
        });
    });

    describe('merch-card-collection autoblock features', () => {
        let collectionElement;

        beforeEach(async () => {
            document.location.hash = '';
            [collectionElement, render] = prepareTemplate(
                'collectionAutoblock',
                false,
            );
        });

        it('should hydrate from child aem-fragment', async () => {
            render();
            await collectionElement.checkReady();
            const merchCard = collectionElement.querySelector('merch-card');
            expect(merchCard).to.exist;
        });

        it('sets variation-id on the host when the collection fragment payload includes variationId', async () => {
            render();
            await collectionElement.checkReady();
            expect(collectionElement.getAttribute('variation-id')).to.equal(
                'test-collection-variation-id',
            );
        });

        it('should populate filters in hydration', async () => {
            render();
            await collectionElement.checkReady();
            const merchCard = collectionElement.querySelector(
                'merch-card[id="ca835d11-fe6b-40f8-96d1-50ac800c9f70"]',
            );
            expect(merchCard.getAttribute('filters')).to.equal(
                'all:4:wide,cloud:2:wide,subcategory:1:wide',
            );
        });

        it('should display show more CTA and load more cards upon click', async () => {
            render();
            await collectionElement.checkReady();
            await delay(100);
            expect(visibleCards().length).to.equal(27);
            const showMoreButton =
                collectionElement.shadowRoot.querySelector('#footer sp-button');
            expect(showMoreButton.isConnected).to.be.true;
            showMoreButton.click();
            await delay(100);
            showMoreButton.click();
            await delay(100);
            expect(visibleCards().length).to.equal(28);
            expect(showMoreButton.isConnected).to.be.false;
        });
    });
    describe('merch-card-collection plans features', () => {
        it('handles wide card minification on small desktop', async () => {
            await toggleDesktop();
            [merchCards, render] = prepareTemplate('plansWideReflow', false);
            render();
            await merchCards.checkReady();
            const sidenav = document.querySelector('merch-sidenav');
            merchCards.attachSidenav(sidenav, false);
            await delay(100);
            const secondCard = merchCards.querySelector(
                'merch-card:nth-child(2)',
            );
            expect(secondCard.getAttribute('data-size')).to.equal('wide');
        });
    });

    describe('merch-card-collection override feature', () => {
        let collectionElement;

        beforeEach(async () => {
            document.location.hash = '';
        });

        it('should hydrate from child aem-fragment, with overriden ids', async () => {
            [collectionElement, render] = prepareTemplate('override', false);
            render();

            const aemFragment = customElements.get('aem-fragment');
            await collectionElement.checkReady();
            const fragment1 = collectionElement.querySelector(
                'aem-fragment[fragment="cafe-bebebe"]',
            );
            expect(fragment1).to.exist;
            const filters1 = fragment1.parentNode.filters;
            expect(filters1).to.exist;
            expect(filters1.all?.order).to.equal(1);
            const fragment2 = collectionElement.querySelector(
                'aem-fragment[fragment="bebe-cafe"]',
            );
            const filters2 = fragment2.parentNode.filters;
            expect(filters2).to.exist;
            expect(filters2.all?.order).to.equal(3);
            expect(filters2.cloud?.order).to.equal(1);
            expect(
                collectionElement.querySelector(
                    'merch-card > aem-fragment[fragment="e58f8f75-b882-409a-9ff8-8826b36a8368"]',
                ),
            ).to.not.exist;
            expect(
                collectionElement.querySelector(
                    'merch-card > aem-fragment[fragment="e58f8f75-b882-409a-9ff8-8826b36a8368"]',
                ),
            ).to.not.exist;
            aemFragment.cache.clear();
        });

        it('should hydrate from child aem-fragment, with overriden child collection', async () => {
            const fragment = document.createElement('aem-fragment');
            fragment.setAttribute('fragment', 'cafe-babe');
            document.body.appendChild(fragment);
            await delay(100);
            [collectionElement, render] = prepareTemplate(
                'override-child',
                false,
            );
            render();
            const aemFragment = customElements.get('aem-fragment');
            await collectionElement.checkReady();
            expect(
                collectionElement.querySelector(
                    'merch-card[id="bebecafebabe"]',
                ),
            ).to.exist;
            aemFragment.cache.clear();
        });

        it('should show cards in "all" filter when category override fails to load', async () => {
            // Override targets a nonexistent fragment — no aem-fragment pre-loaded in DOM
            [collectionElement, render] = prepareTemplate(
                'override-failing-category',
                false,
            );
            render();
            const aemFragment = customElements.get('aem-fragment');
            await collectionElement.checkReady();
            // Photo category cards (049231fd, c6727147) should appear with "all" filter
            // instead of being stuck in an empty or category-named filter
            const card1 = collectionElement.querySelector(
                'merch-card[id="049231fd-0c45-4ef5-8792-7fa2dcd5005a"]',
            );
            const card2 = collectionElement.querySelector(
                'merch-card[id="c6727147-7992-4ca4-b566-819c52b0a585"]',
            );
            expect(card1).to.exist;
            expect(card2).to.exist;
            expect(card1.filters.all).to.exist;
            expect(card2.filters.all).to.exist;
            aemFragment.cache.clear();
        });

        it('should skip cards whose reference is missing and hydrate the rest', async () => {
            [collectionElement, render] = prepareTemplate(
                'collection-missing-ref',
                false,
            );
            render();
            const aemFragment = customElements.get('aem-fragment');
            await collectionElement.checkReady();
            // card-a (in references) should render
            expect(collectionElement.querySelector('merch-card[id="card-a"]'))
                .to.exist;
            // card-b-missing (not in references) should be silently skipped
            expect(
                collectionElement.querySelector(
                    'merch-card[id="card-b-missing"]',
                ),
            ).to.not.exist;
            aemFragment.cache.clear();
        });
    });

    describe('merch-card checkReady with failing aem-fragment', () => {
        // Regression test for: checkReady() hangs forever when aem:error fires.
        // Root cause: #hydrationPromise (created at class init) is never resolved by #fail(),
        // so `await this.#hydrationPromise` inside checkReady() deadlocks.
        // Fix: resolve #hydrationPromise inside #fail(), and check this.failed after the await.
        it('should resolve checkReady within 50ms when the aem-fragment returns a 404', async () => {
            // "notfound" is handled by the withAem mock → returns 404 → fires aem:error
            const card = document.createElement('merch-card');
            const frag = document.createElement('aem-fragment');
            frag.setAttribute('fragment', 'notfound');
            card.appendChild(frag);
            document.getElementById('content').appendChild(card);

            // Wait for the aem:error event to fire (fragment fetch + error dispatch)
            await delay(20);

            const result = await Promise.race([
                card.checkReady().then(() => 'resolved'),
                new Promise((resolve) =>
                    setTimeout(() => resolve('timeout'), 50),
                ),
            ]);

            card.remove();
            // Fails with current code: checkReady() hangs on the unresolved #hydrationPromise
            expect(result).to.equal('resolved');
        });

        it('should set failed=true and hide the card when the aem-fragment returns a 404', async () => {
            const card = document.createElement('merch-card');
            const frag = document.createElement('aem-fragment');
            frag.setAttribute('fragment', 'notfound');
            card.appendChild(frag);
            document.getElementById('content').appendChild(card);

            await delay(20);

            expect(card.failed).to.be.true;
            expect(card.style.display).to.equal('none');

            card.remove();
        });
    });

    describe('merch-card-collection failed card handling', () => {
        it('excludes failed cards from resultCount and keeps them hidden after update', async () => {
            const collection = document.createElement('merch-card-collection');
            collection.setAttribute('filter', 'all');

            const makeCard = (order) => {
                const card = document.createElement('merch-card');
                card.filters = { all: { order } };
                return card;
            };

            const card1 = makeCard(1);
            const card2 = makeCard(2);
            const card3 = makeCard(3);
            // Simulate a card that failed to load (as set by merch-card #fail())
            card3.failed = true;
            card3.style.display = 'none';

            collection.append(card1, card2, card3);
            document.getElementById('content').appendChild(collection);
            await collection.updateComplete;
            await delay(20);

            expect(collection.resultCount).to.equal(2);
            // Failed card must stay hidden — collection update must not un-hide it
            expect(card3.style.display).to.equal('none');

            collection.remove();
        });
    });
});

document.getElementById('showMore').addEventListener('click', () => {
    document.location.hash = '';
    const [merchCards, render] = prepareTemplate('catalogCards');
    merchCards.setAttribute('limit', 16);
    merchCards.setAttribute('page', 1);
    render();
});
