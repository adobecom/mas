const URL_SEGMENT_ALIASES = {
    jp: { lang: 'ja' },
    kr: { lang: 'ko' },
    no: { lang: 'nb' },
    tw: { lang: 'zh', country: 'TW' },
    hk: { lang: 'zh', country: 'HK' },
};

const SELECTOR_CARD = 'merch-card, merch-card-collection';

// Mirrors SELECTOR_MAS_INLINE_PRICE / SELECTOR_MAS_CHECKOUT_LINK in web-components/src/constants.js.
// The extension has no build step to import that module, so these are kept in sync manually.
const SELECTOR_BARE_INLINE_PRICE = 'span[is="inline-price"][data-wcs-osi]';
const SELECTOR_BARE_CTA = 'a[is="checkout-link"][data-wcs-osi], button[is="checkout-button"][data-wcs-osi]';
const SELECTOR_BARE_ELEMENT = `${SELECTOR_BARE_INLINE_PRICE}, ${SELECTOR_BARE_CTA}`;

// <mas-field> renders one field of a fragment inline, outside any merch-card.
// It stamps fragment-id on itself once the fragment resolves, and on the commerce
// elements it renders, so both the field and its prices/CTAs trace back to a fragment.
const SELECTOR_MAS_FIELD = 'mas-field';
const SELECTOR_MAS_FIELD_CONTENT = ':scope > [data-role="mas-field-content"]';

// Everything the extension badges, so an added subtree is walked once.
const SELECTOR_DETECTABLE = `${SELECTOR_CARD}, ${SELECTOR_BARE_ELEMENT}, ${SELECTOR_MAS_FIELD}`;

// Custom elements whose upgrade means the page has something to detect. A
// commerce-only page registers mas-field and the price/CTA elements without
// ever defining merch-card, so the initial scan must proceed on any of these.
const DETECTABLE_TAGS = ['merch-card', 'mas-field', 'inline-price', 'checkout-link', 'checkout-button'];

// Resolves once any detectable element is defined, so the load-time scan does
// not stall behind merch-card on a page that never registers it.
function waitForDetectableElement(customElementsApi, tags) {
    return Promise.race(tags.map((tag) => customElementsApi.whenDefined(tag)));
}

class CardDetector {
    constructor() {
        this.detectedCards = new Map();
        this.observer = null;
        this.pageLocale = null;
        this.onCardDetectedCallbacks = [];
        this.maxCards = 200;
        this.pendingCards = [];
        this.idleHandle = null;
        this.elementIds = new WeakMap();
        this.elementCounter = 0;
        this.resizeObserver = null;
        this.hiddenElements = new Map();
    }

    onCardDetected(callback) {
        if (typeof callback !== 'function') return;
        this.onCardDetectedCallbacks.push(callback);
    }

    initialize() {
        this.detectExistingCards();
        this.startObserving();
    }

    // Milo adds mas-commerce-service after this script starts, so only its locale is kept;
    // until it appears, the URL or en_US fallback is read again on every call.
    currentLocale() {
        this.pageLocale ??= this.localeFromCommerceService();
        return this.pageLocale ?? this.getPageLocale();
    }

    getPageLocale() {
        const fromCommerceService = this.localeFromCommerceService();
        if (fromCommerceService) return fromCommerceService;

        const fromUrl = this.localeFromUrl(window.location.pathname);
        if (fromUrl) return fromUrl;

        const htmlLang = document.documentElement.lang;
        if (htmlLang) {
            const [lang, region] = htmlLang.split('-');
            if (region) return { locale: `${lang}_${region.toUpperCase()}`, country: region.toUpperCase() };
        }

        return { locale: 'en_US', country: 'US' };
    }

    getServiceConfig() {
        const commerceService = document.querySelector('mas-commerce-service');
        if (!commerceService) return {};
        return {
            masIOUrl: commerceService.getAttribute('mas-io-url') || undefined,
            wcsApiKey: commerceService.getAttribute('wcs-api-key') || undefined,
        };
    }

