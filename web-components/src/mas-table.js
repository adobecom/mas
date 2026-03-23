import {
    EVENT_AEM_ERROR,
    EVENT_AEM_LOAD,
    EVENT_MAS_ERROR,
    EVENT_MAS_READY,
    MARK_DURATION_SUFFIX,
    MARK_START_SUFFIX,
    SELECTOR_MAS_ELEMENT,
} from './constants.js';
import { hydrate } from './hydrate.js';
import { TABLE_CSS } from './mas-table.css.js';
import { MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING } from './variants/mini-compare-chart.js';
import { debounce, getService, printMeasure } from './utils.js';

const TAG_NAME = 'mas-table';
const MARK_PREFIX = 'mas-table:';
const LOAD_TIMEOUT = 20000;
const TAB_CHANGE_EVENT = 'milo:tab:changed';
const TABLE_HIGHLIGHT_LOADED_EVENT = 'milo:table:highlight:loaded';
const DESKTOP_SIZE = 900;
const MOBILE_SIZE = 768;
const DEFAULT_LABELS = {
    'toggle-row': 'Toggle row',
    'choose-table-column': 'Choose table column',
};
const CHEVRON_ICON = new URL('./img/chevron-wide-black.svg', import.meta.url)
    .href;
const MINI_COMPARE_CHART_VARIANT = 'mini-compare-chart';
const MINI_COMPARE_CHART_SLOTS = {
    title: 'heading-xs',
    prices: 'heading-m-price',
    description: 'body-m',
    ctas: 'footer',
};

let tableIndex = 0;
let styleText;

function getStyleText() {
    if (styleText) return styleText;
    styleText = [
        `
            :host {
                display: block;
            }

            :host([hidden]) {
                display: none;
            }

            :host([dir="rtl"]) .table .row-heading .col-heading.col.no-rounded,
            :host([dir="rtl"]) .table.merch .col-heading:not(.no-rounded) {
                border-radius: inherit;
            }

            :host([dir="rtl"]) .table:not(.merch) .row .col span.milo-tooltip {
                margin-right: 0;
                margin-left: -4px;
            }

            :host([dir="rtl"]) .table .icon.expand {
                rotate: 90deg;
            }

            :host([dir="rtl"]) .table .col,
            :host([dir="rtl"]) .table.merch .col,
            :host([dir="rtl"]) .table .col:first-child,
            :host([dir="rtl"]) .table .col:last-child:not(.hover),
            :host([dir="rtl"]) .table.merch .col-merch .col-merch-content picture,
            :host([dir="rtl"]) .table .col-heading:not(.left-round):last-child,
            :host([dir="rtl"]) .table .col-heading:nth-child(2):last-child,
            :host([dir="rtl"]) .table .col-heading:nth-child(2),
            :host([dir="rtl"]) .table .col-heading.force-last,
            :host([dir="rtl"]) .table .col-heading.force-last + .col-heading,
            :host([dir="rtl"]) .table .left-round,
            :host([dir="rtl"]) .table .right-round {
                direction: rtl;
            }

            .con-button {
                box-sizing: border-box;
                min-height: 40px;
                padding: 10px 16px;
                border-radius: 999px;
                border: 2px solid transparent;
                font-size: 14px;
                font-weight: 700;
                line-height: 1.2;
                text-decoration: none;
                transition:
                    background-color 140ms ease,
                    border-color 140ms ease,
                    color 140ms ease,
                    transform 140ms ease;
            }

            .con-button:hover {
                transform: translateY(-1px);
            }

            .con-button.blue {
                background: #1473e6;
                color: #fff;
            }

            .con-button.outline {
                border-color: #1473e6;
                color: #1473e6;
                background: transparent;
            }

            .con-button.primary,
            .con-button.secondary {
                background: #2c2c2c;
                color: #fff;
            }

            .filter {
                background-color: transparent;
                background-image: url("${CHEVRON_ICON}");
                color: inherit;
            }

            .filter:focus-visible,
            .point-cursor:focus-visible {
                outline: 2px solid #1473e6;
                outline-offset: 2px;
            }

            .mas-table-empty {
                padding: 20px 0;
            }

            .mas-table-scratch {
                display: none;
            }

            .table .row-highlight .badge-icon {
                width: 18px;
                height: 18px;
                margin-inline-end: 6px;
                vertical-align: text-bottom;
            }
        `,
        TABLE_CSS.replaceAll(
            '../../ui/img/chevron-wide-black.svg',
            CHEVRON_ICON,
        ),
    ].join('\n');
    return styleText;
}

function createElement(tag, attributes = {}, content = null) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
        if (value == null) return;
        element.setAttribute(key, value);
    });
    appendContent(element, content);
    return element;
}

function appendContent(element, content) {
    if (content == null) return;
    if (Array.isArray(content)) {
        content.forEach((item) => appendContent(element, item));
        return;
    }
    if (content instanceof Node) {
        element.append(content);
        return;
    }
    element.append(document.createTextNode(String(content)));
}

function appendHtml(target, html) {
    if (!html) return;
    const template = document.createElement('template');
    template.innerHTML = html;
    target.append(template.content.cloneNode(true));
}

function normalizeFields(fragment) {
    if (!fragment?.fields) return {};
    if (Array.isArray(fragment.fields)) {
        return fragment.fields.reduce((acc, field) => {
            if (!field?.name) return acc;
            acc[field.name] = field.multiple
                ? field.values || []
                : field.values?.[0];
            return acc;
        }, {});
    }
    return fragment.fields;
}

function getStringField(fields, name) {
    const value = fields?.[name];
    if (value == null) return '';
    if (Array.isArray(value)) return String(value[0] ?? '');
    if (typeof value === 'object' && 'value' in value)
        return String(value.value ?? '');
    return String(value);
}

function getArrayField(fields, name) {
    const value = fields?.[name];
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
}

function normalizeHydrateFieldValue(value) {
    if (Array.isArray(value)) {
        return value.map((item) => normalizeHydrateFieldValue(item));
    }
    if (value && typeof value === 'object' && 'value' in value) {
        return normalizeHydrateFieldValue(value.value);
    }
    return value;
}

function normalizeFieldsForHydrate(fragment) {
    const fields = normalizeFields(fragment);
    return Object.fromEntries(
        Object.entries(fields).map(([name, value]) => [
            name,
            normalizeHydrateFieldValue(value),
        ]),
    );
}

function normalizeFragmentMap(references = {}) {
    const map = new Map();
    Object.values(references).forEach((reference) => {
        if (reference?.type !== 'content-fragment' || !reference.value) return;
        const fragment = reference.value;
        const normalized = {
            ...fragment,
            fields: normalizeFields(fragment),
        };
        if (normalized.id) map.set(normalized.id, normalized);
        if (normalized.fields.originalId) {
            map.set(normalized.fields.originalId, normalized);
        }
    });
    return map;
}

function getFragmentValue(fragment, key) {
    const value = fragment?.dictionary?.[key];
    if (typeof value === 'object' && value && 'value' in value)
        return value.value;
    return value;
}

