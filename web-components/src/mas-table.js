import {
    EVENT_AEM_ERROR,
    EVENT_AEM_LOAD,
    EVENT_MAS_ERROR,
    EVENT_MAS_READY,
    MARK_DURATION_SUFFIX,
    MARK_START_SUFFIX,
    SELECTOR_MAS_INLINE_PRICE,
    SELECTOR_MAS_ELEMENT,
    TEMPLATE_PRICE_LEGAL,
} from './constants.js';
import { hydrate } from './hydrate.js';
import { MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING } from './variants/mini-compare-chart.js';
import { debounce, getService, printMeasure } from './utils.js';

const TAG_NAME = 'mas-table';
const TABLE_HOST_SELECTOR = 'mas-table, mas-comparison-table';
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
const MERCH_HEADER_SECTIONS = [
    {
        className: 'header-section-icon',
        cssVar: '--mas-table-header-icon-height',
    },
    {
        className: 'header-section-title',
        cssVar: '--mas-table-header-title-height',
    },
    {
        className: 'header-section-description',
        cssVar: '--mas-table-header-description-height',
    },
    {
        className: 'header-section-price-strikethrough',
        cssVar: '--mas-table-header-strikethrough-height',
    },
    {
        className: 'header-section-price',
        cssVar: '--mas-table-header-price-height',
    },
    {
        className: 'header-section-legal',
        cssVar: '--mas-table-header-legal-height',
    },
    {
        className: 'header-section-buttons',
        cssVar: '--mas-table-header-buttons-height',
    },
];
const TABLE_HEIGHT_RULE_ATTR = 'data-mas-table-height-rules';
const TABLE_HEIGHT_SCOPE_ATTR = 'data-mas-table-height-scope';
let tableHeightScopeCounter = 0;
const LOCAL_TABLE_CSS = `
    .table.sticky .row-heading,
    .table.sticky .row.row-highlight {
        background: var(--color-white, #fff);
    }

    .table.sticky .row.row-highlight {
        background-color: var(--color-white, #fff) !important;
    }

    .filters.sticky-mobile-compare {
        position: sticky;
        top: var(--mas-table-sticky-top, 0px);
        z-index: 5;
        background: var(--color-white, #fff);
    }

    .filters.sticky-mobile-compare.active {
        box-shadow: 0 6px 3px -3px rgb(0 0 0 / 15%);
    }

    .table .row-heading .col.col-heading {
        position: relative;
    }

    .table .row-highlight .col-highlight {
        display: block;
        text-align: center;
    }

    .table .row-highlight .col-highlight .badge-inline-content {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.375em;
        vertical-align: middle;
    }

    .table.sticky .row-heading > .col {
        background: var(--color-white, #fff);
        background-clip: padding-box;
    }

    .table.sticky .row-highlight > .col.hidden {
        background: var(--color-white, #fff);
    }
`;

let tableIndex = 0;

function ensureTableHeightScope(table) {
    if (!table?.hasAttribute(TABLE_HEIGHT_SCOPE_ATTR)) {
        tableHeightScopeCounter += 1;
        table.setAttribute(TABLE_HEIGHT_SCOPE_ATTR, `${tableHeightScopeCounter}`);
    }
    return table.getAttribute(TABLE_HEIGHT_SCOPE_ATTR);
}

function getTableHeightRuleStyle(table) {
    const host = table?.closest(TABLE_HOST_SELECTOR);
    const style = host?.querySelector(`style[${TABLE_HEIGHT_RULE_ATTR}]`);
    if (!style) return null;
    if (!style._tableHeightRules) {
        style._tableHeightRules = new Map();
    }
    return style;
}

function setTableHeightRule(table, ruleText = '') {
    const style = getTableHeightRuleStyle(table);
    const scope = ensureTableHeightScope(table);
    if (!style || !scope) return;
    if (ruleText) {
        style._tableHeightRules.set(scope, ruleText);
    } else {
        style._tableHeightRules.delete(scope);
    }
    style.textContent = Array.from(style._tableHeightRules.values()).join('\n');
}

