const SELECTOR_DATA_WCS_OSI = '[data-wcs-osi]';

export class RteEditor extends HTMLElement {
    editor = null;
    savedBookmark = null;

    connectedCallback() {
        this.addEventListener(
            'editor-action-click',
            this.handleEditorActionClick,
        );
        window.tinymce.init({
            target: this,
            toolbar: 'bold italic underline | link openlink unlink | ost',
            plugins: 'link',
            license_key: 'gpl',
            promotion: false,
            branding: false,
            extended_valid_elements: 'a[is|href|class],span[is|class]',
            content_style:
                '.price-strikethrough { text-decoration: line-through;}',
            setup: (editor) => {
                this.editor = editor;

                editor.on('blur', async (e) => {
                    this.savedBookmark = editor.selection.getBookmark(2);
                    // clean-up empty paragraphs
                    [...editor.contentDocument.querySelectorAll('p')].forEach(
                        (p) => {
                            if (p.innerText.trim() === '') p.remove();
                        },
                    );

                    // cleanup mce data attributes
                    [...editor.contentDocument.querySelectorAll('a')].forEach(
                        (a) => {
                            Object.keys(a.dataset).forEach((key) => {
                                if (/mce/.test(key)) {
                                    delete a.dataset[key];
                                }
                            });
                        },
                    );

                    let elements = [
                        ...editor.contentDocument.querySelectorAll(
                            SELECTOR_DATA_WCS_OSI,
                        ),
                    ];

                    console.log('elements', elements);
                    elements.forEach((el) => {
                        // repair merch links if is attribute is missing
                        if (el.dataset.wcsOsi) {
                            if (el.tagName === 'A') {
                                el.setAttribute('is', 'checkout-link');
                            } else if (el.tagName === 'SPAN') {
                                el.setAttribute('is', 'inline-price');
                            }
                        }
                    });
                    editor.contentDocument.body.innerHTML = `${editor.contentDocument.body.innerHTML}`;

                    elements = [
                        ...editor.contentDocument.querySelectorAll(
                            SELECTOR_DATA_WCS_OSI,
                        ),
                    ];
                    // clean-up merch links
                    elements.forEach((el) => {
                        if (el.isInlinePrice) {
                            el.innerHTML = '';
                        }
                        if (el.isCheckoutLink) {
                            el.setAttribute('href', '');
                        }
                        el.removeAttribute('class');
                        el.removeAttribute('contenteditable');
                    });

                    removeComments(editor.contentDocument.body);
                    const value = editor.contentDocument.body.innerHTML;
                    elements.forEach((el) => {
                        el.setAttribute('contenteditable', 'false');
                        el.render?.();
                    });
                    const changeEvent = new CustomEvent('blur', {
                        bubbles: true,
                        composed: true,
                        detail: { value },
                    });
                    this.dispatchEvent(changeEvent);
                });

                // load mas in the RTE iframes
                editor.on('init', (e) => {
                    const masMinSource =
                        document.querySelector('script[src$="mas.js"]')?.src ??
                        document.getElementById('mas-src').content;
                    if (!masMinSource) return;
                    const script =
                        editor.contentDocument.createElement('script');
                    script.src = masMinSource;
                    //TODO handle locale.
                    script.setAttribute('type', 'module');
                    editor.contentDocument.head.appendChild(script);
                    const masCommerceService =
                        editor.contentDocument.createElement(
                            'mas-commerce-service',
                        );
                    editor.contentDocument.head.appendChild(masCommerceService);
                    // TODO: remove this once pandora is removed from mas.
                    const pandoraScript =
                        editor.contentDocument.createElement('script');
                    pandoraScript.innerHTML = 'window.process = { env: {} };';
                    editor.contentDocument.head.appendChild(pandoraScript);
                });

                // make merch links not editable
                editor.on('SetContent', (e) => {
                    [
                        ...editor.contentDocument.querySelectorAll(
                            'a[is],span[is]',
                        ),
                    ].forEach((el) => {
                        el.setAttribute('contenteditable', 'false');
                    });
                });

                // Add custom button
                editor.ui.registry.addIcon(
                    'star-icon',
                    `<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18">
  <title>Star</title>
  <rect id="ToDelete" fill="#ff13dc" opacity="0" width="18" height="18" /><path d="M9.24132.3l2.161,5.715,6.106.289a.255.255,0,0,1,.147.454l-4.77,3.823,1.612,5.9a.255.255,0,0,1-.386.28L9.00232,13.4l-5.11,3.358a.255.255,0,0,1-.386-.28l1.612-5.9-4.77-3.821a.255.255,0,0,1,.147-.457l6.107-.285L8.76332.3a.255.255,0,0,1,.478,0Z" />
</svg>`,
                );

                // Add custom button
                editor.ui.registry.addButton('ost', {
                    icon: 'star-icon',
                    tooltip: 'Open Offer Selector Tool',
                    onAction: () => {
                        const customEvent = new CustomEvent('ost-open', {
                            bubbles: true,
                            composed: true,
                        });
                        this.dispatchEvent(customEvent);
                    },
                });

                // Add double-click event listener
                editor.on('dblclick', (e) => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    let target = e.target.closest(SELECTOR_DATA_WCS_OSI);
                    if (target) {
                        const event = new CustomEvent('ost-open', {
                            bubbles: true,
                            composed: true,
                            detail: { clickedElement: target },
                        });
                        this.dispatchEvent(event);
                    }
                });
            },
        });
    }

    disconnectedCallback() {
        this.removeEventListener(
            'editor-action-click',
            this.handleEditorActionClick,
        );
    }

    appendContent(html, clickedOffer) {
        if (clickedOffer) {
            clickedOffer.remove();
        }
        if (this.editor) {
            if (this.savedBookmark) {
                this.editor.focus();
                this.editor.selection.moveToBookmark(this.savedBookmark);
            }
            this.editor.insertContent(html);
        }
    }
}

function removeComments(element) {
    // Create a TreeWalker to traverse all nodes
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_COMMENT,
        null,
        false,
    );

    // Collect comment nodes
    const commentNodes = [];
    let currentNode;
    while ((currentNode = walker.nextNode())) {
        commentNodes.push(currentNode);
    }

    // Remove collected comment nodes
    commentNodes.forEach((comment) => comment.parentNode.removeChild(comment));
}

customElements.define('rte-editor', RteEditor);
