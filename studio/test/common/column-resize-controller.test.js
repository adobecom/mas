import { expect, fixture, html as testHtml } from '@open-wc/testing';
import { LitElement, html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import {
    COLUMN_RESIZE_STEP,
    ColumnResizeController,
    MAX_COLUMN_WIDTH,
    MIN_COLUMN_WIDTH,
    clampColumnWidth,
    columnResizeStyles,
} from '../../src/common/column-resize-controller.js';

const COLUMNS = [
    { key: 'first', label: 'First' },
    { key: 'second', label: 'Second' },
];

class ResizeHost extends LitElement {
    static styles = columnResizeStyles(COLUMNS, { match: 'class' });

    columnResize = new ColumnResizeController(this);

    headClicks = 0;

    render() {
        return html`<sp-table
            style=${styleMap(this.columnResize.tableStyle())}
            data-resized-columns=${ifDefined(this.columnResize.resizedColumns)}
        >
            <sp-table-head>
                ${COLUMNS.map(
                    ({ key, label }) =>
                        html`<sp-table-head-cell class=${key} @click=${() => this.headClicks++}>
                            ${label} ${this.columnResize.handle(key, label)}
                        </sp-table-head-cell>`,
                )}
            </sp-table-head>
            <sp-table-body>
                <sp-table-row>
                    <sp-table-cell class="first">a</sp-table-cell>
                    <sp-table-cell class="second">b</sp-table-cell>
                </sp-table-row>
            </sp-table-body>
        </sp-table>`;
    }
}
customElements.define('resize-host-test', ResizeHost);

const handleOf = (el, key) => el.shadowRoot.querySelector(`sp-table-head-cell.${key} .column-resize-handle`);
const press = (handle, key) =>
    handle.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }));

describe('ColumnResizeController', () => {
    it('clamps widths to the allowed range', () => {
        expect(clampColumnWidth(1)).to.equal(MIN_COLUMN_WIDTH);
        expect(clampColumnWidth(99999)).to.equal(MAX_COLUMN_WIDTH);
    });

    it('reflects set widths in the table style and attribute', async () => {
        const el = await fixture(testHtml`<resize-host-test></resize-host-test>`);
        expect(el.columnResize.resizedColumns).to.be.undefined;
        el.columnResize.setWidth('first', 200);
        await el.updateComplete;
        const table = el.shadowRoot.querySelector('sp-table');
        expect(table.getAttribute('data-resized-columns')).to.equal('first');
        expect(table.style.getPropertyValue('--mas-col-first-width')).to.equal('200px');
    });

    it('steps by arrow keys and stops at the minimum', async () => {
        const el = await fixture(testHtml`<resize-host-test></resize-host-test>`);
        el.columnResize.setWidth('first', 200);
        const handle = handleOf(el, 'first');
        press(handle, 'ArrowRight');
        press(handle, 'ArrowRight');
        expect(el.columnResize.widths.get('first')).to.equal(200 + 2 * COLUMN_RESIZE_STEP);
        for (let i = 0; i < 100; i++) press(handle, 'ArrowLeft');
        expect(el.columnResize.widths.get('first')).to.equal(MIN_COLUMN_WIDTH);
    });

    it('pins every column on the first resize so rows keep lining up', async () => {
        const el = await fixture(testHtml`<resize-host-test></resize-host-test>`);
        press(handleOf(el, 'first'), 'ArrowRight');
        expect([...el.columnResize.widths.keys()]).to.have.members(['first', 'second']);
    });

    it('does not let handle events reach the header cell', async () => {
        const el = await fixture(testHtml`<resize-host-test></resize-host-test>`);
        const handle = handleOf(el, 'first');
        handle.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
        expect(el.headClicks).to.equal(0);
    });
});
