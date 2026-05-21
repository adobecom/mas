import { html, LitElement, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
    EVENT_AEM_ERROR,
    EVENT_AEM_LOAD,
    EVENT_MAS_READY,
} from './constants.js';
import { parseCompareChartTables } from './compare-chart-table-parser.js';
import { styles } from './mas-compare-chart.css.js';

const MAS_COMPARE_CHART = 'mas-compare-chart';
const MAS_COMPARE_CHART_LOAD_TIMEOUT = 30000;
const MAX_COMPARE_CHART_CARDS = 4;
/** Below this width: 2-up layout; with 3+ columns, each column gets a card picker (tablet + phone). */
const MOBILE_BREAKPOINT = 900; // px — host inline-size (matches container max-width for desktop grid)
const CARD_SOURCE_SLOTS = [
    'icons',
    'header',
    'badge',
    'price',
    'description',
    'detail',
    'cta',
];

const GLYPH_ALIASES = {
    included: ['✓', '✔', '✅'],
    excluded: ['✗', '✘', '✖', '×'],
    notApplicable: ['—', '-'],
};

const isIncluded = (t) => GLYPH_ALIASES.included.includes(t);
const isExcluded = (t) => GLYPH_ALIASES.excluded.includes(t);
const isNotApplicable = (t) =>
    !t || GLYPH_ALIASES.notApplicable.includes(t) || /^-+$/.test(t);

const placeholder = (host, key, fallback) =>
    host.placeholders?.[key] ?? fallback;

export class MasCompareChart extends LitElement {
    static properties = {
        expandedGroups: {
            type: String,
            attribute: 'expanded-groups',
            reflect: true,
        },
        collapsed: {
            type: Boolean,
            attribute: 'collapsed',
            reflect: true,
        },
        consonant: { type: Boolean, attribute: 'consonant' },
        spectrum: { type: String, attribute: 'spectrum' },
        placeholders: { type: Object },
    };

    static styles = styles;

    #internals;
    #cards = []; // canonical column-major order (hydrated merch-card sources)
    #cardHeaders = []; // table-rendered header data extracted from merch-card sources
    #cellsByRow = new Map(); // rowSlot -> [{ cardId, col, isCellPrimary, html, ariaLabel }]
    #rowMeta = new Map(); // rowSlot -> { labelHTML, tooltipHTML? }
    #groups = []; // [{ heading, groupIndex, rows: [{ slot, rowIndex }] }]
    #tableGroups = [];
    #rowSlotIndex = new Map(); // 'pdf-tools@view' -> { rowIndex, groupIndex }
    #expandedGroupIndices = new Set();
    #resizeObserver;
    #isMobile = false;
    #selectionA = 0;
    #selectionB = 1;
    #hydrating = false;
    #hydrationReady = null;
    #resolveHydrationReady = null;
    #isStickyHeaderActive = false;
    #stickyFrame = 0;
    #boundSyncStickyHeader = () => this.#scheduleStickyHeaderSync();

    constructor() {
        super();
        this.#internals = this.attachInternals?.();
        if (this.#internals) this.#internals.role = 'table';
    }

    connectedCallback() {
        super.connectedCallback();
        // Hydration runs once in firstUpdated; surfaces that need to rebuild
        // (e.g. Studio after a save) dispatch this event explicitly. No
        // MutationObserver — cell-level DOM mutations don't auto-rebuild,
        // and the table content is fully present at parse time.
        this.addEventListener('mas-compare-chart:rehydrate', () =>
            this.#hydrate(),
        );
        this.addEventListener(EVENT_AEM_LOAD, this.#handleAemLoad);
        this.addEventListener(EVENT_AEM_ERROR, this.#handleAemError);
        this.addEventListener(EVENT_MAS_READY, this.#handleNestedCardReady);
        this.#resizeObserver = new ResizeObserver(() =>
            this.#applyResponsive(),
        );
        this.#resizeObserver.observe(this);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener(EVENT_AEM_LOAD, this.#handleAemLoad);
        this.removeEventListener(EVENT_AEM_ERROR, this.#handleAemError);
        this.removeEventListener(EVENT_MAS_READY, this.#handleNestedCardReady);
        this.#resizeObserver?.disconnect();
        this.#teardownStickyHeader();
    }

    firstUpdated() {
        this.#hydrate();
        this.#setupSticky();
    }

    updated(changed) {
        if (changed.has('expandedGroups')) this.#parseExpanded();
        if (changed.has('consonant') || changed.has('spectrum')) {
            this.#propagateCardDisplayProperties();
        }
    }

    checkReady() {
        const aemFragment = this.querySelector(':scope > aem-fragment');
        if (!aemFragment) return Promise.resolve(true);
        this.#ensureHydrationReady();
        const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => resolve(false), MAS_COMPARE_CHART_LOAD_TIMEOUT),
        );
        return Promise.race([this.#hydrationReady, timeoutPromise]);
    }

    /* ---------- hydration ---------- */

    #handleAemLoad = (event) => {
        const source = event.target;
        if (source?.parentElement === this) {
            this.#hydrateFromFragment(event.detail, source);
            return;
        }
        if (source?.closest?.('merch-card')?.parentElement === this) {
            this.#hydrate();
        }
    };

    #handleAemError = (event) => {
        if (event.target?.parentElement === this) {
            this.#groups = [];
            this.#cardHeaders = [];
            this.#cards = [];
            this.#cellsByRow.clear();
            this.#rowMeta.clear();
            this.requestUpdate();
            this.#resolveHydrationReady?.(false);
            this.#hydrationReady = null;
            this.#resolveHydrationReady = null;
        }
    };

    #handleNestedCardReady = (event) => {
        if (event.target?.parentElement === this) this.#hydrate();
    };

    #ensureHydrationReady() {
        if (this.#hydrationReady) return;
        this.#hydrationReady = new Promise((resolve) => {
            this.#resolveHydrationReady = resolve;
        });
    }

