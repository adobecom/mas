import { html, css, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import ReactiveController from '../reactivity/reactive-controller.js';

class MasUserPicker extends LitElement {
    static properties = {
        currentUser: { type: Object },
        label: { type: String },
        multiple: { type: Boolean },
        search: { type: String },
        selectedUsers: { type: Object },
        users: { type: Object },
        open: { type: Boolean, state: true },
        pendingSelection: { type: Object, state: true },
        quiet: { type: Boolean },
    };

    reactiveController = new ReactiveController(this, []);

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
        this.multiple = false;
        this.users = null;
        this.currentUser = null;
        this.selectedUsers = null;
        this.open = false;
        this.pendingSelection = new Set();
        this.quiet = true;
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('open') && this.open) {
            this.pendingSelection = new Set(this.selectedUsers.value.map((user) => user.userPrincipalName));
        }
    }

    updated(changedProperties) {
        const stores = ['users', 'currentUser', 'selectedUsers'];
        if (stores.some((store) => changedProperties.has(store))) {
            this.reactiveController.updateStores([this.users, this.currentUser, this.selectedUsers]);
        }
    }

    get filteredUsers() {
        return [...this.users.value]
            .sort((a, b) => {
                // If current user matches, put them first
                if (a.userPrincipalName === this.currentUser.value.email) return -1;
                if (b.userPrincipalName === this.currentUser.value.email) return 1;
                if (this.selectedUsers.value.some((selected) => selected.userPrincipalName === a.userPrincipalName)) return -1;
                if (this.selectedUsers.value.some((selected) => selected.userPrincipalName === b.userPrincipalName)) return 1;
                return a.displayName.localeCompare(b.displayName);
            })
            .filter((user) => user.displayName.toLowerCase().includes(this.search.toLowerCase()));
    }

    get selectedText() {
        const count = this.pendingSelection.size;
        if (count === 0) return 'No users selected';
        if (count === 1) return '1 user selected';
        return `${count} users selected`;
    }

    resetSelection() {
        this.pendingSelection = new Set();
    }

    handleSearchKeyDown(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.updateComplete.then(() => {
                const menuItems = this.shadowRoot.querySelectorAll('sp-menu-item');
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

    async applySelection() {
        this.search = '';
        const newSelection = this.users.value.filter((user) => this.pendingSelection.has(user.userPrincipalName));

        this.selectedUsers.set([]);
        await this.updateComplete;
        this.selectedUsers.set(newSelection);

        // Close the popover
        const overlayTrigger = this.shadowRoot.querySelector('overlay-trigger');
        if (overlayTrigger) {
            overlayTrigger.open = undefined; // Setting 'open' to undefined closes it
        }
    }

    toggleUser(e, userPrincipalName) {
        e.stopPropagation();
        const pendingSelection = new Set(this.pendingSelection);
        if (pendingSelection.has(userPrincipalName)) pendingSelection.delete(userPrincipalName);
        else pendingSelection.add(userPrincipalName);
        this.pendingSelection = pendingSelection;
    }

    get popoverContent() {
        if (!this.open) return nothing;
        return html`
            <sp-search
                placeholder="Search Users"
                .value="${this.search}"
                @input="${this.handleSearchInput}"
                @keydown="${this.handleSearchKeyDown}"
                @change="${this.handleSearchChange}"
            ></sp-search>

            <sp-menu @keydown="${this.handleMenuKeyDown}">
                ${repeat(
                    this.filteredUsers,
                    (user) => user.userPrincipalName,
                    (user) => html`
                        <sp-menu-item @click="${(e) => this.toggleUser(e, user.userPrincipalName)}">
                            <sp-checkbox
                                .checked=${this.pendingSelection.has(user.userPrincipalName)}
                                value="${user.userPrincipalName}"
                            >
                                ${user.displayName}
                            </sp-checkbox>
                        </sp-menu-item>
                    `,
                )}
            </sp-menu>
            <div id="footer">
                <span>${this.selectedText}</span>
                <sp-button size="s" @click=${this.resetSelection} variant="secondary" treatment="outline"> Reset </sp-button>
                <sp-button size="s" @click=${this.applySelection}> Apply </sp-button>
            </div>
        `;
    }

    render() {
        if (!this.users?.value) return nothing;
        return html`
            <overlay-trigger placement="bottom" @sp-opened=${() => (this.open = true)} @sp-closed=${() => (this.open = false)}>
                <sp-action-button slot="trigger" dir="rtl" ?quiet=${this.quiet}>
                    ${this.label}
                    <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
                </sp-action-button>

                <sp-popover slot="click-content"> ${this.popoverContent} </sp-popover>
            </overlay-trigger>
        `;
    }

    handleSearchInput(e) {
        this.search = e.target.value;
    }

    handleSearchChange(e) {
        e.stopPropagation();
    }
}

customElements.define('mas-user-picker', MasUserPicker);
