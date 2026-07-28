import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';
import {
    EVENT_MERCH_CARD_QUANTITY_CHANGE,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
} from '../src/constants.js';

let Pro;

before(async () => {
    // merch-card's connectedCallback needs a commerce service in the DOM,
    // mirroring the setup in hydrate.test.js.
    if (!document.querySelector('mas-commerce-service')) {
        document.head.appendChild(
            document.createElement('mas-commerce-service'),
        );
    }
    await customElements.whenDefined('merch-card');
    ({ Pro } = await import('../src/variants/pro.js'));
});

async function renderCard(innerHTML) {
    const card = document.createElement('merch-card');
    card.setAttribute('variant', 'pro');
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

describe('pro add-on slot', () => {
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

describe('Pro.adjustAddon', () => {
    function makeLayout(cardOverrides = {}) {
        const layout = Object.create(Pro.prototype);
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

    it('does not throw when price element lacks onceSettled (unupgraded custom element)', async () => {
        const addon = { setAttribute: sinon.spy() };
        const price = { value: [{ planType: 'PUF' }] }; // no onceSettled
        const layout = makeLayout({
            addon,
            querySelector: (sel) => (sel.includes('heading-m') ? price : null),
        });
        await layout.adjustAddon();
        expect(addon.planType).to.equal('PUF');
    });
});

describe('pro plan type', () => {
    let card;
    afterEach(() => card?.remove());

    it('exposes planType in the AEM fragment mapping so the editor shows the toggle', async () => {
        const { PRO_AEM_FRAGMENT_MAPPING } = await import(
            '../src/variants/pro.js'
        );
        expect(PRO_AEM_FRAGMENT_MAPPING.planType).to.be.true;
    });

    it('forwards settings.displayPlanType to legal-template prices only', async () => {
        card = await renderCard('<h3 slot="heading-xs">Title</h3>');
        card.settings = { displayPlanType: true };

        const legalOptions = {};
        card.variantLayout.priceOptionsProvider(
            { dataset: { template: 'legal' } },
            legalOptions,
        );
        expect(legalOptions.displayPlanType).to.be.true;

        const priceOptions = {};
        card.variantLayout.priceOptionsProvider(
            { dataset: { template: 'price' } },
            priceOptions,
        );
        expect(priceOptions.displayPlanType).to.be.undefined;
    });

    it('defaults displayPlanType to false without settings', async () => {
        card = await renderCard('<h3 slot="heading-xs">Title</h3>');
        card.settings = undefined;
        const options = {};
        card.variantLayout.priceOptionsProvider(
            { dataset: { template: 'legal' } },
            options,
        );
        expect(options.displayPlanType).to.be.false;
    });
});

describe('Pro.adjustLegal', () => {
    function makeFixture(priceOverrides = {}) {
        const clone = {
            setAttribute: sinon.spy(),
            onceSettled: () => Promise.resolve(),
            dataset: {},
        };
        const insertBefore = sinon.spy();
        const price = {
            dataset: {},
            options: {},
            cloneNode: () => clone,
            onceSettled: () => Promise.resolve(),
            parentNode: { insertBefore },
            nextSibling: 'next-sibling',
            ...priceOverrides,
        };
        const layout = Object.create(Pro.prototype);
        layout.card = {
            updateComplete: Promise.resolve(),
            querySelector: (sel) =>
                sel.includes('heading-m') && sel.includes('price')
                    ? price
                    : null,
        };
        return { layout, price, clone, insertBefore };
    }

    it('clones the main price into a legal-template sibling — no authoring needed', async () => {
        const { layout, price, clone, insertBefore } = makeFixture({
            options: { displayPerUnit: true, displayTax: true },
        });
        await layout.adjustLegal();
        expect(clone.setAttribute.calledWith('data-template', 'legal')).to.be
            .true;
        expect(insertBefore.calledWith(clone, 'next-sibling')).to.be.true;
        // tax moves off the main price onto the legal clone, but per-unit
        // stays on the pricing line (Figma 3260:44659) and is disabled on
        // the clone so it doesn't render twice.
        expect(price.dataset.displayTax).to.equal('false');
        expect(price.dataset.displayPerUnit).to.be.undefined;
        expect(clone.dataset.displayPerUnit).to.equal('false');
    });

    it('leaves disabled display options untouched on the main price', async () => {
        const { layout, price } = makeFixture({ options: {} });
        await layout.adjustLegal();
        expect(price.dataset.displayPerUnit).to.be.undefined;
        expect(price.dataset.displayTax).to.be.undefined;
        expect(price.dataset.displayPlanType).to.be.undefined;
    });

    it('runs only once (legalAdjusted guard)', async () => {
        const { layout, insertBefore } = makeFixture();
        await layout.adjustLegal();
        await layout.adjustLegal();
        expect(insertBefore.callCount).to.equal(1);
    });

    it('does nothing without a main price', async () => {
        const { layout, insertBefore } = makeFixture();
        layout.card.querySelector = () => null;
        await layout.adjustLegal(); // must not throw
        expect(insertBefore.called).to.be.false;
    });
});

describe('pro license-zone gating', () => {
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

describe('pro whats-included toggle label', () => {
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

describe('pro short description plan type override', () => {
    let card;
    afterEach(() => card?.remove());

    // Mimics the legal price markup after it resolves with displayPlanType on.
    const LEGAL_PRICE =
        '<p slot="heading-m"><span is="inline-price" data-template="legal">' +
        '<span class="price price-legal"><span class="price-plan-type">Annual, billed monthly</span></span>' +
        '</span></p>';

    it('replaces the derived plan type wording with the authored text', async () => {
        card = await renderCard(
            `${LEGAL_PRICE}<div slot="legal-text">Yearly, paid monthly</div>`,
        );
        card.variantLayout.adjustShortDescription();
        expect(card.querySelector('.price-plan-type').textContent).to.equal(
            'Yearly, paid monthly',
        );
        // The source element stays in the light DOM (so the override survives
        // layout re-instantiation) but never projects — the shadow template
        // has no legal-text slot.
        expect(card.querySelector('[slot="legal-text"]').assignedSlot).to.be
            .null;
    });

    it('survives the variantLayout being replaced after first render', async () => {
        card = await renderCard(
            `${LEGAL_PRICE}<div slot="legal-text">Yearly, paid monthly</div>`,
        );
        // First instance applies the override...
        card.variantLayout.adjustShortDescription();
        // ...then merch-card swaps in a fresh layout and the legal price
        // re-resolves with the derived wording.
        card.querySelector('.price-plan-type').textContent =
            'Annual, billed monthly';
        const freshLayout = Object.create(Pro.prototype);
        freshLayout.card = card;
        freshLayout.adjustShortDescription();
        expect(card.querySelector('.price-plan-type').textContent).to.equal(
            'Yearly, paid monthly',
        );
    });

    it('keeps the derived wording when no short description is authored', async () => {
        card = await renderCard(LEGAL_PRICE);
        card.variantLayout.adjustShortDescription();
        expect(card.querySelector('.price-plan-type').textContent).to.equal(
            'Annual, billed monthly',
        );
    });

    it('renders nothing when the plan type line is off (no .price-plan-type)', async () => {
        card = await renderCard(
            '<p slot="heading-m"><span is="inline-price" data-template="legal">' +
                '<span class="price price-legal"></span></span></p>' +
                '<div slot="legal-text">Yearly, paid monthly</div>',
        );
        card.variantLayout.adjustShortDescription();
        // No plan type span to override, and the source element itself never
        // projects into the shadow DOM — the text appears nowhere.
        expect(card.querySelector('.price-legal').textContent).to.equal('');
        expect(card.querySelector('[slot="legal-text"]').assignedSlot).to.be
            .null;
    });

    it('re-applies the override after the legal price re-resolves', async () => {
        card = await renderCard(
            `${LEGAL_PRICE}<div slot="legal-text">Yearly, paid monthly</div>`,
        );
        card.variantLayout.adjustShortDescription();
        // A re-resolve regenerates the price markup (derived wording returns).
        card.querySelector('.price-plan-type').textContent =
            'Annual, billed monthly';
        card.variantLayout.adjustShortDescription();
        expect(card.querySelector('.price-plan-type').textContent).to.equal(
            'Yearly, paid monthly',
        );
    });
});

describe('pro short description tax spacing', () => {
    let card;
    afterEach(() => card?.remove());

    // Legal price as it resolves on a VAT card where the plan type comes from
    // the authored short description: tax label is set, plan-type span is empty,
    // so the legal template never added its ". " separator (MWPW-198626).
    const legalWithTax = (taxText) =>
        '<p slot="heading-m"><span is="inline-price" data-template="legal">' +
        '<span class="price price-legal">' +
        '<span class="price-unit-type disabled"></span>' +
        `<span class="price-tax-inclusivity">${taxText}</span>` +
        '<span class="price-plan-type disabled"></span>' +
        '</span></span></p>';

    it('inserts the ". " separator between the tax label and the injected plan type', async () => {
        card = await renderCard(
            `${legalWithTax('excl. VAT')}<div slot="legal-text">Annual, billed monthly</div>`,
        );
        card.variantLayout.adjustShortDescription();
        // Matches the template's WCS path ("incl. VAT. Annual…") so injected and
        // WCS-sourced plan types read identically.
        expect(card.querySelector('.price-legal').textContent).to.equal(
            'excl. VAT. Annual, billed monthly',
        );
    });

    it('does not double the separator when the tax label already ends in space', async () => {
        card = await renderCard(
            `${legalWithTax('incl. VAT. ')}<div slot="legal-text">Annual, billed monthly</div>`,
        );
        card.variantLayout.adjustShortDescription();
        expect(card.querySelector('.price-legal').textContent).to.equal(
            'incl. VAT. Annual, billed monthly',
        );
    });

    it('adds no separator when there is no tax label (e.g. en-US)', async () => {
        const noTax =
            '<p slot="heading-m"><span is="inline-price" data-template="legal">' +
            '<span class="price price-legal">' +
            '<span class="price-unit-type disabled"></span>' +
            '<span class="price-tax-inclusivity disabled"></span>' +
            '<span class="price-plan-type disabled"></span>' +
            '</span></span></p>';
        card = await renderCard(
            `${noTax}<div slot="legal-text">Annual, billed monthly</div>`,
        );
        card.variantLayout.adjustShortDescription();
        expect(card.querySelector('.price-legal').textContent).to.equal(
            'Annual, billed monthly',
        );
    });

    it('stays idempotent across repeated re-resolves (no accumulating spaces)', async () => {
        card = await renderCard(
            `${legalWithTax('excl. VAT')}<div slot="legal-text">Annual, billed monthly</div>`,
        );
        card.variantLayout.adjustShortDescription();
        card.variantLayout.adjustShortDescription();
        card.variantLayout.adjustShortDescription();
        expect(card.querySelector('.price-legal').textContent).to.equal(
            'excl. VAT. Annual, billed monthly',
        );
    });
});

describe('pro whats-included toggle interaction', () => {
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

describe('pro row-synced whats-included toggle', () => {
    let container;
    afterEach(() => container?.remove());

    const SECTION =
        '<div class="section"><h4>PDF tools</h4><ul><li>row</li></ul></div>';

    // display:flex puts both cards on the same row (same top edge);
    // display:block stacks them onto different rows.
    async function renderCards(display) {
        container = document.createElement('div');
        container.className = 'two-merch-cards';
        container.style.display = display;
        document.body.appendChild(container);
        const cards = [];
        for (let i = 0; i < 2; i += 1) {
            const card = document.createElement('merch-card');
            card.setAttribute('variant', 'pro');
            card.innerHTML = `<div slot="whats-included">${SECTION}</div>`;
            container.appendChild(card);
            await card.updateComplete;
            card.requestUpdate();
            await card.updateComplete;
            cards.push(card);
        }
        return cards;
    }

    const zoneHidden = (card) =>
        card.shadowRoot.querySelector('#features-zone').hasAttribute('hidden');
    const clickToggle = (card) =>
        card.shadowRoot.querySelector('.whats-included-toggle').click();

    it('expands and collapses every card on the same row together', async () => {
        const [first, second] = await renderCards('flex');

        clickToggle(first);
        await first.updateComplete;
        await second.updateComplete;
        expect(zoneHidden(first)).to.be.false;
        expect(zoneHidden(second)).to.be.false;

        // Collapsing from the OTHER card collapses the whole row too.
        clickToggle(second);
        await first.updateComplete;
        await second.updateComplete;
        expect(zoneHidden(first)).to.be.true;
        expect(zoneHidden(second)).to.be.true;
    });

    it('leaves stacked (different-row) cards independent', async () => {
        const [first, second] = await renderCards('block');

        clickToggle(first);
        await first.updateComplete;
        await second.updateComplete;
        expect(zoneHidden(first)).to.be.false;
        expect(zoneHidden(second)).to.be.true;
    });
});

describe('pro license dropdown interaction', () => {
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

describe('pro license sync from the 3-in-1 modal', () => {
    let card;
    afterEach(() => card?.remove());

    const QS =
        '<div slot="quantity-select"><merch-quantity-select title="License" min="1" max="10" step="1" default-value="2"></merch-quantity-select></div>';

    const value = () =>
        card.shadowRoot
            .querySelector('.license-select-value')
            .textContent.trim();

    // merch-card.handleAddonAndQuantityUpdate fires this on the quantity-select
    // when the 3-in-1 modal closes with a new license count (MWPW-198372).
    const modalQuantityChange = (quantity) =>
        card.querySelector('merch-quantity-select').dispatchEvent(
            new CustomEvent(EVENT_MERCH_CARD_QUANTITY_CHANGE, {
                detail: { quantity },
                bubbles: true,
                composed: true,
            }),
        );

    it('reflects a modal license change in the custom selector', async () => {
        card = await renderCard(QS);
        expect(value()).to.equal('2');

        modalQuantityChange(6);
        await card.updateComplete;

        expect(value()).to.equal('6');
        expect(
            card.shadowRoot
                .querySelector('.license-select-option.selected')
                .textContent.trim(),
        ).to.equal('6');
    });

    it('ignores a modal quantity outside the configured range', async () => {
        card = await renderCard(QS);

        modalQuantityChange(99);
        await card.updateComplete;

        expect(value()).to.equal('2');
    });
});

describe('pro license dropdown keyboard navigation', () => {
    let card;
    afterEach(() => card?.remove());

    const QS =
        '<div slot="quantity-select"><merch-quantity-select title="License|Licenses" min="1" max="5" step="1" default-value="3"></merch-quantity-select></div>';

    // Options are values 1..5, so the default "3" is at index 2.

    function key(target, keyName) {
        const event = new KeyboardEvent('keydown', {
            key: keyName,
            bubbles: true,
            cancelable: true,
        });
        target.dispatchEvent(event);
        return event;
    }

    const trigger = () =>
        card.shadowRoot.querySelector('.license-select-trigger');
    const popoverHidden = () =>
        card.shadowRoot
            .querySelector('#license-popover')
            .hasAttribute('hidden');
    const highlighted = () =>
        card.shadowRoot.querySelector('.license-select-option.highlighted');
    const activeDescendant = () =>
        card.shadowRoot.querySelector(
            `#${trigger().getAttribute('aria-activedescendant')}`,
        );

    it('exposes the trigger as a combobox in the tab order', async () => {
        card = await renderCard(QS);
        expect(trigger().getAttribute('role')).to.equal('combobox');
        expect(trigger().getAttribute('tabindex')).to.equal('0');
        expect(trigger().getAttribute('aria-controls')).to.equal(
            'license-popover',
        );
        // role=combobox is name-from-author, so inner text does not supply an
        // accessible name — it must come from aria-labelledby.
        const labelledby = trigger().getAttribute('aria-labelledby');
        expect(labelledby).to.equal('license-select-label');
        expect(
            card.shadowRoot.getElementById(labelledby)?.textContent.trim(),
        ).to.not.equal('');
    });

    it('opens on ArrowDown and highlights the selected option', async () => {
        card = await renderCard(QS);
        const event = key(trigger(), 'ArrowDown');
        await card.updateComplete;
        expect(popoverHidden()).to.be.false;
        expect(event.defaultPrevented).to.be.true;
        // DOM focus stays on the trigger; the highlight is the selected value.
        expect(highlighted().id).to.equal('license-option-2');
        expect(trigger().getAttribute('aria-activedescendant')).to.equal(
            'license-option-2',
        );
        expect(activeDescendant().textContent.trim()).to.equal('3');
    });

    it('opens on ArrowUp and prevents the default page scroll', async () => {
        card = await renderCard(QS);
        const event = key(trigger(), 'ArrowUp');
        await card.updateComplete;
        expect(popoverHidden()).to.be.false;
        expect(event.defaultPrevented).to.be.true;
    });

    it('opens on Enter and Space', async () => {
        card = await renderCard(QS);
        key(trigger(), 'Enter');
        await card.updateComplete;
        expect(popoverHidden()).to.be.false;
        // Space closes (toggles) the open popover...
        key(trigger(), ' ');
        await card.updateComplete;
        expect(popoverHidden()).to.be.true;
        // ...and reopens from closed.
        key(trigger(), ' ');
        await card.updateComplete;
        expect(popoverHidden()).to.be.false;
    });

    it('moves the highlight with ArrowDown/ArrowUp and wraps around', async () => {
        card = await renderCard(QS);
        key(trigger(), 'ArrowDown'); // open, highlight idx 2 ("3")
        await card.updateComplete;
        key(trigger(), 'ArrowDown');
        await card.updateComplete;
        expect(highlighted().id).to.equal('license-option-3');
        key(trigger(), 'ArrowUp');
        await card.updateComplete;
        expect(highlighted().id).to.equal('license-option-2');
        // Wrap: from idx 2 up three times -> 1 -> 0 -> last (4)
        key(trigger(), 'ArrowUp');
        await card.updateComplete;
        key(trigger(), 'ArrowUp');
        await card.updateComplete;
        key(trigger(), 'ArrowUp');
        await card.updateComplete;
        expect(highlighted().id).to.equal('license-option-4');
    });

    it('Home and End jump the highlight to first and last option', async () => {
        card = await renderCard(QS);
        key(trigger(), 'ArrowDown');
        await card.updateComplete;
        key(trigger(), 'End');
        await card.updateComplete;
        expect(highlighted().id).to.equal('license-option-4');
        key(trigger(), 'Home');
        await card.updateComplete;
        expect(highlighted().id).to.equal('license-option-0');
    });

    it('keeps DOM focus on the trigger while navigating', async () => {
        card = await renderCard(QS);
        trigger().focus();
        key(trigger(), 'ArrowDown');
        await card.updateComplete;
        key(trigger(), 'ArrowDown');
        await card.updateComplete;
        expect(card.shadowRoot.activeElement).to.equal(trigger());
    });

    it('selects the highlighted option on Enter and closes', async () => {
        card = await renderCard(QS);
        key(trigger(), 'ArrowDown'); // open at "3"
        await card.updateComplete;
        key(trigger(), 'ArrowDown'); // highlight "4"
        await card.updateComplete;
        key(trigger(), 'ArrowDown'); // highlight "5"
        await card.updateComplete;
        key(trigger(), 'Enter');
        await card.updateComplete;
        expect(
            card.shadowRoot
                .querySelector('.license-select-value')
                .textContent.trim(),
        ).to.equal('5');
        expect(popoverHidden()).to.be.true;
    });

    it('routes the keyboard selection through the quantity selector', async () => {
        card = await renderCard(QS);
        const events = [];
        card.addEventListener(EVENT_MERCH_QUANTITY_SELECTOR_CHANGE, (e) =>
            events.push(e.detail),
        );
        key(trigger(), 'ArrowDown'); // open at "3"
        await card.updateComplete;
        key(trigger(), 'Enter'); // select "3"
        await card.updateComplete;
        expect(
            card.querySelector('merch-quantity-select').selectedValue,
        ).to.equal(3);
        expect(events).to.deep.include({ option: 3 });
    });

    it('closes on Escape and keeps focus on the trigger', async () => {
        card = await renderCard(QS);
        trigger().focus();
        key(trigger(), 'ArrowDown');
        await card.updateComplete;
        const event = key(trigger(), 'Escape');
        await card.updateComplete;
        expect(popoverHidden()).to.be.true;
        expect(event.defaultPrevented).to.be.true;
        expect(card.shadowRoot.activeElement).to.equal(trigger());
    });

    it('commits the highlight on Tab and lets focus advance', async () => {
        card = await renderCard(QS);
        key(trigger(), 'ArrowDown'); // open at "3"
        await card.updateComplete;
        key(trigger(), 'ArrowDown'); // highlight "4"
        await card.updateComplete;
        const event = key(trigger(), 'Tab');
        await card.updateComplete;
        expect(popoverHidden()).to.be.true;
        // Tab must NOT be prevented — focus continues to the next control.
        expect(event.defaultPrevented).to.be.false;
        expect(
            card.shadowRoot
                .querySelector('.license-select-value')
                .textContent.trim(),
        ).to.equal('4');
    });

    it('drops aria-activedescendant when closed', async () => {
        card = await renderCard(QS);
        expect(trigger().hasAttribute('aria-activedescendant')).to.be.false;
        key(trigger(), 'ArrowDown');
        await card.updateComplete;
        expect(trigger().hasAttribute('aria-activedescendant')).to.be.true;
    });

    it('header list item is hidden from assistive technology', async () => {
        card = await renderCard(QS);
        trigger().click();
        await card.updateComplete;
        const header = card.shadowRoot.querySelector(
            '.license-select-popover-header',
        );
        expect(header.getAttribute('aria-hidden')).to.equal('true');
    });
});

describe('pro license label pluralization', () => {
    let card;
    afterEach(() => card?.remove());

    const QS = (title, def) =>
        `<div slot="quantity-select"><merch-quantity-select title="${title}" min="1" max="10" step="1" default-value="${def}"></merch-quantity-select></div>`;

    const labelText = () =>
        card.shadowRoot
            .querySelector('.license-select-trigger .license-select-label')
            .textContent.trim();

    async function selectQty(value) {
        card.shadowRoot.querySelector('.license-select-trigger').click();
        await card.updateComplete;
        [...card.shadowRoot.querySelectorAll('.license-select-option')]
            .find((li) => li.textContent.trim() === value)
            .click();
        await card.updateComplete;
    }

    // The title arrives as "singular|plural" — typically authored as two
    // dictionary placeholders ({{license-label}}|{{licenses-label}}) that the
    // fragment pipeline resolves per locale before hydration.
    it('picks singular at 1 and plural above from a "singular|plural" title', async () => {
        card = await renderCard(QS('License|Licenses', '2'));
        expect(labelText()).to.equal('Licenses');
        await selectQty('1');
        expect(labelText()).to.equal('License');
        await selectQty('5');
        expect(labelText()).to.equal('Licenses');
        // the "|" form never leaks into the UI
        expect(card.shadowRoot.textContent).to.not.contain('|');
    });

    it('never derives plurals for plain-text titles (CJK-safe)', async () => {
        card = await renderCard(QS('License', '2'));
        expect(labelText()).to.equal('License');
        await selectQty('5');
        expect(labelText()).to.equal('License');
        await selectQty('1');
        expect(labelText()).to.equal('License');
    });
});

describe('pro resize handling', () => {
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

    // syncHeights now awaits document.fonts (which settle on a macrotask) before
    // the double rAF, so deterministic driving needs real macrotask yields
    // between frame flushes, not just microtask drains.
    const flushUntilCalled = async (spy) => {
        for (let i = 0; i < 30 && !spy.called; i += 1) {
            await new Promise((resolve) => setTimeout(resolve, 0));
            flushFrames();
        }
    };

    it('observes the card on connect and re-syncs on reflow', async () => {
        const observers = [];
        const RealObserver = window.ResizeObserver;
        class FakeObserver {
            constructor(callback) {
                this.callback = callback;
                observers.push(this);
            }
            observe() {}
            disconnect() {
                this.disconnected = true;
            }
        }
        window.ResizeObserver = FakeObserver;
        try {
            card = await renderCard('<div slot="body-xs">desc</div>');
            const layout = card.variantLayout;
            const resync = sinon.stub(layout, 'resyncOnReflow');
            // The surviving layout (card.variantLayout) owns the last observer.
            const obs = observers[observers.length - 1];
            expect(obs, 'observes on connect').to.exist;
            obs.callback();
            expect(resync.calledOnce, 'a reflow re-runs the sync').to.be.true;
        } finally {
            window.ResizeObserver = RealObserver;
        }
    });

    it('re-syncs on a real reflow but dedupes unchanged geometry', async () => {
        // resyncOnReflow keys on width:descriptionHeight so a genuine reflow
        // (mount at 0 → width, or a font swap changing the description height)
        // re-syncs, while publishing the min-height (a top-card height change)
        // leaves the key unchanged and can't loop the observer.
        const layout = Object.create(Pro.prototype);
        const rect = { width: 0, top: 0, height: 0 };
        let descHeight = 18;
        const desc = { getBoundingClientRect: () => ({ height: descHeight }) };
        layout.card = {
            getBoundingClientRect: () => rect,
            querySelector: (sel) => (sel.includes('body-xs') ? desc : null),
        };
        const sync = sinon.stub(layout, 'syncHeights').resolves();

        layout.resyncOnReflow();
        expect(sync.called, 'no sync while width 0').to.be.false;

        rect.width = 300;
        layout.resyncOnReflow();
        expect(sync.calledOnce, 'syncs when width becomes real').to.be.true;

        layout.resyncOnReflow();
        expect(sync.calledOnce, 'deduped on unchanged geometry').to.be.true;

        descHeight = 36;
        layout.resyncOnReflow();
        expect(sync.calledTwice, 're-syncs when the description reflows').to.be
            .true;
    });

    it('disconnects its resize observer when the card is removed', async () => {
        // A card torn down while still collapsed must clean up its observer.
        const observers = [];
        const RealObserver = window.ResizeObserver;
        class FakeObserver {
            constructor(callback) {
                this.callback = callback;
                observers.push(this);
            }
            observe() {}
            disconnect() {
                this.disconnected = true;
            }
        }
        window.ResizeObserver = FakeObserver;
        try {
            card = await renderCard('<h3 slot="heading-xs">Title</h3>');
            // connectedCallbackHook observes the card on connect.
            expect(observers.length, 'observes on connect').to.be.greaterThan(
                0,
            );

            card.remove();
            expect(
                observers.some((o) => o.disconnected),
                'observer cleaned up on remove',
            ).to.be.true;
        } finally {
            window.ResizeObserver = RealObserver;
        }
    });

    it('waits for the web fonts to settle before measuring the row', async () => {
        // The .top-card height is driven by the heading/description, which
        // reflow when the Adobe Clean fonts swap in; measuring before the swap
        // publishes a stale row max. syncHeights must defer until
        // document.fonts.ready + a frame, matching full-pricing-express.
        // Isolated instance so a render-triggered sync can't pollute the count.
        const layout = Object.create(Pro.prototype);
        layout.card = {
            getBoundingClientRect: () => ({ width: 300, top: 0, height: 400 }),
            querySelector: () => null,
            variant: 'pro',
        };
        // getContainer is the first thing touched once measuring begins.
        const getContainer = sinon.stub(layout, 'getContainer').returns(null);

        const done = layout.syncHeights();
        // Regression: the old code measured right here, before the font swap.
        expect(getContainer.called, 'must not measure before fonts settle').to
            .be.false;

        await flushUntilCalled(getContainer);
        await done;
        expect(getContainer.calledOnce, 'measures once fonts settle').to.be
            .true;
    });

    it('groups rows by offsetTop, immune to the entrance animation transform', async () => {
        // The tab-switch entrance animation translateY-staggers the cards, so
        // their painted tops (getBoundingClientRect) drift apart while offsetTop
        // holds still. Grouping by offsetTop keeps same-row cards together —
        // grouping on the drifted top would split the row and publish a wrong
        // per-card height (the flicker).
        const prop = '--consonant-merch-card-pro-top-card-height';
        const makeCard = (offsetTop, topCardHeight) => {
            const topCard = { __h: topCardHeight };
            const styles = {};
            const card = {
                offsetTop,
                variant: 'pro',
                getBoundingClientRect: () => ({ width: 300 }),
                shadowRoot: { querySelector: () => topCard },
                style: {
                    setProperty: (k, v) => (styles[k] = v),
                    removeProperty: (k) => delete styles[k],
                    getPropertyValue: (k) => styles[k] ?? '',
                },
                __styles: styles,
            };
            card.variantLayout = { card };
            return card;
        };
        // Row A (offsetTop 0): 200 & 260 → max 260. Row B (offsetTop 500): a
        // lone card keeps its natural height (no var published).
        const a1 = makeCard(0, 200);
        const a2 = makeCard(0, 260);
        const b1 = makeCard(500, 180);
        const cards = [a1, a2, b1];

        const layout = Object.create(Pro.prototype);
        layout.card = a1;
        sinon.stub(layout, 'waitForContentFonts').resolves();
        sinon
            .stub(layout, 'getContainer')
            .returns({ querySelectorAll: () => cards });
        const gcs = sinon
            .stub(window, 'getComputedStyle')
            .callsFake((el) =>
                el && '__h' in el ? { height: `${el.__h}px` } : { height: '' },
            );
        try {
            const done = layout.syncHeights();
            await flushUntilCalled({
                get called() {
                    return a1.__styles[prop] !== undefined;
                },
            });
            await done;
            expect(
                a1.__styles[prop],
                'shorter card pulled to row max',
            ).to.equal('260px');
            expect(a2.__styles[prop], 'tallest card sets the row max').to.equal(
                '260px',
            );
            expect(
                b1.__styles[prop],
                'lone card on its own row keeps natural height',
            ).to.be.undefined;
        } finally {
            gcs.restore();
        }
    });
});

describe('pro strikethrough price', () => {
    let card;
    afterEach(() => card?.remove());

    // Promo shape: WCS resolves a single price-template inline-price into a
    // struck regular price + the promo price, separated by an &nbsp;.
    const PROMO_PRICE_HTML =
        '<p slot="heading-m"><span is="inline-price" data-template="price" class="placeholder-resolved">' +
        '<span class="price price-strikethrough"><span class="price-currency-symbol">US$</span>' +
        '<span class="price-integer">49</span><span class="price-decimals-delimiter">.</span>' +
        '<span class="price-decimals">99</span><span class="price-recurrence">/MO</span></span>' +
        '&nbsp;<span class="price price-alternative"><span class="price-currency-symbol">US$</span>' +
        '<span class="price-integer">34</span><span class="price-decimals-delimiter">.</span>' +
        '<span class="price-decimals">97</span><span class="price-recurrence">/MO</span></span>' +
        '</span></p>';

    it('renders the struck regular price small, muted and above the promo price (Figma 988:14784-5)', async () => {
        card = await renderCard(PROMO_PRICE_HTML);
        const struck = card.querySelector('.price-strikethrough');
        const promo = card.querySelector('.price-alternative');

        const struckStyles = getComputedStyle(struck);
        expect(struckStyles.display).to.equal('block');
        expect(struckStyles.fontSize).to.equal('14px');
        expect(struckStyles.fontWeight).to.equal('400');
        expect(struckStyles.textDecorationLine).to.contain('line-through');
        // --consonant-merch-card-pro-text-muted-color: #000000a3
        expect(struckStyles.color).to.match(/rgba\(0, 0, 0, 0\.6/);
        // Inner spans must not fall through to the 18px/900 price rules
        const recurrence = getComputedStyle(
            struck.querySelector('.price-recurrence'),
        );
        expect(recurrence.fontSize).to.equal('14px');
        expect(recurrence.fontWeight).to.equal('400');

        // The promo price keeps the full pricing typography, unstruck
        const promoStyles = getComputedStyle(promo);
        expect(promoStyles.fontSize).to.equal('18px');
        expect(promoStyles.fontWeight).to.equal('900');
        expect(promoStyles.textDecorationLine).to.not.contain('line-through');

        // Stacked: struck price on its own line above, left-aligned with the
        // promo price (the separating &nbsp; must not indent the promo line)
        const struckBox = struck.getBoundingClientRect();
        const promoBox = promo.getBoundingClientRect();
        expect(struckBox.bottom).to.be.at.most(promoBox.top + 1);
        expect(Math.abs(struckBox.left - promoBox.left)).to.be.below(1);
    });

    it('stacks an authored strikethrough-template price above the main price', async () => {
        card = await renderCard(
            '<p slot="heading-m"><span is="inline-price" data-template="strikethrough" class="placeholder-resolved">' +
                '<span class="price price-strikethrough"><span class="price-currency-symbol">US$</span>' +
                '<span class="price-integer">49</span><span class="price-recurrence">/MO</span></span></span> ' +
                '<span is="inline-price" data-template="price" class="placeholder-resolved">' +
                '<span class="price"><span class="price-currency-symbol">US$</span>' +
                '<span class="price-integer">34</span><span class="price-recurrence">/MO</span></span></span></p>',
        );
        const struckWrapper = card.querySelector(
            '[data-template="strikethrough"]',
        );
        expect(getComputedStyle(struckWrapper).display).to.equal('block');
        const struckBox = struckWrapper.getBoundingClientRect();
        const mainBox = card
            .querySelector('[data-template="price"]')
            .getBoundingClientRect();
        expect(struckBox.bottom).to.be.at.most(mainBox.top + 1);
    });
});

describe('pro add-on theming', () => {
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

describe('pro quantity selector repricing', () => {
    // Price lives in slot="heading-m" for pro (see PRO_AEM_FRAGMENT_MAPPING).
    const PRICE =
        '<p slot="heading-m"><span is="inline-price" data-wcs-osi="abc" data-template="price"></span></p>';
    const QS =
        '<div slot="quantity-select"><merch-quantity-select title="License" min="1" max="10" step="1"></merch-quantity-select></div>';
    let card;
    afterEach(() => {
        card?.remove();
        card = undefined;
    });

    it('pushes the selected quantity onto the main price on a selector change', async () => {
        card = await renderCard(PRICE + QS);
        const variantLayout = card.variantLayout;
        expect(variantLayout.updatePriceQuantity).to.be.a('function');
        const mainPrice = variantLayout.mainPrice;
        expect(mainPrice, 'price must resolve in slot heading-m').to.exist;

        card.dispatchEvent(
            new CustomEvent(EVENT_MERCH_QUANTITY_SELECTOR_CHANGE, {
                detail: { option: '7' },
                bubbles: true,
            }),
        );

        expect(mainPrice.dataset.quantity).to.equal('7');
    });

    it('leaves the price untouched without a main price or a usable option', () => {
        const layout = Object.create(Pro.prototype);
        // No main price → no-op, no throw.
        layout.card = { querySelector: () => null };
        expect(() =>
            layout.updatePriceQuantity({ detail: { option: 5 } }),
        ).to.not.throw();
        // Main price present but empty/absent detail → quantity stays unset.
        const price = { dataset: {} };
        layout.card = { querySelector: () => price };
        layout.updatePriceQuantity({ detail: null });
        layout.updatePriceQuantity({});
        layout.updatePriceQuantity({ detail: {} });
        expect(price.dataset.quantity).to.be.undefined;
    });
});
