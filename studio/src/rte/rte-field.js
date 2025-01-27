import { LitElement, html, nothing, css } from 'lit';
import { EditorState, NodeSelection } from 'prosemirror-state';
import { Schema, DOMParser, DOMSerializer } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';
import { schema } from 'prosemirror-schema-basic';
import { baseKeymap, toggleMark } from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';
import {
    openOfferSelectorTool,
    attributeFilter,
    closeOfferSelectorTool,
} from './ost.js';

import prosemirrorStyles from './prosemirror.css.js';
import { EVENT_OST_SELECT } from '../constants.js';
import throttle from '../utils/throttle.js';

const CUSTOM_ELEMENT_CHECKOUT_LINK = 'checkout-link';
const CUSTOM_ELEMENT_INLINE_PRICE = 'inline-price';

// Function to check if a node is a checkout link
const isNodeCheckoutLink = (node) => {
    if (!node) return false;
    return node.type.name === 'link' && node.attrs['data-wcs-osi'] !== null;
};

class LinkNodeView {
    constructor(node, view, getPos) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;

        this.dom = document.createElement('a');
        this.dom.tabIndex = -1;

        for (const [key, value] of Object.entries(node.attrs)) {
            if (value !== null) {
                this.dom.setAttribute(key, value);
            }
        }

        this.dom.textContent = this.node.textContent || '';

        this.dom.addEventListener('click', (e) => e.preventDefault());
    }

    update(node) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.node = node;

        // Update attributes (excluding 'text')
        for (const [key, value] of Object.entries(node.attrs)) {
            if (value !== null) {
                this.dom.setAttribute(key, value);
            }
        }

        // Update text content
        this.dom.textContent = this.node.textContent || '';

        return true;
    }

    selectNode() {
        this.dom.classList.add('ProseMirror-selectednode');
    }

    deselectNode() {
        this.dom.classList.remove('ProseMirror-selectednode');
    }
}

let ostRteFieldSource;

class RteField extends LitElement {
    static properties = {
        hasFocus: { type: Boolean, attribute: 'focused', reflect: true },
        inline: { type: Boolean, attribute: 'inline' },
        link: { type: Boolean, attribute: 'link' },
        isLinkSelected: { type: Boolean, state: true },
        priceSelected: { type: Boolean, state: true },
        readOnly: { type: Boolean, attribute: 'readonly' },
        showLinkEditor: { type: Boolean, state: true },
        defaultLinkStyle: { type: String, attribute: 'default-link-style' },
        maxLength: { type: Number, attribute: 'max-length' },
        length: { type: Number, state: true },
    };

    static get styles() {
        return [
            css`
                :host {
                    display: flex;
                    gap: 8px;
                    flex-direction: column;
                    font-size: var(--spectrum-font-size-200);
                }

                :host([focused]) #editor {
                    outline: 2px solid;
                    outline-color: rgb(20, 122, 243);
                    outline-offset: 2px;
                }

                p {
                    margin: 0;
                }

                #editor {
                    padding: 8px 4px 4px 4px;
                    min-height: 36px;
                    flex: 1;
                    color: var(--spectrum-global-color-gray-800);
                    background-color: var(--spectrum-global-color-gray-50);
                    border: 1px solid rgb(144, 144, 144);
                    border-radius: 4px;
                }

                .exceeded {
                    color: var(--spectrum-global-color-red-700);
                }

                rte-link-editor {
                    display: contents;
                }

                a {
                    box-sizing: border-box;
                    display: inline-flex;
                    align-content: center;
                }

                .price-unit-type:before {
                    content: ' ';
                }

                a.accent,
                a.primary-outline,
                a.secondary,
                a.secondary-outline {
                    height: 32px;
                    text-decoration: none;
                    padding: 0 14px;
                    border-radius: 16px;
                }

                a.accent {
                    background-color: var(--spectrum-global-color-blue-500);
                    color: var(--spectrum-global-color-gray-50);
                }

                a.primary-outline {
                    background-color: initial;
                    border: 2px solid var(--spectrum-global-color-gray-900);
                    color: var(--spectrum-global-color-gray-900);
                }

                a.secondary {
                    color: var(--spectrum-global-color-gray-900);
                    background-color: var(--spectrum-global-color-gray-200);
                }

                a.secondary-outline {
                    background-color: initial;
                    border: 2px solid var(--spectrum-global-color-gray-300);
                    color: var(--spectrum-global-color-gray-900);
                }

                a.primary-link,
                a.secondary-link {
                    height: initial;
                    padding: 0 4px;
                }

                a.primary-link {
                    background-color: initial;
                    color: var(--spectrum-blue-900);
                }

                a.secondary-link {
                    border: none;
                    color: var(--spectrum-gray-800);
                }

                .ProseMirror span[is='inline-price'],
                .ProseMirror a {
                    cursor: default;
                    display: inline-block;
                    vertical-align: baseline;
                    white-space: nowrap;
                    margin: 0 1px;
                }

                .price.price-strikethrough {
                    text-decoration: line-through;
                }

                div.ProseMirror-focused
                    span[is='inline-price'].ProseMirror-selectednode,
                div.ProseMirror-focused a.ProseMirror-selectednode,
                div.ProseMirror-focused a.ProseMirror-selectednode {
                    outline: 2px dashed var(--spectrum-global-color-blue-500);
                    outline-offset: 2px;
                    border-radius: 16px;
                }
            `,
            prosemirrorStyles,
        ];
    }

