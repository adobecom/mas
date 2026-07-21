import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { MasRepository } from '../mas-repository.js';
import '../aem/aem-tag-picker-field.js';
import { fromAttribute, toAttribute } from '../aem/tag-path-utils.js';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import styles from './mas-promotions-editor-css.js';
import {
    SURFACES,
    PAGE_NAMES,
    PROMOTION_MODEL_ID,
    TABLE_TYPE,
    QUICK_ACTION,
    EVENT_OST_OFFER_SELECT,
    TAG_PROMOTION_PREFIX,
} from '../constants.js';
import '../mas-quick-actions.js';
import { SAVE_SVG, CLONE_SVG, PUBLISH_SVG, COPY_SVG, LOCK_SVG, DELETE_SVG } from '../bulk-publish/bulk-publish-icons.js';
import {
    normalizeKey,
    showToast,
    extractSurfaceFromPath,
    generateCodeToUse,
    getFragmentPartsToUse,
    getCreateProjectErrorMessage,
    MODEL_WEB_COMPONENT_MAPPING,
    UserFriendlyError,
} from '../utils.js';
import { Fragment } from '../aem/fragment.js';
import { Promotion } from '../aem/promotion.js';
import './mas-promotions-items-selector.js';
import './mas-promotions-items-table.js';
import { getItemsSelectionStore, setItemsSelectionStore } from '../common/items-selection-store.js';
import {
    applyPromotionItemSelectionToFragment,
    buildPromotionOffersFieldValues,
    buildPromotionTagPath,
    classifyPromotionPathsForSelection,
    hydratePromotionOfferRecords,
    isPromotionItemSelectionDirty,
    isPromotionOffersSelectionDirty,
    getPromotionRequiredFieldsValidation,
    parsePromotionSurfacesFieldValues,
    parseCountriesFromGeos,
    parsePromoCodeExceptions,
    parsePromotionOffersField,
    parseSelectedOfferIdsFromOffersField,
    groupCountriesByPromoCode,
    handlePromotionOstOfferSelect,
    serializePromotionSurfacesForAem,
    splitPromotionTagsFieldValues,
    PROMOTION_FIELD_TYPE_MAP,
} from './promotion-editor-utils.js';
import { getPromotionTagFromFragment } from './promotion-model.js';
import './mas-promo-codes-manager.js';
import { MANAGE_PROMO_CODES_AND_OFFERS_LABEL } from './mas-promo-codes-manager.js';
import './mas-promotion-duplicate-dialog.js';
import { loadSelectedFragments } from '../common/utils/items-loader.js';
import { openOfferSelectorTool } from '../rte/ost.js';
import {
    canPublishPromotionNow,
    canSchedulePromotion,
    confirmPublishDespiteUnpublishedPromoVariations,
    confirmUnpublishAlongsidePromoVariations,
    publishPromotionProject,
    unpublishPromotionProject,
    promotionDeleteConfirmMessage,
    PROMOTION_EXPIRED_PUBLISH_MESSAGE,
    PROMOTION_SAVE_BEFORE_PUBLISH_MESSAGE,
} from './promotion-publish-utils.js';
import { renderFragmentStatusCell } from '../common/utils/render-utils.js';
import { clearCaches } from '../../libs/fragment-client.js';
import { canEditPromotions } from '../groups.js';
import { deleteAttachedPromoVariations, getAllAttachedPromoVariations } from './promotions-repository.js';

function getPromotionPickerFragmentLabel(data) {
    const webComponentName = MODEL_WEB_COMPONENT_MAPPING[data?.model?.path];
    const fragmentPath = typeof data?.path === 'string' ? data.path : data?.get?.()?.path;
    const pathSurface = extractSurfaceFromPath(fragmentPath);
    const searchSnapshot = Store.search.get();
    const { fragmentParts } = getFragmentPartsToUse(data, pathSurface ?? searchSnapshot.path);
    return `${webComponentName}: ${fragmentParts}`;
}

const PROMOTION_QUICK_ACTIONS = [
    QUICK_ACTION.SAVE,
    QUICK_ACTION.DUPLICATE,
    QUICK_ACTION.PUBLISH,
    QUICK_ACTION.UNPUBLISH,
    QUICK_ACTION.COPY,
    QUICK_ACTION.LINK,
    QUICK_ACTION.LOCK,
    QUICK_ACTION.DELETE,
];

const PROMOTION_QUICK_ACTION_ICON_OVERRIDES = {
    [QUICK_ACTION.SAVE]: { icon: SAVE_SVG, title: 'Save' },
    [QUICK_ACTION.DUPLICATE]: { icon: CLONE_SVG, title: 'Duplicate' },

    [QUICK_ACTION.PUBLISH]: { icon: PUBLISH_SVG, title: 'Publish' },
    [QUICK_ACTION.UNPUBLISH]: { icon: 'sp-icon-publish-remove', title: 'Unpublish' },
    [QUICK_ACTION.COPY]: { icon: COPY_SVG, title: 'Copy link' },
    [QUICK_ACTION.LINK]: { icon: 'sp-icon-copy', title: 'Copy variation links' },
    [QUICK_ACTION.LOCK]: { icon: LOCK_SVG, title: 'Lock project' },
    [QUICK_ACTION.DELETE]: { icon: DELETE_SVG, title: 'Delete', className: 'delete-action' },
};

class MasPromotionsEditor extends LitElement {
    static styles = styles;

    static properties = {
        loadingPromotion: { type: Boolean, state: true },
        isNewPromotion: { type: Boolean, state: true },
        isCreated: { type: Boolean, state: true },
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
        isSelectedItemsOpen: { type: Boolean, state: true },
        promoCodesManagerOpen: { type: Boolean, state: true },
        promoManagerOffers: { type: Array, state: true },
        promotionItemsAddButtonLabel: { type: String, state: true },
        promotionEmptyItemsTab: { type: String, state: true },
        selectedItemsViewTab: { type: String, state: true },
        promotionPublish: { type: Boolean, state: true },
        duplicateDialogOpen: { type: Boolean, state: true },
        duplicating: { type: Boolean, state: true },
        promotionItemsPickerOpen: { type: Boolean, state: true },
        evergreenEnabled: { type: Boolean, state: true },
    };

    #promotionItemsReactive;

    inEdit = Store.promotions.inEdit;
    promotionId = Store.promotions.promotionId;

    storeController = null;
    #itemsSelectionStoreSnapshot = null;
    #cardsSnapshot = [];
    #collectionsSnapshot = [];
    #itemsPickerConfirmed = false;
    #promotionItemsPickerHoldEmptyState = false;
    #duplicateProposedTitle = '';
    #boundHandleOstOfferSelect = null;
    #promoCodesManagerLoading = false;

    constructor() {
        super();
        this.loadingPromotion = false;
        this.isNewPromotion = false;
        this.isCreated = false;
        this.isDialogOpen = false;
        this.confirmDialogConfig = null;
        this.isSelectedItemsOpen = false;
        this.promoCodesManagerOpen = false;
        this.promoManagerOffers = [];
        this.promotionItemsAddButtonLabel = 'Add selected fragments';
        this.promotionEmptyItemsTab = TABLE_TYPE.OFFERS;
        this.selectedItemsViewTab = TABLE_TYPE.OFFERS;
        this.promotionPublish = false;
        this.duplicateDialogOpen = false;
        this.duplicating = false;
        this.promotionItemsPickerOpen = false;
        this.evergreenEnabled = true;
    }

