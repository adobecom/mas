import { html, css, LitElement } from 'lit';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';
export class MasNavFolderPicker extends LitElement {
    static properties = {
        disabled: { type: Boolean },
    };

    static styles = css`
        :host {
            --mod-actionbutton-min-width: auto;
            --mod-actionbutton-background-color-default: var(--spectrum-gray-800, #292929);
            --mod-actionbutton-background-color-hover: var(--spectrum-gray-900, #1e1e1e);
            --mod-actionbutton-background-color-down: var(--spectrum-gray-900, #1e1e1e);
            --mod-actionbutton-background-color-focus: var(--spectrum-gray-800, #292929);
            --mod-actionbutton-border-color-default: transparent;
            --mod-actionbutton-border-color-hover: transparent;
            --mod-actionbutton-border-color-down: transparent;
            --mod-actionbutton-border-color-focus: transparent;
            --mod-actionbutton-content-color-default: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-content-color-hover: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-content-color-down: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-content-color-focus: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-border-radius: 16px;
            --spectrum-actionbutton-height: 32px;
            --spectrum-actionbutton-min-width: auto;
            /* Figma 15382:308970 — 12px outer padding + 6px icon-to-label gap.
               Spectrum computes its internal gap as
               text-to-visual + edge-to-text − edge-to-visual-only,
               so edge-to-text and edge-to-visual-only must be equal for the
               gap to reduce to exactly text-to-visual (6px). */
            /* Padding/gap tokens applied via JS on the inner sp-action-button
               (see #applyPillTokens) — CSS inheritance can't override sp-action-button's
               own :host([size=m]) declarations for these tokens. */
        }

        .folder-picker-wrapper {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        :host([disabled]) sp-action-menu {
            cursor: not-allowed;
            pointer-events: none;
            opacity: 0.4;
            filter: none;
            color: var(--spectrum-gray-900, #1e1e1e);
        }

        :host([disabled]) sp-action-menu [slot='icon'] {
            color: var(--spectrum-gray-900, #1e1e1e);
            opacity: 0.4;
        }

        :host([disabled]) .folder-label {
            color: var(--spectrum-gray-900, #1e1e1e) !important;
        }

        :host([disabled]) {
            --mod-actionbutton-content-color-disabled: var(--spectrum-gray-900, #1e1e1e);
            --spectrum-actionbutton-content-color-disabled: var(--spectrum-gray-900, #1e1e1e);
        }

        :host([disabled]) sp-icon-chevron-down {
            color: var(--spectrum-gray-900, #1e1e1e) !important;
        }

        .icon {
            flex-shrink: 0;
            display: none;
        }

        sp-action-menu [slot='icon'] {
            /* order:2 puts the chevron after the label. Spacing is handled
               by Spectrum's text-to-visual token (6px on :host) — no
               margin-left:auto, which would push the chevron to the far
               right and leave a 12px-wide gap visible inside the pill. */
            order: 2;
            color: var(--spectrum-gray-50, #ffffff);
        }

        sp-menu-item[selected] {
            font-weight: bold;
        }

        /* Popover container per Figma 22245:321219 — white app-frame/elevated
           bg, 10px corner radius, 8px inner padding, 3-layer elevated shadow,
           transparent 1px border to preserve the rounded corner anti-alias. */
        sp-popover,
        sp-action-menu sp-popover {
            --mod-popover-background-color: var(--alias-background-app-frame-elevated, #ffffff);
            --mod-popover-corner-radius: 10px;
            --mod-popover-content-area-spacing-vertical: 8px;
            background-color: var(--alias-background-app-frame-elevated, #ffffff);
            border: 1px solid transparent;
            border-radius: 10px;
            padding: 8px;
            box-shadow:
                0 0 2px rgba(0, 0, 0, 0.12),
                0 2px 6px rgba(0, 0, 0, 0.04),
                0 4px 12px rgba(0, 0, 0, 0.08);
        }

        sp-menu {
            padding: 0 !important;
            gap: 4px;
        }

        /* Menu item per Figma — 32px height, 12px symmetric padding, 8px
           corner radius, Component/M/Medium text. The default 32px left
           padding reserved for a checkmark column is not needed here. */
        sp-menu-item {
            --mod-menu-item-label-inline-edge-to-content: 12px;
            --mod-menu-item-min-height: 32px;
            --mod-menu-item-top-edge-to-text: 7px;
            --mod-menu-item-bottom-edge-to-text: 7px;
            --mod-menu-item-label-font-size: 14px;
            --mod-menu-item-label-line-height: 18px;
            --mod-menu-item-label-content-color-default: var(--alias-content-neutral-default, #292929);
            padding-inline-start: 12px !important;
            padding-inline-end: 12px !important;
            padding-block-start: 7px !important;
            padding-block-end: 7px !important;
            border-radius: 8px;
            font-weight: 500;
            margin: 0 !important;
        }
        sp-menu-item + sp-menu-item {
            margin-top: 4px !important;
        }

        /* Component/M/Bold per Figma — Spectrum tokens for size 100. */
        .folder-label {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--spectrum-gray-50, #ffffff);
            font-family: var(--spectrum-sans-font-family-stack, 'Adobe Clean', sans-serif);
            font-size: var(--spectrum-font-size-100, 14px);
            line-height: var(--spectrum-line-height-100, 18px);
            font-weight: var(--spectrum-bold-font-weight, 700);
            letter-spacing: var(--spectrum-letter-spacing, 0);
        }
    `;

