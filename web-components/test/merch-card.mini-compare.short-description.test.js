import { expect } from '@esm-bundle/chai';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';
import { EVENT_TYPE_RESOLVED } from '../src/constants.js';
import { mockFetch } from './mocks/fetch.js';
import { withWcs } from './mocks/wcs.js';

describe('mini-compare-chart short description rendered by the legal price (MWPW-214382)', () => {
    const SHORT_DESCRIPTION =
        'Fee applies of half your remaining annual commitment if you cancel after 14 days. <span class="icon-button" data-tooltip="Details"></span>';
    const WCS_PLAN_TYPE = 'Annual, billed monthly';
    let originalFetch;
    let card;
    let snapshots;
    let observer;

    before(async () => {
        originalFetch = window.fetch;
        document.querySelector('mas-commerce-service')?.remove();
        await mockFetch(withWcs);
        // en_GB so the legal line carries a tax label to separate.
        const service = document.createElement('mas-commerce-service');
        service.setAttribute('locale', 'en_GB');
        document.head.appendChild(service);
        await customElements.whenDefined('merch-card');
    });

    after(() => {
        window.fetch = originalFetch;
        document.querySelector('mas-commerce-service')?.remove();
        document.head.appendChild(
            document.createElement('mas-commerce-service'),
        );
    });

    afterEach(() => {
        observer?.disconnect();
        card?.remove();
    });

    const bodyXxs = () => card.querySelector('[slot="body-xxs"]');

    // Records the legal price's plan-type line and the visibility of the
    // authored Short Description at every write to the legal price, so a
    // later patch (or a frame where both or neither are visible) is caught.
    async function renderCard({
        shortDescription = SHORT_DESCRIPTION,
        price = true,
        displayPlanType = false,
    } = {}) {
        card = document.createElement('merch-card');
        card.settings = { displayPlanType };
        card.setAttribute('variant', 'mini-compare-chart');
        const priceHTML = price
            ? '<span is="inline-price" data-template="price" data-wcs-osi="abm-mult" data-display-tax="true"></span>'
            : '';
        const sd = shortDescription
            ? `<div slot="body-xxs"><p>${shortDescription}</p></div>`
            : '';
        card.innerHTML = `<h5 slot="heading-m-price">${priceHTML}</h5>${sd}<merch-whats-included slot="whats-included"></merch-whats-included>`;
        snapshots = [];
        observer = new MutationObserver((records) => {
            const legal = card.querySelector('[data-template="legal"]');
            if (!legal || !records.some(({ target }) => target === legal))
                return;
            snapshots.push({
                planType: legal.querySelector('.price-plan-type')?.innerHTML,
                bodyDisplay: bodyXxs()
                    ? getComputedStyle(bodyXxs()).display
                    : null,
            });
        });
        observer.observe(card, { childList: true, subtree: true });
        document.body.appendChild(card);
        return price ? settledLegal() : settledFallback();
    }

    async function waitFor(find) {
        let found;
        for (let i = 0; i < 100 && !found; i++) {
            await new Promise((resolve) => setTimeout(resolve, 20));
            found = find();
        }
        return found;
    }

    async function settledLegal() {
        const legal = await waitFor(() =>
            card.querySelector(
                '[slot="heading-m-price"] [data-template="legal"]',
            ),
        );
        await legal.onceSettled();
        return legal;
    }

    async function settledFallback() {
        await card.checkReady();
        return waitFor(() =>
            card.querySelector('[slot="heading-m-price"] [data-fallback]'),
        );
    }

    const expectRenderedByLegal = (legal) => {
        const planType = legal.querySelector('.price-plan-type');
        expect(legal.querySelectorAll('.price-plan-type').length).to.equal(1);
        expect(planType.querySelectorAll('em').length).to.equal(1);
        expect(planType.querySelector('em').textContent).to.include(
            'Fee applies',
        );
        expect(planType.querySelector('.icon-button').dataset.tooltip).to.equal(
            'Details',
        );
        expect(legal.textContent.match(/Fee applies/g)).to.have.length(1);
        expect(planType.classList.contains('disabled')).to.be.false;
    };

    // The authored markup stays in place (hidden) and the legal line is the
    // only visible copy.
    const expectOneVisibleCopy = () => {
        expect(bodyXxs().textContent).to.include('Fee applies');
        expect(getComputedStyle(bodyXxs()).display).to.equal('none');
    };

    // While the legal price is pending it is empty and the authored copy is
    // still the visible one; the moment it renders, the line carries the
    // short description and the authored copy is hidden in the same frame.
    const expectEveryRenderCarriesIt = () => {
        const rendered = snapshots.filter(({ planType }) => planType);
        expect(rendered.length).to.be.greaterThan(0);
        for (const { planType, bodyDisplay } of rendered) {
            expect(planType).to.include('Fee applies');
            expect(bodyDisplay).to.equal('none');
        }
        for (const { planType, bodyDisplay } of snapshots) {
            if (!planType) expect(bodyDisplay).to.not.equal('none');
        }
    };

    it('renders the short description in the first legal render, never patched in later', async () => {
        const legal = await renderCard();
        expectRenderedByLegal(legal);
        expectEveryRenderCarriesIt();
        expectOneVisibleCopy();
    });

    it('keeps it through a forced re-render of the legal price', async () => {
        const legal = await renderCard();
        legal.requestUpdate(true);
        await legal.onceSettled();
        expectRenderedByLegal(legal);
        expectOneVisibleCopy();
        expectEveryRenderCarriesIt();
    });

    it('keeps it when the rendered card is moved in the DOM', async () => {
        // Milo's tabs and merch-card-collection re-attach rendered cards,
        // which re-renders every price in them.
        const legal = await renderCard();
        const host = document.createElement('div');
        document.body.append(host);
        const reRendered = new Promise((resolve) =>
            legal.addEventListener(EVENT_TYPE_RESOLVED, resolve, {
                once: true,
            }),
        );
        host.append(card);
        await reRendered;
        expectRenderedByLegal(legal);
        expectOneVisibleCopy();
        host.remove();
    });

    it('puts the short description after the derived plan type, which keeps its dot', async () => {
        const legal = await renderCard({ displayPlanType: true });
        const planType = legal.querySelector('.price-plan-type');
        expect(planType.textContent.startsWith(WCS_PLAN_TYPE)).to.be.true;
        expect(planType.querySelector('em').textContent).to.include(
            'Fee applies',
        );
        expect(
            legal.querySelector('.price-tax-inclusivity:not(.disabled)')
                .textContent,
        ).to.match(/\. $/);
        expectRenderedByLegal(legal);
        expectOneVisibleCopy();
    });

    it('adds no dot when the plan type is not displayed', async () => {
        const legal = await renderCard({ displayPlanType: false });
        expect(
            legal.querySelector('.price-plan-type').textContent,
        ).to.not.include(WCS_PLAN_TYPE);
        expect(
            legal.querySelector('.price-tax-inclusivity:not(.disabled)')
                .textContent,
        ).to.not.match(/\. $/);
    });

    it('leaves a card without a short description unchanged', async () => {
        const legal = await renderCard({
            shortDescription: '',
            displayPlanType: true,
        });
        const planType = legal.querySelector('.price-plan-type');
        expect(planType.textContent).to.equal(WCS_PLAN_TYPE);
        expect(planType.querySelector('em')).to.be.null;
        expect(card.querySelector('[data-fallback]')).to.be.null;
    });

    it('renders it in a stand-in when there is no price, hiding the authored copy', async () => {
        const fallback = await renderCard({ price: false });
        const planType = fallback.querySelector('.price-plan-type');
        expect(planType.querySelector('em').textContent).to.include(
            'Fee applies',
        );
        expect(planType.querySelector('.icon-button').dataset.tooltip).to.equal(
            'Details',
        );
        expect(
            card.querySelectorAll('[slot="heading-m-price"] [data-fallback]')
                .length,
        ).to.equal(1);
        expectOneVisibleCopy();
    });
});
