import { ReactiveStore } from '../reactivity/reactive-store.js';
import { languageMappings } from '../data/language-mappings.js';

const DEFAULT_AOS_PARAMS = {
    arrangementCode: '',
    commitment: '',
    term: '',
    customerSegment: '',
    offerType: '',
    marketSegment: '',
    pricePoint: '',
};

const DEFAULT_PLACEHOLDER_TYPES = [
    { type: 'price', name: 'Price' },
    { type: 'optical', name: 'Optical price' },
    { type: 'annual', name: 'Annual price' },
    { type: 'strikethrough', name: 'Strikethrough price' },
    { type: 'promo-strikethrough', name: 'Promo strikethrough price' },
    { type: 'discount', name: 'Discount percentage' },
    { type: 'legal', name: 'Legal disclaimer', overrides: { displayPlanType: true } },
    { type: 'checkoutUrl', name: 'Checkout URL' },
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
    ['selectedProduct', undefined],
    ['offers', []],
    ['selectedOffer', undefined],
    ['selectedOsi', undefined],
    // OSI the OST was deep-link opened with; preserved across Back so the offer
    // step can re-resolve it. Cleared on init and on manual offer selection.
    ['initialOsi', undefined],
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
    ['pendingFlowSwitch', null],
    ['promotionCode', undefined],
    ['storedPromoOverride', undefined],
    ['masCommerceService', null],
    ['placeholderTypes', [...DEFAULT_PLACEHOLDER_TYPES]],
    ['defaultPlaceholderOptions', { ...DEFAULT_PLACEHOLDER_OPTIONS }],
    ['offerSelectorPlaceholderOptions', {}],
    ['deepLink', {}],
    ['ctaTextOption', null],
    ['helpMode', false],
    ['pendingArrangementCode', null],
];

export class OstStore extends EventTarget {
    stores = {};
    #batchDepth = 0;
    #batchedDuringRun = false;

    // Callback slots set once during init() — held as plain fields because
    // ReactiveStore.set(fn) treats `fn` as an updater function and would invoke
    // it with the current value, mangling the stored callback.
    onSelect = null;
    onCancel = null;
    onMultiSelect = null;
    onBundleSelect = null;

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

    get multiSelect() {
        return this.authoringFlow === 'tryBuy';
    }

    get canConfirmMultiSelect() {
        return this.authoringFlow === 'tryBuy' && !!this.selectedBaseOsi;
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
        // 'single' is the safe default: it matches the most common caller
        // (RTE double-click on an existing CTA) and is overridden below for
        // multiSelect / bundleSelect / explicit authoringFlow.
        this.authoringFlow = 'single';
        this.wizardStep = 'entitlements';
        this.selectedOffers = [];
        this.currentSlot = 'base';
        this.pendingFlowSwitch = null;
        this.offers = [];
        this.searchQuery = '';
        this.searchType = '';
        this.deepLink = {};
        this.promotionCode = undefined;
        this.storedPromoOverride = undefined;

        if (config.multiSelect === true) {
            this.authoringFlow = 'tryBuy';
        }
        if (config.bundleSelect === true) {
            this.authoringFlow = 'bundle';
        }
        if (config.authoringFlow && VALID_FLOWS.includes(config.authoringFlow)) {
            this.authoringFlow = config.authoringFlow;
        }
        const CALLBACK_KEYS = ['onSelect', 'onCancel', 'onMultiSelect', 'onBundleSelect'];
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
            this.defaultPlaceholderOptions = { ...DEFAULT_PLACEHOLDER_OPTIONS, ...config.defaultPlaceholderOptions };
        }
        if (config.offerSelectorPlaceholderOptions) {
            this.offerSelectorPlaceholderOptions = config.offerSelectorPlaceholderOptions;
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
        this.#batch(() => {
            this.selectedProduct = product;
            this.selectedOffer = undefined;
            this.selectedOsi = undefined;
        });
    }

    setOffers(offers) {
        this.offers = offers;
    }

    setOffer(offer) {
        this.selectedOffer = offer;
    }

    setOsi(osi) {
        this.selectedOsi = osi;
    }

    setAuthoringFlow(flow, keepSelections = false) {
        if (!VALID_FLOWS.includes(flow)) return;
        if (flow === this.authoringFlow) return;

        const hasSelections = this.selectedOffers.length > 0 || !!this.selectedOffer;
        if (!keepSelections && hasSelections) {
            this.pendingFlowSwitch = flow;
            return;
        }

        this.applyFlowSwitch(flow, keepSelections);
    }

    // Tab-1 mode picker: switch authoring flow and discard any in-progress
    // offer selections immediately (no pendingFlowSwitch confirm bar, which
    // lives on Tab 2 and would be invisible from Tab 1). Switching mode is a
    // deliberate restart of the authoring intent.
    chooseAuthoringFlow(flow) {
        if (!VALID_FLOWS.includes(flow)) return;
        if (flow === this.authoringFlow) return;
        this.applyFlowSwitch(flow, false);
    }

    setCurrentSlot(slot) {
        if (slot !== 'base' && slot !== 'trial') return;
        this.currentSlot = slot;
    }

    confirmFlowSwitch(keep) {
        const flow = this.pendingFlowSwitch;
        if (!flow) return;
        this.pendingFlowSwitch = null;
        this.applyFlowSwitch(flow, keep);
    }

    cancelFlowSwitch() {
        this.pendingFlowSwitch = null;
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
        this.#batch(() => this.#addOffer(offer, osi, role));
    }

    #addOffer(offer, osi, role) {
        if (this.authoringFlow === 'consult') return;

        this.initialOsi = undefined;

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
            if (targetRole === 'base' && this.currentSlot === 'base') {
                this.currentSlot = 'trial';
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

    get effectivePromoCode() {
        return this.storedPromoOverride || this.promotionCode || '';
    }

    toggleMultiSelect() {
        this.#batch(() => {
            if (this.authoringFlow === 'tryBuy') {
                this.applyFlowSwitch('single', false);
            } else {
                const keepSelections = !!this.selectedOffer;
                if (keepSelections) {
                    this.selectedOffers = [{ offer: this.selectedOffer, osi: this.selectedOsi, role: 'base' }];
                }
                this.authoringFlow = 'tryBuy';
                this.selectedOffer = undefined;
                this.selectedOsi = undefined;
            }
        });
    }

    toggleHelp() {
        this.helpMode = !this.helpMode;
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
