import { LitElement, html, css, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import { PAGE_NAMES, CARD_MODEL_PATH } from './constants.js';
import router from './router.js';
import Events from './events.js';

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
            width: 480px;
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
            color: #6e6e6e;
            margin-bottom: 6px;
            display: flex;
            gap: 6px;
        }

        .version-author {
            font-weight: 700;
            color: #2c2c2c;
            font-size: 14px;
            margin-bottom: 8px;
        }

        .version-description {
            font-size: 13px;
            color: #464646;
            line-height: 1.5;
        }

        .preview-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            margin: 24px;
        }

        .preview-content {
            flex: 1;
            padding: 0;
        }

        .preview-split {
            display: flex;
            flex-direction: column;
            gap: 24px;
            height: 100%;
            padding: 0;
        }

        .preview-column {
            display: flex;
            flex-direction: column;
            background: white;
            border-radius: 16px;
            border: 1px solid #d4d4d4;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        .preview-column-header {
            padding: 20px 24px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .diff-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: #ffc800;
            border-radius: 14px;
            font-size: 12px;
            font-weight: 700;
            color: #2c2c2c;
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
            padding: 12px;
            min-height: 297px;
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
            padding: 12px;
            font-size: 12px;
        }

        .fragment-info-divider {
            margin: 8px 0;
        }

        .changed-fields-label {
            margin-bottom: 4px;
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
                width: 400px;
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
        this.pendingHydrations = new Map(); // Track cards that need hydration after render
        this.hydratedCards = new Set(); // Track which cards have been successfully hydrated
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
            // Load the current fragment using the correct API method
            this.fragment = await this.repository.aem.sites.cf.fragments.getById(this.fragmentId.value);

            // Create a "current version" from the live fragment
            this.currentVersion = {
                id: 'current',
                version: 'current',
                created: new Date().toISOString(),
                createdBy: this.fragment.modifiedBy || 'Unknown',
                title: 'Current version',
                comment: 'Includes current changes',
                isCurrent: true,
                fragment: this.fragment,
            };

            // Load version history using the correct API method
            const versionsResponse = await this.repository.aem.sites.cf.fragments.getVersions(this.fragmentId.value);

            this.versions = [this.currentVersion, ...(versionsResponse.items || [])];

            // Set the selected version to the first historical version (second item)
            if (this.versions.length > 1) {
                this.selectedVersion = this.versions[1];
                // Load the version data for the selected version
                await this.loadVersionData(this.versions[1]);
            } else {
                // If there's only current version, select it
                this.selectedVersion = this.currentVersion;
                this.selectedVersionData = this.fragment;
            }
        } catch (error) {
            console.error('Failed to load version history:', error);
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
            const versionData = await this.repository.aem.sites.cf.fragments.getVersion(this.fragmentId.value, version.id);
            this.selectedVersionData = versionData;

            // Wait for the component to render with new data
            await this.updateComplete;
        } catch (error) {
            console.error('Failed to load version data:', error);
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

            // Load the version data if not already loaded
            let versionData = version.id === this.selectedVersion?.id ? this.selectedVersionData : null;
            if (!versionData) {
                versionData = await this.repository.aem.sites.cf.fragments.getVersion(this.fragmentId.value, version.id);
            }

            // Normalize the version fields (convert elements array to fields object)
            const normalizedFields = this.normalizeFields(versionData);

            if (!normalizedFields.variant) {
                throw new Error('Variant field is missing from normalized data. Cannot restore.');
            }

            // Convert back to AEM array format for saving
            // Pass current fragment to preserve field types and structure
            const fieldsArray = this.denormalizeFields(normalizedFields, this.fragment);

            // Update the current fragment with the version data
            // Keep all fragment properties but replace fields
            const updatedFragment = {
                ...this.fragment,
                fields: fieldsArray,
            };

            // Save the fragment
            await this.repository.aem.sites.cf.fragments.save(updatedFragment);

            Events.toast.emit({
                variant: 'positive',
                content: `Successfully restored "${versionLabel}"`,
            });

            // Reload the version history to show the new state
            await this.loadVersionHistory();
        } catch (error) {
            console.error('Failed to restore version:', error);
            Events.toast.emit({
                variant: 'negative',
                content: `Failed to restore version: ${error.message}`,
            });
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
        if (!this.searchQuery) return this.versions;
        return this.versions.filter((version) => {
            const searchableText = [version.title, version.comment, version.createdBy, this.formatVersionDate(version.created)]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return searchableText.includes(this.searchQuery);
        });
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
                            <div class="version-author">By ${version.createdBy || 'Unknown'}</div>
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

    denormalizeFields(fieldsObject, currentFragment) {
        // Convert flat fields object back to AEM array format for saving
        // Use current fragment's field definitions to preserve types and structure
        const fieldsArray = [];

        // Create a map of field names to their definitions from current fragment
        const fieldDefinitions = new Map();
        if (currentFragment?.fields && Array.isArray(currentFragment.fields)) {
            currentFragment.fields.forEach((field) => {
                fieldDefinitions.set(field.name, field);
            });
        }

        for (const [name, value] of Object.entries(fieldsObject)) {
            // Get the field definition from current fragment (includes type)
            const fieldDef = fieldDefinitions.get(name);
            if (!fieldDef) {
                continue;
            }

            // Convert values to array format
            let values;
            if (Array.isArray(value)) {
                values = value;
            } else if (value !== undefined && value !== null) {
                values = [value];
            } else {
                // Skip undefined/null values
                continue;
            }

            // Preserve the field structure from current fragment but update values
            fieldsArray.push({
                ...fieldDef, // Keep type and other properties
                values, // Update with new values
            });
        }

        return fieldsArray;
    }

    normalizeFields(data) {
        // Transform AEM data to fields object format
        // Check if fields is already an object (not an array)
        if (data.fields && !Array.isArray(data.fields)) {
            return data.fields;
        }

        // Fields that should always remain as arrays (merch-card expects to call .map() or .find() on these)
        const arrayFields = new Set([
            'mnemonicIcon',
            'mnemonicAlt',
            'mnemonicLink',
            'badgeText',
            'actionMenu',
            'cardName',
            'prices',
            'offers',
            'priceDetails',
            'ctas',
            'icons',
            'links',
            'descriptions',
            'ctaTexts',
            'tags', // CRITICAL: tags.find() is called in hydrate.js line 656
        ]);

        // Handle both fields and elements as arrays
        const sourceArray = data.fields || data.elements;
        if (Array.isArray(sourceArray)) {
            const fields = {};
            sourceArray.forEach((element) => {
                if (element.name && element.value !== undefined) {
                    let value = element.value;

                    if (arrayFields.has(element.name)) {
                        // Ensure array fields are always arrays (even empty ones)
                        if (!Array.isArray(value)) {
                            value = [value];
                        }
                        // Keep as array (even if empty) - these fields need .find(), .map() etc
                        fields[element.name] = value;
                    } else if (Array.isArray(value)) {
                        if (value.length === 0) {
                            // Empty arrays become undefined for non-array fields (skip field entirely)
                            // Don't add to fields object
                        } else if (value.length === 1) {
                            // Check if it's an object (structured data) or primitive
                            if (typeof value[0] === 'object' && value[0] !== null) {
                                // Keep single-element object arrays as arrays
                                fields[element.name] = value;
                            } else {
                                // Unwrap single-element primitive arrays
                                fields[element.name] = value[0];
                            }
                        } else {
                            // Multi-element arrays
                            if (typeof value[0] === 'object' && value[0] !== null) {
                                // Keep arrays of objects as is (structured data)
                                fields[element.name] = value;
                            } else {
                                // For arrays of primitives, take first element
                                fields[element.name] = value[0];
                            }
                        }
                    } else {
                        // Simple value (not array)
                        fields[element.name] = value;
                    }
                } else if (element.name && element.values) {
                    let value = element.values;

                    if (arrayFields.has(element.name)) {
                        // Ensure array fields are always arrays (even empty ones)
                        if (!Array.isArray(value)) {
                            value = [value];
                        }
                        // Keep as array (even if empty) - these fields need .find(), .map() etc
                        fields[element.name] = value;
                    } else if (Array.isArray(value)) {
                        if (value.length === 0) {
                            // Empty arrays become undefined for non-array fields (skip field entirely)
                            // Don't add to fields object
                        } else if (value.length === 1) {
                            // Check if it's an object (structured data) or primitive
                            if (typeof value[0] === 'object' && value[0] !== null) {
                                // Keep single-element object arrays as arrays
                                fields[element.name] = value;
                            } else {
                                // Unwrap single-element primitive arrays
                                fields[element.name] = value[0];
                            }
                        } else {
                            // Multi-element arrays
                            if (typeof value[0] === 'object' && value[0] !== null) {
                                // Keep arrays of objects as is (structured data)
                                fields[element.name] = value;
                            } else {
                                // For arrays of primitives, take first element
                                fields[element.name] = value[0];
                            }
                        }
                    } else {
                        // Simple value (not array)
                        fields[element.name] = value;
                    }
                }
            });
            return fields;
        }

        return {};
    }

    calculateDifferences(currentData, selectedData) {
        if (!currentData || !selectedData) return [];

        const differences = [];
        // AEM uses 'fields' object for live fragments and 'elements' array for version data
        const fields = this.normalizeFields(currentData);
        const selectedFields = this.normalizeFields(selectedData);

        // Compare all fields
        const allKeys = new Set([...Object.keys(fields), ...Object.keys(selectedFields)]);

        allKeys.forEach((key) => {
            const currentValue = fields[key];
            const selectedValue = selectedFields[key];

            // Convert to strings for comparison
            const currentStr = JSON.stringify(currentValue);
            const selectedStr = JSON.stringify(selectedValue);

            if (currentStr !== selectedStr) {
                differences.push({
                    field: key,
                    currentValue,
                    selectedValue,
                });
            }
        });

        return differences;
    }

    renderPreviewColumn(version, label, fragmentData, className = '') {
        if (!version) return nothing;

        const differences =
            className === 'selected' && this.fragment && fragmentData
                ? this.calculateDifferences(this.fragment, fragmentData)
                : [];

        const hasDifferences = differences.length > 0;

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
                    ${hasDifferences
                        ? html`<div class="diff-badge">
                              ${differences.length} ${differences.length === 1 ? 'change' : 'changes'}
                          </div>`
                        : nothing}
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

        // Calculate card ID first
        const cardId = version.isCurrent ? `${fragmentData.id}-current` : `${fragmentData.id}-selected`;
        const isCardHydrated = this.hydratedCards.has(cardId);
        const isCard = fragmentData.model?.path === CARD_MODEL_PATH;
        const diffFields = new Set(differences.map((d) => d.field));

        // Schedule the card hydration after render (store it for processing in updated())
        if (isCard && !isCardHydrated) {
            this.pendingHydrations.set(cardId, fragmentData);
        }

        // Show only spinner while loading OR if card isn't hydrated yet (but still render card hidden)
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
                          <sp-divider size="s"></sp-divider>
                          <div class="fragment-info">
                              <sp-detail size="s"><strong>Fragment ID:</strong> ${fragmentData.id}</sp-detail>
                              <sp-detail size="s"><strong>Version:</strong> ${version.version}</sp-detail>
                              ${version.title && version.title !== 'Current version'
                                  ? html`<sp-detail size="s" class="${diffFields.has('title') ? 'diff-highlight' : ''}">
                                        <strong>Title:</strong> ${version.title}
                                    </sp-detail>`
                                  : nothing}
                              ${this.normalizeFields(fragmentData).variant
                                  ? html`<sp-detail size="s" class="${diffFields.has('variant') ? 'diff-highlight' : ''}">
                                        <strong>Variant:</strong> ${this.normalizeFields(fragmentData).variant}
                                    </sp-detail>`
                                  : nothing}
                              ${differences.length > 0
                                  ? html`
                                        <sp-divider size="s" class="fragment-info-divider"></sp-divider>
                                        <sp-detail size="s" class="changed-fields-label"
                                            ><strong>Changed Fields:</strong></sp-detail
                                        >
                                        ${differences.map(
                                            (diff) => html`
                                                <sp-detail size="s" class="diff-highlight changed-field-detail">
                                                    <strong>${diff.field}:</strong> ${this.formatFieldValue(diff.selectedValue)}
                                                </sp-detail>
                                            `,
                                        )}
                                    `
                                  : nothing}
                          </div>
                      `}
            </div>
        `;
    }

    formatFieldValue(value) {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
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
        const fields = this.normalizeFields(fragmentData);

        if (!fields.variant) {
            throw new Error(`Fragment data missing variant. Available keys: ${Object.keys(fields).join(', ')}`);
        }

        try {
            // Wait for merch-card to be fully defined
            await customElements.whenDefined('merch-card');
            await merchCard.updateComplete;

            // Ensure certain fields are always arrays (merch-card expects these)
            const safeFields = { ...fields };
            const mustBeArrays = [
                'mnemonicIcon',
                'mnemonicAlt',
                'mnemonicLink',
                'badgeText',
                'actionMenu',
                'cardName',
                'prices',
                'offers',
                'priceDetails',
                'ctas',
                'icons',
                'links',
                'descriptions',
                'ctaTexts',
                'tags', // CRITICAL: tags.find() is called in hydrate.js
            ];

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
