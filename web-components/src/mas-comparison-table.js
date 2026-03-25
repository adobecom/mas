import {
    EVENT_AEM_ERROR,
    EVENT_AEM_LOAD,
    EVENT_MAS_ERROR,
    EVENT_MAS_READY,
    MARK_DURATION_SUFFIX,
    MARK_START_SUFFIX,
    SELECTOR_MAS_ELEMENT,
    TEMPLATE_PRICE_LEGAL,
} from './constants.js';
import { transformLinkToButton } from './hydrate.js';
import { getService, printMeasure } from './utils.js';

const TAG_NAME = 'mas-comparison-table';
const MARK_PREFIX = 'mas-comparison-table:';
const LOAD_TIMEOUT = 20000;
const DEFAULT_LABELS = {
    'choose-table-column': 'Choose table column',
    'empty-table-cell': 'Empty table cell',
};

const createElement = (tag, attributes = {}, content = null) => {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
        if (value == null) return;
        element.setAttribute(key, value);
    });
    appendContent(element, content);
    return element;
};

const appendContent = (element, content) => {
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
};

const normalizeFields = (fragment) => {
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
};

const getStringField = (fields, name) => {
    const value = fields?.[name];
    if (value == null) return '';
    if (Array.isArray(value)) return String(value[0] ?? '');
    if (typeof value === 'object' && 'value' in value) {
        return String(value.value ?? '');
    }
    return String(value);
};

const getArrayField = (fields, name) => {
    const value = fields?.[name];
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
};

const getLabels = (fragment) => {
    const dictionary = fragment?.dictionary || {};
    return {
        'choose-table-column':
            dictionary['choose-table-column']?.value ||
            dictionary['choose-table-column'] ||
            DEFAULT_LABELS['choose-table-column'],
        'empty-table-cell':
            dictionary['empty-table-cell']?.value ||
            dictionary['empty-table-cell'] ||
            DEFAULT_LABELS['empty-table-cell'],
    };
};

const normalizeFragmentReference = (reference) => {
    if (reference?.type === 'content-fragment' && reference.value) {
        return {
            ...reference.value,
            path: reference.path || reference.value.path || '',
            fields: normalizeFields(reference.value),
        };
    }
    return {
        ...reference,
        path: reference?.path || '',
        fields: normalizeFields(reference),
    };
};

const normalizeReferences = (references = []) => {
    if (!references || typeof references !== 'object') return [];
    return Array.isArray(references) ? references : Object.values(references);
};

const buildReferenceLookup = (references = []) => {
    const map = new Map();
    normalizeReferences(references).forEach((reference) => {
        const normalized = normalizeFragmentReference(reference);
        const keys = [
            normalized.id,
            normalized.path,
            normalized.originalId,
            normalized.fields?.originalId,
            normalized.path?.split('/').pop(),
        ].filter(Boolean);
        keys.forEach((key) => map.set(String(key), normalized));
    });
    return map;
};

const parseCompareChart = (compareChartHtml = '') => {
    if (!compareChartHtml) return [];

    const doc = new DOMParser().parseFromString(compareChartHtml, 'text/html');
    return [...doc.querySelectorAll('.compare-chart-row[data-row-id]')].map(
        (rowElement) => {
            const cellsByPath = {};
            rowElement
                .querySelectorAll('.compare-chart-cell[data-card-path]')
                .forEach((cellElement) => {
                    const cardPath = cellElement.getAttribute('data-card-path');
                    if (!cardPath) return;
                    cellsByPath[cardPath] = cellElement.innerHTML || '';
                });

            return {
                id: rowElement.getAttribute('data-row-id') || '',
                label:
                    rowElement.querySelector('.compare-chart-label')
                        ?.innerHTML || '',
                cellsByPath,
            };
        },
    );
};

const cloneHtmlNodes = (html = '') => {
    if (!html) return [];
    const template = document.createElement('template');
    template.innerHTML = html;
    return Array.from(template.content.childNodes).map((node) =>
        node.cloneNode(true),
    );
};

