import { LitElement, html, css } from 'lit';
import { EVENT_KEYDOWN, LOCALES } from './constants.js';
import { showToast } from './utils.js';

const ERROR_TYPES = {
    PERMISSION: { patterns: ['permission', '403'], message: 'You do not have permission to copy this fragment' },
    NOT_FOUND: { patterns: ['not found', '404'], message: 'Fragment not found. It may have been deleted.' },
    NETWORK: { patterns: ['network', 'Network'], message: 'Network error. Please check your connection and try again.' },
};

export class MasCopyDialog extends LitElement {
    static properties = {
        fragment: { type: Object },
        selectedFolder: { state: true },
        selectedLocale: { state: true },
        loading: { state: true },
        error: { state: true },
    };

    static styles = css`
        :host {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 999;
            display: block;
        }

        .dialog-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        sp-dialog-wrapper {
            z-index: 1000;
            position: relative;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            background: var(--spectrum-white);
            border-radius: 16px;
            --spectrum-dialog-max-height: 90vh;
            --spectrum-dialog-content-overflow-y: auto;
        }

        .form-field {
            margin-bottom: var(calc(var(--swc-scale-factor) * 32px));
        }

        sp-field-label {
            display: block;
            margin-bottom: var(calc(var(--swc-scale-factor) * 8px));
        }

        .folder-tree {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 4px;
            padding: 8px;
        }

        .folder-item {
            padding: 4px 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .folder-item:hover {
            background-color: var(--spectrum-gray-200);
        }

        .folder-item.selected {
            background-color: var(--spectrum-blue-400);
            color: white;
        }

        .folder-item.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .folder-icon {
            width: 16px;
            height: 16px;
        }

        .current-path {
            font-size: 12px;
            color: var(--spectrum-gray-700);
            margin-bottom: 8px;
        }

        .error-message {
            color: var(--spectrum-red-600);
            font-size: 12px;
            margin-top: 8px;
        }

        sp-textfield {
            width: 100%;
        }

        sp-picker {
            width: 100%;
        }
    `;

    constructor() {
        super();
        this.fragment = null;
        this.selectedFolder = null;
        this.selectedLocale = 'en_US';
        this.loading = false;
        this.error = null;
        this.merchFolders = [];
        this.aem = null;

        this.handleSubmit = this.handleSubmit.bind(this);
        this.close = this.close.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_KEYDOWN, this.handleKeyDown);
        this.aem = document.querySelector('mas-repository')?.aem;

        if (this.aem) {
            this.loadMerchFolders();
        } else {
            this.error = 'AEM instance not available';
            this.loading = false;
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        if (this.aem && this.merchFolders.length === 0 && !this.loading) {
            this.loadMerchFolders();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_KEYDOWN, this.handleKeyDown);
    }

    handleKeyDown(event) {
        if (event.key === 'Escape' && this.dialog?.open) {
            this.close();
        }
    }

    get dialog() {
        return this.shadowRoot.querySelector('sp-dialog-wrapper');
    }

    updated() {
        this.open();
    }

    async open() {
        await this.updateComplete;
        this.dialog.open = true;
    }

    async loadMerchFolders() {
        try {
            this.loading = true;

            const aem = this.aem;
            if (!aem) {
                throw new Error('AEM instance not available');
            }

            const rootPath = '/content/dam/mas';
            const result = await aem.folders.list(rootPath);

            const allowedFolders = ['nala', 'sandbox'];

            this.merchFolders = result.children
                .filter((folder) => allowedFolders.includes(folder.name.toLowerCase()))
                .map((folder) => ({
                    ...folder,
                    displayName: folder.name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                    fullPath: folder.path,
                }));

            this.loading = false;
        } catch (err) {
            this.error = 'Failed to load folders';
            this.loading = false;
            console.error('Error loading folders:', err);
        }
    }

    selectFolder(folder) {
        this.selectedFolder = folder;
        this.error = null;
    }

    validateInputs() {
        if (!this.selectedFolder) {
            this.error = 'Please select a destination folder';
            return false;
        }

        if (!this.aem) {
            this.error = 'AEM instance not available';
            return false;
        }

        if (!this.fragment?.path) {
            this.error = 'Fragment is missing path property';
            return false;
        }

        return true;
    }

    showSuccessMessage(copiedFragment) {
        const folderName = this.selectedFolder.displayName;
        const localeName = this.selectedLocale;
        showToast(`Fragment copied to ${folderName} (${localeName})`, 'positive');
    }

