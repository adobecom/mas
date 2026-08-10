import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';
import {
    EVENT_MERCH_CARD_QUANTITY_CHANGE,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    EVENT_TYPE_RESOLVED,
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

describe('pro appearance mapping', () => {
    it('maps Theme and Size selections to existing fragment fields', async () => {
        const { PRO_AEM_FRAGMENT_MAPPING } = await import(
            '../src/variants/pro.js'
        );

        expect(PRO_AEM_FRAGMENT_MAPPING.backgroundColor).to.deep.equal({
            attribute: 'background-color',
            editorLabel: 'Theme',
            specialValues: { Light: 'light', Dark: 'dark' },
        });
        expect(PRO_AEM_FRAGMENT_MAPPING.size).to.deep.equal(['wide', 'edu']);
    });
});

describe('pro dark theme rendering', () => {
    let card;
    afterEach(() => card?.remove());

    it('keeps whats-included list items muted in dark even with a leftover Black border', async () => {
        card = await renderCard(
            '<div slot="whats-included"><div class="section"><h4>Apps</h4><ul><li id="wi-li">Desktop, web, and mobile</li></ul></div></div>',
        );
        card.setAttribute('background-color', 'dark');
        card.setAttribute('border-color', 'black');
        await card.updateComplete;
        const li = card.querySelector('#wi-li');
        // muted white #ffffffa3 (0.64 alpha), not the black-border inverse full white
        expect(getComputedStyle(li).color).to.match(
            /rgba?\(255,\s*255,\s*255,\s*0\.6/,
        );
    });

    it('outlines the CTA in white on dark and black on light at rest', async () => {
        // S2A's on-dark border is #fff, not the #dadada other variants use.
        card = await renderCard(
            '<div slot="footer"><a class="con-button primary" href="#">Buy now</a></div>',
        );
        const cta = card.querySelector('[slot="footer"] a');
        expect(getComputedStyle(cta).borderColor).to.equal('rgb(0, 0, 0)');

        card.setAttribute('background-color', 'dark');
        await card.updateComplete;
        expect(getComputedStyle(cta).borderColor).to.equal(
            'rgb(255, 255, 255)',
        );
    });

    it('washes the outline CTA with white@64% and knocks its label to black on hover', async () => {
        // S2A Button/Core/Primary, outlined + on-dark + hover (node 2161:54613).
        // The hover itself is plain CSS, so assert the tokens the rule reads.
        card = await renderCard('<div slot="footer"></div>');
        card.setAttribute('background-color', 'dark');
        await card.updateComplete;
        const token = (name) =>
            getComputedStyle(card)
                .getPropertyValue(`--consonant-merch-card-pro-${name}`)
                .trim();
        expect(token('cta-outline-hover-color')).to.equal('#ffffffa3');
        expect(token('cta-outline-hover-text-color')).to.equal('#000');
    });

    it('washes the outline CTA with black@8% and leaves its label alone on light', async () => {
        // Same component, on-light (node 2074:86782): only the background moves,
        // so the label override stays unset and falls back to the resting color.
        card = await renderCard('<div slot="footer"></div>');
        await card.updateComplete;
        const token = (name) =>
            getComputedStyle(card)
                .getPropertyValue(`--consonant-merch-card-pro-${name}`)
                .trim();
        expect(token('cta-outline-hover-color')).to.equal('#00000014');
        expect(token('cta-outline-hover-text-color')).to.equal('');
    });
});

describe('pro strikethrough price', () => {
    let card;
    afterEach(() => card?.remove());

    // The two shapes WCS produces: a standalone struck price (what EDU uses),
    // or one price element holding both.
    const AUTHORED =
        '<div slot="heading-m"><p><span is="inline-price" data-template="strikethrough" class="placeholder-resolved">' +
        '<span class="price price-strikethrough">US$69.99/mo</span></span></p></div>';
    const PROMO =
        '<div slot="heading-m"><p><span is="inline-price" data-template="price" class="placeholder-resolved">' +
        '<span class="price price-strikethrough">US$69.99/mo</span>&nbsp;' +
        '<span class="price price-alternative">US$19.99/mo</span></span></p></div>';

    it('strikes the authored price once, from the inner span only', async () => {
        // The global sheet strikes the wrapper too, in the card's heavier font
        // and full-opacity color — that second line read as a bolder strike.
        card = await renderCard(AUTHORED);
        const wrapper = card.querySelector('[data-template="strikethrough"]');
        const inner = card.querySelector('.price-strikethrough');
        expect(getComputedStyle(wrapper).textDecorationLine).to.equal('none');
        expect(getComputedStyle(inner).textDecorationLine).to.equal(
            'line-through',
        );
    });

    it('leaves the promo shape striking from its inner span', async () => {
        card = await renderCard(PROMO);
        const inner = card.querySelector('.price-strikethrough');
        expect(getComputedStyle(inner).textDecorationLine).to.equal(
            'line-through',
        );
        expect(getComputedStyle(inner).fontWeight).to.equal('400');
    });
});

describe('pro whats-included section header typography', () => {
    let card;
    afterEach(() => card?.remove());

    const SECTION =
        '<div slot="whats-included"><div class="section"><h4 id="wi-h4">Apps</h4>' +
        '<ul><li id="wi-item">Desktop, web, and mobile</li></ul></div></div>';

    // Figma body-sm: 400, 14/18, no tracking. `letter-spacing: 0` computes to
    // `normal` in Chrome.
    const expectBodySm = (el) => {
        const cs = getComputedStyle(el);
        expect(cs.fontWeight).to.equal('400');
        expect(cs.fontSize).to.equal('14px');
        expect(cs.lineHeight).to.equal('18px');
        expect(cs.letterSpacing).to.be.oneOf(['normal', '0px']);
    };

    it('renders section headers as body-sm', async () => {
        card = await renderCard(SECTION);
        expectBodySm(card.querySelector('#wi-h4'));
    });

    it('renders list items as body-sm', async () => {
        card = await renderCard(SECTION);
        expectBodySm(card.querySelector('#wi-item'));
    });

    it('keeps body-sm in dark', async () => {
        card = await renderCard(SECTION);
        card.setAttribute('background-color', 'dark');
        await card.updateComplete;
        expectBodySm(card.querySelector('#wi-h4'));
        expectBodySm(card.querySelector('#wi-item'));
    });

    // Guard the other half of the token set: heading-5 (title) and the price keep
    // their -0.48px tracking — they are the only pro text that carries any.
    it('keeps -0.48px tracking on the title and the price', async () => {
        card = await renderCard(
            '<h3 slot="heading-xs" id="t">Lightroom for teams</h3>' +
                '<p slot="heading-m" id="p">US$37.99/mo</p>',
        );
        expect(
            getComputedStyle(card.querySelector('#t')).letterSpacing,
        ).to.equal('-0.48px');
        expect(
            getComputedStyle(card.querySelector('#p')).letterSpacing,
        ).to.equal('-0.48px');
    });
});

describe('pro edu size', () => {
    let card;
    afterEach(() => card?.remove());

    it('shows whats-included persistently (no toggle) at size edu', async () => {
        card = await renderCard(
            '<div slot="whats-included">Everything included</div>',
        );
        card.setAttribute('size', 'edu');
        card.requestUpdate();
        await card.updateComplete;
        const toggle = card.shadowRoot.querySelector('.whats-included-toggle');
        const zone = card.shadowRoot.querySelector('.features-zone');
        expect(getComputedStyle(toggle).display).to.equal('none');
        expect(getComputedStyle(zone).display).to.not.equal('none');
    });
});

describe('pro edu disclaimer', () => {
    let card;
    afterEach(() => card?.remove());

    it('maps eduDisclaimer to the edu-disclaimer slot', async () => {
        const { PRO_AEM_FRAGMENT_MAPPING } = await import(
            '../src/variants/pro.js'
        );
        expect(PRO_AEM_FRAGMENT_MAPPING.eduDisclaimer).to.deep.equal({
            tag: 'div',
            slot: 'edu-disclaimer',
        });
    });

    it('renders the disclaimer slot when content is present', async () => {
        card = await renderCard(
            '<div slot="edu-disclaimer">Students and teachers only.</div>',
        );
        expect(card.variantLayout.hasEduDisclaimer).to.be.true;
        expect(card.shadowRoot.querySelector('slot[name="edu-disclaimer"]')).to
            .exist;
    });

    it('hides the disclaimer when settings.hideEduDisclaimer is true', async () => {
        card = await renderCard(
            '<div slot="edu-disclaimer">Students and teachers only.</div>',
        );
        card.settings = { hideEduDisclaimer: true };
        card.requestUpdate();
        await card.updateComplete;
        expect(card.shadowRoot.querySelector('slot[name="edu-disclaimer"]')).to
            .not.exist;
    });

    it('shows the disclaimer when settings.hideEduDisclaimer is false', async () => {
        card = await renderCard(
            '<div slot="edu-disclaimer">Students and teachers only.</div>',
        );
        card.settings = { hideEduDisclaimer: false };
        card.requestUpdate();
        await card.updateComplete;
        expect(card.shadowRoot.querySelector('slot[name="edu-disclaimer"]')).to
            .exist;
    });
});

describe('Pro.adjustLegal', () => {
    function makeFixture(priceOverrides = {}) {
        // The clone needs the listener: without it adjustLegal threw and its own
        // catch swallowed it, so every assertion below ran against half a call.
        const clone = {
            setAttribute: sinon.spy(),
            onceSettled: () => Promise.resolve(),
            addEventListener: sinon.spy(),
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

    it('bails out when the price settles without options', async () => {
        // onceSettled can resolve on a price WCS never priced; reading
        // .options off it would throw and lose the rest of the update.
        const { layout, clone, insertBefore } = makeFixture({
            options: undefined,
        });
        await layout.adjustLegal();
        expect(insertBefore.called).to.be.false;
        expect(clone.setAttribute.called).to.be.false;
    });

    it('moves the plan type onto the legal clone', async () => {
        const { layout, price } = makeFixture({
            options: { displayPlanType: true },
        });
        await layout.adjustLegal();
        expect(price.dataset.displayPlanType).to.equal('false');
    });

    it('subscribes the legal clone to re-resolves and re-applies the override', async () => {
        // The clone re-renders on every resolve and wipes the injected text, so
        // the handler has to stay bound to it.
        const { layout, clone } = makeFixture();
        const reapply = sinon.stub(layout, 'adjustShortDescription');
        await layout.adjustLegal();
        expect(reapply.called, 'applies the override once in place').to.be.true;
        expect(clone.addEventListener.calledOnce).to.be.true;
        const [eventName, handler] = clone.addEventListener.firstCall.args;
        expect(eventName).to.equal(EVENT_TYPE_RESOLVED);
        // The registered handler is what re-applies on later resolutions.
        reapply.resetHistory();
        handler();
        expect(reapply.calledOnce, 'a re-resolve re-applies it').to.be.true;
    });

    it('keeps the handler it already registered', async () => {
        const { layout, clone } = makeFixture();
        layout.legalResolvedHandler = () => {};
        await layout.adjustLegal();
        expect(clone.addEventListener.called).to.be.false;
    });

    it('swallows a price that never settles so the rest of the update runs', async () => {
        // adjustLegal is one step of postCardUpdateHook; a rejected settle must
        // not take the height sync and short description down with it.
        const { layout, insertBefore } = makeFixture({
            onceSettled: () => Promise.reject(new Error('never priced')),
        });
        await layout.adjustLegal(); // must not reject
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

    it('shows exactly one focus ring while the popover is open', async () => {
        // The trigger's ring escaped around the popover and doubled up with the
        // option's. :focus-visible is unreliable here, so assert the rule.
        card = await renderCard(QS);
        trigger().click();
        await card.updateComplete;
        expect(trigger().getAttribute('aria-expanded')).to.equal('true');

        const rules = [
            ...[...card.shadowRoot.adoptedStyleSheets].flatMap((s) => [
                ...s.cssRules,
            ]),
            ...[...card.shadowRoot.querySelectorAll('style')].flatMap((s) => [
                ...s.sheet.cssRules,
            ]),
        ].filter(
            (r) =>
                r.selectorText?.includes('aria-expanded') &&
                r.selectorText?.includes('focus-visible'),
        );
        expect(rules).to.have.lengthOf(1);
        expect(rules[0].style.outline).to.equal('none');

        // The indicator lives on the option being navigated instead — this one
        // is a plain class, so it is deterministic.
        expect(getComputedStyle(highlighted()).outlineStyle).to.equal('solid');
    });

    it('curves the last option so its ring follows the popover corner', async () => {
        // The popover clips to an 8px radius less its 1px border; a square
        // outline on the last row got cut by that corner.
        card = await renderCard(QS);
        trigger().click();
        await card.updateComplete;
        const opts = [
            ...card.shadowRoot.querySelectorAll('.license-select-option'),
        ];
        const cs = getComputedStyle(opts[opts.length - 1]);
        expect(cs.borderBottomLeftRadius).to.equal('7px');
        expect(cs.borderBottomRightRadius).to.equal('7px');
        // rows above the corner stay square
        expect(getComputedStyle(opts[0]).borderBottomLeftRadius).to.equal(
            '0px',
        );
    });

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

describe('pro license options from the authored selector', () => {
    let card;
    afterEach(() => card?.remove());

    const QS = (attrs) =>
        `<div slot="quantity-select"><merch-quantity-select title="License|Licenses" ${attrs}></merch-quantity-select></div>`;

    const options = () => card.variantLayout.licenseOptions;

    it('renders no selector for a negative step instead of hanging', async () => {
        // A negative step counts away from max forever — reading this getter
        // used to hang the browser. The real selector stops below step 1 too.
        card = await renderCard(QS('min="1" max="5" step="-1"'));
        expect(options()).to.be.null;
        expect(card.variantLayout.hasLicenseSelector).to.be.false;
        expect(card.shadowRoot.querySelector('.license-select-trigger')).to.be
            .null;
    });

    it('falls back to a step of 1 when the step is absent or unusable', async () => {
        card = await renderCard(QS('min="1" max="3"'));
        expect(options(), 'absent').to.deep.equal(['1', '2', '3']);
        card.remove();
        card = await renderCard(QS('min="1" max="3" step="0"'));
        expect(options(), 'zero').to.deep.equal(['1', '2', '3']);
        card.remove();
        card = await renderCard(QS('min="1" max="3" step="abc"'));
        expect(options(), 'unparseable').to.deep.equal(['1', '2', '3']);
    });

    it('walks min to max on the authored step', async () => {
        card = await renderCard(QS('min="2" max="8" step="3"'));
        expect(options()).to.deep.equal(['2', '5', '8']);
    });

    it('has no options without a usable range', async () => {
        card = await renderCard(QS('min="5" max="2" step="1"'));
        expect(options()).to.be.null;
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
                // no strikethrough authored, so no reserve is published
                querySelector: () => null,
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
        // syncHeights only lines rows up at >=768px; pin it so the test doesn't
        // depend on the test runner's window width.
        const mm = sinon.stub(window, 'matchMedia').returns({ matches: true });
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
            mm.restore();
        }
    });

    it('clears the synced heights below the sync breakpoint', async () => {
        // The caller gates on 768px but the ResizeObserver doesn't, and a stale
        // desktop reserve leaves a gap above the price on a stacked card.
        const styles = {
            '--consonant-merch-card-pro-top-card-height': '260px',
            '--consonant-merch-card-pro-name-description-height': '120px',
            '--consonant-merch-card-pro-strike-reserve': '18px',
        };
        const card = {
            offsetTop: 0,
            variant: 'pro',
            getBoundingClientRect: () => ({ width: 300 }),
            querySelector: () => null,
            shadowRoot: { querySelector: () => null },
            style: {
                setProperty: (k, v) => (styles[k] = v),
                removeProperty: (k) => delete styles[k],
                getPropertyValue: (k) => styles[k] ?? '',
            },
        };
        card.variantLayout = { card };

        const layout = Object.create(Pro.prototype);
        layout.card = card;
        sinon.stub(layout, 'waitForContentFonts').resolves();
        sinon
            .stub(layout, 'getContainer')
            .returns({ querySelectorAll: () => [card] });
        const mm = sinon.stub(window, 'matchMedia').returns({ matches: false });
        try {
            const done = layout.syncHeights();
            await flushUntilCalled({
                get called() {
                    return Object.keys(styles).length === 0;
                },
            });
            await done;
            expect(Object.keys(styles)).to.deep.equal([]);
        } finally {
            mm.restore();
        }
    });

    // Fake card for syncHeights: it only reads offsetTop, the width, the struck
    // price and the bands, so that's all we need to stand in.
    const makeSyncCard = ({
        offsetTop = 0,
        topCardHeight = 300,
        strikeHeight = null,
        // A strikethrough that exists but has not been laid out yet, so
        // getComputedStyle reports no usable height.
        strikeUnmeasured = false,
        nameDescHeight = null,
    } = {}) => {
        const topCard = { __h: topCardHeight };
        const strike = strikeUnmeasured
            ? {}
            : strikeHeight == null
              ? null
              : { __h: strikeHeight };
        const nameDesc =
            nameDescHeight == null ? null : { __h: nameDescHeight };
        const styles = {};
        const card = {
            offsetTop,
            variant: 'pro',
            getBoundingClientRect: () => ({ width: 300 }),
            querySelector: (selector) =>
                selector.includes('strikethrough') ? strike : null,
            shadowRoot: {
                querySelector: (selector) => {
                    if (selector === '.top-card') return topCard;
                    if (selector === '.name-description') return nameDesc;
                    return null;
                },
            },
            style: {
                setProperty: (key, value) => (styles[key] = value),
                removeProperty: (key) => delete styles[key],
                getPropertyValue: (key) => styles[key] ?? '',
            },
            __styles: styles,
        };
        card.variantLayout = { card };
        return card;
    };

    // Heights come from the fakes' __h, so getComputedStyle has to be taught to
    // read it; the row only lines up at >=768px, so matchMedia is pinned too.
    const stubMeasurement = () => [
        sinon
            .stub(window, 'getComputedStyle')
            .callsFake((el) =>
                el && '__h' in el ? { height: `${el.__h}px` } : { height: '' },
            ),
        sinon.stub(window, 'matchMedia').returns({ matches: true }),
    ];

    const layoutFor = (card, cards) => {
        const layout = Object.create(Pro.prototype);
        layout.card = card;
        sinon.stub(layout, 'waitForContentFonts').resolves();
        sinon
            .stub(layout, 'getContainer')
            .returns({ querySelectorAll: () => cards });
        return layout;
    };

    it('undoes a completed sync when a card opts out of height syncing', async () => {
        // heightSync going false after a sync has to remove the heights, not just
        // skip the next pass, or the card keeps a min-height it doesn't want.
        const prop = '--consonant-merch-card-pro-top-card-height';
        const optOut = makeSyncCard({ topCardHeight: 200 });
        const rowMate = makeSyncCard({ topCardHeight: 260 });
        const layout = layoutFor(optOut, [optOut, rowMate]);
        const [gcs, mm] = stubMeasurement();
        try {
            const first = layout.syncHeights();
            await flushUntilCalled({
                get called() {
                    return optOut.__styles[prop] !== undefined;
                },
            });
            await first;
            expect(
                optOut.__styles[prop],
                'the first sync published the row height',
            ).to.equal('260px');

            optOut.heightSync = false;
            await layout.syncHeights();
            expect(
                optOut.__styles[prop],
                'opting out clears what the sync published',
            ).to.be.undefined;
            expect(
                rowMate.__styles[prop],
                'the rest of the row is left alone',
            ).to.equal('260px');
        } finally {
            gcs.restore();
            mm.restore();
        }
    });

    it('reserves the tallest strikethrough in the row on cards without one', async () => {
        // Figma keeps the price at the same height across a row, so a card with
        // no struck price pads by the row's tallest one.
        const reserveProp = '--consonant-merch-card-pro-strike-reserve';
        const nameDescProp =
            '--consonant-merch-card-pro-name-description-height';
        const promo = makeSyncCard({ strikeHeight: 18, nameDescHeight: 120 });
        const plain = makeSyncCard();
        const unlaidOut = makeSyncCard({ strikeUnmeasured: true });
        const layout = layoutFor(promo, [promo, plain, unlaidOut]);
        const [gcs, mm] = stubMeasurement();
        try {
            const done = layout.syncHeights();
            await flushUntilCalled({
                get called() {
                    return plain.__styles[reserveProp] !== undefined;
                },
            });
            await done;
            expect(
                plain.__styles[reserveProp],
                'the card with no struck price reserves the full line',
            ).to.equal('18px');
            expect(
                promo.__styles[reserveProp],
                'the card setting the row max needs no reserve',
            ).to.be.undefined;
            // An unmeasured strike counts as 0 rather than NaN — arithmetic on
            // NaN would publish "NaNpx" and silently drop the reserve.
            expect(
                unlaidOut.__styles[reserveProp],
                'an unmeasured strike falls back to a full reserve',
            ).to.equal('18px');
            // The band max still comes from the one card that has the block,
            // so the row shares an offset even when a card lacks the element.
            expect(plain.__styles[nameDescProp]).to.equal('120px');
            expect(promo.__styles[nameDescProp]).to.equal('120px');
        } finally {
            gcs.restore();
            mm.restore();
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

    it('holds the checkbox at 20px against a label that overruns the row', async () => {
        // merch-addon's flex layout lets the box shrink, so a long label squeezed
        // it to a sliver. Pro re-lays the host out on two grid tracks.
        card = await renderCard(
            '<merch-addon slot="addon" custom-checkbox plan-type="ABM">' +
                '<p data-plan-type="ABM">Add Acrobat AI Assistant to your plan for US$4.99/mo</p>' +
                '</merch-addon>',
        );
        const addon = card.querySelector('merch-addon');
        addon.style.width = '160px';
        const box = addon.shadowRoot.querySelector('#custom-checkbox');
        expect(getComputedStyle(addon).display).to.equal('grid');
        expect(box.getBoundingClientRect().width).to.equal(20);
    });

    // merch-addon skips its label styling once the paragraph has a
    // data-plan-type, so pro styles it directly.
    ['<p>Add AI</p>', '<p data-plan-type="ABM">Add AI</p>'].forEach((copy) => {
        it(`sets the add-on label to 14/18/700 for ${copy}`, async () => {
            card = await renderCard(
                `<merch-addon slot="addon" plan-type="ABM">${copy}</merch-addon>`,
            );
            const cs = getComputedStyle(card.querySelector('merch-addon p'));
            expect(cs.fontSize).to.equal('14px');
            expect(cs.lineHeight).to.equal('18px');
            expect(cs.fontWeight).to.equal('700');
        });
    });

    it('keeps the plan-type paragraphs switching on display', async () => {
        // The rule above must not touch display, or every plan type shows.
        card = await renderCard(
            '<merch-addon slot="addon" plan-type="ABM">' +
                '<p id="abm" data-plan-type="ABM">Annual</p>' +
                '<p id="puf" data-plan-type="PUF">Prepaid</p>' +
                '</merch-addon>',
        );
        expect(getComputedStyle(card.querySelector('#abm')).display).to.equal(
            'block',
        );
        expect(getComputedStyle(card.querySelector('#puf')).display).to.equal(
            'none',
        );
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