const createSyntheticLegalPrice = (pricingHtml = '') => {
    if (!pricingHtml) return '';
    const template = document.createElement('template');
    template.innerHTML = pricingHtml;
    const inlinePrice = template.content.querySelector('[is="inline-price"]');
    if (!inlinePrice) return '';
    inlinePrice.setAttribute('data-template', TEMPLATE_PRICE_LEGAL);
    inlinePrice.setAttribute('data-display-plan-type', 'true');
    inlinePrice.setAttribute('data-display-per-unit', 'false');
    inlinePrice.setAttribute('data-display-tax', 'false');
    inlinePrice.setAttribute('data-display-old-price', 'false');
    if (!inlinePrice.hasAttribute('data-force-tax-exclusive')) {
        inlinePrice.setAttribute('data-force-tax-exclusive', 'true');
    }
    return inlinePrice.outerHTML;
};

const createIconNodes = (fields) => {
    const icons = getArrayField(fields, 'mnemonicIcon');
    const alts = getArrayField(fields, 'mnemonicAlt');
    return icons.filter(Boolean).map((src, index) =>
        createElement('mas-mnemonic', {
            src,
            size: 'l',
            ...(alts[index] ? { role: 'img', 'aria-label': alts[index] } : {}),
        }),
    );
};

const COMPARISON_TABLE_CTA_MAPPING = {
    ctas: {
        size: 'l',
    },
};

const hydrateComparisonTableButton = (button) =>
    transformLinkToButton(
        button,
        { consonant: true },
        COMPARISON_TABLE_CTA_MAPPING,
    );

const buildHeaderItem = (reference) => {
    const fields = reference?.fields || {};
    const headerItem = createElement('div');
    const iconNodes = createIconNodes(fields);
    if (iconNodes.length) {
        headerItem.append(
            createElement('p', { class: 'header-product-tile' }, iconNodes),
        );
    }

    const title = getStringField(fields, 'cardTitle') || reference?.title || '';
    if (title) headerItem.append(createElement('h3', {}, title));

    headerItem.append(createElement('p', {}, '-'));

    const descriptionHtml = getStringField(fields, 'description');
    if (descriptionHtml) {
        const description = createElement('p');
        description.append(...cloneHtmlNodes(descriptionHtml));
        headerItem.append(description);
    }

    headerItem.append(createElement('p', {}, '-'));

    const priceHtml = getStringField(fields, 'prices');
    if (priceHtml) {
        const pricing = createElement('div');
        pricing.append(...cloneHtmlNodes(priceHtml));
        headerItem.append(pricing);
    }

    const legalHtml = createSyntheticLegalPrice(priceHtml);
    if (legalHtml) {
        const legal = createElement('p');
        legal.append(...cloneHtmlNodes(legalHtml));
        headerItem.append(legal);
    }

    const ctasHtml = getStringField(fields, 'ctas');
    if (ctasHtml) {
        const ctaTemplate = document.createElement('template');
        ctaTemplate.innerHTML = ctasHtml;
        const buttons = Array.from(
            ctaTemplate.content.querySelectorAll('a, button'),
        );
        buttons.forEach((button, index) => {
            const wrapper = createElement(index === 0 ? 'p' : 'div', {
                class: 'action-area',
            });
            const hydratedButton =
                button.tagName === 'A'
                    ? hydrateComparisonTableButton(button)
                    : button.cloneNode(true);
            wrapper.append(hydratedButton);
            headerItem.append(wrapper);
        });
    }

    return headerItem;
};

const buildSectionHeaderRow = (cardCount, labelHtml = 'Features') => {
    const row = createElement('div');
    const label = createElement('div');
    label.append(...cloneHtmlNodes(labelHtml || 'Features'));
    row.append(label);
    for (let index = 0; index < cardCount; index += 1) {
        row.append(createElement('div'));
    }
    return row;
};

const hasMeaningfulHtml = (html = '') => {
    if (!html?.trim()) return false;
    const template = document.createElement('template');
    template.innerHTML = html;
    const text = template.content.textContent?.trim();
    if (text) return true;
    return Boolean(
        template.content.querySelector(
            'img, picture, svg, mas-mnemonic, merch-icon, .icon, [is="inline-price"], a, sp-icon-checkmark',
        ),
    );
};