    localeFromCommerceService() {
        const commerceService = document.querySelector('mas-commerce-service');
        if (!commerceService) return null;
        const locale = commerceService.getAttribute('locale');
        const country = commerceService.getAttribute('country');
        const language = commerceService.getAttribute('language');
        if (locale && locale.includes('_')) {
            return { locale, country: country || locale.split('_')[1] };
        }
        if (language && country) {
            return { locale: `${language}_${country}`, country };
        }
        return null;
    }

    localeFromUrl(pathname) {
        if (!pathname) return null;
        const segments = pathname.split('/').filter(Boolean);
        if (!segments.length) return null;

        const langSegment = segments[0].toLowerCase();
        if (!/^[a-z]{2,3}(_[a-z]{2})?$/.test(langSegment)) return null;

        if (langSegment === 'langstore') return null;

        const alias = URL_SEGMENT_ALIASES[langSegment];
        const lang = alias?.lang || langSegment;
        const locales = typeof window !== 'undefined' ? window.MASLocales : null;
        const defaultLocale = locales?.getDefaultLocaleForLanguage(lang);
        if (!defaultLocale) return null;
        let country = alias?.country || defaultLocale.split('_')[1];

        const secondSegment = segments[1]?.toLowerCase();
        if (secondSegment && /^[a-z]{2}$/.test(secondSegment)) {
            const knownCountries = locales?.getKnownCountryCodes?.() ?? [];
            if (knownCountries.includes(secondSegment.toUpperCase())) {
                country = secondSegment.toUpperCase();
            }
        }

        return { locale: `${lang}_${country}`, country };
    }

    extractCardName(cardElement, aemFragment) {
        const fragmentTitle = aemFragment?.getAttribute('title');
        if (fragmentTitle) return fragmentTitle;

        if (cardElement.title) return cardElement.title;

        const fragmentId = aemFragment?.getAttribute('fragment');
        return fragmentId || 'Loading...';
    }

    async detectExistingCards() {
        if (typeof customElements === 'undefined' || customElements === null) {
            console.log('Merch At Scale Studio Extension: customElements API not available');
            return;
        }

        try {
            await waitForDetectableElement(customElements, DETECTABLE_TAGS);
        } catch (e) {
            console.log('Merch At Scale Studio Extension: no detectable element defined, skipping');
            return;
        }

        await new Promise((resolve) => requestAnimationFrame(resolve));

        const elements = document.querySelectorAll(SELECTOR_CARD);
        const cards = [];
        const collections = [];
        for (const el of elements) {
            if (el.tagName === 'MERCH-CARD') cards.push(el);
            else collections.push(el);
        }
        for (const el of [...cards, ...collections]) {
            if (this.detectedCards.size >= this.maxCards) break;
            await this.processCard(el);
        }

        const bareElements = document.querySelectorAll(SELECTOR_BARE_ELEMENT);
        for (const el of bareElements) {
            if (this.detectedCards.size >= this.maxCards) break;
            this.processBareElement(el);
        }

        const fields = document.querySelectorAll(SELECTOR_MAS_FIELD);
        for (const el of fields) {
            if (this.detectedCards.size >= this.maxCards) break;
            this.processMasField(el);
        }
    }

