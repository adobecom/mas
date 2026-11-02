import { LitElement, css, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import router from '../router.js';
import Store from '../store.js';
import { Fragment } from '../aem/fragment.js';
import { stripHtml } from '../utils.js';
import { inspectReferences, removeMissingReferences } from './reference-inspector.js';

const INSPECTION_OPTIONS = { recursive: false };

class MasReferenceDiagnosisDialog extends LitElement {
    static properties = {
        report: { attribute: false },
        expanded: { state: true },
        groups: { state: true },
        aem: { attribute: false },
        roots: { attribute: false },
        confirmingRemoval: { state: true },
        removing: { state: true },
        waitingForSave: { state: true },
        cleanupMessage: { state: true },
        cleanupErrors: { state: true },
    };

    static styles = css`
        :host {
            display: contents;
        }
        dialog {
            width: min(760px, calc(100vw - 32px));
            max-height: calc(100dvh - 32px);
            background: var(--spectrum-background-layer-1-color, white);
            border-radius: 8px;
            padding: 0;
            border: 0;
        }
        dialog::backdrop {
            background: rgba(0, 0, 0, 0.4);
        }
        sp-dialog {
            width: 100%;
            max-height: inherit;
        }
        .issues {
            overflow: auto;
            max-height: 55dvh;
        }
        .issue {
            border-bottom: 1px solid var(--spectrum-gray-300);
            padding: 8px 0;
        }
        .heading {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .status {
            font-weight: 700;
        }
        .heading strong {
            min-width: 0;
            flex: 1;
            overflow-wrap: anywhere;
        }
        sp-action-button {
            flex-shrink: 0;
        }
        .owner {
            margin-block: 12px;
        }
        .target {
            margin-block: 4px;
        }
        .caption,
        .subtitle {
            font-size: 12px;
        }
        .problem {
            color: var(--spectrum-negative-color);
        }
        .review {
            color: var(--spectrum-notice-color);
        }
        .path,
        .detail,
        .gap {
            overflow-wrap: anywhere;
        }
        .path,
        .field {
            font-size: 12px;
        }
        .detail {
            margin-top: 8px;
        }
        .gap {
            margin-block: 8px;
        }
        .actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 8px;
            width: 100%;
        }
        .confirmation,
        .cleanup-status {
            margin-block: 12px;
        }
        .cleanup-progress {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .cleanup-progress sp-progress-circle {
            flex-shrink: 0;
        }
        @media (max-width: 600px) {
            .actions {
                flex-direction: column;
            }
            .actions sp-button {
                width: 100%;
            }
        }
    `;

    constructor() {
        super();
        this.report = { complete: true, issues: [], coverageGaps: [] };
        this.expanded = new Set();
        this.groups = [];
        this.roots = [];
        this.pendingSaveRefreshes = new Map();
        this.confirmingRemoval = false;
        this.removing = false;
        this.waitingForSave = false;
        this.finished = false;
        this.cleanupMessage = '';
        this.cleanupErrors = [];
    }

    finish(confirmed) {
        if (this.removing || this.finished || (confirmed && this.waitingForSave)) return;
        this.finished = true;
        this.dispatchEvent(new CustomEvent('diagnosis-decided', { bubbles: true, composed: true, detail: { confirmed } }));
    }

    firstUpdated() {
        this.shadowRoot.querySelector('dialog').showModal();
    }

    toggleDetail(index) {
        const next = new Set(this.expanded);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        this.expanded = next;
    }

    editFragment(id) {
        if (this.removing) return;
        this.finish(false);
        return router.navigateToFragmentEditor(id, { viewPage: true });
    }

    get removableIssues() {
        return this.report.issues.filter((issue) => issue.removable);
    }

    syncSavedFragments(fragments) {
        const stores = new Set([...Store.fragments.list.data.get(), Store.fragments.inEdit.get()].filter(Boolean));
        for (const fragment of fragments) {
            for (const root of this.roots) {
                if (root.id !== fragment.id) continue;
                if (root instanceof Fragment) root.refreshFrom(fragment);
                else Object.assign(root, fragment);
            }
            for (const store of stores) {
                if (store.get().id === fragment.id) store.refreshFrom(fragment);
            }
        }
    }

    async removeMissing({ saveTimeoutMs = 10000 } = {}) {
        if (this.removing) return;
        this.removing = true;
        this.confirmingRemoval = false;
        this.cleanupMessage = '';
        this.cleanupErrors = [];
        try {
            const result = await removeMissingReferences(this.aem, this.removableIssues, {
                hasUnsavedChanges: () => Store.editor.hasChanges,
                saveTimeoutMs,
            });
            this.syncSavedFragments(result.savedFragments);
            this.cleanupErrors = result.failures;
            this.expanded = new Set();
            this.report = await inspectReferences(this.aem, this.roots, INSPECTION_OPTIONS);
            const pendingOwners = new Set(
                result.failures.filter((failure) => failure.pending).map((failure) => failure.ownerId),
            );
            if (pendingOwners.size) {
                this.report = {
                    ...this.report,
                    issues: this.report.issues.map((issue) =>
                        pendingOwners.has(issue.ownerId) ? { ...issue, removable: false } : issue,
                    ),
                };
            }
            for (const failure of result.failures.filter((entry) => entry.pending && entry.pendingSave)) {
                if (this.pendingSaveRefreshes.has(failure.ownerId)) continue;
                const refresh = failure.pendingSave
                    .then(
                        () => undefined,
                        () => undefined,
                    )
                    .then(async () => {
                        try {
                            const fragment = await this.aem.sites.cf.fragments.getWithEtag(failure.ownerId);
                            this.syncSavedFragments([fragment]);
                            return { success: true };
                        } catch (error) {
                            return { success: false, error };
                        }
                    });
                this.pendingSaveRefreshes.set(failure.ownerId, refresh);
            }
            if (result.removedCount) {
                this.cleanupMessage =
                    this.report.complete && !this.report.issues.length && !result.failures.length
                        ? 'Missing references removed. No reference issues found.'
                        : `${result.removedCount} missing references removed.`;
            }
        } catch (error) {
            this.cleanupErrors = [...this.cleanupErrors, { ownerPath: '', detail: error.message }];
            this.report = {
                ...this.report,
                complete: false,
                issues: this.report.issues.map((issue) => ({ ...issue, removable: false })),
            };
        } finally {
            this.removing = false;
        }
    }

    async continuePublish() {
        if (this.removing || this.waitingForSave) return;
        const pendingFailures = this.cleanupErrors.filter((failure) => failure.pending && failure.pendingSave);
        if (!pendingFailures.length) {
            this.finish(true);
            return;
        }

        this.waitingForSave = true;
        this.cleanupMessage = 'Waiting for the pending cleanup save before publishing.';
        try {
            const outcomes = await Promise.all(
                pendingFailures.map(({ ownerId, pendingSave }) =>
                    pendingSave.then(
                        () => ({ ownerId }),
                        (error) => ({ ownerId, error }),
                    ),
                ),
            );
            const ownerIds = [...new Set(outcomes.map(({ ownerId }) => ownerId))];
            const failedOwners = new Set(outcomes.filter((outcome) => outcome.error).map((outcome) => outcome.ownerId));
            const refreshResults = await Promise.all(ownerIds.map((id) => this.pendingSaveRefreshes.get(id)));
            const failedRefreshes = refreshResults.filter((result) => !result.success);
            const outcomesByOwner = new Map(outcomes.map((outcome) => [outcome.ownerId, outcome]));
            this.cleanupErrors = this.cleanupErrors.flatMap((failure) => {
                const outcome = outcomesByOwner.get(failure.ownerId);
                if (!outcome) return [failure];
                if (!outcome.error) return [];
                const { pendingSave, ...settledFailure } = failure;
                return [{ ...settledFailure, pending: false, detail: outcome.error.message }];
            });
            if (failedRefreshes.length) {
                this.cleanupErrors = [
                    ...this.cleanupErrors,
                    ...failedRefreshes.map(({ error }) => ({
                        ownerPath: '',
                        detail: `Could not refresh the fragment after cleanup save: ${error.message}`,
                    })),
                ];
                this.cleanupMessage = '';
                this.waitingForSave = false;
                return;
            }
            if (this.isConnected) this.report = await inspectReferences(this.aem, this.roots, INSPECTION_OPTIONS);
            if (failedOwners.size) {
                this.cleanupMessage = 'A cleanup save failed. Review the result before deciding whether to publish.';
                this.waitingForSave = false;
                return;
            }
        } catch (error) {
            this.cleanupErrors = [
                ...this.cleanupErrors,
                { ownerPath: '', detail: `Could not refresh fragments after cleanup save: ${error.message}` },
            ];
            this.cleanupMessage = '';
            this.waitingForSave = false;
            return;
        }

        this.waitingForSave = false;
        if (!this.finished) this.finish(true);
    }

    willUpdate(changedProperties) {
        if (!changedProperties.has('report')) return;
        const groups = new Map();
        for (const [index, issue] of this.report.issues.entries()) {
            const key = issue.targetPath;
            if (!groups.has(key)) groups.set(key, { issue, index, owners: new Map() });
            this.addReferenceOwner(groups.get(key), issue, index);
        }
        this.groups = [...groups.values()];
    }

    addReferenceOwner(group, issue, index) {
        if (issue.category === 'confirmed-problem' && group.issue.category !== 'confirmed-problem') {
            group.issue = issue;
            group.index = index;
        }
        const key = issue.ownerId || issue.ownerPath;
        if (!group.owners.has(key)) group.owners.set(key, { issue, locations: new Set(), details: new Set() });
        const owner = group.owners.get(key);
        owner.locations.add(`${issue.fieldName}${issue.valueIndex === null ? '' : `[${issue.valueIndex}]`}`);
        if (issue.detail) owner.details.add(issue.detail);
    }

    get coverageGaps() {
        return [...new Map(this.report.coverageGaps.map((gap) => [JSON.stringify([gap.ownerPath, gap.detail]), gap])).values()];
    }

    renderReferenceOwner(owner) {
        return html`
            ${this.renderFragment(
                {
                    id: owner.issue.ownerId,
                    label: owner.issue.ownerLabel,
                    title: owner.issue.ownerTitle,
                    path: owner.issue.ownerPath,
                },
                'owner',
            )}
            <div class="locations">${[...owner.locations].join(', ')}</div>
            ${repeat(
                owner.details,
                (detail) => detail,
                (detail) => html`<div>${detail}</div>`,
            )}
        `;
    }

    renderFragment(fragment, role) {
        const label = role === 'owner' ? fragment.title || fragment.label : fragment.label || fragment.title;
        return html`
            <div class=${role}>
                ${role === 'owner' ? html`<div class="caption">Referenced by</div>` : nothing}
                <div class="heading">
                    <strong
                        >${stripHtml(
                            label || (role === 'owner' ? 'Fragment title unavailable' : 'Reference unavailable'),
                        )}</strong
                    >
                    ${fragment.id
                        ? html`<sp-action-button
                              class="edit-${role}"
                              quiet
                              label="Edit ${role}"
                              ?disabled=${this.removing}
                              @click=${() => this.editFragment(fragment.id)}
                          >
                              <sp-icon-edit slot="icon"></sp-icon-edit>
                              <sp-tooltip self-managed placement="bottom">Edit ${role}</sp-tooltip>
                          </sp-action-button>`
                        : nothing}
                </div>
                ${fragment.label && fragment.title
                    ? html`<div class="subtitle">${stripHtml(role === 'owner' ? fragment.label : fragment.title)}</div>`
                    : nothing}
                <div class="path">${fragment.path}</div>
            </div>
        `;
    }

    renderIssue(issue, index) {
        const problem = issue.category === 'confirmed-problem';
        return html`
            <div class="issue">
                <div class="heading">
                    <span class="status ${problem ? 'problem' : 'review'}">${problem ? 'Problem' : 'Needs review'}</span>
                    <span class="field"
                        >${issue.fieldName ? issue.fieldName[0].toUpperCase() + issue.fieldName.slice(1) : 'Fragment'}</span
                    >
                    <sp-action-button
                        quiet
                        label="Details"
                        aria-expanded=${this.expanded.has(index)}
                        @click=${() => this.toggleDetail(index)}
                    >
                        <sp-icon-info-outline slot="icon"></sp-icon-info-outline>
                        <sp-tooltip self-managed placement="bottom">${issue.detail}</sp-tooltip>
                    </sp-action-button>
                </div>
                ${this.renderFragment(
                    { id: issue.targetId, label: issue.targetLabel, title: issue.targetTitle, path: issue.targetPath },
                    'target',
                )}
                ${this.expanded.has(index)
                    ? html`<div class="detail">
                          ${issue.detail}
                          <div>${issue.fieldName}${issue.valueIndex === null ? nothing : `[${issue.valueIndex}]`}</div>
                          <div>${issue.evidence}</div>
                      </div>`
                    : nothing}
            </div>
        `;
    }

    render() {
        return html`
            <dialog
                aria-label="Reference diagnosis"
                aria-busy=${this.removing}
                @cancel=${(event) => {
                    event.preventDefault();
                    this.finish(false);
                }}
            >
                <sp-dialog size="l" no-divider>
                    <h2 slot="heading">Reference diagnosis</h2>
                    ${this.removing
                        ? html`<div class="cleanup-status cleanup-progress" role="status">
                              <sp-progress-circle
                                  size="s"
                                  indeterminate
                                  label="Removing missing references and checking results"
                              ></sp-progress-circle>
                              <span>Removing missing references and checking results...</span>
                          </div>`
                        : nothing}
                    ${this.cleanupMessage ? html`<p class="cleanup-status" role="status">${this.cleanupMessage}</p>` : nothing}
                    ${repeat(
                        this.cleanupErrors,
                        (failure, index) => index,
                        (failure) => html`<div class="gap" role="alert">${failure.ownerPath}: ${failure.detail}</div>`,
                    )}
                    ${this.confirmingRemoval
                        ? html`<p class="confirmation">
                              Remove ${this.removableIssues.length} missing reference(s) and save the affected fragments?
                              Content will not be published.
                          </p>`
                        : nothing}
                    <div class="issues">
                        ${repeat(
                            this.groups,
                            (group) => group.issue.targetPath,
                            (group) => html`
                                ${this.renderIssue(group.issue, group.index)}
                                <details class="reference-owners">
                                    <summary>
                                        Show details (${group.owners.size} referring
                                        ${group.owners.size === 1 ? 'fragment' : 'fragments'})
                                    </summary>
                                    ${repeat(
                                        group.owners.values(),
                                        (owner) => owner.issue.ownerId || owner.issue.ownerPath,
                                        (owner) => this.renderReferenceOwner(owner),
                                    )}
                                </details>
                            `,
                        )}
                    </div>
                    ${!this.report.complete
                        ? html`<div class="coverage-warning" role="status">
                              <p>Some references could not be checked. Unchecked references are not confirmed missing.</p>
                              ${this.report.coverageGaps.length
                                  ? html`<details>
                                        <summary>Show details</summary>
                                        ${repeat(
                                            this.coverageGaps,
                                            (gap, index) => index,
                                            (gap) =>
                                                html`<div class="gap">
                                                    ${gap.ownerPath ? `${gap.ownerPath}: ` : nothing}${gap.detail}
                                                </div>`,
                                        )}
                                    </details>`
                                  : nothing}
                          </div>`
                        : nothing}
                    <div class="actions" slot="button" role="group" aria-label="Publish actions">
                        <sp-button
                            variant="secondary"
                            treatment="outline"
                            ?disabled=${this.removing}
                            @click=${() => this.finish(false)}
                            >Close</sp-button
                        >
                        ${this.confirmingRemoval
                            ? html`
                                  <sp-button
                                      class="cancel-removal"
                                      variant="secondary"
                                      @click=${() => {
                                          this.confirmingRemoval = false;
                                      }}
                                      >Cancel removal</sp-button
                                  >
                                  <sp-button class="confirm-removal" variant="negative" @click=${() => this.removeMissing()}
                                      >Confirm removal</sp-button
                                  >
                              `
                            : html`
                                  ${this.aem && this.removableIssues.length
                                      ? html`<sp-button
                                            class="remove-missing"
                                            variant="secondary"
                                            ?disabled=${this.removing}
                                            @click=${() => {
                                                this.confirmingRemoval = true;
                                            }}
                                            >Remove missing references (${this.removableIssues.length})</sp-button
                                        >`
                                      : nothing}
                                  <sp-button
                                      variant="accent"
                                      ?disabled=${this.removing || this.waitingForSave}
                                      @click=${() => this.continuePublish()}
                                      >Continue Publish</sp-button
                                  >
                              `}
                    </div>
                </sp-dialog>
            </dialog>
        `;
    }

    static async confirmFor(aem, roots) {
        const report = await inspectReferences(aem, roots, INSPECTION_OPTIONS);
        if (report.complete && !report.issues.length) return true;
        return this.show(report, { aem, roots });
    }

    static async show(report, { aem, roots = [] } = {}) {
        const previousFocus = document.activeElement;
        const dialog = document.createElement('mas-reference-diagnosis-dialog');
        dialog.report = report;
        dialog.aem = aem;
        dialog.roots = roots;
        const decision = new Promise((resolve) => {
            dialog.addEventListener(
                'diagnosis-decided',
                (event) => {
                    dialog.remove();
                    if (previousFocus.isConnected) previousFocus.focus();
                    resolve(event.detail.confirmed);
                },
                { once: true },
            );
        });
        (document.querySelector('sp-theme') ?? document.body).append(dialog);
        await dialog.updateComplete;
        dialog.shadowRoot.querySelector('sp-button').focus();
        return decision;
    }
}

customElements.define('mas-reference-diagnosis-dialog', MasReferenceDiagnosisDialog);
export { MasReferenceDiagnosisDialog };