const isSectionRow = (rowData, cardEntries) =>
    Boolean(rowData?.label?.trim()) &&
    cardEntries.every((entry) => {
        const value =
            rowData.cellsByPath?.[entry.cardRef] ||
            rowData.cellsByPath?.[entry.path] ||
            rowData.cellsByPath?.[entry.id] ||
            '';
        return !hasMeaningfulHtml(value);
    });

const groupCompareRows = (compareRows, cardEntries) => {
    const sections = [];
    let currentSection = {
        labelHtml: 'Features',
        rows: [],
    };

    compareRows.forEach((rowData) => {
        if (isSectionRow(rowData, cardEntries)) {
            if (currentSection.rows.length || sections.length === 0) {
                sections.push(currentSection);
            }
            currentSection = {
                labelHtml: rowData.label || 'Features',
                rows: [],
            };
            return;
        }

        currentSection.rows.push(rowData);
    });

    if (currentSection.rows.length || !sections.length) {
        sections.push(currentSection);
    }

    return sections.filter((section) => section.rows.length);
};

const buildFeatureRow = (rowData, cardEntries) => {
    const row = createElement('div');
    const label = createElement('div');
    label.append(...cloneHtmlNodes(rowData.label));
    row.append(label);

    cardEntries.forEach((entry) => {
        const cell = createElement('div');
        const value =
            rowData.cellsByPath?.[entry.cardRef] ||
            rowData.cellsByPath?.[entry.path] ||
            rowData.cellsByPath?.[entry.id] ||
            '';
        cell.append(...cloneHtmlNodes(value));
        row.append(cell);
    });

    return row;
};

const calculateMaxHeight = (elements) =>
    Math.max(
        ...elements.map((element) => {
            const styles = window.getComputedStyle(element);
            return (
                element.offsetHeight -
                parseFloat(styles.paddingTop) -
                parseFloat(styles.paddingBottom) -
                parseFloat(styles.borderTopWidth) -
                parseFloat(styles.borderBottomWidth)
            );
        }),
    );

const setEqualHeight = (el) => {
    const configs = [
        [
            '.header-content-wrapper',
            '.header-item',
            '.sub-header-item-container:not(:last-of-type)',
        ],
        ['.table-row', '.table-cell', 'div'],
        ['.header-content-wrapper', '.header-item', '.description'],
    ];

    const runEqualHeight = (parentSelector, childSelector, targetSelector) => {
        el.querySelectorAll(parentSelector).forEach((parent) => {
            const children = parent.querySelectorAll(childSelector);
            if (!children.length) return;
            const elementsByPosition = [];

            children.forEach((child) => {
                child
                    .querySelectorAll(targetSelector)
                    .forEach((target, index) => {
                        if (!elementsByPosition[index])
                            elementsByPosition[index] = [];
                        target.style.minHeight = 'auto';
                        target.classList.remove('zero-height');
                        elementsByPosition[index].push(target);
                    });
            });

            elementsByPosition.forEach((elements) => {
                if (!elements.length) return;
                const maxHeight = calculateMaxHeight(elements);
                elements.forEach((element) => {
                    if (maxHeight === 0) element.classList.add('zero-height');
                    element.style.minHeight = `${maxHeight}px`;
                });
            });
        });
    };

    const refresh = () => {
        configs.forEach(([parent, child, target]) => {
            runEqualHeight(parent, child, target);
        });
    };

    const onResize = () => refresh();
    window.addEventListener('resize', onResize);
    refresh();
    el._comparisonTableRefreshHeights = refresh;

    return () => {
        delete el._comparisonTableRefreshHeights;
        window.removeEventListener('resize', onResize);
    };
};

const getFirstVisibleColumnIndex = (el) => {
    const firstVisible = [
        ...el.querySelectorAll('.header-item[data-column-index]'),
    ].find((item) => !item.classList.contains('hidden'));
    return firstVisible
        ? parseInt(firstVisible.getAttribute('data-column-index'), 10)
        : -1;
};

