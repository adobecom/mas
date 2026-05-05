import { html, LitElement, nothing } from 'lit';
import { styles } from './mas-comparison-table.css.js';

const MAS_COMPARISON_TABLE = 'mas-comparison-table';
const MOBILE_QUERY = '(max-width: 899px)';

const GLYPH_ALIASES = {
    included: ['✓', '✔', '✅'],
    excluded: ['✗', '✘', '✖', '×'],
    notApplicable: ['—', '-'],
};

const isIncluded = (t) => GLYPH_ALIASES.included.includes(t);
const isExcluded = (t) => GLYPH_ALIASES.excluded.includes(t);
const isNotApplicable = (t) => !t || GLYPH_ALIASES.notApplicable.includes(t) || /^-+$/.test(t);

const placeholder = (host, key, fallback) =>
    host.placeholders?.[key] ?? fallback;

let cardSeq = 0;

export class MasComparisonTable extends LitElement {
    static properties = {
        expandedGroups: {
            type: String,
            attribute: 'expanded-groups',
            reflect: true,
        },
        staticHeader: {
            type: Boolean,
            attribute: 'static-header',
            reflect: true,
        },
        placeholders: { type: Object },
    };

    static styles = styles;

    #internals;
    #cards = []; // canonical column-major order
    #cellsByCard = new Map(); // cardId -> array of cell <p> moved into the host
    #groups = []; // [{ heading, headingEl, rows: [{ slot, labelEl, tooltipEl?, rowIndex }] }]
    #rowSlotIndex = new Map(); // 'pdf-tools@view' -> { rowIndex, groupIndex }
    #expandedGroupIndices = new Set();
    #mql;
    #mqlListener;
    #intersectionObserver;
    #mutationObserver;
    #stickyTopOffset = 0;
    #selectionA = 0;
    #selectionB = 1;
    #hydrating = false;

    constructor() {
        super();
        this.#internals = this.attachInternals?.();
        if (this.#internals) this.#internals.role = 'table';
    }

    connectedCallback() {
        super.connectedCallback();
        this.#mql = window.matchMedia(MOBILE_QUERY);
        this.#mqlListener = () => this.#applyResponsive();
        this.#mql.addEventListener('change', this.#mqlListener);
        this.#mutationObserver = new MutationObserver(() => this.#hydrate());
        this.#mutationObserver.observe(this, {
            childList: true,
            subtree: true,
            characterData: true,
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#mql?.removeEventListener('change', this.#mqlListener);
        this.#intersectionObserver?.disconnect();
        this.#mutationObserver?.disconnect();
    }

    firstUpdated() {
        this.#hydrate();
        this.#setupSticky();
    }

    updated(changed) {
        if (changed.has('expandedGroups')) this.#parseExpanded();
    }

    /* ---------- hydration ---------- */

    #hydrate() {
        if (this.#hydrating) return;
        this.#hydrating = true;
        try {
            this.#indexCards();
            this.#indexRows();
            this.#parseExpanded();
            this.#extractCells();
            this.#applyResponsive();
            this.requestUpdate();
        } finally {
            this.#hydrating = false;
        }
    }

    #indexCards() {
        const cards = Array.from(
            this.querySelectorAll(':scope > merch-card[slot="product"]'),
        );
        cards.forEach((card, i) => {
            if (!card.dataset.cardId) {
                card.dataset.cardId = `cc-${++cardSeq}`;
            }
            card.dataset.columnIndex = String(i + 1);
            card.style.setProperty('--col', i + 1);
            if (card.hasAttribute('primary')) {
                card.dataset.primary = 'true';
            }
        });
        // Save canonical order only on first run
        if (this.#cards.length !== cards.length) {
            this.#cards = cards.slice();
        }
        this.toggleAttribute('data-child-count', cards.length === 3);
        if (cards.length === 3) this.setAttribute('data-child-count', '3');
        this.style.setProperty('--comparison-cols', cards.length);
    }

    #indexRows() {
        this.#groups = [];
        this.#rowSlotIndex.clear();

        let currentGroup = null;
        let groupIndex = 0;
        let rowIndex = 1;

