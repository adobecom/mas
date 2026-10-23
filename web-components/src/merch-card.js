import { styles } from './merch-card.css.js';
import './merch-icon.js';
import './merch-gradient.js';
import './merch-addon.js';
import {
    getVariantLayout,
    registerVariant,
    getFragmentMapping,
    getCollectionOptions,
} from './variants/variants.js';

import './global.css.js';
import './merch-badge.js';
import './merch-mnemonic-list.js';
import './merch-whats-included.js';
import {
    EVENT_AEM_LOAD,
    EVENT_MERCH_OFFER_SELECT_READY,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    EVENT_MAS_READY,
    EVENT_AEM_ERROR,
    EVENT_MAS_ERROR,
    SELECTOR_MAS_CHECKOUT_LINK,
    SELECTOR_MAS_ELEMENT,
    SELECTOR_MAS_INLINE_PRICE,
    MARK_START_SUFFIX,
    MARK_DURATION_SUFFIX,
    EVENT_MERCH_ADDON_AND_QUANTITY_UPDATE,
    EVENT_MERCH_CARD_QUANTITY_CHANGE,
    FF_DEFAULTS,
    MERCH_CARD_LOAD_TIMEOUT,
    TEMPLATE_PRICE_LEGAL,
} from './constants.js';
import { VariantLayout } from './variants/variant-layout.js';
import { hydrate, ANALYTICS_SECTION_ATTR } from './hydrate.js';
import {
    getService,
    printMeasure,
    setForegroundTimeout,
    clearForegroundTimeout,
} from './utils.js';
import { toPromotionCodes } from './utilities.js';
import { hostOsi } from './plan-type-text.js';
import {
    applyContextPromotionCode,
    applyDisplayAnnualDefault,
    applyHideStPriceLabels,
    mergePriceLiterals,
    registerContextOptionsProviders,
} from './mas-context.js';

const MERCH_CARD = 'merch-card';

const MARK_MERCH_CARD_PREFIX = 'merch-card:';

const VARIANTS_WITH_HEIGHT_SYNC = [
    'full-pricing-express',
    'simplified-pricing-express',
];

const VARIANTS_WITH_WIDTH_BADGE_SYNC = [
    'segment',
    'product',
    'plans-education',
    'mini-compare-chart-mweb',
];

function priceOptionsProvider(element, options) {
    const card = element.closest(MERCH_CARD);
    if (!card) return options;
    mergePriceLiterals(card.priceLiterals, options);
    applyHideStPriceLabels(element, options);
    applyContextPromotionCode(card, options);
    if (card.aemFragment) {
        options[FF_DEFAULTS] = true;
    }
    card.variantLayout?.priceOptionsProvider?.(element, options);
    if (element.dataset.template === TEMPLATE_PRICE_LEGAL) {
        options.displayDot ??= card.variantLayout?.legalDisplayDot ?? true;
    }
    applyDisplayAnnualDefault(card, options);
}

function checkoutOptionsProvider(element, options) {
    const card = element.closest(MERCH_CARD);
    if (!card) return options;
    applyContextPromotionCode(card, options);
}

function registerOptionsProviders(masCommerceService) {
    registerContextOptionsProviders(
        masCommerceService,
        priceOptionsProvider,
        checkoutOptionsProvider,
    );
}

const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        const card = entry.target;
        if (VARIANTS_WITH_HEIGHT_SYNC.includes(card.variant)) {
            if (card.clientHeight === 0) return;
            intersectionObserver.unobserve(card);
            card.requestUpdate();
            return;
        }
        if (VARIANTS_WITH_WIDTH_BADGE_SYNC.includes(card.variant)) {
            if (entry.boundingClientRect.width === 0) return;
            if (
                (card.variant === 'product' ||
                    card.variant === 'mini-compare-chart-mweb' ||
                    card.variant === 'plans-education') &&
                card.querySelector('merch-icon[slot="icons"]')
            ) {
                intersectionObserver.unobserve(card);
                return;
            }

            const cardWidth = card.getBoundingClientRect().width;
            const badgeEl = card.querySelector('[slot="badge"] > merch-badge');
            const badgeWidth = badgeEl?.getBoundingClientRect().width || 0;
            if (cardWidth === 0 || !badgeEl) {
                intersectionObserver.unobserve(card);
                return;
            }
            card.style.setProperty(
                '--consonant-merch-card-heading-xs-max-width',
                `${Math.round(cardWidth - badgeWidth - 16)}px`,
            );
            intersectionObserver.unobserve(card);
        }
    });
});

const ATTRIBUTES = {
    id: 'id',
    name: 'name',
    variant: 'variant',
    size: 'size',
    badgeColor: 'badge-color',
    borderColor: 'border-color',
    backgroundColor: 'background-color',
    badgeBackgroundColor: 'badge-background-color',
    backgroundImage: 'background-image',
    badgeText: 'badge-text',
    actionMenu: 'action-menu',
    actionMenuLabel: 'action-menu-label',
    customHr: 'custom-hr',
    consonant: 'consonant',
    failed: 'failed',
    spectrum: 'spectrum',
    detailBg: 'detail-bg',
    secureLabel: 'secure-label',
    checkboxLabel: 'checkbox-label',
    addonTitle: 'addon-title',
    selected: 'aria-selected',
    storageOption: 'storage',
    planType: 'plan-type',
    heightSync: 'height-sync',
    stockOfferOsis: 'stock-offer-osis',
    filters: 'filters',
    types: 'types',
    analyticsId: ANALYTICS_SECTION_ATTR,
    loading: 'loading',
};