    foldersLoaded = new StoreController(this, Store.folders.loaded);
    folders = new StoreController(this, Store.folders.data);
    search = new StoreController(this, Store.search);

    handleSelection(selectedValue) {
        Store.search.set((prev) => ({ ...prev, path: selectedValue }));
        Store.fragments.list.data.set([]);
    }

    formatFolderName(folder) {
        return folder?.toUpperCase() ?? folder;
    }

    // Adopt a stylesheet into sp-action-menu's shadow root so both the
    // inner sp-action-button (the SANDBOX pill) and the sp-popover (its
    // dropdown) are styled BEFORE either first paints. Setting inline
    // styles via .style.setProperty(...) after updateComplete fired too
    // late and produced a visible "default → custom" flash on mount.
    async firstUpdated() {
        await this.updateComplete;
        const actionMenu = this.shadowRoot.querySelector('sp-action-menu');
        if (!actionMenu) return;
        await actionMenu.updateComplete;
        this.#adoptShadowStyles(actionMenu);
    }

    #adoptShadowStyles(actionMenu) {
        if (!actionMenu.shadowRoot || actionMenu.dataset.shadowPatched) return;
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            sp-action-button {
                --spectrum-actionbutton-edge-to-text: 12px;
                --spectrum-actionbutton-edge-to-visual: 12px;
                --spectrum-actionbutton-edge-to-visual-only: 12px;
                --spectrum-actionbutton-text-to-visual: 6px;
            }
            sp-popover {
                padding: 8px !important;
                border-radius: 10px !important;
                border: 1px solid transparent !important;
                background-color: #ffffff !important;
                box-shadow:
                    0 0 2px rgba(0, 0, 0, 0.12),
                    0 2px 6px rgba(0, 0, 0, 0.04),
                    0 4px 12px rgba(0, 0, 0, 0.08) !important;
                min-width: auto !important;
                width: fit-content !important;
            }
        `);
        actionMenu.shadowRoot.adoptedStyleSheets = [...actionMenu.shadowRoot.adoptedStyleSheets, sheet];
        actionMenu.dataset.shadowPatched = 'true';
    }

    render() {
        const options = this.folders.value.map((folder) => ({
            value: folder.toLowerCase(),
            label: this.formatFolderName(folder),
        }));
        const currentFolder = options.find((option) => option.value === this.search.value.path);

        return html`
            <div class="folder-picker-wrapper">
                <sp-action-menu size="m" value=${this.search.value.path} ?disabled=${this.disabled}>
                    <sp-icon-chevron-down dir="ltr" class="chevron" slot="icon"></sp-icon-chevron-down>
                    <span slot="label" class="folder-label">
                        <svg
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            x="0"
                            y="0"
                            viewBox="0 0 30 26"
                            width="18px"
                            xml:space="preserve"
                            role="img"
                            aria-label="Adobe"
                            class="icon"
                        >
                            <path fill="#292929" d="M19 0h11v26zM11.1 0H0v26zM15 9.6L22.1 26h-4.6l-2.1-5.2h-5.2z"></path>
                        </svg>
                        <span>${currentFolder?.label}</span>
                    </span>
                    <sp-menu size="m" class="folder-picker-menu">
                        ${options.map(({ value, label }) => {
                            return html`
                                <sp-menu-item
                                    .value=${value}
                                    ?selected=${this.search.value.path === value}
                                    @click=${() => this.handleSelection(value)}
                                >
                                    ${label}
                                </sp-menu-item>
                            `;
                        })}
                    </sp-menu>
                </sp-action-menu>
            </div>
        `;
    }
}

customElements.define('mas-nav-folder-picker', MasNavFolderPicker);
