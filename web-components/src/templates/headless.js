import { css } from '../css.js';

const CSS = css`
    /* Global CSS for the headless family (headless, marquee, faq, banner-blade):
   label + value only, no card chrome. Layout lives in HEADLESS_FAMILY_STYLE (headless.js). */

    /* Headless variant: minimal container for label/value rows */
    .headless {
        display: flex;
        flex-direction: column;
        padding: var(--consonant-merch-spacing-xs, 8px);
    }

    /* Neutralize non-headless slot treatments (heading weight/color, promo-text green,
   callout background box) from global.css so every row renders as plain text,
   matching the untouched body-xs/short-description rows. Applies to every variant
   in the headless family (headless, marquee, faq, banner-blade). */
    merch-card[variant='headless'] [slot='heading-xs'],
    merch-card[variant='marquee'] [slot='heading-xs'],
    merch-card[variant='faq'] [slot='heading-xs'],
    merch-card[variant='banner-blade'] [slot='heading-xs'],
    merch-card[variant='headless'] [slot='promo-text'],
    merch-card[variant='marquee'] [slot='promo-text'],
    merch-card[variant='faq'] [slot='promo-text'],
    merch-card[variant='banner-blade'] [slot='promo-text'] {
        color: var(--consonant-merch-card-body-xs-color);
        font-weight: 400;
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
    }
    merch-card[variant='headless'] [slot='callout-content'],
    merch-card[variant='marquee'] [slot='callout-content'],
    merch-card[variant='faq'] [slot='callout-content'],
    merch-card[variant='banner-blade'] [slot='callout-content'] {
        display: block;
        margin: 0;
        gap: 0;
    }
    merch-card[variant='headless'] [slot='callout-content'] > p,
    merch-card[variant='marquee'] [slot='callout-content'] > p,
    merch-card[variant='faq'] [slot='callout-content'] > p,
    merch-card[variant='banner-blade'] [slot='callout-content'] > p,
    merch-card[variant='headless'] [slot='callout-content'] > div,
    merch-card[variant='marquee'] [slot='callout-content'] > div,
    merch-card[variant='faq'] [slot='callout-content'] > div,
    merch-card[variant='banner-blade'] [slot='callout-content'] > div,
    merch-card[variant='headless'] [slot='callout-content'] > div > div,
    merch-card[variant='marquee'] [slot='callout-content'] > div > div,
    merch-card[variant='faq'] [slot='callout-content'] > div > div,
    merch-card[variant='banner-blade'] [slot='callout-content'] > div > div {
        background: transparent;
        padding: 0;
        border-radius: 0;
        width: auto;
    }
    /* Subtle gray annotation next to each headless CTA showing its authored variant
   (Primary/Secondary/Link), set alongside the button in hydrate.js's transformLinkToButton(). */
    merch-card[variant='headless'] .headless-cta-item,
    merch-card[variant='marquee'] .headless-cta-item,
    merch-card[variant='faq'] .headless-cta-item,
    merch-card[variant='banner-blade'] .headless-cta-item {
        display: inline-flex;
        align-items: center;
    }
    merch-card[variant='headless'] .headless-cta-variant-label,
    merch-card[variant='marquee'] .headless-cta-variant-label,
    merch-card[variant='faq'] .headless-cta-variant-label,
    merch-card[variant='banner-blade'] .headless-cta-variant-label {
        font-size: 0.75em;
        color: var(--spectrum-gray-600);
        background: var(--spectrum-gray-100);
        border-radius: 4px;
        padding: 2px 6px;
        line-height: 1.4;
        margin-left: var(--consonant-merch-spacing-xxs, 4px);
    }
    merch-card[variant='headless'] .headless-cta-item:not(:last-child)::after,
    merch-card[variant='marquee'] .headless-cta-item:not(:last-child)::after,
    merch-card[variant='faq'] .headless-cta-item:not(:last-child)::after,
    merch-card[variant='banner-blade']
        .headless-cta-item:not(:last-child)::after {
        content: ', ';
    }
`;

