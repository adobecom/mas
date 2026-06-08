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
        /** When true, renders a bordered (non-quiet) trigger so the host can apply Picker-style theming. */
        bordered: { type: Boolean, reflect: true },
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

        /* Filter-mode popover styling — Figma "Popover" spec (Created by). */
        sp-popover.filter-popover {
            min-width: 280px;
            max-height: none;
            border-radius: 10px;
            border: 1px solid transparent;
            background: var(--spectrum-gray-25, #ffffff);
            box-shadow:
                0 0 2px rgba(0, 0, 0, 0.12),
                0 2px 6px rgba(0, 0, 0, 0.04),
                0 4px 12px rgba(0, 0, 0, 0.08);
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        /* Search field — 32px tall pill (16px radius), 2px gray-300 border. */
        sp-popover.filter-popover sp-search {
            margin: 0;
            --mod-search-height: 32px;
            --mod-search-border-radius: 16px;
            --mod-search-border-width: 2px;
            --mod-search-border-color: var(--spectrum-gray-300, #dadada);
        }

        /* Menu — flat list, 4px gap between rows.
           Display the first 8 rows; scroll past that. */
        sp-popover.filter-popover sp-menu {
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
            max-height: 292px;
            height: 292px;
            overflow-y: auto;
            overflow-x: hidden;
        }

        /* Menu items — 32px tall, full row width, 8px radius, centered content,
           8.5px vertical / 12px horizontal padding, 10px gap before label. */
        sp-popover.filter-popover sp-menu-item {
            box-sizing: border-box;
            width: 100%;
            min-height: 32px;
            height: 32px;
            margin: 0;
            display: flex;
            align-items: center;
            border-radius: 8px;
            padding: 8.5px 12px;
            --mod-menuitem-padding: 8.5px 12px;
            --mod-menuitem-padding-inline: 12px;
            --mod-menuitem-padding-block: 8.5px;
            --mod-menuitem-padding-block-start: 8.5px;
            --mod-menuitem-padding-block-end: 8.5px;
            --mod-menuitem-padding-top: 8.5px;
            --mod-menuitem-padding-bottom: 8.5px;
            --mod-menuitem-edge-to-text: 12px;
            --mod-menuitem-height: 32px;
            --mod-menuitem-min-height: 32px;
            --mod-menuitem-label-font-weight: 500;
            --mod-menuitem-border-radius: 8px;
            font-weight: 500;
        }

        /* Inner checkbox — center-align with label, 10px gap. */
        sp-popover.filter-popover sp-menu-item sp-checkbox {
            align-items: center;
            --mod-checkbox-control-to-text-spacing: 10px;
            --mod-checkbox-label-margin-top: 0;
            --mod-checkbox-label-padding-top: 0;
            --mod-checkbox-text-padding-top: 0;
            --mod-checkbox-spacing-block-start: 0;
        }

        sp-popover.filter-popover sp-menu-item sp-checkbox::part(label) {
            margin-top: 0;
            margin-block-start: 0;
            padding-top: 0;
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
    }

    updated(changedProperties) {
        const stores = ['users', 'currentUser', 'selectedUsers'];
        if (stores.some((store) => changedProperties.has(store))) {
            this.reactiveController.updateStores([this.users, this.currentUser, this.selectedUsers]);
        }
        this.#zeroCheckboxLabelMargins();
    }

    // Spectrum sp-checkbox renders an inner <label> with margin-top: 6px to baseline-align
    // multi-line labels with the box. Single-line + center alignment doesn't need it, and
    // CSS variables / ::part don't reach inside in this build — patch the DOM directly.
    async #zeroCheckboxLabelMargins() {
        await this.updateComplete;
        // Wait a microtask for inner sp-checkbox children to finish their own first render.
        await Promise.resolve();
        const checkboxes = this.shadowRoot?.querySelectorAll('sp-popover.filter-popover sp-checkbox');
        checkboxes?.forEach(async (cb) => {
            await cb.updateComplete;
            const label = cb.shadowRoot?.querySelector('label, #label');
            if (!label) return;
            // Keep 10px gap between control and label, zero everything else.
            if (label.style.marginTop !== '0px') label.style.marginTop = '0';
            if (label.style.marginRight !== '0px') label.style.marginRight = '0';
            if (label.style.marginBottom !== '0px') label.style.marginBottom = '0';
            if (label.style.marginLeft !== '10px') label.style.marginLeft = '10px';
        });
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
        const count = this.selectedUsers.value.length;
        if (count === 0) return 'No users selected';
        if (count === 1) return '1 user selected';
        return `${count} users selected`;
    }

    resetSelection() {
        this.shadowRoot.querySelectorAll('sp-checkbox').forEach((cb) => {
            cb.checked = false;
        });
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
        this.requestUpdate();
        await this.updateComplete;
        const checkboxes = this.shadowRoot.querySelectorAll('sp-menu sp-checkbox');
        const selectedUPNs = Array.from(checkboxes)
            .filter((cb) => cb.checked)
            .map((cb) => cb.getAttribute('value'));

        const newSelection = this.users.value.filter((user) => selectedUPNs.includes(user.userPrincipalName));

        this.selectedUsers.set([]);
        await this.updateComplete;
        this.selectedUsers.set(newSelection);

        // Close the popover
        const overlayTrigger = this.shadowRoot.querySelector('overlay-trigger');
        if (overlayTrigger) {
            overlayTrigger.open = undefined; // Setting 'open' to undefined closes it
        }
    }

    handleCheckboxChange(e) {
        const checkbox = e.target;
        checkbox.checked = !checkbox.checked;
        e.stopPropagation();
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
                        <sp-menu-item @click="${this.handleCheckboxChange}">
                            <sp-checkbox
                                .checked=${this.selectedUsers.value.some(
                                    (selected) => selected.userPrincipalName === user.userPrincipalName,
                                )}
                                value="${user.userPrincipalName}"
                            >
                                ${user.displayName}
                            </sp-checkbox>
                        </sp-menu-item>
                    `,
                )}
            </sp-menu>
            ${this.bordered
                ? nothing
                : html`<div id="footer">
                      <span>${this.selectedText}</span>
                      <sp-button size="s" @click=${this.resetSelection} variant="secondary" treatment="outline">
                          Reset
                      </sp-button>
                      <sp-button size="s" @click=${this.applySelection}> Apply </sp-button>
                  </div>`}
        `;
    }

    commitSelection() {
        const checkboxes = this.shadowRoot.querySelectorAll('sp-menu sp-checkbox');
        const selectedUPNs = Array.from(checkboxes)
            .filter((cb) => cb.checked)
            .map((cb) => cb.getAttribute('value'));
        const newSelection = this.users.value.filter((user) => selectedUPNs.includes(user.userPrincipalName));
        this.selectedUsers.set(newSelection);
        this.search = '';
    }

    render() {
        if (!this.users?.value) return nothing;
        const onClosed = () => {
            if (this.bordered) this.commitSelection();
            this.open = false;
        };
        return html`
            <overlay-trigger placement="bottom" @sp-opened=${() => (this.open = true)} @sp-closed=${onClosed}>
                <sp-action-button slot="trigger" dir="rtl" ?quiet=${!this.bordered}>
                    ${this.label}
                    <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
                </sp-action-button>

                <sp-popover slot="click-content" class=${this.bordered ? 'filter-popover' : ''}>
                    ${this.popoverContent}
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
}

customElements.define('mas-user-picker', MasUserPicker);