const syncAccessibilityHeaders = (el) => {
    const accessibilityHeaderRow = el.querySelector(
        '.accessibility-header-row',
    );
    if (!accessibilityHeaderRow) return;

    const visibleHeaderItems = [
        ...el.querySelectorAll('.header-item:not(.hidden)'),
    ];
    const visibleColumnIndices = new Set(
        visibleHeaderItems.map((item) =>
            item.getAttribute('data-column-index'),
        ),
    );

    visibleHeaderItems.forEach((headerItem) => {
        const columnIndex = headerItem.getAttribute('data-column-index');
        const cell = accessibilityHeaderRow.querySelector(
            `[data-column-index="${columnIndex}"]`,
        );
        if (!cell) return;
        cell.classList.remove('hidden');
        accessibilityHeaderRow.append(cell);
    });

    [
        ...accessibilityHeaderRow.querySelectorAll(
            '.accessibility-header-cell',
        ),
    ].forEach((cell) => {
        const columnIndex = cell.getAttribute('data-column-index');
        if (columnIndex !== '-1' && !visibleColumnIndices.has(columnIndex)) {
            cell.classList.add('hidden');
        }
    });
};

const updateVisibleSelects = ({ el, headerTitles }) => {
    const visibleSelects = [
        ...el.querySelectorAll(
            '.header-item:not(.hidden) .mobile-filter-select',
        ),
    ];
    const selectedIndices = new Set(
        visibleSelects.map((select) => parseInt(select.value, 10)),
    );

    visibleSelects.forEach((select) => {
        const currentValue = parseInt(select.value, 10);
        select.innerHTML = '';
        headerTitles.forEach((title, index) => {
            if (
                !title ||
                (selectedIndices.has(index) && index !== currentValue)
            )
                return;
            const option = createElement('option', { value: index }, title);
            if (index === currentValue) option.selected = true;
            select.append(option);
        });
    });
};

const handleSelectChange = (event, { headerItemIndex, el, headerTitles }) => {
    const newValue = parseInt(event.target.value, 10);
    const isFirstVisible = headerItemIndex === getFirstVisibleColumnIndex(el);

    el.querySelectorAll(`[data-column-index="${headerItemIndex}"]`).forEach(
        (node) => node.classList.add('hidden'),
    );
    el.querySelectorAll(`[data-column-index="${newValue}"]`).forEach((node) => {
        node.classList.remove('hidden');
        if (!isFirstVisible) return;
        const parent = node.parentNode;
        if (!parent) return;
        const firstHeaderItem = parent.querySelector(
            '.header-item:first-child',
        );
        if (
            node.classList.contains('header-item') &&
            firstHeaderItem !== node
        ) {
            parent.insertBefore(node, firstHeaderItem.nextSibling);
            return;
        }
        const rowHeader = parent.querySelector('.table-row-header');
        if (rowHeader) parent.insertBefore(node, rowHeader.nextSibling);
    });

    const selectElement = el.querySelector(
        `[data-column-index="${newValue}"] .mobile-filter-select`,
    );
    if (selectElement) selectElement.value = String(newValue);
    updateVisibleSelects({ el, headerTitles });
    syncAccessibilityHeaders(el);
    el._comparisonTableRefreshHeights?.();
};

const createMobileFilterSelect = ({ headerTitles, headerItemIndex, el }) => {
    const select = createElement('select', {
        class: 'mobile-filter-select',
        name: 'column-filter',
        'aria-label': DEFAULT_LABELS['choose-table-column'],
    });
    headerTitles.forEach((title, index) => {
        if (
            !title ||
            (headerItemIndex === 1 && index === 2) ||
            (headerItemIndex === 2 && index === 1)
        ) {
            return;
        }
        const option = createElement('option', { value: index }, title);
        if (index === headerItemIndex) option.selected = true;
        select.append(option);
    });
    select.addEventListener('change', (event) =>
        handleSelectChange(event, { headerItemIndex, el, headerTitles }),
    );
    return select;
};

const addLastContainerElements = (container) => {
    const actionAreas = container.querySelectorAll('.action-area');
    if (actionAreas.length) {
        const buttonContainer = createElement('div', {
            class: 'btn-container',
        });
        if (actionAreas.length > 1) {
            buttonContainer.classList.add('has-multiple');
        }
        buttonContainer.append(...actionAreas);
        container.append(buttonContainer);
    }

    let description = container.querySelector('p:not(.action-area)');
    if (!description) {
        description = createElement('p', { class: 'description' });
        container.prepend(description);
        return;
    }
    description.classList.add('description');
};

