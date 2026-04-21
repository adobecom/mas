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

export class OstStore extends EventTarget {
    env = 'PRODUCTION';
    environment = undefined;
    landscape = 'PUBLISHED';
    apiKey = '';
    accessToken = '';
    wcsApiKey = '';
    checkoutClientId = 'mas-commerce-service';
    onSelect = null;
    onCancel = null;
    onMultiSelect = null;
    onBundleSelect = null;
    zIndex = 20000;

    aosParams = { ...DEFAULT_AOS_PARAMS };
    country = 'US';
    language = 'en';
    searchQuery = '';
    searchType = '';
    allProducts = [];
    productsLoading = false;
    selectedProduct = undefined;
    offers = [];
    selectedOffer = undefined;
    selectedOsi = undefined;
    authoringFlow = 'tryBuy';
    flowChosen = false;
    selectedOffers = [];
    currentSlot = 'trial';
    pendingFlowSwitch = null;
    promotionCode = undefined;
    storedPromoOverride = undefined;
    masCommerceService = null;
    placeholderTypes = [...DEFAULT_PLACEHOLDER_TYPES];
    defaultPlaceholderOptions = { ...DEFAULT_PLACEHOLDER_OPTIONS };
    offerSelectorPlaceholderOptions = {};
    deepLink = {};
    ctaTextOption = null;
    helpMode = false;

