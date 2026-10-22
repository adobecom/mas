import { html } from 'lit';
import { extractBackgroundUrl } from '../image-markup.js';

// The default is desktop background.
export const BACKGROUNDS_DETAIL_BREAKPOINTS = ['tablet', 'mobile'];

export function populateBackgroundsDetail(card, detail) {
    const picture = card.querySelector('[slot="backgrounds"]');
    const inner = picture?.innerHTML ?? '';
    BACKGROUNDS_DETAIL_BREAKPOINTS.forEach((breakpoint) => {
        const valueEl = detail.querySelector(
            `[data-backgrounds-breakpoint="${breakpoint}"]`,
        );
        if (!valueEl) return;
        valueEl.replaceChildren();
        const url = extractBackgroundUrl(inner, breakpoint);
        if (!url) {
            valueEl.textContent = '—';
            return;
        }
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.alt = '';
        img.src = url;
        valueEl.append(img);
    });
}

/** Builds the click handler for a variant's "See all backgrounds" toggle.
 *  `getCard` is a thunk so the handler always reads the variant's current
 *  `this.card` rather than capturing it once at construction time. The
 *  default row (desktop) stays visible at all times; the detail only adds
 *  tablet and mobile. */
export function makeToggleBackgroundsDetail(getCard) {
    return function toggleBackgroundsDetail(e) {
        const card = getCard();
        const detail = card.shadowRoot?.querySelector(
            '.headless-backgrounds-detail',
        );
        if (!detail) return;
        const expanding = detail.classList.contains('hidden');
        if (expanding) populateBackgroundsDetail(card, detail);
        detail.classList.toggle('hidden', !expanding);
        e.target.textContent = expanding
            ? 'Show default only'
            : 'See all backgrounds';
    };
}

/** Builds a `slotchange` handler that keeps an expanded detail in sync when
 *  the backgrounds slot is re-hydrated (e.g. after a Studio edit or restore). */
export function makeRefreshBackgroundsDetail(getCard) {
    return function refreshBackgroundsDetail() {
        const card = getCard();
        const detail = card.shadowRoot?.querySelector(
            '.headless-backgrounds-detail',
        );
        if (!detail || detail.classList.contains('hidden')) return;
        populateBackgroundsDetail(card, detail);
    };
}

export function renderBackgroundsToggleButton(onClick) {
    return html`
        <button
            type="button"
            class="headless-backgrounds-toggle"
            @click="${onClick}"
        >
            See all backgrounds
        </button>
    `;
}

function breakpointLabel(breakpoint) {
    return `Background ${breakpoint[0].toUpperCase()}${breakpoint.slice(1)}`;
}

export function renderBackgroundsDetailRow() {
    return html`
        <div class="headless-row headless-backgrounds-detail hidden">
            ${BACKGROUNDS_DETAIL_BREAKPOINTS.map(
                (breakpoint) => html`
                    <div class="headless-backgrounds-detail-row">
                        <span class="headless-label"
                            >${breakpointLabel(breakpoint)}</span
                        >
                        <span
                            class="headless-value"
                            data-backgrounds-breakpoint="${breakpoint}"
                        ></span>
                    </div>
                `,
            )}
        </div>
    `;
}