const createSubHeaderContainer = ({
    containerIndex,
    childrenArray,
    startIndex,
    endIndex,
    el,
    headerTitles,
    headerItemIndex,
    headerItemsCount,
}) => {
    const container = createElement('div', {
        class: 'sub-header-item-container',
    });
    const isLast = containerIndex === 2;

    for (let index = startIndex; index < endIndex; index += 1) {
        const child = childrenArray[index];
        if (child && child.textContent.trim() !== '-') {
            container.append(child);
        }
    }

    if (containerIndex === 0 && headerItemsCount > 3) {
        container.append(
            createMobileFilterSelect({ headerTitles, headerItemIndex, el }),
        );
    }
    if (!isLast) return container;

    addLastContainerElements(container);
    return container;
};

const decorateHeaderItem = ({
    headerItem,
    headerTitles,
    headerItemIndex,
    el,
    headerItemsCount,
}) => {
    headerItem.classList.add('header-item');
    headerItem.setAttribute('data-column-index', headerItemIndex);
    const childrenArray = [...headerItem.children];
    let containerIndex = 0;
    let lastIndex = -1;

    childrenArray.forEach((child, index) => {
        if (
            child.textContent.trim() !== '-' &&
            index !== childrenArray.length - 1
        )
            return;
        const separatorIndex =
            child.textContent.trim() === '-' ? index : childrenArray.length;
        const container = createSubHeaderContainer({
            childrenArray,
            startIndex: lastIndex + 1,
            endIndex: separatorIndex,
            el,
            containerIndex,
            headerTitles,
            headerItemIndex,
            headerItemsCount,
        });
        headerItem.append(container);
        childrenArray[separatorIndex]?.remove();
        containerIndex += 1;
        lastIndex = separatorIndex;
    });
};

const decorateHeader = (el, headerContent) => {
    headerContent.classList.add('header-content');
    const wrapper = createElement('div', { class: 'header-content-wrapper' });
    wrapper.append(...headerContent.children);
    headerContent.append(wrapper);
    const headerItems = [...wrapper.children];
    const headerTitles = headerItems.map(
        (item) =>
            item.querySelector('h1, h2, h3, h4, h5, h6')?.textContent.trim() ||
            '',
    );

    headerItems.forEach((headerItem, headerItemIndex) => {
        if (!headerItem.innerHTML?.trim()) {
            headerItem.remove();
            return;
        }
        decorateHeaderItem({
            headerItem,
            headerTitles,
            headerItemIndex,
            el,
            headerItemsCount: headerItems.length,
        });
    });

    wrapper.prepend(createElement('div', { class: 'header-item' }));
    headerContent.after(
        createElement('div', {
            class: 'header-content-dummy',
            'aria-hidden': true,
        }),
    );
};

const createAccessibilityHeaderRow = (el) => {
    const headerRow = createElement('div', {
        class: 'table-row accessibility-header-row',
        role: 'row',
    });
    headerRow.append(
        createElement('div', {
            class: 'accessibility-header-cell',
            role: 'cell',
            'data-column-index': -1,
        }),
    );

    [...el.querySelectorAll('.header-item[data-column-index]')].forEach(
        (headerItem) => {
            const title = headerItem
                .querySelector('h1, h2, h3, h4, h5, h6')
                ?.textContent.trim();
            const cell = createElement('div', {
                class: 'accessibility-header-cell',
                role: 'columnheader',
                'data-column-index':
                    headerItem.getAttribute('data-column-index'),
            });
            cell.textContent = title || '';
            headerRow.append(cell);
        },
    );
    return headerRow;
};