export const HEADLESS_FAMILY_STYLE = css`
    /* Shared shadow styles for the headless family (headless, marquee, faq,
       banner-blade): label + value rows, no card chrome. To add a variant to the
       family, add it to every selector list here and in headless.css.js. */
    :host([variant='headless']),
    :host([variant='marquee']),
    :host([variant='faq']),
    :host([variant='banner-blade']) {
        border: none;
        background: transparent;
        box-shadow: none;
    }
    :host([variant='headless']) .headless,
    :host([variant='marquee']) .headless,
    :host([variant='faq']) .headless,
    :host([variant='banner-blade']) .headless {
        display: flex;
        flex-direction: column;
        padding: var(--consonant-merch-spacing-xs, 8px);
    }
    :host([variant='headless']) .headless-row,
    :host([variant='marquee']) .headless-row,
    :host([variant='faq']) .headless-row,
    :host([variant='banner-blade']) .headless-row {
        display: flex;
        gap: var(--consonant-merch-spacing-xs, 8px);
        padding: var(--consonant-merch-spacing-xxs, 4px) 0;
    }
    :host([variant='headless']) .headless-label,
    :host([variant='marquee']) .headless-label,
    :host([variant='faq']) .headless-label,
    :host([variant='banner-blade']) .headless-label {
        flex-shrink: 0;
        font-weight: 600;
        min-width: 8em;
    }
    :host([variant='headless']) .headless-value,
    :host([variant='marquee']) .headless-value,
    :host([variant='faq']) .headless-value,
    :host([variant='banner-blade']) .headless-value {
        flex: 1;
    }
    :host([variant='headless']) .headless-value::slotted(*),
    :host([variant='marquee']) .headless-value::slotted(*),
    :host([variant='faq']) .headless-value::slotted(*),
    :host([variant='banner-blade']) .headless-value::slotted(*) {
        display: inline;
    }
    :host([variant='headless'])
        .headless-value[data-slot='footer']::slotted(div),
    :host([variant='marquee'])
        .headless-value[data-slot='footer']::slotted(div),
    :host([variant='faq']) .headless-value[data-slot='footer']::slotted(div),
    :host([variant='banner-blade'])
        .headless-value[data-slot='footer']::slotted(div) {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--consonant-merch-spacing-xs, 8px);
    }
    :host([variant='headless']) .headless-section,
    :host([variant='marquee']) .headless-section,
    :host([variant='faq']) .headless-section,
    :host([variant='banner-blade']) .headless-section {
        font-size: 0.75em;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--spectrum-gray-600);
        padding-top: 4px;
    }
    :host([variant='headless']) .headless-backgrounds-toggle,
    :host([variant='marquee']) .headless-backgrounds-toggle,
    :host([variant='faq']) .headless-backgrounds-toggle,
    :host([variant='banner-blade']) .headless-backgrounds-toggle {
        margin-left: var(--consonant-merch-spacing-xs, 8px);
        font-size: 0.75em;
        color: var(--spectrum-blue-700);
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        text-decoration: underline;
    }
    :host([variant='headless']) .headless-backgrounds-detail,
    :host([variant='marquee']) .headless-backgrounds-detail,
    :host([variant='faq']) .headless-backgrounds-detail,
    :host([variant='banner-blade']) .headless-backgrounds-detail {
        flex-direction: column;
        padding-left: var(--consonant-merch-spacing-l, 24px);
    }
    :host([variant='headless']) .headless-backgrounds-detail.hidden,
    :host([variant='marquee']) .headless-backgrounds-detail.hidden,
    :host([variant='faq']) .headless-backgrounds-detail.hidden,
    :host([variant='banner-blade']) .headless-backgrounds-detail.hidden {
        display: none;
    }
    :host([variant='headless']) .headless-backgrounds-detail-row,
    :host([variant='marquee']) .headless-backgrounds-detail-row,
    :host([variant='faq']) .headless-backgrounds-detail-row,
    :host([variant='banner-blade']) .headless-backgrounds-detail-row {
        display: flex;
        gap: var(--consonant-merch-spacing-xs, 8px);
        padding: var(--consonant-merch-spacing-xxs, 4px) 0;
    }
    :host([variant='headless'])
        .headless-backgrounds-detail-row
        .headless-value
        img,
    :host([variant='marquee'])
        .headless-backgrounds-detail-row
        .headless-value
        img,
    :host([variant='faq']) .headless-backgrounds-detail-row .headless-value img,
    :host([variant='banner-blade'])
        .headless-backgrounds-detail-row
        .headless-value
        img {
        width: 100%;
        max-height: var(--consonant-merch-card-bg-img-height);
        object-fit: contain;
    }
`;