    get viewState() {
        if (!this.selectedProduct && !this.flowChosen) return 'welcome';
        if (this.authoringFlow === 'consult') return 'offers';
        if (this.authoringFlow === 'tryBuy' || this.authoringFlow === 'bundle') return 'offers';
        if (!this.selectedOffer) return 'offers';
        return 'configure';
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

    init(config) {
        this.aosParams = { ...DEFAULT_AOS_PARAMS };
        this.selectedProduct = undefined;
        this.selectedOffer = undefined;
        this.selectedOsi = undefined;
        this.authoringFlow = 'tryBuy';
        this.flowChosen = false;
        this.selectedOffers = [];
        this.currentSlot = 'trial';
        this.pendingFlowSwitch = null;
        this.offers = [];
        this.searchQuery = '';
        this.searchType = '';
        this.deepLink = {};
        this.promotionCode = undefined;
        this.storedPromoOverride = undefined;

        if (config.multiSelect === true) {
            this.authoringFlow = 'tryBuy';
            this.flowChosen = true;
        }
        if (config.bundleSelect === true) {
            this.authoringFlow = 'bundle';
            this.flowChosen = true;
        }
        if (config.authoringFlow && VALID_FLOWS.includes(config.authoringFlow)) {
            this.authoringFlow = config.authoringFlow;
            this.flowChosen = true;
        }
        Object.keys(config).forEach((key) => {
            if (key === 'multiSelect' || key === 'bundleSelect' || key === 'authoringFlow') return;
            if (key in this && config[key] !== undefined) {
                this[key] = config[key];
            }
        });
        if (config.defaultPlaceholderOptions) {
            this.defaultPlaceholderOptions = { ...DEFAULT_PLACEHOLDER_OPTIONS, ...config.defaultPlaceholderOptions };
        }
        if (config.offerSelectorPlaceholderOptions) {
            this.offerSelectorPlaceholderOptions = config.offerSelectorPlaceholderOptions;
        }
        this.notify();
    }

    setAosParams(params) {
        this.aosParams = { ...this.aosParams, ...params };
        this.notify();
    }

    setSearch(query, type) {
        this.searchQuery = query;
        this.searchType = type;
        this.notify();
    }

    setCountry(country) {
        this.country = country;
        this.language = languageMappings[country] || 'en';
        this.notify();
    }

    setProducts(products) {
        this.allProducts = products;
        this.notify();
    }

    setProduct(product) {
        this.selectedProduct = product;
        this.selectedOffer = undefined;
        this.selectedOsi = undefined;
        this.notify();
    }

    setOffers(offers) {
        this.offers = offers;
        this.notify();
    }

    setOffer(offer) {
        this.selectedOffer = offer;
        this.notify();
    }

    setOsi(osi) {
        this.selectedOsi = osi;
        this.notify();
    }

    setAuthoringFlow(flow, keepSelections = false) {
        if (!VALID_FLOWS.includes(flow)) return;
        if (flow === this.authoringFlow) return;

        const hasSelections = this.selectedOffers.length > 0 || !!this.selectedOffer;
        if (!keepSelections && hasSelections) {
            this.pendingFlowSwitch = flow;
            this.notify();
            return;
        }

        this.applyFlowSwitch(flow, keepSelections);
    }

    setCurrentSlot(slot) {
        if (slot !== 'base' && slot !== 'trial') return;
        this.currentSlot = slot;
        this.notify();
    }

    confirmFlowSwitch(keep) {
        const flow = this.pendingFlowSwitch;
        if (!flow) return;
        this.pendingFlowSwitch = null;
        this.applyFlowSwitch(flow, keep);
    }

    cancelFlowSwitch() {
        this.pendingFlowSwitch = null;
        this.notify();
    }

    applyFlowSwitch(flow, keepSelections) {
        let previousOffers = keepSelections ? [...this.selectedOffers] : [];
        if (keepSelections && previousOffers.length === 0 && this.selectedOffer) {
            previousOffers = [{ offer: this.selectedOffer, osi: this.selectedOsi }];
        }
        this.authoringFlow = flow;
        this.flowChosen = true;
        this.currentSlot = 'trial';
        this.selectedOffers = [];

        if (keepSelections && previousOffers.length > 0) {
            if (flow === 'single') {
                const first = previousOffers[0];
                this.selectedOffer = first.offer;
                this.selectedOsi = first.osi;
            } else if (flow === 'tryBuy') {
                const first = previousOffers[0];
                this.selectedOffers = [{ offer: first.offer, osi: first.osi, role: 'base' }];
                if (previousOffers[1]) {
                    this.selectedOffers.push({ offer: previousOffers[1].offer, osi: previousOffers[1].osi, role: 'trial' });
                }
            } else if (flow === 'bundle') {
                this.selectedOffers = previousOffers.map((o) => ({ offer: o.offer, osi: o.osi }));
            }
        }

        if (flow !== 'single') {
            this.selectedOffer = undefined;
            this.selectedOsi = undefined;
        }

        this.notify();
    }

    addOffer(offer, osi, role) {
        if (this.authoringFlow === 'consult') return;

        if (this.authoringFlow === 'single') {
            this.selectedOffer = offer;
            this.selectedOsi = osi;
            this.notify();
            return;
        }

        if (this.authoringFlow === 'tryBuy') {
            const targetRole = role || this.currentSlot;
            this.selectedOffers = this.selectedOffers.filter((o) => o.role !== targetRole);
            this.selectedOffers.push({ offer, osi, role: targetRole });
            if (targetRole === 'trial' && this.currentSlot === 'trial') {
                this.currentSlot = 'base';
            }
            this.notify();
            return;
        }

        if (this.authoringFlow === 'bundle') {
            const existing = this.selectedOffers.findIndex(
                (o) => o.offer === offer || o.osi === osi,
            );
            if (existing >= 0) {
                this.selectedOffers.splice(existing, 1);
            } else {
                this.selectedOffers.push({ offer, osi });
            }
            this.selectedOffers = [...this.selectedOffers];
            this.notify();
            return;
        }
    }

    removeOffer(index) {
        if (index >= 0 && index < this.selectedOffers.length) {
            this.selectedOffers.splice(index, 1);
            this.selectedOffers = [...this.selectedOffers];
            this.notify();
        }
    }

    removeOfferByRole(role) {
        this.selectedOffers = this.selectedOffers.filter((o) => o.role !== role);
        this.notify();
    }

    clearOffers() {
        this.selectedOffers = [];
        this.selectedOffer = undefined;
        this.selectedOsi = undefined;
        this.notify();
    }

    isOfferSelected(offer) {
        if (this.selectedOffer === offer) return true;
        return this.selectedOffers.some((o) => o.offer === offer);
    }

    setPromoCode(code) {
        this.storedPromoOverride = code;
        this.notify();
    }

    toggleMultiSelect() {
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
            this.notify();
        }
    }

    toggleHelp() {
        this.helpMode = !this.helpMode;
        this.notify();
    }

    applySearchParams(searchParameters) {
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
            this.flowChosen = true;
        }
        if (get('bundleSelect') === 'true') {
            this.authoringFlow = 'bundle';
            this.flowChosen = true;
        }
        const flow = get('authoringFlow');
        if (flow && VALID_FLOWS.includes(flow)) {
            this.authoringFlow = flow;
            this.flowChosen = true;
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
        if (get('arrangement_code')) aosUpdates.arrangementCode = get('arrangement_code');
        if (get('commitment')) aosUpdates.commitment = get('commitment');
        if (get('term')) aosUpdates.term = get('term');
        if (get('customerSegment')) aosUpdates.customerSegment = get('customerSegment');
        if (get('marketSegment')) aosUpdates.marketSegment = get('marketSegment');
        if (get('offerType')) aosUpdates.offerType = get('offerType');
        if (Object.keys(aosUpdates).length > 0) {
            this.setAosParams(aosUpdates);
            return;
        }

        this.notify();
    }
}

export const store = new OstStore();