    async connectedCallback() {
        super.connectedCallback();
        this.#itemsSelectionStoreSnapshot = getItemsSelectionStore({ allowUnset: true });
        setItemsSelectionStore(Store.promotions);
        this.#boundHandleOstOfferSelect = this.#handleOstOfferSelect.bind(this);
        document.addEventListener(EVENT_OST_OFFER_SELECT, this.#boundHandleOstOfferSelect);

        const promotionId = this.promotionId.get();
        if (promotionId) {
            this.isNewPromotion = false;
            this.loadingPromotion = true;
            try {
                this.#resetPromotionItemStores();
                if (!this.fragmentStore) {
                    await this.#loadPromotionById(promotionId);
                }
                await this.#hydratePromotionItemSelectionFromFragment();
            } finally {
                this.loadingPromotion = false;
            }
        } else {
            this.#resetPromotionItemStores();
            if (!this.fragmentStore) {
                this.isNewPromotion = true;
                const newPromotion = this.#initializeNewPromotion();
                this.fragmentStore = new FragmentStore(newPromotion);
            } else {
                const existing = this.fragmentStore.get?.();
                this.isNewPromotion = !existing?.id;
            }
            await this.#hydratePromotionItemSelectionFromFragment();
        }

        if (this.promotionPickerSurfaces.length) {
            if (this.repository?.searchFragments) {
                this.repository.searchFragments();
            }
            if (this.repository?.loadAllCollections) {
                this.repository.loadAllCollections();
            }
        }

        if (this.fragmentStore) {
            this.storeController = new StoreController(this, this.fragmentStore);
            this.evergreenEnabled = this.fragment?.isEvergreen ?? true;
        }
        this.#promotionItemsReactive = new ReactiveController(this, [
            Store.promotions.selectedCards,
            Store.promotions.selectedCollections,
            Store.promotions.selectedOffers,
            Store.users,
        ]);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.#boundHandleOstOfferSelect) {
            document.removeEventListener(EVENT_OST_OFFER_SELECT, this.#boundHandleOstOfferSelect);
            this.#boundHandleOstOfferSelect = null;
        }
        Store.promotions.itemPickerSurface.set(null);
        setItemsSelectionStore(this.#itemsSelectionStoreSnapshot);
        this.#itemsSelectionStoreSnapshot = null;
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get fragment() {
        return this.fragmentStore?.get();
    }

    get fragmentStore() {
        return this.inEdit.get();
    }

    set fragmentStore(fragmentStore) {
        this.inEdit.set(fragmentStore);
    }

    get selectedItemsCount() {
        return (
            Store.promotions.selectedOffers.value.length +
            Store.promotions.selectedCards.value.length +
            Store.promotions.selectedCollections.value.length
        );
    }

    get showSelectedEmptyState() {
        if (this.promotionItemsPickerOpen && this.#promotionItemsPickerHoldEmptyState) return true;
        return Store.promotions.selectedCards.value.length + Store.promotions.selectedCollections.value.length === 0;
    }

    get hasSelectedOffers() {
        return Store.promotions.selectedOffers.value.length > 0;
    }

    get canManagePromoCodes() {
        if (!this.canEdit) return false;
        const geos = this.fragment?.getFieldValues('geos') ?? [];
        const hasOffers = Store.promotions.selectedOffers.value.length > 0 || Store.promotions.selectedCards.value.length > 0;
        return hasOffers && geos.length > 0;
    }

    get canManagePromoCodesInEmptyState() {
        if (!this.canEdit) return false;
        const geos = this.fragment?.getFieldValues('geos') ?? [];
        return this.hasSelectedOffers && geos.length > 0;
    }

    get canEditPromotionItemsInEmptyState() {
        return this.canEdit && this.hasSelectedOffers;
    }

    get promotionTag() {
        return toAttribute(getPromotionTagFromFragment(this.fragment) ?? '');
    }

    #mapPromotionOfferSelectorToRow(selectorId) {
        const cached = Store.promotions.offerDataCache.get(selectorId);
        if (cached) return cached;
        return {
            path: selectorId,
            id: selectorId,
            offerData: { offerId: selectorId },
            tags: [],
            fields: [],
        };
    }

    async #loadPromoManagerOffers() {
        const offersByKey = new Map();
        for (const selectorId of Store.promotions.selectedOffers.value) {
            const row = this.#mapPromotionOfferSelectorToRow(selectorId);
            const key = row.path || row.id || row.offerData?.offerId;
            if (key) offersByKey.set(key, row);
        }
        if (!offersByKey.size) {
            const cardPaths = Store.promotions.selectedCards.value;
            if (cardPaths.length && this.repository) {
                await loadSelectedFragments(cardPaths, TABLE_TYPE.CARDS, this.repository, {
                    getDisplayName: getPromotionPickerFragmentLabel,
                    onItems: (items) => {
                        for (const item of items) {
                            const offerId = item?.offerData?.offerId ?? item?.offerData?.offer_id;
                            if (!offerId) continue;
                            const key = item.path || item.id || offerId;
                            if (!offersByKey.has(key)) offersByKey.set(key, item);
                        }
                    },
                });
            }
        }
        for (const selectorId of Store.promotions.selectedOffers.value) {
            const row = this.#mapPromotionOfferSelectorToRow(selectorId);
            const key = row.path || row.id || row.offerData?.offerId;
            if (key && !offersByKey.has(key)) offersByKey.set(key, row);
        }
        this.promoManagerOffers = [...offersByKey.values()];
    }

    async #openPromoCodesManager() {
        if (this.#promoCodesManagerLoading) return;
        this.#promoCodesManagerLoading = true;
        try {
            await this.#loadPromoManagerOffers();
            this.promoCodesManagerOpen = true;
        } finally {
            this.#promoCodesManagerLoading = false;
        }
    }

    get promotionPickerSurfaces() {
        return parsePromotionSurfacesFieldValues(this.fragment?.fields?.find((f) => f.name === 'surfaces')?.values ?? []);
    }

