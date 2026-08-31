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

class CardDetector {
    constructor() {
        this.detectedCards = new Map();
        this.observer = null;
        this.pageLocale = null;
        this.onCardDetectedCallbacks = [];
        this.maxCards = 200;
        this.pendingCards = [];
        this.idleHandle = null;
        this.bareElementIds = new WeakMap();
        this.bareElementCounter = 0;
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
    }

    startObserving() {
        const enqueue = (node) => {
            if (this.detectedCards.size + this.pendingCards.length >= this.maxCards) return;
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'MERCH-CARD' || node.tagName === 'MERCH-CARD-COLLECTION') {
                    this.pendingCards.push(node);
                } else if (node.matches?.(SELECTOR_BARE_ELEMENT)) {
                    this.pendingCards.push(node);
                }
                node.querySelectorAll?.('merch-card, merch-card-collection').forEach((c) => this.pendingCards.push(c));
                node.querySelectorAll?.(SELECTOR_BARE_ELEMENT).forEach((c) => this.pendingCards.push(c));
            }
        };

        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => m.addedNodes.forEach(enqueue));
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
            fragmentId: fragmentId,
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

    processBareElement(element) {
        if (this.isInsideCard(element)) return;
        if (this.bareElementIds.has(element)) return;

        const elementType = this.classifyBareElementType(element);
        if (!elementType) return;

        const osi = element.getAttribute('data-wcs-osi');
        if (!osi) return;

        if (this.detectedCards.size >= this.maxCards) return;

        const id = `${elementType}-${++this.bareElementCounter}`;
        this.bareElementIds.set(element, id);

        const localeInfo = this.pageLocale || this.getPageLocale();
        const promotion =
            typeof window !== 'undefined' && window.MASPromo ? window.MASPromo.readElementPromotion(element) : null;

        const displayText = (element.textContent || '').trim();

        const elementData = {
            element,
            id,
            fragmentId: id,
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

    getAllCards() {
        const cards = [];
        this.detectedCards.forEach((cardData) => {
            const rect = cardData.element.getBoundingClientRect();
            cardData.promotion = this.readPromotion(cardData.element, cardData.elementType);
            cards.push({
                fragmentId: cardData.fragmentId,
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
                isVisible: this.isElementVisible(cardData.element),
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
            cardData.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cardData.element.style.outline = '3px solid #ff0000';
            cardData.element.style.outlineOffset = '4px';

            setTimeout(() => {
                cardData.element.style.outline = '';
                cardData.element.style.outlineOffset = '';
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
