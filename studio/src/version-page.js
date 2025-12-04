import { LitElement, html, css, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import { PAGE_NAMES, CARD_MODEL_PATH } from './constants.js';
import router from './router.js';
import Events from './events.js';
import { VersionRepository } from './version-repository.js';
import {
    setFieldConfig,
    normalizeFields,
    denormalizeFields,
    calculateDifferences,
    formatFieldValue,
    getFieldLabel,
    getFieldVisible,
} from './utils/version-transformer.js';

class VersionPage extends LitElement {
    static properties = {
        versions: { type: Array, state: true },
        fragment: { type: Object, state: true },
        currentVersion: { type: Object, state: true },
        selectedVersion: { type: Object, state: true },
        selectedVersionData: { type: Object, state: true },
        loading: { type: Boolean, state: true },
        loadingVersionData: { type: Boolean, state: true },
        searchQuery: { type: String, state: true },
        repository: { type: Object, state: true },
    };

    // Centralized field configuration
    static FIELD_CONFIG = {
        // Fragment-level fields (metadata - not visible on card)
        title: { label: 'Fragment Title', isArray: false, visible: false },
        description: { label: 'Fragment Description', isArray: false, visible: false },
        locReady: { label: 'Send to translation', isArray: false, visible: false },
        tags: { label: 'Tags', isArray: true, visible: false },
        // Merch Card configuration fields (not visible on card)
        variant: { label: 'Variant', isArray: false, visible: false },
        style: { label: 'Style', isArray: false, visible: false },
        size: { label: 'Size', isArray: false, visible: false },
        name: { label: 'Card name', isArray: false, visible: false },
        osi: { label: 'OSI Search', isArray: false, visible: false },
        // Merch Card visible content fields (rendered on card)
        cardName: { label: 'Card name', isArray: true, visible: false },
        cardTitle: { label: 'Title', isArray: false, visible: true },
        subtitle: { label: 'Subtitle', isArray: false, visible: true },
        mnemonics: { label: 'Mnemonics', isArray: false, visible: true },
        mnemonicIcon: { label: 'Mnemonic Icon', isArray: true, visible: true },
        mnemonicAlt: { label: 'Mnemonic Alt', isArray: true, visible: true },
        mnemonicLink: { label: 'Mnemonic Link', isArray: true, visible: true },
        whatsIncluded: { label: "What's included", isArray: false, visible: true },
        badge: { label: 'Badge', isArray: false, visible: true },
        badgeText: { label: 'Badge Text', isArray: true, visible: true },
        trialBadge: { label: 'Trial Badge', isArray: false, visible: true },
        backgroundImage: { label: 'Background Image', isArray: false, visible: true },
        backgroundImageAltText: { label: 'Background Image Alt Text', isArray: false, visible: false },
        prices: { label: 'Prices', isArray: true, visible: true },
        offers: { label: 'Offers', isArray: true, visible: false },
        priceDetails: { label: 'Price Details', isArray: true, visible: false },
        promoCode: { label: 'Promo Code', isArray: false, visible: true },
        promoText: { label: 'Promo Text', isArray: false, visible: true },
        addonConfirmation: { label: 'Addon Confirmation', isArray: false, visible: true },
        shortDescription: { label: 'Short Description', isArray: false, visible: true },
        callout: { label: 'Callout text', isArray: false, visible: true },
        ctas: { label: 'Footer', isArray: true, visible: true },
        actionMenu: { label: 'Action Menu', isArray: true, visible: false },
        icons: { label: 'Icons', isArray: true, visible: true },
        links: { label: 'Links', isArray: true, visible: true },
        descriptions: { label: 'Descriptions', isArray: true, visible: true },
        ctaTexts: { label: 'CTA Texts', isArray: true, visible: true },
        perUnitLabel: { label: 'Per Unit Label', isArray: false, visible: true },
        backgroundColor: { label: 'Background Color', isArray: false, visible: true },
        // Collection fields (visible on collection UI)
        queryLabel: { label: 'Query label', isArray: false, visible: true },
        label: { label: 'label', isArray: false, visible: true },
        icon: { label: 'Default icon', isArray: false, visible: true },
        iconLight: { label: 'Selected Icon', isArray: false, visible: true },
        searchText: { label: 'Search Text', isArray: false, visible: true },
        tagFiltersTitle: { label: 'Tag Filters Title', isArray: false, visible: true },
        tagFilters: { label: 'Tag Filters', isArray: false, visible: true },
        linksTitle: { label: 'Links Title', isArray: false, visible: true },
        link: { label: 'Link', isArray: false, visible: true },
        linkIcon: { label: 'Link Icon', isArray: false, visible: true },
        linkText: { label: 'Link Text', isArray: false, visible: true },
        // Quantity fields (visible on card)
        quantityTitle: { label: 'Quantity selector title', isArray: false, visible: true },
        startQuantity: { label: 'Start quantity', isArray: false, visible: true },
        stepQuantity: { label: 'Step', isArray: false, visible: true },
    };

    static styles = css`
        .version-page-wrapper {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: #f5f5f5;
        }

        .version-page-header {
            padding: 16px 24px 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .breadcrumb-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        sp-breadcrumbs {
            --mod-breadcrumbs-height: auto;
        }

        .page-title-section {
            display: flex;
            align-items: center;
            gap: 16px;
            background: white;
        }

        .page-title {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: #333;
        }

        .version-page-content {
            display: flex;
            flex: 1;
            gap: 24px;
            margin: 24px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        .version-list-panel {
            min-width: 480px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            margin: 24px;
        }

        .version-list-header {
            padding: 0 24px 20px;
            border-bottom: 1px solid #e0e0e0;
        }

        .version-list-title {
            margin: 0 0 16px 0;
            font-size: 18px;
            font-weight: 700;
            color: #2c2c2c;
        }

        sp-search {
            --spectrum-search-border-radius: 16px;
            width: 100%;
        }

        .version-list-content {
            flex: 1;
            padding: 16px;
        }

        .version-item {
            padding: 20px;
            border: 1px solid #d4d4d4;
            border-radius: 8px;
            margin-bottom: 16px;
            cursor: pointer;
            transition: all 0.15s ease;
            background: white;
            position: relative;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }

        .version-item:hover {
            border-color: #b0b0b0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
            transform: translateY(-1px);
        }

        .version-item.selected {
            border: 2px solid #378ef0;
            padding: 19px;
        }

        .version-item.current {
            border: 2px solid #268e6c;
            padding: 19px;
        }

        .version-content {
            flex: 1;
        }

        .version-menu {
            flex-shrink: 0;
            margin-top: -4px;
        }

        .version-menu::part(button) {
            padding: 4px;
        }

        .version-status {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            margin-left: 4px;
        }

        .current-indicator {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #268e6c;
            color: white;
            padding: 4px 10px;
            border-radius: 14px;
            font-size: 12px;
            font-weight: 700;
        }

        .current-dot {
            width: 7px;
            height: 7px;
            background: #268e6c;
            border-radius: 50%;
        }

        .version-date-time {
            font-size: 13px;
            color: #494949;
            margin-bottom: 6px;
            display: flex;
            gap: 6px;
        }
        .version-author {
            font-size: 18px;
            color: #494949;
        }
        .version-author-name {
            font-weight: 700;
            color: #2c2c2c;
            font-size: 18px;
            margin-bottom: 8px;
        }

        .version-description {
            font-size: 13px;
            color: #464646;
            line-height: 1.5;
        }

        .preview-panel {
            margin: 24px;
            width: 100%;
        }

        .preview-content {
            padding: 0;
        }

        .preview-split {
            display: flex;
            gap: 24px;
            padding: 0;
            flex-direction: column;
            align-items: center;
        }

        .preview-column {
            display: flex;
            flex-direction: column;
            background: white;
            border-radius: 16px;
        }

        .preview-column.current {
            border: 2px solid #268e6c;
        }

        .preview-column.selected {
            border: 2px solid #378ef0;
        }

        .preview-column-header {
            padding: 20px 16px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .diff-highlight {
            background: rgba(255, 200, 0, 0.15);
            border-left: 3px solid #ffc800;
            padding-left: 8px;
            margin-left: -8px;
        }

        .preview-column-date {
            margin: 0;
            font-size: 13px;
            color: #464646;
            display: flex;
            gap: 6px;
            align-items: center;
        }

        .fragment-preview {
            width: 100%;
        }

        .fragment-preview merch-card {
            max-width: 378px;
            margin: 0 auto;
        }

        .fragment-preview-wrapper {
            position: relative;
        }

        .fragment-card-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 8px 16px;
        }

        .fragment-card-container.hidden {
            visibility: hidden;
        }

        .fragment-non-card {
            padding: 12px;
        }

        .spinner-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f5f5;
            z-index: 10;
        }

        .fragment-info {
            font-size: 12px;
            margin: 0 16px 16px;
        }

        .changed-fields-label {
            margin-bottom: 4px;
        }

        .changed-fields-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
            max-width: 274px;
            padding-inline-start: 18px;
            margin-block-start: 8px;
        }

        .changed-field-detail {
            margin: 2px 0;
        }

        .error-message {
            padding: 12px;
            color: red;
        }

        .no-data-message {
            text-align: center;
            padding: 32px;
        }

        .loading-message {
            padding: 24px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }

        .no-fragment-message {
            padding: 24px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }

        @media (max-width: 1024px) {
            .version-page-content {
                padding: 16px;
                gap: 16px;
            }

            .version-list-panel {
                min-width: 400px;
            }
        }
    `;

    constructor() {
        super();
        this.versions = [];
        this.fragment = null;
        this.currentVersion = null;
        this.selectedVersion = null;
        this.selectedVersionData = null;
        this.loading = false;
        this.loadingVersionData = false;
        this.searchQuery = '';
        this.repository = null;
        this.versionRepository = null;
        this.pendingHydrations = new Map();
        this.hydratedCards = new Set();

        // Initialize version transformer with field configuration
        setFieldConfig(VersionPage.FIELD_CONFIG);
    }

    // Disable shadow DOM to allow global styles (like merch-card.css) to apply
    createRenderRoot() {
        return this;
    }

    fragmentId = new StoreController(this, Store.version.fragmentId);
    page = new StoreController(this, Store.page);

    connectedCallback() {
        super.connectedCallback();
        this.repository = document.querySelector('mas-repository');
        if (this.repository) {
            this.versionRepository = new VersionRepository(this.repository);
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        // Load version history when fragmentId changes or when repository becomes available
        if (this.fragmentId.value && this.repository && !this.loading && !this.fragment) {
            this.loadVersionHistory();
        }

        // Process pending card hydrations after DOM is updated
        if (this.pendingHydrations.size > 0) {
            const hydrations = Array.from(this.pendingHydrations.entries());
            this.pendingHydrations.clear();

            // Use requestAnimationFrame to ensure DOM is fully ready
            requestAnimationFrame(() => {
                hydrations.forEach(([cardId, fragmentData]) => {
                    this.hydrateCard(cardId, fragmentData);
                });
            });
        }
    }

    async loadVersionHistory() {
        if (!this.fragmentId.value) {
            return;
        }

        if (!this.repository) {
            return;
        }

        if (!this.repository.aem) {
            return;
        }

        this.loading = true;
        try {
            const { fragment, versions, currentVersion } = await this.versionRepository.loadVersionHistory(
                this.fragmentId.value,
            );

            this.fragment = fragment;
            this.versions = versions;
            this.currentVersion = currentVersion;

            // Set the selected version to the first historical version (second item)
            if (this.versions.length > 1) {
                this.selectedVersion = this.versions[1];
                await this.loadVersionData(this.versions[1]);
            } else {
                this.selectedVersion = this.currentVersion;
                this.selectedVersionData = this.fragment;
            }
        } catch (error) {
            this.versions = [];
            this.fragment = null;
        } finally {
            this.loading = false;
        }
    }

    async handleVersionClick(version) {
        this.selectedVersion = version;

        // Set loading state FIRST to show spinner immediately
        if (!version.isCurrent) {
            this.loadingVersionData = true;
            // Force immediate render to show spinner
            await this.updateComplete;
        }

        // Clear any pending hydrations for selected version cards
        const keysToDelete = [];
        for (const [cardId] of this.pendingHydrations) {
            if (!cardId.endsWith('-current')) {
                keysToDelete.push(cardId);
            }
        }
        keysToDelete.forEach((key) => this.pendingHydrations.delete(key));

        // Remove selected version cards from hydratedCards set so they can be re-hydrated
        const hydratedToRemove = [];
        for (const cardId of this.hydratedCards) {
            if (!cardId.endsWith('-current')) {
                hydratedToRemove.push(cardId);
            }
        }
        hydratedToRemove.forEach((cardId) => this.hydratedCards.delete(cardId));

        // Load the version data for preview
        if (version.isCurrent) {
            // Current version uses the live fragment
            this.selectedVersionData = this.fragment;
            this.loadingVersionData = false;
        } else {
            // Load historical version data (this will update selectedVersionData when done)
            await this.loadVersionData(version);
        }
    }

    async loadVersionData(version) {
        if (!version || version.isCurrent) return;

        // loadingVersionData is already set to true in handleVersionClick
        try {
            const versionData = await this.versionRepository.loadVersionData(this.fragmentId.value, version.id);
            this.selectedVersionData = versionData;
            await this.updateComplete;
        } catch (error) {
            this.selectedVersionData = null;
        } finally {
            this.loadingVersionData = false;
        }
    }

    handleSearchInput(event) {
        this.searchQuery = event.target.value.toLowerCase();
    }

    async handleRestoreVersion(version) {
        if (!version || version.isCurrent) return;

        const versionLabel = version.title || `version from ${this.formatVersionDate(version.created)}`;
        const confirmMessage = `Are you sure you want to restore "${versionLabel}"?\n\nThis will replace the current version with the selected version and create a new version entry.`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            this.loading = true;
            Events.toast.emit({
                variant: 'info',
                content: 'Restoring version...',
            });

            await this.versionRepository.restoreVersion(version, this.fragment, normalizeFields, denormalizeFields);

            // Reload the version history to show the new state
            await this.loadVersionHistory();
        } catch (error) {
            // Error is already handled in versionRepository
        } finally {
            this.loading = false;
        }
    }

    handleBackClick() {
        router.navigateToPage(PAGE_NAMES.CONTENT)();
    }

    handleBreadcrumbClick(page) {
        router.navigateToPage(page)();
    }

    get filteredVersions() {
        if (!this.versionRepository) return this.versions;
        return this.versionRepository.searchVersions(this.versions, this.searchQuery);
    }

    formatVersionDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleDateString('en', { month: 'short' });
        const year = date.getFullYear();
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${day} ${month}, ${year} at ${time}`;
    }

    get versionListPanel() {
        return html`
            <div class="version-list-panel">
                <div class="version-list-header">
                    <h2>Version history</h2>
                    <sp-search
                        placeholder="Search version history"
                        @input="${this.handleSearchInput}"
                        .value="${this.searchQuery}"
                    ></sp-search>
                </div>
                <div class="version-list-content">
                    ${this.loading
                        ? html`<div class="loading-message">
                              <sp-progress-circle indeterminate size="m"></sp-progress-circle>
                          </div>`
                        : this.renderVersionList()}
                </div>
            </div>
        `;
    }

    renderVersionList() {
        const versions = this.filteredVersions;
        if (versions.length === 0) {
            return html`<div class="loading-message">No versions found</div>`;
        }

        return html`
            <div class="version-status">
                <div class="current-dot"></div>
                Current version
            </div>
            ${versions.map((version, index) => {
                const isSelected = this.selectedVersion?.id === version.id;
                const isCurrent = version.isCurrent;
                return html`
                    <div
                        class="version-item ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}"
                        @click="${() => this.handleVersionClick(version)}"
                    >
                        <div class="version-content">
                            <div class="version-date-time">
                                <sp-icon-calendar slot="icon"></sp-icon-calendar>${this.formatVersionDate(version.created)}
                            </div>
                            <div class="version-author">
                                By <span class="version-author-name">${version.createdBy || 'Unknown'}</span>
                            </div>
                            ${version.title && !isCurrent
                                ? html`<div class="version-description"><strong>${version.title}</strong></div>`
                                : nothing}
                            ${version.comment ? html`<div class="version-description">${version.comment}</div>` : nothing}
                        </div>
                        ${!isCurrent
                            ? html`
                                  <sp-action-menu
                                      class="version-menu"
                                      quiet
                                      placement="bottom-end"
                                      @click="${(e) => e.stopPropagation()}"
                                  >
                                      <sp-menu-item @click="${() => this.handleRestoreVersion(version)}">
                                          Restore this version
                                      </sp-menu-item>
                                  </sp-action-menu>
                              `
                            : nothing}
                    </div>
                `;
            })}
        `;
    }

    get previewPanel() {
        if (this.loading) {
            return html`<div class="preview-panel">
                <div class="loading-message">Loading preview...</div>
            </div>`;
        }

        if (!this.fragment) {
            return html`<div class="preview-panel">
                <div class="no-fragment-message">No fragment loaded</div>
            </div>`;
        }

        return html`
            <div class="preview-panel">
                <div class="preview-content">
                    <div class="preview-split">
                        ${this.renderPreviewColumn(this.currentVersion, 'Current', this.fragment, 'current')}
                        ${this.selectedVersion
                            ? this.renderPreviewColumn(this.selectedVersion, 'Selected', this.selectedVersionData, 'selected')
                            : nothing}
                    </div>
                </div>
            </div>
        `;
    }

    renderPreviewColumn(version, label, fragmentData, className = '') {
        if (!version) return nothing;

        const differences =
            className === 'selected' && this.fragment && fragmentData ? calculateDifferences(this.fragment, fragmentData) : [];

        return html`
            <div class="preview-column ${className}">
                <div class="preview-column-header">
                    <div>
                        <sp-detail class="preview-column-date"
                            ><sp-icon-calendar slot="icon"></sp-icon-calendar>${this.formatVersionDate(
                                version.created,
                            )}</sp-detail
                        >
                    </div>
                </div>
                <div class="preview-column-content">${this.renderFragmentPreview(version, fragmentData, differences)}</div>
            </div>
        `;
    }

    renderFragmentPreview(version, fragmentData, differences = []) {
        if (!fragmentData) {
            return html`
                <div class="fragment-preview">
                    <sp-body class="no-data-message">No data available</sp-body>
                </div>
            `;
        }

        const cardId = version.isCurrent ? `${fragmentData.id}-current` : `${fragmentData.id}-selected`;
        const isCardHydrated = this.hydratedCards.has(cardId);
        const isCard = fragmentData.model?.path === CARD_MODEL_PATH;

        if (isCard && !isCardHydrated) {
            this.pendingHydrations.set(cardId, fragmentData);
        }

        const showSpinner = !version.isCurrent && (this.loadingVersionData || !isCardHydrated);

        return html`
            <div class="fragment-preview-wrapper">
                ${isCard
                    ? html`
                          <div class="fragment-card-container ${showSpinner ? 'hidden' : ''}">
                              <merch-card id="${cardId}"></merch-card>
                          </div>
                      `
                    : html`
                          <div class="fragment-non-card">
                              <sp-body><strong>Title:</strong> ${fragmentData.title || 'Untitled'}</sp-body>
                              <sp-body><strong>Type:</strong> ${fragmentData.model?.title || 'Unknown'}</sp-body>
                          </div>
                      `}
                ${showSpinner
                    ? html`
                          <div class="spinner-overlay">
                              <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                          </div>
                      `
                    : nothing}
                ${showSpinner
                    ? nothing
                    : html`
                          <div class="fragment-info">
                              ${differences.length > 0
                                  ? html`
                                        <sp-detail size="s" class="changed-fields-label"
                                            ><strong>Changed Fields:</strong></sp-detail
                                        >
                                        <ul class="changed-fields-list">
                                            ${differences.map(
                                                (diff) => html`
                                                    <li>
                                                        <sp-detail size="s" class="changed-field-detail">
                                                            ${getFieldLabel(diff.field)}${getFieldVisible(diff.field)
                                                                ? ''
                                                                : `: ${formatFieldValue(diff.selectedValue)}`}
                                                        </sp-detail>
                                                    </li>
                                                `,
                                            )}
                                        </ul>
                                    `
                                  : nothing}
                          </div>
                      `}
            </div>
        `;
    }

    async hydrateCard(cardId, fragmentData) {
        await this.updateComplete;

        // Skip if already hydrated (important for keeping current card stable)
        if (this.hydratedCards.has(cardId)) {
            return;
        }

        const merchCard = this.renderRoot.querySelector(`#${CSS.escape(cardId)}`);
        if (!merchCard || !fragmentData) {
            return;
        }

        // Transform AEM data to the format merch-card expects
        const fields = normalizeFields(fragmentData);

        if (!fields.variant) {
            throw new Error(`Fragment data missing variant. Available keys: ${Object.keys(fields).join(', ')}`);
        }

        try {
            // Wait for merch-card to be fully defined
            await customElements.whenDefined('merch-card');
            await merchCard.updateComplete;

            // Ensure certain fields are always arrays (merch-card expects these)
            const safeFields = { ...fields };
            const mustBeArrays = Object.entries(VersionPage.FIELD_CONFIG)
                .filter(([, config]) => config.isArray)
                .map(([fieldName]) => fieldName);

            mustBeArrays.forEach((fieldName) => {
                if (safeFields[fieldName] !== undefined && !Array.isArray(safeFields[fieldName])) {
                    safeFields[fieldName] = [safeFields[fieldName]];
                } else if (safeFields[fieldName] === undefined) {
                    // Set to empty array if undefined
                    safeFields[fieldName] = [];
                }
            });

            // Create the properly formatted fragment data
            const formattedData = {
                id: fragmentData.id,
                fields: safeFields,
                settings: fragmentData.settings || {},
                priceLiterals: fragmentData.priceLiterals || {},
            };

            // Create an aem-fragment element (merch-card expects the event to come from this)
            const aemFragment = document.createElement('aem-fragment');
            // Set fragment attribute to prevent "Missing fragment id" errors
            aemFragment.setAttribute('fragment', fragmentData.id);
            merchCard.appendChild(aemFragment);

            // Wait for aem-fragment to be ready
            await customElements.whenDefined('aem-fragment');
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Dispatch the load event from the aem-fragment element with the formatted data
            const loadEvent = new CustomEvent('aem:load', {
                detail: formattedData,
                bubbles: true,
                composed: true,
            });

            aemFragment.dispatchEvent(loadEvent);

            // Give it time to process
            await new Promise((resolve) => setTimeout(resolve, 200));
            await merchCard.updateComplete;

            // Mark this card as successfully hydrated
            this.hydratedCards.add(cardId);

            // Trigger re-render to hide spinner
            this.requestUpdate();
        } catch (error) {
            console.error('Failed to hydrate card:', cardId, error.message, error.stack);
            merchCard.innerHTML = `<sp-body class="error-message">Failed to render: ${error.message}</sp-body>`;
        }
    }

    render() {
        if (this.page.value !== PAGE_NAMES.VERSION) return nothing;

        return html`
            <style>
                ${this.constructor.styles.cssText}
            </style>
            <div class="version-page-wrapper">
                <div class="version-page-header">
                    <div class="breadcrumb-wrapper">
                        <sp-breadcrumbs>
                            <sp-breadcrumb-item @click="${() => this.handleBreadcrumbClick(PAGE_NAMES.CONTENT)}">
                                Content table
                            </sp-breadcrumb-item>
                            <sp-breadcrumb-item @click="${() => this.handleBreadcrumbClick(PAGE_NAMES.CONTENT)}">
                                Editor
                            </sp-breadcrumb-item>
                            <sp-breadcrumb-item>Version history</sp-breadcrumb-item>
                        </sp-breadcrumbs>
                    </div>
                </div>
                <div class="version-page-content">${this.versionListPanel} ${this.previewPanel}</div>
            </div>
        `;
    }
}

customElements.define('version-page', VersionPage);

export { VersionPage };
export const FIELD_CONFIG = VersionPage.FIELD_CONFIG;