function getLabels(fragment) {
    return {
        'toggle-row':
            getFragmentValue(fragment, 'toggle-row') ||
            DEFAULT_LABELS['toggle-row'],
        'choose-table-column':
            getFragmentValue(fragment, 'choose-table-column') ||
            DEFAULT_LABELS['choose-table-column'],
    };
}

function isMobileLandscape() {
    return (
        window.matchMedia('(orientation: landscape)').matches &&
        window.innerHeight <= MOBILE_SIZE
    );
}

function defineDeviceByScreenSize() {
    const screenWidth = window.innerWidth;
    if (screenWidth >= DESKTOP_SIZE) {
        return 'DESKTOP';
    }
    if (screenWidth <= MOBILE_SIZE) {
        return 'MOBILE';
    }
    return 'TABLET';
}

function isStickyHeader(el) {
    return (
        el.classList.contains('sticky') ||
        (el.classList.contains('sticky-desktop-up') &&
            defineDeviceByScreenSize() === 'DESKTOP') ||
        (el.classList.contains('sticky-tablet-up') &&
            defineDeviceByScreenSize() !== 'MOBILE' &&
            !isMobileLandscape())
    );
}

function decorateButtons(el, size) {
    const buttons = el.querySelectorAll('em a, strong a, p > a strong');
    if (!buttons.length) return;
    const buttonTypeMap = { STRONG: 'blue', EM: 'outline', A: 'blue' };

    buttons.forEach((button) => {
        const parent = button.parentElement;
        let target = button;
        const buttonType = buttonTypeMap[parent.nodeName] || 'outline';
        if (button.nodeName === 'STRONG') {
            target = parent;
        } else {
            parent.insertAdjacentElement('afterend', button);
            parent.remove();
        }
        target.classList.add('con-button', buttonType);
        if (size) target.classList.add(size);
        const customClasses = target.href && [
            ...target.href.matchAll(/#_button-([a-zA-Z-]+)/g),
        ];
        customClasses?.forEach((match) => {
            target.href = target.href.replace(match[0], '');
            if (target.dataset.modalHash) {
                target.setAttribute(
                    'data-modal-hash',
                    target.dataset.modalHash.replace(match[0], ''),
                );
            }
            target.classList.add(match[1]);
        });
        const actionArea = button.closest('p, div');
        if (actionArea) {
            actionArea.classList.add('action-area');
            actionArea.nextElementSibling?.classList.add(
                'supplemental-text',
                'body-xl',
            );
        }
    });
}

function handleHeading(table, headingCols) {
    const isPriceBottom = table.classList.contains('pricing-bottom');
    headingCols.forEach((col, i) => {
        col.classList.add('col-heading');
        if (!col.innerHTML) return;

        const elements = col.children;
        if (!elements.length) {
            col.innerHTML = `<div class="heading-content"><p class="tracking-header">${col.innerHTML}</p></div>`;
        } else {
            let textStartIndex = col.querySelector('.highlight-text') ? 1 : 0;
            let isTrackingSet = false;
            const iconRow = elements[textStartIndex];
            const hasIconTile =
                iconRow?.classList?.contains('header-product-tile') ||
                iconRow?.querySelector(
                    'img, picture, mas-mnemonic, merch-icon',
                );
            if (hasIconTile) {
                textStartIndex += 1;
                if (!table.classList.contains('merch')) {
                    iconRow?.classList.add('header-product-tile');
                }
            }
            if (elements[textStartIndex]) {
                elements[textStartIndex].classList.add('tracking-header');
                isTrackingSet = true;
            }

            const contentElements = [...elements].slice(textStartIndex + 1);
            const buttonPatterns = 'em a, strong a, p > a strong, a.con-button';
            const buttonSource = contentElements.find((element) =>
                element.querySelector(buttonPatterns),
            );
            const isPricingElement = (element) => {
                if (!element) return false;
                if (
                    element.querySelector(
                        '[is="inline-price"], .price, [data-template], .price-integer, .price-strikethrough, .price-alternative',
                    )
                ) {
                    return true;
                }
                const text = element.textContent?.trim() || '';
                return /(?:US?\$|CA\$|A\$|€|£|¥|\/(?:mo|month|Monat))/i.test(
                    text,
                );
            };
            const nonActionElements = contentElements.filter(
                (element) => element !== buttonSource,
            );
            let pricingElem = nonActionElements.find(isPricingElement);
            if (!pricingElem && nonActionElements.length > 1) {
                pricingElem = nonActionElements[nonActionElements.length - 1];
            }
            const bodyElem = nonActionElements.find(
                (element) => element !== pricingElem,
            );

            if (pricingElem) {
                pricingElem.classList.add('pricing');
            }
            if (bodyElem) {
                bodyElem.classList.add('body');
            }

            decorateButtons(col, 'button-xl');
            const buttonsWrapper = createElement('div', {
                class: 'buttons-wrapper',
            });
            col.append(buttonsWrapper);
            const buttons = col.querySelectorAll('.con-button');

            buttons.forEach((button) => {
                const buttonWrapper = button.closest('p');
                if (buttonWrapper) buttonsWrapper.append(buttonWrapper);
            });

            const headingContent = createElement('div', {
                class: 'heading-content',
            });
            const headingButton = createElement('div', {
                class: 'heading-button',
            });

            [...elements].forEach((element) => {
                if (element.classList.contains('pricing') && isPriceBottom) {
                    headingButton.appendChild(element);
                } else {
                    headingContent.appendChild(element);
                }
            });

            headingButton.appendChild(buttonsWrapper);
            col.append(headingContent, headingButton);
            if (!isTrackingSet) {
                const textNode = Array.from(col.childNodes).find(
                    (node) => node.nodeType === Node.TEXT_NODE,
                );
                if (textNode?.textContent?.trim()) {
                    headingContent.append(
                        createElement(
                            'p',
                            { class: 'tracking-header' },
                            textNode.textContent,
                        ),
                    );
                }
                textNode?.remove();
            }
        }

        const trackingHeader = col.querySelector('.tracking-header');
        if (trackingHeader) {
            const trackingHeaderID = `t${tableIndex + 1}-c${i + 1}-header`;
            trackingHeader.setAttribute('id', trackingHeaderID);

            const headerBody = col.querySelector('.body:not(.action-area)');
            headerBody?.setAttribute('id', `${trackingHeaderID}-body`);

            const headerPricing = col.querySelector('.pricing');
            headerPricing?.setAttribute('id', `${trackingHeaderID}-pricing`);

            const describedBy = `${headerBody?.id ?? ''} ${
                headerPricing?.id ?? ''
            }`.trim();
            trackingHeader.setAttribute('aria-describedby', describedBy);
            col.setAttribute('role', 'columnheader');
        }

        col.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
            heading.setAttribute('role', 'paragraph');
        });
    });
}

