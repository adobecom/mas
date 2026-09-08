const URL_SEGMENT_ALIASES = {
    jp: { lang: 'ja' },
    kr: { lang: 'ko' },
    no: { lang: 'nb' },
    tw: { lang: 'zh', country: 'TW' },
    hk: { lang: 'zh', country: 'HK' },
};

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
    }

    onCardDetected(callback) {
        if (typeof callback !== 'function') return;
        this.onCardDetectedCallbacks.push(callback);
    }

    initialize() {
        this.pageLocale = this.getPageLocale();
        this.detectExistingCards();
        this.startObserving();
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

        const merchCardDefined = customElements.get('merch-card') !== undefined;
        if (!merchCardDefined) {
            try {
                await customElements.whenDefined('merch-card');
            } catch (e) {
                console.log('Merch At Scale Studio Extension: merch-card not defined, skipping');
                return;
            }
        }

        await new Promise((resolve) => requestAnimationFrame(resolve));

        const elements = document.querySelectorAll('merch-card, merch-card-collection');
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
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'MERCH-CARD' || node.tagName === 'MERCH-CARD-COLLECTION' || node.tagName === 'MAS-FIELD') {
                    this.pendingCards.push(node);
                } else if (node.matches?.(SELECTOR_BARE_ELEMENT)) {
                    this.pendingCards.push(node);
                }
                node.querySelectorAll?.('merch-card, merch-card-collection').forEach((c) => this.pendingCards.push(c));
                node.querySelectorAll?.(SELECTOR_BARE_ELEMENT).forEach((c) => this.pendingCards.push(c));
                node.querySelectorAll?.(SELECTOR_MAS_FIELD).forEach((c) => this.pendingCards.push(c));
            }
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

        const localeInfo = this.pageLocale || this.getPageLocale();
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
        return typeof element.closest === 'function' && element.closest('merch-card, merch-card-collection') !== null;
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
        if (this.isInsideCard(element)) return;
        if (this.elementIds.has(element)) return;

        const elementType = this.classifyBareElementType(element);
        if (!elementType) return;

        const osi = element.getAttribute('data-wcs-osi');
        if (!osi) return;

        if (this.detectedCards.size >= this.maxCards) return;

        const id = `${elementType}-${++this.elementCounter}`;
        this.elementIds.set(element, id);

        const localeInfo = this.pageLocale || this.getPageLocale();
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
     * Records a <mas-field> that renders a plain content field (title, description).
     * Fields that render prices or CTAs are skipped: the commerce element inside is
     * detected instead, so a single spot on the page never gets two badges.
     */
    processMasField(element) {
        if (this.elementIds.has(element)) return;
        if (this.isInsideCard(element)) return;
        if (element.querySelector(SELECTOR_BARE_ELEMENT)) return;

        // Absent until the backing fragment resolves; a later mutation retries.
        const sourceFragmentId = element.getAttribute('fragment-id');
        if (!sourceFragmentId) return;

        if (this.detectedCards.size >= this.maxCards) return;

        const id = `field-${++this.elementCounter}`;
        this.elementIds.set(element, id);

        const localeInfo = this.pageLocale || this.getPageLocale();
        const fieldName = element.getAttribute('field') || 'field';
        const displayText = (element.textContent || '').trim();
        // mas-field is display:contents, so it has no box of its own to anchor a badge to.
        const anchorElement = element.querySelector(SELECTOR_MAS_FIELD_CONTENT) || element;

        const elementData = {
            element,
            anchorElement,
            id,
            fragmentId: id,
            sourceFragmentId,
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
        if (cardData) {
            const target = cardData.anchorElement;
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.style.outline = '3px solid #ff0000';
            target.style.outlineOffset = '4px';

            setTimeout(() => {
                target.style.outline = '';
                target.style.outlineOffset = '';
            }, 3000);
        }
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
    module.exports = { CardDetector, URL_SEGMENT_ALIASES };
}
