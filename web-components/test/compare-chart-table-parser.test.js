import { expect } from '@esm-bundle/chai';
import {
    cellValueFromTableCell,
    normalizeCompareChartKey,
    parseCompareChartTables,
} from '../src/compare-chart-table-parser.js';

const parse = (html) => {
    const doc = new DOMParser().parseFromString(
        `<mas-compare-chart>${html}</mas-compare-chart>`,
        'text/html',
    );
    return doc.body.querySelector('mas-compare-chart');
};

describe('normalizeCompareChartKey', () => {
    it('slugifies plain text', () => {
        expect(normalizeCompareChartKey('Top Features')).to.equal(
            'top-features',
        );
    });

    it('strips diacritics', () => {
        expect(normalizeCompareChartKey('Catégorie Spéciale')).to.equal(
            'categorie-speciale',
        );
    });

    it('drops slashes and ampersands', () => {
        expect(normalizeCompareChartKey('Photo & Video / Editing')).to.equal(
            'photo-video-editing',
        );
    });

    it('falls back to "item" for empty input', () => {
        expect(normalizeCompareChartKey('')).to.equal('item');
        expect(normalizeCompareChartKey(null)).to.equal('item');
        expect(normalizeCompareChartKey('   ')).to.equal('item');
    });

    it('trims leading and trailing separators', () => {
        expect(normalizeCompareChartKey('---Hello---')).to.equal('hello');
    });
});

describe('cellValueFromTableCell', () => {
    const cellFromHTML = (html) => {
        const cell = document.createElement('td');
        cell.innerHTML = html;
        return cell;
    };

    it('returns ✓ for aria-label="yes"', () => {
        expect(
            cellValueFromTableCell(
                cellFromHTML('<span aria-label="yes"></span>'),
            ),
        ).to.equal('✓');
    });

    it('returns ✗ for aria-label="no"', () => {
        expect(
            cellValueFromTableCell(
                cellFromHTML('<span aria-label="no"></span>'),
            ),
        ).to.equal('✗');
    });

    it('returns ✓ for icon-checkmark classes', () => {
        expect(
            cellValueFromTableCell(
                cellFromHTML('<i class="icon-checkmark"></i>'),
            ),
        ).to.equal('✓');
        expect(
            cellValueFromTableCell(
                cellFromHTML('<i class="icon-checkmark-no-fill"></i>'),
            ),
        ).to.equal('✓');
    });

    it('returns ✗ for icon-crossmark', () => {
        expect(
            cellValueFromTableCell(
                cellFromHTML('<i class="icon-crossmark"></i>'),
            ),
        ).to.equal('✗');
    });

    it('returns trimmed inner HTML for plain content', () => {
        expect(
            cellValueFromTableCell(cellFromHTML('  Hello <b>World</b>  ')),
        ).to.equal('Hello <b>World</b>');
    });

    it('collapses whitespace', () => {
        expect(cellValueFromTableCell(cellFromHTML('a\n\n  b\t\tc'))).to.equal(
            'a b c',
        );
    });

    it('returns HTML for mixed icon + text content without aria-label/checkmark hints', () => {
        // No aria=yes/no and no icon-checkmark/crossmark classes, so the cell
        // should fall through to htmlFromCell — both the icon and the prose.
        expect(
            cellValueFromTableCell(
                cellFromHTML('<i class="icon-star"></i> Premium tier'),
            ),
        ).to.equal('<i class="icon-star"></i> Premium tier');
    });
});

describe('parseCompareChartTables', () => {
    it('returns an empty list when no tables present', () => {
        expect(
            parseCompareChartTables(parse('<div name="x"></div>')),
        ).to.deep.equal([]);
    });

    it('extracts label, columns, and rows from a single table', () => {
        const root = parse(`
            <table>
                <thead>
                    <tr>
                        <th>Top features</th>
                        <th>Plan A</th>
                        <th>Plan B</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">Storage</th>
                        <td>1 TB</td>
                        <td>2 TB</td>
                    </tr>
                    <tr>
                        <th scope="row">Cloud sync</th>
                        <td><span aria-label="yes"></span></td>
                        <td><span aria-label="no"></span></td>
                    </tr>
                </tbody>
            </table>
        `);
        const [group] = parseCompareChartTables(root);
        expect(group.name).to.equal('top-features');
        expect(group.label).to.equal('Top features');
        expect(group.columns).to.deep.equal(['Plan A', 'Plan B']);
        expect(group.rows).to.have.length(2);
        expect(group.rows[0].name).to.equal('storage');
        expect(group.rows[0].cells).to.deep.equal(['1 TB', '2 TB']);
        expect(group.rows[1].cells).to.deep.equal(['✓', '✗']);
    });

    it('de-duplicates repeated row + group names', () => {
        const root = parse(`
            <table>
                <thead><tr><th>Features</th><th>A</th></tr></thead>
                <tbody>
                    <tr><th>Same</th><td>1</td></tr>
                    <tr><th>Same</th><td>2</td></tr>
                </tbody>
            </table>
            <table>
                <thead><tr><th>Features</th><th>A</th></tr></thead>
                <tbody><tr><th>Other</th><td>3</td></tr></tbody>
            </table>
        `);
        const groups = parseCompareChartTables(root);
        expect(groups.map((g) => g.name)).to.deep.equal([
            'features',
            'features-2',
        ]);
        expect(groups[0].rows.map((r) => r.name)).to.deep.equal([
            'same',
            'same-2',
        ]);
    });

    it('strips trailing colons from row header labels', () => {
        const root = parse(`
            <table>
                <thead><tr><th>Group</th><th>A</th></tr></thead>
                <tbody><tr><th>Storage:</th><td>1 TB</td></tr></tbody>
            </table>
        `);
        const [group] = parseCompareChartTables(root);
        expect(group.rows[0].name).to.equal('storage');
    });

    it('only parses direct child tables, not nested ones', () => {
        const root = parse(`
            <table>
                <thead><tr><th>Outer</th><th>A</th></tr></thead>
                <tbody>
                    <tr>
                        <th>Row</th>
                        <td>
                            <table><tbody><tr><th>Inner</th><td>1</td></tr></tbody></table>
                        </td>
                    </tr>
                </tbody>
            </table>
        `);
        const groups = parseCompareChartTables(root);
        expect(groups).to.have.length(1);
        expect(groups[0].label).to.equal('Outer');
    });
});
