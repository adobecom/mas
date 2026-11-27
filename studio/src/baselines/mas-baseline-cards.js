import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import styles from './mas-baseline-cards.css.js';
import { BASELINE_SOURCE_LOCALE, PAGE_NAMES } from '../constants.js';
import Store from '../store.js';
import router from '../router.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { showToast } from '../utils.js';
import { confirmation } from '../mas-confirm-dialog.js';
import { buildEditorHref } from '../common/utils/editor-link.js';
import { isFragmentNotFoundError } from '../common/utils/fragment-api.js';
import { processConcurrently } from '../common/utils/item-loading.js';
import { fetchProducts } from '../services/product-api.js';
import { getProductName } from '../utils/mas-chat-helpers.js';
import {
    buildBaselineCardsPlan,
    checkPlanOffers,
    fieldValues,
    getAbmCardError,
    getCardMarketSegment,
    getProductKey,
    getSharedTemplateCards,
    groupCardsByProduct,
    isFreeCard,
    parseFragmentIds,
    PLAN_TYPES,
} from './baseline-cards-model.js';
import {
    findExistingItems,
    getItemIdentity,
    ITEM_STATUS,
    NOT_CREATED,
    reuse,
    runBaselineCardsPlan,
} from './baseline-cards-runner.js';
import { filterDisclaimerKeys, findDisclaimerKey, loadDisclaimerKeys } from './disclaimer-keys.js';
import '../common/components/mas-offer-field.js';
import '../mas-fragment-status.js';

const FETCH_CONCURRENCY = 4;
const LOOKUP_DELAY_MS = 300;
const CHECKING = 'checking';

const STATUS_LABELS = {
    [CHECKING]: 'Checking…',
    [ITEM_STATUS.PENDING]: 'To create',
    [ITEM_STATUS.EXISTS]: 'Exists · reuse',
    [ITEM_STATUS.CREATING]: 'Creating…',
    [ITEM_STATUS.CREATED]: 'Created',
    [ITEM_STATUS.CONFLICT]: 'Conflict',
    [ITEM_STATUS.FAILED]: 'Failed',
    [ITEM_STATUS.BLOCKED]: 'Blocked',
};

const STATUS_VARIANTS = {
    [ITEM_STATUS.EXISTS]: 'info',
    [ITEM_STATUS.CREATING]: 'notice',
    [ITEM_STATUS.CREATED]: 'positive',
    [ITEM_STATUS.CONFLICT]: 'negative',
    [ITEM_STATUS.FAILED]: 'negative',
    [ITEM_STATUS.BLOCKED]: 'negative',
};

const TO_CREATE = new Set([ITEM_STATUS.PENDING, ITEM_STATUS.FAILED, ITEM_STATUS.BLOCKED]);

const ITEM_TYPE_LABELS = { baseline: 'Baseline', card: 'Card', collection: 'Collection' };

const OFFER_ROLES = [
    { role: 'osi', label: (plan) => `${plan} offer`, placeholder: (plan) => `Select ${plan} offer…` },
    {
        role: 'trialOsi',
        label: (plan) => `${plan} trial offer`,
        placeholder: (plan) => `Select ${plan} trial offer… (optional)`,
    },
];

/**
 * `loadOfferData` cache that forgets failed lookups, so they are retried.
 */
class OfferCache extends Map {
    set(key, value) {
        return value ? super.set(key, value) : this;
    }
}

/**
 * "Create baselines and collections" page: builds the baselines, plan cards & collections of pasted ABM cards, then
 * creates them in en_US.
 */
export class MasBaselineCards extends LitElement {
    static styles = styles;

    static properties = {
        linksText: { state: true },
        freeOverrides: { state: true },
        products: { state: true },
        productNames: { state: true },
        grouping: { state: true },
        unresolvedIds: { state: true },
        offers: { state: true },
        checks: { state: true },
        disclaimerKeys: { state: true },
        disclaimers: { state: true },
        disclaimerQueries: { state: true },
        label: { state: true },
        existing: { state: true },
        results: { state: true },
        running: { state: true },
    };

    #surface;
    #landscape;
    #fragments = new Map();
    #fetchAbortController = null;
    #linksStale = false;
    #requestedIds = new Set();
    #offerCache = new OfferCache();
    #cardsKey = '';
    #cardsToGroup = null;
    #groupingId = 0;
    #productNamesRequested = false;
    #checkKeys = new Map();
    #lookedUpPaths = new Set();
    #pendingLookups = new Set();
    #itemsToLookUp = [];
    #lookUpTimeout = null;
    #runIdentities = new Map();
    #runAbortController = null;
    #statusByPath = new Map();
    #disclaimerKeysToLoad = false;
    #disclaimersAbortController = null;
    #defaultDisclaimers = {};
    #disclaimerOptions = {};