    get #itemsSelectionDirty() {
        return (
            isPromotionItemSelectionDirty(
                this.fragment,
                Store.promotions.selectedCards.value,
                Store.promotions.selectedCollections.value,
            ) || isPromotionOffersSelectionDirty(this.fragment, Store.promotions.selectedOffers.value)
        );
    }

    #resetPromotionItemStores() {
        Store.promotions.allCards.set([]);
        Store.promotions.cardsByPaths.set(new Map());
        Store.promotions.displayCards.set([]);
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedOffers.set([]);
        Store.promotions.offerDataCache.clear();
        Store.promotions.groupedVariationsByParent.set(new Map());
        Store.promotions.groupedVariationsData.set(new Map());
        Store.promotions.allCollections.set([]);
        Store.promotions.collectionsByPaths.set(new Map());
        Store.promotions.displayCollections.set([]);
        Store.promotions.selectedCollections.set([]);
        Store.promotions.allPlaceholders.set([]);
        Store.promotions.placeholdersByPaths.set(new Map());
        Store.promotions.displayPlaceholders.set([]);
        Store.promotions.selectedPlaceholders.set([]);
        Store.promotions.showSelected.set(false);
    }

    #syncPromotionSelectionFieldsToFragment() {
        if (!this.fragment) return;
        applyPromotionItemSelectionToFragment(this.fragment, {
            selectedCards: Store.promotions.selectedCards.value,
            selectedCollections: Store.promotions.selectedCollections.value,
            selectedOfferIds: Store.promotions.selectedOffers.value,
        });
        this.fragmentStore?.notify();
    }

    async #hydratePromotionItemSelectionFromFragment() {
        const f = this.fragment;
        if (!f) {
            Store.promotions.selectedCards.set([]);
            Store.promotions.selectedCollections.set([]);
            return;
        }

        const hasStoredItemSelection =
            Store.promotions.selectedCards.value.length > 0 || Store.promotions.selectedCollections.value.length > 0;
        const hasStoredOfferSelection = Store.promotions.selectedOffers.value.length > 0;
        const fromFragments = f.getFieldValues('fragments');
        const fromCollections = f.getField('collections') ? f.getFieldValues('collections') : [];
        const seen = new Set();
        const allPaths = [];
        for (const p of [...fromFragments, ...fromCollections]) {
            if (p && !seen.has(p)) {
                seen.add(p);
                allPaths.push(p);
            }
        }
        const getFragmentByPath = this.repository?.aem?.getFragmentByPath;
        if (!allPaths.length) {
            if (!hasStoredItemSelection) {
                Store.promotions.selectedCards.set([]);
                Store.promotions.selectedCollections.set([]);
            }
        } else if (!getFragmentByPath) {
            if (!hasStoredItemSelection) {
                Store.promotions.selectedCards.set(fromFragments.filter(Boolean));
                Store.promotions.selectedCollections.set(fromCollections.filter(Boolean));
            }
        } else if (!hasStoredItemSelection) {
            const { cards, cols } = await classifyPromotionPathsForSelection(allPaths, (path) =>
                this.repository.aem.getFragmentByPath(path),
            );
            Store.promotions.selectedCards.set(cards);
            Store.promotions.selectedCollections.set(cols);
        }

        const offerValues = f.getField('offers') ? f.getFieldValues('offers') : [];
        const savedOfferIds = parseSelectedOfferIdsFromOffersField(offerValues);
        if (savedOfferIds.length) {
            Store.promotions.selectedOffers.set(savedOfferIds);
            await hydratePromotionOfferRecords(savedOfferIds, Store.promotions.offerDataCache);
        } else if (!hasStoredOfferSelection) {
            Store.promotions.selectedOffers.set([]);
        }
    }

    #ensurePromotionModelFields(promotion) {
        const names = new Set(promotion.fields.map((field) => field.name));
        const defaults = [
            { name: 'geos', type: 'tag', multiple: true, values: [] },
            { name: 'fragments', type: 'content-fragment', multiple: true, values: [] },
            { name: 'offers', type: 'text', multiple: true, values: [] },
        ];
        for (const field of defaults) {
            if (!names.has(field.name)) {
                promotion.fields.push({ ...field });
                names.add(field.name);
            }
        }
    }

    async #fetchPromotionModelById(id) {
        let fragment = await this.repository.aem.sites.cf.fragments.getById(id);
        if (!fragment) return null;
        let promotion = new Promotion(fragment);
        this.#ensurePromotionModelFields(promotion);
        if (promotion.promotionStatus === 'expired' && promotion.isPromotionPublished) {
            const ok = await this.repository.unpublishFragment(promotion, false);
            if (ok) {
                fragment = await this.repository.aem.sites.cf.fragments.getById(id);
                if (!fragment) return null;
                promotion = new Promotion(fragment);
                this.#ensurePromotionModelFields(promotion);
            }
        }
        return promotion;
    }

    async #loadPromotionById(id) {
        try {
            const promotion = await this.#fetchPromotionModelById(id);
            if (!promotion) return;
            Store.promotions.inEdit.set(new FragmentStore(promotion));
        } catch (error) {
            console.error('Failed to load promotion:', error);
            showToast('Failed to load promotion.', 'negative');
        }
    }

    async #reloadPromotionFromServer() {
        const id = this.fragment?.id;
        if (!id) return;
        try {
            const promotion = await this.#fetchPromotionModelById(id);
            if (!promotion) return;
            this.storeController?.hostDisconnected();
            this.fragmentStore = new FragmentStore(promotion);
            this.storeController = new StoreController(this, this.fragmentStore);
            this.storeController.hostConnected();
            this.evergreenEnabled = this.fragment?.isEvergreen ?? true;
            await this.#hydratePromotionItemSelectionFromFragment();
        } catch (error) {
            console.error(error);
            showToast('Failed to refresh promotion.', 'negative');
        }
    }

    async #confirmPublishWithUnpublishedPromoVariations() {
        return confirmPublishDespiteUnpublishedPromoVariations(this.repository.aem, this.fragment, (title, message, options) =>
            this.#showDialog(title, message, options),
        );
    }

    get #promotionPublishOptions() {
        return {
            hasUnsavedChanges: !!(this.fragment?.hasChanges || this.#itemsSelectionDirty),
            promotionPublish: this.promotionPublish,
        };
    }

    async #publishOrSchedulePromotion() {
        if (!this.fragment?.id || this.isNewPromotion) return;
        if (this.#promotionPublishOptions.hasUnsavedChanges) {
            showToast(PROMOTION_SAVE_BEFORE_PUBLISH_MESSAGE, 'info');
            return;
        }
        const canAct =
            canPublishPromotionNow(this.fragment, this.#promotionPublishOptions) ||
            canSchedulePromotion(this.fragment, this.#promotionPublishOptions);
        if (!canAct) {
            if (this.fragment?.promotionStatus === 'expired') {
                showToast(PROMOTION_EXPIRED_PUBLISH_MESSAGE, 'info');
            }
            return;
        }
        const { confirmed, variationPaths } = await this.#confirmPublishWithUnpublishedPromoVariations();
        if (!confirmed) return;
        this.promotionPublish = true;
        try {
            const ok = await publishPromotionProject(this.repository, this.fragment, variationPaths);
            if (ok) await this.#reloadPromotionFromServer();
        } finally {
            this.promotionPublish = false;
        }
    }

    #handlePublishPromotion = async () => {
        await this.#publishOrSchedulePromotion();
    };

    #handleUnpublishPromotion = async () => {
        if (!this.fragment?.id || this.isNewPromotion) return;
        if (!this.fragment.isPromotionPublished) {
            showToast('This promotion is not published.', 'info');
            return;
        }
        const { confirmed, variationPaths } = await confirmUnpublishAlongsidePromoVariations(
            this.repository.aem,
            this.fragment,
            (title, message, options) => this.#showDialog(title, message, options),
        );
        if (!confirmed) return;
        this.promotionPublish = true;
        try {
            const ok = await unpublishPromotionProject(this.repository, this.fragment, variationPaths);
            if (ok) await this.#reloadPromotionFromServer();
        } finally {
            this.promotionPublish = false;
        }
    };

    #initializeNewPromotion() {
        return new Promotion({
            id: null,
            title: '',
            fields: [
                { name: 'title', type: 'text', values: [''] },
                { name: 'promoCode', values: [''] },
                { name: 'offers', type: 'text', multiple: true, values: [] },
                { name: 'startDate', values: [''] },
                { name: 'endDate', values: [''] },
                { name: 'tags', values: [] },
                { name: 'surfaces', type: 'text', multiple: true, values: [] },
                { name: 'geos', type: 'tag', multiple: true, values: [] },
                { name: 'fragments', type: 'content-fragment', multiple: true, values: [] },
            ],
        });
    }

    #handleGeosChange = (event) => {
        const value = event.target.getAttribute('value');
        const newGeos = value ? value.split(',') : [];
        this.fragmentStore.updateField('geos', newGeos);
    };

    #handleCloseAddSurfacesDialog = (event) => {
        // Get the table element and its selected rows
        const table = event.target.querySelector('#surfaces-table');
        const selectedSurfaces = table?.selected || [];

        // Update the fragment with the selected surfaces
        if (selectedSurfaces.length > 0) {
            this.fragmentStore.updateField('surfaces', selectedSurfaces);
        }

        const closeEvent = new Event('close', { bubbles: true, composed: true });
        event.target.dispatchEvent(closeEvent);
    };

    #handlePromoCodesSave = (event) => {
        const { exceptions, offerSubstitutions = new Map() } = event.detail;
        this.fragmentStore.updateField(
            'offers',
            buildPromotionOffersFieldValues(this.fragment, Store.promotions.selectedOffers.value, {
                promoExceptions: exceptions,
                offerSubstitutions,
            }),
        );
        this.promoCodesManagerOpen = false;
    };

    #handleSurfaceDelete = (event) => {
        const deletedSurface = event.target.attributes.getNamedItem('value').value;
        const surfaces = this.fragment.fields.find((field) => field.name === 'surfaces')?.values || [];
        this.fragmentStore.updateField(
            'surfaces',
            surfaces.filter((surface) => surface !== deletedSurface),
        );
    };

    #handleFragmentUpdate({ target, detail, values }) {
        const fieldName = target.dataset.field;
        let value = values;
        if (!value) {
            value = target.value || detail?.value || target.checked;
            value = target.multiline ? value?.split(',') : [value ?? ''];
        }
        this.fragmentStore.updateField(fieldName, value);
        if (fieldName === 'title' && this.isNewPromotion) {
            const slug = normalizeKey(value[0].trim());
            this.fragmentStore.updateField('tags', slug ? [`${TAG_PROMOTION_PREFIX}${slug}`] : []);
        }
    }

    #handleEvergreenToggle = ({ target }) => {
        this.evergreenEnabled = target.checked;
        this.fragmentStore.updateField('endDate', ['']);
    };

    #handleDateUpdate({ target }) {
        const fieldName = target.dataset.field;
        const raw = target.value?.trim() ?? '';
        if (!raw) {
            this.fragmentStore.updateField(fieldName, ['']);
            return;
        }
        const parsed = new Date(`${raw}Z`);
        if (Number.isNaN(parsed.getTime())) return;
        this.fragmentStore.updateField(fieldName, [parsed.toISOString()]);
    }

    #patchPromotionSurfacesFieldForAem() {
        const field = this.fragment?.getField?.('surfaces');
        if (!field) return;
        field.type = 'text';
        field.multiple = true;
        field.values = serializePromotionSurfacesForAem(field.values);
        this.fragment.hasChanges = true;
    }

    #getPayloadValues(field, title) {
        switch (field.name) {
            case 'endDate':
                return this.evergreenEnabled ? [] : field.values;
            case 'surfaces':
                return serializePromotionSurfacesForAem(field.values);
            case 'fragments':
                return [...Store.promotions.selectedCards.value, ...Store.promotions.selectedCollections.value];
            case 'offers':
                return buildPromotionOffersFieldValues(this.fragment, Store.promotions.selectedOffers.value);
            case 'tags': {
                const { retained } = splitPromotionTagsFieldValues(field.values);
                const slug = normalizeKey(title?.trim());
                return slug ? [...retained, `${TAG_PROMOTION_PREFIX}${slug}`] : retained;
            }
            default:
                return field.values;
        }
    }

    async #deletePromotionTag(tag) {
        try {
            await this.repository.aem.tags.delete(tag.tagPath);
        } catch (error) {
            console.error('Failed to delete the tag:', error);
        }
    }

    async #handleCreatePromotion() {
        const validationMessage = this.#getRequiredFieldsValidation(this.fragment);
        if (validationMessage) {
            showToast(validationMessage, 'negative');
            return;
        }

        showToast('Creating project...');
        this.#syncPromotionSelectionFieldsToFragment();

        const title = this.fragment.getFieldValue('title');
        const tag = buildPromotionTagPath(title);
        if (tag) {
            try {
                await this.repository.aem.tags.create(tag.tagPath, tag.slug);
            } catch (error) {
                console.error('Failed to create promotion tag:', error);
                const message = error instanceof UserFriendlyError ? error.message : 'Failed to create promotion tag.';
                showToast(message, 'negative');
                return;
            }
        }

        try {
            const newPromotion = await this.repository.createFragment(
                this.#buildPromotionFragmentPayload(this.fragment.getFieldValue('title')),
                false,
            );
            if (!newPromotion) {
                showToast('Failed to create project.', 'negative');
                if (tag) await this.#deletePromotionTag(tag);
                return;
            }
            this.isCreated = true;

            clearCaches();
            showToast('Project successfully created.', 'positive');

            Store.promotions.inEdit.set(new FragmentStore(newPromotion));
            Store.promotions.promotionId.set(newPromotion.id);

            this.isNewPromotion = false;
            Store.promotions.selectedPlaceholders.set([]);
            await this.#hydratePromotionItemSelectionFromFragment();

            this.storeController.hostDisconnected();
            this.storeController = new StoreController(this, this.fragmentStore);
            this.storeController.hostConnected();
        } catch (error) {
            showToast(getCreateProjectErrorMessage(error), 'negative');
            if (tag) await this.#deletePromotionTag(tag);
        }
    }

    async #handleUpdatePromotion() {
        const validationMessage = this.#getRequiredFieldsValidation(this.fragment);
        if (validationMessage) {
            showToast(validationMessage, 'negative');
            return;
        }
        this.fragment.updateFieldInternal('title', this.fragment.getFieldValue('title'));
        if (this.evergreenEnabled) {
            const endDateField = this.fragment.getField('endDate');
            if (endDateField) endDateField.values = [];
        }
        this.#patchPromotionSurfacesFieldForAem();
        this.#syncPromotionSelectionFieldsToFragment();
        showToast('Saving project...');
        try {
            const saved = await this.repository.saveFragment(this.fragmentStore, false);
            if (!saved) {
                showToast('Failed to save project.', 'negative');
                return;
            }
        } catch (error) {
            showToast('Failed to save project.', 'negative');
            return;
        }
        clearCaches();
        showToast('Project successfully saved.', 'positive');
        Store.promotions.selectedPlaceholders.set([]);
        await this.#hydratePromotionItemSelectionFromFragment();
    }

    async #handleCopyPromotionLink() {
        const id = this.fragment?.id;
        if (!id) return;
        const url = `https://mas.adobe.com/studio.html#page=${PAGE_NAMES.PROMOTIONS_EDITOR}&promotionId=${encodeURIComponent(id)}`;
        try {
            await navigator.clipboard.writeText(url);
            showToast('Link copied to clipboard.', 'positive');
        } catch {
            showToast('Failed to copy link.', 'negative');
        }
    }

    async #handleCopyVariationsList() {
        if (!this.fragment || !this.repository?.aem) return;
        try {
            const variations = await getAllAttachedPromoVariations(this.repository.aem, this.fragment);
            const results = variations
                .map((variation) =>
                    generateCodeToUse(new Fragment(variation), extractSurfaceFromPath(variation.path), PAGE_NAMES.CONTENT),
                )
                .filter((result) => result?.href && result?.richText);
            if (!results.length) {
                showToast(
                    variations.length
                        ? 'No links could be copied for these variations.'
                        : 'No variations found for this promotion project.',
                    'info',
                );
                return;
            }
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': new Blob([results.map(({ href }) => href).join('\n')], { type: 'text/plain' }),
                    'text/html': new Blob([results.map(({ richText }) => richText).join('<br>')], { type: 'text/html' }),
                }),
            ]);
            showToast(
                results.length < variations.length
                    ? `Copied ${results.length} of ${variations.length} variation links to clipboard.`
                    : 'Variation links copied to clipboard.',
                'positive',
            );
        } catch {
            showToast('Failed to copy variation links.', 'negative');
        }
    }

    #buildPromotionFragmentPayload(title) {
        return {
            name: normalizeKey(title),
            parentPath: this.repository.getPromotionsPath(),
            modelId: PROMOTION_MODEL_ID,
            title,
            fields: this.fragment.fields
                .filter((field) => field.name !== 'collections')
                .map((field) => ({
                    name: field.name,
                    type: PROMOTION_FIELD_TYPE_MAP[field.name]?.type ?? field.type,
                    multiple: PROMOTION_FIELD_TYPE_MAP[field.name]?.multiple ?? field.multiple ?? false,
                    values: field.name === 'title' ? [title] : this.#getPayloadValues(field, title),
                })),
        };
    }

    async #handleDuplicatePromotion() {
        if (!this.fragment?.id || this.isNewPromotion) return;
        if (this.#promotionPublishOptions.hasUnsavedChanges) {
            showToast('Save your changes before duplicating.', 'info');
            return;
        }
        const validationMessage = this.#getRequiredFieldsValidation(this.fragment);
        if (validationMessage) {
            showToast(validationMessage, 'negative');
            return;
        }
        this.#duplicateProposedTitle = `${this.fragment.getFieldValue('title').trim()} copy`;
        this.duplicateDialogOpen = true;
    }

    #onDuplicateConfirmed = async ({ detail: { title } }) => {
        this.duplicateDialogOpen = false;
        this.duplicating = true;
        try {
            const newPromotion = await this.repository.createFragment(this.#buildPromotionFragmentPayload(title), false);
            if (!newPromotion) return;
            clearCaches();
            showToast('Project successfully duplicated.', 'positive');
            Store.promotions.inEdit.set(new FragmentStore(new Promotion(newPromotion)));
            Store.promotions.promotionId.set(newPromotion.id);
            this.isNewPromotion = false;
            this.storeController?.hostDisconnected();
            this.storeController = new StoreController(this, this.fragmentStore);
            this.storeController.hostConnected();
            this.evergreenEnabled = this.fragment?.isEvergreen ?? true;
            this.#resetPromotionItemStores();
            await this.#hydratePromotionItemSelectionFromFragment();
        } catch (error) {
            console.error('Error duplicating promotion:', error);
            showToast('Failed to duplicate project.', 'negative');
        } finally {
            this.duplicating = false;
        }
    };

    #handleLockPromotion() {
        showToast('Lock project is not available for promotions yet.', 'info');
    }

    async #handleDeletePromotion() {
        if (!this.fragment?.id || this.isNewPromotion) return;
        const attachedVariations = await getAllAttachedPromoVariations(this.repository.aem, this.fragment);
        const confirmed = await this.#showDialog(
            'Confirm Delete',
            promotionDeleteConfirmMessage(this.fragment.title, attachedVariations.length),
            {
                confirmText: 'Delete',
                cancelText: 'Cancel',
                variant: 'confirmation',
            },
        );
        if (!confirmed) return;
        const tagId = getPromotionTagFromFragment(this.fragmentStore.get());
        const [tagPath] = tagId ? fromAttribute(tagId) : [];
        try {
            showToast('Deleting promotion campaign...');
            await deleteAttachedPromoVariations(this.repository.aem, this.fragment);
            await this.repository.deleteFragment(this.fragmentStore, { startToast: false, endToast: false });
            if (tagPath) {
                try {
                    await this.repository.aem.tags.delete(tagPath);
                } catch (error) {
                    console.error('Error deleting promotion tag:', error);
                    showToast('Failed to delete promotion tag.', 'negative');
                }
            }
            showToast('Promotion campaign successfully deleted.', 'positive');
            Store.promotions.inEdit.set();
            Store.promotions.promotionId.set(null);
            Store.page.set(PAGE_NAMES.PROMOTIONS);
        } catch (error) {
            console.error('Error deleting promotion:', error);
            showToast('Failed to delete promotion campaign.', 'negative');
        }
    }

    get disabledPromotionQuickActions() {
        const disabled = new Set([QUICK_ACTION.LOCK]);
        if (!this.canEdit) {
            PROMOTION_QUICK_ACTIONS.forEach((action) => disabled.add(action));
            return disabled;
        }
        const publishOptions = this.#promotionPublishOptions;
        if (this.loadingPromotion) {
            PROMOTION_QUICK_ACTIONS.forEach((action) => disabled.add(action));
            return disabled;
        }
        if (this.isNewPromotion) {
            if (this.isCreated) disabled.add(QUICK_ACTION.SAVE);
            disabled.add(QUICK_ACTION.DUPLICATE);
            disabled.add(QUICK_ACTION.PUBLISH);
            disabled.add(QUICK_ACTION.UNPUBLISH);
            disabled.add(QUICK_ACTION.COPY);
            disabled.add(QUICK_ACTION.LINK);
            disabled.add(QUICK_ACTION.DELETE);
            return disabled;
        }
        if (!publishOptions.hasUnsavedChanges) {
            disabled.add(QUICK_ACTION.SAVE);
        }
        if (!this.fragment?.id) {
            disabled.add(QUICK_ACTION.COPY);
            disabled.add(QUICK_ACTION.LINK);
            disabled.add(QUICK_ACTION.DELETE);
            disabled.add(QUICK_ACTION.DUPLICATE);
        } else if (publishOptions.hasUnsavedChanges) {
            disabled.add(QUICK_ACTION.DUPLICATE);
        }
        if (!canPublishPromotionNow(this.fragment, publishOptions) && !canSchedulePromotion(this.fragment, publishOptions)) {
            disabled.add(QUICK_ACTION.PUBLISH);
        }
        if (!this.fragment?.isPromotionPublished) {
            disabled.add(QUICK_ACTION.UNPUBLISH);
        }
        if (this.promotionPublish) {
            disabled.add(QUICK_ACTION.UNPUBLISH);
        }
        return disabled;
    }

    #getRequiredFieldsValidation(fragment = {}) {
        const itemCount = Store.promotions.selectedCards.value.length + Store.promotions.selectedCollections.value.length;
        return getPromotionRequiredFieldsValidation(fragment, itemCount, this.evergreenEnabled);
    }

    /**
     * Display a dialog for confirmation
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - True if confirmed, false if canceled
     */
    async #showDialog(title, message, options = {}) {
        if (this.isDialogOpen) {
            return false;
        }

        this.isDialogOpen = true;
        const { confirmText = 'OK', cancelText = 'Cancel', variant = 'primary' } = options;

        return new Promise((resolve) => {
            this.confirmDialogConfig = {
                title,
                message,
                confirmText,
                cancelText,
                variant,
                onConfirm: () => {
                    resolve(true);
                },
                onCancel: () => {
                    resolve(false);
                },
            };
        });
    }

    async promptDiscardChanges() {
        if (!this.fragment?.hasChanges && !this.#itemsSelectionDirty) return true;
        return this.#showDialog('Discard Changes', 'You have unsaved changes. Are you sure you want to leave this page?', {
            confirmText: 'Discard',
            cancelText: 'Cancel',
            variant: 'confirmation',
        });
    }

    #clearPromotionItemPickerSurface() {
        Store.promotions.itemPickerSurface.set(null);
        Store.filters.set((prev) => ({ ...prev, tags: undefined }));
        Store.promotions.allCards.set([]);
        Store.promotions.displayCards.set([]);
        Store.promotions.cardsByPaths.set(new Map());
        if (Store.page.get() === PAGE_NAMES.PROMOTIONS_EDITOR) {
            this.repository?.searchFragments?.();
        }
    }

    #confirmItemSelection = ({ target }) => {
        this.#cardsSnapshot = [];
        this.#collectionsSnapshot = [];
        this.#itemsPickerConfirmed = true;
        this.isSelectedItemsOpen = true;
        this.#syncPromotionSelectionFieldsToFragment();
        const pickerSelector = this.renderRoot.querySelector('.add-items-dialog mas-promotions-items-selector');
        if (pickerSelector?.selectedTab) {
            this.selectedItemsViewTab = pickerSelector.selectedTab;
        } else if (this.#promotionItemsPickerHoldEmptyState) {
            this.selectedItemsViewTab =
                this.promotionEmptyItemsTab === TABLE_TYPE.COLLECTIONS ? TABLE_TYPE.COLLECTIONS : TABLE_TYPE.CARDS;
        }
        this.#clearPromotionItemPickerSurface();
        this.#closePromotionItemsPicker();
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target.dispatchEvent(closeEvent);
    };

    #cancelItemSelection = ({ target }) => {
        Store.promotions.selectedCards.set(this.#cardsSnapshot);
        Store.promotions.selectedCollections.set(this.#collectionsSnapshot);
        this.#itemsPickerConfirmed = true;
        this.#clearPromotionItemPickerSurface();
        this.#closePromotionItemsPicker();
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target.dispatchEvent(closeEvent);
    };

    #onPromotionEmptyItemsTabChange = ({ target: { selected } }) => {
        this.promotionEmptyItemsTab = selected;
    };

    #onPromotionItemsTabChange = (e) => {
        this.promotionItemsAddButtonLabel =
            e.detail?.tab === TABLE_TYPE.COLLECTIONS ? 'Add selected collections' : 'Add selected fragments';
    };

    #onSelectedItemsViewTabChange = (e) => {
        this.selectedItemsViewTab = e.detail?.tab ?? TABLE_TYPE.OFFERS;
    };

    #onPromotionOfferRemoved = () => {
        this.selectedItemsViewTab = TABLE_TYPE.OFFERS;
        this.promotionEmptyItemsTab = TABLE_TYPE.OFFERS;
        const selector = this.renderRoot.querySelector('mas-promotions-items-selector');
        if (selector) selector.selectedTab = TABLE_TYPE.OFFERS;
    };

    #openPromotionsOst = (e) => {
        e?.stopPropagation?.();
        openOfferSelectorTool(document.createElement('osi-field'), null);
    };

    #handleOstOfferSelect = async (event) => {
        const added = await handlePromotionOstOfferSelect(event);
        if (added) {
            this.#syncPromotionSelectionFieldsToFragment();
        }
    };

    #getPromotionItemsPickerTab() {
        const activeTab = this.#promotionItemsPickerHoldEmptyState ? this.promotionEmptyItemsTab : this.selectedItemsViewTab;
        return activeTab === TABLE_TYPE.COLLECTIONS ? TABLE_TYPE.COLLECTIONS : TABLE_TYPE.CARDS;
    }

    #getPromotionItemsOverlayTrigger() {
        return this.renderRoot.querySelector('#add-promotion-items-overlay');
    }

    #closePromotionItemsPicker() {
        this.promotionItemsPickerOpen = false;
        this.#promotionItemsPickerHoldEmptyState = false;
        const overlay = this.#getPromotionItemsOverlayTrigger();
        if (overlay?.open) {
            overlay.open = undefined;
        }
    }

    #preparePromotionItemsPicker() {
        if (!this.hasSelectedOffers) {
            showToast('Select at least one offer before adding fragments.', 'info');
            return false;
        }
        if (!this.promotionPickerSurfaces.length) {
            showToast('Select at least one surface before adding fragments.', 'info');
            return false;
        }
        const dialogTab = this.#getPromotionItemsPickerTab();
        this.promotionItemsAddButtonLabel =
            dialogTab === TABLE_TYPE.COLLECTIONS ? 'Add selected collections' : 'Add selected fragments';
        this.#itemsPickerConfirmed = false;
        this.#cardsSnapshot = Store.promotions.selectedCards.value;
        this.#collectionsSnapshot = Store.promotions.selectedCollections.value;

        const selector = this.renderRoot.querySelector('.add-items-dialog mas-promotions-items-selector');
        if (selector) {
            selector.searchQuery = '';
            selector.selectedTab = dialogTab;
        }
        const surfaces = this.promotionPickerSurfaces;
        if (surfaces.length) {
            const current = Store.promotions.itemPickerSurface.get();
            Store.promotions.itemPickerSurface.set(surfaces.includes(current) ? current : surfaces[0]);
        } else {
            Store.promotions.itemPickerSurface.set(null);
        }
        Store.promotions.allCards.set([]);
        Store.promotions.displayCards.set([]);
        selector?.resetFilters();
        const cachedCollections = Store.promotions.allCollections.get();
        if (Store.promotions.allCollections.getMeta('loaded') && cachedCollections?.length) {
            Store.promotions.displayCollections.set(cachedCollections);
        } else if (this.repository?.loadAllCollections) {
            this.repository.loadAllCollections();
        }
        if (this.repository?.loadPlaceholders) this.repository.loadPlaceholders();
        return true;
    }

    #openPromotionItemsPickerOverlay() {
        const overlay = this.#getPromotionItemsOverlayTrigger();
        if (overlay) {
            overlay.open = 'click';
        }
    }

    #openAddItemsOverlay = (e) => {
        e?.stopPropagation?.();
        if (!this.#preparePromotionItemsPicker()) return;
        this.#promotionItemsPickerHoldEmptyState = this.showSelectedEmptyState;
        this.promotionItemsPickerOpen = true;
        this.#openPromotionItemsPickerOverlay();
    };

    #restoreItemsSnapshot = () => {
        if (this.#itemsPickerConfirmed) return;
        Store.promotions.selectedCards.set(this.#cardsSnapshot);
        Store.promotions.selectedCollections.set(this.#collectionsSnapshot);
        this.#clearPromotionItemPickerSurface();
        this.#closePromotionItemsPicker();
    };

    #dispatchDialogEvent = (name) => {
        const wrapper = this.renderRoot.querySelector('.add-items-dialog');
        wrapper?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
    };

    #toggleSelectedItemsOpen = ({ target }) => {
        if (target.closest('mas-promotions-items-selector')) return;
        if (target.closest('sp-action-button, sp-button, overlay-trigger')) return;
        this.isSelectedItemsOpen = !this.isSelectedItemsOpen;
    };

    #getPromotionEmptyTabLabel(label, count) {
        return `${label} (${count})`;
    }

    #renderPromotionOffersEmptyPanel() {
        return html`<div class="offers-empty-state">
            <div class="icon">
                <sp-button variant="secondary" ?disabled=${!this.canEdit} @click=${this.#openPromotionsOst}>
                    <sp-icon-add size="xxl"></sp-icon-add>
                </sp-button>
            </div>
            <div class="label">
                <strong>Add product offers</strong><br />
                <span>Choose offers for selected countries.</span>
            </div>
        </div>`;
    }

    #renderPromotionFragmentsEmptyPanel() {
        if (!this.hasSelectedOffers) {
            return html`<div class="fragments-gated-empty-state">
                <sp-icon-apps size="l"></sp-icon-apps>
                <div class="label">
                    <strong>Select offers first</strong><br />
                    <span>Fragments will be generated automatically once offers are selected.</span>
                </div>
            </div>`;
        }
        return html`<div class="offers-empty-state">
            <div class="icon">
                <sp-button
                    variant="secondary"
                    ?disabled=${!this.canEditPromotionItemsInEmptyState}
                    @click=${this.#openAddItemsOverlay}
                >
                    <sp-icon-add size="xxl"></sp-icon-add>
                </sp-button>
            </div>
            <div class="label">
                <strong>Add fragments</strong><br />
                <span>Select cards and collections this promotion applies to.</span>
            </div>
        </div>`;
    }

    #renderPromotionEmptyToolbarActions() {
        return html`
            ${this.promotionEmptyItemsTab === TABLE_TYPE.OFFERS
                ? html`<sp-action-button quiet ?disabled=${!this.canEdit} @click=${this.#openPromotionsOst}>
                      <sp-icon-add slot="icon" label="Add offer"></sp-icon-add>
                      Add offer
                  </sp-action-button>`
                : html`<sp-action-button
                      quiet
                      ?disabled=${!this.canEditPromotionItemsInEmptyState}
                      @click=${this.#openAddItemsOverlay}
                  >
                      <sp-icon-edit slot="icon" label="Edit items"></sp-icon-edit>
                      Edit
                  </sp-action-button>`}
            <sp-action-button quiet ?disabled=${!this.canManagePromoCodesInEmptyState} @click=${this.#openPromoCodesManager}>
                <sp-icon-settings slot="icon" label=${MANAGE_PROMO_CODES_AND_OFFERS_LABEL}></sp-icon-settings>
                ${MANAGE_PROMO_CODES_AND_OFFERS_LABEL}
            </sp-action-button>
        `;
    }

    #renderPromotionItemsEmptyState() {
        const offerCount = Store.promotions.selectedOffers.value.length;
        const fragmentCount = Store.promotions.selectedCards.value.length;
        const collectionCount = Store.promotions.selectedCollections.value.length;
        const fragmentsTabCount = fragmentCount + collectionCount;
        return html`<div class="form-field promotion-items-empty">
            <div class="promotion-empty-toolbar">
                <sp-tabs quiet .selected=${this.promotionEmptyItemsTab} @change=${this.#onPromotionEmptyItemsTabChange}>
                    <sp-tab value=${TABLE_TYPE.OFFERS} label="Offers"
                        >${this.#getPromotionEmptyTabLabel('Offers', offerCount)}</sp-tab
                    >
                    <sp-tab value=${TABLE_TYPE.CARDS} label="Fragments"
                        >${this.#getPromotionEmptyTabLabel('Fragments', fragmentsTabCount)}</sp-tab
                    >
                </sp-tabs>
                <div class="promotion-empty-actions">${this.#renderPromotionEmptyToolbarActions()}</div>
            </div>
            <div class="promotion-empty-panel">
                ${this.promotionEmptyItemsTab === TABLE_TYPE.CARDS
                    ? this.#renderPromotionFragmentsEmptyPanel()
                    : this.hasSelectedOffers
                      ? html`<mas-promotions-items-table
                            .type=${TABLE_TYPE.OFFERS}
                            .getDisplayName=${getPromotionPickerFragmentLabel}
                            .renderFragmentStatusCell=${renderFragmentStatusCell}
                            @promotion-offer-removed=${this.#onPromotionOfferRemoved}
                        ></mas-promotions-items-table>`
                      : this.#renderPromotionOffersEmptyPanel()}
            </div>
        </div>`;
    }

    #renderPromotionSummary(form) {
        const geos = form.geos?.values ?? [];
        const countries = parseCountriesFromGeos(geos);
        const defaultPromoCode = form.promoCode?.values?.[0] ?? '';
        const exceptions = parsePromoCodeExceptions(form.offers?.values);
        const offerIds = Store.promotions.selectedOffers.value;
        const promoCodeGroups = groupCountriesByPromoCode(exceptions, offerIds, countries, defaultPromoCode);
        const totalOffers = offerIds.length;
        const totalFragments = Store.promotions.selectedCards.value.length + Store.promotions.selectedCollections.value.length;

        return html`<div class="promotion-summary">
            <div class="promotion-summary-body">
                <div class="promotion-summary-stats">
                    <div class="promotion-stat-card">
                        <div class="promotion-stat-label">
                            Total Offers
                            <sp-icon-info size="s" label="Number of product offers in this promotion"></sp-icon-info>
                        </div>
                        <div class="promotion-stat-value">${totalOffers}</div>
                    </div>
                    <div class="promotion-stat-card">
                        <div class="promotion-stat-label">
                            Total Fragments
                            <sp-icon-info size="s" label="Number of fragments in this promotion"></sp-icon-info>
                        </div>
                        <div class="promotion-stat-value">${totalFragments}</div>
                    </div>
                </div>
                <div class="promotion-codes-by-country">
                    <div class="promotion-codes-title">
                        Promo codes by country
                        <sp-icon-info size="s" label="Countries grouped by effective promo code"></sp-icon-info>
                    </div>
                    <table class="promo-codes-summary-table">
                        <thead>
                            <tr>
                                <th>Promo codes</th>
                                <th>Countries</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${promoCodeGroups.length
                                ? repeat(
                                      promoCodeGroups,
                                      (group) => group.promoCode,
                                      (group) =>
                                          html`<tr>
                                              <td>${group.promoCode}</td>
                                              <td>${group.countriesLabel}</td>
                                          </tr>`,
                                  )
                                : html`<tr>
                                      <td colspan="2">-</td>
                                  </tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
    }

    #alignItemsDialogFooter = ({ target }) => {
        const slotDiv = target?.shadowRoot?.querySelector('div[slot="footer"]');
        if (!slotDiv) return;
        slotDiv.style.width = '100%';
        slotDiv.style.display = 'flex';
        slotDiv.style.justifyContent = 'flex-end';
    };

    get addItemsDialog() {
        const footerContent = html`
            <sp-button-group>
                <sp-button variant="secondary" treatment="outline" @click=${() => this.#dispatchDialogEvent('cancel')}
                    >Cancel</sp-button
                >
                <sp-button variant="accent" @click=${() => this.#dispatchDialogEvent('confirm')}
                    >${this.promotionItemsAddButtonLabel}</sp-button
                >
            </sp-button-group>
        `;
        return html`
            <sp-dialog-wrapper
                class="add-items-dialog"
                slot="click-content"
                headline="Select items"
                headline-visibility="none"
                .footer=${footerContent}
                underlay
                dismissable
                no-divider
                @sp-opened=${this.#alignItemsDialogFooter}
                @confirm=${this.#confirmItemSelection}
                @cancel=${this.#cancelItemSelection}
                @close=${this.#restoreItemsSnapshot}
            >
                <mas-promotions-items-selector
                    .fragmentSurfaceOptions=${this.promotionPickerSurfaces}
                    .renderFragmentStatusCell=${renderFragmentStatusCell}
                    @promotion-items-tab-change=${this.#onPromotionItemsTabChange}
                ></mas-promotions-items-selector>
            </sp-dialog-wrapper>
        `;
    }

    willUpdate() {
        this.canEdit = canEditPromotions();
    }

    render() {
        let form = nothing;
        if (this.fragment) {
            form = Object.fromEntries([...this.fragment.fields.map((f) => [f.name, f])]);
        }
        const readOnly = !this.canEdit;
        const canOpenItemPicker = this.canEdit && this.promotionPickerSurfaces.length > 0;
        return html`
            ${this.confirmDialog}
            ${this.duplicating
                ? html`<div class="duplicating-overlay">
                      <sp-progress-circle label="Duplicating project" indeterminate size="l"></sp-progress-circle>
                  </div>`
                : nothing}
            <mas-promotion-duplicate-dialog
                .open=${this.duplicateDialogOpen}
                .proposedTitle=${this.#duplicateProposedTitle}
                @duplicate-confirmed=${this.#onDuplicateConfirmed}
                @duplicate-cancelled=${() => {
                    this.duplicateDialogOpen = false;
                }}
            ></mas-promotion-duplicate-dialog>
            <div class="promotions-form-container">
                <div class="promotions-form-header">
                    <h1>${this.isNewPromotion ? 'Create new promotion project' : 'Edit promotion project'}</h1>
                </div>
                <div class="promotions-form-panel">
                    ${this.loadingPromotion
                        ? html`
                              <div class="promotion-loading">
                                  <sp-progress-circle label="Loading promotion" indeterminate></sp-progress-circle>
                              </div>
                          `
                        : nothing}
                    <div><h2>General Info</h2></div>
                    <div class="promotions-form-panel-content">
                        <div class="promotions-form-fields">
                            <sp-field-label for="campaignTitle" required>Title</sp-field-label>
                            ${this.isNewPromotion
                                ? html`<sp-textfield
                                      id="campaignTitle"
                                      data-field="title"
                                      value="${form.title?.values[0]}"
                                      ?disabled=${readOnly || !this.isNewPromotion}
                                      @input=${this.#handleFragmentUpdate}
                                  ></sp-textfield>`
                                : html`<p>${this.fragment?.getFieldValues('title')?.[0]}</p>`}
                            <sp-field-label for="promoCode">Promo Code</sp-field-label>
                            <sp-textfield
                                id="promoCode"
                                data-field="promoCode"
                                value="${form.promoCode?.values[0]}"
                                ?disabled=${readOnly}
                                @input=${this.#handleFragmentUpdate}
                            ></sp-textfield>
                            <sp-field-label for="startDate" required>Start Date (UTC)</sp-field-label>
                            <input
                                type="datetime-local"
                                id="startDate"
                                value="${form.startDate?.values[0]?.slice(0, 16) ?? ''}"
                                data-field="startDate"
                                ?disabled=${readOnly}
                                @change=${this.#handleDateUpdate}
                            />
                            <sp-field-label for="endDate" ?required=${!this.evergreenEnabled}>End Date (UTC)</sp-field-label>
                            <div class="end-date-row">
                                <input
                                    type="datetime-local"
                                    id="endDate"
                                    value="${form.endDate?.values[0]?.slice(0, 16) ?? ''}"
                                    data-field="endDate"
                                    ?disabled=${readOnly || this.evergreenEnabled}
                                    @change=${this.#handleDateUpdate}
                                />
                                <sp-switch
                                    ?checked=${this.evergreenEnabled}
                                    ?disabled=${readOnly}
                                    @change=${this.#handleEvergreenToggle}
                                    >Evergreen promo</sp-switch
                                >
                            </div>
                            <sp-field-label required>Promotion tag</sp-field-label>
                            <aem-tag-picker-field
                                label="Promotion tag"
                                namespace="/content/cq:tags/mas"
                                top="promotion"
                                readonly
                                quiet
                                disabled
                                value="${this.promotionTag}"
                                class="promotion-tag-field"
                            ></aem-tag-picker-field>
                            <sp-field-group id="promotion-geos-tags">
                                <sp-field-label required>Geos</sp-field-label>
                                <aem-tag-picker-field
                                    selection="checkbox-tags"
                                    display-value
                                    label="Locale tags"
                                    namespace="/content/cq:tags/mas"
                                    top="locale,pzn"
                                    multiple
                                    ?disabled=${readOnly}
                                    value="${form.geos?.values.join(',') || ''}"
                                    @change=${this.#handleGeosChange}
                                ></aem-tag-picker-field>
                            </sp-field-group>
                        </div>
                        <sp-divider size="m" class="promotions-form-panel-divider" vertical></sp-divider>
                        <div class="promotions-form-surfaces">
                            <sp-field-label required>Surfaces</sp-field-label>
                            <div class="promotions-form-surfaces-panel">
                                ${!form.surfaces?.values || form.surfaces.values.length === 0
                                    ? html`
                                          <div class="surfaces-empty-state">
                                              <div class="icon">
                                                  <overlay-trigger type="modal" id="add-surfaces-overlay">
                                                      ${this.addSurfacesDialog}
                                                      <sp-button slot="trigger" variant="secondary" ?disabled=${readOnly}>
                                                          <sp-icon-add size="xxl"></sp-icon-add>
                                                      </sp-button>
                                                  </overlay-trigger>
                                              </div>
                                              <div class="label">
                                                  <strong>Add Surfaces</strong><br />
                                                  Select at least one surface to publish your campaign.
                                              </div>
                                          </div>
                                      `
                                    : html`
                                          <div class="surfaces-list">
                                              <sp-tags data-foo="${form.surfaces.values}">
                                                  ${repeat(
                                                      form.surfaces.values,
                                                      (surface) => surface,
                                                      (surface) => {
                                                          const surfaceLabel =
                                                              Object.values(SURFACES).find((s) => s.name === surface)?.label ||
                                                              surface;
                                                          return html`
                                                              <sp-tag
                                                                  value="${surface}"
                                                                  ?deletable=${!readOnly}
                                                                  @delete=${this.#handleSurfaceDelete}
                                                              >
                                                                  ${surfaceLabel}
                                                              </sp-tag>
                                                          `;
                                                      },
                                                  )}
                                                  <overlay-trigger type="modal" id="add-surfaces-overlay">
                                                      ${this.addSurfacesDialog}
                                                      <sp-button
                                                          slot="trigger"
                                                          variant="secondary"
                                                          icon-only
                                                          ?disabled=${readOnly}
                                                      >
                                                          <sp-icon-add slot="icon" size="m"></sp-icon-add>
                                                      </sp-button>
                                                  </overlay-trigger>
                                              </sp-tags>
                                          </div>
                                      `}
                            </div>
                        </div>
                    </div>
                </div>
                <overlay-trigger type="modal" id="add-promotion-items-overlay"> ${this.addItemsDialog} </overlay-trigger>
                <div class="promotions-form-items-outer">
                    ${this.showSelectedEmptyState
                        ? this.#renderPromotionItemsEmptyState()
                        : html`${this.#renderPromotionSummary(form)}
                              <div class="form-field selected-items" @click=${this.#toggleSelectedItemsOpen}>
                                  <div class="selected-items-header">
                                      <h2>
                                          Selected items
                                          <span>(${this.selectedItemsCount})</span>
                                          <sp-icon-asterisk100></sp-icon-asterisk100>
                                      </h2>
                                      <div>
                                          ${this.selectedItemsViewTab === TABLE_TYPE.OFFERS
                                              ? html`<sp-action-button
                                                    quiet
                                                    ?disabled=${readOnly}
                                                    @click=${this.#openPromotionsOst}
                                                >
                                                    <sp-icon-add slot="icon" label="Add offer"></sp-icon-add>
                                                    Add offer
                                                </sp-action-button>`
                                              : html`<sp-action-button
                                                    quiet
                                                    ?disabled=${!canOpenItemPicker || !this.hasSelectedOffers}
                                                    @click=${this.#openAddItemsOverlay}
                                                >
                                                    <sp-icon-edit slot="icon" label="Edit items"></sp-icon-edit>
                                                    Edit
                                                </sp-action-button>`}
                                          <sp-action-button
                                              quiet
                                              ?disabled=${!this.canManagePromoCodes}
                                              @click=${this.#openPromoCodesManager}
                                          >
                                              <sp-icon-settings
                                                  slot="icon"
                                                  label=${MANAGE_PROMO_CODES_AND_OFFERS_LABEL}
                                              ></sp-icon-settings>
                                              ${MANAGE_PROMO_CODES_AND_OFFERS_LABEL}
                                          </sp-action-button>
                                          <sp-button
                                              icon-only
                                              class="toggle-btn ghost-button ${this.isSelectedItemsOpen ? 'is-expanded' : ''}"
                                              @click=${(e) => {
                                                  e.stopPropagation();
                                                  this.isSelectedItemsOpen = !this.isSelectedItemsOpen;
                                              }}
                                          >
                                              <sp-icon-chevron-down
                                                  slot="icon"
                                                  .label=${this.isSelectedItemsOpen ? 'Close' : 'Open'}
                                              ></sp-icon-chevron-down>
                                          </sp-button>
                                      </div>
                                  </div>
                                  ${this.isSelectedItemsOpen
                                      ? html`<mas-promotions-items-selector
                                            .viewOnly=${true}
                                            .selectedTab=${this.selectedItemsViewTab}
                                            .getDisplayName=${getPromotionPickerFragmentLabel}
                                            .renderFragmentStatusCell=${renderFragmentStatusCell}
                                            @promotion-items-tab-change=${this.#onSelectedItemsViewTabChange}
                                            @promotion-offer-removed=${this.#onPromotionOfferRemoved}
                                        ></mas-promotions-items-selector>`
                                      : nothing}
                              </div>`}
                    <mas-promo-codes-manager
                        .open=${this.promoCodesManagerOpen}
                        .offers=${this.promoManagerOffers}
                        .geos=${form.geos?.values ?? []}
                        .defaultPromoCode=${form.promoCode?.values[0] ?? ''}
                        .exceptions=${parsePromotionOffersField(form.offers?.values).promoExceptions}
                        .offerSubstitutions=${parsePromotionOffersField(form.offers?.values).offerSubstitutions}
                        @promo-codes-save=${this.#handlePromoCodesSave}
                        @promo-codes-cancel=${() => {
                            this.promoCodesManagerOpen = false;
                        }}
                    ></mas-promo-codes-manager>
                </div>
            </div>
            ${this.fragment
                ? html`<mas-quick-actions
                      drag-handle-style="bar"
                      .actions=${PROMOTION_QUICK_ACTIONS}
                      .disabled=${this.disabledPromotionQuickActions}
                      .iconOverrides=${PROMOTION_QUICK_ACTION_ICON_OVERRIDES}
                      @save=${this.isNewPromotion ? this.#handleCreatePromotion : this.#handleUpdatePromotion}
                      @duplicate=${this.#handleDuplicatePromotion}
                      @publish=${this.#handlePublishPromotion}
                      @unpublish=${this.#handleUnpublishPromotion}
                      @copy=${this.#handleCopyPromotionLink}
                      @link=${this.#handleCopyVariationsList}
                      @lock=${this.#handleLockPromotion}
                      @delete=${this.#handleDeletePromotion}
                  ></mas-quick-actions>`
                : nothing}
        `;
    }

    get addSurfacesDialog() {
        const surfaces = this.fragment?.fields.find((field) => field.name === 'surfaces')?.values || [];
        return html`
            <sp-dialog-wrapper
                slot="click-content"
                headline="Add surfaces"
                confirm-label="Done"
                cancel-label="Cancel"
                size="l"
                underlay
                @confirm=${this.#handleCloseAddSurfacesDialog}
            >
                <sp-search placeholder="Search surface"></sp-search>
                <div class="surfaces-results"><span>0</span> results</div>
                <sp-table selects="multiple" scroller="true" emphasized id="surfaces-table" .selected=${surfaces}>
                    <sp-table-head>
                        <sp-table-head-cell>All surfaces</sp-table-head-cell>
                    </sp-table-head>
                    <sp-table-body>
                        ${repeat(
                            Object.values(SURFACES),
                            (surface) => surface.name,
                            (surface) => html`
                                <sp-table-row value="${surface.name}">
                                    <sp-table-cell>${surface.label}</sp-table-cell>
                                </sp-table-row>
                            `,
                        )}
                    </sp-table-body>
                </sp-table>
            </sp-dialog-wrapper>
        `;
    }

    get confirmDialog() {
        if (!this.confirmDialogConfig) return nothing;

        const { title, message, onConfirm, onCancel, confirmText, cancelText, variant } = this.confirmDialogConfig;

        return html`
            <div class="confirm-dialog-overlay">
                <sp-dialog-wrapper
                    open
                    underlay
                    id="promotion-unsaved-changes-dialog"
                    .headline=${title}
                    .variant=${variant || 'negative'}
                    .confirmLabel=${confirmText}
                    .cancelLabel=${cancelText}
                    @confirm=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        onConfirm && onConfirm();
                    }}
                    @cancel=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        onCancel && onCancel();
                    }}
                >
                    <div>${message}</div>
                </sp-dialog-wrapper>
            </div>
        `;
    }
}

export default MasPromotionsEditor;
export { MasPromotionsEditor };
customElements.define('mas-promotions-editor', MasPromotionsEditor);