/** AEM fragment field → slot mapping so hydrate() can populate all Headless slots. */
export const HEADLESS_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    title: { tag: 'p', slot: 'heading-xs' },
    cardTitle: { tag: 'p', slot: 'heading-xs' },
    subtitle: { tag: 'p', slot: 'body-xxs' },
    description: { tag: 'div', slot: 'body-xs' },
    promoText: { tag: 'p', slot: 'promo-text' },
    shortDescription: { tag: 'p', slot: 'short-description' },
    callout: { tag: 'div', slot: 'callout-content' },
    quantitySelect: { tag: 'div', slot: 'quantity-select' },
    whatsIncluded: { tag: 'div', slot: 'whats-included' },
    addonConfirmation: { tag: 'div', slot: 'addon-confirmation' },
    badge: { tag: 'div', slot: 'badge' },
    trialBadge: { tag: 'div', slot: 'trial-badge' },
    prices: { tag: 'p', slot: 'prices' },
    backgroundImage: { tag: 'div', slot: 'bg-image' },
    ctas: { slot: 'footer', size: 'm' },
    addon: true,
    secureLabel: true,
    borderColor: { attribute: 'border-color' },
    backgroundColor: { attribute: 'background-color' },
    size: [],
    mnemonics: { size: 'm' },
    customFields: { tag: 'div', slot: 'custom-fields' },
};

/**
 * Slot name to display label for Headless variant (label + value only, no card).
 * Only includes fields that are authorable in the merch-card editor to avoid confusion.
 * Labels match the editor (merch-card-editor.js). Order defines render order.
 */
const HEADLESS_FIELDS = [
    { slot: 'bg-image', label: 'Background Image' },
    { slot: 'badge', label: 'Badge' },
    { slot: 'icons', label: 'Mnemonic icon' },
    { slot: 'heading-xs', label: 'Title' },
    { slot: 'body-xxs', label: 'Subtitle' },
    { slot: 'body-xs', label: 'Product description' },
    { slot: 'promo-text', label: 'Promo Text' },
    { slot: 'callout-content', label: 'Callout text' },
    { slot: 'short-description', label: 'Short Description' },
    { slot: 'trial-badge', label: 'Trial Badge' },
    { slot: 'prices', label: 'Product price' },
    { slot: 'quantity-select', label: 'Quantity select' },
    { slot: 'addon', label: 'Addon' },
    { slot: 'whats-included', label: "What's included" },
    { slot: 'addon-confirmation', label: 'Addon confirmation' },
    { slot: 'footer', label: 'CTAs' },
];

// The default is desktop background.
export const BACKGROUNDS_DETAIL_BREAKPOINTS = ['tablet', 'mobile'];

export function renderBackgroundsToggleButton() {
    return `
        <button type="button" class="headless-backgrounds-toggle">
            See all backgrounds
        </button>
    `;
}

function breakpointLabel(breakpoint) {
    return `Background ${breakpoint[0].toUpperCase()}${breakpoint.slice(1)}`;
}

export function renderBackgroundsDetailRow() {
    const rows = BACKGROUNDS_DETAIL_BREAKPOINTS.map(
        (breakpoint) =>
            `
                <div class="headless-backgrounds-detail-row">
                    <span class="headless-label"
                        >${breakpointLabel(breakpoint)}</span
                    >
                    <span
                        class="headless-value"
                        data-backgrounds-breakpoint="${breakpoint}"
                    ></span>
                </div>
            `,
    ).join('');
    return `
        <div class="headless-row headless-backgrounds-detail hidden">
            ${rows}
        </div>
    `;
}