    startObserving() {
        const enqueue = (node) => {
            if (this.detectedCards.size + this.pendingCards.length >= this.maxCards) return;
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            if (node.matches?.(SELECTOR_DETECTABLE)) this.pendingCards.push(node);
            node.querySelectorAll?.(SELECTOR_DETECTABLE).forEach((c) => this.pendingCards.push(c));
        };

        // A mas-field renders its content asynchronously, and a text-only field (a title,
        // say) adds no element node the walk above would match. Re-queue the owning field
        // on any mutation inside it so it is picked up once its fragment resolves.
        const enqueueFieldOwner = (target) => {
            if (this.detectedCards.size + this.pendingCards.length >= this.maxCards) return;
            const owner = target?.closest?.(SELECTOR_MAS_FIELD);
            if (owner && !this.elementIds.has(owner)) this.pendingCards.push(owner);
        };

        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                m.addedNodes.forEach(enqueue);
                enqueueFieldOwner(m.target);
            });
            this.scheduleProcessing();
        });

        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    scheduleProcessing() {
        if (this.idleHandle) return;
        const idle =
            typeof requestIdleCallback === 'function'
                ? requestIdleCallback
                : (cb) => setTimeout(() => cb({ timeRemaining: () => 16 }), 16);
        this.pendingCards.sort((a, b) => {
            if (a.tagName === b.tagName) return 0;
            return a.tagName === 'MERCH-CARD' ? -1 : 1;
        });
        this.idleHandle = idle(async (deadline) => {
            this.idleHandle = null;
            while (this.pendingCards.length && deadline.timeRemaining() > 4) {
                if (this.detectedCards.size >= this.maxCards) {
                    this.pendingCards.length = 0;
                    break;
                }
                const card = this.pendingCards.shift();
                if (card.tagName === 'MERCH-CARD' || card.tagName === 'MERCH-CARD-COLLECTION') {
                    await this.processCard(card);
                } else if (card.tagName === 'MAS-FIELD') {
                    this.processMasField(card);
                } else {
                    this.processBareElement(card);
                }
            }
            if (this.pendingCards.length) this.scheduleProcessing();
        });
    }

    // An element checked while hidden (an inactive slide, another breakpoint's twin) is shown later by a
    // class or media-query change, which no childList mutation reports; its layout box resizing does.
    retryWhenShown(element, anchor = element) {
        const box = this.layoutBox(anchor);
        // A laid-out box means the element is only empty so far; its content mutation retries it.
        if (this.hasBox(box)) return;
        this.resizeObserver ??= new ResizeObserver((entries) => this.requeueShown(entries));
        if (!this.hiddenElements.has(box)) {
            this.hiddenElements.set(box, new Set());
            this.resizeObserver.observe(box);
        }
        this.hiddenElements.get(box).add(element);
    }

    requeueShown(entries) {
        for (const { target } of entries) {
            if (!this.hasBox(target)) continue;
            this.resizeObserver.unobserve(target);
            this.pendingCards.push(...this.hiddenElements.get(target));
            this.hiddenElements.delete(target);
        }
        if (this.pendingCards.length) this.scheduleProcessing();
    }

    // ResizeObserver reports nothing for inline or display:contents elements, so watch the nearest box.
    layoutBox(element) {
        let box = element;
        while (box.parentElement && ['inline', 'contents'].includes(getComputedStyle(box).display)) {
            box = box.parentElement;
        }
        return box;
    }

    async processCard(cardElement) {
        const aemFragment = cardElement.querySelector('aem-fragment');
        const fragmentId = aemFragment?.getAttribute('fragment');

        if (!fragmentId) {
            console.warn('Merch At Scale Studio Extension: Card found without fragment ID', cardElement);
            return;
        }

        if (this.detectedCards.has(fragmentId)) {
            return;
        }

        if (cardElement.updateComplete) {
            await cardElement.updateComplete;
        }

        // A hidden responsive twin shares this fragment id; skip it so the visible copy is the one
        // stored for this fragment rather than losing the dedupe race to an invisible element.
        if (!this.hasBox(cardElement)) {
            this.retryWhenShown(cardElement);
            return;
        }

        const localeInfo = this.currentLocale();
        const elementType = cardElement.tagName === 'MERCH-CARD-COLLECTION' ? 'collection' : 'card';
        const rawVariant = cardElement.variant || cardElement.getAttribute('variant');
        const variant = rawVariant || (elementType === 'collection' ? 'collection' : 'unknown');
        const promotion = this.readPromotion(cardElement, elementType);
        const cardData = {
            element: cardElement,
            anchorElement: cardElement,
            fragmentId: fragmentId,
            sourceFragmentId: fragmentId,
            variant: variant,
            elementType: elementType,
            cardName: this.extractCardName(cardElement, aemFragment),
            size: cardElement.getAttribute('size'),
            badgeColor: cardElement.getAttribute('badge-color'),
            borderColor: cardElement.getAttribute('border-color'),
            backgroundColor: cardElement.getAttribute('background-color'),
            failed: cardElement.hasAttribute('failed'),
            promotion: promotion,
            boundingRect: cardElement.getBoundingClientRect(),
            locale: localeInfo.locale,
            country: localeInfo.country,
        };

        this.detectedCards.set(fragmentId, cardData);

        this.dispatchCardDetectedEvent(cardData);
    }

    dispatchCardDetectedEvent(cardData) {
        for (const cb of this.onCardDetectedCallbacks) {
            try {
                cb(cardData);
            } catch (err) {
                console.error('Card-detected callback error:', err);
            }
        }
    }

    readPromotion(cardElement, elementType) {
        if (elementType === 'collection') return null;
        if (typeof window === 'undefined' || !window.MASPromo) return null;
        return window.MASPromo.readElementPromotion(cardElement);
    }

    classifyBareElementType(element) {
        const isAttr = (element.getAttribute('is') || '').toLowerCase();
        if (isAttr === 'inline-price') return 'price';
        if (isAttr === 'checkout-link' || isAttr === 'checkout-button') return 'cta';
        return null;
    }

    isInsideCard(element) {
        return typeof element.closest === 'function' && element.closest(SELECTOR_CARD) !== null;
    }

    /**
     * Whether an element currently renders a visible box. Adobe responsive pages ship both a
     * desktop and a mobile-web copy of a block and hide one with display:none, which leaves a
     * zero-size box. Badging that copy pins an invisible badge and makes its panel row scroll
     * nowhere, so detection skips it.
     */
    hasBox(element) {
        if (!element || typeof element.getBoundingClientRect !== 'function') return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 || rect.height > 0;
    }

    /**
     * The AEM fragment an element came from, or null when it is a standalone offer.
     * mas-field stamps fragment-id on the elements it renders, so a price survives
     * Milo unwrapping its <mas-field>; the ancestor lookup covers the wrapped case.
     */
    resolveSourceFragmentId(element) {
        const stamped = element.getAttribute?.('fragment-id');
        if (stamped) return stamped;
        const owner = element.closest?.(SELECTOR_MAS_FIELD);
        return owner?.getAttribute('fragment-id') || null;
    }

    processBareElement(element) {
        if (this.elementIds.has(element)) return;
        if (this.isInsideCard(element)) return;
        // A price or CTA rendered by a <mas-field> is detected as that field, not as a
        // standalone offer, so it carries the field's identity and gets one badge.
        if (element.closest?.(SELECTOR_MAS_FIELD)) return;

        const elementType = this.classifyBareElementType(element);
        if (!elementType) return;

        const osi = element.getAttribute('data-wcs-osi');
        if (!osi) return;

        if (!this.hasBox(element)) {
            this.retryWhenShown(element);
            return;
        }

        if (this.detectedCards.size >= this.maxCards) return;

        const id = `${elementType}-${++this.elementCounter}`;
        this.elementIds.set(element, id);

        const localeInfo = this.currentLocale();
        const promotion = this.readPromotion(element, elementType);

        const displayText = (element.textContent || '').trim();

        const elementData = {
            element,
            anchorElement: element,
            id,
            fragmentId: id,
            sourceFragmentId: this.resolveSourceFragmentId(element),
            osi,
            elementType,
            displayText,
            cardName: displayText || osi,
            promotion,
            boundingRect: element.getBoundingClientRect(),
            locale: localeInfo.locale,
            country: localeInfo.country,
        };

        this.detectedCards.set(id, elementData);
        this.dispatchCardDetectedEvent(elementData);
    }

    /**
     * mas-field is display:contents, so it has no box of its own to anchor a badge to; it renders
     * through its content span, or the commerce element it hosts.
     */
    fieldAnchor(element) {
        return element.querySelector(SELECTOR_MAS_FIELD_CONTENT) || element.querySelector(SELECTOR_BARE_ELEMENT) || element;
    }

    /**
     * Records a <mas-field>, whatever it renders. A title or description is a plain
     * content field; a price or CTA field owns the commerce element inside it, so that
     * element is skipped in processBareElement and the whole field gets a single badge.
     */
    processMasField(element) {
        if (this.elementIds.has(element)) return;
        if (this.isInsideCard(element)) return;

        // Absent until the backing fragment resolves; a later mutation retries.
        const sourceFragmentId = element.getAttribute('fragment-id');
        if (!sourceFragmentId) return;

        if (this.detectedCards.size >= this.maxCards) return;

        const commerceChild = element.querySelector(SELECTOR_BARE_ELEMENT);
        // A field in a hidden responsive variant renders a zero-size content span, so skip it until it
        // has a box rather than badging an invisible duplicate.
        const anchorElement = this.fieldAnchor(element);
        if (!this.hasBox(anchorElement)) {
            this.retryWhenShown(element, anchorElement);
            return;
        }

        const id = `field-${++this.elementCounter}`;
        this.elementIds.set(element, id);

        const localeInfo = this.currentLocale();
        const fieldName = element.getAttribute('field') || 'field';
        const displayText = (element.textContent || '').trim();

        const elementData = {
            element,
            anchorElement,
            id,
            fragmentId: id,
            sourceFragmentId,
            osi: commerceChild?.getAttribute('data-wcs-osi') || null,
            variant: fieldName,
            elementType: 'field',
            displayText,
            cardName: displayText || fieldName,
            promotion: this.readPromotion(element, 'field'),
            boundingRect: anchorElement.getBoundingClientRect(),
            locale: localeInfo.locale,
            country: localeInfo.country,
        };

        this.detectedCards.set(id, elementData);
        this.dispatchCardDetectedEvent(elementData);
    }

    getAllCards() {
        const cards = [];
        this.detectedCards.forEach((cardData) => {
            const rect = cardData.anchorElement.getBoundingClientRect();
            cardData.promotion = this.readPromotion(cardData.element, cardData.elementType);
            cards.push({
                fragmentId: cardData.fragmentId,
                sourceFragmentId: cardData.sourceFragmentId,
                variant: cardData.variant,
                elementType: cardData.elementType,
                cardName: cardData.cardName,
                osi: cardData.osi,
                displayText: cardData.displayText,
                size: cardData.size,
                badgeColor: cardData.badgeColor,
                borderColor: cardData.borderColor,
                backgroundColor: cardData.backgroundColor,
                failed: cardData.failed,
                promotion: cardData.promotion,
                boundingRect: rect,
                isVisible: this.isElementVisible(cardData.anchorElement),
                locale: cardData.locale,
                country: cardData.country,
            });
        });
        return cards;
    }

    getCardByFragmentId(fragmentId) {
        return this.detectedCards.get(fragmentId);
    }

    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    highlightCard(fragmentId) {
        const cardData = this.detectedCards.get(fragmentId);
        if (!cardData) return;

        // The anchor had a box when detected, but a display:contents host or a responsive reflow can
        // leave it boxless by now; climb to the nearest ancestor that still renders one so the scroll
        // and outline land on something visible instead of silently doing nothing.
        let target = cardData.anchorElement;
        while (target && !this.hasBox(target)) target = target.parentElement;
        if (!target) return;

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.style.outline = '3px solid #ff0000';
        target.style.outlineOffset = '4px';

        setTimeout(() => {
            target.style.outline = '';
            target.style.outlineOffset = '';
        }, 3000);
    }

    updateCardName(fragmentId, cardName) {
        const cardData = this.detectedCards.get(fragmentId);
        if (cardData && cardName) {
            cardData.cardName = cardName;
        }
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.detectedCards.clear();
    }
}

if (typeof window !== 'undefined') {
    window.MASCardDetector = new CardDetector();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CardDetector, URL_SEGMENT_ALIASES, DETECTABLE_TAGS, waitForDetectableElement };
}
