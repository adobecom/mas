import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';
import Store from '../store.js';
import Events from '../events.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { canManagePromotions } from '../groups.js';
import { PAGE_NAMES } from '../constants.js';
import { extractLocaleFromPath, extractSurfaceFromPath } from '../utils.js';
import { Fragment } from '../aem/fragment.js';
import { getCachedTagTitle } from '../aem/tag-cache.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { VARIANTS } from '../editors/variant-picker.js';
import * as historyClient from './promotion-version.js';
import { promotionHistoryStyles } from './mas-promotion-history.css.js';

const categories = ['General info', 'Countries', 'Offers', 'Fragments'];
const categoryLabels = new Map([
    ['general', 'General info'],
    ['general-info', 'General info'],
    ['general info', 'General info'],
    ['countries', 'Countries'],
    ['offers', 'Offers'],
    ['fragments', 'Fragments'],
]);
const fieldLabels = {
    title: 'Title',
    description: 'Description',
    tags: 'Tags',
    startDate: 'Start date',
    endDate: 'End date',
    promoCode: 'Promo code',
    promoCodeExceptions: 'Promo code mappings',
    offerSubstitutions: 'OSI override',
    geos: 'Countries',
    countries: 'Countries',
    surfaces: 'Surfaces',
    offers: 'Offers',
    fragments: 'Fragments',
    variant: 'Template',
    osi: 'Offer',
    cardTitle: 'Card title',
    cardName: 'Card name',
    mnemonicIcon: 'Product icon',
    mnemonicAlt: 'Icon alternative text',
    mnemonicLink: 'Icon link',
    badge: 'Badge',
    borderColor: 'Border color',
    subtitle: 'Subtitle',
    prices: 'Prices',
    whatsIncluded: "What's included",
    pznTags: 'Locale tags',
    cdtStart: 'CDT start date',
    cdtEnd: 'CDT end date',
    variationStrategy: 'Variation strategy',
};
const richTextFields = new Set([
    'description',
    'badge',
    'trialBadge',
    'prices',
    'shortDescription',
    'callout',
    'ctas',
    'whatsIncluded',
    'features',
    'customFields',
    'image',
    'backgrounds',
]);

/** Browses native AEM promotion versions without modifying the active editor's stores. */
export class MasPromotionHistory extends LitElement {
    static styles = promotionHistoryStyles;

    static properties = {
        projectId: { type: String, attribute: 'project-id' },
        repository: { attribute: false },
        client: { attribute: false },
        events: { state: true },
        selectedEvent: { state: true },
        historicalFragments: { state: true },
        currentEventId: { state: true },
        rows: { state: true },
        groups: { state: true },
        selectedFields: { state: true },
        expected: { state: true },
        unavailable: { state: true },
        loading: { state: true },
        baselineLoading: { state: true },
        operating: { state: true },
        error: { state: true },
        operationError: { state: true },
        cursor: { state: true },
        filters: { state: true },
        confirmation: { state: true },
        collapsedGroups: { state: true },
    };

    constructor() {
        super();
        this.projectId = '';
        this.repository = document.querySelector('mas-repository');
        this.client = historyClient;
        this.events = [];
        this.selectedEvent = null;
        this.historicalFragments = [];
        this.currentEventId = '';
        this.rows = [];
        this.groups = [];
        this.selectedFields = new Set();
        this.expected = [];
        this.unavailable = [];
        this.loading = false;
        this.baselineLoading = false;
        this.operating = false;
        this.error = '';
        this.operationError = '';
        this.cursor = null;
        this.filters = {};
        this.confirmation = '';
        this.collapsedGroups = new Set();
        this.listRequest = 0;
        this.versionRequest = 0;
        this.tagTitles = new Map();
        this.reactivity = new ReactiveController(this, [Store.profile, Store.users]);
    }

