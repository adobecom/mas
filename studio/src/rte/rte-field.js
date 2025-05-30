import { LitElement, html, nothing, css } from 'lit';
import { EditorState, NodeSelection } from 'prosemirror-state';
import { Schema, DOMParser, DOMSerializer } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';
import { schema } from 'prosemirror-schema-basic';
import {
    addListNodes,
    wrapInList,
    splitListItem,
    liftListItem,
} from 'prosemirror-schema-list';
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

// Function to check if a node is a phone link
const isNodePhoneLink = (node) => {
    if (!node) return false;
    return node.type.name === 'link' && node.attrs.href.startsWith('tel:');
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
            } else {
                this.dom.removeAttribute(key);
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
        styling: { type: Boolean, attribute: 'styling' },
        list: { type: Boolean, attribute: 'list' },
        link: { type: Boolean, attribute: 'link' },
        icon: { type: Boolean, attribute: 'icon' },
        uptLink: { type: Boolean, attribute: 'upt-link' },
        list: { type: Boolean, attribute: 'list' },
        isLinkSelected: { type: Boolean, state: true },
        priceSelected: { type: Boolean, state: true },
        readOnly: { type: Boolean, attribute: 'readonly' },
        showLinkEditor: { type: Boolean, state: true },
        showIconEditor: { type: Boolean, state: true },
        defaultLinkStyle: { type: String, attribute: 'default-link-style' },
        maxLength: { type: Number, attribute: 'max-length' },
        length: { type: Number, state: true },
        hideOfferSelector: { type: Boolean, attribute: 'hide-offer-selector' },
    };

    static get styles() {
        return [
            css`
                :host {
                    --merch-color-green-promo: #2d9d78;
                    --consonant-merch-card-promo-text-height: 14px;
                    --consonant-merch-card-heading-xxxs-font-size: 14px;
                    --consonant-merch-card-heading-xxxs-line-height: 18px;
                    --consonant-merch-card-heading-xxs-font-size: 16px;
                    --consonant-merch-card-heading-xxs-line-height: 20px;
                    --consonant-merch-card-heading-xs-font-size: 18px;
                    --consonant-merch-card-heading-xs-line-height: 22.5px;
                    --consonant-merch-card-heading-s-font-size: 20px;
                    --consonant-merch-card-heading-s-line-height: 25px;
                    --consonant-merch-card-heading-m-font-size: 24px;
                    --consonant-merch-card-heading-m-line-height: 30px;
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

                rte-link-editor,
                rte-icon-editor {
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
                a.primary,
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

                a.primary {
                    background-color: var(--spectrum-global-color-gray-900);
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

                .ProseMirror .icon-button {
                    position: relative;
                    top: 3px;
                }

                .ProseMirror .icon-button:before {
                    display: inline-block;
                    content: '';
                    width: 18px;
                    height: 18px;
                    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18"><defs><style> .fill { fill: %23464646; } </style></defs><title>S Info 18 N</title><rect id="Canvas" fill="%23ff13dc" opacity="0" width="18" height="18" /><path class="fill" d="M9,1a8,8,0,1,0,8,8A8,8,0,0,0,9,1ZM8.85,3.15a1.359,1.359,0,0,1,1.43109,1.28286q.00352.06452.00091.12914A1.332,1.332,0,0,1,8.85,5.9935a1.3525,1.3525,0,0,1-1.432-1.432A1.3585,1.3585,0,0,1,8.72033,3.14907Q8.78516,3.14643,8.85,3.15ZM11,13.5a.5.5,0,0,1-.5.5h-3a.5.5,0,0,1-.5-.5v-1a.5.5,0,0,1,.5-.5H8V9H7.5A.5.5,0,0,1,7,8.5v-1A.5.5,0,0,1,7.5,7h2a.5.5,0,0,1,.5.5V12h.5a.5.5,0,0,1,.5.5Z" /></svg>');
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
                sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }

                div.ProseMirror ul {
                    margin: 0;
                    padding-left: 24px;
                }

                div.ProseMirror span[class^='heading-'] {
                    font-weight: 700;
                    display: block;

                    &.heading-xxxs {
                        font-size: var(
                            --consonant-merch-card-heading-xxxs-font-size
                        );
                        line-height: var(
                            --consonant-merch-card-heading-xxxs-line-height
                        );
                    }

                    &.heading-xxs {
                        font-size: var(
                            --consonant-merch-card-heading-xxs-font-size
                        );
                        line-height: var(
                            --consonant-merch-card-heading-xxs-line-height
                        );
                    }

                    &.heading-xs {
                        font-size: var(
                            --consonant-merch-card-heading-xs-font-size
                        );
                        line-height: var(
                            --consonant-merch-card-heading-xs-line-height
                        );
                    }

                    &.heading-s {
                        font-size: var(
                            --consonant-merch-card-heading-s-font-size
                        );
                        line-height: var(
                            --consonant-merch-card-heading-s-line-height
                        );
                    }

                    &.heading-m {
                        font-size: var(
                            --consonant-merch-card-heading-m-font-size
                        );
                        line-height: var(
                            --consonant-merch-card-heading-m-line-height
                        );
                    }
                }

                div.ProseMirror span.promo-text {
                    display: block;
                    color: var(--merch-color-green-promo);
                    font-size: var(--consonant-merch-card-promo-text-height);
                    font-weight: 700;
                    line-height: var(--consonant-merch-card-promo-text-height);
                    margin: 0;
                    min-height: var(--consonant-merch-card-promo-text-height);
                    padding: 0;

                    & a {
                        color: inherit;
                    }
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
        this.showIconEditor = false;
        this.inline = false;
        this.styling = false;
        this.list = false;
        this.link = false;
        this.uptLink = false;
        this.maxLength = 70;
        this.length = 0;
        this.hideOfferSelector = false;
        this.#boundHandlers = {
            escKey: this.#handleEscKey.bind(this),
            ostEvent: this.#handleOstEvent.bind(this),
            addUptLink: this.#addUptLink.bind(this),
            linkSave: this.#handleLinkSave.bind(this),
            iconSave: this.#handleIconSave.bind(this),
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

    getStylingMark(stylingType) {
        return {
            [stylingType]: {
                attrs: { class: { default: null } },
                group: 'styling',
                parseDOM: [
                    {
                        tag: `span.${stylingType}`,
                        getAttrs: this.#collectDataAttributes,
                    },
                ],
                toDOM: () => ['span', { class: stylingType }, 0],
            },
        };
    }

    #initEditorSchema() {
        let nodes = this.list
            ? addListNodes(schema.spec.nodes, 'paragraph block*', 'block')
            : schema.spec.nodes;

        nodes = nodes.addToStart('inlinePrice', {
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

        if (this.icon) {
            nodes = nodes.addToStart('icon', {
                group: 'inline',
                content: 'text*',
                atom: true,
                inline: true,
                attrs: {
                    class: { default: null },
                    title: { default: null },
                },
                parseDOM: [
                    {
                        tag: '.icon-button',
                        getAttrs: this.#collectDataAttributes,
                    },
                ],
                toDOM: this.#createIconElement.bind(this),
            });
        }

        if (this.link || this.uptLink) {
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
                    'data-modal': { default: null },
                    'data-entitlement': { default: null },
                    'data-upgrade': { default: null },
                },
                // Disallow styling marks inside links (they can still wrap them)
                marks: 'em strong strikethrough underline',
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
                ...(this.styling && {
                    ...this.getStylingMark('heading-xxxs'),
                    ...this.getStylingMark('heading-xxs'),
                    ...this.getStylingMark('heading-xs'),
                    ...this.getStylingMark('heading-s'),
                    ...this.getStylingMark('heading-m'),
                    ...this.getStylingMark('promo-text'),
                }),
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
                ...(this.list && {
                    Enter: splitListItem(this.#editorSchema.nodes.list_item),
                }),
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

    #createIconElement(node) {
        const tooltipText =
            node.content.content[0]?.text.trim() || node.attrs.title;

        const icon = document.createElement('span');
        icon.setAttribute('class', 'icon-button');
        if (tooltipText) {
            icon.setAttribute('title', tooltipText);
        }
        return icon;
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
                    this.value = value === '<p></p>' ? '' : value;
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
        const isPhoneLink = isNodePhoneLink(selection.node);
        let linkType = isPhoneLink ? 'phone' : 'web';

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
                linkType,
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
            const text = state.doc.textBetween(selection.from, selection.to);
            // Check if selected text is a potential phone number
            // NOTE: NOT supposed to be a 'catch-all' phone validator - just a check to see if the selected text is roughly a phone number
            linkType = /^\+?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/.test(
                text,
            )
                ? 'phone'
                : linkType;
            return {
                linkType,
                href: '',
                title: '',
                text,
                target: '_self',
                variant: this.defaultLinkStyle,
                analyticsId: '',
                checkoutParameters,
            };
        }

        return {
            linkType,
            href: '',
            title: '',
            text: '',
            target: '_self',
            variant: this.defaultLinkStyle,
            analyticsId: '',
            checkoutParameters,
        };
    }

    #handleIconSave(event) {
        const { tooltip } = event.detail;
        const { state, dispatch } = this.editorView;
        const { selection } = state;

        const node = state.schema.nodes.icon.create(
            {},
            state.schema.text(tooltip || ' '),
        );
        const tr = state.tr.insert(selection.from, node);
        dispatch(tr);

        this.showIconEditor = false;
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
            const persistedSelectionClasses = ['upt-link'];
            let classValue = selection.node.attrs.class;
            if (linkAttrs.class) {
                let persistedClasses = '';
                for (const persistedClass of persistedSelectionClasses) {
                    if (classValue?.includes(persistedClass)) {
                        persistedClasses += `${persistedClass} `;
                    }
                }
                classValue = `${persistedClasses}${linkAttrs.class}`.trim();
            }
            const mergedAttributes = {
                ...selection.node.attrs,
                ...linkAttrs,
                class: classValue,
            };
            const updatedNode = linkNodeType.create(
                mergedAttributes,
                content,
                selection.node?.marks,
            );
            tr = tr.replaceWith(selection.from, selection.to, updatedNode);
        } else {
            let marks;
            state.doc.nodesBetween(selection.from, selection.to, (node) => {
                if (node.type === state.schema.nodes.text) marks = node.marks;
            });
            const linkNode = linkNodeType.create(linkAttrs, content, marks);
            tr = selection.empty
                ? tr.insert(selection.from, linkNode)
                : tr.replaceWith(selection.from, selection.to, linkNode);
        }

        dispatch(tr);
        this.showLinkEditor = false;
    }

    #handleEscKey(event) {
        if (!this.showLinkEditor && !this.showIconEditor) return;
        // Handle ESC key at the RteField level
        if (event.key === 'Escape') {
            event.stopPropagation(); // Stop propagation here
            if (this.showLinkEditor) {
                this.showLinkEditor = false;
                this.requestUpdate();
            } else if (this.showIconEditor) {
                this.showIconEditor = false;
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

    #handleStylingSelection(event) {
        event.stopPropagation();
        const stylingType = event.target.value;
        this.handleStylingAction(stylingType);
    }

    handleStylingAction(stylingType) {
        let { state, dispatch } = this.editorView;
        const {
            selection: { from, to },
        } = state;
        let markTypeToRemove = null;
        state.doc.nodesBetween(from, to, (node) => {
            const stylingMark = node.marks.find(
                (mark) => mark.type.spec.group === 'styling',
            );
            if (!stylingMark) return;
            if (stylingMark.type.name !== stylingType) {
                markTypeToRemove = stylingMark.type;
            }
        });

        const markTypeToAdd = state.schema.marks[stylingType];
        if (markTypeToRemove) {
            const { tr } = state;
            tr.removeMark(from, to, markTypeToRemove);
            tr.addMark(from, to, markTypeToAdd.create());
            dispatch(tr);
        } else {
            toggleMark(markTypeToAdd)(state, dispatch);
        }
    }

    #handleListAction(listType) {
        return () => {
            const { state, dispatch } = this.editorView;
            let { $from } = state.selection;

            let isInList = false;
            const listItemNode = this.#editorSchema.nodes.list_item;
            for (let level = $from.depth; level >= 0; level--) {
                if ($from.node(level)?.type === listItemNode) {
                    isInList = true;
                    break;
                }
            }
            if (isInList) {
                liftListItem(listItemNode)(state, dispatch);
            } else {
                const listNode = this.#editorSchema.nodes[listType];
                if (listNode) {
                    wrapInList(listNode)(state, dispatch);
                }
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

    #addUptLink() {
        const { state, dispatch } = this.editorView;
        const { selection } = state;

        const nodeType = state.schema.nodes.link;

        const selectionClasses = selection.node?.attrs.class;
        const attributes = {
            class: `upt-link${selectionClasses ? ` ${selectionClasses}` : ''}`,
            href: '#',
            'data-analytics-id': 'see-terms',
        };

        const content = state.schema.text('{{see-terms}}');

        const node = nodeType.create(
            attributes,
            content,
            selection.node?.marks,
        );
        const tr = selection.empty
            ? state.tr.insert(selection.from, node)
            : state.tr.replaceWith(selection.from, selection.to, node);

        dispatch(tr);
    }

    async openLinkEditor() {
        const attrs = this.#getLinkAttrs();
        this.showLinkEditor = true;
        await this.updateComplete;
        Object.assign(this.linkEditorElement, { ...attrs, open: true });
    }

    async openIconEditor() {
        this.showIconEditor = true;
        await this.updateComplete;
        Object.assign(this.iconEditorElement, { open: true });
    }

    handleOpenOfferSelector(event, element) {
        ostRteFieldSource = this;
        this.showOfferSelector = true;
        openOfferSelectorTool(this, element);
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

    get iconEditor() {
        if (!this.showIconEditor) return nothing;
        return html`<rte-icon-editor
            dialog
            @save="${this.#boundHandlers.iconSave}"
        ></rte-icon-editor>`;
    }

    get linkEditorElement() {
        return this.shadowRoot.querySelector('rte-link-editor');
    }

    get iconEditorElement() {
        return this.shadowRoot.querySelector('rte-icon-editor');
    }

    render() {
        const lengthExceeded = this.length > this.maxLength;
        return html`
            <sp-action-group quiet size="m" aria-label="RTE toolbar actions">
                ${this.#formatButtons} ${this.stylingButton}
                ${this.#listButtons} ${this.#linkEditorButton}
                ${this.#unlinkEditorButton} ${this.#offerSelectorToolButton}
                ${this.#iconsButton} ${this.#uptLinkButton}
            </sp-action-group>
            <div id="editor"></div>
            <p id="counter">
                <span class="${lengthExceeded ? 'exceeded' : ''}"
                    >${this.length}</span
                >/${this.maxLength}
            </p>
            ${this.linkEditor} ${this.iconEditor}
        `;
    }

    get #iconsButton() {
        if (!this.icon) return nothing;
        return html`
            <sp-action-button
                emphasized
                id="addIconButton"
                @click=${this.openIconEditor}
                title="Add Icon"
            >
                <sp-icon-info slot="icon"></sp-icon-info>
            </sp-action-button>
        `;
    }

    get #offerSelectorToolButton() {
        if (this.hideOfferSelector) return nothing;
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

    get #uptLinkButton() {
        if (!this.uptLink) return;
        return html`<sp-action-button
            id="uptLinkButton"
            title="Add Universal Promo Terms Link"
            @click=${this.#boundHandlers.addUptLink}
        >
            <sp-icon-link-page slot="icon"></sp-icon-link-page>
        </sp-action-button>`;
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

    get stylingButton() {
        if (!this.styling) return;
        return html`<sp-action-menu
            id="stylingMenu"
            title="Styling"
            @change=${this.#handleStylingSelection}
        >
            <sp-icon-brush slot="icon"></sp-icon-brush>
            <sp-menu-item value="heading-xxxs">Heading XXXS</sp-menu-item>
            <sp-menu-item value="heading-xxs">Heading XXS</sp-menu-item>
            <sp-menu-item value="heading-xs">Heading XS</sp-menu-item>
            <sp-menu-item value="heading-s">Heading S</sp-menu-item>
            <sp-menu-item value="heading-m">Heading M</sp-menu-item>
            <sp-menu-divider></sp-menu-divider>
            <sp-menu-item value="promo-text">Promo text</sp-menu-item>
        </sp-action-menu>`;
    }

    get #listButtons() {
        if (!this.list) return;
        return html`
            <sp-action-button
                @click=${this.#handleListAction('bullet_list')}
                @mousedown=${(e) => e.preventDefault()}
                title="Unordered List"
            >
                <sp-icon-text-bulleted slot="icon"></sp-icon-text-bulleted>
            </sp-action-button>
        `;
    }
}

customElements.define('rte-field', RteField);
