import { html, unsafeCSS } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/** Smallest width, in px, a resizable column can take. Provisional until UX confirms. */
export const MIN_COLUMN_WIDTH = 56;

/** Largest width, in px, a resizable column can take. Provisional until UX confirms. */
export const MAX_COLUMN_WIDTH = 800;

/** Width change, in px, applied by one Arrow Left / Arrow Right key press. */
export const COLUMN_RESIZE_STEP = 16;

/**
 * Clamps a column width to the allowed range.
 * @param {number} width width in px
 * @returns {number} width between MIN_COLUMN_WIDTH and MAX_COLUMN_WIDTH
 */
export const clampColumnWidth = (width) => Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, Math.round(width)));

const stop = (event) => event.stopPropagation();

/**
 * Lit reactive controller holding per-column pixel widths (in memory, per host) for an sp-table.
 * Bind `tableStyle()` and `resizedColumns` on the sp-table, render `handle()` in each header cell and
 * include `columnResizeStyles()` in the host styles.
 */
export class ColumnResizeController {
    /** @type {Map<string, number>} */
    widths = new Map();

    #dragging = null;

    /**
     * @param {import('lit').ReactiveControllerHost} host
     * @param {{ columns: { key: string, label: string }[] }} options
     */
    constructor(host, { columns }) {
        this.host = host;
        this.columns = columns;
        host.addController(this);
    }

    /**
     * Sets a column width, clamped to the allowed range, and re-renders the host.
     * @param {string} key column key
     * @param {number} px width in px
     */
    setWidth(key, px) {
        this.widths.set(key, clampColumnWidth(px));
        this.host.requestUpdate();
    }

    /**
     * Changes a column width relative to its current width.
     * @param {string} key column key
     * @param {number} deltaPx change in px
     * @param {number} [currentPx] width to start from when the column has not been resized yet
     */
    adjust(key, deltaPx, currentPx = MIN_COLUMN_WIDTH) {
        this.setWidth(key, (this.widths.get(key) ?? currentPx) + deltaPx);
    }

    /**
     * Custom properties carrying the widths of resized columns, for lit's styleMap.
     * @returns {Record<string, string>}
     */
    tableStyle() {
        const style = {};
        for (const [key, width] of this.widths) style[`--mas-col-${key}-width`] = `${width}px`;
        return style;
    }

    /**
     * Space separated keys of resized columns, for the `data-resized-columns` attribute.
     * @returns {string | undefined}
     */
    get resizedColumns() {
        return this.widths.size ? [...this.widths.keys()].join(' ') : undefined;
    }

    #measure(event) {
        return event.currentTarget.closest('sp-table-head-cell').getBoundingClientRect().width;
    }

    #onPointerDown(key, event) {
        event.stopPropagation();
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        this.#dragging = { startX: event.clientX, startWidth: this.widths.get(key) ?? this.#measure(event) };
    }

    #onPointerMove(key, event) {
        if (!this.#dragging) return;
        event.stopPropagation();
        this.setWidth(key, this.#dragging.startWidth + event.clientX - this.#dragging.startX);
    }

    #onPointerUp(event) {
        event.stopPropagation();
        this.#dragging = null;
    }

    #onKeyDown(key, event) {
        const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
        if (direction) {
            this.adjust(key, direction * COLUMN_RESIZE_STEP, this.#measure(event));
        } else if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    }

    /**
     * Renders the focusable resize handle for a header cell.
     * @param {string} key column key
     * @param {string} label column label used for the accessible name
     */
    handle(key, label) {
        return html`<span
            class="column-resize-handle"
            role="separator"
            aria-orientation="vertical"
            tabindex="0"
            aria-label="Resize ${label} column"
            aria-valuenow=${ifDefined(this.widths.get(key))}
            aria-valuemin=${MIN_COLUMN_WIDTH}
            aria-valuemax=${MAX_COLUMN_WIDTH}
            @pointerdown=${(event) => this.#onPointerDown(key, event)}
            @pointermove=${(event) => this.#onPointerMove(key, event)}
            @pointerup=${(event) => this.#onPointerUp(event)}
            @pointercancel=${(event) => this.#onPointerUp(event)}
            @mousedown=${stop}
            @mouseup=${stop}
            @click=${stop}
            @dblclick=${stop}
            @keydown=${(event) => this.#onKeyDown(key, event)}
        ></span>`;
    }
}

/**
 * Builds the CSS for resizable columns: resized-column widths for header and body cells, the handle,
 * and horizontal overflow of the table. Rules only apply to columns listed in `data-resized-columns`,
 * so default column styling is untouched until the author resizes.
 * @param {{ key: string }[]} columns column definitions
 * @param {{ match: 'class' | 'index' }} options `class` matches cells by `.key`, `index` by position
 * @returns {import('lit').CSSResult}
 */
export const columnResizeStyles = (columns, { match }) => {
    const resized = columns.map(({ key }, index) => {
        const head = match === 'class' ? `.${key}` : `:nth-of-type(${index + 1})`;
        const scope = `sp-table[data-resized-columns~='${key}']`;
        const width = `var(--mas-col-${key}-width)`;
        return `${scope} sp-table-head-cell${head}, ${scope} sp-table-cell${head} {
    flex: 0 0 ${width} !important;
    width: ${width} !important;
    min-width: ${width} !important;
    max-width: ${width} !important;
    box-sizing: border-box;
}`;
    });
    return unsafeCSS(`
sp-table[data-resized-columns] {
    overflow-x: auto;
}
sp-table[data-resized-columns] sp-table-head,
sp-table[data-resized-columns] sp-table-row {
    min-width: max-content;
}
sp-table-head-cell {
    position: relative;
}
.column-resize-handle {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 8px;
    cursor: col-resize;
    touch-action: none;
    z-index: 1;
}
.column-resize-handle:hover {
    background: var(--spectrum-gray-300, #d5d5d5);
}
.column-resize-handle:focus-visible {
    outline: 2px solid var(--spectrum-blue-800, #2680eb);
    outline-offset: -2px;
}
${resized.join('\n')}
`);
};