    constructor() {
        super();
        this.linksText = '';
        this.freeOverrides = new Map();
        this.products = [];
        this.productNames = new Map();
        this.grouping = false;
        this.unresolvedIds = new Set();
        this.offers = new Map();
        this.checks = new Map();
        this.disclaimerKeys = null;
        this.disclaimers = {};
        this.disclaimerQueries = {};
        this.label = '';
        this.existing = new Map();
        this.results = new Map();
        this.running = false;
        this.links = [];
        this.cardIds = [];
        this.freeCards = [];
        this.items = [];
        this.reactiveController = new ReactiveController(this, [Store.search, Store.landscape]);
    }

    connectedCallback() {
        super.connectedCallback();
        Store.removeRegionOverride();
        if (Store.filters.value.locale !== BASELINE_SOURCE_LOCALE) {
            Store.filters.set((prev) => ({ ...prev, locale: BASELINE_SOURCE_LOCALE }));
        }
        this.#fetchAbortController = new AbortController();
        window.addEventListener('beforeunload', this.#onBeforeUnload);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('beforeunload', this.#onBeforeUnload);
        this.#disclaimersAbortController?.abort();
        this.#fetchAbortController.abort();
        this.#runAbortController?.abort();
        clearTimeout(this.#lookUpTimeout);
    }

    #onBeforeUnload = (event) => {
        if (!this.hasChanges) return;
        event.preventDefault();
        event.returnValue = '';
    };

    /**
     * Whether leaving loses input: something was entered and not everything has been created from it yet. Input with an
     * error, or still checked, is not created yet.
     */
    get hasChanges() {
        if (this.running) return true;
        if (this.#settled && !this.#hasLinkError && this.items.length > 0 && !this.#hasUncreatedItems) return false;
        return (
            Boolean(this.linksText.trim() || this.label.trim()) ||
            PLAN_TYPES.some((plan) => (this.disclaimers[plan] ?? '') !== (this.#defaultDisclaimers[plan] ?? ''))
        );
    }

    async promptDiscardChanges() {
        if (!this.hasChanges) return true;
        if (this.running) {
            return confirmation({
                title: 'Items are being created',
                content: 'Leaving stops the creation once the current item is done. Leave anyway?',
                confirmLabel: 'Stop and leave',
                cancelLabel: 'Stay',
                variant: 'confirmation',
            });
        }
        return confirmation({
            title: 'Unsaved changes',
            content: 'You have unsaved changes. Leave anyway?',
            confirmLabel: 'Discard',
            cancelLabel: 'Stay',
            variant: 'confirmation',
        });
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    /**
     * Derives the links & items from what changed; the requests they need are sent in `updated`. A surface or landscape
     * change waits for the end of a run.
     */
    willUpdate(changed) {
        const surface = Store.surface();
        const surfaceChanged = surface !== this.#surface && !this.running;
        if (surfaceChanged) this.#changeSurface(surface);
        const landscapeChanged = Store.landscape.value !== this.#landscape && !this.running;
        if (landscapeChanged) this.#changeLandscape();
        const linksChanged =
            surfaceChanged || landscapeChanged || this.#linksStale || changed.has('linksText') || changed.has('freeOverrides');
        if (linksChanged) this.#updateLinks();
        if (linksChanged || ['products', 'checks', 'label', 'disclaimers'].some((name) => changed.has(name))) {
            this.items = this.#buildItems();
            this.#pruneResults();
            const items = this.items.filter(({ path }) => !this.#lookedUpPaths.has(path) && !this.#pendingLookups.has(path));
            for (const { path } of items) this.#pendingLookups.add(path);
            this.#itemsToLookUp.push(...items);
        }
        if (changed.has('disclaimerKeys') || changed.has('disclaimerQueries')) {
            this.#disclaimerOptions = this.#buildDisclaimerOptions();
        }
        this.#statusByPath = new Map(this.items.map((item) => [item.path, this.#buildStatus(item)]));
    }

    updated(changed) {
        if (this.#disclaimerKeysToLoad) {
            this.#disclaimerKeysToLoad = false;
            this.#loadDisclaimerKeys(this.#surface);
        }
        if (this.#cardsToGroup) {
            this.#groupProducts(this.#cardsToGroup);
            this.#cardsToGroup = null;
        }
        if (changed.has('products') || changed.has('offers')) this.#checkOffers();
        if (this.#itemsToLookUp.length) {
            clearTimeout(this.#lookUpTimeout);
            this.#lookUpTimeout = setTimeout(() => this.#lookUpPlannedItems(), LOOKUP_DELAY_MS);
        }
    }

    #changeSurface(surface) {
        this.#surface = surface;
        this.disclaimers = {};
        this.#defaultDisclaimers = {};
        this.disclaimerQueries = {};
        this.disclaimerKeys = null;
        this.#disclaimerKeysToLoad = true;
        this.products = [];
        this.offers = new Map();
        this.checks = new Map();
        this.#checkKeys = new Map();
        this.#cardsKey = null;
        this.#groupingId += 1;
        this.grouping = false;
        this.freeCards = [];
        this.cardIds = [];
        this.unresolvedIds = new Set();
    }

    /**
     * Forgets the offers resolved in the previous landscape, so the cards are grouped and their offers checked again. A
     * new cache keeps the lookups still running from filling it with offers of the previous landscape.
     */
    #changeLandscape() {
        this.#landscape = Store.landscape.value;
        this.#offerCache = new OfferCache();
        this.#cardsKey = null;
        this.#groupingId += 1;
    }

    async #loadDisclaimerKeys(surface) {
        this.#disclaimersAbortController?.abort();
        if (!surface) return;
        const abortController = new AbortController();
        this.#disclaimersAbortController = abortController;
        try {
            const keys = await loadDisclaimerKeys(this.repository, surface, abortController);
            if (abortController.signal.aborted) return;
            this.disclaimerKeys = keys;
            this.disclaimers = Object.fromEntries(PLAN_TYPES.map((plan) => [plan, findDisclaimerKey(keys, plan)]));
            this.#defaultDisclaimers = this.disclaimers;
        } catch (error) {
            if (abortController.signal.aborted) return;
            this.disclaimerKeys = [];
            this.repository.processError(error, 'Could not load the dictionary.');
        }
    }

    #updateLinks() {
        this.#linksStale = false;
        this.links = this.#buildLinks();
        if (this.links.some(({ loading }) => loading)) return;
        const cards = this.links.filter(({ fragment, error }) => fragment && !error);
        this.cardIds = cards.map(({ id }) => id);
        this.freeCards = cards.filter(({ free }) => free).map(({ fragment }) => fragment);
        const paidCards = cards.filter(({ free }) => !free).map(({ fragment }) => fragment);
        const cardsKey = paidCards.map(({ id }) => id).join(',');
        if (cardsKey === this.#cardsKey) return;
        this.#cardsKey = cardsKey;
        this.#cardsToGroup = paidCards;
        this.grouping = true;
    }

    #buildLinks() {
        const seenIds = new Set();
        return parseFragmentIds(this.linksText).map((id) => {
            if (seenIds.has(id)) return { id, error: 'Already added.', duplicate: true };
            seenIds.add(id);
            const entry = this.#fragments.get(id);
            if (!entry) return { id, loading: true };
            if (entry.error) return { id, error: entry.error };
            const { fragment, detectedFree } = entry;
            const error = getAbmCardError(fragment, this.#surface);
            if (error) return { id, fragment, error };
            return { id, fragment, detectedFree, free: this.freeOverrides.get(id) ?? detectedFree };
        });
    }

    async #fetchFragments(ids) {
        const newIds = [...new Set(ids)].filter((id) => !this.#requestedIds.has(id));
        if (!newIds.length) return;
        for (const id of newIds) this.#requestedIds.add(id);
        const abortController = this.#fetchAbortController;
        await processConcurrently(
            newIds,
            async (id) => {
                const entry = await this.#fetchFragment(id, abortController);
                if (abortController.signal.aborted) {
                    this.#requestedIds.delete(id);
                    return;
                }
                this.#fragments.set(id, entry);
                this.#linksStale = true;
                this.requestUpdate();
            },
            FETCH_CONCURRENCY,
        );
    }

    async #fetchFragment(id, abortController) {
        try {
            const fragment = await this.repository.aem.sites.cf.fragments.getById(id, abortController, { references: '' });
            return { fragment, detectedFree: isFreeCard(fragment) };
        } catch (error) {
            if (isFragmentNotFoundError(error)) return { error: 'Not found.' };
            return { error: error.message, retry: true };
        }
    }

    async #groupProducts(cards) {
        const groupingId = ++this.#groupingId;
        if (cards.length) this.#loadProductNames();
        const { products, unresolvedCards } = await groupCardsByProduct(cards, { cache: this.#offerCache });
        if (groupingId !== this.#groupingId) return;
        const leadCardIds = new Map(this.products.map((product) => [getProductKey(product), product.cards[0].id]));
        this.offers = new Map(
            products.map((product) => {
                const key = getProductKey(product);
                const offers = this.offers.get(key);
                if (leadCardIds.get(key) === product.cards[0].id) return [key, offers];
                return [key, { ...offers, ...product.offers }];
            }),
        );
        this.unresolvedIds = new Set(unresolvedCards.map(({ id }) => id));
        this.products = products;
        this.grouping = false;
    }

    async #loadProductNames() {
        if (this.#productNamesRequested) return;
        this.#productNamesRequested = true;
        try {
            const { products } = await fetchProducts();
            this.productNames = new Map(products.map((product) => [product.arrangement_code, getProductName(product)]));
        } catch (error) {
            this.#productNamesRequested = false;
            console.warn('Product names not loaded:', error.message);
        }
    }

    #offersOf(product) {
        return this.offers.get(getProductKey(product)) ?? {};
    }

    /**
     * Key of the check of a product's current offers in the current landscape.
     */
    #checkKeyOf(product) {
        return JSON.stringify({ landscape: this.#landscape, offers: this.#offersOf(product) });
    }

    /**
     * Checks the offers of the products whose offers changed, at most 4 at a time, then saves the checks still current
     * at once.
     */
    async #checkOffers() {
        const toCheck = this.products.flatMap((product) => {
            const productKey = getProductKey(product);
            const offers = this.#offersOf(product);
            const key = this.#checkKeyOf(product);
            if (this.#checkKeys.get(productKey) === key) return [];
            this.#checkKeys.set(productKey, key);
            return [{ product: { ...product, offers }, productKey, key }];
        });
        if (!toCheck.length) return;
        const checks = await processConcurrently(toCheck, (entry) => this.#checkProductOffers(entry), FETCH_CONCURRENCY);
        const current = checks.filter((check) => check && this.#checkKeys.get(check.productKey) === check.key);
        if (!current.length) return;
        const next = new Map(this.checks);
        for (const { productKey, key, offers } of current) next.set(productKey, { key, offers });
        this.checks = next;
    }

    /**
     * Checks the offers of a product, keyed by `key`; a failed check, `null`, is retried on the next offer change.
     */
    async #checkProductOffers({ product, productKey, key }) {
        try {
            const offers = await checkPlanOffers(product, { cache: this.#offerCache });
            return { productKey, key, offers };
        } catch (error) {
            if (this.#checkKeys.get(productKey) !== key) return null;
            this.#checkKeys.delete(productKey);
            this.repository.processError(error, 'Could not check the offers.');
            return null;
        }
    }

    /**
     * Checked offers of a product for its current offers; `null` while they are checked.
     */
    #checkedOffersOf(product) {
        const check = this.checks.get(getProductKey(product));
        return check?.key === this.#checkKeyOf(product) ? check.offers : null;
    }

    get #checking() {
        return this.grouping || this.products.some((product) => !this.#checkedOffersOf(product));
    }

    get #hasInvalidOffer() {
        return this.products.some((product) => Object.values(this.#checkedOffersOf(product) ?? {}).some(({ error }) => error));
    }

    #buildItems() {
        if (!this.products.length) return [];
        const products = this.products.map((product) => ({
            ...product,
            offers: this.checks.get(getProductKey(product))?.offers ?? {},
        }));
        return buildBaselineCardsPlan({
            surface: this.#surface,
            products,
            freeCards: this.freeCards,
            cardIds: this.cardIds,
            label: this.label,
            disclaimerKeys: this.disclaimers,
        });
    }

    /**
     * Drops the results of items that are no longer planned or would now create another fragment.
     */
    #pruneResults() {
        if (this.running || !this.results.size) return;
        const identities = new Map(this.items.map((item) => [item.path, getItemIdentity(item)]));
        const results = [...this.results].filter(([path]) => identities.get(path) === this.#runIdentities.get(path));
        if (results.length < this.results.size) this.results = new Map(results);
    }

    /**
     * Looks up the queued items that are still planned; the others, superseded by later edits, are dropped.
     */
    #lookUpPlannedItems() {
        const paths = new Set(this.items.map(({ path }) => path));
        const items = this.#itemsToLookUp.filter(({ path }) => paths.has(path));
        for (const { path } of this.#itemsToLookUp) {
            if (!paths.has(path)) this.#pendingLookups.delete(path);
        }
        this.#itemsToLookUp = [];
        if (items.length) this.#lookUpItems(items);
    }

    /**
     * Looks up the fragments at the item paths; failed lookups are retried with the next items.
     */
    async #lookUpItems(items) {
        try {
            const found = await findExistingItems(this.repository.aem.sites.cf.fragments, items);
            for (const { path } of items) this.#lookedUpPaths.add(path);
            this.existing = new Map([...this.existing, ...found]);
        } catch (error) {
            this.repository.processError(error, 'Could not check which items already exist.');
        } finally {
            for (const { path } of items) this.#pendingLookups.delete(path);
            this.requestUpdate();
        }
    }

    #statusOf(item) {
        return this.#statusByPath.get(item.path);
    }

    #buildStatus(item) {
        const result = this.results.get(item.path);
        if (result) return result;
        const fragment = this.existing.get(item.path);
        if (fragment) return reuse(item, fragment);
        if (this.#pendingLookups.has(item.path)) return { status: CHECKING };
        return { status: ITEM_STATUS.PENDING };
    }

    get #toCreateCount() {
        return this.items.filter((item) => TO_CREATE.has(this.#statusOf(item).status)).length;
    }

    get #hasUncreatedItems() {
        return this.items.some((item) => {
            const { status } = this.#statusOf(item);
            return TO_CREATE.has(status) || NOT_CREATED.has(status);
        });
    }

    get #canCreate() {
        return (
            !this.running &&
            this.products.length > 0 &&
            this.disclaimerKeys !== null &&
            this.#settled &&
            this.#toCreateCount > 0
        );
    }

    /**
     * Whether the links are loaded, the offers & disclaimers valid and the items checked.
     */
    get #settled() {
        return (
            !this.links.some(({ loading }) => loading) &&
            !this.#checking &&
            !this.#hasInvalidOffer &&
            !this.#hasUnknownDisclaimer &&
            !this.items.some((item) => this.#statusOf(item).status === CHECKING)
        );
    }

    get #hasLinkError() {
        return this.links.some((link) => !link.duplicate && this.#linkMessage(link));
    }

    get #hasUnknownDisclaimer() {
        return PLAN_TYPES.some((plan) => this.#isUnknownDisclaimer(plan));
    }

    #isUnknownDisclaimer(plan) {
        const key = this.disclaimers[plan];
        return Boolean(key) && !this.disclaimerKeys?.some((entry) => entry.key === key);
    }

    async #create() {
        if (!this.#canCreate) return;
        const hadFocus = Boolean(this.shadowRoot.activeElement);
        this.running = true;
        Store.baselines.creating.set(true);
        const { items } = this;
        this.#runIdentities = new Map(items.map((item) => [item.path, getItemIdentity(item)]));
        const abortController = new AbortController();
        this.#runAbortController = abortController;
        const start = performance.now();
        try {
            const results = await runBaselineCardsPlan(this.repository, items, {
                existing: this.existing,
                signal: abortController.signal,
                onStatus: ({ path }, result) => {
                    this.results = new Map(this.results).set(path, result);
                    if (result.fragment) this.existing = new Map(this.existing).set(path, result.fragment);
                },
            });
            if (abortController.signal.aborted) return;
            const statuses = [...results.values()].map(({ status }) => status);
            const created = statuses.filter((status) => status === ITEM_STATUS.CREATED).length;
            const notCreated = statuses.filter((status) => NOT_CREATED.has(status)).length;
            const seconds = ((performance.now() - start) / 1000).toFixed(1);
            if (notCreated) showToast(`${notCreated} of ${items.length} items could not be created.`, 'negative');
            else showToast(`${created} items created in ${seconds}s.`, 'positive');
        } finally {
            this.#runAbortController = null;
            this.running = false;
            Store.baselines.creating.set(false);
            if (hadFocus && this.isConnected) this.#restoreFocus();
        }
    }

    /**
     * Moves the focus lost by the disabled Create button back to it once enabled again, else to the items heading.
     */
    async #restoreFocus() {
        await this.updateComplete;
        const focused = this.shadowRoot.activeElement;
        if (focused && !focused.disabled) return;
        const button = this.shadowRoot.querySelector('.create-actions sp-button');
        (button.disabled ? this.shadowRoot.getElementById('items-heading') : button).focus();
    }

    #setLinksText(text) {
        for (const [id, { retry }] of this.#fragments) {
            if (!retry) continue;
            this.#fragments.delete(id);
            this.#requestedIds.delete(id);
        }
        if (this.unresolvedIds.size) this.#cardsKey = null;
        this.linksText = text;
        this.#fetchFragments(parseFragmentIds(text));
    }

    #setFree(id, free) {
        this.freeOverrides = new Map(this.freeOverrides).set(id, free);
    }