function handleEqualHeight(table, tag) {
    const element = table.querySelector(tag);
    if (!element) return;
    const height = [];
    const columns = [...element.children];
    columns.forEach(({ children }) => {
        [...children].forEach((row, i) => {
            row.style.height = 'auto';
            const style = window.getComputedStyle(row);
            const actualHeight =
                row.clientHeight -
                parseFloat(style.paddingTop) -
                parseFloat(style.paddingBottom);

            if (!height[i] || actualHeight > height[i])
                height[i] = actualHeight;
        });
    });
    columns.forEach(({ children }) => {
        [...children].forEach((row, i) => {
            if (row.clientHeight > 0) {
                row.style.minHeight =
                    height[i] > 0 ? `${height[i]}px` : 'unset';
            }
        });
    });
}

function handleAddOnContent(table) {
    const addOns = [...table.querySelectorAll('.section-row-title')].filter(
        (row) => row.innerText.toUpperCase().includes('ADDON'),
    );
    if (!addOns.length) return;
    table.classList.add('has-addon');
    addOns.forEach((addOn) => {
        const addOnRow = addOn.parentElement;
        addOnRow.remove();
        const [position, order, style] = addOn.innerText
            .split('-')
            .filter((key) => key.toUpperCase() !== 'ADDON')
            .map((key) => key.toLowerCase());
        if (!position || !order) return;
        const dataIndex = 'data-col-index';
        [...table.querySelector('.row-heading').children].forEach((headCol) => {
            headCol.querySelector('.heading-content')?.classList.add('content');
            const colIndex = headCol.getAttribute(dataIndex);
            if (Number(colIndex) <= 1) return;
            const tagName = `${position}-${order}`;
            const column = [...addOnRow.children].find(
                (element) => element.getAttribute(dataIndex) === colIndex,
            );
            if (!column) return;
            let content = [...column.childNodes];
            const icon = column.querySelector('.icon');
            if (style === 'label' && icon) {
                const text = content.filter(
                    (node) => !node.classList?.contains('icon'),
                );
                content = [createElement('span', {}, text), icon];
            }
            const tag = createElement(
                'div',
                { class: style ? `${tagName} addon-${style}` : tagName },
                content.map((node) => node.cloneNode(true)),
            );
            const anchor = headCol.querySelector(`.${position}`);
            anchor?.classList.add(`has-${tagName}`);
            anchor?.insertAdjacentElement(
                order === 'before' ? 'beforebegin' : 'afterend',
                tag,
            );
        });
    });
    setTimeout(() => handleEqualHeight(table, '.row-heading'), 0);
    table.addEventListener(
        'mas:resolved',
        debounce(() => {
            handleEqualHeight(table, '.row-heading');
        }, 100),
    );
}

function setAriaLabelForIcons(el, labels) {
    const expandableIcons = el.querySelectorAll('.icon.expand[role="button"]');
    const selectFilters = el.parentElement.querySelectorAll('.filters .filter');
    const ariaLabelElements = [...selectFilters, ...expandableIcons];
    ariaLabelElements.forEach((element) => {
        const labelIndex = element.classList.contains('filter')
            ? 'choose-table-column'
            : 'toggle-row';
        element.setAttribute('aria-label', labels[labelIndex]);
    });
}

function dispatchTableHighlightLoaded(table) {
    table.dispatchEvent(new Event(TABLE_HIGHLIGHT_LOADED_EVENT));
}

function handleHighlight(table) {
    const isHighlightTable = table.classList.contains('highlight');
    const firstRow = table.querySelector('.row-1');
    const firstRowCols = firstRow.querySelectorAll('.col');
    const secondRow = table.querySelector('.row-2');
    const secondRowCols = secondRow?.querySelectorAll('.col') || [];
    let headingCols;

    if (isHighlightTable && secondRow) {
        firstRow.classList.add('row-highlight');
        firstRow.setAttribute('aria-hidden', 'true');
        secondRow.classList.add('row-heading');
        secondRowCols.forEach((col) => col.classList.add('col-heading'));
        headingCols = secondRowCols;

        firstRowCols.forEach((col, i) => {
            col.classList.add('col-highlight');
            if (col.innerText) {
                headingCols[i]?.classList.add('no-rounded');
                const highlightText = createElement(
                    'div',
                    { class: 'highlight-text' },
                    col.innerText,
                );
                headingCols[i]?.insertBefore(
                    highlightText,
                    headingCols[i].firstChild,
                );
            } else {
                col.classList.add('hidden');
            }
        });
    } else {
        headingCols = firstRowCols;
        firstRow.classList.add('row-heading');
    }

    handleHeading(table, headingCols);
    handleAddOnContent(table);
    dispatchTableHighlightLoaded(table);
}

function handleExpand(icon) {
    const sectionHead = icon.closest('.row');
    let nextElement = sectionHead.nextElementSibling;
    const expanded = icon.getAttribute('aria-expanded') === 'false';
    icon.setAttribute('aria-expanded', expanded.toString());
    while (nextElement && !nextElement.classList.contains('divider')) {
        if (expanded) {
            sectionHead.classList.remove('section-head-collaped');
            nextElement.classList.remove('hidden');
        } else {
            sectionHead.classList.add('section-head-collaped');
            nextElement.classList.add('hidden');
        }
        nextElement = nextElement.nextElementSibling;
    }
}

function setExpandEvents(el) {
    el.querySelectorAll('.icon.expand').forEach((icon) => {
        const parent = icon.parentElement;
        const onClick = () => handleExpand(icon);
        const onKeyDown = (event) => {
            if (event.key === ' ') event.preventDefault();
            if (event.key === 'Enter' || event.key === ' ') handleExpand(icon);
        };
        parent.classList.add('point-cursor');
        parent.setAttribute('tabindex', 0);
        parent.addEventListener('click', onClick);
        parent.addEventListener('keydown', onKeyDown);
    });
}

function handleTitleText(cell) {
    if (!cell || cell.querySelector('.table-title-text')) return;
    const textSpan = createElement('span', { class: 'table-title-text' });
    while (cell.firstChild) textSpan.append(cell.firstChild);

    const iconTooltip = textSpan.querySelector(
        '.icon-info, .icon-tooltip, .milo-tooltip',
    );
    if (iconTooltip) cell.append(iconTooltip.closest('em') || iconTooltip);

    const firstIcon = textSpan.querySelector('.icon:first-child');
    let nodeToInsert = textSpan;

    if (firstIcon) {
        const titleRowSpan = createElement('span', {
            class: 'table-title-row',
        });
        titleRowSpan.append(firstIcon, textSpan);
        nodeToInsert = titleRowSpan;
    }

    const blockquote = nodeToInsert.querySelector('blockquote');
    if (blockquote) {
        const quoteReplacement = createElement('div', { class: 'blockquote' });
        while (blockquote.firstChild) {
            quoteReplacement.appendChild(blockquote.firstChild);
        }
        blockquote.replaceWith(quoteReplacement);
    }

    cell.insertBefore(nodeToInsert, cell.firstChild);
}

