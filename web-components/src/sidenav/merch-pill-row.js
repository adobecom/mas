import { html, css, LitElement, nothing } from 'lit';

export const EVENT_MERCH_PILL_ROW_OVERFLOW = 'merch-pill-row:overflow';

/**
 * Horizontal row of filter pills. When the pills do not fit, carets appear and
 * each click moves by a full set of pills (one row width), and the row reports
 * the overflow so the host can switch to the stacked search-above-pills layout.
 */
export class MerchPillRow extends LitElement {
    static properties = {
        overflowing: { type: Boolean, reflect: true },
        atStart: { type: Boolean, state: true },
        atEnd: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.overflowing = false;
        this.atStart = true;
        this.atEnd = true;
        this.measure = this.measure.bind(this);
    }

    get scroller() {
        return this.shadowRoot.querySelector('#pills');
    }

    connectedCallback() {
        super.connectedCallback();
        this.resizeObserver = new ResizeObserver(this.measure);
        this.resizeObserver.observe(this);
    }

    disconnectedCallback() {
        this.resizeObserver?.disconnect();
        super.disconnectedCallback();
    }

    firstUpdated() {
        this.measure();
    }

    measure() {
        const scroller = this.scroller;
        if (!scroller) return;
        const overflowing = scroller.scrollWidth > scroller.clientWidth + 1;
        this.atStart = Math.abs(scroller.scrollLeft) < 1;
        this.atEnd =
            Math.abs(scroller.scrollLeft) + scroller.clientWidth >=
            scroller.scrollWidth - 1;
        if (overflowing === this.overflowing) return;
        this.overflowing = overflowing;
        this.dispatchEvent(
            new CustomEvent(EVENT_MERCH_PILL_ROW_OVERFLOW, {
                bubbles: true,
                composed: true,
                detail: { overflowing },
            }),
        );
    }

    /** Moves by one full set of pills rather than a single pill. */
    page(direction) {
        const scroller = this.scroller;
        const rtl = getComputedStyle(this).direction === 'rtl';
        scroller.scrollBy({
            left: (rtl ? -direction : direction) * scroller.clientWidth,
            behavior: 'smooth',
        });
    }

    caret(direction, disabled) {
        if (!this.overflowing) return nothing;
        const label = direction < 0 ? 'Previous filters' : 'Next filters';
        return html`<button
            type="button"
            class="caret ${direction < 0 ? 'prev' : 'next'}"
            aria-label="${label}"
            ?disabled=${disabled}
            @click=${() => this.page(direction)}
        ></button>`;
    }

    render() {
        return html`${this.caret(-1, this.atStart)}
            <div id="pills" @scroll=${this.measure}>
                <slot @slotchange=${this.measure}></slot>
            </div>
            ${this.caret(1, this.atEnd)}`;
    }

    static styles = css`
        :host {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
        }

        #pills {
            display: flex;
            flex: 1;
            gap: 8px;
            min-width: 0;
            overflow-x: hidden;
        }

        ::slotted(*) {
            flex: none;
            white-space: nowrap;
        }

        .caret {
            flex: none;
            width: 32px;
            height: 32px;
            border: 1px solid var(--spectrum-gray-400, #909090);
            border-radius: 50%;
            background: var(--spectrum-white, #fff) no-repeat center;
            background-size: 12px;
            cursor: pointer;
        }

        .caret.prev {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M8 1 3 6l5 5' fill='none' stroke='%23222' stroke-width='1.5'/%3E%3C/svg%3E");
        }

        .caret.next {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='m4 1 5 5-5 5' fill='none' stroke='%23222' stroke-width='1.5'/%3E%3C/svg%3E");
        }

        :host(:dir(rtl)) .caret {
            transform: scaleX(-1);
        }

        .caret[disabled] {
            opacity: 0.4;
            cursor: default;
        }
    `;
}

customElements.define('merch-pill-row', MerchPillRow);
