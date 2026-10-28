import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';
import Store from '../store.js';
import Events from '../events.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { canManagePromotions } from '../groups.js';
import { PAGE_NAMES } from '../constants.js';
import { extractLocaleFromPath, extractSurfaceFromPath } from '../utils.js';
import * as historyClient from './promotion-audit.js';
import { getSelectedCountries } from './promotion-countries.js';
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
};

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
        this.auditRetry = null;
        this.reactivity = new ReactiveController(this, [Store.profile, Store.users]);
    }

    willUpdate(changed) {
        if (changed.has('projectId')) {
            this.currentEventId = '';
            this.filters = {};
            this.loadHistory();
        }
        if (changed.has('rows')) {
            this.groups = categories.map((label) => this.buildGroup(label));
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
        return canManagePromotions() && Boolean(this.selectedEvent?.snapshot?.fragments.length) && !this.busy;
    }

    get eligibleRows() {
        return this.rows.filter((row) => row.restorable && !this.unavailable.includes(row.fragmentId));
    }

    get selections() {
        const fragments = new Map();
        for (const row of this.eligibleRows) {
            if (!this.selectedFields.has(row.key)) continue;
            if (!fragments.has(row.fragmentId)) fragments.set(row.fragmentId, new Set());
            fragments.get(row.fragmentId).add(row.field);
        }
        return [...fragments].map(([fragmentId, fields]) => ({ fragmentId, fields: [...fields] }));
    }

    async loadHistory(append = false) {
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
        }
        if (!projectId) return;
        this.auditRetry ??= this.retryPendingAudits();
        await this.auditRetry;
        if (request !== this.listRequest) return;
        let page;
        try {
            page = await this.client.listPromotionHistory(projectId, {
                ...this.filters,
                ...(append ? { cursor: this.cursor } : {}),
            });
        } catch {
            if (request === this.listRequest) this.error = 'Could not load version history. Please retry.';
            return;
        } finally {
            if (request === this.listRequest) this.loading = false;
        }
        if (request !== this.listRequest) return;
        const events = new Map((append ? this.events : []).map((event) => [event.id, event]));
        for (const event of page.events) events.set(event.id, event);
        this.events = [...events.values()];
        this.cursor = page.cursor;
        if ((!append || !this.currentEventId) && Object.values(this.filters).every((value) => !value)) {
            this.currentEventId =
                this.events.find((event) => !event.isBackup && !['backup', 'publish', 'unpublish'].includes(event.action))
                    ?.id ?? '';
        }
        if (!append && this.events.length) await this.selectVersion(this.events[0]);
    }

    async retryPendingAudits() {
        try {
            await this.client.retryPendingPromotionAudits(this.projectId);
        } catch {
            Events.toast.emit({
                variant: 'warning',
                message: 'Some saved changes could not be added to history. Version history will still be loaded.',
            });
        }
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
        const entries = event.snapshot?.fragments ?? [];
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
        for (const change of event.changes) {
            if (!change.field) continue;
            const fragment = snapshot.get(change.fragmentId);
            const key = JSON.stringify([change.fragmentId, change.field]);
            rows.set(key, {
                ...change,
                key,
                category: categoryLabels.get(change.category?.toLowerCase()) ?? 'Fragments',
                restorable: Boolean(
                    fragment &&
                        (change.field.startsWith('@')
                            ? Object.hasOwn(fragment, change.field.slice(1))
                            : fragment.fields.some((field) => field.name === change.field)),
                ),
                before: change.before,
                after: fragment ? this.fieldValue(fragment, change.field) : change.after,
            });
        }
        for (const fragment of event.changes.length ? [] : snapshot.values()) {
            const fields = [
                ...['title', 'description', 'tags']
                    .filter((field) => Object.hasOwn(fragment, field))
                    .map((field) => `@${field}`),
                ...fragment.fields.map((field) => field.name),
            ];
            for (const field of fields) {
                const key = JSON.stringify([fragment.id, field]);
                if (rows.has(key)) continue;
                rows.set(key, {
                    key,
                    fragmentId: fragment.id,
                    path: fragment.path,
                    field,
                    category: this.snapshotCategory(fragment.id, field),
                    restorable: true,
                    before: this.fieldValue(current.get(fragment.id), field),
                    after: this.fieldValue(fragment, field),
                });
            }
        }
        return [...rows.values()].map((row) => ({
            ...row,
            label: fieldLabels[row.field.replace(/^@/, '')] ?? row.field.replace(/^@/, ''),
            segments: this.changeSegments(row),
        }));
    }

    changeSegments(row) {
        const empty = (value) => value == null || value === '' || (Array.isArray(value) && !value.length);
        if (['@tags', 'tags', 'geos', 'countries', 'surfaces', 'fragments', 'offers'].includes(row.field)) {
            const before = row.before ?? [];
            const after = row.after ?? [];
            const added = after.filter((value) => !before.some((item) => JSON.stringify(item) === JSON.stringify(value)));
            const removed = before.filter((value) => !after.some((item) => JSON.stringify(item) === JSON.stringify(value)));
            if (added.length || removed.length) {
                return [
                    ...(added.length ? [{ kind: 'added', values: added }] : []),
                    ...(removed.length ? [{ kind: 'removed', values: removed }] : []),
                ];
            }
        }
        const kind = empty(row.before)
            ? empty(row.after)
                ? 'saved'
                : 'added'
            : empty(row.after)
              ? 'removed'
              : JSON.stringify(row.before) === JSON.stringify(row.after)
                ? 'saved'
                : 'changed';
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
                items.set(row.fragmentId, {
                    id: row.fragmentId,
                    title: fragment?.title ?? row.path?.split('/').at(-1) ?? row.fragmentId,
                    icon: fragment?.fields.find((field) => field.name === 'mnemonicIcon')?.values[0],
                    variant: fragment?.fields.find((field) => field.name === 'variant')?.values[0],
                    rows: [],
                });
            }
            items.get(row.fragmentId).rows.push(row);
        }
        return { label, rows, counts: [...counts], items: [...items.values()] };
    }

    snapshotCategory(fragmentId, field) {
        if (fragmentId !== this.projectId || field === 'fragments') return 'Fragments';
        if (['geos', 'countries'].includes(field)) return 'Countries';
        if (field.toLowerCase().includes('offer') || field === 'promoCodeExceptions') return 'Offers';
        return 'General info';
    }

    fieldValue(fragment, field) {
        if (field.startsWith('@')) return fragment?.[field.slice(1)] ?? '';
        return fragment?.fields.find((item) => item.name === field)?.values ?? [];
    }

    formatValue(value) {
        if (Array.isArray(value)) return value.length ? value.map((item) => this.formatValue(item)).join('\n') : 'Empty';
        if (value === null || value === undefined || value === '') return 'Empty';
        if (Object(value) === value) return JSON.stringify(value, null, 2);
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
        if (event.label) return event.label;
        if (event.version) return `Version ${event.version}`;
        return (
            {
                create: 'Project created',
                duplicate: 'Project duplicated',
                restore: 'Restored version',
                publish: 'Published',
                unpublish: 'Unpublished',
                delete: 'Deleted',
                backup: 'Backup',
            }[event.action] ?? 'Version'
        );
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
        if (!this.canRestore || (mode === 'full' && this.unavailable.length)) return;
        if (mode === 'selected' && !this.selectedFields.size) return;
        this.confirmation = mode;
    }

    async confirmRestore() {
        if (!this.canRestore || !this.confirmation) return;
        const full = this.confirmation === 'full';
        if ((full && this.unavailable.length) || (!full && !this.selections.length)) return;
        const selections = this.selections;
        const targets = new Set(selections.map((selection) => selection.fragmentId));
        const options = {
            ...(full ? {} : { selections }),
            expected: this.expected.filter((target) => full || targets.has(target.fragmentId)),
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
            const status = error.status ?? error.statusCode ?? error.response?.status;
            this.operationError =
                {
                    401: 'Sign in again before restoring this promotion.',
                    403: 'You do not have permission to restore this promotion. Check your MAS role and AEM permissions.',
                }[status] ??
                (status === 409 || status === 412
                    ? 'The project changed since you viewed this version. Reload the version and review before restoring.'
                    : 'Could not restore this version. Reload the version and retry. Deleted fragments are not recreated.');
            return;
        } finally {
            this.operating = false;
        }
        if (projectId !== this.projectId || !this.isConnected) return;
        const failed = result.failures?.length ?? 0;
        Events.toast.emit({
            variant: failed ? 'warning' : 'positive',
            message: `Restored ${result.restored.length} fragment(s) as a draft. Audit event ${result.event.id}. Nothing published.${
                failed ? ` ${failed} fragment(s) could not be restored.` : ''
            }`,
        });
        this.dispatchEvent(new CustomEvent('history-restored', { bubbles: true, composed: true, detail: result }));
        this.currentEventId = result.event.id;
        await this.loadHistory();
    }

    async createBackup() {
        if (!canManagePromotions() || this.busy || !this.projectId) return;
        const projectId = this.projectId;
        this.operating = true;
        this.operationError = '';
        try {
            await this.client.createPromotionBackup(projectId);
        } catch {
            if (projectId === this.projectId) this.operationError = 'Could not create a backup. Please retry.';
            return;
        } finally {
            this.operating = false;
        }
        if (projectId !== this.projectId || !this.isConnected) return;
        Events.toast.emit({ variant: 'positive', message: 'Backup created. No changes published.' });
        await this.loadHistory();
    }

    get sidebarHeaderTemplate() {
        return html`
            <h1>Version history</h1>
            ${this.searchTemplate}
        `;
    }

    get filterTemplate() {
        const fields = [
            ['user', 'User', 'text'],
            ['from', 'From date', 'date'],
            ['to', 'To date', 'date'],
            ['action', 'Action', 'text'],
            ['fragmentId', 'Fragment', 'text'],
        ];
        return html`
            <details class="history-filters">
                <summary>
                    <sp-icon-filter size="s"></sp-icon-filter>
                    Filters
                    ${Object.entries(this.filters).some(([name, value]) => name !== 'query' && value)
                        ? html`<span class="filter-active">Applied</span>`
                        : nothing}
                </summary>
                <form aria-label="History filters" @submit=${this.applyFilters}>
                    ${repeat(
                        fields,
                        ([name]) => name,
                        ([name, label, type]) => html`
                            <div class="filter">
                                <sp-field-label for=${`history-filter-${name}`}>${label}</sp-field-label>
                                <sp-textfield
                                    id=${`history-filter-${name}`}
                                    name=${name}
                                    type=${type}
                                    .value=${this.filters[name] ?? ''}
                                    ?disabled=${this.busy}
                                ></sp-textfield>
                            </div>
                        `,
                    )}
                    <sp-button type="submit" variant="secondary" ?disabled=${this.busy}>Apply filters</sp-button>
                </form>
            </details>
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
        const labels = [
            ...new Set(event.changes.map((change) => categoryLabels.get(change.category?.toLowerCase()) ?? 'Fragments')),
        ];
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
                    <span class="category-tag">${event.action}</span>
                    <strong
                        >${event.action === 'create'
                            ? 'Project created'
                            : `${event.changes.length} change${event.changes.length === 1 ? '' : 's'}`}</strong
                    >
                    ${repeat(
                        labels,
                        (label) => label,
                        (label) => html`<span class="category-tag">${label}</span>`,
                    )}
                </span>
                <span class="muted">${event.targetPath ?? event.targetId ?? event.projectId}</span>
                ${!event.snapshot ? html`<span class="muted">Read-only event</span>` : nothing}
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
                                          (value) =>
                                              html`<span class="value-tag"
                                                  >${row.category === 'Countries'
                                                      ? (getSelectedCountries([value])[0] ?? this.formatValue(value))
                                                      : this.formatValue(value)}</span
                                              >`,
                                      )}
                                  </span>`
                                : html`
                                      ${segment.kind === 'changed' || segment.kind === 'removed'
                                          ? html`<span class="before">${this.formatValue(row.before)}</span>`
                                          : nothing}
                                      ${segment.kind === 'changed'
                                          ? html`<span class="change-arrow" aria-label="changed to">&#8594;</span>`
                                          : nothing}
                                      <span class="after">${this.formatValue(row.after)}</span>
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
                ${!row.restorable && this.selectedEvent.snapshot
                    ? html`<small class="row-warning">Field is not present in this saved snapshot</small>`
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
                                                ${item.variant ? html`<span class="muted">· ${item.variant}</span>` : nothing}
                                            </div>`
                                          : nothing}
                                      ${repeat(
                                          item.rows,
                                          (row) => row.key,
                                          (row) => this.rowTemplate(row),
                                      )}
                                  </div>`,
                          )}
                          ${!group.rows.length ? html`<p class="muted group-empty">No changes</p>` : nothing}
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
                </div>
                <div class="selection-toolbar">
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
                </div>
            </div>
            ${!this.selectedEvent.snapshot
                ? html`<p class="muted">Read-only event. Restore is available from a saved backup.</p>`
                : !canManagePromotions()
                  ? html`<p class="muted">Read-only access. Only promotion managers can restore.</p>`
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
            <footer class="details-footer">
                <span class="muted">Restore saves a new draft. Nothing is published.</span>
                <sp-action-button
                    id="restore-full"
                    quiet
                    ?disabled=${!this.canRestore || this.unavailable.length > 0}
                    @click=${() => this.requestRestore('full')}
                    >Restore full project</sp-action-button
                >
            </footer>
        `;
    }

    get confirmationTemplate() {
        if (!this.confirmation) return nothing;
        return html`
            <sp-dialog-wrapper
                id="restore-confirmation"
                open
                mode="modal"
                underlay
                headline="Restore version"
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
                <p>
                    ${this.confirmation === 'full'
                        ? 'The complete saved project snapshot'
                        : `${this.selectedFields.size} selected field(s)`}
                    will be restored to the current draft.
                </p>
                <p>
                    Nothing will be published. Deleted fragments will not be recreated. Unsaved changes in the main editor are
                    not included or overwritten here.
                </p>
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
                    ${this.filterTemplate}
                    <div class="sidebar-tools">
                        <sp-action-button
                            id="create-backup"
                            quiet
                            ?disabled=${this.busy || !canManagePromotions() || !this.projectId}
                            @click=${this.createBackup}
                            ><sp-icon-add slot="icon" size="s"></sp-icon-add>Create backup</sp-action-button
                        >
                        <sp-action-button
                            id="history-back"
                            quiet
                            ?disabled=${this.busy}
                            @click=${() =>
                                this.dispatchEvent(new CustomEvent('history-back', { bubbles: true, composed: true }))}
                            ><sp-icon-chevron-left slot="icon" size="s"></sp-icon-chevron-left>Back to project</sp-action-button
                        >
                    </div>
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