function handleSection(sectionParams) {
    const {
        row,
        index,
        allRows,
        rowCols,
        isMerch,
        isCollapseTable,
        isHighlightTable,
    } = sectionParams;
    let { expandSection } = sectionParams;

    const previousRow = allRows[index - 1];
    const nextRow = allRows[index + 1];
    const nextRowCols = Array.from(nextRow?.children || []);

    if (row.querySelector('hr') && nextRow) {
        row.classList.add('divider');
        row.removeAttribute('role');
        nextRow.classList.add('section-head');
        const sectionHeadTitle = nextRowCols[0];

        if (isMerch && nextRowCols.length) {
            nextRowCols.forEach((merchCol) => {
                merchCol.classList.add('section-head-title');
                merchCol.setAttribute('role', 'rowheader');
            });
        } else {
            handleTitleText(sectionHeadTitle);
            sectionHeadTitle.classList.add('section-head-title');
            sectionHeadTitle.setAttribute('role', 'rowheader');
        }

        if (isCollapseTable && sectionHeadTitle) {
            const iconTag = createElement('span', {
                class: 'icon expand',
                role: 'button',
            });
            if (!sectionHeadTitle.querySelector('.icon.expand')) {
                sectionHeadTitle.prepend(iconTag);
            }

            if (expandSection) {
                iconTag.setAttribute('aria-expanded', 'true');
                expandSection = false;
            } else {
                iconTag.setAttribute('aria-expanded', 'false');
                nextRow.classList.add('section-head-collaped');
                let nextElement = row.nextElementSibling;
                while (
                    nextElement &&
                    !nextElement.classList.contains('divider')
                ) {
                    nextElement.classList.add('hidden');
                    nextElement = nextElement.nextElementSibling;
                }
            }
        }
    } else if (previousRow?.querySelector('hr') && nextRow) {
        nextRow.classList.add('section-row');
        if (!isMerch) {
            const sectionRowTitle = nextRowCols[0];
            sectionRowTitle?.classList.add('section-row-title');
            sectionRowTitle?.setAttribute('role', 'rowheader');
            sectionRowTitle?.setAttribute('scope', 'row');
        }
    } else if (
        !row.classList.contains('row-1') &&
        (!isHighlightTable || !row.classList.contains('row-2'))
    ) {
        row.classList.add('section-row');
        rowCols.forEach((col) => {
            if (col.querySelector('a') && !col.querySelector('span')) {
                const textSpan = createElement('span', { class: 'col-text' }, [
                    ...col.childNodes,
                ]);
                col.appendChild(textSpan);
            }
        });
        if (isMerch && !row.classList.contains('divider')) {
            rowCols.forEach((merchCol) => {
                merchCol.classList.add('col-merch');
                const children = Array.from(merchCol.children);
                const merchContent = createElement('div', {
                    class: 'col-merch-content',
                });
                if (children.length) {
                    children.forEach((child) => {
                        if (!child.querySelector('.icon')) {
                            merchContent.append(child);
                        }
                    });
                    merchCol.insertBefore(merchContent, merchCol.firstChild);
                } else if (merchCol.innerText) {
                    const pTag = createElement(
                        'p',
                        { class: 'merch-col-text' },
                        merchCol.innerText,
                    );
                    merchCol.innerText = '';
                    merchContent.append(pTag);
                    merchCol.append(merchContent);
                }
            });
        } else {
            const sectionRowTitle = rowCols[0];
            handleTitleText(sectionRowTitle);
            sectionRowTitle.classList.add('section-row-title');
            sectionRowTitle.setAttribute('role', 'rowheader');
            sectionRowTitle.setAttribute('scope', 'row');
        }
    }

    rowCols.forEach((col) => {
        if (
            col.querySelector(
                ':scope > :is(strong, em, del, code, sub, sup)',
            ) &&
            col.childNodes.length > 1 &&
            !col.querySelector('picture')
        ) {
            col.replaceChildren(createElement('p', {}, [...col.childNodes]));
        }
    });

    return expandSection;
}

function formatMerchTable(table) {
    const rows = table.querySelectorAll('.row');
    const rowsNum = rows.length;
    const firstRow = rows[0];
    const colsInRow = firstRow.querySelectorAll('.col');
    const colsInRowNum = colsInRow.length;

    for (let i = colsInRowNum; i > 0; i -= 1) {
        const cols = table.querySelectorAll(`.col-${i}`);
        for (let j = rowsNum - 1; j >= 0; j -= 1) {
            const currentCol = cols[j];
            if (!currentCol?.innerText && currentCol?.children.length === 0) {
                currentCol.classList.add('no-borders');
            } else {
                currentCol.classList.add('border-bottom');
                break;
            }
        }
    }
}

function removeHover(cols) {
    cols.forEach((col) =>
        col.classList.remove('hover', 'no-top-border', 'hover-border-bottom'),
    );
}

function handleHovering(table) {
    const row1 = table.querySelector('.row-1');
    if (!row1) return;
    const colsInRowNum = row1.childElementCount;
    const isMerch = table.classList.contains('merch');
    const startValue = isMerch ? 1 : 2;
    const isCollapseTable = table.classList.contains('collapse');
    const sectionHeads = table.querySelectorAll('.section-head');
    const lastSectionHead = sectionHeads[sectionHeads.length - 1];
    const lastExpandIcon = lastSectionHead?.querySelector('.icon.expand');

    for (let i = startValue; i <= colsInRowNum; i += 1) {
        const cols = table.querySelectorAll(`.col-${i}`);
        cols.forEach((element) => {
            element.addEventListener('mouseover', () => {
                removeHover(cols);
                const headingRow = table.querySelector('.row-heading');
                const colClass = `col-${i}`;
                const isLastRowCollapsed =
                    lastExpandIcon?.getAttribute('aria-expanded') === 'false';
                cols.forEach((col) => {
                    if (
                        col.classList.contains('col-highlight') &&
                        col.innerText
                    ) {
                        const matchingColsClass = Array.from(
                            col.classList,
                        ).find((className) => className.startsWith(colClass));
                        const noTopBorderCol = headingRow?.querySelector(
                            `.${matchingColsClass}`,
                        );
                        noTopBorderCol?.classList.add('no-top-border');
                    }
                    if (isCollapseTable && isLastRowCollapsed) {
                        const lastSectionHeadCol =
                            lastSectionHead?.querySelector(`.col-${i}`);
                        lastSectionHeadCol?.classList.add(
                            'hover-border-bottom',
                        );
                    }
                    col.classList.add('hover');
                });
            });
            element.addEventListener('mouseout', () => removeHover(cols));
        });
    }
}