const decorateTableToggleButton = ({ tableChild, tableElement }) => {
    [...tableChild.children].forEach((child, childIndex) => {
        if (childIndex !== 0 && !child.textContent.trim()) child.remove();
    });
    tableChild.classList.add('table-column-header');
    const firstChild = tableChild.children[0];
    const button = createElement('button', { 'aria-expanded': true });
    button.innerHTML = firstChild?.innerHTML || 'Features';
    button.append(createElement('span', { class: 'toggle-icon' }));
    button.addEventListener('click', () => {
        tableElement.classList.toggle('hide');
        button.setAttribute(
            'aria-expanded',
            String(button.getAttribute('aria-expanded') !== 'true'),
        );
    });
    tableChild.replaceChildren(button);
    return () => {
        button.replaceWith(createElement('div', {}, button.innerHTML));
    };
};

const processCellContent = (cell) => {
    const cellDiv = createElement('div');
    if (cell.children.length > 1 || !cell.textContent.trim()) {
        cellDiv.append(...Array.from(cell.childNodes));
    } else {
        cellDiv.append(createElement('p', {}, cell.innerHTML));
    }
    cell.innerHTML = '';
    cell.append(cellDiv);
};

const decorateTableCells = ({ tableChild, emptyCellLabel }) => {
    [...tableChild.children].forEach((child, childIndex) => {
        if (childIndex === 0) {
            child.classList.add('table-row-header');
            child.setAttribute('role', 'rowheader');
            return;
        }

        child.classList.add('table-cell');
        child.setAttribute('data-column-index', childIndex);
        child.setAttribute('role', 'cell');
        processCellContent(child);

        const cellDiv = child.querySelector('div');
        const content = cellDiv?.textContent?.trim() || '';
        if (!content) {
            const srOnly = createElement(
                'span',
                { class: 'sr-only' },
                emptyCellLabel,
            );
            cellDiv?.append(srOnly);
        }
    });

    tableChild.classList.add('table-row');
    tableChild.setAttribute('role', 'row');
};

const decorateSingleTable = (el, children, emptyCellLabel) => {
    const tableContainer = createElement('div', { class: 'table-container' });
    const tableElement = createElement('div', {
        class: 'table-body',
        role: 'table',
    });

    children.forEach((child, index) => {
        if (index === 0) {
            decorateTableToggleButton({ tableChild: child, tableElement });
            tableContainer.append(child);
            return;
        }
        decorateTableCells({ tableChild: child, emptyCellLabel });
        tableElement.append(child);
    });

    tableElement.prepend(createAccessibilityHeaderRow(el));
    tableContainer.append(tableElement);
    el.append(tableContainer);
};

const decorateTables = (el, tableGroups, emptyCellLabel) => {
    tableGroups.forEach((children) => {
        decorateSingleTable(el, children, emptyCellLabel);
    });
};

const setupResponsiveHiding = (el) => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    const reorderElementsByColumnIndex = (elements) => {
        const array = [...elements].filter((element) =>
            element.hasAttribute('data-column-index'),
        );
        const parent = array[0]?.parentNode;
        if (!parent) return;

        array
            .sort(
                (a, b) =>
                    parseInt(a.getAttribute('data-column-index'), 10) -
                    parseInt(b.getAttribute('data-column-index'), 10),
            )
            .forEach((element) => {
                element.classList.remove('hidden');
                parent.append(element);
            });
    };

    const hideElements = (elements, isMobile, header = false) => {
        const totalColumns = header ? elements.length - 1 : elements.length;
        if (totalColumns <= 2) return;
        const startIndexToHide = header ? 3 : 2;
        elements.forEach((element, index) => {
            if (index < startIndexToHide) return;
            element.classList.toggle('hidden', isMobile);
        });
    };

    const handleResponsive = (event) => {
        const isMobile = event ? event.matches : mediaQuery.matches;

        if (!isMobile) {
            reorderElementsByColumnIndex(
                el.querySelectorAll('.header-item[data-column-index]'),
            );
            el.querySelectorAll('.table-row').forEach((row) => {
                reorderElementsByColumnIndex(
                    row.querySelectorAll('.table-cell'),
                );
            });
            [
                ...el.querySelectorAll(
                    '.header-item[data-column-index] .mobile-filter-select',
                ),
            ].forEach((select) => {
                const columnIndex = select
                    ?.closest('.header-item')
                    ?.getAttribute('data-column-index');
                if (columnIndex != null) select.value = columnIndex;
            });
        }

        hideElements(el.querySelectorAll('.header-item'), isMobile, true);
        el.querySelectorAll('.table-row').forEach((row) =>
            hideElements(row.querySelectorAll('.table-cell'), isMobile),
        );
        syncAccessibilityHeaders(el);
    };

    handleResponsive();
    mediaQuery.addEventListener('change', handleResponsive);
    return () => mediaQuery.removeEventListener('change', handleResponsive);
};