function createTableHeightRule(table, declarations = []) {
    const scope = ensureTableHeightScope(table);
    if (!scope || !declarations.length) return '';
    return `[${TABLE_HEIGHT_SCOPE_ATTR}="${scope}"] .row-heading { ${declarations.join(
        ' ',
    )} }`;
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

function isCompareStyleMobileTable(table) {
    if (!table || table.classList.contains('merch')) return false;
    const headingRow = table.querySelector('.row-heading');
    const firstHeadingCol = headingRow?.querySelector('.col-1');
    const secondHeadingCol = headingRow?.querySelector('.col-2');
    return Boolean(
        headingRow &&
            secondHeadingCol &&
            firstHeadingCol &&
            !firstHeadingCol.textContent?.trim(),
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

        const hasCanonicalHeadingWrappers =
            col.querySelector(':scope > .heading-content') &&
            col.querySelector(':scope > .heading-button');

        const elements = col.children;
        if (hasCanonicalHeadingWrappers) {
            // Hydrated compare-card headers already match the canonical
            // heading-content / heading-button contract used by table markup.
        } else if (!elements.length) {
            col.innerHTML = `<div class="heading-content"><p class="tracking-header">${col.innerHTML}</p></div>`;
        } else {
            let textStartIndex = 0;
            let isTrackingSet = false;
            const isIconElement = (element) =>
                element?.matches?.('img, picture, mas-mnemonic, merch-icon');
            let iconRow = elements[textStartIndex];
            const hasIconTile =
                iconRow?.classList?.contains('header-product-tile') ||
                isIconElement(iconRow) ||
                iconRow?.querySelector(
                    'img, picture, mas-mnemonic, merch-icon',
                );
            if (hasIconTile) {
                if (isIconElement(iconRow)) {
                    const iconWrapper = createElement('p');
                    let current = iconRow;
                    while (isIconElement(current)) {
                        const next = current.nextElementSibling;
                        iconWrapper.append(current);
                        current = next;
                    }
                    col.insertBefore(iconWrapper, current || null);
                    iconRow = iconWrapper;
                }
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

function createHeaderSection(className, content = []) {
    return createElement(
        'div',
        { class: `header-section ${className}` },
        Array.isArray(content) ? content.filter(Boolean) : content,
    );
}

function replaceElementTag(element, tagName) {
    if (!element || element.tagName.toLowerCase() === tagName) return element;
    const replacement = document.createElement(tagName);
    Array.from(element.attributes).forEach(({ name, value }) => {
        replacement.setAttribute(name, value);
    });
    replacement.append(...Array.from(element.childNodes));
    element.replaceWith(replacement);
    return replacement;
}

function normalizeHeadingWrappers(table) {
    table
        .querySelectorAll(
            '.row-heading p.pricing, .row-heading p.supplemental-text, .row-heading p.pricing-after',
        )
        .forEach((wrapper) => {
            replaceElementTag(wrapper, 'div');
        });
}

function nodeMatchesOrContains(node, selector) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    return node.matches(selector) || Boolean(node.querySelector(selector));
}

function classifyPricingNode(node) {
    if (!node) return '';
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent?.trim() ? 'price' : '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    if (
        nodeMatchesOrContains(
            node,
            `${SELECTOR_MAS_INLINE_PRICE}[data-template="${TEMPLATE_PRICE_LEGAL}"], [data-template="${TEMPLATE_PRICE_LEGAL}"], .price-legal`,
        )
    ) {
        return 'legal';
    }
    if (
        nodeMatchesOrContains(
            node,
            `${SELECTOR_MAS_INLINE_PRICE}[data-template="strikethrough"], [data-template="strikethrough"], .price-strikethrough, .price-promo-strikethrough`,
        )
    ) {
        return 'strikethrough';
    }
    if (
        nodeMatchesOrContains(
            node,
            `${SELECTOR_MAS_INLINE_PRICE}, [data-template], .price, .price-alternative`,
        )
    ) {
        return 'price';
    }
    return '';
}

function createPricingGroupElement(pricingElement, className, nodes = []) {
    const content = nodes.filter(
        (node) =>
            node &&
            (node.nodeType !== Node.TEXT_NODE || node.textContent.trim()),
    );
    if (!content.length) return null;
    return createElement(
        pricingElement.tagName.toLowerCase(),
        {
            class: className,
        },
        content,
    );
}

function splitPricingElement(pricingElement) {
    if (!pricingElement) {
        return { strikethrough: null, price: null, legal: null };
    }

    const groups = {
        strikethrough: [],
        price: [],
        legal: [],
    };
    let lastGroup = '';
    Array.from(pricingElement.childNodes).forEach((node) => {
        let group = classifyPricingNode(node);
        if (!group && node.nodeType === Node.TEXT_NODE) {
            group = lastGroup || 'price';
        }
        if (!group) {
            group = node.textContent?.trim() ? 'price' : lastGroup;
        }
        if (!group) return;
        groups[group].push(node);
        lastGroup = group;
    });

    if (
        !groups.strikethrough.length &&
        !groups.price.length &&
        !groups.legal.length
    ) {
        groups.price = Array.from(pricingElement.childNodes);
    }

    const pricingClasses = Array.from(pricingElement.classList).filter(
        (className) =>
            !['has-pricing-before', 'has-pricing-after'].includes(className),
    );
    const basePricingClassName = pricingClasses.join(' ');

    return {
        strikethrough: createPricingGroupElement(
            pricingElement,
            [basePricingClassName, 'pricing-strikethrough-group']
                .filter(Boolean)
                .join(' '),
            groups.strikethrough,
        ),
        price: createPricingGroupElement(
            pricingElement,
            [basePricingClassName, 'pricing-main-group']
                .filter(Boolean)
                .join(' '),
            groups.price,
        ),
        legal: createElement(
            'div',
            { class: 'pricing-legal-group' },
            groups.legal.filter(
                (node) =>
                    node &&
                    (node.nodeType !== Node.TEXT_NODE ||
                        node.textContent.trim()),
            ),
        ),
    };
}

function normalizeMerchHeadingColumn(col) {
    const directChildren = Array.from(col.children);
    if (!directChildren.length) return;

    const headingContent =
        directChildren.find((child) =>
            child.classList.contains('heading-content'),
        ) || null;
    const headingButton =
        directChildren.find((child) =>
            child.classList.contains('heading-button'),
        ) || null;
    const contentChildren = Array.from(headingContent?.children || []);
    const contentExtras = directChildren.filter(
        (child) =>
            child !== headingContent &&
            child !== headingButton &&
            (child.classList.contains('content-before') ||
                child.classList.contains('content-after')),
    );
    const iconElement =
        contentChildren.find((child) =>
            child.classList.contains('header-product-tile'),
        ) || null;
    const titleElement =
        contentChildren.find((child) =>
            child.classList.contains('tracking-header'),
        ) || null;
    const bodyElement =
        contentChildren.find((child) => child.classList.contains('body')) ||
        null;
    const contentRemainder = contentChildren.filter(
        (child) =>
            child !== iconElement &&
            child !== titleElement &&
            child !== bodyElement,
    );

    const headingButtonChildren = Array.from(headingButton?.children || []);
    const pricingElement =
        headingButtonChildren.find((child) =>
            child.classList.contains('pricing'),
        ) || null;
    const pricingAdjacentElements = headingButtonChildren.filter(
        (child) =>
            child !== pricingElement &&
            !child.classList.contains('buttons-wrapper') &&
            (child.classList.contains('pricing-before') ||
                child.classList.contains('pricing-after') ||
                child.classList.contains('supplemental-text')),
    );
    const buttonsWrapper =
        headingButtonChildren.find((child) =>
            child.classList.contains('buttons-wrapper'),
        ) || null;
    const { strikethrough, price, legal } = splitPricingElement(pricingElement);
    const legalContent = [
        ...pricingAdjacentElements,
        ...(legal?.childNodes ? Array.from(legal.childNodes) : []),
    ];

    const sections = [
        createHeaderSection(
            'header-section-icon',
            iconElement ? [iconElement] : [],
        ),
        createHeaderSection(
            'header-section-title',
            titleElement ? [titleElement] : [],
        ),
        createHeaderSection(
            'header-section-description',
            [...contentExtras, bodyElement, ...contentRemainder].filter(
                Boolean,
            ),
        ),
        createHeaderSection(
            'header-section-price-strikethrough',
            strikethrough ? [strikethrough] : [],
        ),
        createHeaderSection('header-section-price', price ? [price] : []),
        createHeaderSection('header-section-legal', legalContent),
        createHeaderSection(
            'header-section-buttons',
            buttonsWrapper ? [buttonsWrapper] : [],
        ),
    ];

    col.replaceChildren(...sections);
}

function normalizeMerchHeadingSections(table) {
    if (!table.classList.contains('merch')) return;
    const headingColumns = table.querySelectorAll('.row-heading .col-heading');
    headingColumns.forEach((col) => normalizeMerchHeadingColumn(col));
}

function syncMerchHeadingSectionHeights(table) {
    const headingRow = table.querySelector('.row-heading');
    if (!headingRow) {
        setTableHeightRule(table, '');
        return;
    }

    const headingColumns = Array.from(
        headingRow.querySelectorAll(':scope > .col-heading'),
    ).filter(
        (col) =>
            !col.classList.contains('col-1') &&
            !col.classList.contains('hidden') &&
            getComputedStyle(col).display !== 'none',
    );
    if (!headingColumns.length) {
        setTableHeightRule(table, '');
        return;
    }

    const declarations = [];
    MERCH_HEADER_SECTIONS.forEach(({ className, cssVar }) => {
        let maxHeight = 0;
        headingColumns.forEach((col) => {
            const section = col.querySelector(`:scope > .${className}`);
            if (!section) return;
            maxHeight = Math.max(
                maxHeight,
                Math.ceil(section.getBoundingClientRect().height),
            );
        });
        if (maxHeight > 0) {
            declarations.push(`${cssVar}: ${maxHeight}px;`);
        }
    });
    setTableHeightRule(table, createTableHeightRule(table, declarations));
}

function syncHeadingHeights(table) {
    setTableHeightRule(table, '');
    if (table.classList.contains('merch')) {
        syncMerchHeadingSectionHeights(table);
    }
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
            if (!(position === 'pricing' && order === 'after')) {
                anchor?.classList.add(`has-${tagName}`);
            }
            anchor?.insertAdjacentElement(
                order === 'before' ? 'beforebegin' : 'afterend',
                tag,
            );
        });
    });
    setTimeout(() => syncHeadingHeights(table), 0);
    table.addEventListener(
        'mas:resolved',
        debounce(() => {
            syncHeadingHeights(table);
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

function applyCompareChartHeadingRounding(headingCols, highlightCols = []) {
    headingCols.forEach((col, index) => {
        const isOuterColumn = index === 0 || index === headingCols.length - 1;
        const matchingHighlightCol = highlightCols[index];
        const hasHighlight =
            !!matchingHighlightCol &&
            (matchingHighlightCol.innerText ||
                matchingHighlightCol.dataset.hasBadge === 'true');
        col.classList.toggle('no-rounded', !isOuterColumn || hasHighlight);
    });
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
            if (col.innerText || col.dataset.hasBadge === 'true') {
                if (!table.classList.contains('compare-chart-features')) {
                    headingCols[i]?.classList.add('no-rounded');
                }
            } else {
                col.classList.add('hidden');
            }
        });

        if (table.classList.contains('compare-chart-features')) {
            applyCompareChartHeadingRounding(headingCols, firstRowCols);
        }
    } else {
        headingCols = firstRowCols;
        firstRow.classList.add('row-heading');
        if (table.classList.contains('compare-chart-features')) {
            applyCompareChartHeadingRounding(headingCols);
        }
    }

    handleHeading(table, headingCols);
    handleAddOnContent(table);
    normalizeHeadingWrappers(table);
    normalizeMerchHeadingSections(table);
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

    const meaningfulText = textSpan.textContent
        ?.replace(/\u00a0/g, ' ')
        .trim();
    const hasMeaningfulElement = textSpan.querySelector(
        'a, em, strong, b, i, picture, img, mas-mnemonic, merch-icon, [is="inline-price"], .icon, .icon-info, .icon-tooltip, .milo-tooltip, blockquote',
    );
    if (!hasMeaningfulElement && (!meaningfulText || meaningfulText === '-')) {
        cell.replaceChildren();
        return;
    }

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
                if (!merchCol.children.length && merchCol.innerText) {
                    const pTag = createElement(
                        'p',
                        { class: 'merch-col-text' },
                        merchCol.innerText,
                    );
                    merchCol.innerText = '';
                    merchCol.append(pTag);
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
    const startValue =
        isMerch && !table.classList.contains('compare-chart-features') ? 1 : 2;
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

function handleMobileFilterSticky(table, getStickyTop) {
    table._filterObserver?.disconnect();
    const filters = table.parentElement?.querySelector('.filters');
    if (!filters) return;

    const shouldStick =
        isStickyHeader(table) &&
        defineDeviceByScreenSize() === 'MOBILE' &&
        isCompareStyleMobileTable(table);

    filters.classList.toggle('sticky-mobile-compare', shouldStick);
    filters.classList.remove('active');

    if (!shouldStick) {
        filters.style.removeProperty('top');
        return;
    }

    const stickyTop = getStickyTop();
    filters.style.top = `${stickyTop}px`;

    const intercept =
        filters.parentElement?.querySelector('.filters-intercept') ||
        createElement('div', { class: 'filters-intercept' });
    intercept.setAttribute('data-observer-intercept', '');
    filters.insertAdjacentElement('beforebegin', intercept);

    const observer = new IntersectionObserver(
        ([entry]) => {
            filters.classList.toggle('active', !entry.isIntersecting);
        },
        { rootMargin: `-${stickyTop}px` },
    );
    observer.observe(intercept);
    table._filterObserver = observer;
}

function applyStylesBasedOnScreenSize(
    table,
    originTable,
    labels,
    getStickyTop,
) {
    const headingRow = table.querySelector('.row-heading');
    if (!headingRow) {
        dispatchTableHighlightLoaded(table);
        return;
    }

    const isMerch = table.classList.contains('merch');
    const isCompareChart = isCompareStyleMobileTable(table);
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

        if (isCompareChart) {
            table
                .querySelectorAll('.row-heading .col-1, .row-highlight .col-1')
                .forEach((col) => {
                    col.classList.add('hide-mobile');
                    col.style.display = 'none';
                });
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

            if (isCompareChart) {
                table
                    .querySelectorAll(
                        '.row-heading .col-1, .row-highlight .col-1',
                    )
                    .forEach((col) => {
                        col.classList.add('hide-mobile');
                        col.style.display = 'none';
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
            handleMobileFilterSticky(table, getStickyTop);
            if (event) syncHeadingHeights(table);
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
        handleMobileFilterSticky(table, getStickyTop);
    };

    const removeClones = () => {
        table
            .querySelectorAll('.row .col[data-cloned]')
            .forEach((clonedCol) => {
                clonedCol.remove();
            });
    };

    if (!isMerch && !table.querySelector('.row-heading .col-2')) {
        headingRow.style.display = 'block';
        headingRow.querySelector('.col-1')?.style.setProperty('display', 'flex');
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
        if (isCompareChart) {
            table
                .querySelectorAll('.row-heading .col-1, .row-highlight .col-1')
                .forEach((col) => {
                    col.style.removeProperty('display');
                });
        }
        handleMobileFilterSticky(table, getStickyTop);
        [...headingRow.children].forEach(
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
        syncHeadingHeights(el);
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
        syncHeadingHeights(el);
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
        el._filterObserver?.disconnect();
        delete el._stickyObserver;
        delete el._filterObserver;
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

function cloneNodeChildren(node) {
    if (!node) return [];
    return Array.from(node.childNodes).map((child) => child.cloneNode(true));
}

function flattenSlotNodeContent(node) {
    if (!node) return [];
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return [node.cloneNode(true)];
    }

    const cleanNode = stripSlotAttributes(node.cloneNode(true));
    const hasMeaningfulDirectText = Array.from(cleanNode.childNodes).some(
        (child) =>
            child.nodeType === Node.TEXT_NODE && child.textContent.trim(),
    );
    const singleElementChild =
        cleanNode.childElementCount === 1 &&
        cleanNode.firstElementChild &&
        !hasMeaningfulDirectText;

    if (
        singleElementChild &&
        cleanNode.firstElementChild.matches?.(
            `${SELECTOR_MAS_INLINE_PRICE}, ${SELECTOR_MAS_ELEMENT}, merch-icon, merch-badge, mas-mnemonic`,
        )
    ) {
        return [cleanNode.firstElementChild.cloneNode(true)];
    }

    if (singleElementChild) {
        return cloneNodeChildren(cleanNode.firstElementChild);
    }

    if (
        ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(
            cleanNode.tagName,
        )
    ) {
        return cloneNodeChildren(cleanNode);
    }

    return [cleanNode];
}

function stripSlotAttributes(node) {
    if (!node) return node;
    if (node.nodeType !== Node.ELEMENT_NODE) return node;
    node.removeAttribute('slot');
    node.querySelectorAll?.('[slot]').forEach((child) =>
        child.removeAttribute('slot'),
    );
    return node;
}

function normalizeFooterSlotNode(node) {
    if (!node) return node;
    stripSlotAttributes(node);
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

function getFirstSlotNode(card, slotName) {
    return cloneSlotNodes(card, slotName)
        .map(stripSlotAttributes)
        .find(Boolean);
}

function normalizeHeadingTextNode(sourceNode, className) {
    if (!sourceNode) return null;
    const heading = createElement('p', { class: className });
    const content = flattenSlotNodeContent(sourceNode);
    if (content.length) {
        heading.append(...content);
    } else {
        heading.textContent = sourceNode.textContent?.trim() || '';
    }
    return heading.textContent?.trim() || heading.childNodes.length
        ? heading
        : null;
}

function normalizeBodyNode(sourceNode) {
    if (!sourceNode) return null;
    const body = createElement('p', { class: 'body' });
    const content = flattenSlotNodeContent(sourceNode);
    if (content.length) {
        body.append(...content);
    } else {
        body.textContent = sourceNode.textContent?.trim() || '';
    }
    return body.textContent?.trim() || body.childNodes.length ? body : null;
}

function collectPricingNodes(sourceNodes = []) {
    const groups = {
        strikethrough: [],
        price: [],
        legal: [],
    };
    let lastGroup = '';

    sourceNodes.forEach((sourceNode) => {
        const node = stripSlotAttributes(sourceNode.cloneNode(true));
        let group = classifyPricingNode(node);
        if (!group && node.nodeType === Node.TEXT_NODE) {
            group = node.textContent?.trim() ? lastGroup || 'price' : '';
        }
        if (!group && node.textContent?.trim()) {
            group = 'price';
        }
        if (!group) return;
        groups[group].push(node);
        lastGroup = group;
    });

    return groups;
}

function createPricingWrapper(className, nodes = []) {
    const content = nodes.filter(
        (node) =>
            node &&
            (node.nodeType !== Node.TEXT_NODE || node.textContent.trim()),
    );
    if (!content.length) return null;
    return createElement('div', { class: className }, content);
}

function createSyntheticLegalPrice(pricingNodes = []) {
    for (const pricingNode of pricingNodes) {
        if (pricingNode?.nodeType !== Node.ELEMENT_NODE) continue;
        const inlinePrice = pricingNode.matches?.(SELECTOR_MAS_INLINE_PRICE)
            ? pricingNode.cloneNode(true)
            : pricingNode
                  .querySelector?.(SELECTOR_MAS_INLINE_PRICE)
                  ?.cloneNode(true);
        if (!inlinePrice) continue;
        inlinePrice.setAttribute('data-template', TEMPLATE_PRICE_LEGAL);
        inlinePrice.setAttribute('data-display-plan-type', 'true');
        inlinePrice.setAttribute('data-display-per-unit', 'false');
        inlinePrice.setAttribute('data-display-tax', 'false');
        inlinePrice.setAttribute('data-display-old-price', 'false');
        if (!inlinePrice.hasAttribute('data-force-tax-exclusive')) {
            inlinePrice.setAttribute('data-force-tax-exclusive', 'true');
        }
        return inlinePrice;
    }
    return null;
}

function buildCanonicalButtonsWrapper(card) {
    const footerNodes = cloneSlotNodes(card, MINI_COMPARE_CHART_SLOTS.ctas).map(
        stripSlotAttributes,
    );
    const buttons = footerNodes.flatMap((node) => {
        if (node.matches?.('.con-button, button, a.con-button')) return [node];
        return Array.from(
            node.querySelectorAll?.('.con-button, button, a.con-button') || [],
        ).map((button) => button.cloneNode(true));
    });
    if (!buttons.length) return null;

    const wrapper = createElement('div', { class: 'buttons-wrapper' });
    buttons.forEach((button, index) => {
        const container =
            index === 0
                ? createElement('p')
                : createElement('div', {
                      class: 'supplemental-text body-xl action-area',
                  });
        container.append(button);
        wrapper.append(container);
    });
    return wrapper;
}

function buildMerchHeadingContent(card) {
    const fragment = document.createDocumentFragment();
    const headingContent = createElement('div', {
        class: 'heading-content content',
    });
    const headingButton = createElement('div', { class: 'heading-button' });
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
        headingContent.append(iconRow);
    }

    const titleNode = normalizeHeadingTextNode(
        getFirstSlotNode(card, MINI_COMPARE_CHART_SLOTS.title),
        'tracking-header',
    );
    if (titleNode) headingContent.append(titleNode);

    const descriptionNode = normalizeBodyNode(
        getFirstSlotNode(card, MINI_COMPARE_CHART_SLOTS.description),
    );
    if (descriptionNode) headingContent.append(descriptionNode);

    const priceSourceNodes = cloneSlotNodes(
        card,
        MINI_COMPARE_CHART_SLOTS.prices,
    ).flatMap((node) => flattenSlotNodeContent(node));
    const pricingGroups = collectPricingNodes(priceSourceNodes);
    const strikethroughWrapper = createPricingWrapper(
        'pricing-before',
        pricingGroups.strikethrough,
    );
    if (strikethroughWrapper) headingButton.append(strikethroughWrapper);

    const priceWrapper = createPricingWrapper('pricing', pricingGroups.price);
    if (priceWrapper) headingButton.append(priceWrapper);

    const legalNodes = pricingGroups.legal.length
        ? pricingGroups.legal
        : [createSyntheticLegalPrice(pricingGroups.price)].filter(Boolean);
    const legalWrapper = createPricingWrapper('pricing-after', legalNodes);
    if (legalWrapper) headingButton.append(legalWrapper);

    const buttonsWrapper = buildCanonicalButtonsWrapper(card);
    if (buttonsWrapper) headingButton.append(buttonsWrapper);

    fragment.append(headingContent, headingButton);
    return fragment;
}

function getBadgeData(card) {
    if (!card) return null;
    if (card._masTableBadgeData?.contentHtml || card._masTableBadgeData?.text) {
        return card._masTableBadgeData;
    }

    const badgeSlot = card.querySelector('[slot="badge"]');
    const shadowBadge = card.shadowRoot?.getElementById('badge');
    const badgeElement = badgeSlot?.matches('merch-badge')
        ? badgeSlot
        : badgeSlot?.querySelector('merch-badge');
    const contentHtml =
        badgeElement?.innerHTML?.trim() ||
        badgeSlot?.innerHTML?.trim() ||
        shadowBadge?.innerHTML?.trim() ||
        '';
    const text =
        badgeElement?.textContent?.trim() ||
        badgeSlot?.textContent?.trim() ||
        shadowBadge?.textContent?.trim() ||
        card.getAttribute('badge-text') ||
        '';

    if (!contentHtml && !text) return null;

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
        contentHtml,
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
    const content = createElement('span', { class: 'badge-inline-content' });
    const icon = createBadgeIcon(badgeData.icon);
    const hasLabelContent = Boolean(badgeData.contentHtml || badgeData.text);
    if (icon) content.append(icon);
    if (icon && hasLabelContent) {
        content.append(document.createTextNode(' '));
    }
    if (badgeData.contentHtml) {
        const template = document.createElement('template');
        template.innerHTML = badgeData.contentHtml;
        content.append(template.content.cloneNode(true));
    } else if (badgeData.text) {
        content.append(document.createTextNode(badgeData.text));
    }
    return content;
}

function parseBadgeDataFromFields(fields = {}) {
    const badgeValue = fields.badge;
    if (!badgeValue) return null;

    if (typeof badgeValue !== 'string') {
        const text = String(badgeValue).trim();
        if (!text) return null;
        return {
            contentHtml: '',
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
    const contentHtml = badgeElement?.innerHTML?.trim() || '';
    const text = badgeElement?.textContent?.trim() || badgeValue.trim();
    if (!contentHtml && !text) return null;

    return {
        contentHtml,
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
        (!table.classList.contains('merch') &&
            !table.classList.contains('compare-chart-features')) ||
        !table.classList.contains('highlight')
    ) {
        return;
    }

    const highlightRow = table.firstElementChild;
    if (!highlightRow) return;
    const cells = Array.from(highlightRow.children);
    const columnOffset = table.classList.contains('compare-chart-features')
        ? 1
        : 0;

    cardIds.forEach((cardId, index) => {
        const cell = cells[index + columnOffset];
        const badgeData = getBadgeData(merchCardMap.get(cardId));
        if (!cell) return;

        if (!badgeData?.contentHtml && !badgeData?.text) {
            cell.removeAttribute('data-has-badge');
            cell.replaceChildren();
            return;
        }

        cell.dataset.hasBadge = 'true';
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
    if (
        (!table.classList.contains('merch') &&
            !table.classList.contains('compare-chart-features')) ||
        !cardIds?.length
    ) {
        return;
    }
    const rows = Array.from(table.children);
    if (!rows.length) return;
    const headingRowIndex =
        table.classList.contains('highlight') && rows.length > 1 ? 1 : 0;
    const headingRow = rows[headingRowIndex];
    if (!headingRow) return;
    const cells = Array.from(headingRow.children);
    const columnOffset = table.classList.contains('compare-chart-features')
        ? 1
        : 0;

    cardIds.forEach((cardId, index) => {
        const cell = cells[index + columnOffset];
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
        this.#heightRuleStyle = document.createElement('style');
        this.#heightRuleStyle.setAttribute(TABLE_HEIGHT_RULE_ATTR, '');
        this.#content = document.createElement('div');
        this.#scratch = document.createElement('div');
        this.#scratch.className = 'mas-table-scratch';
        this.#scratch.hidden = true;
        this.#scratch.setAttribute('aria-hidden', 'true');
        this.append(
            this.#heightRuleStyle,
            this.#content,
            this.#scratch,
        );
        this.handleAemFragmentEvents = this.handleAemFragmentEvents.bind(this);
    }

    #heightRuleStyle;
    #content;
    #scratch;

    connectedCallback() {
        const tagName = this.localName || TAG_NAME;
        this.#service = getService();
        this.#log ??=
            this.#service?.Log?.module?.(tagName) ??
            this.#service?.log?.module?.(tagName) ??
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
            await settleMasElements(this);
            this.#content
                .querySelectorAll('.table')
                .forEach((table) => syncHeadingHeights(table));
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
        const tagName = this.localName || TAG_NAME;
        const detail = {
            ...this.aemFragment?.fetchInfo,
            ...this.#service?.duration,
            ...details,
            message,
        };
        this.#log?.error?.(`${tagName}: ${message}`, detail);
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