        Array.from(this.children).forEach((node) => {
            if (node.tagName === 'H4' && node.getAttribute('slot') === 'group') {
                currentGroup = {
                    heading: node.textContent.trim(),
                    headingEl: node,
                    groupIndex: ++groupIndex,
                    rows: [],
                };
                this.#groups.push(currentGroup);
                return;
            }
            if (node.tagName !== 'P') return;
            const slot = node.getAttribute('slot') || '';
            if (slot.startsWith('feature@') && currentGroup) {
                const key = slot.slice('feature@'.length);
                rowIndex++;
                const tooltipEl = this.querySelector(
                    `:scope > p[slot="tooltip@${CSS.escape(key)}"]`,
                );
                currentGroup.rows.push({
                    slot: key,
                    labelEl: node,
                    tooltipEl,
                    rowIndex,
                });
                this.#rowSlotIndex.set(key, {
                    rowIndex,
                    groupIndex: currentGroup.groupIndex,
                });
                node.style.setProperty('--row', rowIndex);
            }
        });
    }

    #parseExpanded() {
        const v = (this.expandedGroups ?? '').trim();
        const total = this.#groups.length;
        this.#expandedGroupIndices = new Set();
        if (!v) {
            if (total > 0) this.#expandedGroupIndices.add(1);
        } else if (v === 'all') {
            for (let i = 1; i <= total; i++) this.#expandedGroupIndices.add(i);
        } else {
            v.split(',')
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => !isNaN(n))
                .forEach((n) => this.#expandedGroupIndices.add(n));
        }
    }

    /**
     * For each card, dedup `<p slot="<group>@<feature>">` by slot (last wins),
     * decorate (role/aria/glyph wrap), stamp --row/--col, and move the cells
     * out of the card to be direct children of the host so they project
     * into the per-row cell slot in shadow DOM.
     */
    #extractCells() {
        this.#cellsByCard.clear();
        const cards = Array.from(
            this.querySelectorAll(':scope > merch-card[slot="product"]'),
        );
        cards.forEach((card) => {
            const cardId = card.dataset.cardId;
            const colIndex = parseInt(card.dataset.columnIndex, 10);
            const isPrimary = card.hasAttribute('primary');
            const cells = Array.from(card.querySelectorAll(':scope > p[slot]'));
            const lastBySlot = new Map();
            cells.forEach((p) => {
                const slot = p.getAttribute('slot') || '';
                if (slot.startsWith('feature@')) return;
                if (slot.startsWith('tooltip@')) return;
                if (!slot.includes('@')) return;
                lastBySlot.set(slot, p);
            });
            // Remove every cell from the card
            cells.forEach((p) => {
                if (p.parentNode === card) card.removeChild(p);
            });
            // Re-attach survivors to the host with stamps
            const survivors = [];
            for (const [slotKey, p] of lastBySlot) {
                const rowEntry = this.#rowSlotIndex.get(slotKey);
                if (!rowEntry) continue; // orphan; ignore but keep no warn here
                p.setAttribute('role', 'cell');
                p.dataset.cardId = cardId;
                p.style.setProperty('--row', rowEntry.rowIndex);
                p.style.setProperty('--col', colIndex);
                if (isPrimary) p.classList.add('primary-cell');
                this.#decorateCell(p);
                this.appendChild(p);
                survivors.push(p);
            }
            this.#cellsByCard.set(cardId, survivors);
        });
    }

    #decorateCell(p) {
        const text = p.textContent.trim();
        if (isIncluded(text)) {
            p.setAttribute(
                'aria-label',
                placeholder(this, 'included', 'Included'),
            );
            this.#wrapGlyphs(p);
        } else if (isExcluded(text)) {
            p.setAttribute(
                'aria-label',
                placeholder(this, 'not-included', 'Not included'),
            );
            this.#wrapGlyphs(p);
        } else if (isNotApplicable(text)) {
            p.setAttribute(
                'aria-label',
                placeholder(this, 'not-applicable', 'Not applicable'),
            );
            if (!text) {
                const sr = document.createElement('span');
                sr.className = 'empty-cell-sr';
                sr.textContent = placeholder(
                    this,
                    'empty-table-cell',
                    'Not applicable',
                );
                p.textContent = '—';
                const glyph = document.createElement('span');
                glyph.setAttribute('aria-hidden', 'true');
                glyph.textContent = '—';
                p.replaceChildren(glyph, sr);
            }
        } else {
            p.removeAttribute('aria-label');
            this.#wrapGlyphs(p);
        }
    }

    #wrapGlyphs(p) {
        const all = [
            ...GLYPH_ALIASES.included,
            ...GLYPH_ALIASES.excluded,
            ...GLYPH_ALIASES.notApplicable,
        ];
        Array.from(p.childNodes).forEach((node) => {
            if (node.nodeType !== Node.TEXT_NODE) return;
            const t = node.textContent;
            if (!all.some((g) => t.includes(g))) return;
            const frag = document.createDocumentFragment();
            for (const ch of t) {
                if (all.includes(ch)) {
                    const span = document.createElement('span');
                    span.setAttribute('aria-hidden', 'true');
                    span.textContent = ch;
                    frag.appendChild(span);
                } else {
                    frag.appendChild(document.createTextNode(ch));
                }
            }
            node.replaceWith(frag);
        });
    }

    /* ---------- responsive ---------- */

    #applyResponsive() {
        const isMobile = !!this.#mql?.matches;
        if (isMobile) this.#enterMobile();
        else this.#exitMobile();
    }

    #enterMobile() {
        if (this.#cards.length <= 2) return;
        const a = this.#cards[this.#selectionA];
        const b = this.#cards[this.#selectionB];
        if (!a || !b) return;
        // Reorder light DOM: A first, B second; rest hidden.
        this.#cards.forEach((card) => {
            card.removeAttribute('hidden');
        });
        this.insertBefore(a, this.firstChild);
        this.insertBefore(b, a.nextSibling);
        this.#cards.forEach((card, i) => {
            if (i === this.#selectionA || i === this.#selectionB) return;
            card.setAttribute('hidden', '');
            (this.#cellsByCard.get(card.dataset.cardId) || []).forEach((p) =>
                p.setAttribute('hidden', ''),
            );
        });
        // Show selected cells
        [a, b].forEach((card) => {
            (this.#cellsByCard.get(card.dataset.cardId) || []).forEach((p) =>
                p.removeAttribute('hidden'),
            );
        });
    }

    #exitMobile() {
        this.#cards.forEach((card, i) => {
            card.removeAttribute('hidden');
            (this.#cellsByCard.get(card.dataset.cardId) || []).forEach((p) =>
                p.removeAttribute('hidden'),
            );
            // Restore canonical order
            if (this.children[i] !== card) {
                this.insertBefore(card, this.children[i] || null);
            }
        });
    }

    #onSelectChange(side, e) {
        const idx = parseInt(e.target.value, 10);
        if (isNaN(idx)) return;
        if (side === 'A') {
            if (idx === this.#selectionB)
                this.#selectionB = this.#selectionA;
            this.#selectionA = idx;
        } else {
            if (idx === this.#selectionA)
                this.#selectionA = this.#selectionB;
            this.#selectionB = idx;
        }
        this.#enterMobile();
        this.#announceSelection();
        this.requestUpdate();
    }

    #announceSelection() {
        const a = this.#cards[this.#selectionA];
        const b = this.#cards[this.#selectionB];
        const labelOf = (c) =>
            c?.querySelector('[slot="heading-xs"]')?.textContent?.trim() ?? '';
        const tmpl = placeholder(
            this,
            'compare-announcement',
            'Now comparing {a} and {b}',
        );
        const live = this.shadowRoot?.querySelector('.compare-live');
        if (live)
            live.textContent = tmpl
                .replace('{a}', labelOf(a))
                .replace('{b}', labelOf(b));
    }

    /* ---------- sticky ---------- */

    #setupSticky() {
        if (this.staticHeader) return;
        const dummy = this.shadowRoot.querySelector('.header-content-dummy');
        const header = this.shadowRoot.querySelector('.header-content');
        if (!dummy || !header) return;
        // top offset: any sticky <header> + .feds-localnav
        const headerEl = document.querySelector('header');
        const localnav = document.querySelector('.feds-localnav');
        const top =
            (headerEl?.getBoundingClientRect().height || 0) +
            (localnav?.getBoundingClientRect().height || 0);
        this.#stickyTopOffset = top;
        this.style.setProperty('--comparison-sticky-top', `${top}px`);

        this.#intersectionObserver = new IntersectionObserver(
            (entries) => {
                const e = entries[0];
                if (!e) return;
                const headerH = header.getBoundingClientRect().height;
                const ok = headerH < window.innerHeight * 0.45;
                header.classList.toggle('sticky', !e.isIntersecting && ok);
            },
            { rootMargin: `-${top}px 0px 0px 0px`, threshold: 0 },
        );
        this.#intersectionObserver.observe(dummy);
    }

    /* ---------- accordion ---------- */

    #toggleGroup(groupIndex) {
        if (this.#expandedGroupIndices.has(groupIndex)) {
            this.#expandedGroupIndices.delete(groupIndex);
        } else {
            this.#expandedGroupIndices.add(groupIndex);
        }
        this.requestUpdate();
    }

    /* ---------- tooltip ---------- */

    #toggleTooltip(e) {
        const trigger = e.currentTarget;
        const popover = trigger.nextElementSibling;
        if (!popover) return;
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!expanded));
        popover.toggleAttribute('hidden', expanded);
    }

    #onTooltipKey(e) {
        if (e.key === 'Escape') {
            const t = e.currentTarget;
            t.setAttribute('aria-expanded', 'false');
            const popover = t.nextElementSibling;
            popover?.setAttribute('hidden', '');
        }
    }

    /* ---------- render ---------- */

    render() {
        const isMobile = !!this.#mql?.matches;
        const showSelects = isMobile && this.#cards.length > 2;
        return html`
            ${showSelects ? this.#renderMobileSelects() : nothing}
            <div class="header-content-dummy"></div>
            <div class="header-content">
                <slot name="product"></slot>
            </div>
            <div
                class="accessibility-header-row"
                aria-hidden="false"
                role="row"
            >
                ${this.#cards
                    .filter((c) => !c.hasAttribute('hidden'))
                    .map(
                        (c) => html`<span role="columnheader"
                            >${c.querySelector('[slot="heading-xs"]')
                                ?.textContent ?? ''}</span
                        >`,
                    )}
            </div>
            <div class="compare-live" aria-live="polite"></div>
            ${this.#groups.map((g) => this.#renderGroup(g))}
        `;
    }

    #renderMobileSelects() {
        const labelOf = (c) =>
            c.querySelector('[slot="heading-xs"]')?.textContent?.trim() ??
            `Card ${c.dataset.columnIndex}`;
        const aria = placeholder(this, 'choose-table-column', 'Choose column');
        const opts = (selectedIdx, otherIdx) =>
            this.#cards.map(
                (c, i) =>
                    html`<option
                        value=${i}
                        ?selected=${i === selectedIdx}
                        ?disabled=${i === otherIdx}
                    >
                        ${labelOf(c)}
                    </option>`,
            );
        return html`
            <div class="mobile-headers">
                <select
                    aria-label="${aria} 1"
                    @change=${(e) => this.#onSelectChange('A', e)}
                >
                    ${opts(this.#selectionA, this.#selectionB)}
                </select>
                <select
                    aria-label="${aria} 2"
                    @change=${(e) => this.#onSelectChange('B', e)}
                >
                    ${opts(this.#selectionB, this.#selectionA)}
                </select>
            </div>
        `;
    }

    #renderGroup(g) {
        const expanded = this.#expandedGroupIndices.has(g.groupIndex);
        return html`
            <div class="table-container">
                <button
                    class="table-column-header"
                    aria-expanded=${expanded}
                    aria-controls="g-${g.groupIndex}"
                    @click=${() => this.#toggleGroup(g.groupIndex)}
                >
                    <span><slot name="group"></slot></span>
                    <span class="toggle-icon" aria-hidden="true"></span>
                </button>
                <div
                    id="g-${g.groupIndex}"
                    class="table-body ${expanded ? '' : 'hide'}"
                    role="rowgroup"
                    aria-label=${g.heading}
                >
                    ${g.rows.map((r) => this.#renderRow(r))}
                </div>
            </div>
        `;
    }

    #renderRow(r) {
        const tooltipKey = `tooltip@${r.slot}`;
        return html`
            <div class="table-row" role="row">
                <div class="row-header" role="rowheader">
                    <slot name="feature@${r.slot}"></slot>
                    ${r.tooltipEl
                        ? html`<button
                                  class="tooltip-trigger"
                                  aria-expanded="false"
                                  aria-label="More info"
                                  @click=${this.#toggleTooltip}
                                  @keydown=${this.#onTooltipKey}
                              >
                                  i
                              </button>
                              <span class="tooltip-popover" hidden role="tooltip">
                                  <slot name="${tooltipKey}"></slot>
                              </span>`
                        : nothing}
                </div>
                <slot name="${r.slot}"></slot>
            </div>
        `;
    }
}

if (!customElements.get(MAS_COMPARISON_TABLE)) {
    customElements.define(MAS_COMPARISON_TABLE, MasComparisonTable);
}
