import { ReactiveStore } from '../reactivity/reactive-store.js';
import { languageMappings } from '../data/language-mappings.js';
import { searchOffers, resolveOfferSelector, createOfferSelector } from '../utils/aos-client.js';
import { applyPlanType } from '@dexter/tacocat-core/src/wcsUtils.js';

const DEFAULT_AOS_PARAMS = {
    arrangementCode: '',
    commitment: '',
    term: '',
    customerSegment: '',
    offerType: '',
    marketSegment: '',
    pricePoint: '',
};

const DEFAULT_SEARCH_AOS_PARAMS = {
    buyingProgram: 'RETAIL',
    merchant: 'ADOBE',
    salesChannel: 'DIRECT',
    serviceProviders: ['PRICING'],
};

const DEFAULT_PLACEHOLDER_TYPES = [
    { type: 'price', name: 'Price', description: 'Formatted price, can be inlined with neighbour text' },
    { type: 'optical', name: 'Optical price', description: 'Formatted price calculating monthly payments for annual plans' },
    { type: 'annual', name: 'Annual price', description: 'Formatted price calculating annual payments for ABM plan' },
    { type: 'strikethrough', name: 'Strikethrough price', description: 'Formatted price displayed as strikethrough' },
    {
        type: 'promo-strikethrough',
        name: 'Promo strikethrough price',
        description: 'Formatted price displayed as promo strikethrough',
    },
    { type: 'discount', name: 'Discount percentage', description: 'Percentage discount between regular and current price' },
    {
        type: 'legal',
        name: 'Legal disclaimer',
        description: 'Legal disclaimer for a selected offer',
        overrides: { displayPlanType: true },
    },
    { type: 'checkoutUrl', name: 'Checkout URL', description: 'Checkout URL for a selected offer' },
];

const DEFAULT_PLACEHOLDER_OPTIONS = {
    displayFormatted: true,
    displayRecurrence: true,
    displayPerUnit: false,
    displayTax: false,
    forceTaxExclusive: false,
    displayOldPrice: true,
};

const VALID_FLOWS = ['single', 'tryBuy', 'bundle', 'consult'];

// Slice definitions — name + initial value. Each becomes a ReactiveStore on
// `store.stores.<name>` (for StoreController/ReactiveController consumers)
// and is exposed as an ergonomic `store.<name>` getter/setter that proxies
// to the underlying ReactiveStore so existing call sites keep working.
const SLICES = [
    ['env', 'PRODUCTION'],
    ['environment', undefined],
    ['landscape', 'PUBLISHED'],
    ['apiKey', ''],
    ['accessToken', ''],
    ['wcsApiKey', ''],
    ['checkoutClientId', 'mas-commerce-service'],
    ['zIndex', 20000],
    ['aosParams', { ...DEFAULT_AOS_PARAMS }],
    ['country', 'US'],
    ['language', 'en'],
    ['searchQuery', ''],
    ['searchType', ''],
    ['allProducts', []],
    ['productsLoading', false],
    ['loading', false],
    ['selectedProduct', undefined],
    ['offers', []],
    ['selectedOffer', undefined],
    ['selectedOsi', undefined],
    // OSI the OST was deep-link opened with; preserved across Back so the offer
    // step can re-resolve it. Cleared on init and on manual offer selection.
    ['initialOsi', undefined],
    // Attributes of the deep-linked OSI's resolved offer (offer_type,
    // commitment, term, segments) — used by autoSelectByInitialOsi to pick the
    // matching offer without narrowing the visible filters away from "All".
    ['initialOsiAttributes', undefined],
    // Offer ID searched directly (no OSI to reuse) — autoSelectByInitialOsi
    // matches its attributes like a deep-linked OSI but mints a fresh OSI for
    // the chosen offer instead of reusing one. Cleared on init/manual select.
    ['initialOfferId', undefined],
    // Tracks the offer the user had selected before clicking Back/Change so the
    // offer-card render can highlight it as a "previously used" choice.
    ['lastSelectedOfferId', undefined],
    ['authoringFlow', 'single'],
    // 'entitlements' (Tab 1: product + filters) | 'offer' (Tab 2: offer + config).
    // Orthogonal to viewState: viewState describes the Tab-2 sub-view, wizardStep
    // describes which wizard tab is showing. Picking a product readies the offers
    // but does not advance the step — the Next button (goToOffer) does, matching
    // the legacy OST's Next gate.
    ['wizardStep', 'entitlements'],
    ['selectedOffers', []],
    ['currentSlot', 'base'],
    ['promotionCode', undefined],
    ['storedPromoOverride', undefined],
    ['masCommerceService', null],
    ['placeholderTypes', [...DEFAULT_PLACEHOLDER_TYPES]],
    ['defaultPlaceholderOptions', { ...DEFAULT_PLACEHOLDER_OPTIONS }],
    // Global, user-editable placeholder options shared across every type row
    // (legacy parity: the legacy OST held a single options state for all rows).
    // Kept in enabled-semantics boolean-map form; the "Disable" checkbox group
    // inverts only at the presentation layer.
    ['placeholderOptions', { ...DEFAULT_PLACEHOLDER_OPTIONS }],
    ['offerSelectorPlaceholderOptions', {}],
    ['deepLink', {}],
    // Active placeholder-panel tab: 'price' | 'checkout' | 'details'. Lives in
    // the store (not the panel) so it survives Back/Next within an OST session.
    ['placeholderTab', 'price'],
    ['ctaTextOption', null],
    ['pendingArrangementCode', null],
];

