import { LitElement, html, css } from 'lit';
import { EVENT_KEYDOWN } from './constants.js';
import Store from './store.js';
import { showToast } from './utils.js';

export class MasCopyDialog extends LitElement {
    static properties = {
        fragment: { type: Object },
        selectedFolder: { state: true },
        loading: { state: true },
        error: { state: true },
        fragmentName: { state: true },
    };

    static styles = css`
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
        }

        sp-dialog-wrapper {
            z-index: 1000;
            position: relative;
        }

        .form-field {
            margin-bottom: var(--spectrum-global-dimension-size-400);
        }

        sp-field-label {
            display: block;
            margin-bottom: var(--spectrum-global-dimension-size-100);
        }

        .folder-tree {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid var(--spectrum-global-color-gray-300);
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
            background-color: var(--spectrum-global-color-gray-200);
        }

        .folder-item.selected {
            background-color: var(--spectrum-global-color-blue-400);
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
            color: var(--spectrum-global-color-gray-700);
            margin-bottom: 8px;
        }

        .error-message {
            color: var(--spectrum-global-color-red-600);
            font-size: 12px;
            margin-top: 8px;
        }

        sp-textfield {
            width: 100%;
        }
    `;

    constructor() {
        super();
        this.fragment = null;
        this.selectedFolder = null;
        this.loading = false;
        this.error = null;
        this.merchFolders = [];
        this.aem = null;
        this.fragmentName = '';

        // Bind methods
        this.handleSubmit = this.handleSubmit.bind(this);
        this.close = this.close.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_KEYDOWN, this.handleKeyDown);
        this.aem = document.querySelector('mas-repository')?.aem;
        
        // Set initial fragment name from the fragment
        if (this.fragment?.name) {
            this.fragmentName = this.fragment.name;
        }
        
        if (this.aem) {
            this.loadMerchFolders();
        } else {
            this.error = 'AEM instance not available';
            this.loading = false;
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        
        // Update fragment name when fragment changes
        if (changedProperties.has('fragment') && this.fragment?.name) {
            this.fragmentName = this.fragment.name;
        }
        
        // If AEM becomes available and we haven't loaded folders yet
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

            // Use the store controller to get AEM
            const aem = this.aem;
            if (!aem) {
                throw new Error('AEM instance not available');
            }

            // Get the folders directly from /content/dam/mas
            const rootPath = '/content/dam/mas';
            const result = await aem.folders.list(rootPath);

            // Filter to only show the allowed folders
            const allowedFolders = ['acom', 'adobe-home', 'ccd', 'commerce', 'docs', 'express', 'nala', 'sandbox'];

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

    async handleSubmit() {
        if (!this.selectedFolder) {
            this.error = 'Please select a destination folder';
            return;
        }

        if (!this.fragmentName || this.fragmentName.trim() === '') {
            this.error = 'Please enter a name for the fragment';
            return;
        }

        try {
            this.loading = true;
            showToast(`Copying fragment to ${this.selectedFolder.displayName}...`);

            const aem = this.aem;
            if (!aem) {
                throw new Error('AEM instance not available');
            }

            if (!this.fragment?.path) {
                throw new Error('Fragment is missing path property');
            }

            // Copy the fragment with custom name
            const customName = this.fragmentName.trim();
            const copiedFragment = await aem.sites.cf.fragments.copyToFolder(
                this.fragment, 
                this.selectedFolder.fullPath,
                customName !== this.fragment.name ? customName : null
            );

            if (!copiedFragment) {
                throw new Error('Copy operation completed but could not retrieve copied fragment');
            }

            // Show appropriate message based on the operation result
            if (copiedFragment._renamedTo && copiedFragment._renamedTo !== this.fragment.name) {
                showToast(`Fragment copied to ${this.selectedFolder.displayName} and renamed to '${copiedFragment._renamedTo}' to avoid conflicts`, 'positive');
            } else if (copiedFragment && copiedFragment.name && copiedFragment.name !== this.fragment.name) {
                showToast(`Fragment copied to ${this.selectedFolder.displayName} and renamed to '${copiedFragment.name}' to avoid conflicts`, 'positive');
            } else {
                showToast(`Fragment copied to ${this.selectedFolder.displayName}`, 'positive');
            }

            // Dispatch success event
            this.dispatchEvent(
                new CustomEvent('fragment-copied', {
                    detail: { fragment: copiedFragment },
                    bubbles: true,
                    composed: true,
                }),
            );

            this.close();
        } catch (err) {
            this.error = err.message || 'Failed to copy fragment';
            this.loading = false;

            // Show more specific error messages
            if (err.message.includes('permission') || err.message.includes('403')) {
                showToast('You do not have permission to copy this fragment', 'negative');
            } else if (err.message.includes('not found') || err.message.includes('404')) {
                showToast('Fragment not found. It may have been deleted.', 'negative');
            } else if (err.message.includes('network') || err.message.includes('Network')) {
                showToast('Network error. Please check your connection and try again.', 'negative');
            } else {
                showToast(`Failed to copy fragment: ${err.message}`, 'negative');
            }
        }
    }

    close() {
        this.dialog.open = false;
        this.dispatchEvent(
            new CustomEvent('dialog-closed', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        return html`
            <div class="dialog-backdrop" @click=${this.handleBackdropClick}>
                <sp-dialog-wrapper
                    headline="Copy Fragment to Folder"
                    mode="modal"
                    confirm-label="Copy"
                    cancel-label="Cancel"
                    @confirm=${this.handleSubmit}
                    @cancel=${this.close}
                    ?dismissable=${!this.loading}
                    @click=${(e) => e.stopPropagation()}
                >
                <div class="form-field">
                    <sp-field-label for="fragment-name">Fragment Name</sp-field-label>
                    <sp-textfield
                        id="fragment-name"
                        value=${this.fragmentName}
                        @input=${(e) => this.fragmentName = e.target.value}
                        placeholder="Enter fragment name"
                    ></sp-textfield>
                </div>

                <div class="form-field">
                    <sp-field-label for="folder-picker">Select Destination Folder</sp-field-label>
                    <div class="current-path">Current location: ${this.fragment?.path || ''}</div>

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
                                                    <sp-icon-folder class="folder-icon"></sp-icon-folder>
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
        // Close dialog when clicking on backdrop
        if (event.target.classList.contains('dialog-backdrop') && !this.loading) {
            this.close();
        }
    }
}

customElements.define('mas-copy-dialog', MasCopyDialog);