function handleScrollEffect(table, getStickyTop) {
    table._stickyObserver?.disconnect();
    const stickyTop = getStickyTop();
    const highlightRow = table.querySelector('.row-highlight');
    const headingRow = table.querySelector('.row-heading');
    if (!headingRow) return;

    if (highlightRow) {
        highlightRow.style.top = `${stickyTop}px`;
        highlightRow.classList.add('top-border-transparent');
    } else {
        headingRow.classList.add('top-border-transparent');
    }

    const topOffset =
        stickyTop + (highlightRow ? highlightRow.offsetHeight : 0);
    headingRow.style.top = `${topOffset}px`;
    const intercept =
        table.querySelector('.intercept') ||
        createElement('div', { class: 'intercept' });
    intercept.setAttribute('data-observer-intercept', '');
    headingRow.insertAdjacentElement('beforebegin', intercept);

    const observer = new IntersectionObserver(
        ([entry]) => {
            headingRow.classList.toggle('active', !entry.isIntersecting);
        },
        { rootMargin: `-${topOffset}px` },
    );
    observer.observe(intercept);
    table._stickyObserver = observer;
}

function applyStylesBasedOnScreenSize(
    table,
    originTable,
    labels,
    getStickyTop,
) {
    const isMerch = table.classList.contains('merch');
    const deviceBySize = defineDeviceByScreenSize();

    const setRowStyle = () => {
        if (isMerch) return;
        const sectionRow = Array.from(
            table.getElementsByClassName('section-row'),
        );
        if (sectionRow.length) {
            const colsForTablet = sectionRow[0].children.length - 1;
            const percentage = 100 / colsForTablet;
            const templateColumnsValue = `repeat(auto-fit, ${percentage}%)`;
            sectionRow.forEach((row) => {
                if (
                    deviceBySize === 'TABLET' ||
                    (deviceBySize === 'MOBILE' && !row.querySelector('.col-3'))
                ) {
                    row.style.gridTemplateColumns = templateColumnsValue;
                } else {
                    row.style.gridTemplateColumns = '';
                }
            });
        }
    };

    const mobileRenderer = () => {
        dispatchTableHighlightLoaded(table);
        const headings = table.querySelectorAll('.row-heading .col');
        const headingsLength = Array.from(headings).filter((heading) =>
            heading.textContent.trim(),
        ).length;
        table.querySelectorAll('.hide-mobile').forEach((col) => {
            col.classList.remove('hide-mobile');
        });

        if (isMerch && headingsLength >= 2) {
            table
                .querySelectorAll('.col:not(.col-1, .col-2)')
                .forEach((col) => {
                    col.classList.add('hide-mobile');
                });
        } else if (headingsLength >= 3) {
            table
                .querySelectorAll(
                    '.col:not(.col-1, .col-2, .col-3), .col.no-borders',
                )
                .forEach((col) => {
                    col.classList.add('hide-mobile');
                });
        }

        if (
            (!isMerch && !table.querySelector('.col-3')) ||
            (isMerch && !table.querySelector('.col-2'))
        ) {
            return;
        }

        const filterChangeEvent = (event) => {
            const filters = Array.from(
                table.parentElement.querySelectorAll('.filter'),
            ).map((filter) => parseInt(filter.value, 10));
            const rows = table.querySelectorAll('.row');

            table
                .querySelectorAll('.hide-mobile, .force-last')
                .forEach((col) => {
                    col.classList.remove('hide-mobile', 'force-last');
                });

            rows.forEach((row) => {
                row.querySelectorAll('.col[data-cloned]').forEach((col) =>
                    col.remove(),
                );
            });

            if (isMerch) {
                table
                    .querySelectorAll(
                        `.col:not(.col-${filters[0] + 1}, .col-${filters[1] + 1})`,
                    )
                    .forEach((col) => {
                        col.classList.add('hide-mobile');
                    });
            } else {
                table
                    .querySelectorAll(
                        `.col:not(.col-1, .col-${filters[0] + 1}, .col-${
                            filters[1] + 1
                        }), .col.no-borders`,
                    )
                    .forEach((col) => {
                        col.classList.add('hide-mobile');
                    });
            }

            rows.forEach((row) => {
                const firstFilterCol = row.querySelector(
                    `.col-${filters[0] + 1}`,
                );
                const secondFilterCol = row.querySelector(
                    `.col-${filters[1] + 1}`,
                );

                if (firstFilterCol?.classList.contains('col-heading')) {
                    firstFilterCol.classList.remove('right-round');
                    firstFilterCol.classList.add('left-round');
                }
                if (secondFilterCol?.classList.contains('col-heading')) {
                    secondFilterCol.classList.remove('left-round');
                    secondFilterCol.classList.add('right-round');
                }
                if (secondFilterCol)
                    secondFilterCol.classList.add('force-last');
            });

            if (filters[0] === filters[1]) {
                const selectedCol = filters[0] + 1;
                rows.forEach((row) => {
                    const selectedColumn = row.querySelector(
                        `.col-${selectedCol}`,
                    );
                    if (!selectedColumn) return;

                    const clone = selectedColumn.cloneNode(true);
                    clone.setAttribute('data-cloned', 'true');
                    selectedColumn.classList.remove('force-last');

                    if (selectedColumn.classList.contains('col-heading')) {
                        selectedColumn.classList.remove('right-round');
                        selectedColumn.classList.add('left-round');
                        clone.classList.remove('left-round');
                        clone.classList.add('right-round');
                    }

                    row.appendChild(clone);
                });
            }

            setRowStyle();

            if (isStickyHeader(table)) {
                handleScrollEffect(table, getStickyTop);
            }
            if (event) handleEqualHeight(table, '.row-heading');
            setAriaLabelForIcons(table, labels);
        };

        const shouldShowFilter = headingsLength > 2;
        if (
            !table.parentElement.querySelector('.filters') &&
            shouldShowFilter
        ) {
            const filters = createElement('div', { class: 'filters' });
            const filter1 = createElement('div', { class: 'filter-wrapper' });
            const filter2 = createElement('div', { class: 'filter-wrapper' });
            const colSelect0 = createElement('select', { class: 'filter' });
            const headingsFromOrigin =
                originTable.querySelectorAll('.col-heading');
            headingsFromOrigin.forEach((heading, index) => {
                const title = heading.querySelector('.tracking-header');
                if (!title || (!isMerch && title.closest('.col-1'))) return;

                const option = createElement(
                    'option',
                    { value: index },
                    title.innerText,
                );
                colSelect0.append(option);
            });
            const colSelect1 = colSelect0.cloneNode(true);
            colSelect0.dataset.filterIndex = 0;
            colSelect1.dataset.filterIndex = 1;
            const visibleCols = table.querySelectorAll(
                `.col-heading:not([style*="display: none"], .hidden${
                    isMerch ? '' : ', .col-1'
                })`,
            );
            const offset = isMerch ? 1 : 2;
            const option0 = colSelect0
                .querySelectorAll('option')
                .item(visibleCols.item(0).dataset.colIndex - offset);
            const option1 = colSelect1
                .querySelectorAll('option')
                .item(visibleCols.item(1).dataset.colIndex - offset);
            if (option0) option0.selected = true;
            if (option1) option1.selected = true;
            filter1.append(colSelect0);
            filter2.append(colSelect1);
            filters.append(filter1, filter2);
            filter1.addEventListener('change', filterChangeEvent);
            filter2.addEventListener('change', filterChangeEvent);
            table.parentElement.insertBefore(filters, table);
            table.parentElement.classList.add(
                `table-${table.classList.contains('merch') ? 'merch-' : ''}section`,
            );
            if (!isMerch && headingsLength < 3) {
                filters.style.display = 'none';
            }
            filterChangeEvent();
        }
    };

    const removeClones = () => {
        table
            .querySelectorAll('.row .col[data-cloned]')
            .forEach((clonedCol) => {
                clonedCol.remove();
            });
    };

    if (!isMerch && !table.querySelector('.row-heading .col-2')) {
        table.querySelector('.row-heading').style.display = 'block';
        table.querySelector('.row-heading .col-1').style.display = 'flex';
    }

    removeClones();
    if (deviceBySize === 'MOBILE' || (isMerch && deviceBySize === 'TABLET')) {
        mobileRenderer();
    } else {
        table
            .querySelectorAll('.hide-mobile, .left-round, .right-round')
            .forEach((col) => {
                col.classList.remove(
                    'hide-mobile',
                    'left-round',
                    'right-round',
                );
            });
        [...(table.querySelector('.row-heading')?.children || [])].forEach(
            (column) =>
                [...column.children].forEach((row) =>
                    row.style.removeProperty('height'),
                ),
        );
        table.parentElement
            .querySelectorAll('.filters select')
            .forEach((select, index) => {
                select.querySelectorAll('option').item(index).selected = true;
            });
    }

    dispatchTableHighlightLoaded(table);
    handleHovering(table);
    setRowStyle();
}

