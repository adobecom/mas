import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';
import Store from '../store.js';
import Events from '../events.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { canManagePromotions } from '../groups.js';
import { PAGE_NAMES } from '../constants.js';
import { extractLocaleFromPath, extractSurfaceFromPath, resolvePromoVariationDefaultCard } from '../utils.js';
import { Fragment } from '../aem/fragment.js';
import { getCachedTagTitle } from '../aem/tag-cache.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { compareVersionValues, versionFieldValues } from '../common/utils/fragment-version.js';
import { VARIANTS } from '../editors/variant-picker.js';
import {
    getPromoNameFromPromoVariationPath,
    isPromoVariationPath,
    resolveDefaultPathFromPromoVariation,
} from './promotion-model.js';
import * as historyClient from './promotion-audit.js';
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
        currentEvent: { state: true },
        rows: { state: true },
        restoreRows: { state: true },
        comparingCurrent: { state: true },
        groups: { state: true },
        selectedFields: { state: true },
        expected: { state: true },
        unavailable: { state: true },
        loading: { state: true },
        baselineLoading: { state: true },
        operating: { state: true },
        error: { state: true },
        operationError: { state: true },
        auditWarning: { state: true },
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
        this.currentEvent = null;
        this.rows = [];
        this.restoreRows = [];
        this.comparingCurrent = false;
        this.groups = [];
        this.selectedFields = new Set();
        this.expected = [];
        this.unavailable = [];
        this.loading = false;
        this.baselineLoading = false;
        this.operating = false;
        this.error = '';
        this.operationError = '';
        this.auditWarning = '';
        this.cursor = null;
        this.filters = {};
        this.confirmation = '';
        this.collapsedGroups = new Set();
        this.listRequest = 0;
        this.versionRequest = 0;
        this.auditRetry = null;
        this.parentRequests = new Map();
        this.tagTitles = new Map();
        this.publicationTimer = null;
        this.currentSnapshot = null;
        this.reactivity = new ReactiveController(this, [Store.profile, Store.users]);
    }

    willUpdate(changed) {
        if (changed.has('projectId')) {
            this.currentEventId = '';
            this.currentEvent = null;
            this.currentSnapshot = null;
            this.auditWarning = '';
            this.auditRetry = null;
            this.filters = {};
            this.loadHistory();
        }
        if (changed.has('rows') || changed.has('restoreRows') || changed.has('comparingCurrent')) {
            this.groups = categories.map((label) => this.buildGroup(label)).filter((group) => group.rows.length);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearTimeout(this.publicationTimer);
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
        if (this.selectedEvent?.isCurrent) return undefined;
        return this.selectedEvent?.restoreMode === 'state'
            ? (this.selectedEvent.afterSnapshot ?? this.selectedEvent.snapshot)
            : (this.selectedEvent?.beforeSnapshot ?? this.selectedEvent?.snapshot);
    }

    get eligibleRows() {
        return this.displayRows.filter((row) => row.restorable && !this.unavailable.includes(row.fragmentId));
    }

    get displayRows() {
        return this.comparingCurrent ? this.restoreRows : this.rows;
    }

    get orderedEvents() {
        return this.currentEvent ? [this.currentEvent, ...this.events] : this.events;
    }

    toggleComparison() {
        this.comparingCurrent = !this.comparingCurrent;
        this.selectedFields = new Set();
        this.confirmation = '';
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

    get restoreImpactRows() {
        const selected = new Set(
            this.selections.flatMap(({ fragmentId, fields }) => fields.map((field) => JSON.stringify([fragmentId, field]))),
        );
        return this.restoreRows.filter((row) =>
            row.fields.some((field) => selected.has(JSON.stringify([row.fragmentId, field]))),
        );
    }

    async loadHistory(append = false, selectCurrent = this.selectedEvent?.isCurrent) {
        clearTimeout(this.publicationTimer);
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
            this.restoreRows = [];
            this.comparingCurrent = false;
            this.selectedFields = new Set();
            this.expected = [];
            this.unavailable = [];
            this.baselineLoading = false;
            this.operationError = '';
            this.confirmation = '';
            this.collapsedGroups = new Set();
            this.cursor = null;
            this.parentRequests.clear();
            this.tagTitles.clear();
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
            page.events = await Promise.all(
                page.events
                    .filter((event) => event.action !== 'restore' && !event.isAudit)
                    .map((event) => this.preparePresentation(event)),
            );
        } catch {
            if (request === this.listRequest) {
                this.error = 'Could not load version history. Please retry.';
                this.loading = false;
            }
            this.schedulePublicationRefresh();
            return;
        }
        if (request !== this.listRequest) return;
        const events = new Map((append ? this.events : []).map((event) => [event.id, event]));
        for (const event of page.events) events.set(event.id, event);
        this.events = [...events.values()];
        this.cursor = page.cursor;
        if (page.currentSnapshot) {
            this.currentSnapshot = page.currentSnapshot;
        } else if (Object.values(this.filters).every((value) => !value)) {
            const snapshots = new Map();
            for (const event of this.events.filter((item) => ['create', 'save', 'duplicate'].includes(item.action))) {
                for (const entry of (event.afterSnapshot ?? event.snapshot)?.fragments ?? []) {
                    if (!snapshots.has(entry.id)) snapshots.set(entry.id, entry);
                }
            }
            this.currentSnapshot = { fragments: [...snapshots.values()] };
        }
        if (!append && this.events.length && !selectCurrent) await this.selectVersion(this.events[0]);
        await this.refreshCurrent(request);
        if (request !== this.listRequest) return;
        if (this.currentEvent && (selectCurrent || !this.selectedEvent)) await this.selectVersion(this.currentEvent);
        this.loading = false;
        this.schedulePublicationRefresh();
    }

    async refreshCurrent(request) {
        const entries = this.currentSnapshot?.fragments ?? [];
        const results = await Promise.allSettled(
            entries.map(async (entry) => {
                const [saved, current] = await Promise.all([
                    this.repository.aem.sites.cf.fragments.getVersion(entry.id, entry.versionId),
                    this.repository.aem.sites.cf.fragments.getWithEtag(entry.id),
                ]);
                return { saved, current: { ...current, id: entry.id, path: entry.path } };
            }),
        );
        if (request !== this.listRequest) return;
        const fragments = results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
        let project = fragments.find(({ current }) => current.id === this.projectId)?.current;
        try {
            project ??= await this.repository.aem.sites.cf.fragments.getWithEtag(this.projectId);
        } catch {
            if (request === this.listRequest) {
                this.error = 'Could not load the current draft. Reload history to retry.';
                this.currentEvent = null;
            }
            return;
        }
        if (request !== this.listRequest) return;
        this.currentEventId = 'current';
        this.currentEvent = {
            id: 'current',
            isCurrent: true,
            action: 'current',
            comparisonAvailable: entries.length > 0 && fragments.length === entries.length,
            projectId: this.projectId,
            createdAt: project.modified?.at ?? project.modified ?? this.events[0]?.createdAt ?? new Date().toISOString(),
            user: {
                name: project.modified?.fullName ?? project.modified?.by ?? this.events[0]?.user.name ?? 'Unknown author',
            },
            fragments: fragments.map(({ current }) => current),
            changes: fragments.flatMap(({ saved, current }) =>
                compareVersionValues(versionFieldValues(saved), versionFieldValues(current), null).map((change) => ({
                    ...change,
                    fragmentId: current.id,
                    path: current.path,
                    category: this.snapshotCategory(current.id, change.field),
                })),
            ),
            comparisonWarning: results.some((result) => result.status === 'rejected')
                ? 'Some saved versions or current fragments could not be read. The current comparison is incomplete.'
                : '',
        };
        this.currentEvent.displayChanges = this.currentEvent.changes;
    }

    schedulePublicationRefresh() {
        clearTimeout(this.publicationTimer);
        if (!this.isConnected || !this.events.some((event) => event.publicationOutcome === 'pending')) return;
        this.publicationTimer = setTimeout(() => {
            if (this.busy || this.confirmation) this.schedulePublicationRefresh();
            else this.refreshPublications();
        }, 3000);
    }

    async refreshPublications() {
        const projectId = this.projectId;
        const request = this.listRequest;
        const pending = this.events.filter((event) => event.publicationOutcome === 'pending').map((event) => event.id);
        try {
            for (let offset = 0; offset < pending.length; offset += 100) {
                const page = await this.client.listPromotionHistory(projectId, {
                    eventIds: pending.slice(offset, offset + 100),
                    limit: 100,
                });
                if (!this.isConnected || request !== this.listRequest) return;
                const updates = new Map(page.events.map((event) => [event.id, event]));
                this.events = this.events.map((event) => {
                    const update = updates.get(event.id);
                    return update ? { ...event, ...update, publicationCheckError: update.publicationCheckError } : event;
                });
                this.selectedEvent = this.orderedEvents.find((event) => event.id === this.selectedEvent?.id) ?? null;
                this.error = '';
            }
        } catch {
            if (request === this.listRequest) this.error = 'Could not refresh publication status. Reload history to retry.';
        } finally {
            if (request === this.listRequest) this.schedulePublicationRefresh();
        }
    }

    async retryPendingAudits() {
        try {
            const status = await this.client.retryPendingPromotionAudits(this.projectId);
            this.auditWarning = status?.pending
                ? 'Some saved changes have an unresolved history record. Review the current draft before making further changes.'
                : '';
        } catch {
            Events.toast.emit({
                variant: 'warning',
                message: 'Some saved changes could not be added to history. Version history will still be loaded.',
            });
        }
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

    async readLegacyParent(path) {
        if (!this.parentRequests.has(path)) {
            this.parentRequests.set(path, this.resolveLegacyParent(path));
        }
        return this.parentRequests.get(path);
    }

    async resolveLegacyParent(path) {
        const name = getPromoNameFromPromoVariationPath(path);
        for (const candidate of resolveDefaultPathFromPromoVariation(path, name)) {
            let parent;
            try {
                parent = await this.repository.aem.sites.cf.fragments.getByPath(candidate);
            } catch (error) {
                if ((error.status ?? error.statusCode) !== 404) throw error;
                continue;
            }
            if (parent) return resolvePromoVariationDefaultCard(this.repository.aem, parent);
        }
        throw new Error('Promotion variation parent is unavailable');
    }

    async preparePresentation(event) {
        const beforeManifest = event.restoreMode === 'state' ? event.beforeContext : (event.beforeSnapshot ?? event.snapshot);
        const unavailableParents = new Set(
            [...(beforeManifest?.inheritanceUnavailable ?? []), ...(event.afterSnapshot?.inheritanceUnavailable ?? [])].map(
                (entry) => entry.fragmentId,
            ),
        );
        let beforeParents;
        let afterParents;
        let comparisonWarning = unavailableParents.size
            ? 'Historical inheritance is unavailable for some variations. Raw stored differences are shown for those variations.'
            : '';
        try {
            [beforeParents, afterParents] = await Promise.all([
                this.readInheritance(beforeManifest),
                this.readInheritance(event.afterSnapshot),
            ]);
            if (!beforeManifest?.inheritance && !event.afterSnapshot?.inheritance && !unavailableParents.size) {
                const paths = new Map(event.changes.map((change) => [change.fragmentId, change.path ?? event.targetPath]));
                for (const [id, path] of paths) {
                    if (!isPromoVariationPath(path)) continue;
                    const parent = await this.readLegacyParent(path);
                    beforeParents.set(id, parent);
                    afterParents.set(id, parent);
                    comparisonWarning =
                        'This older entry has no saved parent snapshot. Inherited values use the current parent.';
                }
            }
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
        this.restoreRows = [];
        this.comparingCurrent = false;
        if (event.isCurrent) {
            this.historicalFragments = event.fragments;
            this.rows = this.buildRows(event, new Map());
            this.baselineLoading = false;
            return;
        }
        this.baselineLoading = true;
        if (!event.displayChanges) event = await this.preparePresentation(event);
        if (request !== this.versionRequest) return;
        this.selectedEvent = event;
        const entries = (this.restoreSnapshot ?? event.afterSnapshot)?.fragments ?? [];
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
        this.restoreRows = this.buildSnapshotRows(current);
        this.rows =
            !event.restoreMode && !event.changes.length && this.restoreSnapshot
                ? this.restoreRows
                : this.buildRows(event, current);
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
                event.restoreMode === 'undo' &&
                current.has(change.fragmentId) &&
                JSON.stringify(this.fieldValue(current.get(change.fragmentId), change.field)) !==
                    JSON.stringify(Object.hasOwn(change, 'rawAfter') ? change.rawAfter : change.after);
            rows.set(key, {
                ...change,
                key,
                category: categoryLabels.get(change.category?.toLowerCase()) ?? 'Fragments',
                restorable: Boolean(
                    this.restoreSnapshot &&
                        fragment &&
                        !conflicted &&
                        (event.restoreMode !== 'state' ||
                            JSON.stringify(this.fieldValue(current.get(change.fragmentId), change.field)) !==
                                JSON.stringify(this.fieldValue(fragment, change.field))) &&
                        (change.field.startsWith('@')
                            ? Object.hasOwn(fragment, change.field.slice(1))
                            : fragment.fields.some((field) => field.name === change.field)),
                ),
                conflicted,
                before: change.before,
                after:
                    fragment && this.restoreSnapshot && !event.restoreMode
                        ? this.effectiveValue(
                              this.fieldValue(fragment, change.field),
                              change.field,
                              event.afterParents?.get(change.fragmentId),
                          )
                        : change.after,
            });
        }
        return this.prepareRows([...rows.values()]);
    }

    buildSnapshotRows(current) {
        const rows = [];
        for (const fragment of this.restoreSnapshot ? this.historicalFragments : []) {
            const fields = [
                ...['title', 'description', 'tags']
                    .filter((field) => Object.hasOwn(fragment, field))
                    .map((field) => `@${field}`),
                ...fragment.fields.map((field) => field.name),
            ];
            for (const field of fields) {
                const key = JSON.stringify([fragment.id, field]);
                rows.push({
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
        return this.prepareRows(rows);
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
        const rows = this.displayRows.filter((row) => row.category === label);
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
        if (event.isCurrent) return 'Current';
        return `Version ${event.version}`;
    }

    eventLabel(event) {
        if (event.isCurrent) {
            if (!event.comparisonAvailable) return 'Current draft — comparison unavailable';
            return event.changes.length ? 'Draft changed' : 'Draft matches the last saved state';
        }
        const project = (event.targetId ?? event.projectId) === event.projectId;
        const subject = project ? 'Project' : 'Promo variation';
        if (event.action === 'create') return `${subject} created`;
        if (event.action === 'duplicate') return `${subject} duplicated`;
        if (['publish', 'unpublish'].includes(event.action) && event.publicationCheckError) {
            return `${subject} ${event.action === 'publish' ? 'publication' : 'unpublication'} status unavailable`;
        }
        if (event.action === 'publish') {
            if (event.publicationOutcome === 'failed') return `${subject} publication failed`;
            if (event.publicationOperation?.status === 'SCHEDULED') return `${subject} publication scheduled`;
            if (
                !event.publicationOperation &&
                event.publicationOutcome !== 'pending' &&
                event.publicationStatus === 'PUBLISHED'
            ) {
                return `${subject} published`;
            }
            return `${subject} publication pending`;
        }
        if (event.action === 'unpublish') {
            if (event.publicationOutcome === 'failed') return `${subject} unpublication failed`;
            if (event.publicationOperation?.status === 'SCHEDULED') return `${subject} unpublication scheduled`;
            return `${subject} ${
                !event.publicationOperation &&
                event.publicationOutcome !== 'pending' &&
                event.publicationStatus === 'UNPUBLISHED'
                    ? 'unpublished'
                    : 'unpublication pending'
            }`;
        }
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
            if (error.details?.auditPending) {
                this.expected = [];
                this.operationError =
                    'Some changes have already been restored, but history could not be completed. Do not retry the restore; reload and review the current content first.';
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
            message: result.unchanged
                ? 'Selected fields already match this version.'
                : !failed
                  ? 'Selected changes have been successfully restored.'
                  : `Restored ${result.restored.length} fragment(s) as a draft. Audit event ${result.event.id}. Nothing published.${
                        failed ? ` ${failed} fragment(s) could not be restored.` : ''
                    }`,
        });
        this.dispatchEvent(new CustomEvent('history-restored', { bubbles: true, composed: true, detail: result }));
        await this.loadHistory(false, true);
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
                    ${this.selectedEvent.restoreMode === 'state'
                        ? html`<p class="version-meta">Restore uses the saved state of this version.</p>`
                        : this.selectedEvent.restoreMode === 'undo'
                          ? html`<p class="version-meta">Legacy entry: Restore undoes the selected changes.</p>`
                          : nothing}
                    ${this.selectedEvent.sourceProjectId
                        ? html`<a
                              class="fragment-link"
                              href=${`#${new URLSearchParams({
                                  page: PAGE_NAMES.PROMOTIONS_EDITOR,
                                  promotionId: this.selectedEvent.sourceProjectId,
                              })}`}
                              >Open source project</a
                          >`
                        : nothing}
                </div>
                ${this.selectedEvent.isCurrent
                    ? html`<p class="muted">Current draft compared with the last recorded saved state.</p>`
                    : this.displayRows.length
                      ? this.selectionToolbarTemplate
                      : html`<p class="muted">No content changes. ${this.eventLabel(this.selectedEvent)}</p>`}
            </div>
            ${this.selectedEvent.restoreMode === 'state' && this.historicalFragments.length
                ? html`<sp-action-button id="compare-current" ?disabled=${this.busy} @click=${this.toggleComparison}
                          >${this.comparingCurrent ? 'Show recorded changes' : 'Compare with current'}</sp-action-button
                      >
                      ${this.comparingCurrent
                          ? html`<p class="version-meta">
                                Current draft compared with this saved snapshot. These are restore effects, not historical
                                changes.
                            </p>`
                          : nothing}`
                : nothing}
            ${this.selectedEvent.comparisonWarning
                ? html`<p class="row-warning">${this.selectedEvent.comparisonWarning}</p>`
                : nothing}
            ${this.selectedEvent.publicationCheckError
                ? html`<p class="row-warning">${this.selectedEvent.publicationCheckError}</p>`
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
                <p>
                    ${this.selectedEvent.restoreMode === 'state'
                        ? `Restore selected fields to the saved state of ${this.versionLabel(this.selectedEvent)}? Only the draft will be updated.`
                        : 'Do you want to continue to restore selected changes?'}
                </p>
                ${this.selectedEvent.restoreMode === 'state'
                    ? html`<p>Current draft &#8594; saved state. Nothing will be published.</p>
                          ${repeat(
                              this.restoreImpactRows,
                              (row) => row.key,
                              (row) =>
                                  html`<div class="change-line">
                                      <span class="field-label">${row.label}:</span>
                                      <span class="before">${this.formatValue(row.before, row.field)}</span>
                                      <span class="change-arrow" aria-label="changed to">&#8594;</span>
                                      <span class="after">${this.formatValue(row.after, row.field)}</span>
                                  </div>`,
                          )}`
                    : nothing}
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
                            this.orderedEvents,
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
                    ${this.auditWarning ? html`<p class="row-warning" role="status">${this.auditWarning}</p>` : nothing}
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
