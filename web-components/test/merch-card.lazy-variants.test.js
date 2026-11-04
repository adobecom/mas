import { expect } from '@esm-bundle/chai';
import { css } from 'lit';

// Intentionally merch-card.js, not mas.js: mas.js registers the express
// variants eagerly, merch-card.js alone is the lazy path Milo loads.
import '../src/commerce.js';
import '../src/merch-card.js';
import {
    getFragmentMapping,
    getVariantLayout,
    loadVariant,
    registerLazyVariant,
} from '../src/variants/variants.js';
import {
    FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
    SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
} from '../src/variants/express-mappings.js';
import { EVENT_MAS_READY } from '../src/constants.js';
import { mockFetch } from './mocks/fetch.js';
import { withWcs } from './mocks/wcs.js';
import { withAem } from './mocks/aem.js';
import { oneEvent } from './utils.js';

const expressChunkRequests = () =>
    performance
        .getEntriesByType('resource')
        .filter(({ name }) => name.includes('/variants/express.js'));

class TestLayout {
    static variantStyle = css`
        :host {
            color: red;
        }
    `;

    constructor(card) {
        this.card = card;
    }
}

const fakeCard = (variant) => ({
    variant,
    shadowRoot: { adoptedStyleSheets: [] },
});

describe('lazy variant registry', () => {
    it('keeps the fragment mapping synchronously available before the layout loads', () => {
        expect(getFragmentMapping('full-pricing-express')).to.equal(
            FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
        );
        expect(getFragmentMapping('simplified-pricing-express')).to.equal(
            SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
        );
        expect(getFragmentMapping('simplified-pricing-express')).to.include({
            supportsDefaultChild: true,
        });
    });

    it('does not request the express chunk until an express card needs it', () => {
        expect(expressChunkRequests()).to.have.lengthOf(0);
    });

    it('has nothing to wait for with eager or unknown variants', () => {
        expect(loadVariant('catalog')).to.be.undefined;
        expect(loadVariant('not-a-variant')).to.be.undefined;
    });

    it('creates no layout until the lazy variant is loaded', async () => {
        let calls = 0;
        registerLazyVariant(
            'test-lazy',
            async () => {
                calls += 1;
                return TestLayout;
            },
            { title: { slot: 'heading-xs' } },
        );
        expect(getVariantLayout(fakeCard('test-lazy'))).to.be.undefined;

        const first = loadVariant('test-lazy');
        const second = loadVariant('test-lazy');
        expect(first).to.be.instanceOf(Promise);
        expect(second).to.equal(first);
        await first;

        expect(calls).to.equal(1);
        expect(loadVariant('test-lazy')).to.be.undefined;
        const card = fakeCard('test-lazy');
        expect(getVariantLayout(card)).to.be.instanceOf(TestLayout);
        expect(card.shadowRoot.adoptedStyleSheets).to.have.lengthOf(1);
    });

    it('retries after a failed load', async () => {
        let calls = 0;
        registerLazyVariant('test-lazy-flaky', async () => {
            calls += 1;
            if (calls === 1) throw new Error('chunk 404');
            return TestLayout;
        });

        let error;
        await loadVariant('test-lazy-flaky').catch((e) => (error = e));
        expect(error?.message).to.equal('chunk 404');
        expect(getVariantLayout(fakeCard('test-lazy-flaky'))).to.be.undefined;

        await loadVariant('test-lazy-flaky');
        expect(calls).to.equal(2);
        expect(getVariantLayout(fakeCard('test-lazy-flaky'))).to.be.instanceOf(
            TestLayout,
        );
    });
});

describe('merch-card with a lazily loaded variant', () => {
    const cards = [];

    before(async () => {
        await mockFetch(withWcs, withAem);
        const service = document.createElement('mas-commerce-service');
        service.setAttribute('env', 'stage');
        service.setAttribute('mas-io-url', 'mas.adobe.com');
        document.head.appendChild(service);
        await customElements.whenDefined('merch-card');
    });

    afterEach(() => {
        cards.splice(0).forEach((card) => card.remove());
    });

    function addCard(html, variant) {
        const card = document.createElement('merch-card');
        if (variant) card.setAttribute('variant', variant);
        card.innerHTML = html;
        document.body.appendChild(card);
        cards.push(card);
        return card;
    }

    it('holds the first render until the layout is loaded', async () => {
        const card = addCard(
            '<h3 slot="heading-xs">Title</h3><a slot="cta" href="#">Buy</a>',
            'simplified-pricing-express',
        );
        expect(card.variantLayout).to.be.undefined;

        await card.updateComplete;

        expect(card.variantLayout.headingSelector).to.equal(
            '[slot="heading-xs"]',
        );
        expect(card.variantLayout.aemFragmentMapping).to.equal(
            SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
        );
        expect(card.shadowRoot.querySelector('slot[name="heading-xs"]')).to
            .exist;
        expect(card.shadowRoot.adoptedStyleSheets).to.have.length.above(0);
        expect(expressChunkRequests()).to.have.lengthOf(1);
    });

    it('loads the layout when the variant is set after connecting', async () => {
        const card = addCard('<h3 slot="heading-xs">Title</h3>');
        await card.updateComplete;
        expect(card.variantLayout).to.be.undefined;

        card.variant = 'full-pricing-express';
        await card.updateComplete;

        expect(card.variantLayout).to.exist;
        expect(card.variantLayout.aemFragmentMapping).to.equal(
            FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
        );
        expect(card.shadowRoot.querySelector('slot[name="heading-xs"]')).to
            .exist;
    });

    it('hydrates from a fragment and reports ready with its price resolved', async () => {
        const card = addCard(
            '<aem-fragment fragment="fragment-full-pricing-express-lazy"></aem-fragment>',
        );
        const ready = oneEvent(card, EVENT_MAS_READY, 8000);

        await ready;

        expect(card.variant).to.equal('full-pricing-express');
        expect(card.variantLayout).to.exist;
        expect(card.querySelector('[slot="heading-xs"]')?.textContent).to.equal(
            'Lazy express card',
        );
        const price = card.querySelector('span[is="inline-price"]');
        expect(price).to.exist;
        expect(price.classList.contains('placeholder-resolved')).to.be.true;
        expect(card.shadowRoot.querySelector('slot[name="heading-xs"]')).to
            .exist;
    });

    it('keeps rendering nothing, without throwing, when the layout cannot load', async () => {
        registerLazyVariant('test-lazy-broken', async () => {
            throw new Error('chunk 404');
        });
        const card = addCard('<h3 slot="heading-xs">Title</h3>');

        card.variant = 'test-lazy-broken';
        await card.updateComplete;

        expect(card.variantLayout).to.be.undefined;
    });
});