const setupStickyHeader = (el) => {
    const headerContent = el.querySelector('.header-content');
    const headerDummy = el.querySelector('.header-content-dummy');
    if (!headerContent || !headerDummy) return () => {};
    let isSticky = false;

    const calculateOffset = () => {
        const header = document.querySelector('header');
        const headerOffset =
            header && getComputedStyle(header).position === 'sticky'
                ? header.offsetHeight
                : 0;
        const fedsNav = document.querySelector('.feds-localnav');
        return headerOffset + (fedsNav?.offsetHeight || 0);
    };

    let totalOffset = calculateOffset();
    const observer = new IntersectionObserver(
        ([entry]) => {
            if (
                !el.offsetHeight ||
                entry.boundingClientRect.top > window.innerHeight * 0.5
            )
                return;
            if (!entry.isIntersecting && !isSticky) {
                totalOffset = calculateOffset();
                const firstChild = headerContent.querySelector(
                    '.sub-header-item-container:first-child',
                );
                const secondChild = headerContent.querySelector(
                    '.sub-header-item-container:nth-of-type(2)',
                );
                const deductHeight =
                    (secondChild?.offsetHeight || 0) +
                    (headerContent.querySelector(
                        '.sub-header-item-container:last-child .description',
                    )?.offsetHeight || 0) +
                    (headerContent.querySelector('.mobile-filter-select')
                        ?.offsetHeight || 0) +
                    (parseFloat(
                        getComputedStyle(firstChild || headerContent)
                            .paddingBottom,
                    ) || 0) +
                    (parseFloat(
                        getComputedStyle(firstChild || headerContent)
                            .borderTopWidth,
                    ) || 0) +
                    (parseFloat(
                        getComputedStyle(firstChild || headerContent)
                            .borderBottomWidth,
                    ) || 0) +
                    (parseFloat(
                        getComputedStyle(secondChild || headerContent)
                            .borderTopWidth,
                    ) || 0) +
                    (parseFloat(
                        getComputedStyle(secondChild || headerContent)
                            .borderBottomWidth,
                    ) || 0);

                const adjustedHeight =
                    headerContent.offsetHeight - deductHeight;
                if (adjustedHeight / window.innerHeight >= 0.45) return;

                const beforeHeight = headerContent.offsetHeight;
                headerContent.style.top = `${totalOffset}px`;
                headerContent.classList.add('sticky');
                headerDummy.style.height = `${beforeHeight - headerContent.offsetHeight}px`;
                isSticky = true;
                return;
            }

            if (entry.isIntersecting && isSticky) {
                headerContent.classList.remove('sticky');
                headerContent.style.top = '';
                headerDummy.style.height = '';
                isSticky = false;
            }
        },
        { rootMargin: `-${totalOffset}px 0px 0px 0px` },
    );

    observer.observe(headerDummy);
    return () => observer.disconnect();
};

const settleMasElements = async (root) => {
    const masElements = [...root.querySelectorAll(SELECTOR_MAS_ELEMENT)];
    await Promise.all(
        masElements.map((element) => {
            if (typeof element.onceSettled !== 'function') {
                return Promise.resolve(element);
            }
            return element.onceSettled().catch(() => element);
        }),
    );
};

export class MasComparisonTable extends HTMLElement {
    #cleanup = [];
    #currentRenderId = 0;
    #content;
    #log;
    #resolveUpdate;
    #rejectUpdate;
    #service;
    #startMarkName;
    #durationMarkName;
    #updateComplete = Promise.resolve(this);

    constructor() {
        super();
        this.handleAemFragmentEvents = this.handleAemFragmentEvents.bind(this);
    }