    #setOffer(product, plan, role, osi) {
        const productKey = getProductKey(product);
        this.#checkKeys.delete(productKey);
        const offers = this.#offersOf(product);
        const planOffer = role === 'osi' && !osi ? {} : { ...offers[plan], [role]: osi };
        this.offers = new Map(this.offers).set(productKey, { ...offers, [plan]: planOffer });
    }

    /**
     * Removes an offer, then moves the focus from the unmounted remove button to its offer field.
     */
    async #removeOffer(event, product, plan, role) {
        const offerField = event.currentTarget.closest('.offer').querySelector('mas-offer-field');
        this.#setOffer(product, plan, role, '');
        await this.updateComplete;
        await offerField.updateComplete;
        offerField.focus();
    }

    #setDisclaimer(plan, key) {
        this.disclaimers = { ...this.disclaimers, [plan]: key.trim() };
        this.disclaimerQueries = { ...this.disclaimerQueries, [plan]: '' };
    }

    #buildDisclaimerOptions() {
        const keys = this.disclaimerKeys ?? [];
        return Object.fromEntries(
            PLAN_TYPES.map((plan) => {
                const options = filterDisclaimerKeys(keys, this.disclaimerQueries[plan] ?? '').map(({ key }) => ({
                    value: key,
                    itemText: key,
                }));
                return [plan, options.length ? options : undefined];
            }),
        );
    }

    /**
     * Progress of the run for screen readers; the toast announces its outcome.
     */
    get #runProgress() {
        if (!this.running) return '';
        const done = this.items.filter((item) => {
            const status = this.results.get(item.path)?.status;
            return status && status !== ITEM_STATUS.PENDING && status !== ITEM_STATUS.CREATING;
        }).length;
        return `Creating… ${done} of ${this.items.length} items done.`;
    }

    get #headerTemplate() {
        return html`<div class="baseline-cards-header">
            <sp-action-button quiet size="s" ?disabled=${this.running} @click=${router.navigateToPage(PAGE_NAMES.BASELINES)}>
                <sp-icon-chevron-left slot="icon"></sp-icon-chevron-left>
                Baselines
            </sp-action-button>
            <h1>Create baselines and collections</h1>
        </div>`;
    }

    #linkMessage({ id, error, free }) {
        if (error) return error;
        return !free && this.unresolvedIds.has(id) ? 'Its offer could not be resolved.' : '';
    }

    /**
     * Errors of the links for screen readers, once the links are loaded and grouped, each named after its card.
     */
    get #linksAnnouncement() {
        if (this.grouping || this.links.some(({ loading }) => loading)) return '';
        return this.links
            .map((link) => [link.fragment?.title ?? link.id, this.#linkMessage(link)])
            .filter(([, message]) => message)
            .map(([name, message]) => `${name}: ${message}`)
            .join(' ');
    }

    #linkTemplate(link) {
        const { id, fragment, loading, error, detectedFree, free } = link;
        const message = this.#linkMessage(link);
        let status = html`<sp-icon-checkmark-circle class="positive" label="Added"></sp-icon-checkmark-circle>`;
        if (loading) status = html`<sp-progress-circle size="s" indeterminate label="Loading"></sp-progress-circle>`;
        else if (message) status = html`<sp-icon-alert class="negative" label="Error"></sp-icon-alert>`;
        return html`<li class="link" data-id=${id}>
            ${status}
            <span class="link-title"
                >${fragment ? html`<a href=${buildEditorHref(fragment)} target="_blank">${fragment.title}</a>` : id}</span
            >
            <span class="link-message">${message ? html`<span class="link-error">${message}</span>` : nothing}</span>
            ${free && detectedFree ? html`<span class="link-hint">No price or checkout link</span>` : nothing}
            ${fragment && !error
                ? html`<sp-switch size="s" .checked=${free} @change=${(event) => this.#setFree(id, event.target.checked)}
                      >Free<span class="visually-hidden">: ${fragment.title}</span></sp-switch
                  >`
                : nothing}
        </li>`;
    }

    get #cardsTemplate() {
        return html`<section class="form-field step" ?inert=${this.running}>
            <h2>1 · ABM cards</h2>
            <p class="hint">
                A Free card gets no baseline nor plan cards: it is added as is to the collections of its template & market
                segment.
            </p>
            <sp-field-label for="links">Links to the ABM cards</sp-field-label>
            <sp-textfield
                id="links"
                multiline
                grows
                placeholder="Paste Studio search links, fragment editor links or fragment IDs, one per line"
                .value=${this.linksText}
                @input=${(event) => this.#setLinksText(event.target.value)}
            ></sp-textfield>
            <span class="visually-hidden links-announcement" aria-live="polite">${this.#linksAnnouncement}</span>
            ${this.links.length
                ? html`<ul class="links">
                      ${this.links.map((link) => this.#linkTemplate(link))}
                  </ul>`
                : nothing}
        </section>`;
    }

    #offerFieldTemplate(product, plan, { role, label, placeholder }, checked) {
        const { productArrangementCode } = product;
        const osi = this.#offersOf(product)[plan]?.[role] ?? '';
        const PLAN = plan.toUpperCase();
        let error = '';
        if (role === 'osi') error = checked?.error ?? '';
        else if (checked?.removedTrialOsi)
            error = `Wrong ${PLAN} trial for ${productArrangementCode}: the Free trial CTA is removed.`;
        return html`<div class="offer" data-role=${role}>
            <mas-offer-field
                label=${label(PLAN)}
                placeholder=${placeholder(PLAN)}
                optional
                .osi=${osi}
                .error=${error}
                @change=${({ detail }) => this.#setOffer(product, plan, role, detail.osi)}
            ></mas-offer-field>
            ${osi
                ? html`<sp-action-button
                      quiet
                      size="s"
                      label="Remove ${label(PLAN)}"
                      @click=${(event) => this.#removeOffer(event, product, plan, role)}
                  >
                      <sp-icon-delete slot="icon"></sp-icon-delete>
                  </sp-action-button>`
                : nothing}
        </div>`;
    }

    #sharedOfferTemplate(productName, [template, cards]) {
        const titles = cards.map(({ title }) => `"${title}"`).join(', ');
        return html`<sp-help-text class="shared-offer" variant="negative" icon>
            The ${template} cards ${titles} all have ${productName} offers. They get one baseline, copied from the first card,
            and the same plan offers below. If a card is for another product, fix its offer or remove its link.
        </sp-help-text>`;
    }

    #productTemplate(product) {
        const { productArrangementCode, productCode, marketSegment, cards } = product;
        const checked = this.#checkedOffersOf(product) ?? {};
        const name = this.productNames.get(productArrangementCode);
        const headingId = `product-${productArrangementCode}-${marketSegment}`;
        return html`<div class="product" role="group" aria-labelledby=${headingId} data-product=${productArrangementCode}>
            <h3 id=${headingId}>${name || productArrangementCode}</h3>
            <p class="product-meta">
                ${[
                    name && productArrangementCode,
                    productCode,
                    marketSegment,
                    cards.map((card) => fieldValues(card, 'variant')[0]).join(', '),
                ]
                    .filter(Boolean)
                    .join(' · ')}
            </p>
            ${getSharedTemplateCards(product).map((entry) => this.#sharedOfferTemplate(name || productArrangementCode, entry))}
            <div class="plans">
                ${PLAN_TYPES.map(
                    (plan) =>
                        html`<div class="plan" data-plan=${plan}>
                            ${OFFER_ROLES.map((role) => this.#offerFieldTemplate(product, plan, role, checked[plan]))}
                        </div>`,
                )}
            </div>
        </div>`;
    }

    #freeCardTemplate(card) {
        const template = fieldValues(card, 'variant')[0];
        const marketSegment = getCardMarketSegment(card);
        const plans = this.items
            .filter(({ type, cards }) => type === 'collection' && cards.includes(card.path))
            .map(({ plan }) => plan.toUpperCase());
        const collections = plans.length
            ? html`<p class="free-collections">Added as is to the ${plans.join(', ')} collections.</p>`
            : html`<sp-help-text>In no collection: no other ${template} ${marketSegment} card has a plan card.</sp-help-text>`;
        return html`<div class="product free" role="group" aria-labelledby="card-${card.id}" data-card=${card.id}>
            <h3 id="card-${card.id}">${card.title} <sp-badge size="s" variant="informative">Free</sp-badge></h3>
            <p class="product-meta">${template} · ${marketSegment} · no baseline, no plan cards</p>
            ${collections}
        </div>`;
    }

    get #offersTemplate() {
        let content = html`<div class="empty-state">
            <sp-icon-shopping-cart size="xl"></sp-icon-shopping-cart>
            <div class="label">
                <strong>No products yet</strong><br />
                <span>Add ABM cards to pick the M2M & PUF offers of their products.</span>
            </div>
        </div>`;
        if (this.products.length || this.freeCards.length) {
            content = html`<div class="products">
                ${repeat(
                    this.products,
                    (product) => getProductKey(product),
                    (product) => this.#productTemplate(product),
                )}
                ${repeat(
                    this.freeCards,
                    ({ id }) => id,
                    (card) => this.#freeCardTemplate(card),
                )}
            </div>`;
        }
        return html`<section class="form-field step" ?inert=${this.running}>
            <h2>2 · Offers</h2>
            <p class="hint">A plan without an offer gets no card.</p>
            ${content}
        </section>`;
    }

    #disclaimerTemplate(plan) {
        const PLAN = plan.toUpperCase();
        const key = this.disclaimers[plan] ?? '';
        const status = this.disclaimerKeys?.find((entry) => entry.key === key)?.status;
        const unknown = this.#isUnknownDisclaimer(plan);
        let message = nothing;
        if (unknown) {
            message = html`<sp-help-text slot="negative-help-text" variant="negative"
                >Not a key of the ${BASELINE_SOURCE_LOCALE} dictionary.</sp-help-text
            >`;
        } else if (!key && this.disclaimerKeys) {
            message = html`<sp-help-text slot="help-text">${PLAN} cards will have no legal disclaimer.</sp-help-text>`;
        }
        return html`<div class="disclaimer" data-plan=${plan}>
            <sp-field-label for="disclaimer-${plan}">${PLAN} legal disclaimer</sp-field-label>
            <div class="disclaimer-input">
                <sp-combobox
                    id="disclaimer-${plan}"
                    placeholder="No legal disclaimer"
                    .options=${this.#disclaimerOptions[plan]}
                    .value=${key}
                    ?pending=${!this.disclaimerKeys}
                    ?invalid=${unknown}
                    @input=${(event) => (this.disclaimerQueries = { ...this.disclaimerQueries, [plan]: event.target.value })}
                    @change=${(event) => this.#setDisclaimer(plan, event.target.value)}
                    >${message}</sp-combobox
                >
                ${status ? html`<mas-fragment-status variant=${status.toLowerCase()}></mas-fragment-status>` : nothing}
            </div>
        </div>`;
    }

    get #disclaimersTemplate() {
        return html`<section class="form-field step" ?inert=${this.running}>
            <h2>3 · Legal disclaimer</h2>
            <p class="hint">Placeholder shown in the callout of the cards of each plan.</p>
            <div class="disclaimers">${PLAN_TYPES.map((plan) => this.#disclaimerTemplate(plan))}</div>
        </section>`;
    }

    #statusTemplate(item) {
        const { status, fragment, error } = this.#statusOf(item);
        const open =
            status === ITEM_STATUS.CREATED && fragment
                ? html` · <a href=${buildEditorHref(fragment)} target="_blank" aria-label="Open ${item.title}">open</a>`
                : nothing;
        return html`<sp-table-cell class="status" data-status=${status}>
            <sp-status-light size="s" variant=${STATUS_VARIANTS[status] ?? 'neutral'}>
                ${STATUS_LABELS[status]}${open}
            </sp-status-light>
            ${error ? html`<span class="item-error">${error}</span>` : nothing}
        </sp-table-cell>`;
    }

    #itemTemplate(item) {
        return html`<sp-table-row value=${item.path} data-type=${item.type}>
            <sp-table-cell class="type">${ITEM_TYPE_LABELS[item.type]}</sp-table-cell>
            <sp-table-cell class="item-plan">${item.plan?.toUpperCase() ?? '—'}</sp-table-cell>
            <sp-table-cell class="title">
                <span class="item-title">${item.title}</span>
                <span class="item-path">${item.path}</span>
            </sp-table-cell>
            ${this.#statusTemplate(item)}
        </sp-table-row>`;
    }

    get #itemsTemplate() {
        const count = this.#toCreateCount;
        let content = html`<div class="empty-state">
            <sp-icon-apps size="xl"></sp-icon-apps>
            <div class="label">
                <strong>Nothing to create yet</strong><br />
                <span>Baselines, cards and collections show here once ABM cards are added.</span>
            </div>
        </div>`;
        if (this.items.length) {
            content = html`<sp-table class="item-table items">
                <sp-table-head>
                    <sp-table-head-cell class="type">Type</sp-table-head-cell>
                    <sp-table-head-cell class="item-plan">Plan</sp-table-head-cell>
                    <sp-table-head-cell class="title">Title</sp-table-head-cell>
                    <sp-table-head-cell class="status">Status</sp-table-head-cell>
                </sp-table-head>
                <sp-table-body>
                    ${repeat(
                        this.items,
                        ({ path }) => path,
                        (item) => this.#itemTemplate(item),
                    )}
                </sp-table-body>
            </sp-table>`;
        }
        return html`<section class="form-field step">
            <h2 id="items-heading" tabindex="-1">4 · What will be created</h2>
            <p class="hint">Existing items are reused, so running again only creates what is missing.</p>
            <div class="collection-label" ?inert=${this.running}>
                <sp-field-label for="collection-label">Collection label</sp-field-label>
                <sp-textfield
                    id="collection-label"
                    placeholder="e.g. Illustrator and CC Pro plans"
                    .value=${this.label}
                    @input=${(event) => (this.label = event.target.value)}
                ></sp-textfield>
            </div>
            ${content}
            <div class="create-actions">
                <span class="visually-hidden" aria-live="polite">${this.#runProgress}</span>
                <sp-button variant="accent" ?disabled=${!this.#canCreate} @click=${this.#create}>
                    ${this.running ? 'Creating…' : `Create ${count} ${count === 1 ? 'item' : 'items'}`}
                </sp-button>
            </div>
        </section>`;
    }

    render() {
        return html`<div class="page-container">
            ${this.#headerTemplate} ${this.#cardsTemplate} ${this.#offersTemplate} ${this.#disclaimersTemplate}
            ${this.#itemsTemplate}
        </div>`;
    }
}

customElements.define('mas-baseline-cards', MasBaselineCards);