    handleCopyError(error) {
        this.error = error.message || 'Failed to copy fragment';
        this.loading = false;

        const errorMessage = error.message || '';

        for (const [, config] of Object.entries(ERROR_TYPES)) {
            if (config.patterns.some((pattern) => errorMessage.includes(pattern))) {
                showToast(config.message, 'negative');
                return;
            }
        }

        showToast(`Failed to copy fragment: ${error.message}`, 'negative');
    }

    extractSubfolderPath() {
        if (!this.fragment?.path || !this.selectedFolder?.fullPath) {
            return '';
        }

        const fragmentPath = this.fragment.path;
        const surfacePath = this.selectedFolder.fullPath;

        const pathParts = fragmentPath.split('/');
        const surfaceParts = surfacePath.split('/');

        const surfaceIndex = pathParts.findIndex(
            (part, idx) => idx < pathParts.length - 2 && part === surfaceParts[surfaceParts.length - 1],
        );

        if (surfaceIndex === -1) return '';

        const localeIndex = pathParts.findIndex((part, idx) => idx > surfaceIndex && /^[a-z]{2}_[A-Z]{2}$/.test(part));

        if (localeIndex === -1 || localeIndex <= surfaceIndex + 1) return '';

        return pathParts.slice(surfaceIndex + 1, localeIndex).join('/');
    }

    async performCopy() {
        const subfolderPath = this.extractSubfolderPath();
        const targetPath = subfolderPath ? `${this.selectedFolder.fullPath}/${subfolderPath}` : this.selectedFolder.fullPath;

        const copiedFragment = await this.aem.sites.cf.fragments.copyToFolder(
            this.fragment,
            targetPath,
            null,
            this.selectedLocale,
        );

        if (!copiedFragment) {
            throw new Error('Copy operation completed but could not retrieve copied fragment');
        }

        return copiedFragment;
    }

    async handleSubmit() {
        if (!this.validateInputs()) return;

        try {
            this.loading = true;
            showToast(`Copying fragment to ${this.selectedFolder.displayName}...`);

            const copiedFragment = await this.performCopy();
            this.showSuccessMessage(copiedFragment);

            this.dispatchEvent(
                new CustomEvent('fragment-copied', {
                    detail: { fragment: copiedFragment },
                    bubbles: true,
                    composed: true,
                }),
            );
        } catch (err) {
            this.handleCopyError(err);
        }
    }

    close() {
        this.dialog.open = false;
        this.dispatchEvent(
            new CustomEvent('cancel', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        return html`
            <div class="dialog-backdrop" @click=${this.handleBackdropClick}>
                <sp-dialog-wrapper
                    headline="Copy fragment"
                    mode="modal"
                    confirm-label="Copy"
                    cancel-label="Cancel"
                    @confirm=${this.handleSubmit}
                    @cancel=${this.close}
                    ?dismissable=${!this.loading}
                    @click=${(e) => e.stopPropagation()}
                >
                    <div class="form-field">
                        <sp-field-label for="locale-picker">Select Locale</sp-field-label>
                        <sp-picker
                            id="locale-picker"
                            value=${this.selectedLocale}
                            @change=${(e) => (this.selectedLocale = e.target.value)}
                        >
                            ${LOCALES.map(
                                (locale) => html`
                                    <sp-menu-item value="${locale.code}" ?selected="${locale.code === this.selectedLocale}">
                                        ${locale.flag} ${locale.name} (${locale.code})
                                    </sp-menu-item>
                                `,
                            )}
                        </sp-picker>
                    </div>

                    <div class="form-field">
                        <sp-field-label for="folder-picker">Select Destination Folder</sp-field-label>

                        ${this.loading
                            ? html` <sp-progress-circle indeterminate></sp-progress-circle> `
                            : html`
                                  <div class="folder-tree">
                                      ${this.merchFolders.length === 0
                                          ? html`<div class="error-message">No folders available</div>`
                                          : this.merchFolders.map((folder) => {
                                                return html`
                                                    <div
                                                        class="folder-item ${this.selectedFolder?.fullPath === folder.fullPath
                                                            ? 'selected'
                                                            : ''}"
                                                        @click=${() => this.selectFolder(folder)}
                                                        title="${folder.fullPath}"
                                                    >
                                                        <sp-icon-folder size="m" class="folder-icon"></sp-icon-folder>
                                                        <span>${folder.displayName}</span>
                                                    </div>
                                                `;
                                            })}
                                  </div>
                              `}
                        ${this.error ? html` <div class="error-message">${this.error}</div> ` : ''}
                    </div>
                </sp-dialog-wrapper>
            </div>
        `;
    }

    handleBackdropClick(event) {
        if (event.target.classList.contains('dialog-backdrop') && !this.loading) {
            this.close();
        }
    }
}

customElements.define('mas-copy-dialog', MasCopyDialog);