/** Wires the toggle button and backgrounds slot rendered by the helpers above. */
export function bindBackgroundsPreview(root, { toggle, refresh }) {
    root.querySelector('.headless-backgrounds-toggle')?.addEventListener(
        'click',
        toggle,
    );
    root.querySelector('slot[name="backgrounds"]')?.addEventListener(
        'slotchange',
        refresh,
    );
}

/** AEM fragment field → slot mapping so hydrate() can populate all Marquee slots. */
export const MARQUEE_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    image: { tag: 'picture', slot: 'image' },
    backgrounds: { tag: 'picture', slot: 'backgrounds' },
    title: { tag: 'p', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    shortDescription: { tag: 'p', slot: 'short-description' },
    prices: { tag: 'p', slot: 'prices' },
    ctas: { slot: 'footer', size: 'm' },
};

/**
 * Slot name to display label for Marquee variant (label + value only, no card).
 * Labels match the editor (merch-card-editor.js). Order defines render order.
 */
const MARQUEE_FIELDS = [
    { slot: 'image', label: 'Image' },
    { slot: 'backgrounds', label: 'Background' },
    { slot: 'heading-xs', label: 'Title' },
    { slot: 'body-xs', label: 'Product description' },
    { slot: 'short-description', label: 'Short Description' },
    { slot: 'prices', label: 'Product price' },
    { slot: 'footer', label: 'CTAs' },
];

/**
 * AEM fragment field → slot mapping so hydrate() can populate all FAQ slots.
 * Reuses generic fields available on the shared card model (prices, description,
 * shortDescription, callout), relabeled for FAQ authoring via `editorLabel` (see
 * merch-card-editor.js) instead of introducing new content-model fields. `title` and
 * `promoText` are deliberately excluded: their underlying AEM model fields cap the
 * *serialized HTML* (not visible text) at 500 characters, which formatted FAQ answers
 * can exceed even at modest visible length.
 */
export const FAQ_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    prices: { tag: 'p', slot: 'prices' },
    description: {
        tag: 'div',
        slot: 'body-xs',
        editorLabel: 'FAQ answer 1',
    },
    shortDescription: {
        tag: 'p',
        slot: 'short-description',
        editorLabel: 'FAQ answer 2',
    },
    callout: {
        tag: 'div',
        slot: 'callout-content',
        editorLabel: 'FAQ answer 3',
    },
};

/**
 * Slot name to display label for FAQ variant (label + value only, no card).
 * Labels match the editor (merch-card-editor.js). Order defines render order.
 */
const FAQ_FIELDS = [
    { slot: 'prices', label: 'Product price' },
    { slot: 'body-xs', label: 'FAQ answer 1' },
    { slot: 'short-description', label: 'FAQ answer 2' },
    { slot: 'callout-content', label: 'FAQ answer 3' },
];

/**
 * AEM fragment field → slot mapping so hydrate() can populate all Banner/Blade
 * slots. Covers both the Sticky Banner and Blade blocks, which share the same
 * content shape (title + description + CTAs) and are authored once under this single variant.
 */
export const BANNER_BLADE_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    image: { tag: 'picture', slot: 'image' },
    backgrounds: { tag: 'picture', slot: 'backgrounds' },
    title: { tag: 'p', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    ctas: { slot: 'footer', size: 'm' },
};

/**
 * Slot name to display label for Banner/Blade variant (label + value
 * only, no card). Labels match the editor (merch-card-editor.js). Order defines render order.
 */
const BANNER_BLADE_FIELDS = [
    { slot: 'image', label: 'Image' },
    { slot: 'backgrounds', label: 'Background' },
    { slot: 'heading-xs', label: 'Title' },
    { slot: 'body-xs', label: 'Description' },
    { slot: 'footer', label: 'CTAs' },
];

