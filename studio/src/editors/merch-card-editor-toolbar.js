import { LitElement, html, css } from 'lit';
import Store from '../store.js';
import { MasFetcher } from '../mas-fetcher.js';
import Events from '../events.js';
import { getInEditFragment } from '../storeUtils.js';

class MerchCardEditorToolbar extends LitElement {
    static properties = {
        disabled: { type: Boolean, attribute: true },
        hasChanges: { type: Boolean },
        close: { type: Function },
        discardChanges: { type: Function },
    };

    static styles = css`
        #editor-toolbar {
            display: flex;
            justify-content: end;
            gap: 5px;
        }
    `;

    /** @type {MasFetcher} */
    get fetcher() {
        return document.querySelector('mas-fetcher');
    }

    aemAction(action) {
        return async function () {
            this.disabled = true;
            await action();
            this.disabled = false;
        };
    }

    openFragmentInOdin() {
        const fragment = getInEditFragment();
        window.open(
            `https://experience.adobe.com/?repo=${this.bucket}.adobeaemcloud.com#/@odin02/aem/cf/admin/?appId=aem-cf-admin&q=${fragment?.fragmentName}`,
            '_blank',
        );
    }

    async copyToUse() {
        const code = `<merch-card><aem-fragment fragment="${Store.fragments.inEdit.get()}"></aem-fragment></merch-card>`;
        try {
            await navigator.clipboard.writeText(code);
            Events.showToast.emit({
                variant: 'positive',
                content: 'Code copied to clipboard',
            });
        } catch (error) {
            console.error(`Failed to copy code to clipboard: ${error.message}`);
            Events.showToast.emit({
                variant: 'negative',
                content: 'Failed to copy code to clipboard',
            });
        }
    }

    render() {
        return html`<div id="editor-toolbar">
            <sp-action-group
                aria-label="Fragment actions"
                role="group"
                size="l"
                compact
                emphasized
                quiet
            >
                <sp-action-button
                    label="Save"
                    title="Save changes"
                    value="save"
                    @click="${this.aemAction(this.fetcher.saveFragment)}"
                    ?disabled=${this.disabled}
                >
                    <sp-icon-save-floppy slot="icon"></sp-icon-save-floppy>
                    <sp-tooltip self-managed placement="bottom"
                        >Save changes</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Discard"
                    title="Discard changes"
                    value="discard"
                    @click="${this.discardChanges}"
                    ?disabled=${this.disabled || !this.hasChanges}
                >
                    <sp-icon-undo slot="icon"></sp-icon-undo>
                    <sp-tooltip self-managed placement="bottom"
                        >Discard changes</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Clone"
                    value="clone"
                    @click="${this.aemAction(this.fetcher.copyFragment)}"
                    ?disabled=${this.disabled}
                >
                    <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                    <sp-tooltip self-managed placement="bottom"
                        >Clone</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Publish"
                    value="publish"
                    @click="${this.aemAction(this.fetcher.publishFragment)}"
                    ?disabled=${this.disabled}
                >
                    <sp-icon-publish-check slot="icon"></sp-icon-publish-check>
                    <sp-tooltip self-managed placement="bottom"
                        >Publish</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Unpublish"
                    value="unpublish"
                    @click="${this.aemAction(this.fetcher.unpublishFragment)}"
                    disabled
                >
                    <sp-icon-publish-remove
                        slot="icon"
                    ></sp-icon-publish-remove>
                    <sp-tooltip self-managed placement="bottom"
                        >Unpublish</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Open in Odin"
                    value="open"
                    @click="${this.openFragmentInOdin}"
                    ?disabled=${this.disabled}
                >
                    <sp-icon-open-in slot="icon"></sp-icon-open-in>
                    <sp-tooltip self-managed placement="bottom"
                        >Open in Odin</sp-tooltip
                    >
                </sp-action-button>
                <sp-action-button
                    label="Use"
                    value="use"
                    @click="${this.copyToUse}"
                    ?disabled=${this.disabled}
                >
                    <sp-icon-code slot="icon"></sp-icon-code>
                    <sp-tooltip self-managed placement="bottom">Use</sp-tooltip>
                </sp-action-button>
                <sp-action-button
                    label="Delete fragment"
                    value="delete"
                    @click="${this.aemAction(this.fetcher.deleteFragment)}"
                    ?disabled=${this.disabled}
                >
                    <sp-icon-delete-outline
                        slot="icon"
                    ></sp-icon-delete-outline>
                    <sp-tooltip self-managed placement="bottom"
                        >Delete fragment</sp-tooltip
                    >
                </sp-action-button>
            </sp-action-group>
            <sp-divider
                size="m"
                style="align-self: stretch; height: auto;"
                vertical
            ></sp-divider>
            <sp-action-group size="l" quiet>
                <sp-action-button
                    title="Close"
                    label="Close"
                    value="close"
                    @click="${this.close}"
                >
                    <sp-icon-close-circle slot="icon"></sp-icon-close-circle>
                    <sp-tooltip self-managed placement="bottom"
                        >Close</sp-tooltip
                    >
                </sp-action-button>
            </sp-action-group>
        </div>`;
    }
}

customElements.define('merch-card-editor-toolbar', MerchCardEditorToolbar);