    #propagateCardDisplayProperties(cards = this.#cards) {
        cards.forEach((card) => {
            card.consonant = this.consonant;
            card.toggleAttribute('consonant', Boolean(this.consonant));
            if (this.spectrum) {
                card.spectrum = this.spectrum;
                card.setAttribute('spectrum', this.spectrum);
            } else {
                card.removeAttribute('spectrum');
            }
        });
    }

    #fieldValue(fragment, name) {
        const fields = fragment?.fields || {};
        if (Array.isArray(fields)) {
            const field = fields.find((item) => item.name === name);
            return field?.multiple
                ? field.values || []
                : field?.values?.[0] || '';
        }
        const value = fields[name];
        if (Array.isArray(value)) return value[0] || '';
        return value?.value ?? value ?? '';
    }

    #fieldValues(fragment, name) {
        const fields = fragment?.fields || {};
        if (Array.isArray(fields)) {
            return fields.find((item) => item.name === name)?.values || [];
        }
        const value = fields[name];
        if (Array.isArray(value)) return value;
        if (value == null || value === '') return [];
        return [value?.value ?? value];
    }

    #referenceEntries(fragment) {
        const refs = fragment?.references || {};
        if (Array.isArray(refs)) {
            return refs
                .map((ref) => ({
                    identifier: ref.identifier || ref.id || ref.path,
                    value: ref.value || ref,
                }))
                .filter((ref) => ref.value);
        }
        return Object.entries(refs)
            .map(([identifier, ref]) => ({
                identifier,
                value: ref?.value || ref,
            }))
            .filter((ref) => ref.value);
    }

    #orderedCardReferences(fragment) {
        const entries = this.#referenceEntries(fragment);
        const byReference = (reference) =>
            entries.find(
                ({ identifier, value }) =>
                    identifier === reference ||
                    value.id === reference ||
                    value.path === reference,
            )?.value;
        const orderedReferences = this.#fieldValues(fragment, 'cards')
            .map(byReference)
            .filter(Boolean);
        if (orderedReferences.length) {
            return orderedReferences.slice(0, MAX_COMPARE_CHART_CARDS);
        }

        const treeReferences = (fragment.referencesTree || [])
            .filter((reference) => reference.fieldName === 'cards')
            .map((reference) => byReference(reference.identifier))
            .filter(Boolean);
        if (treeReferences.length) {
            return treeReferences.slice(0, MAX_COMPARE_CHART_CARDS);
        }

        return entries
            .map(({ value }) => value)
            .filter((ref) => ref?.fields)
            .slice(0, MAX_COMPARE_CHART_CARDS);
    }

    async #hydrateFromFragment(fragment, sourceAemFragment) {
        if (!fragment) return;
        this.#ensureHydrationReady();
        this.querySelectorAll('[data-compare-chart-generated]').forEach(
            (node) => node.remove(),
        );

        const parser = new DOMParser();
        const chartMarkup = this.#fieldValue(fragment, 'compareChart');
        const doc = parser.parseFromString(chartMarkup || '', 'text/html');
        const table = doc.body.querySelector('mas-compare-chart') || doc.body;
        if (table.hasAttribute?.('expanded-groups')) {
            this.expandedGroups = table.getAttribute('expanded-groups');
        }

        table.querySelectorAll(':scope > div[name]').forEach((group) => {
            const clone = group.cloneNode(true);
            clone.dataset.compareChartGenerated = 'true';
            this.append(clone);
        });

        const author = sourceAemFragment?.hasAttribute('author');
        const cardReferences = this.#orderedCardReferences(fragment);
        const cards = [];
        cardReferences.forEach((cardFragment) => {
            sourceAemFragment?.cache?.add(cardFragment);
            const card = document.createElement('merch-card');
            card.setAttribute('slot', 'cards');
            card.dataset.compareChartGenerated = 'true';
            this.#propagateCardDisplayProperties([card]);
            const aemFragment = document.createElement('aem-fragment');
            aemFragment.setAttribute('fragment', cardFragment.id);
            if (author) aemFragment.setAttribute('author', '');
            aemFragment.setAttribute('loading', 'cache');
            card.append(aemFragment);
            this.append(card);
            cards.push(card);
        });

        this.#hydrate();
        await Promise.all(
            cards.map((card) => card.checkReady?.().catch(() => false)),
        );
        this.#hydrate();
        this.#resolveHydrationReady?.(true);
        this.#hydrationReady = null;
        this.#resolveHydrationReady = null;
    }

    #hydrate() {
        if (this.#hydrating) return;
        this.#hydrating = true;
        try {
            this.#indexCards();
            this.#indexRows();
            this.#parseExpanded();
            this.#captureContent();
            this.#applyResponsive();
            this.requestUpdate();
        } finally {
            this.#hydrating = false;
        }
    }

    #indexCards() {
        const sourceCards = Array.from(
            this.querySelectorAll(':scope > merch-card[slot="cards"]'),
        ).slice(0, MAX_COMPARE_CHART_CARDS);
        this.querySelectorAll(':scope > [data-compare-chart-slot]').forEach(
            (node) => node.remove(),
        );
        const cardHeaders = [];
        sourceCards.forEach((sourceCard, i) => {
            const cardId = `card-${i + 1}`;
            sourceCard.dataset.cardId = cardId;
            sourceCard.dataset.columnIndex = String(i + 1);
            sourceCard.style.setProperty('--col', i + 1);
            const cellColor =
                sourceCard.getAttribute('cell-color') ?? 'default';
            cardHeaders.push(
                this.#extractCardHeader(sourceCard, cardId, i, cellColor),
            );
        });
        this.#cards = sourceCards;
        this.#cardHeaders = cardHeaders;
        this.setAttribute('data-child-count', String(sourceCards.length));
        this.style.setProperty('--compare-chart-cols', sourceCards.length);
    }

    #extractCardHeader(sourceCard, cardId, index, cellColor) {
        const slots = {};
        const presentSlots = new Set();
        for (const sourceSlot of CARD_SOURCE_SLOTS) {
            const targetSlot = `${cardId}-${sourceSlot}`;
            slots[sourceSlot] = targetSlot;
            if (!sourceCard) continue;
            const children = Array.from(
                sourceCard.querySelectorAll(`:scope > [slot="${sourceSlot}"]`),
            );
            if (children.length) presentSlots.add(sourceSlot);
            for (const child of children) {
                if (sourceSlot === 'cta') {
                    this.#cloneCtaChildren(child, targetSlot);
                    continue;
                }
                const clone = child.cloneNode(true);
                clone.setAttribute('slot', targetSlot);
                clone.toggleAttribute('data-compare-chart-slot', true);
                this.#stripInlineStyles(clone);
                this.appendChild(clone);
            }
        }
        if (sourceCard) {
            sourceCard.hidden = true;
            sourceCard.setAttribute('aria-hidden', 'true');
            sourceCard.dataset.cardId = cardId;
            sourceCard.dataset.columnIndex = String(index + 1);
            sourceCard.dataset.cellColor = cellColor;
        }
        const title = Array.from(
            this.querySelectorAll(`:scope > [slot="${slots.header}"]`),
        )
            .map((el) => el.textContent.trim())
            .filter(Boolean)
            .join(' ');
        return {
            cardId,
            col: index + 1,
            cellColor,
            slots,
            presentSlots,
            title: title || `Card ${index + 1}`,
        };
    }

    #cloneCtaChildren(root, targetSlot) {
        const actions = root.matches('a,button')
            ? [root]
            : Array.from(root.querySelectorAll('a,button'));
        if (!actions.length) {
            const clone = root.cloneNode(true);
            clone.setAttribute('slot', targetSlot);
            clone.toggleAttribute('data-compare-chart-slot', true);
            this.#stripInlineStyles(clone);
            this.appendChild(clone);
            return;
        }
        for (const action of actions) {
            const clone = action.cloneNode(true);
            clone.setAttribute('slot', targetSlot);
            clone.toggleAttribute('data-compare-chart-slot', true);
            this.#stripInlineStyles(clone);
            this.appendChild(clone);
        }
    }

    #stripInlineStyles(root) {
        root.removeAttribute('style');
        root.querySelectorAll('[style]').forEach((el) =>
            el.removeAttribute('style'),
        );
    }

    #indexRows() {
        this.#groups = [];
        this.#tableGroups = parseCompareChartTables(this);
        this.#rowSlotIndex.clear();
        let rowIndex = 1;

        Array.from(this.querySelectorAll(':scope > div[name]')).forEach(
            (groupDiv, gi) => {
                const groupKey = groupDiv.getAttribute('name');
                const heading =
                    groupDiv.querySelector(':scope > h4')?.textContent.trim() ??
                    '';
                const groupIndex = gi + 1;
                const group = { heading, groupIndex, groupKey, rows: [] };
                this.#groups.push(group);

                groupDiv.querySelectorAll(':scope > p[name]').forEach((p) => {
                    const featureKey = p.getAttribute('name');
                    const key = `${groupKey}@${featureKey}`;
                    rowIndex++;
                    group.rows.push({ slot: key, rowIndex });
                    this.#rowSlotIndex.set(key, { rowIndex, groupIndex });
                });
            },
        );

        this.#tableGroups.forEach((tableGroup) => {
            const groupIndex = this.#groups.length + 1;
            const group = {
                heading: tableGroup.label,
                groupIndex,
                groupKey: tableGroup.name,
                rows: [],
            };
            this.#groups.push(group);

            tableGroup.rows.forEach((row) => {
                const key = `${tableGroup.name}@${row.name}`;
                rowIndex++;
                group.rows.push({ slot: key, rowIndex });
                this.#rowSlotIndex.set(key, { rowIndex, groupIndex });
            });
        });
    }

    #parseExpanded() {
        const v = (this.expandedGroups ?? '').trim();
        const total = this.#groups.length;
        this.#expandedGroupIndices = new Set();
        if (!v) {
            if (total > 0) this.#expandedGroupIndices.add(1);
        } else if (v === 'all') {
            for (let i = 1; i <= total; i += 1) {
                this.#expandedGroupIndices.add(i);
            }
        } else if (v === 'none') {
            return;
        } else {
            v.split(',')
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => !isNaN(n) && n >= 1 && n <= total)
                .forEach((n) => this.#expandedGroupIndices.add(n));
        }
    }

    #serializeExpanded() {
        const total = this.#groups.length;
        if (!this.#expandedGroupIndices.size) return 'none';
        if (total && this.#expandedGroupIndices.size === total) return 'all';
        return [...this.#expandedGroupIndices].sort((a, b) => a - b).join(',');
    }

    /**
     * One-shot capture: read every authored row label / tooltip / cell out
     * of the light DOM into JS-side maps.
     * The shadow renderer consumes these maps directly — no per-row named
     * slots, no light-DOM <-> shadow projection thrash.
     */
    #captureContent() {
        this.#rowMeta.clear();
        this.#cellsByRow.clear();

        // Row labels (+ tooltip via title or secondary-link title) — walk each
        // <div name="<group>"> at table level, grab its <p name="<feature>">
        // children.
        Array.from(this.querySelectorAll(':scope > div[name]')).forEach(
            (groupDiv) => {
                const groupKey = groupDiv.getAttribute('name');
                groupDiv.querySelectorAll(':scope > p[name]').forEach((p) => {
                    const key = `${groupKey}@${p.getAttribute('name')}`;
                    const clone = p.cloneNode(true);
                    const title = this.#extractTooltipTitle(clone);
                    this.#rowMeta.set(key, {
                        labelHTML: clone.innerHTML,
                        title,
                        tooltipPosition:
                            p.getAttribute('data-tooltip-position') ??
                            'top-center',
                        isItemRow: p.hasAttribute('item'),
                    });
                });
            },
        );

        Array.from(
            this.querySelectorAll(':scope > merch-card[slot="cards"]'),
        ).forEach((card) => {
            const cardId = card.dataset.cardId;
            const col = parseInt(card.dataset.columnIndex, 10);

            const lastByKey = new Map();
            card.querySelectorAll(
                ':scope > p[name], :scope > [slot="features"] p[name]',
            ).forEach((p) => {
                const key = p.getAttribute('name');
                if (!key || !key.includes('@')) return;
                lastByKey.set(key, p);
            });

            for (const [key, source] of lastByKey) {
                if (!this.#rowSlotIndex.has(key)) {
                    continue;
                }
                const p = source.cloneNode(true);
                // Cell-level `primary` (green glyph in cells), plus `✅`
                // shorthand for a primary green check and green cell text.
                const isEmojiPrimary = p.textContent.includes('✅');
                const cellPrimary = p.hasAttribute('primary');
                if (cellPrimary) p.classList.add('primary-cell');
                if (isEmojiPrimary) p.classList.add('emoji-primary-cell');
                // Item-cell row: smaller typography, optional green tint.
                const isItem = p.hasAttribute('item');
                if (isItem) p.classList.add('item-cell');
                // Per-cell tooltip (Figma: Table cell has its own tooltip).
                const cellTitle = this.#extractTooltipTitle(p);
                this.#decorateCell(p);
                const arr = this.#cellsByRow.get(key) ?? [];
                arr.push({
                    cardId,
                    col,
                    isCellPrimary: cellPrimary,
                    isEmojiPrimary,
                    isItem,
                    title: cellTitle,
                    tooltipPosition:
                        p.getAttribute('data-tooltip-position') ?? 'top-center',
                    html: p.innerHTML,
                    ariaLabel: p.getAttribute('aria-label'),
                });
                this.#cellsByRow.set(key, arr);
            }
        });

        for (const tableGroup of this.#tableGroups) {
            tableGroup.rows.forEach((row) => {
                const key = `${tableGroup.name}@${row.name}`;
                this.#rowMeta.set(key, {
                    labelHTML: row.html,
                    title: undefined,
                    tooltipPosition: 'top-center',
                    isItemRow: false,
                });
                const cells = row.cells
                    .map((value, index) => {
                        const p = document.createElement('p');
                        p.innerHTML = value;
                        this.#decorateCell(p);
                        return {
                            cardId: this.#cards[index]?.dataset.cardId,
                            col: index + 1,
                            isCellPrimary: false,
                            isEmojiPrimary: value.includes('✅'),
                            isItem: false,
                            title: undefined,
                            tooltipPosition: 'top-center',
                            html: p.innerHTML,
                            ariaLabel: p.getAttribute('aria-label'),
                        };
                    })
                    .filter((cell) => cell.cardId);
                this.#cellsByRow.set(key, cells);
            });
        }
    }

    #extractTooltipTitle(p) {
        const tooltipLink = p.querySelector(':scope > a.secondary-link[title]');
        const title =
            tooltipLink?.getAttribute('title') ||
            p.getAttribute('title') ||
            undefined;
        tooltipLink?.remove();
        if (title) p.removeAttribute('title');
        return title;
    }

    #decorateCell(p) {
        // If already laid out, unwrap the chip so we can re-decorate cleanly
        // (e.g. on subsequent MutationObserver fires).
        const existingChip = p.querySelector(':scope > .compare-chart-chip');
        if (existingChip) {
            while (existingChip.firstChild) {
                p.insertBefore(existingChip.firstChild, existingChip);
            }
            existingChip.remove();
        }
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
        this.#layoutChip(p);
    }

    /**
     * Visually splits the cell into a bordered "chip" containing the glyph
     * (and any inline non-`<small>` content) plus caption text rendered
     * below the chip. Implemented by wrapping the chip portion in a
     * `<span class="compare-chart-chip">` so the cell `<p>` itself can be a
     * borderless flex column.
     */
    #layoutChip(p) {
        // Item-cell rows render as plain text (no chip border). Figma:
        // "Table item cell" — Description Body XXXS, no white card chrome.
        if (p.classList.contains('item-cell')) {
            return;
        }
        const chip = document.createElement('span');
        chip.className = 'compare-chart-chip';
        const nodes = Array.from(p.childNodes);
        for (const n of nodes) {
            if (n.nodeType === Node.ELEMENT_NODE && n.tagName === 'SMALL') {
                break;
            }
            chip.appendChild(n);
        }
        p.insertBefore(chip, p.firstChild);
    }

    #wrapGlyphs(p) {
        const all = [
            ...GLYPH_ALIASES.included,
            ...GLYPH_ALIASES.excluded,
            ...GLYPH_ALIASES.notApplicable,
        ];
        // Per Figma: only the cell-level `primary` variant gets the green
        // ✓ tint. Regular feature ✓ stays black. ✗ uses red.
        const isPrimary = p.classList.contains('primary-cell');
        Array.from(p.childNodes).forEach((node) => {
            if (node.nodeType !== Node.TEXT_NODE) return;
            const t = node.textContent;
            if (!all.some((g) => t.includes(g))) return;
            const frag = document.createDocumentFragment();
            for (const ch of t) {
                if (all.includes(ch)) {
                    const span = document.createElement('span');
                    span.setAttribute('aria-hidden', 'true');
                    span.classList.add('compare-chart-glyph');
                    span.textContent = ch === '✅' ? '✓' : ch;
                    if (GLYPH_ALIASES.included.includes(ch))
                        span.classList.add('included');
                    if (GLYPH_ALIASES.excluded.includes(ch))
                        span.classList.add('excluded');
                    if (isPrimary || ch === '✅') span.classList.add('primary');
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
        const w =
            this.getBoundingClientRect().width ||
            this.offsetWidth ||
            window.innerWidth;
        const isMobile = w > 0 && w < MOBILE_BREAKPOINT;
        const changed = isMobile !== this.#isMobile;
        this.#isMobile = isMobile;
        this.toggleAttribute('data-mobile', isMobile);
        if (isMobile) this.#enterMobile();
        else this.#exitMobile();
        this.#setStickyTopOffset();
        if (changed) this.requestUpdate();
    }

    #visibleCardIds() {
        return new Set(this.#visibleCardIdList());
    }

    #visibleCardIdList() {
        if (!this.#isMobile || this.#cards.length <= 2) {
            return this.#cards.map((w) => w.dataset.cardId);
        }
        return [this.#cards[this.#selectionA], this.#cards[this.#selectionB]]
            .filter(Boolean)
            .map((w) => w.dataset.cardId);
    }

    #visibleCardHeaders() {
        return this.#visibleCardIdList()
            .map((cardId) =>
                this.#cardHeaders.find((card) => card.cardId === cardId),
            )
            .filter(Boolean);
    }

    #enterMobile() {
        this.style.setProperty('--compare-chart-cols', 2);
        const n = this.#cards.length;
        if (n <= 2) return;
        this.#clampMobileSelections();
    }

    #clampMobileSelections() {
        const n = this.#cards.length;
        if (n <= 2) return;
        if (this.#selectionA >= n) this.#selectionA = 0;
        if (this.#selectionB >= n) this.#selectionB = Math.min(1, n - 1);
        if (this.#selectionA === this.#selectionB) {
            this.#selectionB = (this.#selectionA + 1) % n;
        }
    }

    #exitMobile() {
        this.style.setProperty('--compare-chart-cols', this.#cards.length);
    }

    #applyColumnSelection(side, idx) {
        if (side === 'A') {
            if (idx === this.#selectionB) this.#selectionB = this.#selectionA;
            this.#selectionA = idx;
        } else {
            if (idx === this.#selectionA) this.#selectionA = this.#selectionB;
            this.#selectionB = idx;
        }
        this.#enterMobile();
        this.requestUpdate();
    }

    /* ---------- sticky ---------- */

    #setStickyTopOffset() {
        if (this.#isMobile) {
            this.style.setProperty('--compare-chart-sticky-top', '0px');
            return;
        }
        const headerEl = document.querySelector('header');
        const localnav = document.querySelector('.feds-localnav');
        const top =
            (headerEl?.getBoundingClientRect().height || 0) +
            (localnav?.getBoundingClientRect().height || 0);
        this.style.setProperty('--compare-chart-sticky-top', `${top}px`);
    }

    #setupSticky() {
        this.#teardownStickyHeader();
        // Offset for `position: sticky` top — global nav + optional gap.
        this.#setStickyTopOffset();
        const gapAttr = this.getAttribute('sticky-top');
        if (gapAttr) {
            const gap = /^\d+$/.test(gapAttr.trim()) ? `${gapAttr}px` : gapAttr;
            this.style.setProperty('--compare-chart-sticky-gap', gap);
        }
        window.addEventListener('scroll', this.#boundSyncStickyHeader, true);
        window.addEventListener('resize', this.#boundSyncStickyHeader);
        this.#scheduleStickyHeaderSync();
    }

    #teardownStickyHeader() {
        window.removeEventListener('scroll', this.#boundSyncStickyHeader, true);
        window.removeEventListener('resize', this.#boundSyncStickyHeader);
        if (this.#stickyFrame) {
            cancelAnimationFrame(this.#stickyFrame);
            this.#stickyFrame = 0;
        }
    }

    #scheduleStickyHeaderSync() {
        if (this.#stickyFrame) return;
        this.#stickyFrame = requestAnimationFrame(() => {
            this.#stickyFrame = 0;
            this.#syncStickyHeaderState();
        });
    }

    #syncStickyHeaderState() {
        const headerContent = this.shadowRoot?.querySelector('.header-content');
        if (this.collapsed || !headerContent) {
            this.#setStickyHeaderActive(false);
            return;
        }
        const top = parseFloat(getComputedStyle(headerContent).top) || 0;
        const headerRect = headerContent.getBoundingClientRect();
        const hostRect = this.getBoundingClientRect();
        this.#setStickyHeaderActive(
            hostRect.top < top &&
                hostRect.bottom > top &&
                headerRect.top <= top + 1,
        );
    }

    #setStickyHeaderActive(active) {
        const headerContent = this.shadowRoot?.querySelector('.header-content');
        if (active === this.#isStickyHeaderActive) return;
        this.#isStickyHeaderActive = active;
        this.toggleAttribute('data-sticky-header', active);
        headerContent?.classList.toggle('sticky', active);
        headerContent?.classList.toggle('is-stuck', active);
    }

    /* ---------- accordion ---------- */

    #toggleGroup(groupIndex) {
        let opened = false;
        if (this.#expandedGroupIndices.has(groupIndex)) {
            this.#expandedGroupIndices.delete(groupIndex);
        } else {
            this.#expandedGroupIndices = new Set([groupIndex]);
            opened = true;
        }
        this.expandedGroups = this.#serializeExpanded();
        this.dispatchEvent(
            new CustomEvent('expanded-groups-change', {
                detail: { value: this.expandedGroups },
                bubbles: true,
                composed: true,
            }),
        );
        this.requestUpdate();
        if (opened) {
            void this.updateComplete.then(() =>
                this.#scrollOpenedGroupToTop(groupIndex),
            );
        }
    }

    /** Scroll the opened accordion section to the top of the scrollport, below sticky chrome. */
    #scrollOpenedGroupToTop(groupIndex) {
        if (this.collapsed) return;
        const container = this.shadowRoot?.querySelector(
            `.table-container[data-group-index="${String(groupIndex)}"]`,
        );
        if (!container) return;

        const headerBand = this.shadowRoot?.querySelector('.header-content');
        const cs = getComputedStyle(this);
        const stickyTop =
            parseFloat(cs.getPropertyValue('--compare-chart-sticky-top')) || 0;
        const gapRaw = cs.getPropertyValue('--compare-chart-sticky-gap').trim();
        const stickyGap = gapRaw ? parseFloat(gapRaw) || 0 : 0;
        const headerH = headerBand?.getBoundingClientRect().height ?? 0;
        const margin = stickyTop + stickyGap + headerH;

        const prevMargin = container.style.scrollMarginTop;
        container.style.scrollMarginTop = `${margin}px`;
        container.scrollIntoView({ block: 'start', behavior: 'smooth' });
        requestAnimationFrame(() => {
            container.style.scrollMarginTop = prevMargin;
        });
    }

    /* ---------- render ---------- */

    render() {
        if (this.collapsed) {
            return nothing;
        }
        return html`
            <div class="sticky-header-spacer" aria-hidden="true"></div>
            <div class="header-content sticky-header">
                <div class="sticky-header-wrapper">
                    ${this.#renderHeaderGrid()}
                </div>
            </div>
            <slot name="cards" hidden></slot>
            <div
                class="accessibility-header-row"
                aria-hidden="false"
                role="row"
            >
                ${this.#visibleCardHeaders().map(
                    (c) => html`<span role="columnheader">${c.title}</span>`,
                )}
            </div>
            ${this.#groups.map((g) => this.#renderGroup(g))}
        `;
    }

    #renderHeaderGrid() {
        const cards = this.#visibleCardHeaders();
        const visibleSlots = this.#visibleSlotPresence(cards);
        return html`
            <div class="header-leading header-leading-header"></div>
            ${cards.map((card, i) =>
                this.#renderHeaderSegment(
                    card,
                    'header',
                    i + 1,
                    i,
                    visibleSlots,
                ),
            )}
            <div class="header-leading header-leading-price"></div>
            ${cards.map((card, i) =>
                this.#renderHeaderSegment(
                    card,
                    'price',
                    i + 1,
                    i,
                    visibleSlots,
                ),
            )}
            <div class="header-leading header-leading-description"></div>
            ${cards.map((card, i) =>
                this.#renderHeaderSegment(
                    card,
                    'description',
                    i + 1,
                    i,
                    visibleSlots,
                ),
            )}
            <div class="header-leading header-leading-detail"></div>
            ${cards.map((card, i) =>
                this.#renderHeaderSegment(
                    card,
                    'detail',
                    i + 1,
                    i,
                    visibleSlots,
                ),
            )}
            ${cards.map((card, i) =>
                this.#renderHeaderSegment(card, 'cta', i + 1, i, visibleSlots),
            )}
        `;
    }

    #visibleSlotPresence(cards) {
        const visibleSlots = new Set();
        for (const card of cards) {
            for (const slotName of card.presentSlots) {
                visibleSlots.add(slotName);
            }
        }
        return visibleSlots;
    }

    #renderCardSlot(card, sourceSlot, visibleSlots) {
        if (!visibleSlots.has(sourceSlot)) return nothing;
        return html`<slot name=${card.slots[sourceSlot]}></slot>`;
    }

    #renderHeaderSegment(
        card,
        segment,
        visibleCol,
        visibleIndex,
        visibleSlots,
    ) {
        const classes = ['header-card-segment', `${segment}-segment`];
        const dataCellColor = card.cellColor;
        return html`<div
            class=${classes.join(' ')}
            data-card-id=${card.cardId}
            data-card-index=${card.col - 1}
            data-cell-color=${dataCellColor}
            style="--col: ${visibleCol};"
        >
            ${segment === 'header'
                ? html`
                      ${this.#renderCardSlot(card, 'icons', visibleSlots)}
                      ${this.#renderCardSlot(card, 'header', visibleSlots)}
                      ${this.#renderCardSlot(card, 'badge', visibleSlots)}
                      ${this.#renderColumnPicker(card, visibleIndex)}
                  `
                : nothing}
            ${segment === 'price'
                ? this.#renderCardSlot(card, 'price', visibleSlots)
                : nothing}
            ${segment === 'description'
                ? this.#renderCardSlot(card, 'description', visibleSlots)
                : nothing}
            ${segment === 'detail'
                ? this.#renderCardSlot(card, 'detail', visibleSlots)
                : nothing}
            ${segment === 'cta'
                ? this.#renderCardSlot(card, 'cta', visibleSlots)
                : nothing}
        </div>`;
    }

    #renderColumnPicker(card, visibleIndex) {
        if (!this.#isMobile || this.#cardHeaders.length <= 2) return nothing;
        const selectedIdx = this.#cardHeaders.findIndex(
            (header) => header.cardId === card.cardId,
        );
        const side = visibleIndex === 0 ? 'A' : 'B';
        const otherIdx = side === 'A' ? this.#selectionB : this.#selectionA;
        return html`<select
            class="mobile-filter-select"
            name="column-filter"
            aria-label=${placeholder(
                this,
                'choose-table-column',
                'Choose column',
            )}
            .value=${String(selectedIdx)}
            @change=${(event) =>
                this.#applyColumnSelection(
                    side,
                    parseInt(event.target.value, 10),
                )}
        >
            ${this.#cardHeaders.map((header, index) => {
                if (index === otherIdx) return nothing;
                return html`<option
                    value=${index}
                    ?selected=${index === selectedIdx}
                >
                    ${header.title}
                </option>`;
            })}
        </select>`;
    }

    #renderGroup(g) {
        const expanded = this.#expandedGroupIndices.has(g.groupIndex);
        return html`
            <div class="table-container" data-group-index=${g.groupIndex}>
                <button
                    class="table-column-header"
                    aria-expanded=${expanded}
                    aria-controls="g-${g.groupIndex}"
                    @click=${() => this.#toggleGroup(g.groupIndex)}
                >
                    <span class="group-title">${g.heading}</span>
                    <span
                        class="toggle-icon ${expanded ? 'is-expanded' : ''}"
                        aria-hidden="true"
                    ></span>
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

    /** When column card fragments omit `features`, still render a full row grid. */
    #syntheticNotApplicableCell(cardId, col) {
        return {
            cardId,
            col,
            isCellPrimary: false,
            isEmojiPrimary: false,
            isItem: false,
            title: undefined,
            tooltipPosition: 'top-center',
            html: '<span class="compare-chart-chip"><span class="compare-chart-glyph" aria-hidden="true">—</span></span>',
            ariaLabel: placeholder(this, 'not-applicable', 'Not applicable'),
        };
    }

    #renderRow(r) {
        const meta = this.#rowMeta.get(r.slot) ?? {};
        const cellsByCardId = new Map(
            (this.#cellsByRow.get(r.slot) ?? []).map((cell) => [
                cell.cardId,
                cell,
            ]),
        );
        const visibleIds = this.#visibleCardIdList();
        let cells = visibleIds
            .map((cardId) => cellsByCardId.get(cardId))
            .filter(Boolean);
        if (
            !cells.length &&
            visibleIds.length > 0 &&
            this.#rowMeta.has(r.slot)
        ) {
            cells = visibleIds.map((cardId) => {
                const card = this.#cards.find(
                    (c) => c.dataset.cardId === cardId,
                );
                const col = parseInt(card?.dataset.columnIndex ?? '1', 10);
                return this.#syntheticNotApplicableCell(cardId, col);
            });
        }
        const rowClasses = ['table-row'];
        if (meta.isItemRow) rowClasses.push('description-row');
        return html`
            <div class=${rowClasses.join(' ')} role="row">
                <div class="row-header" role="rowheader">
                    <span class="row-label"
                        >${unsafeHTML(meta.labelHTML ?? '')}</span
                    >
                    ${this.#renderTooltip(meta.title, meta.tooltipPosition)}
                </div>
                ${cells.map((c) => this.#renderCell(c))}
            </div>
        `;
    }

    #renderCell(c) {
        const classes = ['cell'];
        if (c.isCellPrimary) classes.push('primary-cell');
        if (c.isEmojiPrimary) classes.push('emoji-primary-cell');
        if (c.isItem) classes.push('item-cell');
        return html`<p
            role="cell"
            class=${classes.join(' ')}
            data-card-id=${c.cardId}
            style="--col: ${c.col};"
            aria-label=${c.ariaLabel ?? nothing}
        >
            ${unsafeHTML(c.html)}${this.#renderTooltip(
                c.title,
                c.tooltipPosition,
            )}
        </p>`;
    }

    /** Custom black popover tooltip (Figma: Table tool tip).
     * 7 positions; default top-center. Source is the `title` attribute on
     * the authored `<p>` (label or cell). Native `title` is stripped at
     * capture so the browser's hover-box never fires. */
    #renderTooltip(text, position) {
        if (!text) return nothing;
        const pos = position || 'top-center';
        return html`<span class="tooltip-wrapper" data-tooltip-position=${pos}>
            <button class="tooltip-trigger" aria-label="More info" tabindex="0">
                <span aria-hidden="true">i</span>
            </button>
            <span class="tooltip-popover" role="tooltip">${text}</span>
        </span>`;
    }
}

if (!customElements.get(MAS_COMPARE_CHART)) {
    customElements.define(MAS_COMPARE_CHART, MasCompareChart);
}
