import { html, css, LitElement, nothing } from 'lit';
import Store from '../store.js';
import { repeat } from 'lit/directives/repeat.js';
import ReactiveController from '../reactivity/reactive-controller.js';

class AemUserPicker extends LitElement {
    static properties = {
        search: { type: String },
        users: { type: Array },
        loading: { type: Boolean },
        label: { type: String },
        error: { type: String },
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

        .user-info {
            display: flex;
            flex-direction: column;
        }

        .user-name {
            font-weight: bold;
        }

        .user-email {
            font-size: 0.9em;
            color: var(--spectrum-global-color-gray-700);
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

    storeController = new ReactiveController(this, [Store.user, Store.profile]);

    constructor() {
        super();
        this.search = '';
        this.users = [];
        this.loading = false;
        this.error = '';
        this.debounceTimer = null;
    }

    get endpoint() {
        return `https://bps-il.adobe.io/jil-api/v2/organizations/3B962FB55F5F922E0A495C88@AdobeOrg/user-groups/805679796/users/?page=0&page_size=100&search_query=${encodeURIComponent(
            this.search,
        )}&sort=FNAME_LNAME&sort_order=ASC&currentPage=1&filterQuery=`;
    }

    get filteredUsers() {
        const currentUserEmail = Store.profile.get()?.email?.toLowerCase();
        return this.users
            .sort((a, b) => {
                // If current user's email matches, put them first
                if (a.email.toLowerCase() === currentUserEmail) return -1;
                if (b.email.toLowerCase() === currentUserEmail) return 1;
                return 0;
            })
            .filter((user) =>
                user.firstName
                    .toLowerCase()
                    .includes(this.search.toLowerCase()),
            );
    }

    async fetchUsers(searchQuery = '') {
        this.loading = true;
        this.error = '';

        try {
            const response = await fetch(`/studio/src/aem/users.json`, {
                headers: {
                    Authorization: `Bearer ${window.adobeid?.authorize?.()}`,
                    'x-api-key': 'mas-commerce',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            this.users = await response.json();
        } catch (err) {
            this.error = 'Error loading users. Please try again.';
            console.error('Error fetching users:', err);
        } finally {
            this.loading = false;
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this.fetchUsers();
    }

    get selectedText() {
        const selectedUser = Store.user.get();
        return selectedUser ? 'User selected' : 'No user selected';
    }

    resetSelection() {
        Store.user.set(null);
    }

    render() {
        return html`
            <overlay-trigger placement="bottom">
                <sp-action-button slot="trigger" quiet>
                    ${this.label}
                    <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
                </sp-action-button>

                <sp-popover slot="click-content">
                    <sp-search
                        placeholder="Search Users"
                        .value="${this.search}"
                        @input="${this.handleSearchInput}"
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
                                <sp-menu>
                                    ${repeat(
                                        this.filteredUsers,
                                        (user) => user.id,
                                        (user) => html`
                                            <sp-menu-item
                                                value="${user.id}"
                                                @click="${this.handleSelect}"
                                            >
                                                <div class="user-info">
                                                    <span class="user-name"
                                                        >${user.firstName}
                                                        ${user.lastName}</span
                                                    >
                                                    <span class="user-email"
                                                        >${user.email}</span
                                                    >
                                                </div>
                                                ${user.id ===
                                                Store.user.get()?.id
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

    handleSelect(e) {
        const selectedUserId = e.currentTarget.getAttribute('value');
        const selectedUser = this.users.find(
            (user) => user.id === selectedUserId,
        );
        if (selectedUser) {
            Store.user.set(selectedUser);
        }
        e.target.closest('overlay-trigger').open = false;
    }
}

customElements.define('aem-user-picker', AemUserPicker);
