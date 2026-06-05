import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';
import { EVENT_MERCH_QUANTITY_SELECTOR_CHANGE } from '../src/constants.js';

let BizPro;

before(async () => {
    // merch-card's connectedCallback needs a commerce service in the DOM,
    // mirroring the setup in hydrate.test.js.
    if (!document.querySelector('mas-commerce-service')) {
        document.head.appendChild(
            document.createElement('mas-commerce-service'),
        );
    }
    await customElements.whenDefined('merch-card');
    ({ BizPro } = await import('../src/variants/bizpro.js'));
});

async function renderCard(innerHTML) {
    const card = document.createElement('merch-card');
    card.setAttribute('variant', 'bizpro');
    card.innerHTML = innerHTML;
    document.body.appendChild(card);
    await card.updateComplete;
    // firstUpdated swaps in a fresh variantLayout after the first render;
    // re-render so the shadow DOM event listeners bind to card.variantLayout
    // (real cards re-render on hydration anyway).
    card.requestUpdate();
    await card.updateComplete;
    return card;
}

describe('bizpro add-on slot', () => {
    let card;
    afterEach(() => card?.remove());

    it('detects an add-on at slot="addon" and projects it', async () => {
        card = await renderCard(
            '<merch-addon slot="addon"><p>Add AI</p></merch-addon>',
        );
        expect(card.variantLayout.hasAddOn).to.be.true;
        expect(card.shadowRoot.querySelector('slot[name="addon"]')).to.exist;
        expect(card.shadowRoot.querySelector('slot[name="add-on"]')).to.not
            .exist;
    });
});

describe('BizPro.adjustAddon', () => {
    function makeLayout(cardOverrides = {}) {
        const layout = Object.create(BizPro.prototype);
        layout.card = {
            updateComplete: Promise.resolve(),
            querySelector: () => null,
            addon: null,
            ...cardOverrides,
        };
        return layout;
    }

    it('does nothing when there is no add-on', async () => {
        const layout = makeLayout({ addon: null });
        await layout.adjustAddon(); // must not throw
    });

    it('sets custom-checkbox and planType from the settled main price', async () => {
        const addon = { setAttribute: sinon.spy() };
        const price = {
            onceSettled: () => Promise.resolve(),
            value: [{ planType: 'PUF' }],
        };
        const layout = makeLayout({
            addon,
            querySelector: (sel) => (sel.includes('heading-m') ? price : null),
        });
        await layout.adjustAddon();
        expect(addon.setAttribute.calledWith('custom-checkbox', '')).to.be.true;
        expect(addon.planType).to.equal('PUF');
    });

    it('sets custom-checkbox but skips planType when no price', async () => {
        const addon = { setAttribute: sinon.spy() };
        const layout = makeLayout({ addon, querySelector: () => null });
        await layout.adjustAddon();
        expect(addon.setAttribute.calledWith('custom-checkbox', '')).to.be.true;
        expect(addon.planType).to.be.undefined;
    });
});

describe('bizpro license-zone gating', () => {
    let card;
    afterEach(() => card?.remove());

    it('does not render the license-zone for an unconfigured quantity-select with no callout', async () => {
        // "Show quantity selector" off authors the empty sentinel
        // <merch-quantity-select/>, which hydrate still wraps in a slot div.
        card = await renderCard(
            '<div slot="quantity-select"><merch-quantity-select></merch-quantity-select></div>',
        );
        expect(card.variantLayout.hasQuantitySelect).to.be.false;
        expect(card.shadowRoot.querySelector('.license-zone')).to.not.exist;
    });

    it('renders the license-zone for a configured quantity-select', async () => {
        card = await renderCard(
            '<div slot="quantity-select"><merch-quantity-select title="License" min="1" max="10" step="1"></merch-quantity-select></div>',
        );
        expect(card.variantLayout.hasQuantitySelect).to.be.true;
        expect(card.shadowRoot.querySelector('.license-zone')).to.exist;
    });

    it('renders the license-zone for a callout even without a quantity-select', async () => {
        card = await renderCard('<div slot="callout-content">Save 20%</div>');
        expect(card.shadowRoot.querySelector('.license-zone')).to.exist;
    });
});