const PROPERTY_BY_ATTRIBUTE = Object.fromEntries(
    Object.entries(ATTRIBUTES).map(([property, attribute]) => [
        attribute,
        property,
    ]),
);

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

function setStringAttribute(element, name, value) {
    if (value == null) element.removeAttribute(name);
    else element.setAttribute(name, value);
}

function setBooleanAttribute(element, name, value) {
    element.toggleAttribute(name, Boolean(value));
}

function parseFilters(value) {
    if (!value) return {};
    return Object.fromEntries(
        value.split(',').map((filter) => {
            const [key, order, size] = filter.split(':');
            const number = Number(order);
            return [key, { order: isNaN(number) ? undefined : number, size }];
        }),
    );
}

function serializeFilters(filters) {
    return Object.entries(filters ?? {})
        .map(([key, { order, size }]) =>
            [key, order, size].filter((v) => v != undefined).join(':'),
        )
        .join(',');
}

function parseStockOfferOsis(value) {
    if (!value) return undefined;
    const [PUF, ABM, M2M] = value.split(',');
    return { PUF, ABM, M2M };
}

let idCounter = 0;

/**
 * Merch card custom element, written as a plain HTMLElement.
 *
 * Attributes are the source of truth for string and boolean properties, so
 * setting a property reflects to its attribute and vice versa. Any change
 * schedules one batched update in a microtask (requestUpdate), which renders
 * the variant layout markup into the shadow root. updateComplete resolves
 * when the scheduled update has run.
 */
export class MerchCard extends HTMLElement {
    static get observedAttributes() {
        return Object.values(ATTRIBUTES);
    }

    static styles = styles;

    static registerVariant = registerVariant;

    static getCollectionOptions = getCollectionOptions;

    static getFragmentMapping = getFragmentMapping;

    #contextPromotionCode;

    get contextPromotionCode() {
        return this.#contextPromotionCode;
    }

    set contextPromotionCode(value) {
        this.#contextPromotionCode = value;
        if (value) {
            this.setAttribute('data-promotion-code', value);
        } else {
            this.removeAttribute('data-promotion-code');
        }
    }

    #cardOsi;

    get cardOsi() {
        return this.#cardOsi;
    }

    set cardOsi(value) {
        this.#cardOsi = value;
        const attrValue = Array.isArray(value) ? value.join(',') : value;
        if (attrValue) {
            this.setAttribute('data-card-osi', attrValue);
        } else {
            this.removeAttribute('data-card-osi');
        }
    }

