import { LitElement, css, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import router from '../router.js';
import Store from '../store.js';
import { Fragment } from '../aem/fragment.js';
import { inspectReferences, removeMissingReferences } from './reference-inspector.js';

class MasReferenceDiagnosisDialog extends LitElement {
    static properties = {
        report: { attribute: false },
        expanded: { state: true },
        groups: { state: true },
        aem: { attribute: false },
        roots: { attribute: false },
        confirmingRemoval: { state: true },
        removing: { state: true },
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
        this.confirmingRemoval = false;
        this.removing = false;
        this.cleanupMessage = '';
        this.cleanupErrors = [];
    }

    finish(confirmed) {
        if (this.removing) return;
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

    plainText(value) {
        return new DOMParser().parseFromString(value ?? '', 'text/html').body.textContent;
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
            this.report = await inspectReferences(this.aem, this.roots);
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

    willUpdate(changedProperties) {
        if (!changedProperties.has('report')) return;
        const groups = new Map();
        for (const [index, issue] of this.report.issues.entries()) {
            const key = issue.ownerId || issue.ownerPath || index;
            if (!groups.has(key)) groups.set(key, { owner: issue, issues: [] });
            groups.get(key).issues.push({ issue, index });
        }
        this.groups = [...groups.values()];
    }

    renderFragment(fragment, role) {
        const label = role === 'owner' ? fragment.title || fragment.label : fragment.label || fragment.title;
        return html`
            <div class=${role}>
                ${role === 'owner' ? html`<div class="caption">Referenced by</div>` : nothing}
                <div class="heading">
                    <strong
                        >${this.plainText(
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
                    ? html`<div class="subtitle">${this.plainText(role === 'owner' ? fragment.label : fragment.title)}</div>`
                    : nothing}
                <div class="path">${fragment.path}</div>
            </div>
        `;
    }

    renderIssue(issue, index) {
        const problem = issue.category === 'confirmed-problem';
        return html`
            <div class="issue" role="listitem">
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
                    <div class="issues" role="list">
                        ${repeat(
                            this.groups,
                            (group, index) => group.owner.ownerId || group.owner.ownerPath || index,
                            (group) => html`
                                ${this.renderFragment(
                                    {
                                        id: group.owner.ownerId,
                                        label: group.owner.ownerLabel,
                                        title: group.owner.ownerTitle,
                                        path: group.owner.ownerPath,
                                    },
                                    'owner',
                                )}
                                ${repeat(
                                    group.issues,
                                    (entry) => entry.index,
                                    (entry) => this.renderIssue(entry.issue, entry.index),
                                )}
                            `,
                        )}
                    </div>
                    ${!this.report.complete ? html`<h3>Inspection incomplete</h3>` : nothing}
                    ${repeat(
                        this.report.coverageGaps,
                        (gap, index) => index,
                        (gap) => html`<div class="gap">${gap.ownerPath ? `${gap.ownerPath}: ` : nothing}${gap.detail}</div>`,
                    )}
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
                                  <sp-button variant="accent" ?disabled=${this.removing} @click=${() => this.finish(true)}
                                      >Continue Publish</sp-button
                                  >
                              `}
                    </div>
                </sp-dialog>
            </dialog>
        `;
    }

    static async confirmFor(aem, roots) {
        const report = await inspectReferences(aem, roots);
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
                    previousFocus.focus();
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