function handleStickyHeader(el) {
    if (!el.classList.value.includes('sticky')) return;
    setTimeout(() => {
        const headingHeight =
            el.querySelector('.row-heading')?.offsetHeight || 0;
        el.classList.toggle(
            'cancel-sticky',
            !(headingHeight / window.innerHeight < 0.45),
        );
    });
}

function decorateTable(el, options) {
    el.setAttribute('role', 'table');
    if (el.parentElement.classList.contains('section')) {
        el.parentElement.classList.add(
            `table-${el.classList.contains('merch') ? 'merch-' : ''}section`,
        );
    }

    const rows = Array.from(el.children);
    const isMerch = el.classList.contains('merch');
    const isCollapseTable = el.classList.contains('collapse') && !isMerch;
    const isHighlightTable = el.classList.contains('highlight');
    let expandSection = true;

    rows.forEach((row, rowIndex) => {
        row.classList.add('row', `row-${rowIndex + 1}`);
        row.setAttribute('role', 'row');
        const cols = Array.from(row.children);
        const sectionParams = {
            row,
            index: rowIndex,
            allRows: rows,
            rowCols: cols,
            isMerch,
            isCollapseTable,
            expandSection,
            isHighlightTable,
        };

        cols.forEach((col, colIndex) => {
            col.dataset.colIndex = colIndex + 1;
            col.classList.add('col', `col-${colIndex + 1}`);
            col.setAttribute(
                'role',
                col.matches('.section-head-title') ? 'columnheader' : 'cell',
            );
        });

        expandSection = handleSection(sectionParams);
    });

    handleHighlight(el);
    handleStickyHeader(el);
    if (isMerch) formatMerchTable(el);

    let isDecorated = false;
    let currentDevice = defineDeviceByScreenSize();

    const handleResize = () => {
        applyStylesBasedOnScreenSize(
            el,
            el._originTable,
            options.labels,
            options.getStickyTop,
        );
        if (isStickyHeader(el)) {
            handleScrollEffect(el, options.getStickyTop);
        }
    };

    if (
        el.querySelectorAll(
            isMerch
                ? '.col-heading:not(.hidden)'
                : '.col-heading:not(.hidden, .col-1)',
        ).length > 2
    ) {
        el._originTable = el.cloneNode(true);
    } else {
        el._originTable = el;
    }

    const onResize = debounce(() => {
        handleEqualHeight(el, '.row-heading');
        handleStickyHeader(el);
        const nextDevice = defineDeviceByScreenSize();
        if (currentDevice === nextDevice) return;
        currentDevice = nextDevice;
        handleResize();
    }, 100);

    const onTabChange = () => handleStickyHeader(el);
    const intersectionObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
            intersectionObserver.disconnect();
            if (!isDecorated) {
                handleResize();
                setExpandEvents(el);
                setAriaLabelForIcons(el, options.labels);
                isDecorated = true;
            }
        }
    });

    const resizeObserver = new ResizeObserver(
        debounce(() => handleStickyHeader(el), 100),
    );

    resizeObserver.observe(el);
    window.addEventListener('resize', onResize);
    window.addEventListener(TAB_CHANGE_EVENT, onTabChange);
    intersectionObserver.observe(el);

    if (!isDecorated) {
        setTimeout(() => {
            if (isDecorated) return;
            handleResize();
            setExpandEvents(el);
            setAriaLabelForIcons(el, options.labels);
            isDecorated = true;
        }, 0);
    }

    tableIndex += 1;

    return () => {
        intersectionObserver.disconnect();
        resizeObserver.disconnect();
        el._stickyObserver?.disconnect();
        delete el._stickyObserver;
        delete el._originTable;
        window.removeEventListener('resize', onResize);
        window.removeEventListener(TAB_CHANGE_EVENT, onTabChange);
    };
}

function resolveColorValue(value) {
    if (!value) return '';
    if (
        value.startsWith('color-') ||
        value.startsWith('spectrum-') ||
        value.startsWith('--')
    ) {
        return value.startsWith('--') ? `var(${value})` : `var(--${value})`;
    }
    return value;
}

function createMnemonicIcon(src, alt = '') {
    const mnemonic = createElement('mas-mnemonic', {
        slot: 'icons',
        src,
        size: 'l',
    });
    if (alt) {
        mnemonic.setAttribute('role', 'img');
        mnemonic.setAttribute('aria-label', alt);
    }
    return mnemonic;
}

function cloneSlotNodes(card, slotName) {
    if (!card) return [];
    return Array.from(card.querySelectorAll(`[slot="${slotName}"]`)).map(
        (node) => node.cloneNode(true),
    );
}

function normalizeFooterSlotNode(node) {
    if (!node) return node;
    node.removeAttribute?.('slot');
    const buttons = node.matches?.('.con-button, button, a.con-button')
        ? [node]
        : Array.from(
              node.querySelectorAll('.con-button, button, a.con-button'),
          );
    if (!buttons.length) return node;

    const actionArea = createElement('p', { class: 'action-area' });
    buttons.forEach((button) => {
        actionArea.append(button);
        const spacer = button.nextSibling;
        if (spacer?.nodeType === Node.TEXT_NODE && !spacer.textContent.trim()) {
            spacer.remove();
        }
    });
    return actionArea;
}