    ensureContent() {
        if (this.#content?.isConnected) return this.#content;
        this.#content = this.querySelector(
            ':scope > .mas-comparison-table-content',
        );
        if (this.#content) return this.#content;
        this.#content = document.createElement('div');
        this.#content.className = 'mas-comparison-table-content';
        this.append(this.#content);
        return this.#content;
    }

    connectedCallback() {
        this.ensureContent();
        this.#service = getService();
        this.#log ??=
            this.#service?.Log?.module?.(TAG_NAME) ??
            this.#service?.log?.module?.(TAG_NAME) ??
            console;
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

    cleanup() {
        this.#cleanup.splice(0).forEach((fn) => fn?.());
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
        if (
            event.type !== EVENT_AEM_LOAD ||
            event.target !== this.aemFragment
        ) {
            return;
        }

        this.removeAttribute('failed');
        this.beginUpdate();
        const renderId = ++this.#currentRenderId;
        try {
            await this.renderFragment(event.detail);
            if (renderId !== this.#currentRenderId) return;
            await settleMasElements(this);
            const measure = performance.measure(
                this.#durationMarkName,
                this.#startMarkName,
            );
            this.dispatchEvent(
                new CustomEvent(EVENT_MAS_READY, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        ...this.aemFragment?.fetchInfo,
                        ...this.#service?.duration,
                        measure: printMeasure(measure),
                    },
                }),
            );
            this.#resolveUpdate?.(this);
        } catch (error) {
            if (renderId !== this.#currentRenderId) return;
            this.fail(error.message || 'Failed to render comparison table');
        }
    }

    async renderFragment(fragment) {
        const content = this.ensureContent();
        const fields = normalizeFields(fragment);
        const compareChart = getStringField(fields, 'compareChart').trim();
        if (!compareChart) {
            throw new Error('compareChart field is missing');
        }

        const compareRows = parseCompareChart(compareChart);
        if (!compareRows.length) {
            throw new Error(
                'compareChart does not contain .compare-chart rows',
            );
        }

        const referenceLookup = buildReferenceLookup(fragment.references || []);
        const cardEntries = getArrayField(fields, 'cards')
            .map(String)
            .map((cardRef) => {
                const reference = referenceLookup.get(cardRef);
                return {
                    cardRef,
                    id: reference?.id || '',
                    path: reference?.path || '',
                    reference,
                };
            })
            .filter((entry) => entry.reference);

        if (!cardEntries.length) {
            throw new Error('No card references found');
        }

        this.cleanup();
        content.replaceChildren();

        const block = createElement('div', { class: 'comparison-table' });
        const header = createElement('div');
        cardEntries.forEach((entry) => {
            header.append(buildHeaderItem(entry.reference));
        });
        block.append(header);
        const sections = groupCompareRows(compareRows, cardEntries);
        const tableGroups = sections.map((section) => [
            buildSectionHeaderRow(cardEntries.length, section.labelHtml),
            ...section.rows.map((rowData) =>
                buildFeatureRow(rowData, cardEntries),
            ),
        ]);

        content.append(block);
        decorateHeader(block, header);
        decorateTables(
            block,
            tableGroups,
            getLabels(fragment)['empty-table-cell'],
        );
        const equalHeightCleanup = setEqualHeight(block);
        const stickyCleanup = setupStickyHeader(block);
        const responsiveCleanup = setupResponsiveHiding(block);
        this.#cleanup.push(
            equalHeightCleanup,
            stickyCleanup,
            responsiveCleanup,
        );
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
        this.#log?.error?.(`${TAG_NAME}: ${message}`, detail);
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
                const message =
                    result === 'timeout'
                        ? `AEM fragment was not resolved within ${LOAD_TIMEOUT} timeout`
                        : 'AEM fragment cannot be loaded';
                this.fail(message);
                throw new Error(message);
            }
        }

        const result = await Promise.race([
            this.updateComplete,
            timeoutPromise,
        ]);
        if (result === 'timeout') {
            const message = `${TAG_NAME} was not resolved within ${LOAD_TIMEOUT} timeout`;
            this.fail(message);
            throw new Error(message);
        }
        return result;
    }
}

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, MasComparisonTable);
}