describe('bizpro whats-included toggle label', () => {
    let card;
    afterEach(() => card?.remove());

    const SECTION =
        '<div class="section"><h4>PDF tools</h4><ul><li>row</li></ul></div>';

    it('falls back to the English label when no label is authored', async () => {
        card = await renderCard(`<div slot="whats-included">${SECTION}</div>`);
        const label = card.shadowRoot.querySelector(
            '.whats-included-toggle-label',
        );
        expect(label.textContent.trim()).to.equal("See what's included:");
    });

    it('uses the authored whats-included label in the toggle', async () => {
        card = await renderCard(
            `<div slot="whats-included"><p class="whats-included-label">Voir le contenu :</p>${SECTION}</div>`,
        );
        const label = card.shadowRoot.querySelector(
            '.whats-included-toggle-label',
        );
        expect(label.textContent.trim()).to.equal('Voir le contenu :');
    });

    it('hides the authored label element inside the features zone', async () => {
        card = await renderCard(
            `<div slot="whats-included"><p class="whats-included-label">Voir le contenu :</p>${SECTION}</div>`,
        );
        const authored = card.querySelector('.whats-included-label');
        expect(getComputedStyle(authored).display).to.equal('none');
    });
});

describe('bizpro legal text', () => {
    let card;
    afterEach(() => card?.remove());

    it('renders the legal-text wrapper only when legal text is slotted', async () => {
        card = await renderCard('<div slot="legal-text">Legal terms</div>');
        expect(card.shadowRoot.querySelector('.legal-text')).to.exist;
    });
});

describe('bizpro whats-included toggle interaction', () => {
    let card;
    afterEach(() => card?.remove());

    const SECTION =
        '<div class="section"><h4>PDF tools</h4><ul><li>row</li></ul></div>';

    it('expands and collapses the features zone on toggle click', async () => {
        card = await renderCard(`<div slot="whats-included">${SECTION}</div>`);
        const toggle = card.shadowRoot.querySelector('.whats-included-toggle');
        const zone = card.shadowRoot.querySelector('#features-zone');
        expect(zone.hasAttribute('hidden')).to.be.true;

        toggle.click();
        await card.updateComplete;
        expect(zone.hasAttribute('hidden')).to.be.false;
        expect(toggle.getAttribute('aria-expanded')).to.equal('true');

        toggle.click();
        await card.updateComplete;
        expect(zone.hasAttribute('hidden')).to.be.true;
        expect(toggle.getAttribute('aria-expanded')).to.equal('false');
    });
});

describe('bizpro license dropdown interaction', () => {
    let card;
    afterEach(() => card?.remove());

    const QS =
        '<div slot="quantity-select"><merch-quantity-select title="License" min="1" max="10" step="1" default-value="2"></merch-quantity-select></div>';

    async function openPopover() {
        const trigger = card.shadowRoot.querySelector(
            '.license-select-trigger',
        );
        trigger.click();
        await card.updateComplete;
        return trigger;
    }

    it('opens and closes the popover from the trigger', async () => {
        card = await renderCard(QS);
        const popover = () => card.shadowRoot.querySelector('#license-popover');

        const trigger = await openPopover();
        expect(popover().hasAttribute('hidden')).to.be.false;
        expect(trigger.getAttribute('aria-expanded')).to.equal('true');

        trigger.click();
        await card.updateComplete;
        expect(popover().hasAttribute('hidden')).to.be.true;
        expect(trigger.getAttribute('aria-expanded')).to.equal('false');
    });

    it('closes the popover on an outside mousedown', async () => {
        card = await renderCard(QS);
        await openPopover();

        document.body.dispatchEvent(
            new MouseEvent('mousedown', { bubbles: true }),
        );
        await card.updateComplete;
        expect(
            card.shadowRoot
                .querySelector('#license-popover')
                .hasAttribute('hidden'),
        ).to.be.true;
    });

    it('routes an option click through the authored quantity selector', async () => {
        card = await renderCard(QS);
        const events = [];
        card.addEventListener(EVENT_MERCH_QUANTITY_SELECTOR_CHANGE, (e) =>
            events.push(e.detail),
        );
        await openPopover();

        const option = [
            ...card.shadowRoot.querySelectorAll('.license-select-option'),
        ].find((li) => li.textContent.trim() === '5');
        option.click();
        await card.updateComplete;

        const qs = card.querySelector('merch-quantity-select');
        expect(qs.selectedValue).to.equal(5);
        expect(events).to.deep.include({ option: 5 });
        expect(
            card.shadowRoot
                .querySelector('.license-select-value')
                .textContent.trim(),
        ).to.equal('5');
        expect(
            card.shadowRoot
                .querySelector('#license-popover')
                .hasAttribute('hidden'),
        ).to.be.true;
    });
});