    #boundHandlers;
    #editorSchema;
    editorView;
    value = null;
    #serializer;

    constructor() {
        super();
        this.readOnly = false;
        this.isLinkSelected = false;
        this.priceSelected = false;
        this.showLinkEditor = false;
        this.inline = false;
        this.link = false;
        this.maxLength = 70;
        this.length = 0;
        this.#boundHandlers = {
            escKey: this.#handleEscKey.bind(this),
            ostEvent: this.#handleOstEvent.bind(this),
            linkSave: this.#handleLinkSave.bind(this),
            focusout: this.#handleFocusout.bind(this),
            focus: this.#handleFocus.bind(this),
            doubleClickOn: this.#handleDoubleClickOn.bind(this),
            updateLength: throttle(this.#updateLength.bind(this), 100),
        };
    }

    firstUpdated() {
        this.#initEditorSchema();
        this.#initializeEditor();
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this.#boundHandlers.escKey, {
            capture: true,
        });
        document.addEventListener(
            EVENT_OST_SELECT,
            this.#boundHandlers.ostEvent,
        );
        this.updateLengthInterval = setInterval(
            this.#boundHandlers.updateLength,
            1000,
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this.#boundHandlers.escKey, {
            capture: true,
        });
        document.removeEventListener(
            EVENT_OST_SELECT,
            this.#boundHandlers.ostEvent,
        );
        this.editorView?.destroy();
        clearInterval(this.updateLengthInterval);
    }

    #initEditorSchema() {
        let nodes = schema.spec.nodes.addToStart('inlinePrice', {
            group: 'inline',
            inline: true,
            atom: true,
            attrs: {
                is: { default: null },
                class: { default: null },
                'data-display-old-price': { default: null },
                'data-display-per-unit': { default: null },
                'data-display-recurrence': { default: null },
                'data-display-tax': { default: null },
                'data-perpetual': { default: null },
                'data-promotion-code': { default: null },
                'data-tax-exclusive': { default: null },
                'data-template': { default: null },
                'data-wcs-osi': { default: null },
            },
            parseDOM: [
                {
                    tag: `span[is="${CUSTOM_ELEMENT_INLINE_PRICE}"]`,
                    getAttrs: this.#collectDataAttributes,
                },
            ],
            toDOM: this.#createInlinePriceElement.bind(this),
        });

        if (this.link) {
            nodes = nodes.addToStart('link', {
                group: 'inline',
                content: 'text*',
                atom: true,
                inline: true,
                attrs: {
                    class: { default: null },
                    href: { default: '' },
                    'data-checkout-workflow': { default: null },
                    'data-checkout-workflow-step': { default: null },
                    'data-extra-options': { default: null },
                    'data-perpetual': { default: null },
                    'data-promotion-code': { default: null },
                    'data-wcs-osi': { default: null },
                    'data-template': { default: null },
                    title: { default: null },
                    target: { default: null },
                    'data-analytics-id': { default: null },
                },
                parseDOM: [
                    {
                        tag: 'a',
                        getAttrs: (dom) => ({
                            ...this.#collectDataAttributes(dom),
                            text: dom.textContent || '', // Collect text content as an attribute
                        }),
                    },
                ],
                toDOM: this.#createLinkElement.bind(this),
            });
        }

        const marks = schema.spec.marks
            .remove('code')
            .remove('link')
            .append({
                strikethrough: {
                    parseDOM: [{ tag: 's' }],
                    toDOM: () => ['s', 0],
                },
                underline: {
                    parseDOM: [{ tag: 'u' }],
                    toDOM: () => ['u', 0],
                },
            });

        if (this.inline) {
            nodes = nodes.update('doc', { content: 'inline*' });
        }

        this.#editorSchema = new Schema({ nodes, marks });

        this.#serializer = DOMSerializer.fromSchema(this.#editorSchema);
    }

    #createEditorState() {
        let doc;
        if (this.inline) {
            doc = this.#editorSchema.node('doc', null, []);
        } else {
            doc = this.#editorSchema.node('doc', null, [
                this.#editorSchema.node('paragraph', null, []),
            ]);
        }

        const plugins = [
            history(),
            keymap({
                'Mod-b': toggleMark(this.#editorSchema.marks.strong),
                'Mod-i': toggleMark(this.#editorSchema.marks.em),
                'Mod-k': () => this.openLinkEditor(),
                'Mod-s': toggleMark(this.#editorSchema.marks.strikethrough),
                'Mod-u': toggleMark(this.#editorSchema.marks.underline),
                'Mod-z': undo,
                'Mod-y': redo,
                'Shift-Mod-z': redo,
            }),
            keymap(baseKeymap),
        ];

        return EditorState.create({
            schema: this.#editorSchema,
            doc,
            plugins,
        });
    }

    #collectDataAttributes(dom) {
        const attrs = {};
        for (const name of dom.getAttributeNames()) {
            if (attributeFilter(name)) {
                const value = dom.getAttribute(name);
                if (value === null) continue;
                attrs[name] = value;
            }
        }
        return attrs;
    }

    #createInlinePriceElement(node) {
        const element = document.createElement('span', {
            is: CUSTOM_ELEMENT_INLINE_PRICE,
        });
        for (const [key, value] of Object.entries(node.attrs)) {
            if (value !== null) {
                element.setAttribute(key, value);
            }
        }
        return element;
    }

    #createLinkElement(node) {
        const element = document.createElement('a');

        // Set attributes
        for (const [key, value] of Object.entries(node.attrs)) {
            if (value) {
                element.setAttribute(key, value);
            }
        }
        if (!element.title) element.removeAttribute('title');
        // Serialize and append child nodes (content)
        const fragment = this.#serializer.serializeFragment(node.content);
        element.appendChild(fragment);

        element.addEventListener('click', (e) => {
            e.preventDefault();
        });

        return element;
    }

    #initializeEditor() {
        const editorContainer = this.shadowRoot.getElementById('editor');
        this.editorView = new EditorView(editorContainer, {
            state: this.#createEditorState(),
            editable: () => !this.readOnly,
            dispatchTransaction: this.#handleTransaction.bind(this),
            handleDOMEvents: {
                focusout: this.#boundHandlers.focusout,
                focus: this.#boundHandlers.focus,
            },
            handleDoubleClickOn: this.#boundHandlers.doubleClickOn,
            nodeViews: {
                link: (node, view, getPos) =>
                    new LinkNodeView(node, view, getPos),
            },
        });

        try {
            const html = this.innerHTML.trim();
            this.innerHTML = '';
            const container = document.createElement('div');
            container.innerHTML = html;
            // Simplified DOM manipulation
            container.querySelectorAll('div').forEach((div) => {
                div.replaceWith(...div.childNodes);
            });
            container.querySelectorAll('strong > a').forEach((a) => {
                a.parentElement.replaceWith(a);
            });
            container.querySelectorAll('a').forEach((a) => {
                if (a.dataset.wcsOsi) {
                    a.setAttribute('is', CUSTOM_ELEMENT_CHECKOUT_LINK);
                }
            });
            const parser = DOMParser.fromSchema(this.#editorSchema);
            const doc = parser.parse(container);
            const tr = this.editorView.state.tr.replaceWith(
                0,
                this.editorView.state.doc.content.size,
                doc.content,
            );
            this.editorView.dispatch(tr);
        } catch (error) {
            console.error('Error setting editor value:', error);
        }
    }

    selectLink(pos) {
        const { state } = this.editorView;
        const resolvedPos = state.doc.resolve(pos);
        const selection = NodeSelection.create(state.doc, resolvedPos.pos);
        const tr = state.tr.setSelection(selection);
        this.editorView.dispatch(tr);
    }

    #handleTransaction(transaction) {
        try {
            const oldState = this.editorView.state;
            const newState = oldState.apply(transaction);
            if (!newState) return;

            this.#updateSelection(newState);
            this.editorView.updateState(newState);

            if (newState.doc) {
                this.#boundHandlers.updateLength();
                const value = this.#serializeContent(newState);
                // skip change event during initialization
                const isFirstChange = this.value === null;
                if (value !== this.value) {
                    this.value = value;
                    if (isFirstChange) return;
                    this.dispatchEvent(
                        new CustomEvent('change', {
                            bubbles: true,
                            composed: true,
                        }),
                    );
                }
            }
        } catch (error) {
            console.error('Error handling transaction:', error);
        }
    }

    #serializeContent(state) {
        try {
            if (!state?.doc?.content) return '';
            const fragment = this.#serializer.serializeFragment(
                state.doc.content,
            );
            const container = document.createElement('div');
            container.appendChild(fragment);
            return container.innerHTML;
        } catch (error) {
            console.warn('Error serializing content:', error);
            return '';
        }
    }

    #getLinkAttrs() {
        const { state } = this.editorView;
        const { selection } = state;

        const isCheckoutLink = isNodeCheckoutLink(selection.node);

        let checkoutParameters = undefined;
        if (isCheckoutLink) {
            try {
                checkoutParameters = new URLSearchParams(
                    JSON.parse(
                        selection.node.attrs['data-extra-options'] ?? '{}',
                    ),
                ).toString();
            } catch (error) {
                console.error('Error parsing checkout parameters:', error);
            }
        }

        if (selection.node?.type.name === 'link') {
            return {
                href: selection.node.attrs.href,
                title: selection.node.attrs.title || '',
                text: selection.node.textContent || '',
                target: selection.node.attrs.target || '_self',
                variant: selection.node.attrs.class || '',
                analyticsId: selection.node.attrs['data-analytics-id'] || '',
                checkoutParameters,
            };
        }

        if (!selection.empty) {
            return {
                href: '',
                title: '',
                text: state.doc.textBetween(selection.from, selection.to),
                target: '_self',
                variant: this.defaultLinkStyle,
                analyticsId: '',
                checkoutParameters,
            };
        }

        return {
            href: '',
            title: '',
            text: '',
            target: '_self',
            variant: this.defaultLinkStyle,
            analyticsId: '',
            checkoutParameters,
        };
    }

    #handleLinkSave(event) {
        const { href, text, title, target, variant, analyticsId } =
            event.detail;

        let { checkoutParameters } = event.detail;
        const { state, dispatch } = this.editorView;
        const { selection } = state;

        let tr = state.tr;
        const linkNodeType = state.schema.nodes.link;

        if (checkoutParameters) {
            try {
                checkoutParameters = JSON.stringify(
                    Object.fromEntries(
                        new URLSearchParams(checkoutParameters).entries(),
                    ),
                );
            } catch (error) {
                console.error('Error parsing checkout parameters:', error);
            }
        }

        const linkAttrs = {
            href,
            title,
            target: target || '_self',
            class: variant || 'primary-outline',
            tabIndex: '0',
            'data-extra-options': checkoutParameters || null,
            'data-analytics-id': analyticsId || null,
        };

        const content = state.schema.text(text || selection.node.textContent);
        if (selection.node?.type.name === 'link') {
            const mergedAttributes = { ...selection.node.attrs, ...linkAttrs };
            const updatedNode = linkNodeType.create(mergedAttributes, content);
            tr = tr.replaceWith(selection.from, selection.to, updatedNode);
        } else {
            const linkNode = linkNodeType.create(linkAttrs, content);
            tr = selection.empty
                ? tr.insert(selection.from, linkNode)
                : tr.replaceWith(selection.from, selection.to, linkNode);
        }

        dispatch(tr);
        this.showLinkEditor = false;
    }

    #handleEscKey(event) {
        if (!this.showLinkEditor) return;
        // Handle ESC key at the RteField level
        if (event.key === 'Escape') {
            event.stopPropagation(); // Stop propagation here
            if (this.showLinkEditor) {
                this.showLinkEditor = false;
                this.requestUpdate();
            }
            closeOfferSelectorTool();
        }
    }

    #handleOstEvent({ detail: attributes }) {
        if (ostRteFieldSource !== this) return;

        const { state, dispatch } = this.editorView;
        const { selection } = state;
        const nodeType =
            attributes.is === CUSTOM_ELEMENT_INLINE_PRICE
                ? state.schema.nodes.inlinePrice
                : state.schema.nodes.link; // Fixed to use 'link' node type

        const mergedAttributes = {
            class: selection.node?.attrs.class,
            ...attributes,
        };

        const content =
            attributes.is === CUSTOM_ELEMENT_CHECKOUT_LINK && attributes.text
                ? state.schema.text(attributes.text)
                : null;

        const node = nodeType.create(
            mergedAttributes,
            content,
            selection.node?.marks,
        );
        const tr = selection.empty
            ? state.tr.insert(selection.from, node)
            : state.tr.replaceWith(selection.from, selection.to, node);

        dispatch(tr);
        this.showOfferSelector = false;
        closeOfferSelectorTool();
    }

    #handleToolbarAction(markType) {
        return () => {
            const { state, dispatch } = this.editorView;
            const mark = this.#editorSchema.marks[markType];
            if (mark) {
                toggleMark(mark)(state, dispatch);
            }
        };
    }

    #updateSelection(state) {
        const { selection } = state;
        this.isLinkSelected =
            selection.node?.type.name === 'link' &&
            !selection.node.attrs['data-wcs-osi'];
    }

    #updateLength() {
        this.length = this.editorView.dom.innerText.length;
    }

    async openLinkEditor() {
        const attrs = this.#getLinkAttrs();
        this.showLinkEditor = true;
        await this.updateComplete;
        Object.assign(this.linkEditorElement, { ...attrs, open: true });
    }

    handleOpenOfferSelector(event, element) {
        ostRteFieldSource = this;
        this.showOfferSelector = true;
        openOfferSelectorTool(element);
    }

    get #linkEditorButton() {
        if (!this.link) return nothing;
        return html`
            <sp-action-button
                id="linkEditorButton"
                @click=${this.openLinkEditor}
                title="Add Link (Ctrl+K)"
            >
                <sp-icon-link slot="icon"></sp-icon-link>
            </sp-action-button>
        `;
    }

    get linkEditorButtonElement() {
        return this.shadowRoot.querySelector('#linkEditorButton');
    }

    get #unlinkEditorButton() {
        if (!this.isLinkSelected) return nothing;
        return html`
            <sp-action-button
                id="unlinkEditorButton"
                title="Remove Link"
                emphasized
                @click=${this.#removeLink}
            >
                <sp-icon-unlink slot="icon"></sp-icon-unlink>
            </sp-action-button>
        `;
    }

    get unlinkEditorButtonElement() {
        return this.shadowRoot.querySelector('#unlinkEditorButton');
    }

    #removeLink() {
        const { state, dispatch } = this.editorView;
        const { selection } = state;

        if (selection.node?.type.name === 'link') {
            if (isNodeCheckoutLink(selection.node)) return;
            const tr = state.tr.replaceWith(
                selection.from,
                selection.to,
                state.schema.text(selection.node.textContent || ''),
            );
            dispatch(tr);
            return;
        }

        const tr = state.tr;
        state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (node.type.name === 'link' && !isNodeCheckoutLink(node)) {
                tr.replaceWith(
                    pos,
                    pos + node.nodeSize,
                    state.schema.text(node.textContent || ''),
                );
                return false;
            }
        });

        if (tr.docChanged) dispatch(tr);
    }

    #handleFocusout(view, event) {
        this.hasFocus = false;
        this.isLinkSelected = false;
        this.requestUpdate();
    }

    #handleFocus() {
        this.hasFocus = true;
        return false;
    }

    #handleDoubleClickOn(view, pos, node, nodePos, event) {
        const dom = event.target.closest('[data-wcs-osi]');
        if (!dom) return;
        ostRteFieldSource = this;
        this.showOfferSelector = true;
        this.handleOpenOfferSelector(null, dom);
    }

    get linkEditor() {
        if (!this.showLinkEditor) return nothing;
        const attributes = this.editorView?.state?.selection?.node?.attrs;
        return html`<rte-link-editor
            dialog
            .linkAttrs=${attributes}
            @save="${this.#boundHandlers.linkSave}"
        ></rte-link-editor>`;
    }

    get linkEditorElement() {
        return this.shadowRoot.querySelector('rte-link-editor');
    }

    render() {
        const lengthExceeded = this.length > this.maxLength;
        return html`
            <sp-action-group quiet size="m" aria-label="RTE toolbar actions">
                ${this.#formatButtons} ${this.#linkEditorButton}
                ${this.#unlinkEditorButton} ${this.#offerSelectorToolButton}
            </sp-action-group>
            <div id="editor"></div>
            <p id="counter">
                <span class="${lengthExceeded ? 'exceeded' : ''}"
                    >${this.length}</span
                >/${this.maxLength}
            </p>
            ${this.linkEditor}
        `;
    }

    get #offerSelectorToolButton() {
        return html`
            <sp-divider size="s" vertical></sp-divider>
            <sp-action-button
                emphasized
                id="offerSelectorToolButton"
                @click=${this.handleOpenOfferSelector}
                title="Offer Selector Tool"
            >
                <sp-icon-shopping-cart slot="icon"></sp-icon-shopping-cart>
            </sp-action-button>
        `;
    }

    get offerSelectorToolButtonElement() {
        return this.shadowRoot.querySelector('#offerSelectorToolButton');
    }

    get #formatButtons() {
        return html`
            <sp-action-button
                @click=${this.#handleToolbarAction('strong')}
                @mousedown=${(e) => e.preventDefault()}
                title="Bold (Command+B)"
            >
                <sp-icon-tag-bold slot="icon"></sp-icon-tag-bold>
            </sp-action-button>
            <sp-action-button
                @click=${this.#handleToolbarAction('em')}
                @mousedown=${(e) => e.preventDefault()}
                title="Italic (Command+I)"
            >
                <sp-icon-tag-italic slot="icon"></sp-icon-tag-italic>
            </sp-action-button>
            <sp-action-button
                @click=${this.#handleToolbarAction('strikethrough')}
                @mousedown=${(e) => e.preventDefault()}
                title="Strikethrough (Command+S)"
            >
                <sp-icon-text-strikethrough
                    slot="icon"
                ></sp-icon-text-strikethrough>
            </sp-action-button>
            <sp-action-button
                @click=${this.#handleToolbarAction('underline')}
                title="Underline (Command+U)"
                @mousedown=${(e) => e.preventDefault()}
            >
                <sp-icon-underline slot="icon"></sp-icon-underline>
            </sp-action-button>
        `;
    }
}

customElements.define('rte-field', RteField);