function buildMerchHeadingContent(card) {
    const fragment = document.createDocumentFragment();
    const iconNodes = cloneSlotNodes(card, 'icons');
    if (iconNodes.length) {
        const iconRow = createElement('p', { class: 'header-product-tile' });
        iconNodes.forEach((node) => {
            if (node.tagName === 'MERCH-ICON') {
                const mnemonic = createMnemonicIcon(
                    node.getAttribute('src') || '',
                    node.getAttribute('alt') || '',
                );
                mnemonic.removeAttribute('slot');
                iconRow.append(mnemonic);
                return;
            }
            node.removeAttribute?.('slot');
            iconRow.append(node);
        });
        fragment.append(iconRow);
    }
    [
        MINI_COMPARE_CHART_SLOTS.title,
        MINI_COMPARE_CHART_SLOTS.prices,
        MINI_COMPARE_CHART_SLOTS.description,
        MINI_COMPARE_CHART_SLOTS.ctas,
    ].forEach((slotName) => {
        cloneSlotNodes(card, slotName).forEach((node) => {
            if (slotName === MINI_COMPARE_CHART_SLOTS.ctas) {
                fragment.append(normalizeFooterSlotNode(node));
                return;
            }
            fragment.append(node);
        });
    });
    return fragment;
}

function getBadgeData(card) {
    if (!card) return null;
    if (card._masTableBadgeData?.text) return card._masTableBadgeData;

    const badgeSlot = card.querySelector('[slot="badge"]');
    const shadowBadge = card.shadowRoot?.getElementById('badge');
    const badgeElement = badgeSlot?.matches('merch-badge')
        ? badgeSlot
        : badgeSlot?.querySelector('merch-badge');
    const text =
        badgeElement?.textContent?.trim() ||
        badgeSlot?.textContent?.trim() ||
        shadowBadge?.textContent?.trim() ||
        card.getAttribute('badge-text') ||
        '';

    if (!text) return null;

    const computedBadgeStyles = shadowBadge
        ? getComputedStyle(shadowBadge)
        : null;
    const backgroundColor =
        resolveColorValue(
            badgeElement?.getAttribute('background-color') || '',
        ) ||
        resolveColorValue(card.getAttribute('badge-background-color') || '') ||
        computedBadgeStyles?.backgroundColor ||
        '';
    const textColor =
        resolveColorValue(badgeElement?.getAttribute('color') || '') ||
        resolveColorValue(card.getAttribute('badge-color') || '') ||
        computedBadgeStyles?.color ||
        '';

    return {
        text,
        icon: badgeElement?.getAttribute('icon') || '',
        backgroundColor,
        textColor,
    };
}

function createBadgeIcon(icon) {
    if (!icon) return null;
    if (icon.startsWith('sp-icon-')) {
        return createElement(icon, { class: 'badge-icon' });
    }
    return createElement('img', {
        class: 'badge-icon',
        src: icon,
        alt: '',
    });
}

function createBadgePreviewContent(badgeData) {
    const fragment = document.createDocumentFragment();
    const icon = createBadgeIcon(badgeData.icon);
    if (icon) fragment.append(icon);
    fragment.append(document.createTextNode(badgeData.text));
    return fragment;
}

function parseBadgeDataFromFields(fields = {}) {
    const badgeValue = fields.badge;
    if (!badgeValue) return null;

    if (typeof badgeValue !== 'string') {
        const text = String(badgeValue).trim();
        if (!text) return null;
        return {
            text,
            icon: '',
            backgroundColor: resolveColorValue(
                fields.badgeBackgroundColor || '',
            ),
            textColor: resolveColorValue(fields.badgeColor || ''),
        };
    }

    const template = document.createElement('template');
    template.innerHTML = badgeValue;
    const badgeElement =
        template.content.querySelector('merch-badge') ||
        template.content.firstElementChild;
    const text = badgeElement?.textContent?.trim() || badgeValue.trim();
    if (!text) return null;

    return {
        text,
        icon: badgeElement?.getAttribute?.('icon') || '',
        backgroundColor: resolveColorValue(
            badgeElement?.getAttribute?.('background-color') ||
                fields.badgeBackgroundColor ||
                '',
        ),
        textColor: resolveColorValue(
            badgeElement?.getAttribute?.('color') || fields.badgeColor || '',
        ),
    };
}

async function hydrateMerchCards(cardIds, referenceMap, container) {
    const entries = await Promise.all(
        cardIds.map(async (cardId) => {
            const fragment = referenceMap.get(cardId);
            if (!fragment) return [cardId, null];

            try {
                const merchCard = document.createElement('merch-card');
                const fields = {
                    ...normalizeFieldsForHydrate(fragment),
                    variant: MINI_COMPARE_CHART_VARIANT,
                };
                merchCard.variant = MINI_COMPARE_CHART_VARIANT;
                merchCard._masTableBadgeData = parseBadgeDataFromFields(fields);
                container.append(merchCard);
                await hydrate(
                    {
                        ...fragment,
                        fields,
                        settings: fragment.settings || {},
                        variantLayout: {
                            aemFragmentMapping:
                                MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING,
                        },
                    },
                    merchCard,
                );
                return [cardId, merchCard];
            } catch {
                return [cardId, null];
            }
        }),
    );

    return new Map(entries.filter(([, merchCard]) => merchCard));
}

function hydrateMerchHighlightRow(table, cardIds, merchCardMap) {
    if (
        !table.classList.contains('merch') ||
        !table.classList.contains('highlight')
    ) {
        return;
    }

    const highlightRow = table.firstElementChild;
    if (!highlightRow) return;
    const cells = Array.from(highlightRow.children);

    cardIds.forEach((cardId, index) => {
        const cell = cells[index];
        const badgeData = getBadgeData(merchCardMap.get(cardId));
        if (!cell || !badgeData?.text) return;

        cell.replaceChildren(createBadgePreviewContent(badgeData));

        if (badgeData.backgroundColor) {
            cell.style.backgroundColor = badgeData.backgroundColor;
            cell.style.borderColor = badgeData.backgroundColor;
        }

        if (badgeData.textColor) {
            cell.style.color = badgeData.textColor;
        }
    });
}

function hydrateMerchHeadings(table, cardIds, merchCardMap) {
    if (!table.classList.contains('merch') || !cardIds?.length) return;
    const rows = Array.from(table.children);
    if (!rows.length) return;
    const headingRowIndex =
        table.classList.contains('highlight') && rows.length > 1 ? 1 : 0;
    const headingRow = rows[headingRowIndex];
    if (!headingRow) return;
    const cells = Array.from(headingRow.children);

    cardIds.forEach((cardId, index) => {
        const cell = cells[index];
        const merchCard = merchCardMap.get(cardId);
        if (!cell || !merchCard) return;
        cell.replaceChildren(buildMerchHeadingContent(merchCard));
    });
}

function mergeVariantClasses(table, fields) {
    const blockName = getStringField(fields, 'blockName');
    if (blockName !== 'Table') return;
    getArrayField(fields, 'selectedVariantNames').forEach((variant) => {
        if (variant) table.classList.add(String(variant));
    });
}

