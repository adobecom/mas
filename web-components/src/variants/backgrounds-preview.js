import { html } from 'lit';
import { extractBackgroundUrl } from '../backgrounds-markup.js';

export const BACKGROUNDS_BREAKPOINTS = ['desktop', 'tablet', 'mobile'];

export function populateBackgroundsDetail(card, detail) {
    const picture = card.querySelector('[slot="backgrounds"]');
    const inner = picture?.innerHTML ?? '';
    BACKGROUNDS_BREAKPOINTS.forEach((breakpoint) => {
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

/** Builds the click handler for a variant's "See all breakpoints" toggle.
 *  `getCard` is a thunk so the handler always reads the variant's current
 *  `this.card` rather than capturing it once at construction time. */
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
            : 'See all breakpoints';
    };
}

export function renderBackgroundsToggleButton(onClick) {
    return html`
        <button
            type="button"
            class="headless-backgrounds-toggle"
            @click="${onClick}"
        >
            See all breakpoints
        </button>
    `;
}

export function renderBackgroundsDetailRow() {
    return html`
        <div class="headless-row headless-backgrounds-detail hidden">
            ${BACKGROUNDS_BREAKPOINTS.map(
                (breakpoint) => html`
                    <div class="headless-backgrounds-detail-row">
                        <span class="headless-label">
                            ${breakpoint[0].toUpperCase()}${breakpoint.slice(1)}
                        </span>
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