export class OstStore extends EventTarget {
    stores = {};
    #batchDepth = 0;
    #batchedDuringRun = false;
    #offersKey = null;
    #trialAutoFillPending = false;
    // Tax/display flags the user explicitly toggled via the "Disable" options.
    // Geo defaults (applyGeoTaxDefaults) never overwrite a user-touched flag.
    #userToggledOptionKeys = new Set();
    // (offer, country) the geo tax defaults were last resolved for — resolve once.
    #geoResolvedKey = null;
    // True once the user clicks a try/buy slot to target it; consumed (and
    // reset) by the next addOffer so an explicit target wins over type routing
    // exactly once, then type routing resumes.
    #slotManuallyTargeted = false;

    // Callback slots set once during init() — held as plain fields because
    // ReactiveStore.set(fn) treats `fn` as an updater function and would invoke
    // it with the current value, mangling the stored callback.
    onSelect = null;
    onCancel = null;

    constructor() {
        super();
        for (const [name, initial] of SLICES) {
            const slice = new ReactiveStore(initial);
            this.stores[name] = slice;
            Object.defineProperty(this, name, {
                get: () => slice.get(),
                set: (value) => slice.set(value),
                enumerable: true,
                configurable: true,
            });
        }
        // Bridge per-slice updates back to the legacy coarse `state-changed`
        // event so existing `store.subscribe(handler)` consumers keep working.
        // Once every consumer uses StoreController/ReactiveController (tracked
        // alongside MWPW-195989), this bridge and the EventTarget base class
        // can be removed.
        const bridge = () => {
            if (this.#batchDepth > 0) {
                this.#batchedDuringRun = true;
                return;
            }
            this.dispatchEvent(new Event('state-changed'));
        };
        for (const slice of Object.values(this.stores)) {
            slice.subscribe(bridge);
        }
    }