async function settleMasElements(root) {
    const masElements = [...root.querySelectorAll(SELECTOR_MAS_ELEMENT)];
    await Promise.all(
        masElements.map((element) => {
            if (typeof element.onceSettled !== 'function') {
                return Promise.resolve(element);
            }
            return element.onceSettled().catch(() => element);
        }),
    );
}

export class MasTable extends HTMLElement {
    #cleanup = [];
    #currentRenderId = 0;
    #log;
    #service;
    #resolveUpdate;
    #rejectUpdate;
    #startMarkName;
    #durationMarkName;
    #updateComplete = Promise.resolve(this);

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = getStyleText();
        this.#content = document.createElement('div');
        this.#scratch = document.createElement('div');
        this.#scratch.className = 'mas-table-scratch';
        this.shadowRoot.append(style, this.#content, this.#scratch);
        this.handleAemFragmentEvents = this.handleAemFragmentEvents.bind(this);
    }

    #content;
    #scratch;

    connectedCallback() {
        this.#service = getService();
        this.#log ??=
            this.#service?.Log?.module?.(TAG_NAME) ??
            this.#service?.log?.module?.(TAG_NAME) ??
            console;
        this.syncDirection();
        const logId =
            this.getAttribute('id') ??
            this.aemFragment?.getAttribute('fragment') ??
            'unknown';
        this.#startMarkName = `${MARK_PREFIX}${logId}${MARK_START_SUFFIX}`;
        this.#durationMarkName = `${MARK_PREFIX}${logId}${MARK_DURATION_SUFFIX}`;
        performance.mark(this.#startMarkName);

        this.addEventListener(EVENT_AEM_ERROR, this.handleAemFragmentEvents);
        this.addEventListener(EVENT_AEM_LOAD, this.handleAemFragmentEvents);
        this.aemFragment?.setAttribute('hidden', '');
    }

    disconnectedCallback() {
        this.removeEventListener(EVENT_AEM_ERROR, this.handleAemFragmentEvents);
        this.removeEventListener(EVENT_AEM_LOAD, this.handleAemFragmentEvents);
        this.cleanup();
    }

    get aemFragment() {
        return this.querySelector('aem-fragment');
    }

    get updateComplete() {
        return this.#updateComplete;
    }

    syncDirection() {
        const dir =
            this.closest('[dir]')?.getAttribute('dir') ||
            document.documentElement.getAttribute('dir') ||
            'ltr';
        this.setAttribute('dir', dir);
    }

    cleanup() {
        this.#cleanup.splice(0).forEach((fn) => fn());
    }

    beginUpdate() {
        this.#updateComplete = new Promise((resolve, reject) => {
            this.#resolveUpdate = resolve;
            this.#rejectUpdate = reject;
        });
    }

    async handleAemFragmentEvents(event) {
        if (!this.isConnected) return;
        if (
            event.type === EVENT_AEM_ERROR &&
            event.target === this.aemFragment
        ) {
            this.fail('AEM fragment cannot be loaded');
            return;
        }
        if (event.type !== EVENT_AEM_LOAD || event.target !== this.aemFragment)
            return;
        this.removeAttribute('failed');
        this.beginUpdate();
        const renderId = ++this.#currentRenderId;
        try {
            await this.renderFragment(event.detail);
            if (renderId !== this.#currentRenderId) return;
            await settleMasElements(this.shadowRoot);
            const measure = performance.measure(
                this.#durationMarkName,
                this.#startMarkName,
            );
            const detail = {
                ...this.aemFragment?.fetchInfo,
                ...this.#service?.duration,
                measure: printMeasure(measure),
            };
            this.dispatchEvent(
                new CustomEvent(EVENT_MAS_READY, {
                    bubbles: true,
                    composed: true,
                    detail,
                }),
            );
            this.#resolveUpdate?.(this);
        } catch (error) {
            if (renderId !== this.#currentRenderId) return;
            this.fail(error.message || 'Failed to render table');
        }
    }

    getStickyTop() {
        const value = getComputedStyle(this).getPropertyValue(
            '--mas-table-sticky-top',
        );
        const top = parseFloat(value);
        return Number.isFinite(top) ? top : 0;
    }

    async renderFragment(fragment) {
        const fields = normalizeFields(fragment);
        const compareChart = getStringField(fields, 'compareChart').trim();
        if (!compareChart) {
            throw new Error('compareChart field is missing');
        }

        this.cleanup();
        this.#content.replaceChildren();
        this.#scratch.replaceChildren();

        const wrapper = document.createElement('div');
        wrapper.className = 'mas-table-empty';
        appendHtml(wrapper, compareChart);
        const tables = Array.from(wrapper.querySelectorAll('.table'));
        if (!tables.length) {
            throw new Error('compareChart does not contain a .table block');
        }

        const referenceMap = normalizeFragmentMap(fragment.references);
        const cardIds = getArrayField(fields, 'cards').map(String);
        const merchCardMap = await hydrateMerchCards(
            cardIds,
            referenceMap,
            this.#scratch,
        );
        const labels = getLabels(fragment);

        tables.forEach((table) => {
            mergeVariantClasses(table, fields);
            hydrateMerchHighlightRow(table, cardIds, merchCardMap);
            hydrateMerchHeadings(table, cardIds, merchCardMap);
            const cleanup = decorateTable(table, {
                labels,
                getStickyTop: () => this.getStickyTop(),
            });
            this.#cleanup.push(cleanup);
        });

        this.#content.append(...Array.from(wrapper.childNodes));
    }

    fail(message, details = {}) {
        if (!this.isConnected) return;
        this.setAttribute('failed', '');
        const detail = {
            ...this.aemFragment?.fetchInfo,
            ...this.#service?.duration,
            ...details,
            message,
        };
        this.#log?.error?.(`mas-table: ${message}`, detail);
        this.dispatchEvent(
            new CustomEvent(EVENT_MAS_ERROR, {
                bubbles: true,
                composed: true,
                detail,
            }),
        );
        this.#rejectUpdate?.(new Error(message));
    }

    async checkReady() {
        const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => resolve('timeout'), LOAD_TIMEOUT),
        );

        if (this.aemFragment) {
            const result = await Promise.race([
                this.aemFragment.updateComplete,
                timeoutPromise,
            ]);
            if (result === false || result === 'timeout') {
                const errorMessage =
                    result === 'timeout'
                        ? `AEM fragment was not resolved within ${LOAD_TIMEOUT} timeout`
                        : 'AEM fragment cannot be loaded';
                this.fail(errorMessage);
                throw new Error(errorMessage);
            }
        }

        const result = await Promise.race([
            this.updateComplete,
            timeoutPromise,
        ]);
        if (result === 'timeout') {
            const errorMessage = `mas-table was not resolved within ${LOAD_TIMEOUT} timeout`;
            this.fail(errorMessage);
            throw new Error(errorMessage);
        }
        return result;
    }
}

customElements.define(TAG_NAME, MasTable);
