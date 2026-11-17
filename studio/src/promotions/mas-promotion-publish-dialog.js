import { LitElement, html, css, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { PAGE_NAMES } from '../constants.js';
import { buildProjectDeepLink, showToast } from '../utils.js';
import { canAccessBulkPublish } from '../groups.js';
import { confirmPublishDespiteUnpublishedPromoVariations, publishPromotionProject } from './promotion-publish-utils.js';

class MasPromotionPublishDialog extends LitElement {
    static properties = {
        phase: { state: true },
        plan: { state: true },
        checked: { state: true },
        result: { state: true },
    };

    static styles = css`
        p {
            margin: 0 0 16px;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        .error {
            color: var(--spectrum-negative-content-color, #b40000);
        }
        .progress {
            display: flex;
            align-items: center;
            gap: 12px;
        }
    `;

    #resolveConfirmation;
    #cancelled = false;

    constructor() {
        super();
        this.phase = 'closed';
        this.checked = true;
        this.plan = { groups: [], warnings: [], targetCount: 0 };
        this.result = null;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.phase === 'loading' || this.phase === 'confirm') this.#cancelled = true;
        this.#resolveConfirmation?.({ confirmed: false, checked: false });
        this.#resolveConfirmation = null;
    }

    async requestPublish(repository, promotion) {
        if (this.phase !== 'closed') {
            showToast('Close the current publish result before starting another request.', 'info');
            return;
        }
        this.phase = 'loading';
        this.#cancelled = false;
        this.checked = true;
        this.result = null;
        this.plan = { promotionId: promotion.id, targetCount: 0, groups: [], warnings: [] };
        try {
            const choice = await confirmPublishDespiteUnpublishedPromoVariations(
                repository.aem,
                promotion,
                (title, message, options) => {
                    if (this.#cancelled) return Promise.resolve({ confirmed: false, checked: false });
                    this.plan = options.plan;
                    this.phase = 'confirm';
                    return new Promise((resolve) => {
                        this.#resolveConfirmation = resolve;
                    });
                },
            );
            if (this.#cancelled || !choice.confirmed) {
                this.phase = 'confirm';
                this.close();
                return;
            }
            const allowed = this.dispatchEvent(
                new CustomEvent('promotion-publish-confirm', {
                    bubbles: true,
                    composed: true,
                    cancelable: true,
                    detail: { promotion },
                }),
            );
            if (!allowed) {
                this.phase = 'confirm';
                this.close();
                return;
            }
            this.phase = 'submitting';
            this.result = await publishPromotionProject(repository, promotion, {
                plan: this.plan,
                publishVariations: choice.skippedCount === 0,
            });
        } catch (error) {
            console.error('Failed to prepare promotion publishing', error);
            this.result = {
                promotionId: promotion.id,
                promotion: { status: 'not-started', error: null },
                projects: [],
                error: `Could not prepare publishing: ${error.message}`,
            };
        }
        this.phase = 'result';
        this.dispatchEvent(
            new CustomEvent('promotion-publish-result', {
                bubbles: true,
                composed: true,
                detail: this.result,
            }),
        );
    }

    confirm() {
        if (this.phase === 'result') {
            this.close();
        } else if (this.phase === 'confirm') {
            const resolve = this.#resolveConfirmation;
            this.#resolveConfirmation = null;
            this.phase = 'submitting';
            resolve?.({ confirmed: true, checked: this.checked });
        }
    }

    close() {
        if (this.phase === 'closed' || this.phase === 'loading' || this.phase === 'submitting') return;
        this.#resolveConfirmation?.({ confirmed: false, checked: false });
        this.#resolveConfirmation = null;
        this.phase = 'closed';
        this.dispatchEvent(new CustomEvent('promotion-publish-closed', { bubbles: true, composed: true }));
    }

    #handleKeydown(event) {
        if (event.key === 'Escape' && (this.phase === 'loading' || this.phase === 'submitting')) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    get confirmationTemplate() {
        return html`
            <p>This project has ${this.plan.targetCount} attached promo variation(s) that are not published.</p>
            <p>
                ${this.checked
                    ? this.plan.groups.length === 1
                        ? 'A Bulk Publish project will be created and started, and your promotion project will be published.'
                        : `${this.plan.groups.length} Bulk Publish projects will be created and started, and your promotion project will be published.`
                    : 'Only your promotion project will be published. Promo variations will remain unchanged.'}
            </p>
            ${this.checked
                ? html`<ul>
                          ${repeat(
                              this.plan.groups,
                              (group) => group.surface,
                              (group) => html` <li>${group.surface}: ${group.variations.length} variation(s)</li> `,
                          )}
                      </ul>
                      <p>
                          Publishing starts now, including for scheduled promotions. Final results are available in Bulk
                          Publish.
                      </p>
                      ${!canAccessBulkPublish()
                          ? html`<p>
                                Your account may not have access to the project links. Contact your administrator if needed.
                            </p>`
                          : nothing}`
                : nothing}
            ${this.checked && this.plan.warnings.length
                ? html`<p>
                      Some variations have validation errors. They will still be included; check their Bulk Publish results.
                  </p>`
                : nothing}
            <sp-checkbox
                .checked=${this.checked}
                @change=${(event) => {
                    this.checked = event.target.checked;
                }}
                >Publish promo variations</sp-checkbox
            >
        `;
    }

    get resultTemplate() {
        return html`
            <p>
                ${this.result.promotion.status === 'accepted'
                    ? 'Promotion publish request accepted.'
                    : this.result.promotion.status === 'unknown'
                      ? 'The promotion publish request could not be confirmed. Check its status before trying again.'
                      : 'Publishing did not start.'}
            </p>
            ${this.result.error ? html`<p class="error" role="alert">${this.result.error}</p>` : nothing}
            <ul>
                ${repeat(
                    this.result.projects,
                    (project) => project.id,
                    (project) => html`
                        <li>
                            <sp-link
                                href=${new URL(
                                    buildProjectDeepLink(
                                        PAGE_NAMES.BULK_PUBLISH_EDITOR,
                                        'bulkPublishProjectId',
                                        project.id,
                                        project.surface,
                                    ),
                                ).hash}
                                >${project.surface}: ${project.title}</sp-link
                            >
                            -
                            ${{
                                accepted: 'Request accepted',
                                failed: 'Could not start',
                                unknown: 'Check project',
                                'not-started': 'Not started',
                            }[project.dispatchStatus]}
                            ${project.error ? html`<p class="error">${project.error}</p>` : nothing}
                        </li>
                    `,
                )}
            </ul>
            ${this.result.projects.length
                ? html`<p>Requests accepted does not mean publishing has finished. Use the project links to check results.</p>`
                : nothing}
        `;
    }

    render() {
        if (this.phase === 'closed') return nothing;
        return html`
            <sp-overlay type="modal" open @sp-closed=${this.close} @keydown=${this.#handleKeydown}>
                <sp-dialog-wrapper
                    headline="Publish promotion"
                    underlay
                    .confirmLabel=${this.phase === 'confirm' ? 'Publish' : this.phase === 'result' ? 'Close' : ''}
                    .cancelLabel=${this.phase === 'confirm' ? 'Cancel' : ''}
                    @confirm=${this.confirm}
                    @cancel=${this.close}
                    @close=${this.close}
                >
                    ${this.phase === 'confirm'
                        ? this.confirmationTemplate
                        : this.phase === 'result'
                          ? this.resultTemplate
                          : html`<div class="progress" role="status" tabindex="0">
                                <sp-progress-circle label="Preparing publish requests" indeterminate></sp-progress-circle>
                                <span
                                    >${this.phase === 'loading'
                                        ? 'Finding promo variations...'
                                        : 'Creating projects and requesting publishing...'}</span
                                >
                            </div>`}
                </sp-dialog-wrapper>
            </sp-overlay>
        `;
    }
}

customElements.define('mas-promotion-publish-dialog', MasPromotionPublishDialog);