export function define({ TemplateLayout, escapeHTML, extractBackgroundUrl }) {
    class Headless extends TemplateLayout {
        constructor(card) {
            super(card);
        }

        getGlobalCSS() {
            return CSS;
        }

        renderLayout() {
            const customFieldEls = [
                ...this.card.querySelectorAll('[slot^="custom-field-"]'),
            ];
            return `
            <div class="headless">
                ${HEADLESS_FIELDS.map(
                    ({ slot, label }) => `
                        <div class="headless-row">
                            <span class="headless-label">${label}</span>
                            <span class="headless-value" data-slot="${slot}">
                                <slot name="${slot}"></slot>
                            </span>
                        </div>
                    `,
                ).join('')}
                ${
                    customFieldEls.length
                        ? `
                          <div class="headless-row">
                              <span class="headless-label headless-section">
                                  Custom fields
                              </span>
                          </div>
                          ${customFieldEls
                              .map(
                                  (el, i) => `
                                  <div class="headless-row">
                                      <span class="headless-label">
                                          ${escapeHTML(
                                              el.dataset.label ||
                                                  `Custom field ${i + 1}`,
                                          )}
                                      </span>
                                      <span class="headless-value">
                                          <slot
                                              name="${escapeHTML(el.getAttribute('slot'))}"
                                          ></slot>
                                      </span>
                                  </div>
                              `,
                              )
                              .join('')}
                      `
                        : ''
                }
                ${
                    this.card.secureLabel
                        ? `
                          <div class="headless-row">
                              <span class="headless-label">Secure label</span>
                              <span class="headless-value">
                                  ${this.secureLabel}
                              </span>
                          </div>
                      `
                        : ''
                }
            </div>
        `;
        }

        static templateStyle = HEADLESS_FAMILY_STYLE;
    }

    function populateBackgroundsDetail(card, detail) {
        const picture = card.querySelector('[slot="backgrounds"]');
        const inner = picture?.innerHTML ?? '';
        BACKGROUNDS_DETAIL_BREAKPOINTS.forEach((breakpoint) => {
            const valueEl = detail.querySelector(
                `[data-backgrounds-breakpoint="${breakpoint}"]`,
            );
            if (!valueEl) return;
            valueEl.replaceChildren();
            const url = extractBackgroundUrl(inner, breakpoint);
            if (!url) {
                valueEl.textContent = '—';
                return;
            }
            const img = document.createElement('img');
            img.loading = 'lazy';
            img.alt = '';
            img.src = url;
            valueEl.append(img);
        });
    }

    /** Builds the click handler for a variant's "See all backgrounds" toggle.
     *  `getCard` is a thunk so the handler always reads the variant's current
     *  `this.card` rather than capturing it once at construction time. The
     *  default row (desktop) stays visible at all times; the detail only adds
     *  tablet and mobile. */
    function makeToggleBackgroundsDetail(getCard) {
        return function toggleBackgroundsDetail(e) {
            const card = getCard();
            const detail = card.shadowRoot?.querySelector(
                '.headless-backgrounds-detail',
            );
            if (!detail) return;
            const expanding = detail.classList.contains('hidden');
            if (expanding) populateBackgroundsDetail(card, detail);
            detail.classList.toggle('hidden', !expanding);
            e.target.textContent = expanding
                ? 'Show default only'
                : 'See all backgrounds';
        };
    }

    /** Builds a `slotchange` handler that keeps an expanded detail in sync when
     *  the backgrounds slot is re-hydrated (e.g. after a Studio edit or restore). */
    function makeRefreshBackgroundsDetail(getCard) {
        return function refreshBackgroundsDetail() {
            const card = getCard();
            const detail = card.shadowRoot?.querySelector(
                '.headless-backgrounds-detail',
            );
            if (!detail || detail.classList.contains('hidden')) return;
            populateBackgroundsDetail(card, detail);
        };
    }

    class Marquee extends TemplateLayout {
        constructor(card) {
            super(card);
        }

        getGlobalCSS() {
            return CSS;
        }

        toggleBackgroundsDetail = makeToggleBackgroundsDetail(() => this.card);

        refreshBackgroundsDetail = makeRefreshBackgroundsDetail(
            () => this.card,
        );

        renderLayout() {
            const rows = MARQUEE_FIELDS.map(({ slot, label }) => {
                const isBackgrounds = slot === 'backgrounds';
                return `
                <div class="headless-row">
                    <span class="headless-label">${escapeHTML(label)}</span>
                    <span class="headless-value" data-slot="${escapeHTML(slot)}">
                        <slot name="${escapeHTML(slot)}"></slot>
                        ${isBackgrounds ? ` ${renderBackgroundsToggleButton()}` : ''}
                    </span>
                </div>
                ${isBackgrounds ? renderBackgroundsDetailRow() : ''}
            `;
            }).join('');
            const secureLabel = this.card.secureLabel
                ? `
                  <div class="headless-row">
                      <span class="headless-label">Secure label</span>
                      <span class="headless-value">
                          ${this.secureLabel}
                      </span>
                  </div>
              `
                : '';
            return `
            <div class="headless">
                ${rows}
                ${secureLabel}
            </div>
        `;
        }

        bindEvents(root) {
            bindBackgroundsPreview(root, {
                toggle: this.toggleBackgroundsDetail,
                refresh: this.refreshBackgroundsDetail,
            });
        }

        static templateStyle = HEADLESS_FAMILY_STYLE;
    }

    class Faq extends TemplateLayout {
        constructor(card) {
            super(card);
        }

        getGlobalCSS() {
            return CSS;
        }

        renderLayout() {
            return `
            <div class="headless">
                ${FAQ_FIELDS.map(
                    ({ slot, label }) => `
                        <div class="headless-row">
                            <span class="headless-label">${label}</span>
                            <span class="headless-value">
                                <slot name="${slot}"></slot>
                            </span>
                        </div>
                    `,
                ).join('')}
            </div>
        `;
        }

        static templateStyle = HEADLESS_FAMILY_STYLE;
    }

    class BannerBlade extends TemplateLayout {
        constructor(card) {
            super(card);
        }

        getGlobalCSS() {
            return CSS;
        }

        toggleBackgroundsDetail = makeToggleBackgroundsDetail(() => this.card);

        refreshBackgroundsDetail = makeRefreshBackgroundsDetail(
            () => this.card,
        );

        renderLayout() {
            const rows = BANNER_BLADE_FIELDS.map(({ slot, label }) => {
                const isBackgrounds = slot === 'backgrounds';
                return `
                <div class="headless-row">
                    <span class="headless-label">${escapeHTML(label)}</span>
                    <span class="headless-value" data-slot="${escapeHTML(slot)}">
                        <slot name="${escapeHTML(slot)}"></slot>
                        ${isBackgrounds ? ` ${renderBackgroundsToggleButton()}` : ''}
                    </span>
                </div>
                ${isBackgrounds ? renderBackgroundsDetailRow() : ''}
            `;
            }).join('');
            return `
            <div class="headless">
                ${rows}
            </div>
        `;
        }

        bindEvents(root) {
            bindBackgroundsPreview(root, {
                toggle: this.toggleBackgroundsDetail,
                refresh: this.refreshBackgroundsDetail,
            });
        }

        static templateStyle = HEADLESS_FAMILY_STYLE;
    }
    return {
        headless: {
            class: Headless,
            fragmentMapping: HEADLESS_AEM_FRAGMENT_MAPPING,
            style: Headless.templateStyle,
        },
        marquee: {
            class: Marquee,
            fragmentMapping: MARQUEE_AEM_FRAGMENT_MAPPING,
            style: Marquee.templateStyle,
        },
        faq: {
            class: Faq,
            fragmentMapping: FAQ_AEM_FRAGMENT_MAPPING,
            style: Faq.templateStyle,
        },
        'banner-blade': {
            class: BannerBlade,
            fragmentMapping: BANNER_BLADE_AEM_FRAGMENT_MAPPING,
            style: BannerBlade.templateStyle,
        },
    };
}
