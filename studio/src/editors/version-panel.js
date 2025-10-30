import { LitElement, html, css, nothing } from 'lit';

class VersionHistoryButton extends LitElement {
    static properties = {
        versions: { type: Array, state: true },
        selectedVersion: { type: String, state: true },
        loading: { type: Boolean, state: true },
        disabled: { type: Boolean, state: true },
        showPanel: { type: Boolean, state: true },
        showMenuFor: { type: String, state: true },
        showEditModal: { type: Boolean, state: true },
        editingVersion: { type: Object, state: true },
        editTitle: { type: String, state: true },
        editComment: { type: String, state: true },
        fragmentId: { type: String, attribute: true },
        repository: { type: Object, attribute: false },
    };

    static styles = css`
        :host {
            position: relative;
            display: inline-block;
        }

        sp-action-button {
            border: 0;
            height: 100%;
            padding-top: 4px;
        }

        .version-history-panel {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            background: white;
            display: flex;
            flex-direction: column;
            width: 292px
            border-left: 1px solid #ccc;
            box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
            .version-history-panel {
                width: 100vw;
            }
        }

        .version-history-header {
            padding: 16px;
            border-bottom: 1px solid #eee;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .back-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        }

        .back-button:hover {
            background-color: #e9ecef;
        }

        .back-arrow-icon {
            width: 20px;
            height: 20px;
        }

        .version-history-title {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #333;
            flex: 1;
        }

        .version-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px 0;
        }

        .version-item {
            padding: 16px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 12px;
            transition: all 0.2s;
            position: relative;
            background: white;
        }

        .version-item:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .version-item.current {
            border: 2px solid #4caf50;
            background: #f8fff8;
        }

        .version-item.selected {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
        }

        .version-item:last-child {
            margin-bottom: 0;
        }

        .version-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }

        .version-title-section {
            flex: 1;
        }

        .version-status {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
        }

        .current-indicator {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #4caf50;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }

        .current-dot {
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
        }

        .version-label {
            font-weight: 600;
            color: #333;
            font-size: 14px;
            margin: 0;
        }

        .version-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 8px 0;
            font-size: 12px;
            color: #666;
        }

        .version-date {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .version-author {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .version-description {
            font-size: 13px;
            color: #555;
            line-height: 1.4;
            margin-top: 8px;
        }

        .version-actions-menu {
            position: relative;
        }

        .menu-trigger {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        }

        .menu-trigger:hover {
            background-color: #f0f0f0;
        }

        .menu-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            min-width: 180px;
            padding: 4px 0;
        }

        .menu-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 13px;
            color: #333;
            transition: background-color 0.2s;
        }

        .menu-item:hover {
            background-color: #f8f9fa;
        }

        .menu-item-icon {
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .edit-modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .edit-modal {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            width: 292px;
            max-width: 90vw;
            position: relative;
        }

        .edit-modal-content {
            padding: 24px;
            border: 2px dashed #e3f2fd;
            border-radius: 6px;
            margin: 0;
        }

        .edit-modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin: 0 0 20px 0;
        }

        .edit-modal-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 20px;
        }

        .loading-message {
            padding: 16px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }

        .no-versions {
            padding: 16px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    `;

    constructor() {
        super();
        this.versions = [];
        this.selectedVersion = '';
        this.loading = false;
        this.disabled = false;
        this.showPanel = false;
        this.showMenuFor = '';
        this.showEditModal = false;
        this.editingVersion = null;
        this.editTitle = '';
        this.editComment = '';
        this.fragmentId = '';
        this.repository = null;
    }

    get value() {
        return this.selectedVersion;
    }

    set value(newValue) {
        this.selectedVersion = newValue;
        this.requestUpdate();
    }

    formatVersionLabel(version) {
        const date = new Date(version.created);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `Version ${version.version} - ${formattedDate} ${formattedTime}`;
    }

    formatVersionDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleDateString('en', { month: 'short' });
        const year = date.getFullYear();
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${day} ${month}, ${year} at ${time}`;
    }

    toggleMenu(event, version) {
        event.stopPropagation();
        this.showMenuFor = this.showMenuFor === version.id ? '' : version.id;
    }

    restoreVersion(version) {
        this.showMenuFor = '';
        this.selectedVersion = version.id;
        this.confirmVersionSelection();
    }

    editVersion(version) {
        this.showMenuFor = '';
        this.editingVersion = version;
        this.editTitle = version.title || '';
        this.editComment = version.comment || '';
        this.showEditModal = true;
    }

    copyVersionLink(version) {
        this.showMenuFor = '';
        // TODO: Implement copy link functionality
        const link = `${window.location.origin}/fragments/${version.id}`;
        navigator.clipboard
            .writeText(link)
            .then(() => {
                alert('Version link copied to clipboard');
            })
            .catch(() => {
                alert('Failed to copy link');
            });
    }

    closeEditModal() {
        this.showEditModal = false;
        this.editingVersion = null;
        this.editTitle = '';
        this.editComment = '';
    }

    async saveVersionEdit() {
        alert(`Update feature is not implemented yet.`);
        return;
        if (!this.editingVersion || !this.fragmentId || !this.repository) {
            console.error('Missing required data for version update');
            return;
        }

        try {
            // Show loading state
            this.loading = true;

            // Update version via AEM API
            const updatedVersion = await this.repository.aem.sites.cf.fragments.updateVersion(
                this.fragmentId,
                this.editingVersion.id,
                {
                    title: this.editTitle,
                    comment: this.editComment,
                },
            );

            // Update the version in the versions array
            const versionIndex = this.versions.findIndex((v) => v.id === this.editingVersion.id);
            if (versionIndex !== -1) {
                this.versions[versionIndex] = {
                    ...this.versions[versionIndex],
                    title: this.editTitle,
                    comment: this.editComment,
                    ...updatedVersion, // Include any additional data from API response
                };
                this.versions = [...this.versions]; // Trigger reactivity
            }

            // Dispatch event to notify parent components
            this.dispatchEvent(
                new CustomEvent('version-updated', {
                    detail: {
                        version: this.versions[versionIndex],
                        oldVersion: this.editingVersion,
                    },
                    bubbles: true,
                    composed: true,
                }),
            );

            this.closeEditModal();
        } catch (error) {
            console.error('Failed to update version:', error);

            // Dispatch error event
            this.dispatchEvent(
                new CustomEvent('version-update-error', {
                    detail: {
                        error: error.message,
                        version: this.editingVersion,
                    },
                    bubbles: true,
                    composed: true,
                }),
            );

            // Show error message to user
            alert(`Failed to update version: ${error.message}`);
        } finally {
            this.loading = false;
        }
    }

    handleEditTitleChange(event) {
        this.editTitle = event.target.value;
    }

    handleEditCommentChange(event) {
        this.editComment = event.target.value;
    }

    handleVersionClick(version) {
        this.selectedVersion = version.id;
        // Automatically switch to the selected version
        this.confirmVersionSelection();
    }

    confirmVersionSelection() {
        const selectedVersion = this.versions.find((v) => v.id === this.selectedVersion);
        if (selectedVersion) {
            // Keep panel open - don't set this.showPanel = false

            // Dispatch custom event for parent components to handle
            this.dispatchEvent(
                new CustomEvent('version-change', {
                    detail: {
                        versionId: selectedVersion.id,
                        version: selectedVersion,
                    },
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    togglePanel() {
        this.showPanel = !this.showPanel;
    }

    closePanel() {
        this.showPanel = false;
        this.showMenuFor = '';
    }

    handleClickOutside(event) {
        if (this.showMenuFor && !event.target.closest('.version-actions-menu')) {
            this.showMenuFor = '';
        }
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this.handleClickOutside.bind(this));
    }

    get versionHistoryIcon() {
        return html`
            <svg viewBox="0 0 36 36" focusable="false" aria-hidden="true" role="img" width="16" height="16">
                <path
                    fill-rule="evenodd"
                    d="M19,6H17a1,1,0,0,0-1,1V17.586a1,1,0,0,0,.293.707L21.9,23.9a1,1,0,0,0,1.414,0l1.336-1.336a1,1,0,0,0,0-1.414L20,16.5V7A1,1,0,0,0,19,6Z"
                ></path>
                <path
                    fill-rule="evenodd"
                    d="M18,2A15.946,15.946,0,0,0,6.856,6.519,13.124,13.124,0,0,0,2.847,14H.5a.5.5,0,0,0-.5.5.49.49,0,0,0,.147.35l3.537,4.033a.5.5,0,0,0,.632,0l3.537-4.033A.49.49,0,0,0,8,14.5a.5.5,0,0,0-.5-.5H4.969A11.708,11.708,0,0,1,8.458,7.755a14,14,0,1,1-.009,20.481.5.5,0,0,0-.691.006l-.707.707a.506.506,0,0,0,0,.723A16,16,0,1,0,18,2Z"
                ></path>
            </svg>
        `;
    }

    get backArrowIcon() {
        return html`
            <svg class="back-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
        `;
    }

    get versionList() {
        if (this.loading) {
            return html`<div class="loading-message">Loading versions...</div>`;
        }

        if (!this.versions || this.versions.length === 0) {
            return html`<div class="no-versions">No versions available</div>`;
        }

        return html`
            <div class="version-list">
                ${this.versions.map((version, index) => {
                    const isSelected = version.id === this.selectedVersion;
                    const isCurrent = index === 0; // First version is current
                    return html`
                        <div
                            class="version-item ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}"
                            @click="${() => this.handleVersionClick(version)}"
                        >
                            <div class="version-header">
                                <div class="version-title-section">
                                    <div class="version-status">
                                        ${isCurrent
                                            ? html`
                                                  <div class="current-indicator">
                                                      <div class="current-dot"></div>
                                                      Latest version
                                                  </div>
                                              `
                                            : nothing}
                                    </div>
                                    <div class="version-label">${version.title || `Version ${version.version}`}</div>
                                </div>
                                <div class="version-actions-menu">
                                    <button class="menu-trigger" @click="${(e) => this.toggleMenu(e, version)}">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <circle cx="12" cy="5" r="2" />
                                            <circle cx="12" cy="12" r="2" />
                                            <circle cx="12" cy="19" r="2" />
                                        </svg>
                                    </button>
                                    ${this.showMenuFor === version.id
                                        ? html`
                                              <div class="menu-dropdown">
                                                  <div class="menu-item" @click="${() => this.restoreVersion(version)}">
                                                      <div class="menu-item-icon">
                                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                              <path
                                                                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                                                              />
                                                          </svg>
                                                      </div>
                                                      Restore this version
                                                  </div>
                                                  <div class="menu-item" @click="${() => this.editVersion(version)}">
                                                      <div class="menu-item-icon">
                                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                              <path
                                                                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                                                              />
                                                          </svg>
                                                      </div>
                                                      Edit name/comment
                                                  </div>
                                                  <div class="menu-item" @click="${() => this.copyVersionLink(version)}">
                                                      <div class="menu-item-icon">
                                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                              <path
                                                                  d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
                                                              />
                                                          </svg>
                                                      </div>
                                                      Copy link
                                                  </div>
                                              </div>
                                          `
                                        : nothing}
                                </div>
                            </div>
                            <div class="version-meta">
                                <div class="version-date">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                        <path
                                            d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                                        />
                                    </svg>
                                    ${this.formatVersionDate(version.created)}
                                </div>
                                <div class="version-author">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                        <path
                                            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                                        />
                                    </svg>
                                    By ${version.createdBy || 'Unknown'}
                                </div>
                            </div>
                            ${version.comment ? html`<div class="version-description">${version.comment}</div>` : nothing}
                        </div>
                    `;
                })}
            </div>
        `;
    }

    get versionActions() {
        return nothing;
    }

    render() {
        return html`
            <sp-action-button
                label="Version History"
                title="View version history"
                ?disabled="${this.disabled || this.loading}"
                @click="${this.togglePanel}"
            >
                ${this.versionHistoryIcon}
                <sp-tooltip self-managed placement="bottom">Version History</sp-tooltip>
            </sp-action-button>