    #durationMarkName;
    #internalId; // internal unique card identifier
    #log;
    #service;
    #startMarkName;
    #resolveHydration;
    #hydrationPromise = new Promise((resolve) => {
        this.#resolveHydration = resolve;
    });

    #filters = {};
    #stockOfferOsis;
    #settings;
    #priceLiterals;
    #markup;
    #changed = new Set();
    #heightSync;
    #updatePending = false;
    #updatePromise;
    #resolveConnected;
    #connected = new Promise((resolve) => {
        this.#resolveConnected = resolve;
    });

    /**
     * Compat version of the card.
     * @type {number}
     */
    compatVersion;

    customerSegment;
    marketSegment;
    merchOffer;
    addonOffers;
    /**
     * @type {VariantLayout}
     */
    variantLayout;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.handleAemFragmentEvents = this.handleAemFragmentEvents.bind(this);
        this.handleMasReady = this.handleMasReady.bind(this);
        this.handleMerchOfferSelectReady =
            this.handleMerchOfferSelectReady.bind(this);
        // Lit reflected the filters and types defaults on first render.
        this.#changed.add('types');
        this.requestUpdate('filters');
    }

    get id() {
        return this.getAttribute('id');
    }

    set id(value) {
        setStringAttribute(this, 'id', value);
    }

    get name() {
        return this.getAttribute('name');
    }

    set name(value) {
        setStringAttribute(this, 'name', value);
    }

    get variant() {
        return this.getAttribute('variant');
    }

    set variant(value) {
        setStringAttribute(this, 'variant', value);
    }

    get size() {
        return this.getAttribute('size');
    }

    set size(value) {
        setStringAttribute(this, 'size', value);
    }

    get badgeColor() {
        return this.getAttribute('badge-color');
    }

    set badgeColor(value) {
        setStringAttribute(this, 'badge-color', value);
    }

    get borderColor() {
        return this.getAttribute('border-color');
    }

    set borderColor(value) {
        setStringAttribute(this, 'border-color', value);
    }

    get backgroundColor() {
        return this.getAttribute('background-color');
    }

    set backgroundColor(value) {
        setStringAttribute(this, 'background-color', value);
    }

    get badgeBackgroundColor() {
        return this.getAttribute('badge-background-color');
    }

    set badgeBackgroundColor(value) {
        setStringAttribute(this, 'badge-background-color', value);
    }

    get backgroundImage() {
        return this.getAttribute('background-image');
    }

    set backgroundImage(value) {
        setStringAttribute(this, 'background-image', value);
    }

    get badgeText() {
        return this.getAttribute('badge-text');
    }

    set badgeText(value) {
        setStringAttribute(this, 'badge-text', value);
    }

    get actionMenu() {
        return this.hasAttribute('action-menu');
    }

    set actionMenu(value) {
        setBooleanAttribute(this, 'action-menu', value);
    }

    get actionMenuLabel() {
        return this.getAttribute('action-menu-label');
    }

    set actionMenuLabel(value) {
        setStringAttribute(this, 'action-menu-label', value);
    }

    get customHr() {
        return this.hasAttribute('custom-hr');
    }

    set customHr(value) {
        setBooleanAttribute(this, 'custom-hr', value);
    }

    get consonant() {
        return this.hasAttribute('consonant');
    }

    set consonant(value) {
        setBooleanAttribute(this, 'consonant', value);
    }

    get failed() {
        return this.hasAttribute('failed');
    }

    set failed(value) {
        setBooleanAttribute(this, 'failed', value);
    }

    /** css|swc */
    get spectrum() {
        return this.getAttribute('spectrum') ?? 'css';
    }

    set spectrum(value) {
        setStringAttribute(this, 'spectrum', value);
    }

    get detailBg() {
        return this.getAttribute('detail-bg');
    }

    set detailBg(value) {
        setStringAttribute(this, 'detail-bg', value);
    }

    get secureLabel() {
        return this.getAttribute('secure-label');
    }

    set secureLabel(value) {
        setStringAttribute(this, 'secure-label', value);
    }

    get checkboxLabel() {
        return this.getAttribute('checkbox-label');
    }

    set checkboxLabel(value) {
        setStringAttribute(this, 'checkbox-label', value);
    }

    get addonTitle() {
        return this.getAttribute('addon-title');
    }

    set addonTitle(value) {
        setStringAttribute(this, 'addon-title', value);
    }

    get selected() {
        return this.hasAttribute('aria-selected');
    }

    set selected(value) {
        setBooleanAttribute(this, 'aria-selected', value);
    }

    get storageOption() {
        return this.getAttribute('storage');
    }

    set storageOption(value) {
        setStringAttribute(this, 'storage', value);
    }

    get planType() {
        return this.getAttribute('plan-type');
    }

    set planType(value) {
        setStringAttribute(this, 'plan-type', value);
    }

    /** Undefined unless set; only an explicit `false` opts out of height sync. */
    get heightSync() {
        return this.#heightSync;
    }

    set heightSync(value) {
        if (value === this.#heightSync) return;
        this.#heightSync = value;
        this.requestUpdate('heightSync');
    }

    get types() {
        return this.getAttribute('types') ?? '';
    }

    set types(value) {
        setStringAttribute(this, 'types', value);
    }

    get analyticsId() {
        return this.getAttribute(ANALYTICS_SECTION_ATTR);
    }

    set analyticsId(value) {
        setStringAttribute(this, ANALYTICS_SECTION_ATTR, value);
    }

    get loading() {
        return this.getAttribute('loading') ?? 'lazy';
    }

    set loading(value) {
        setStringAttribute(this, 'loading', value);
    }

    get filters() {
        return this.#filters;
    }

    set filters(value) {
        this.#filters = value ?? {};
        const serialized = serializeFilters(this.#filters);
        if (this.getAttribute('filters') !== serialized) {
            this.setAttribute('filters', serialized);
        }
        this.requestUpdate('filters');
    }

    get stockOfferOsis() {
        return this.#stockOfferOsis;
    }

    set stockOfferOsis(value) {
        this.#stockOfferOsis = value;
        this.requestUpdate('stockOfferOsis');
    }

    get settings() {
        return this.#settings;
    }

    set settings(value) {
        this.#settings = value;
        this.requestUpdate('settings');
    }

    get priceLiterals() {
        return this.#priceLiterals;
    }

    set priceLiterals(value) {
        this.#priceLiterals = value;
        this.requestUpdate('priceLiterals');
    }

    /** Re-applies properties set on the element before it was upgraded. */
    #upgradeProperties() {
        for (const property of [
            ...Object.keys(ATTRIBUTES),
            'settings',
            'priceLiterals',
        ]) {
            if (!Object.hasOwn(this, property)) continue;
            const value = this[property];
            delete this[property];
            this[property] = value;
        }
    }

    attributeChangedCallback(name, oldValue, value) {
        if (oldValue === value) return;
        const property = PROPERTY_BY_ATTRIBUTE[name];
        if (property === 'filters') {
            if (value !== serializeFilters(this.#filters)) {
                this.#filters = parseFilters(value);
            }
        } else if (property === 'stockOfferOsis') {
            this.#stockOfferOsis = parseStockOfferOsis(value);
        } else if (property === 'heightSync') {
            this.#heightSync = value !== null;
        }
        this.requestUpdate(property);
    }

    /**
     * Schedules a render in a microtask; repeated calls are batched.
     * @param {string} [property] name of the changed property
     */
    requestUpdate(property) {
        if (property) this.#changed.add(property);
        if (this.#updatePending) return;
        this.#updatePending = true;
        this.#updatePromise = this.#enqueueUpdate();
    }

    /**
     * Resolves once the pending update has rendered.
     * @returns {Promise<boolean>}
     */
    get updateComplete() {
        return this.#updatePromise.then(() =>
            this.#updatePending ? this.updateComplete : true,
        );
    }

    async #enqueueUpdate() {
        await this.#connected;
        this.#update();
        return true;
    }

    #update() {
        const changed = this.#changed;
        this.#changed = new Set();
        this.#updatePending = false;
        if (changed.has('filters')) {
            const serialized = serializeFilters(this.#filters);
            if (this.getAttribute('filters') !== serialized) {
                this.setAttribute('filters', serialized);
            }
        }
        if (changed.has('types') && !this.hasAttribute('types')) {
            this.setAttribute('types', '');
        }
        if (changed.has('variant') || !this.variantLayout) {
            this.variantLayout?.disconnectedCallbackHook();
            this.variantLayout = getVariantLayout(this);
            this.variantLayout?.connectedCallbackHook();
        }
        this.#render();
        if (
            !this.style.getPropertyValue(
                '--consonant-merch-card-border-color',
            ) &&
            this.computedBorderColor &&
            (changed.has('badgeBackgroundColor') || changed.has('borderColor'))
        ) {
            this.style.setProperty(
                '--consonant-merch-card-border-color',
                this.computedBorderColor,
            );
        }
        if (changed.has('backgroundColor')) {
            this.style.setProperty(
                '--merch-card-custom-background-color',
                this.backgroundColor ? `var(--${this.backgroundColor})` : '',
            );
        }
        try {
            this.variantLayoutPromise =
                this.variantLayout?.postCardUpdateHook(changed);
        } catch (e) {
            this.#fail(`Error in postCardUpdateHook: ${e.message}`, {}, false);
        }
    }

    #render() {
        const visible =
            this.isConnected &&
            this.variantLayout &&
            this.style.display !== 'none';
        const markup = visible ? (this.variantLayout.renderLayout() ?? '') : '';
        if (markup === this.#markup) return;
        this.#markup = markup;
        this.shadowRoot.innerHTML = markup;
        if (visible) this.variantLayout.bindEvents?.(this.shadowRoot);
    }

    get theme() {
        return this.closest('sp-theme');
    }

    get dir() {
        return this.closest('[dir]')?.getAttribute('dir') ?? 'ltr';
    }

    get computedBorderColor() {
        if (
            ![
                'ccd-slice',
                'ccd-suggested',
                'ah-promoted-plans',
                'simplified-pricing-express',
                'full-pricing-express',
            ].includes(this.variant)
        ) {
            return this.borderColor
                ? this.borderColor
                : this.badgeBackgroundColor;
        }
        return '';
    }

    get badgeElement() {
        return this.shadowRoot.getElementById('badge');
    }

    get headingmMSlot() {
        return this.shadowRoot
            .querySelector('slot[name="heading-m"]')
            .assignedElements()[0];
    }

    get footerSlot() {
        return this.shadowRoot
            .querySelector('slot[name="footer"]')
            ?.assignedElements()[0];
    }

    get descriptionSlot() {
        return this.shadowRoot
            .querySelector('slot[name="body-xs"')
            ?.assignedElements()[0];
    }

    get descriptionSlotCompare() {
        return this.shadowRoot
            .querySelector('slot[name="body-m"')
            ?.assignedElements()[0];
    }

    get iconButton() {
        return this.querySelector(
            '[slot="callout-content"] .icon-button, [slot="short-description"] .icon-button',
        );
    }

    get price() {
        return this.headingmMSlot?.querySelector(SELECTOR_MAS_INLINE_PRICE);
    }

    get checkoutLinks() {
        return [
            ...(this.footerSlot?.querySelectorAll(SELECTOR_MAS_CHECKOUT_LINK) ??
                []),
        ];
    }

    get checkoutLinksDescription() {
        return [
            ...(this.descriptionSlot?.querySelectorAll(
                SELECTOR_MAS_CHECKOUT_LINK,
            ) ?? []),
        ];
    }

    get checkoutLinkDescriptionCompare() {
        return [
            ...(this.descriptionSlotCompare?.querySelectorAll(
                SELECTOR_MAS_CHECKOUT_LINK,
            ) ?? []),
        ];
    }

    get activeDescriptionLinks() {
        if (
            this.variant === 'mini-compare-chart' ||
            this.variant === 'mini-compare-chart-mweb'
        ) {
            return this.checkoutLinkDescriptionCompare;
        }
        return this.checkoutLinksDescription;
    }

    async toggleStockOffer({ target }) {
        if (!this.stockOfferOsis) return;
        const elements = this.checkoutLinks;
        if (elements.length === 0) return;
        for (const element of elements) {
            await element.onceSettled();
            const planType = element.value?.[0]?.planType;
            if (!planType) return;
            const stockOfferOsi = this.stockOfferOsis[planType];
            if (!stockOfferOsi) return;
            const osis = element.dataset.wcsOsi
                .split(',')
                .filter((osi) => osi !== stockOfferOsi);

            if (target.checked) {
                osis.push(stockOfferOsi);
            }
            element.dataset.wcsOsi = osis.join(',');
        }
    }

    changeHandler(event) {
        if (event.target.tagName === 'MERCH-ADDON') {
            this.toggleAddon(event.target);
        }
    }

    toggleAddon(merchAddon) {
        this.variantLayout?.toggleAddon?.(merchAddon);
        const allLinks = [
            ...this.checkoutLinks,
            ...(this.activeDescriptionLinks ?? []),
        ];
        if (allLinks.length === 0) return;

        const updateOsi = (link) => {
            const { offerType, planType } = link.value?.[0] ?? {};
            if (!offerType || !planType) return;
            const addonOsi = merchAddon.getOsi(planType, offerType);
            const osis = (link.dataset.wcsOsi || '')
                .split(',')
                .filter((osi) => osi && osi !== addonOsi);

            if (merchAddon.checked) {
                osis.push(addonOsi);
            }
            link.dataset.wcsOsi = osis.join(',');
        };
        allLinks.forEach(updateOsi);
    }

    handleQuantitySelection(event) {
        const allLinks = [
            ...this.checkoutLinks,
            ...(this.activeDescriptionLinks ?? []),
        ];
        if (allLinks.length === 0) return;

        for (const link of allLinks) {
            link.dataset.quantity = event.detail.option;
        }
    }

    get titleElement() {
        return this.querySelector(
            this.variantLayout?.headingSelector || '.card-heading',
        );
    }

    get title() {
        return this.titleElement?.textContent?.trim();
    }

    /* c8 ignore next 3 */
    get description() {
        return this.querySelector('[slot="body-xs"]')?.textContent?.trim();
    }

    /**
     * If the card is the single app, set the order for all filters to 2.
     * If not, increment the order for all filters after the second card by 1.
     * @param {*} singleApp
     */
    updateFilters(singleApp) {
        const newFilters = { ...this.filters };
        Object.keys(newFilters).forEach((key) => {
            // if single app set the order for all filters to 2.
            if (singleApp) {
                newFilters[key].order = Math.min(newFilters[key].order || 2, 2);
                return;
            }
            const value = newFilters[key].order;
            // skip first card and cards without explicit order
            if (value === 1 || isNaN(value)) return;
            newFilters[key].order = Number(value) + 1;
        });
        this.filters = newFilters;
    }

    showInfoTooltip(el, classVisible) {
        const tooltipLeft = 'tooltip-left';
        const tooltipRight = 'tooltip-right';
        if (
            window.screen.width < 600 &&
            el.getAttribute('data-tooltip')?.length > 12
        ) {
            this.iconButton.classList.remove(tooltipLeft);
            this.iconButton.classList.remove(tooltipRight);
            if (el.getBoundingClientRect().x < 100) {
                this.iconButton.classList.add(tooltipLeft);
            }
            if (el.getBoundingClientRect().x > window.screen.width - 100) {
                this.iconButton.classList.add(tooltipRight);
            }
        }
        this.iconButton.classList.add(classVisible);
    }

    handleInfoIconEvents() {
        const tooltipVisible = 'tooltip-visible';
        if (this.iconButton) {
            ['mouseenter', 'focus'].forEach((eventName) =>
                this.iconButton.addEventListener(
                    eventName,
                    (e) => this.showInfoTooltip(e.target, tooltipVisible),
                    false,
                ),
            );
            ['mouseleave', 'blur'].forEach((eventName) =>
                this.iconButton.addEventListener(
                    eventName,
                    () => this.iconButton.classList.remove(tooltipVisible),
                    false,
                ),
            );
            this.iconButton.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.iconButton.classList.remove(tooltipVisible);
                }
            });
        }
    }

    additionalModalTriggers() {
        if (!this.settings?.additionalModalTriggers) return;

        const mapping = this.variantLayout.aemFragmentMapping.title;
        this.makeElementModalTrigger(mapping?.tag, mapping?.slot);
        this.makeElementModalTrigger('merch-icon', 'icons');
    }

    handleMasReady() {
        this.handleInfoIconEvents();
        this.additionalModalTriggers();
    }

    /* c8 ignore next 3 */
    includes(text) {
        return this.textContent.match(new RegExp(text, 'i')) !== null;
    }

    connectedCallback() {
        this.#upgradeProperties();
        this.#resolveConnected();
        if (!this.#internalId) {
            this.#internalId = idCounter++;
        }
        if (!this.aemFragment) {
            this.#resolveHydration?.();
            this.#resolveHydration = undefined;
        }
        this.id ??=
            this.getAttribute('id') ??
            this.aemFragment?.getAttribute('fragment');

        const logId = this.id ?? this.#internalId;
        this.#startMarkName = `${MARK_MERCH_CARD_PREFIX}${logId}${MARK_START_SUFFIX}`;
        this.#durationMarkName = `${MARK_MERCH_CARD_PREFIX}${logId}${MARK_DURATION_SUFFIX}`;
        performance.mark(this.#startMarkName);
        this.#service = getService();
        registerOptionsProviders(this.#service);
        this.#log = this.#service.Log.module(MERCH_CARD);
        this.addEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.handleQuantitySelection,
        );
        this.addEventListener(
            EVENT_MERCH_ADDON_AND_QUANTITY_UPDATE,
            this.handleAddonAndQuantityUpdate,
        );
        this.addEventListener(
            EVENT_MERCH_OFFER_SELECT_READY,
            this.handleMerchOfferSelectReady,
        );

        // aem-fragment logic
        this.addEventListener(EVENT_AEM_ERROR, this.handleAemFragmentEvents);
        this.addEventListener(EVENT_AEM_LOAD, this.handleAemFragmentEvents);
        this.addEventListener(EVENT_MAS_READY, this.handleMasReady);
        this.addEventListener('change', this.changeHandler);

        if (this.variantLayout) {
            this.variantLayout.connectedCallbackHook();
        }

        if (!this.aemFragment) {
            setTimeout(() => this.checkReady(), 0);
        }
    }

    makeElementModalTrigger(tag, slot) {
        const isIcon = tag === 'merch-icon';
        const trigger = this.querySelector(
            `${tag}[slot="${slot}"]:not(.modal-trigger)`,
        );
        if (!trigger) return;
        const cta = this.querySelector(
            'a.button.placeholder-resolved[data-modal]',
        );
        if (!cta) return;
        trigger.setAttribute('tabindex', '0');
        trigger.addEventListener('click', (e) => {
            cta.checkoutActionHandler?.(e);
        });
        trigger.addEventListener('keypress', (e) => {
            if (e.code === 'Enter') cta.checkoutActionHandler?.(e);
        });
        trigger.classList.add('modal-trigger');
        const titleDaaLL = this.title.replace(/\s+/g, '-').toLowerCase();
        const daaLL = `${titleDaaLL}${isIcon ? '-icon' : ''}--${this.analyticsId}--card`;
        trigger.setAttribute('daa-ll', daaLL);
        trigger.setAttribute('role', 'link');
        if (isIcon) {
            trigger.setAttribute('alt', this.title);
        }
    }

    disconnectedCallback() {
        this.variantLayout?.disconnectedCallbackHook();

        this.removeEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.handleQuantitySelection,
        );
        this.removeEventListener(EVENT_AEM_ERROR, this.handleAemFragmentEvents);
        this.removeEventListener(EVENT_AEM_LOAD, this.handleAemFragmentEvents);
        this.removeEventListener(EVENT_MAS_READY, this.handleMasReady);
        this.removeEventListener('change', this.changeHandler);
        this.removeEventListener(
            EVENT_MERCH_ADDON_AND_QUANTITY_UPDATE,
            this.handleAddonAndQuantityUpdate,
        );
    }

    // custom methods
    async handleAemFragmentEvents(e) {
        if (!this.isConnected) return;
        if (e.type === EVENT_AEM_ERROR) {
            this.#fail(`AEM fragment cannot be loaded`);
        }
        if (e.type === EVENT_AEM_LOAD) {
            this.failed = false;
            if (e.target.nodeName === 'AEM-FRAGMENT') {
                const fragment = e.detail;
                try {
                    if (!this.#resolveHydration) {
                        this.#hydrationPromise = new Promise((resolve) => {
                            this.#resolveHydration = resolve;
                        });
                    }
                    await hydrate(fragment, this);
                } catch (e) {
                    this.#fail(`hydration has failed: ${e.message}`);
                } finally {
                    this.#resolveHydration?.();
                    this.#resolveHydration = undefined;
                }
                this.checkReady();
            }
        }
    }

    #fail(error, details = {}, dispatch = true) {
        if (!this.isConnected) return;
        const aemFragment = this.aemFragment;
        let fragmentId = aemFragment?.getAttribute('fragment');
        fragmentId = `[${fragmentId}]`;
        const detail = {
            ...aemFragment?.fetchInfo,
            ...this.#service.duration,
            ...details,
            message: error,
        };
        this.#log.error(`merch-card${fragmentId}: ${error}`, detail);
        this.failed = true;
        this.#resolveHydration?.();
        this.#resolveHydration = undefined;
        if (!this.#service.isPreview()) this.style.display = 'none';
        if (!dispatch) return;
        this.dispatchEvent(
            new CustomEvent(EVENT_MAS_ERROR, {
                bubbles: true,
                composed: true,
                detail,
            }),
        );
    }

    async checkReady() {
        if (!this.isConnected) return;
        if (this.failed) return;
        if (this.#hydrationPromise) {
            await this.#hydrationPromise;
            if (
                VARIANTS_WITH_HEIGHT_SYNC.includes(this.variant) ||
                VARIANTS_WITH_WIDTH_BADGE_SYNC.includes(this.variant)
            ) {
                intersectionObserver.observe(this);
            }
            this.#hydrationPromise = undefined;
        }
        if (this.variantLayoutPromise) {
            await this.variantLayoutPromise;
            this.variantLayoutPromise = undefined;
        }
        let timeoutId;
        const timeoutPromise = new Promise((resolve) => {
            timeoutId = setForegroundTimeout(
                () => resolve('timeout'),
                MERCH_CARD_LOAD_TIMEOUT,
            );
        });
        if (this.aemFragment) {
            const result = await Promise.race([
                this.aemFragment.updateComplete,
                timeoutPromise,
            ]);
            if (result === false || result === 'timeout') {
                const errorMessage =
                    result === 'timeout'
                        ? `AEM fragment was not resolved within ${MERCH_CARD_LOAD_TIMEOUT} timeout`
                        : 'AEM fragment cannot be loaded';
                clearForegroundTimeout(timeoutId);
                this.#fail(errorMessage, {}, false);
                return;
            }
        }
        const masElements = [...this.querySelectorAll(SELECTOR_MAS_ELEMENT)];
        const successPromise = Promise.all(
            masElements.map((element) => {
                const settled = element.onceSettled?.();
                if (!settled) return Promise.resolve(element);
                return settled.catch(() => element);
            }),
        ).then((elements) => {
            const active = elements.filter((el) => el.isConnected);
            return (
                active.length === 0 ||
                active.every((el) =>
                    el.classList.contains('placeholder-resolved'),
                )
            );
        });
        const result = await Promise.race([successPromise, timeoutPromise]);
        clearForegroundTimeout(timeoutId);

        if (!this.isConnected) return;

        const connectedMasElements = masElements.filter((el) => el.isConnected);
        const allResolved =
            connectedMasElements.length === 0 ||
            connectedMasElements.every((el) =>
                el.classList.contains('placeholder-resolved'),
            );

        if (allResolved) {
            this.measure = performance.measure(
                this.#durationMarkName,
                this.#startMarkName,
            );
            const detail = {
                ...this.aemFragment?.fetchInfo,
                ...this.#service.duration,
                measure: printMeasure(this.measure),
            };
            this.dispatchEvent(
                new CustomEvent(EVENT_MAS_READY, {
                    bubbles: true,
                    composed: true,
                    detail,
                }),
            );
            return this;
        } else {
            this.measure = performance.measure(
                this.#durationMarkName,
                this.#startMarkName,
            );
            const details = {
                measure: printMeasure(this.measure),
                ...this.#service.duration,
            };
            if (result === 'timeout') {
                this.#fail(
                    `Contains offers that were not resolved within ${MERCH_CARD_LOAD_TIMEOUT} timeout`,
                    details,
                );
            } else {
                const ctaFailed = connectedMasElements.some(
                    (el) =>
                        el.matches(SELECTOR_MAS_CHECKOUT_LINK) &&
                        el.classList.contains('placeholder-failed'),
                );
                this.#fail(
                    ctaFailed
                        ? `CTA has an invalid offer`
                        : `Contains unresolved offers`,
                    details,
                );
            }
        }
    }

    get aemFragment() {
        return this.querySelector('aem-fragment');
    }

    get addon() {
        return this.querySelector('merch-addon');
    }

    /* c8 ignore next 3 */
    get quantitySelect() {
        return this.querySelector('merch-quantity-select');
    }

    get addonCheckbox() {
        return this.querySelector('merch-addon');
    }

    displayFooterElementsInColumn() {
        if (!this.classList.contains('product')) return;

        const secureTransactionLabel = this.shadowRoot.querySelector(
            '.secure-transaction-label',
        );
        const checkoutLinkCtas = this.footerSlot?.querySelectorAll(
            SELECTOR_MAS_CHECKOUT_LINK,
        );
        if (checkoutLinkCtas.length === 2 && secureTransactionLabel) {
            secureTransactionLabel.parentElement.classList.add('footer-column');
        }
    }

    handleMerchOfferSelectReady() {
        if (this.offerSelect && !this.offerSelect.planType) return;
        this.displayFooterElementsInColumn();
    }

    /* c8 ignore next 3 */
    get dynamicPrice() {
        return this.querySelector('[slot="price"]');
    }

    handleAddonAndQuantityUpdate({
        detail: { id, items, productArrangementCode },
    }) {
        if (!id || !items?.length) return;
        const parentTab = this.closest('[role="tabpanel"][hidden="true"]');
        if (parentTab) return;

        const cta = this.checkoutLinks.find(
            (link) => link.getAttribute('data-modal-id') === id,
        );
        if (!cta) return;
        const pa =
            productArrangementCode ?? cta.value?.[0]?.productArrangementCode;
        if (!pa) return;
        const mainProductQuantity = items.find(
            (item) => item.productArrangementCode === pa,
        )?.quantity;
        const isAddonIncluded = !!items.find(
            (item) => item.productArrangementCode !== pa,
        );
        if (mainProductQuantity) {
            this.quantitySelect?.dispatchEvent(
                new CustomEvent(EVENT_MERCH_CARD_QUANTITY_CHANGE, {
                    detail: { quantity: mainProductQuantity },
                    bubbles: true,
                    composed: true,
                }),
            );
        }
        if (
            this.addonCheckbox &&
            this.addonCheckbox.checked !== isAddonIncluded
        ) {
            this.toggleStockOffer({ target: this.addonCheckbox });
            const checkboxEvent = new Event('change', {
                bubbles: true,
                cancelable: true,
            });

            Object.defineProperty(checkboxEvent, 'target', {
                writable: false,
                value: { checked: isAddonIncluded },
            });
            this.addonCheckbox.handleChange(checkboxEvent);
        }
    }

    get prices() {
        return Array.from(this.querySelectorAll(SELECTOR_MAS_INLINE_PRICE));
    }

    get osi() {
        return hostOsi(this);
    }

    get promoPrice() {
        if (!this.querySelector(`span.price-strikethrough`)) return;
        let price = this.querySelector(`.price.price-alternative`);
        if (!price) {
            price = this.querySelector(
                `${SELECTOR_MAS_INLINE_PRICE}[data-template="price"] > span`,
            );
        }
        if (!price) return;
        price = price.innerText;
        return price;
    }

    get #regularPrice() {
        return (
            this.querySelector(`span.price-strikethrough`) ??
            this.querySelector(
                `${SELECTOR_MAS_INLINE_PRICE}[data-template="price"] > span`,
            )
        );
    }

    get #legal() {
        return this.querySelector(
            `${SELECTOR_MAS_INLINE_PRICE}[data-template="legal"]`,
        );
    }

    get regularPrice() {
        return this.#regularPrice?.innerText;
    }

    get promotionCode() {
        const promotionCodes = [
            ...this.querySelectorAll(
                `${SELECTOR_MAS_INLINE_PRICE}[data-promotion-code],${SELECTOR_MAS_CHECKOUT_LINK}[data-promotion-code]`,
            ),
        ]
            .map((el) => toPromotionCodes(el.dataset.promotionCode)[0])
            .filter(
                (promotionCode) =>
                    ![undefined, '', 'cancel-context'].includes(promotionCode),
            );
        if (promotionCodes.length === 0) {
            return this.contextPromotionCode;
        }
        const uniqueCodes = [...new Set(promotionCodes)];
        if (uniqueCodes.length > 1) {
            this.#log?.warn(
                `Multiple different promotion codes found: ${uniqueCodes.join(', ')}`,
            );
        }
        return promotionCodes[0];
    }

    get annualPrice() {
        const price = this.querySelector(
            `${SELECTOR_MAS_INLINE_PRICE}[data-template="price"] > .price.price-annual`,
        );
        return price?.innerText;
    }

    get promoText() {
        return undefined;
    }

    get taxText() {
        return (
            (this.#legal ?? this.#regularPrice)
                ?.querySelector('span.price-tax-inclusivity')
                ?.textContent?.trim() || undefined
        );
    }

    get recurrenceText() {
        return this.#regularPrice
            ?.querySelector('span.price-recurrence')
            ?.textContent?.trim();
    }

    get unitText() {
        const unitTextSelector = '.price-unit-type';
        return (
            this.#legal?.querySelector(unitTextSelector)?.textContent?.trim() ??
            this.#regularPrice
                ?.querySelector(unitTextSelector)
                ?.textContent?.trim() ??
            this.querySelector(unitTextSelector)?.textContent?.trim() ??
            undefined
        );
    }

    get planTypeText() {
        return this.querySelector(
            '[is="inline-price"][data-template="legal"] span.price-plan-type',
        )?.textContent?.trim();
    }

    get seeTermsInfo() {
        const seeTerms = this.querySelector('a[is="upt-link"]');
        if (!seeTerms) return undefined;
        return this.#getCta(seeTerms);
    }

    get renewalText() {
        return this.querySelector('span.renewal-text')?.textContent?.trim();
    }

    get promoDurationText() {
        return this.querySelector(
            'span.promo-duration-text',
        )?.textContent?.trim();
    }

    get ctas() {
        const ctas = this.querySelector(
            '[slot="ctas"], [slot="footer"]',
        )?.querySelectorAll(`${SELECTOR_MAS_CHECKOUT_LINK}, a`);
        return Array.from(ctas ?? []);
    }

    #getCta(element) {
        if (!element) return undefined;
        return {
            text: element.innerText.trim(),
            analyticsId: element.dataset.analyticsId,
            href: element.getAttribute('href') ?? element.dataset.href,
        };
    }

    get primaryCta() {
        return this.#getCta(
            this.ctas.find(
                (cta) =>
                    cta.variant === 'accent' ||
                    cta.matches('.spectrum-Button--accent,.con-button.blue'),
            ),
        );
    }

    get secondaryCta() {
        return this.#getCta(
            this.ctas.find(
                (cta) =>
                    cta.variant !== 'accent' &&
                    !cta.matches('.spectrum-Button--accent,.con-button.blue'),
            ),
        );
    }
}

customElements.define(MERCH_CARD, MerchCard);
