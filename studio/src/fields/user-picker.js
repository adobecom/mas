import { html, css, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

class MasUserPicker extends LitElement {
    static properties = {
        search: { type: String },
        label: { type: String },
        users: { type: Array },
        currentUser: { type: Object },
        selectedUser: { type: Object },
    };

    static styles = css`
        sp-popover {
            padding: 8px;
            max-height: 326px;
        }

        sp-search {
            margin-bottom: 8px;
            width: 100%;
        }

        sp-menu {
            overflow-y: auto;
            padding-top: 8px;
            padding-bottom: 8px;
        }

        .loading-spinner {
            display: flex;
            justify-content: center;
            padding: 16px;
        }

        .error-message {
            color: var(--spectrum-semantic-negative-color-text);
            padding: 8px;
        }

        #footer {
            padding: 8px;
            height: 40px;
            align-items: center;
            display: flex;
            gap: 8px;
            justify-content: end;
            border-top: 1px solid var(--spectrum-global-color-gray-200);
        }

        #footer span {
            flex: 1;
        }
    `;

    constructor() {
        super();
        this.search = '';
        this.users = [];
        this.currentUser = null;
        this.selectedUser = null;
    }

    get filteredUsers() {
        if (!this.users) return [];

        return [...this.users]
            .sort((a, b) => {
                if (!this.currentUser) return a.id.localeCompare(b.id);
                // If current user matches, put them first
                if (a.id === this.currentUser.userId) return -1;
                if (b.id === this.currentUser.userId) return 1;
                return 0;
            })
            .filter((user) =>
                user.firstName
                    .toLowerCase()
                    .includes(this.search.toLowerCase()),
            );
    }

    get selectedText() {
        return this.selectedUser ? 'User selected' : 'No user selected';
    }

    resetSelection() {
        this.selectedUser = null;
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { user: null },
                bubbles: true,
                composed: true,
            }),
        );
    }

    handleSearchKeyDown(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.updateComplete.then(() => {
                const menuItems =
                    this.shadowRoot.querySelectorAll('sp-menu-item');
                if (menuItems[0]) {
                    menuItems[0].focus();
                }
            });
        }
    }

    handleMenuKeyDown(e) {
        if (e.key === 'ArrowUp') {
            // move focus to the search field if the first item is focused
            const focusedItem = e.target.querySelector('sp-menu-item[focused]');
            if (!focusedItem) return;
            const index = [...e.target.children].indexOf(focusedItem);
            if (index > 0) return;
            const search = this.shadowRoot.querySelector('sp-search');
            if (search) {
                e.preventDefault();
                search.focus();
            }
        }
    }

    render() {
        return html`
            <overlay-trigger placement="bottom">
                <sp-action-button slot="trigger" dir="rtl" quiet>
                    ${this.label}
                    <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
                </sp-action-button>

                <sp-popover slot="click-content">
                    <sp-search
                        placeholder="Search Users"
                        .value="${this.search}"
                        @input="${this.handleSearchInput}"
                        @keydown="${this.handleSearchKeyDown}"
                        @change="${this.handleSearchChange}"
                    ></sp-search>

                    ${this.loading
                        ? html`
                              <div class="loading-spinner">
                                  <sp-progress-circle
                                      indeterminate
                                      size="m"
                                  ></sp-progress-circle>
                              </div>
                          `
                        : this.error
                          ? html`<div class="error-message">${this.error}</div>`
                          : html`
                                <sp-menu
                                    @keydown="${this.handleMenuKeyDown}"
                                    @change="${this.handleChange}"
                                >
                                    ${repeat(
                                        this.filteredUsers,
                                        (user) => user.id,
                                        (user) => html`
                                            <sp-menu-item value="${user.id}">
                                                <span
                                                    >${user.firstName}
                                                    ${user.lastName}</span
                                                >
                                                <span slot="description"
                                                    >${user.email}</span
                                                >
                                                ${this.selectedUser?.id ===
                                                user.id
                                                    ? html`
                                                          <sp-icon-checkmark-circle
                                                              slot="icon"
                                                              size="s"
                                                          >
                                                          </sp-icon-checkmark-circle>
                                                      `
                                                    : nothing}
                                            </sp-menu-item>
                                        `,
                                    )}
                                </sp-menu>
                                <div id="footer">
                                    <span>${this.selectedText}</span>
                                    <sp-button
                                        size="s"
                                        @click=${this.resetSelection}
                                        variant="secondary"
                                        treatment="outline"
                                    >
                                        Reset
                                    </sp-button>
                                </div>
                            `}
                </sp-popover>
            </overlay-trigger>
        `;
    }

    handleSearchInput(e) {
        this.search = e.target.value;
    }

    handleSearchChange(e) {
        e.stopPropagation();
    }

    handleChange(e) {
        e.stopPropagation();
        const selectedUserId = e.target.value;
        const selectedUser = this.users.find(
            (user) => user.id === selectedUserId,
        );
        this.selectedUser = selectedUser;
        e.target.closest('overlay-trigger').open = false;

        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { user: selectedUser },
                bubbles: true,
                composed: true,
            }),
        );
    }
}

customElements.define('mas-user-picker', MasUserPicker);