            ${this.showPanel
                ? html`
                      <div class="version-history-panel">
                          <div class="version-history-header">
                              <button class="back-button" @click="${this.closePanel}" title="Back to Editor">
                                  ${this.backArrowIcon}
                              </button>
                              <h3 class="version-history-title">Version History</h3>
                          </div>
                          ${this.versionList}
                      </div>
                  `
                : nothing}
            ${this.showEditModal
                ? html`
                      <div class="edit-modal-backdrop" @click="${this.closeEditModal}">
                          <div class="edit-modal" @click="${(e) => e.stopPropagation()}">
                              <div class="edit-modal-content">
                                  <h3 class="edit-modal-title">Name your version</h3>
                                  <sp-field-group id="title">
                                      <sp-field-label for="version-title">Version title</sp-field-label>
                                      <sp-textfield
                                          placeholder="Enter card title"
                                          id="version-title"
                                          data-field="version-title"
                                          value="${this.editTitle}"
                                          @input=${this.handleEditTitleChange}
                                      ></sp-textfield>
                                  </sp-field-group>
                                  <sp-field-group id="comment">
                                      <sp-field-label for="comment">Comment</sp-field-label>
                                      <sp-textfield
                                          placeholder="Describe your changes (optional)"
                                          id="comment"
                                          data-field="comment"
                                          value="${this.editComment}"
                                          @input=${this.handleEditCommentChange}
                                      ></sp-textfield>
                                  </sp-field-group>
                                  <div class="edit-modal-actions">
                                      <sp-button slot="button" variant="secondary" @click="${this.closeEditModal}"
                                          >Discard</sp-button
                                      >
                                      <sp-button slot="button" variant="accent" @click="${this.saveVersionEdit}"
                                          >Save</sp-button
                                      >
                                  </div>
                              </div>
                          </div>
                      </div>
                  `
                : nothing}
        `;
    }
}

customElements.define('version-history', VersionHistoryButton);
