export const normalizeCompareChartKey = (value) => {
    const normalized = String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\//g, '')
        .replace(/[^a-z0-9&]+/g, '-')
        .replace(/&/g, '')
        .replace(/^-+|-+$/g, '');
    return normalized || 'item';
};

const htmlFromCell = (cell) =>
    Array.from(cell.childNodes)
        .map((node) => {
            if (node.nodeType === Node.TEXT_NODE) return node.textContent;
            if (node.nodeType === Node.ELEMENT_NODE) return node.outerHTML;
            return '';
        })
        .join('')
        .replace(/\s+/g, ' ')
        .trim();

export const cellValueFromTableCell = (cell) => {
    const aria = cell
        .querySelector('[aria-label]')
        ?.getAttribute('aria-label')
        ?.trim()
        .toLowerCase();
    if (aria === 'yes') return '✓';
    if (aria === 'no') return '✗';
    if (cell.querySelector('.icon-checkmark-no-fill, .icon-checkmark')) {
        return '✓';
    }
    if (cell.querySelector('.icon-crossmark')) return '✗';
    return htmlFromCell(cell);
};

const rowHeaderHtml = (cell) => htmlFromCell(cell).replace(/\s+/g, ' ').trim();

const rowHeaderLabel = (cell) => {
    const header = cell.querySelector('.ctv2-th-header');
    return (header?.textContent || cell.textContent || '')
        .replace(/:$/, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const uniqueKey = (base, used) => {
    const normalizedBase = normalizeCompareChartKey(base);
    let key = normalizedBase;
    let index = 2;
    while (used.has(key)) {
        key = `${normalizedBase}-${index}`;
        index += 1;
    }
    used.add(key);
    return key;
};

export const parseCompareChartTables = (root) => {
    const usedGroupNames = new Set();
    return Array.from(root.querySelectorAll(':scope > table')).map((table) => {
        const headerCells = Array.from(
            table.querySelectorAll(':scope > thead > tr:first-child > th'),
        );
        const sectionHeader = headerCells[0];
        const label = (sectionHeader?.textContent || '')
            .replace(/\s+/g, ' ')
            .trim();
        const columns = headerCells
            .slice(1)
            .map((cell) => cell.textContent.replace(/\s+/g, ' ').trim());
        const usedRowNames = new Set();
        const rows = Array.from(
            table.querySelectorAll(':scope > tbody > tr'),
        ).map((tr) => {
            const cells = Array.from(tr.children);
            const rowHeader =
                cells.find((cell) => cell.matches('th[scope="row"], th')) ||
                cells[0];
            const labelText = rowHeaderLabel(rowHeader);
            return {
                name: uniqueKey(labelText, usedRowNames),
                html: rowHeaderHtml(rowHeader),
                cells: cells
                    .slice(cells.indexOf(rowHeader) + 1)
                    .map(cellValueFromTableCell),
            };
        });

        return {
            name: uniqueKey(label, usedGroupNames),
            label,
            labelHtml: sectionHeader ? rowHeaderHtml(sectionHeader) : label,
            columns,
            rows,
        };
    });
};