    willUpdate(changed) {
        if (changed.has('projectId')) {
            this.currentEventId = '';
            this.filters = {};
            this.loadHistory();
        }
        if (changed.has('rows')) {
            this.groups = categories.map((label) => this.buildGroup(label)).filter((group) => group.rows.length);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.listRequest += 1;
        this.versionRequest += 1;
    }

    get busy() {
        return this.loading || this.baselineLoading || this.operating;
    }

    get canRestore() {
        return (
            canManagePromotions() && Boolean(this.restoreSnapshot?.fragments.length) && this.expected.length > 0 && !this.busy
        );
    }

    get restoreSnapshot() {
        return this.selectedEvent?.beforeSnapshot;
    }

    get eligibleRows() {
        return this.rows.filter((row) => row.restorable && !this.unavailable.includes(row.fragmentId));
    }

    get selections() {
        const fragments = new Map();
        for (const row of this.eligibleRows) {
            if (!this.selectedFields.has(row.key)) continue;
            if (!fragments.has(row.fragmentId)) fragments.set(row.fragmentId, new Set());
            for (const field of row.fields) fragments.get(row.fragmentId).add(field);
        }
        return [...fragments].map(([fragmentId, fields]) => ({ fragmentId, fields: [...fields] }));
    }

    async loadHistory(append = false, selectedId) {
        const projectId = this.projectId;
        const request = ++this.listRequest;
        this.error = '';
        this.loading = Boolean(projectId);
        if (!append) {
            this.versionRequest += 1;
            this.events = [];
            this.selectedEvent = null;
            this.historicalFragments = [];
            this.rows = [];
            this.selectedFields = new Set();
            this.expected = [];
            this.unavailable = [];
            this.baselineLoading = false;
            this.operationError = '';
            this.confirmation = '';
            this.collapsedGroups = new Set();
            this.cursor = null;
            this.tagTitles.clear();
        }
        if (!projectId) return;
        let page;
        try {
            page = await this.client.listPromotionHistory(projectId, {
                ...this.filters,
                ...(append ? { cursor: this.cursor } : {}),
            });
            page.events = await Promise.all(page.events.map((event) => this.preparePresentation(event)));
        } catch {
            if (request === this.listRequest) {
                this.error = 'Could not load version history. Please retry.';
                this.loading = false;
            }
            return;
        }
        if (request !== this.listRequest) return;
        const events = new Map((append ? this.events : []).map((event) => [event.id, event]));
        for (const event of page.events) events.set(event.id, event);
        this.events = [...events.values()];
        this.cursor = page.cursor;
        this.currentEventId = page.currentEventId;
        if (!append && this.events.length) {
            await this.selectVersion(this.events.find((event) => event.id === selectedId) ?? this.events[0]);
        }
        if (request !== this.listRequest) return;
        this.loading = false;
    }

    async readInheritance(manifest) {
        return new Map(
            await Promise.all(
                (manifest?.inheritance ?? []).map(async (entry) => [
                    entry.fragmentId,
                    await this.repository.aem.sites.cf.fragments.getVersion(entry.id, entry.versionId),
                ]),
            ),
        );
    }

    async preparePresentation(event) {
        const beforeManifest = event.beforeSnapshot;
        const unavailableParents = new Set(
            [...(beforeManifest?.inheritanceUnavailable ?? []), ...(event.afterSnapshot?.inheritanceUnavailable ?? [])].map(
                (entry) => entry.fragmentId,
            ),
        );
        let beforeParents;
        let afterParents;
        const comparisonWarning = unavailableParents.size
            ? 'Historical inheritance is unavailable for some variations. Raw stored differences are shown for those variations.'
            : '';
        try {
            [beforeParents, afterParents] = await Promise.all([
                this.readInheritance(beforeManifest),
                this.readInheritance(event.afterSnapshot),
            ]);
        } catch {
            return {
                ...event,
                displayChanges: event.changes,
                comparisonWarning: 'Inherited values could not be loaded. Raw stored differences are shown; reload to retry.',
            };
        }
        for (const id of unavailableParents) {
            beforeParents.delete(id);
            afterParents.delete(id);
        }
        const displayChanges = event.changes
            .map((change) => ({
                ...change,
                rawAfter: change.after,
                before: this.effectiveValue(change.before, change.field, beforeParents.get(change.fragmentId)),
                after: this.effectiveValue(change.after, change.field, afterParents.get(change.fragmentId)),
            }))
            .filter(
                (change) =>
                    change.field.startsWith('@') ||
                    !beforeParents.has(change.fragmentId) ||
                    JSON.stringify(change.before) !== JSON.stringify(change.after),
            );
        return { ...event, displayChanges, beforeParents, afterParents, comparisonWarning };
    }

    effectiveValue(value, field, parent) {
        if (!parent || field.startsWith('@') || value === null || value === undefined) return value;
        const definition = parent.fields?.find((item) => item.name === field);
        const fragment = new Fragment({ fields: [{ ...definition, name: field, values: value }] });
        return fragment.getEffectiveFieldValues(field, new Fragment(parent), true);
    }
    async selectVersion(event) {
        if (this.operating) return;
        const request = ++this.versionRequest;
        this.selectedEvent = event;
        this.historicalFragments = [];
        this.selectedFields = new Set();
        this.expected = [];
        this.unavailable = [];
        this.operationError = '';
        this.confirmation = '';
        this.rows = [];
        this.baselineLoading = true;
        if (!event.displayChanges) event = await this.preparePresentation(event);
        if (request !== this.versionRequest) return;
        this.selectedEvent = event;
        const entries = (this.restoreSnapshot?.fragments.length ? this.restoreSnapshot : event.afterSnapshot)?.fragments ?? [];
        this.baselineLoading = entries.length > 0;
        const results = await Promise.allSettled(
            entries.map(async (entry) => {
                const [historical, current] = await Promise.all([
                    this.repository.aem.sites.cf.fragments.getVersion(entry.id, entry.versionId),
                    this.repository.aem.sites.cf.fragments.getWithEtag(entry.id),
                ]);
                return { historical: { ...historical, id: entry.id, path: entry.path }, current };
            }),
        );
        if (request !== this.versionRequest) return;
        const current = new Map();
        const fragments = [];
        for (const [index, result] of results.entries()) {
            const fragmentId = entries[index].id;
            if (result.status === 'fulfilled' && result.value.current?.etag) {
                fragments.push(result.value.historical);
                current.set(fragmentId, result.value.current);
                this.expected.push({ fragmentId, etag: result.value.current.etag });
            } else {
                this.unavailable.push(fragmentId);
            }
        }
        this.historicalFragments = fragments;
        for (const fragment of [...fragments, ...current.values()]) {
            for (const tag of [...(fragment.tags ?? []), ...(fragment.fieldTags ?? [])]) {
                if (tag.title) this.tagTitles.set(normalizeTagId(tag), tag.title);
            }
        }
        this.rows = this.buildRows(event, current);
        this.baselineLoading = false;
        if (this.unavailable.length) {
            this.operationError =
                'Some fragments or historical AEM versions are unavailable. Deleted fragments are not recreated. Reload the version to retry.';
        }
    }

    buildRows(event, current) {
        const snapshot = new Map(this.historicalFragments.map((fragment) => [fragment.id, fragment]));
        const rows = new Map();
        for (const change of event.displayChanges ?? event.changes) {
            if (!change.field) continue;
            const fragment = snapshot.get(change.fragmentId);
            const key = JSON.stringify([change.fragmentId, change.field]);
            const conflicted =
                current.has(change.fragmentId) &&
                JSON.stringify(this.fieldValue(current.get(change.fragmentId), change.field)) !==
                    JSON.stringify(Object.hasOwn(change, 'rawAfter') ? change.rawAfter : change.after);
            rows.set(key, {
                ...change,
                key,
                category: categoryLabels.get(change.category?.toLowerCase()) ?? 'Fragments',
                restorable: Boolean(
                    this.restoreSnapshot?.fragments.length &&
                        fragment &&
                        !conflicted &&
                        JSON.stringify(this.fieldValue(current.get(change.fragmentId), change.field)) !==
                            JSON.stringify(this.fieldValue(fragment, change.field)) &&
                        (change.field.startsWith('@')
                            ? Object.hasOwn(fragment, change.field.slice(1))
                            : current.get(change.fragmentId).fields.some((field) => field.name === change.field)),
                ),
                conflicted,
                before: change.before,
                after: change.after,
            });
        }
        return this.prepareRows([...rows.values()]);
    }

    prepareRows(rows) {
        const unique = new Map();
        for (const row of rows) {
            const segments = this.changeSegments(row);
            if (!segments.length) continue;
            const field = row.field.replace(/^@/, '');
            const key = JSON.stringify([
                row.fragmentId,
                field,
                row.restorable,
                ...[row.before, row.after].map((value) => [value].flat().filter((item) => item != null && item !== '')),
            ]);
            const duplicate = unique.get(key);
            if (duplicate) {
                duplicate.fields.push(row.field);
                continue;
            }
            unique.set(key, {
                ...row,
                fields: [row.field],
                label: fieldLabels[field] ?? field.replace(/([a-z])([A-Z])/g, '$1 $2'),
                segments,
            });
        }
        return [...unique.values()];
    }

    changeSegments(row) {
        const empty = (value) =>
            value == null || value === '' || (Array.isArray(value) && value.every((item) => item == null || item === ''));
        if (['@tags', 'tags', 'geos', 'countries', 'surfaces', 'fragments', 'offers'].includes(row.field)) {
            const before = row.before ?? [];
            const after = row.after ?? [];
            const added = after.filter((value) => !before.some((item) => JSON.stringify(item) === JSON.stringify(value)));
            const removed = before.filter((value) => !after.some((item) => JSON.stringify(item) === JSON.stringify(value)));
            return [
                ...(added.length ? [{ kind: 'added', values: added }] : []),
                ...(removed.length ? [{ kind: 'removed', values: removed }] : []),
            ];
        }
        if ((empty(row.before) && empty(row.after)) || JSON.stringify(row.before) === JSON.stringify(row.after)) return [];
        const kind = empty(row.before) ? 'added' : empty(row.after) ? 'removed' : 'changed';
        return [{ kind }];
    }

    buildGroup(label) {
        const rows = this.rows.filter((row) => row.category === label);
        const counts = new Map();
        const items = new Map();
        for (const row of rows) {
            for (const segment of row.segments) {
                counts.set(segment.kind, (counts.get(segment.kind) ?? 0) + (segment.values?.length ?? 1));
            }
            if (!items.has(row.fragmentId)) {
                const fragment = this.historicalFragments.find((item) => item.id === row.fragmentId);
                const parent =
                    this.selectedEvent.beforeParents?.get(row.fragmentId) ??
                    this.selectedEvent.afterParents?.get(row.fragmentId);
                items.set(row.fragmentId, {
                    id: row.fragmentId,
                    title: fragment?.title ?? row.path?.split('/').at(-1) ?? row.fragmentId,
                    icon: this.effectiveValue(this.fieldValue(fragment, 'mnemonicIcon'), 'mnemonicIcon', parent)?.[0],
                    variant: this.effectiveValue(this.fieldValue(fragment, 'variant'), 'variant', parent)?.[0],
                    rows: [],
                });
            }
            items.get(row.fragmentId).rows.push(row);
        }
        return { label, rows, counts: [...counts], items: [...items.values()] };
    }

    fieldValue(fragment, field) {
        if (field.startsWith('@')) return fragment?.[field.slice(1)] ?? '';
        return fragment?.fields.find((item) => item.name === field)?.values ?? [];
    }

    formatValue(value, field = '') {
        if (Array.isArray(value)) return value.length ? value.map((item) => this.formatValue(item, field)).join('\n') : 'Empty';
        if (value === null || value === undefined || value === '') return 'Empty';
        const id = normalizeTagId(value);
        if (id.startsWith('mas:locale/') || ['geos', 'countries', 'pznTags'].includes(field)) {
            return value.name || id.split('/').at(-1) || value.title || 'Label unavailable';
        }
        if (Object(value) === value) return value.title || value.label || value.name || 'Label unavailable';
        if (id.startsWith('mas:')) {
            const title = this.tagTitles.get(id) ?? getCachedTagTitle(id);
            if (title) return title;
            return id.split('/').at(-1).replaceAll('-', ' ');
        }
        if (String(value).startsWith('/content/dam/')) {
            return this.historicalFragments.find((fragment) => fragment.path === value)?.title ?? value.split('/').at(-1);
        }
        if (field === 'variant') return VARIANTS.find((variant) => variant.value === value)?.label ?? String(value);
        if (['startDate', 'endDate', 'cdtStart', 'cdtEnd'].includes(field)) return this.formatDate(value);
        if (richTextFields.has(field.replace(/^@/, ''))) {
            const document = new DOMParser().parseFromString(String(value), 'text/html');
            for (const element of document.querySelectorAll('script, style, template')) element.remove();
            const text = document.body.textContent.trim();
            if (text) return text;
            const price = document.querySelector('[is="inline-price"]');
            if (price) return `Price (${price.getAttribute('data-template') || 'default'})`;
            return document.body.children.length ? 'Formatted content' : 'Empty';
        }
        return String(value);
    }

    formatDate(value) {
        return new Date(value).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    }

    versionLabel(event) {
        return `Version ${event.version}`;
    }

    eventLabel(event) {
        const project = (event.targetId ?? event.projectId) === event.projectId;
        const subject = project ? 'Project' : 'Promo variation';
        if (event.action === 'create') return `${subject} created`;
        if (event.action === 'restore') return 'Selected changes restored';
        return 'Changes saved';
    }

    toggleGroup(label) {
        const collapsed = new Set(this.collapsedGroups);
        if (collapsed.has(label)) collapsed.delete(label);
        else collapsed.add(label);
        this.collapsedGroups = collapsed;
    }

    fragmentLink(row) {
        const params = new URLSearchParams({
            page: PAGE_NAMES.FRAGMENT_EDITOR,
            fragmentId: row.fragmentId,
            promotionId: this.projectId,
        });
        const surface = extractSurfaceFromPath(row.path);
        const locale = extractLocaleFromPath(row.path);
        if (surface) params.set('path', surface);
        if (locale) params.set('locale', locale);
        return `#${params}`;
    }

    toggleRows(rows, checked) {
        if (!this.canRestore) return;
        const selected = new Set(this.selectedFields);
        for (const row of rows) {
            if (!row.restorable || this.unavailable.includes(row.fragmentId)) continue;
            if (checked) selected.add(row.key);
            else selected.delete(row.key);
        }
        this.selectedFields = selected;
    }

    applyFilters(event) {
        event.preventDefault();
        if (this.busy) return;
        this.filters = Object.fromEntries(
            [...this.renderRoot.querySelectorAll('[name]')].map((input) => [input.name, input.value.trim()]),
        );
        this.loadHistory();
    }

    requestRestore(mode) {
        if (!this.canRestore || mode !== 'selected' || !this.selectedFields.size) return;
        this.confirmation = mode;
    }

    async confirmRestore() {
        if (!this.canRestore || !this.confirmation) return;
        if (this.confirmation !== 'selected' || !this.selections.length) return;
        const selections = this.selections;
        const targets = new Set(selections.map((selection) => selection.fragmentId));
        const options = {
            selections,
            expected: this.expected.filter((target) => targets.has(target.fragmentId)),
        };
        const projectId = this.projectId;
        const eventId = this.selectedEvent.id;
        this.confirmation = '';
        this.operating = true;
        this.operationError = '';
        let result;
        try {
            result = await this.client.restorePromotionHistory(projectId, eventId, options);
        } catch (error) {
            if (projectId !== this.projectId) return;
            if (error.details?.versionPending) {
                this.expected = [];
                this.operationError =
                    'Some changes have already been restored, but the new version could not be recorded. Do not retry the restore; reload and review the current content first.';
                return;
            }
            const status = error.status ?? error.statusCode ?? error.response?.status;
            this.operationError =
                {
                    401: 'Sign in again before restoring this promotion.',
                    403: 'You do not have permission to restore this promotion. Check your MAS role and AEM permissions.',
                }[status] ??
                (status === 409 || status === 412
                    ? 'The selected fields changed since this event or since you viewed this version. Reload the version and review newer changes before restoring.'
                    : 'Could not restore this version. Reload the version and retry. Deleted fragments are not recreated.');
            return;
        } finally {
            this.operating = false;
        }
        if (projectId !== this.projectId || !this.isConnected) return;
        const failed = result.failures?.length ?? 0;
        Events.toast.emit({
            variant: result.unchanged ? 'info' : failed ? 'warning' : 'positive',
            content: result.unchanged
                ? 'Selected fields already match this version.'
                : !failed
                  ? 'Selected changes have been successfully restored.'
                  : `Restored ${result.restored.length} fragment(s) as a draft. ${failed} fragment(s) could not be restored. Nothing published.`,
        });
        this.dispatchEvent(new CustomEvent('history-restored', { bubbles: true, composed: true, detail: result }));
        this.filters = {};
        await this.loadHistory(false, result.event?.id);
    }

    get sidebarHeaderTemplate() {
        return html`
            <h1>Version history</h1>
            ${this.searchTemplate}
        `;
    }

    get searchTemplate() {
        return html`
            <form class="search-form" aria-label="History search" @submit=${this.applyFilters}>
                <sp-search
                    id="history-search"
                    name="query"
                    placeholder="Search version history"
                    aria-label="Search version history"
                    .value=${this.filters.query ?? ''}
                    ?disabled=${this.busy}
                ></sp-search>
            </form>
        `;
    }

    historyCardTemplate(event) {
        const selected = event.id === this.selectedEvent?.id;
        const changes = event.displayChanges ?? event.changes;
        const labels = [...new Set(changes.map((change) => categoryLabels.get(change.category?.toLowerCase()) ?? 'Fragments'))];
        return html`
            ${event.id === this.currentEventId
                ? html`<div class="current-label"><span class="current-dot"></span>Current version</div>`
                : nothing}
            <button
                type="button"
                class=${classMap({ 'history-card': true, selected, current: event.id === this.currentEventId })}
                data-event-id=${event.id}
                ?disabled=${this.busy}
                aria-pressed=${selected}
                @click=${() => this.selectVersion(event)}
            >
                <span class="version-label">${this.versionLabel(event)}</span>
                <strong class="version-author">
                    <time datetime=${event.createdAt}>${this.formatDate(event.createdAt)}</time>
                    by ${event.user.name || event.user.email || event.user.id}
                </strong>
                <span class="card-summary">
                    ${event.action !== 'save' ? html`<span>${this.eventLabel(event)}</span>` : nothing}
                    ${event.action !== 'create' && changes.length
                        ? html`
                              <span>${changes.length} change${changes.length === 1 ? '' : 's'}</span>
                              ${repeat(
                                  labels,
                                  (label) => label,
                                  (label) => html`<span class="category-tag">${label}</span>`,
                              )}
                          `
                        : event.action === 'save'
                          ? this.eventLabel(event)
                          : nothing}
                </span>
            </button>
        `;
    }

    rowTemplate(row) {
        const unavailable = this.unavailable.includes(row.fragmentId);
        return html`
            <div class="change-row" data-field=${row.field}>
                ${repeat(
                    row.segments,
                    (segment) => segment.kind,
                    (segment) => html`
                        <div class="change-line">
                            <sp-checkbox
                                aria-label=${`Restore ${row.label}`}
                                .checked=${this.selectedFields.has(row.key)}
                                ?disabled=${!this.canRestore || unavailable || !row.restorable}
                                @change=${(event) => this.toggleRows([row], event.target.checked)}
                            ></sp-checkbox>
                            <span class=${`change-badge ${segment.kind}`}
                                >${segment.kind[0].toUpperCase() + segment.kind.slice(1)}</span
                            >
                            <span class="field-label">${row.label}:</span>
                            ${segment.values
                                ? html`<span class="value-tags ${segment.kind === 'removed' ? 'before' : 'after'}">
                                      ${repeat(
                                          segment.values,
                                          (value) => JSON.stringify(value),
                                          (value) => html`<span class="value-tag">${this.formatValue(value, row.field)}</span>`,
                                      )}
                                  </span>`
                                : html`
                                      ${segment.kind === 'changed' || segment.kind === 'removed'
                                          ? html`<span class="before">${this.formatValue(row.before, row.field)}</span>`
                                          : nothing}
                                      ${segment.kind === 'changed'
                                          ? html`<span class="change-arrow" aria-label="changed to">&#8594;</span>`
                                          : nothing}
                                      <span class="after">${this.formatValue(row.after, row.field)}</span>
                                  `}
                            ${row.category === 'Fragments' && row.fragmentId !== this.projectId
                                ? html`<a
                                      class="fragment-link"
                                      href=${this.fragmentLink(row)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                  >
                                      Open fragment <sp-icon-link-out size="s"></sp-icon-link-out>
                                  </a>`
                                : nothing}
                        </div>
                    `,
                )}
                ${unavailable ? html`<small class="row-warning">Unavailable — cannot restore</small>` : nothing}
                ${row.conflicted
                    ? html`<small class="row-warning">This field has changed since this event. Review newer changes.</small>`
                    : !row.restorable && !unavailable && this.restoreSnapshot
                      ? html`<small class="row-warning">Field is unavailable or already matches this saved state</small>`
                      : nothing}
            </div>
        `;
    }

    groupTemplate(group) {
        const eligible = group.rows.filter((row) => row.restorable && !this.unavailable.includes(row.fragmentId));
        const selected = eligible.filter((row) => this.selectedFields.has(row.key)).length;
        const collapsed = this.collapsedGroups.has(group.label);
        const bodyId = `group-${group.label.replaceAll(' ', '-')}`;
        return html`
            <section class="change-group" aria-label=${group.label}>
                <div class="group-header">
                    <sp-checkbox
                        .checked=${eligible.length > 0 && selected === eligible.length}
                        .indeterminate=${selected > 0 && selected < eligible.length}
                        ?disabled=${!this.canRestore || !eligible.length}
                        @change=${(event) => this.toggleRows(eligible, event.target.checked)}
                        ><span class="group-title">${group.label}</span></sp-checkbox
                    >
                    <span class="change-counts">
                        ${repeat(
                            group.counts,
                            ([kind]) => kind,
                            ([kind, count]) => html`<span class=${`change-count ${kind}`}>${count} ${kind}</span>`,
                        )}
                    </span>
                    <button
                        type="button"
                        class="group-toggle"
                        aria-label=${`${collapsed ? 'Expand' : 'Collapse'} ${group.label}`}
                        aria-expanded=${!collapsed}
                        aria-controls=${bodyId}
                        @click=${() => this.toggleGroup(group.label)}
                    >
                        ${collapsed
                            ? html`<sp-icon-chevron-down size="s"></sp-icon-chevron-down>`
                            : html`<sp-icon-chevron-up size="s"></sp-icon-chevron-up>`}
                    </button>
                </div>
                ${collapsed
                    ? nothing
                    : html`<div class="group-body" id=${bodyId}>
                          ${repeat(
                              group.items,
                              (item) => item.id,
                              (item) =>
                                  html`<div class="fragment-changes">
                                      ${item.id !== this.projectId
                                          ? html`<div class="fragment-heading">
                                                ${item.icon
                                                    ? html`<img src=${item.icon} alt="" class="product-icon" />`
                                                    : html`<sp-icon-collection class="product-icon"></sp-icon-collection>`}
                                                <strong>${item.title}</strong>
                                                ${item.variant
                                                    ? html`<span class="muted"
                                                          >· ${this.formatValue(item.variant, 'variant')}</span
                                                      >`
                                                    : nothing}
                                            </div>`
                                          : nothing}
                                      ${repeat(
                                          item.rows,
                                          (row) => row.key,
                                          (row) => this.rowTemplate(row),
                                      )}
                                  </div>`,
                          )}
                      </div>`}
            </section>
        `;
    }

    get detailsTemplate() {
        if (!this.selectedEvent) return html`<p class="empty">Select a version to review its changes.</p>`;
        return html`
            <div class="details-heading">
                <div>
                    <p class="version-meta">
                        <time datetime=${this.selectedEvent.createdAt}>${this.formatDate(this.selectedEvent.createdAt)}</time>
                        by ${this.selectedEvent.user.name || this.selectedEvent.user.email || this.selectedEvent.user.id}
                    </p>
                    <h2>${this.versionLabel(this.selectedEvent)}</h2>
                    <p class="version-meta">${this.eventLabel(this.selectedEvent)}</p>
                </div>
                ${this.rows.length
                    ? this.selectionToolbarTemplate
                    : html`<p class="muted">No content changes. ${this.eventLabel(this.selectedEvent)}</p>`}
            </div>
            ${this.selectedEvent.comparisonWarning
                ? html`<p class="row-warning">${this.selectedEvent.comparisonWarning}</p>`
                : nothing}
            ${this.baselineLoading
                ? html`<div class="loading">
                      <sp-progress-circle indeterminate aria-label="Loading comparison"></sp-progress-circle>
                  </div>`
                : repeat(
                      this.groups,
                      (group) => group.label,
                      (group) => this.groupTemplate(group),
                  )}
        `;
    }

    get selectionToolbarTemplate() {
        return html`<div class="selection-toolbar">
            <sp-checkbox
                id="select-all"
                .checked=${this.eligibleRows.length > 0 && this.selectedFields.size === this.eligibleRows.length}
                .indeterminate=${this.selectedFields.size > 0 && this.selectedFields.size < this.eligibleRows.length}
                ?disabled=${!this.canRestore || !this.eligibleRows.length}
                @change=${(event) => this.toggleRows(this.eligibleRows, event.target.checked)}
                >Select all</sp-checkbox
            >
            <sp-button
                id="restore-selected"
                variant="primary"
                ?disabled=${!this.canRestore || !this.selectedFields.size}
                @click=${() => this.requestRestore('selected')}
                >Restore selected (${this.selectedFields.size})</sp-button
            >
        </div> `;
    }

    get confirmationTemplate() {
        if (!this.confirmation) return nothing;
        return html`
            <sp-dialog-wrapper
                id="restore-confirmation"
                open
                mode="modal"
                underlay
                size="s"
                no-divider
                .headline=${html`<sp-icon-alert size="s"></sp-icon-alert> Restore selected changes`}
                cancel-label="Cancel"
                confirm-label="Restore"
                @confirm=${this.confirmRestore}
                @cancel=${() => {
                    this.confirmation = '';
                }}
                @close=${() => {
                    this.confirmation = '';
                }}
            >
                <p>Do you want to continue to restore selected changes? Only the draft will be updated.</p>
            </sp-dialog-wrapper>
        `;
    }

    render() {
        return html`
            <div class="history-layout" aria-busy=${this.busy}>
                <aside aria-label="Saved versions">
                    ${this.sidebarHeaderTemplate}
                    ${this.error
                        ? html`<div class="error" role="alert">
                              <p>${this.error}</p>
                              <sp-action-button
                                  id="retry-history"
                                  ?disabled=${this.busy}
                                  @click=${() => this.loadHistory(this.events.length > 0)}
                                  >Retry</sp-action-button
                              >
                          </div>`
                        : nothing}
                    ${this.loading
                        ? html`<div class="loading">
                              <sp-progress-circle indeterminate aria-label="Loading history"></sp-progress-circle>
                          </div>`
                        : nothing}
                    <div class="history-cards">
                        ${repeat(
                            this.events,
                            (event) => event.id,
                            (event) => this.historyCardTemplate(event),
                        )}
                    </div>
                    ${!this.loading && !this.error && !this.events.length
                        ? html`<p class="empty">
                              ${this.projectId
                                  ? 'No history matches these filters.'
                                  : 'Select a saved promotion project to view history.'}
                          </p>`
                        : nothing}
                    ${this.cursor
                        ? html`<sp-button
                              id="load-more"
                              variant="secondary"
                              ?disabled=${this.busy}
                              @click=${() => this.loadHistory(true)}
                              >Load more</sp-button
                          >`
                        : nothing}
                </aside>
                <main aria-label="Version comparison">
                    ${this.operationError
                        ? html`<div class="error" role="alert">
                              ${this.operationError}
                              ${this.selectedEvent
                                  ? html`<sp-button
                                        id="retry-version"
                                        variant="secondary"
                                        ?disabled=${this.busy}
                                        @click=${() => this.selectVersion(this.selectedEvent)}
                                        >Reload version</sp-button
                                    >`
                                  : nothing}
                          </div>`
                        : nothing}
                    ${this.detailsTemplate}
                </main>
            </div>
            ${this.confirmationTemplate}
        `;
    }
}

customElements.define('mas-promotion-history', MasPromotionHistory);