    // Coalesce multiple slice mutations inside `fn` into a single
    // `state-changed` event so legacy subscribers see one update instead of N.
    // Per-slice subscribers (via ReactiveStore.subscribe / StoreController)
    // still fire per mutation; batching only affects the back-compat bridge.
    #batch(fn) {
        this.#batchDepth++;
        try {
            fn();
        } finally {
            this.#batchDepth--;
            if (this.#batchDepth === 0 && this.#batchedDuringRun) {
                this.#batchedDuringRun = false;
                this.dispatchEvent(new Event('state-changed'));
            }
        }
    }

    // Describes the Tab-2 (offer) sub-view. The wizard tab itself is tracked
    // separately by `wizardStep`; this getter only matters once the user is on
    // the 'offer' step.
    get viewState() {
        if (this.authoringFlow === 'consult') {
            // Consult surface-mode used by AI chat: picking an offer swaps the
            // offer tab to a focused detail view with a Use CTA.
            return this.selectedOffer ? 'offer-detail-focused' : 'offers';
        }
        if (this.authoringFlow === 'tryBuy' || this.authoringFlow === 'bundle') return 'offers';
        if (!this.selectedOffer) return 'offers';
        return 'configure';
    }

    // Tab 1 → Tab 2 is gated: single/consult need a product, tryBuy/bundle can
    // advance immediately (the user picks offers on Tab 2).
    get canAdvance() {
        if (this.authoringFlow === 'tryBuy' || this.authoringFlow === 'bundle') return true;
        return !!this.selectedProduct;
    }

    goToOffer() {
        if (!this.canAdvance) return;
        this.wizardStep = 'offer';
    }

    goToEntitlements() {
        this.#batch(() => {
            // Preserve selectedProduct so the user can re-advance without
            // re-picking; clear the offer so Tab 2 reopens to the offer list.
            this.lastSelectedOfferId = this.selectedOffer?.offer_id;
            this.selectedOffer = undefined;
            this.selectedOsi = undefined;
            this.wizardStep = 'entitlements';
        });
    }

    get canConfirm() {
        switch (this.authoringFlow) {
            case 'single':
                return !!this.selectedOffer;
            case 'tryBuy':
                return this.selectedOffers.some((o) => o.role === 'base');
            case 'bundle':
                return this.selectedOffers.length >= 2;
            case 'consult':
                return false;
            default:
                return false;
        }
    }

    get selectedBaseOffer() {
        return this.selectedOffers.find((o) => o.role === 'base')?.offer ?? null;
    }

    get selectedBaseOsi() {
        return this.selectedOffers.find((o) => o.role === 'base')?.osi ?? null;
    }

    get selectedTrialOffer() {
        return this.selectedOffers.find((o) => o.role === 'trial')?.offer ?? null;
    }

    get selectedTrialOsi() {
        return this.selectedOffers.find((o) => o.role === 'trial')?.osi ?? null;
    }

    get bundleOsis() {
        return this.selectedOffers.map((o) => o.osi).join(',');
    }

    // Offer groups the placeholder panel renders rows for. Every flow funnels
    // into this one shape so "Use" always goes through the single onSelect
    // pipeline: tryBuy yields a labeled group per offer (each emitting plain
    // single-OSI markup), bundle yields one joined-OSI group (summed price,
    // multi-item checkout).
    get panelGroups() {
        switch (this.authoringFlow) {
            case 'tryBuy': {
                const groups = [];
                if (this.selectedTrialOsi) {
                    groups.push({ role: 'trial', label: 'Trial', osi: this.selectedTrialOsi, offer: this.selectedTrialOffer });
                }
                if (this.selectedBaseOsi) {
                    groups.push({ role: 'buy', label: 'Buy', osi: this.selectedBaseOsi, offer: this.selectedBaseOffer });
                }
                return groups;
            }
            case 'bundle': {
                if (this.selectedOffers.length === 0) return [];
                return [
                    {
                        role: 'bundle',
                        label: `Bundle (${this.selectedOffers.length})`,
                        osi: this.bundleOsis,
                        offer: this.selectedOffers[0].offer,
                    },
                ];
            }
            default:
                if (!this.selectedOffer || !this.selectedOsi) return [];
                return [{ role: 'single', label: '', osi: this.selectedOsi, offer: this.selectedOffer }];
        }
    }

    get multiSelect() {
        return this.authoringFlow === 'tryBuy';
    }

    subscribe(callback) {
        this.addEventListener('state-changed', callback);
    }

    unsubscribe(callback) {
        this.removeEventListener('state-changed', callback);
    }

    notify() {
        this.dispatchEvent(new Event('state-changed'));
    }

    setEnv(env) {
        if (this.env === env) return;
        this.#batch(() => {
            this.env = env;
            // Offers were fetched at the old env; force re-resolution at the new
            // one. Selected product/offer/OSI/flow context are intentionally
            // preserved so the user does not get bounced back to the welcome
            // screen on stage toggle.
            this.offers = [];
        });
    }

    init(config) {
        this.#batch(() => this.#init(config));
    }

    #init(config) {
        this.aosParams = { ...DEFAULT_AOS_PARAMS };
        this.selectedProduct = undefined;
        this.selectedOffer = undefined;
        this.selectedOsi = undefined;
        this.initialOsi = undefined;
        this.initialOsiAttributes = undefined;
        this.initialOfferId = undefined;
        // 'single' is the safe default: it matches the most common caller
        // (RTE double-click on an existing CTA) and is overridden below for
        // multiSelect / bundleSelect / explicit authoringFlow.
        this.authoringFlow = 'single';
        this.wizardStep = 'entitlements';
        this.selectedOffers = [];
        this.currentSlot = 'base';
        this.#slotManuallyTargeted = false;
        this.offers = [];
        // Reset the offers-fetch cache key so the first product selection of a
        // fresh OST session always reloads offers (a re-open with the same
        // product would otherwise hit the stale key and skip the fetch).
        this.#offersKey = null;
        this.searchQuery = '';
        this.searchType = '';
        this.deepLink = {};
        this.placeholderTab = 'price';
        this.promotionCode = undefined;
        this.storedPromoOverride = undefined;
        this.placeholderOptions = { ...DEFAULT_PLACEHOLDER_OPTIONS };

        if (config.multiSelect === true) {
            this.authoringFlow = 'tryBuy';
        }
        if (config.bundleSelect === true) {
            this.authoringFlow = 'bundle';
        }
        if (config.authoringFlow && VALID_FLOWS.includes(config.authoringFlow)) {
            this.authoringFlow = config.authoringFlow;
        }
        const CALLBACK_KEYS = ['onSelect', 'onCancel'];
        Object.keys(config).forEach((key) => {
            if (key === 'multiSelect' || key === 'bundleSelect' || key === 'authoringFlow') return;
            if (config[key] === undefined) return;
            if (key in this.stores) {
                this[key] = config[key];
            } else if (CALLBACK_KEYS.includes(key)) {
                this[key] = config[key];
            }
        });
        if (config.defaultPlaceholderOptions) {
            // Studio's config carries forceTaxExclusive in the legacy OST
            // contract, where the value is inverted at placeholder-build time
            // (tacocat PlaceholderKey.jsx) — the effective default is its
            // negation. Taking it literally renders tax-exclusive (HT) prices
            // where legacy rendered tax-inclusive (TTC).
            const { forceTaxExclusive, ...defaults } = config.defaultPlaceholderOptions;
            this.defaultPlaceholderOptions = {
                ...DEFAULT_PLACEHOLDER_OPTIONS,
                ...defaults,
                ...(forceTaxExclusive === undefined ? {} : { forceTaxExclusive: !forceTaxExclusive }),
            };
            this.placeholderOptions = { ...this.defaultPlaceholderOptions };
        }
        if (config.offerSelectorPlaceholderOptions) {
            this.offerSelectorPlaceholderOptions = config.offerSelectorPlaceholderOptions;
            const restored = {};
            for (const key of Object.keys(DEFAULT_PLACEHOLDER_OPTIONS)) {
                if (config.offerSelectorPlaceholderOptions[key] !== undefined) {
                    restored[key] = config.offerSelectorPlaceholderOptions[key];
                }
            }
            this.placeholderOptions = { ...this.placeholderOptions, ...restored };
            const incomingPromoOverride = config.offerSelectorPlaceholderOptions.storedPromoOverride;
            if (incomingPromoOverride !== undefined && this.storedPromoOverride === undefined) {
                this.storedPromoOverride = incomingPromoOverride;
            }
            const incomingPromotionCode = config.offerSelectorPlaceholderOptions.promotionCode;
            if (incomingPromotionCode !== undefined && this.promotionCode === undefined) {
                this.promotionCode = incomingPromotionCode;
            }
        }
    }

    setAosParams(params) {
        this.aosParams = { ...this.aosParams, ...params };
        this.#maybeLoadOffers();
    }

    setSearch(query, type) {
        this.#batch(() => {
            this.searchQuery = query;
            this.searchType = type;
        });
    }

    setCountry(country) {
        this.#batch(() => {
            this.country = country;
            this.language = languageMappings[country] || 'en';
        });
    }

    setProducts(products) {
        this.#batch(() => {
            this.allProducts = products;
            if (this.pendingArrangementCode) {
                const code = this.pendingArrangementCode;
                this.pendingArrangementCode = null;
                this.autoSelectProductByArrangementCode(code);
            }
        });
    }

    setProduct(product) {
        // Re-selecting the SAME product (e.g. a deep-link's pendingArrangementCode
        // re-fulfilling once the catalog finishes loading) must NOT wipe the
        // offer/OSI the deep-link already auto-selected. Only clear when the
        // product actually changes.
        const code = (p) => p?.arrangement_code ?? p?.code ?? p;
        const sameProduct =
            product === this.selectedProduct ||
            (product && this.selectedProduct && code(product) === code(this.selectedProduct));
        this.#batch(() => {
            this.selectedProduct = product;
            if (!sameProduct) {
                this.selectedOffer = undefined;
                this.selectedOsi = undefined;
            }
        });
        this.#maybeLoadOffers();
    }

    setOffers(offers) {
        this.offers = offers;
    }

    #offersFetchKey() {
        return (
            JSON.stringify(this.aosParams) +
            this.country +
            this.landscape +
            this.env +
            (this.selectedProduct?.arrangement_code ?? '')
        );
    }

    #maybeLoadOffers() {
        if (!this.selectedProduct) return;
        const key = this.#offersFetchKey();
        if (key === this.#offersKey) return;
        this.loadOffers();
    }

    async loadOffers() {
        const product = this.selectedProduct;
        if (!product) return;

        this.#offersKey = this.#offersFetchKey();
        const requestKey = this.#offersKey;

        const {
            aosParams: { commitment, term, customerSegment, offerType, marketSegment, pricePoint },
            country,
            landscape,
            env,
            environment,
            apiKey,
            accessToken,
        } = this;

        const arrangementCode = product.arrangement_code || product.arrangementCode || this.aosParams.arrangementCode;

        if (offerType && offerType.startsWith('fake-')) {
            const fakeOffer = {
                offer_id: 'Fake Offer',
                offer_type: offerType,
                price_point: 'I am not real!',
                language: 'Fake',
                market_segments: ['COM'],
                pricing: {
                    currency: { format_string: "'US$'#,##0.00" },
                    prices: [{ price_details: { display_rules: { price: 99.9 } } }],
                },
                planType: 'Fake',
                name: product.name,
                icon: product.icon,
                id: 'Fake Offer',
            };
            this.setOffers([fakeOffer]);
            return;
        }

        this.loading = true;
        try {
            let language = country === 'GB' ? 'EN' : 'MULT';
            if (commitment === 'PERPETUAL') {
                language = undefined;
            }

            const searchParams = {
                ...DEFAULT_SEARCH_AOS_PARAMS,
                arrangementCode: [arrangementCode],
                pricePoint: pricePoint ? [pricePoint] : undefined,
                commitment,
                term,
                offerType,
                customerSegment,
                marketSegment,
                country,
                language,
            };

            const baseConfig = {
                accessToken,
                apiKey,
                baseUrl: this.baseUrl,
                env,
                environment,
                pageSize: 1000,
            };

            // When landscape is "BOTH" (AI chat consult), merge DRAFT and
            // PUBLISHED results so authors can browse both sets in one view.
            // Each offer is tagged with its source landscape so the UI can
            // badge/distinguish them.
            const landscapesToFetch = landscape === 'BOTH' ? ['PUBLISHED', 'DRAFT'] : [landscape];
            const responses = await Promise.all(
                landscapesToFetch.map(async (ls) => {
                    const res = await searchOffers(searchParams, { ...baseConfig, landscape: ls });
                    return (res.data || res).map((o) => ({ ...o, landscapeSource: ls }));
                }),
            );
            // A newer loadOffers (the user switched OSI/product mid-flight)
            // superseded this request — drop the stale response so it can't
            // overwrite the current product's offers/selection.
            if (requestKey !== this.#offersKey) return;
            let offers = responses.flat().map(applyPlanType);
            // De-dupe: if the same offer_id came back from both DRAFT and
            // PUBLISHED (shouldn't normally, but safe to guard), keep the
            // PUBLISHED copy since that's what renders on live commerce.
            if (landscape === 'BOTH') {
                const seen = new Map();
                for (const offer of offers) {
                    const id = offer.offer_id;
                    if (!seen.has(id) || offer.landscapeSource === 'PUBLISHED') {
                        seen.set(id, offer);
                    }
                }
                offers = Array.from(seen.values());
            }
            offers = offers.map((offer) => ({
                ...offer,
                id: offer.offer_id,
                name: product.name,
                icon: product.icon,
            }));
            offers.sort(({ name: nameLeft, price_point: ppLeft }, { name: nameRight, price_point: ppRight }) =>
                `${nameRight}${ppRight}`.localeCompare(`${nameLeft}${ppLeft}`),
            );
            this.setOffers(offers);
            // An active deep-link/search OSI owns the selection — try it first so
            // it wins over the blind single-offer autoResolveOsi (which would mint
            // a fresh OSI and clobber the user's chosen one).
            if (this.autoSelectByInitialOsi(offers)) return;
            if (offers.length === 1) {
                this.setOffer(offers[0]);
                this.autoResolveOsi(offers[0]);
            } else {
                await this.autoFillBaseAndTrial(offers);
            }
        } catch {
            this.setOffers([]);
        } finally {
            this.loading = false;
        }
    }

    // A searched/deep-linked OSI resolves to one specific offer; pick the offer
    // matching its resolved offer_type so "Use" enables without a manual click,
    // then reuse the searched OSI directly. Returns true when it selected one.
    // This is the single store-owned deep-link/search offer-selection path.
    autoSelectByInitialOsi(offers) {
        if ((!this.initialOsi && !this.initialOfferId) || offers.length === 0) return false;
        const attrs = this.initialOsiAttributes;
        let match;
        if (this.initialOfferId) {
            match = offers.find((o) => o.offer_id === this.initialOfferId);
        }
        if (!match && attrs) {
            const segmentOf = (o) => (Array.isArray(o.market_segments) ? o.market_segments[0] : o.market_segment);
            const segmentMatches = (o) => !attrs.market_segment || segmentOf(o) === attrs.market_segment;
            // Relax the match progressively — the user may have changed plan
            // filters after the deep-link resolved (e.g. PUF promo reopened,
            // then switched to ABM), so plan fields can legitimately diverge.
            // market_segment stays a discriminator until the final tier so a
            // deep-linked EDU OSI never resolves to a same-type COM sibling.
            const tiers = [
                (o) =>
                    segmentMatches(o) &&
                    (!attrs.offer_type || o.offer_type === attrs.offer_type) &&
                    (!attrs.commitment || o.commitment === attrs.commitment) &&
                    (!attrs.term || o.term === attrs.term) &&
                    (!attrs.customer_segment || o.customer_segment === attrs.customer_segment),
                (o) =>
                    segmentMatches(o) &&
                    attrs.offer_type &&
                    o.offer_type === attrs.offer_type &&
                    (!attrs.customer_segment || o.customer_segment === attrs.customer_segment),
                (o) => attrs.offer_type && o.offer_type === attrs.offer_type,
            ];
            for (const tier of tiers) {
                match = offers.find(tier);
                if (match) break;
            }
        }
        if (!match) {
            const wanted = this.aosParams.offerType;
            match = wanted ? offers.find((o) => o.offer_type === wanted) : undefined;
        }
        const chosen = match ?? (offers.length === 1 ? offers[0] : undefined);
        if (!chosen) return false;
        this.setOffer(chosen);
        if (this.initialOsi) {
            this.setOsi(this.initialOsi);
        } else {
            this.autoResolveOsi(chosen);
        }
        return true;
    }

    async autoResolveOsi(offer) {
        if (offer.offer_type?.startsWith('fake-')) {
            this.setOsi(offer.offer_type);
            return;
        }
        try {
            const params = {
                product_arrangement_code: offer.product_arrangement_code,
                buying_program: offer.buying_program,
                commitment: offer.commitment,
                term: offer.term,
                customer_segment: offer.customer_segment,
                market_segment: Array.isArray(offer.market_segments) ? offer.market_segments[0] : offer.market_segment,
                sales_channel: offer.sales_channel,
                offer_type: offer.offer_type,
                price_point: offer.price_point,
                merchant: offer.merchant,
            };
            const config = {
                accessToken: this.accessToken,
                apiKey: this.apiKey,
                baseUrl: this.baseUrl,
                env: this.env,
            };
            const {
                data: { id },
            } = await createOfferSelector(params, config);
            this.setOsi(id);
        } catch {
            /* auto OSI resolution failed — user can still click the offer */
        }
    }

    // tryBuy convenience: when the loaded offers leave no ambiguity (a single
    // BASE candidate), pre-fill the base slot; the addOffer hook then fills the
    // matching trial. Authors can always pick/replace slots manually.
    async autoFillBaseAndTrial(offers) {
        if (this.authoringFlow !== 'tryBuy' || this.selectedBaseOsi) return;
        const baseCandidates = offers.filter((o) => o.offer_type === 'BASE');
        if (baseCandidates.length !== 1) return;
        try {
            await this.#resolveAndAddOffer(baseCandidates[0], 'base');
        } catch {
            /* auto-fill failed — user can select manually */
        }
    }

    async #maybeAutoFillTrial(baseOffer) {
        if (this.#trialAutoFillPending || this.selectedTrialOsi) return;
        const candidate = this.#matchCounterpart(baseOffer, 'TRIAL');
        if (!candidate) return;
        this.#trialAutoFillPending = true;
        try {
            await this.#resolveAndAddOffer(candidate, 'trial');
        } catch {
            /* auto-fill failed — user can select manually */
        } finally {
            this.#trialAutoFillPending = false;
        }
    }

    async #maybeAutoFillBase(trialOffer) {
        if (this.#trialAutoFillPending || this.selectedBaseOsi) return;
        const candidate = this.#matchCounterpart(trialOffer, 'BASE');
        if (!candidate) return;
        this.#trialAutoFillPending = true;
        try {
            await this.#resolveAndAddOffer(candidate, 'base');
        } catch {
            /* auto-fill failed — user can select manually */
        } finally {
            this.#trialAutoFillPending = false;
        }
    }

    // Find the single offer of `offerType` that mirrors the picked offer,
    // relaxing the match (segments + plan → segments → any) until exactly one
    // candidate is left; null when it stays ambiguous.
    #matchCounterpart(picked, offerType) {
        const pool = this.offers.filter((o) => o.offer_type === offerType && o.offer_id !== picked?.offer_id);
        const marketSegmentOf = (o) => (Array.isArray(o.market_segments) ? o.market_segments[0] : o.market_segments);
        const single = (predicate) => {
            const matches = pool.filter(predicate);
            return matches.length === 1 ? matches[0] : null;
        };
        return (
            (picked &&
                single(
                    (o) =>
                        o.customer_segment === picked.customer_segment &&
                        marketSegmentOf(o) === marketSegmentOf(picked) &&
                        o.commitment === picked.commitment &&
                        o.term === picked.term,
                )) ||
            (picked &&
                single(
                    (o) => o.customer_segment === picked.customer_segment && marketSegmentOf(o) === marketSegmentOf(picked),
                )) ||
            single(() => true)
        );
    }

    async #resolveAndAddOffer(offer, role) {
        const config = {
            accessToken: this.accessToken,
            apiKey: this.apiKey,
            baseUrl: this.baseUrl,
            env: this.env,
        };
        const osi = await resolveOfferSelector(offer, config);
        this.addOffer(offer, osi, role);
    }

    setOffer(offer) {
        this.selectedOffer = offer;
    }

    clearInitialOsi() {
        this.#batch(() => {
            this.initialOsi = undefined;
            this.initialOsiAttributes = undefined;
            this.initialOfferId = undefined;
        });
    }

    clearSelectedOffer() {
        this.#batch(() => {
            this.selectedOffer = undefined;
            this.selectedOsi = undefined;
        });
    }

    setOsi(osi) {
        this.selectedOsi = osi;
    }

    // Tab-1 mode picker: switch authoring flow and carry the current offer
    // selection into the new mode (single's offer becomes the base slot in
    // tryBuy / the first bundle offer). Keeping the selection preserves a
    // deep-linked offer — the author's anchor — instead of discarding it.
    chooseAuthoringFlow(flow) {
        if (!VALID_FLOWS.includes(flow)) return;
        if (flow === this.authoringFlow) return;
        this.applyFlowSwitch(flow, true);
    }

    setCurrentSlot(slot) {
        if (slot !== 'base' && slot !== 'trial') return;
        this.#slotManuallyTargeted = true;
        this.currentSlot = slot;
    }

    applyFlowSwitch(flow, keepSelections) {
        this.#batch(() => this.#applyFlowSwitch(flow, keepSelections));
    }

    #applyFlowSwitch(flow, keepSelections) {
        let previousOffers = keepSelections ? [...this.selectedOffers] : [];
        if (keepSelections && previousOffers.length === 0 && this.selectedOffer) {
            previousOffers = [{ offer: this.selectedOffer, osi: this.selectedOsi }];
        }
        this.authoringFlow = flow;
        this.currentSlot = 'base';
        this.#slotManuallyTargeted = false;
        let nextSelected = [];

        if (keepSelections && previousOffers.length > 0) {
            if (flow === 'single') {
                const first = previousOffers[0];
                this.selectedOffer = first.offer;
                this.selectedOsi = first.osi;
            } else if (flow === 'tryBuy') {
                const first = previousOffers[0];
                nextSelected = [{ offer: first.offer, osi: first.osi, role: 'base' }];
                if (previousOffers[1]) {
                    nextSelected.push({ offer: previousOffers[1].offer, osi: previousOffers[1].osi, role: 'trial' });
                }
            } else if (flow === 'bundle') {
                nextSelected = previousOffers.map((o) => ({ offer: o.offer, osi: o.osi }));
            }
        }
        this.selectedOffers = nextSelected;

        if (flow !== 'single') {
            this.selectedOffer = undefined;
            this.selectedOsi = undefined;
        }
    }

    addOffer(offer, osi, role) {
        // Slot precedence: an explicit role (programmatic) > a slot the user
        // manually targeted (clicking a slot wins over type) > the offer's
        // type default > the current slot. The manual-target flag is consumed
        // here so type routing resumes on the next pick.
        const manualTarget = this.#slotManuallyTargeted;
        this.#slotManuallyTargeted = false;
        const targetRole = role || (manualTarget ? this.currentSlot : this.#defaultSlotFor(offer)) || this.currentSlot;
        this.#batch(() => this.#addOffer(offer, osi, targetRole, !role && !manualTarget));
        // Auto-fill the counterpart unless the user manually targeted a slot —
        // a manual target means "put it exactly here", so don't also touch the
        // other slot. An explicit programmatic role still auto-fills.
        if (this.authoringFlow !== 'tryBuy' || manualTarget) return;
        if (targetRole === 'base' && offer?.offer_type === 'BASE') {
            this.#maybeAutoFillTrial(offer);
        } else if (targetRole === 'trial' && offer?.offer_type === 'TRIAL') {
            this.#maybeAutoFillBase(offer);
        }
    }

    // In tryBuy an untargeted pick routes by its own type — a TRIAL belongs in
    // the trial slot, a BASE in the base slot; ambiguous types (e.g. PROMOTION)
    // fall through to the current slot.
    #defaultSlotFor(offer) {
        if (this.authoringFlow !== 'tryBuy') return undefined;
        if (offer?.offer_type === 'TRIAL') return 'trial';
        if (offer?.offer_type === 'BASE') return 'base';
        return undefined;
    }

    #addOffer(offer, osi, role, autoAdvance = false) {
        if (this.authoringFlow === 'consult') return;

        this.initialOsi = undefined;
        this.initialOsiAttributes = undefined;
        this.initialOfferId = undefined;

        if (this.authoringFlow === 'single') {
            this.selectedOffer = offer;
            this.selectedOsi = osi;
            return;
        }

        if (this.authoringFlow === 'tryBuy') {
            const targetRole = role || this.currentSlot;
            const next = this.selectedOffers.filter((o) => o.role !== targetRole);
            next.push({ offer, osi, role: targetRole });
            this.selectedOffers = next;
            // After an untargeted fill, advance the target to the still-empty
            // slot so a quick second pick lands there. A manual target (or an
            // explicit role) skips this so it doesn't fight the user's choice.
            if (autoAdvance) {
                this.currentSlot = targetRole === 'base' ? 'trial' : 'base';
            }
            return;
        }

        if (this.authoringFlow === 'bundle') {
            const existing = this.selectedOffers.findIndex((o) => o.offer === offer || o.osi === osi);
            const next = [...this.selectedOffers];
            if (existing >= 0) {
                next.splice(existing, 1);
            } else {
                next.push({ offer, osi });
            }
            this.selectedOffers = next;
        }
    }

    removeOffer(index) {
        if (index >= 0 && index < this.selectedOffers.length) {
            const next = [...this.selectedOffers];
            next.splice(index, 1);
            this.selectedOffers = next;
        }
    }

    removeOfferByRole(role) {
        this.selectedOffers = this.selectedOffers.filter((o) => o.role !== role);
    }

    clearOffers() {
        this.#batch(() => {
            this.selectedOffers = [];
            this.selectedOffer = undefined;
            this.selectedOsi = undefined;
        });
    }

    isOfferSelected(offer) {
        if (this.selectedOffer === offer) return true;
        return this.selectedOffers.some((o) => o.offer === offer);
    }

    setPromoCode(code) {
        this.storedPromoOverride = code;
    }

    setPlaceholderOptions(options) {
        this.placeholderOptions = { ...options };
    }

    // User toggled a display flag via the "Disable" options. Record it so a
    // later geo-default resolution won't overwrite the user's explicit choice.
    toggleOption(key, value) {
        this.#userToggledOptionKeys.add(key);
        this.placeholderOptions = { ...this.placeholderOptions, [key]: value };
    }

    // Seed geo-aware tax defaults from the selected offer. The legacy OST got
    // DE/EU tax labels because the price auto-resolved displayTax per geo; the
    // new OST hardcoded displayTax:false, suppressing it. Resolve the real
    // defaults from the commerce service and merge them in for any flag the
    // user has not explicitly toggled.
    async applyGeoTaxDefaults(offer) {
        const service = this.masCommerceService;
        if (!service?.resolvePriceTaxFlags || !offer || !this.country) return;
        // Resolve once per (offer, country) so repeated render-time calls from
        // the preview rows don't re-fetch or fight each other.
        const guardKey = `${offer.offer_id ?? offer.id ?? ''}-${this.country}`;
        if (this.#geoResolvedKey === guardKey) return;
        this.#geoResolvedKey = guardKey;
        const flags = await service.resolvePriceTaxFlags(
            this.country,
            this.language,
            offer.customer_segment,
            offer.market_segments?.[0],
        );
        if (!flags) return;
        const next = { ...this.placeholderOptions };
        let changed = false;
        for (const key of ['displayTax', 'forceTaxExclusive']) {
            if (this.#userToggledOptionKeys.has(key)) continue;
            if (flags[key] !== undefined && next[key] !== flags[key]) {
                next[key] = flags[key];
                changed = true;
            }
        }
        if (changed) this.placeholderOptions = next;
    }

    getEffectiveOptions(type) {
        const typeConfig = this.placeholderTypes.find((t) => t.type === type);
        const overrides = typeConfig?.overrides || {};
        const effective = { ...this.placeholderOptions, ...overrides };
        // The geo tax default (applyGeoTaxDefaults) turns displayTax on for the
        // price in DE/EU; the legal disclaimer keeps its own default-off tax
        // display unless the user explicitly toggled the Tax Label option.
        if (type === 'legal' && !this.#userToggledOptionKeys.has('displayTax')) {
            effective.displayTax = this.defaultPlaceholderOptions.displayTax;
        }
        return effective;
    }

    get effectivePromoCode() {
        return this.storedPromoOverride || this.promotionCode || '';
    }

    applySearchParams(searchParameters) {
        this.#batch(() => this.#applySearchParams(searchParameters));
    }

    #applySearchParams(searchParameters) {
        if (!searchParameters) return;
        const get = (key) => searchParameters.get(key);

        if (get('country')) {
            this.setCountry(get('country'));
        }
        if (get('promotionCode')) {
            this.setPromoCode(get('promotionCode'));
        }
        if (get('storedPromoOverride')) {
            this.setPromoCode(get('storedPromoOverride'));
        }
        if (get('multiSelect') === 'true') {
            this.authoringFlow = 'tryBuy';
        }
        if (get('bundleSelect') === 'true') {
            this.authoringFlow = 'bundle';
        }
        const flow = get('authoringFlow');
        if (flow && VALID_FLOWS.includes(flow)) {
            this.authoringFlow = flow;
        }

        const deepLink = {};
        if (get('offerId')) deepLink.offerId = get('offerId');
        if (get('type')) deepLink.type = get('type');
        if (get('workflowStep')) deepLink.workflowStep = get('workflowStep');
        if (get('text')) deepLink.text = get('text');
        if (get('checkoutType')) deepLink.checkoutType = get('checkoutType');
        if (get('modal')) deepLink.modal = get('modal');
        if (get('entitlement')) deepLink.entitlement = get('entitlement') === 'true';
        if (get('upgrade')) deepLink.upgrade = get('upgrade') === 'true';

        this.deepLink = deepLink;
        if (deepLink.type === 'checkoutUrl') {
            this.placeholderTab = 'checkout';
        }

        const aosUpdates = {};
        const arrangementCode = get('arrangement_code');
        if (arrangementCode) aosUpdates.arrangementCode = arrangementCode;
        if (get('commitment')) aosUpdates.commitment = get('commitment');
        if (get('term')) aosUpdates.term = get('term');
        if (get('customerSegment')) aosUpdates.customerSegment = get('customerSegment');
        if (get('marketSegment')) aosUpdates.marketSegment = get('marketSegment');
        if (get('offerType')) aosUpdates.offerType = get('offerType');
        if (Object.keys(aosUpdates).length > 0) {
            this.setAosParams(aosUpdates);
            // Also auto-select the product if we can find it in the loaded
            // catalog, so the deeplink lands directly on that product's offers
            // instead of just filtering the left-panel search.
            if (arrangementCode) this.autoSelectProductByArrangementCode(arrangementCode);
            return;
        }
        if (arrangementCode) this.autoSelectProductByArrangementCode(arrangementCode);
    }

    autoSelectProductByArrangementCode(arrangementCode) {
        // allProducts is Object.entries(combinedProducts) → array of
        // [code, productData] tuples. Match the map key first (the common
        // case — products are keyed by arrangement code), then fall back to
        // the product's own arrangement_code/code field so deep links resolve
        // regardless of which identifier the catalog keys on.
        const match = this.allProducts?.find(
            (entry) =>
                Array.isArray(entry) &&
                (entry[0] === arrangementCode ||
                    entry[1]?.arrangement_code === arrangementCode ||
                    entry[1]?.code === arrangementCode),
        );
        if (match) {
            this.setProduct(match[1]);
        } else {
            // Catalog not loaded yet — stash the request so setProducts() can
            // fulfill it once data arrives. Prevents the deeplink from dying
            // to the applySearchParams / fetchProducts race.
            this.pendingArrangementCode = arrangementCode;
        }
    }
}

export const store = new OstStore();