describe('bizpro resize handling', () => {
    let card;
    // Real animation frames are throttled for backgrounded test pages, so the
    // frames are stubbed and flushed by hand to keep these deterministic.
    let frames;
    let rafStub;
    let cafStub;

    beforeEach(() => {
        frames = [];
        rafStub = sinon
            .stub(window, 'requestAnimationFrame')
            .callsFake((callback) => frames.push(callback));
        cafStub = sinon
            .stub(window, 'cancelAnimationFrame')
            .callsFake((id) => (frames[id - 1] = null));
    });

    afterEach(() => {
        rafStub.restore();
        cafStub.restore();
        card?.remove();
    });

    const flushFrames = () => frames.splice(0).forEach((cb) => cb?.());

    it('debounces resize events into a single height sync', async () => {
        card = await renderCard('<h3 slot="heading-xs">Title</h3>');
        const layout = card.variantLayout;
        const sync = sinon.spy(layout, 'syncHeights');

        frames.length = 0;
        // The second call must cancel the first scheduled frame (debounce).
        layout.handleResize();
        layout.handleResize();
        flushFrames();

        expect(sync.callCount).to.equal(1);
    });

    it('cancels a pending resize frame on disconnect', async () => {
        card = await renderCard('<h3 slot="heading-xs">Title</h3>');
        const layout = card.variantLayout;
        const sync = sinon.spy(layout, 'syncHeights');

        frames.length = 0;
        layout.handleResize();
        card.remove();
        flushFrames();

        expect(sync.called).to.be.false;
    });

    it('re-syncs heights once the card first becomes visible', async () => {
        const callbacks = [];
        const RealObserver = window.IntersectionObserver;
        class FakeObserver {
            constructor(callback) {
                callbacks.push(callback);
            }
            observe() {}
            disconnect() {}
        }
        window.IntersectionObserver = FakeObserver;
        try {
            card = await renderCard('<h3 slot="heading-xs">Title</h3>');
            const sync = sinon.spy(card.variantLayout, 'syncHeights');
            // The card's observer is the last one created during render.
            const onVisibility = callbacks[callbacks.length - 1];

            frames.length = 0;
            // Hidden (zero-height) and off-screen entries must not sync.
            onVisibility([
                { boundingClientRect: { height: 0 }, isIntersecting: true },
            ]);
            onVisibility([
                { boundingClientRect: { height: 10 }, isIntersecting: false },
            ]);
            flushFrames();
            expect(sync.called).to.be.false;

            onVisibility([
                { boundingClientRect: { height: 10 }, isIntersecting: true },
            ]);
            flushFrames();
            expect(sync.callCount).to.equal(1);
        } finally {
            window.IntersectionObserver = RealObserver;
        }
    });
});

describe('bizpro add-on theming', () => {
    let card;
    afterEach(() => card?.remove());

    it('renders the bordered add-on wrapper around the slotted merch-addon', async () => {
        card = await renderCard(
            '<merch-addon slot="addon"><p>Add AI</p></merch-addon>',
        );
        const wrapper = card.shadowRoot.querySelector('.add-on');
        expect(wrapper).to.exist;
        const styles = getComputedStyle(wrapper);
        // Gradient border (Figma 1098:33812): the 1px border is transparent and
        // the purple→red AI gradient is painted on border-box behind a white
        // padding-box fill. #8d88f2 === rgb(141, 136, 242), #eb1000 === rgb(235, 16, 0).
        expect(styles.borderTopColor).to.equal('rgba(0, 0, 0, 0)');
        expect(styles.backgroundImage).to.contain('rgb(141, 136, 242)');
        expect(styles.backgroundImage).to.contain('rgb(235, 16, 0)');
    });
});
