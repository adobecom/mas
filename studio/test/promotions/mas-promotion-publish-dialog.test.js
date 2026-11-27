import { expect, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import { sendKeys } from '@web/test-runner-commands';
import '../../src/swc.js';
import '../../src/promotions/mas-promotion-publish-dialog.js';
import { makeSearchStub } from '../helpers/aem-tag-fetch.js';

describe('mas-promotion-publish-dialog', () => {
    let element;

    beforeEach(async () => {
        sinon.stub(window, 'fetch').rejects(new Error('Unexpected network request in publish dialog test'));
        element = await fixture(html`<mas-promotion-publish-dialog></mas-promotion-publish-dialog>`);
        element.plan = {
            promotionId: 'promotion-1',
            targetCount: 2,
            warnings: [],
            groups: [{ surface: 'acom', variations: [{ path: '/one' }, { path: '/two' }] }],
        };
    });

    afterEach(() => {
        fixtureCleanup();
        sinon.restore();
    });

    it('explains creation and automatic start with the existing checkbox selected', async () => {
        element.phase = 'confirm';
        await element.updateComplete;
        expect(element.shadowRoot.textContent).to.include('created and started');
        expect(element.shadowRoot.querySelector('sp-checkbox').checked).to.be.true;
        expect(element.shadowRoot.textContent).to.include('2');
    });

    it('shows promotion-only wording when the checkbox is unchecked', async () => {
        element.phase = 'confirm';
        element.checked = false;
        await element.updateComplete;
        expect(element.shadowRoot.textContent).to.include('Only your promotion project');
    });

    it('does not promise to include validation-error variations when the checkbox is unchecked', async () => {
        element.plan.warnings = [{ path: '/one', message: 'Missing title' }];
        element.phase = 'confirm';
        element.checked = false;
        await element.updateComplete;
        expect(element.shadowRoot.textContent).not.to.include('They will still be included');
    });

    it('warns that validation-error variations remain included when publishing variations', async () => {
        element.plan = { ...element.plan, warnings: [{ path: '/one', message: 'Missing title' }] };
        element.phase = 'confirm';

        await element.updateComplete;

        expect(element.shadowRoot.textContent).to.include('Some variations have validation errors.');
        expect(element.shadowRoot.textContent).to.include('They will still be included');
        expect(element.shadowRoot.querySelector('sp-checkbox').checked).to.be.true;
    });

    it('lets Escape cancel confirmation and restores focus to the opener', async () => {
        const opener = await fixture(html`<button>Publish promotion</button>`);
        opener.focus();
        const { repository, promotion } = makeRequest();
        const pending = element.requestPublish(repository, promotion);
        await waitUntil(() => element.phase === 'confirm');
        await waitUntil(
            () => element.shadowRoot.querySelector('sp-dialog-wrapper')?.matches(':focus-within'),
            'Focus should move into confirmation',
        );
        await sendKeys({ press: 'Escape' });
        await pending;
        expect(element.phase).to.equal('closed');
        expect(repository.aem.sites.cf.fragments.create.called).to.be.false;
        await waitUntil(() => document.activeElement === opener, 'Focus should return to the opener');
    });

    it('keeps the in-progress modal open when Escape is pressed', async () => {
        element.phase = 'submitting';
        await element.updateComplete;
        await waitUntil(
            () => element.shadowRoot.activeElement === element.shadowRoot.querySelector('.progress'),
            'Focus should move into progress',
        );
        await sendKeys({ press: 'Escape' });
        expect(element.phase).to.equal('submitting');
        expect(element.shadowRoot.querySelector('sp-overlay').open).to.be.true;
    });

    it('moves focus into progress after clicking Publish', async () => {
        await confirmPublishing();

        expect(element.shadowRoot.activeElement === element.shadowRoot.querySelector('.progress')).to.be.true;
    });

    it('keeps the in-progress modal open after clicking Publish and pressing Escape', async () => {
        await confirmPublishing();

        await sendKeys({ press: 'Escape' });

        expect(element.phase).to.equal('submitting');
        expect(element.shadowRoot.querySelector('sp-overlay').open).to.be.true;
    });

    it('keeps result links visible after Escape during the confirmation-to-progress transition', async () => {
        await confirmPublishing();
        await sendKeys({ press: 'Escape' });
        element.result = {
            promotion: { status: 'accepted' },
            projects: [{ id: 'created-project', surface: 'nala', title: 'Sale', dispatchStatus: 'accepted' }],
        };

        element.phase = 'result';
        await element.updateComplete;

        expect(element.shadowRoot.querySelector('sp-overlay').open).to.be.true;
        expect(element.shadowRoot.querySelector('sp-link').getBoundingClientRect().width).to.be.greaterThan(0);
    });

    it('offers no confirm or cancel action while creating projects', async () => {
        element.phase = 'submitting';
        await element.updateComplete;
        const dialog = element.shadowRoot.querySelector('sp-dialog-wrapper');
        expect(dialog.confirmLabel).to.equal('');
        expect(dialog.cancelLabel).to.equal('');
        expect(element.shadowRoot.querySelector('sp-progress-circle')).to.exist;
    });

    it('opens project links in a new tab', async () => {
        element.phase = 'result';
        element.result = {
            promotion: { status: 'accepted' },
            projects: [{ id: 'real-id', surface: 'acom-cc', title: 'Sale', dispatchStatus: 'accepted' }],
        };
        await element.updateComplete;
        const link = element.shadowRoot.querySelector('sp-link');
        await link.updateComplete;

        const anchor = link.shadowRoot.querySelector('a');
        expect(anchor.target).to.equal('_blank');
        expect(anchor.relList.contains('noopener')).to.be.true;
        expect(anchor.relList.contains('noreferrer')).to.be.true;
    });

    it('explains that Bulk Publish failures do not undo the promotion request', async () => {
        element.phase = 'confirm';

        await element.updateComplete;

        expect(element.shadowRoot.textContent).to.include('promotion publish request is accepted first');
        expect(element.shadowRoot.textContent).to.include('does not undo');
    });

    it('does not link deleted unused drafts while preserving accepted project links', async () => {
        element.phase = 'result';
        element.result = {
            promotion: { status: 'accepted' },
            error: 'acom: Could not start: Forbidden',
            projects: [
                { id: 'deleted', surface: 'acom', title: 'Sale', dispatchStatus: 'failed', cleanupStatus: 'deleted' },
                { id: 'retained', surface: 'acom-cc', title: 'Sale', dispatchStatus: 'accepted' },
            ],
        };

        await element.updateComplete;

        const links = [...element.shadowRoot.querySelectorAll('sp-link')];
        expect(links).to.have.lengthOf(1);
        expect(links[0].getAttribute('href')).to.include('bulkPublishProjectId=retained');
        expect(element.shadowRoot.textContent).to.include('Unused draft deleted');
        expect(element.shadowRoot.textContent).to.include('Promotion publish request accepted.');
    });

    it('does not suggest project links when every unused draft was deleted', async () => {
        element.phase = 'result';
        element.result = {
            promotion: { status: 'accepted' },
            projects: [{ id: 'deleted', surface: 'acom', title: 'Sale', dispatchStatus: 'failed', cleanupStatus: 'deleted' }],
        };

        await element.updateComplete;

        expect(element.shadowRoot.querySelector('sp-link')).to.equal(null);
        expect(element.shadowRoot.textContent).not.to.include('Use the project links');
        expect(element.shadowRoot.textContent).to.include('Unused draft deleted');
    });

    it('retains the project link and cleanup error when draft removal fails', async () => {
        element.phase = 'result';
        element.result = {
            promotion: { status: 'accepted' },
            projects: [
                {
                    id: 'retained',
                    surface: 'acom',
                    title: 'Sale',
                    dispatchStatus: 'failed',
                    cleanupStatus: 'failed',
                    error: 'Could not remove unused draft: Delete denied',
                },
            ],
        };

        await element.updateComplete;

        expect(element.shadowRoot.querySelector('sp-link').getAttribute('href')).to.include('retained');
        expect(element.shadowRoot.textContent).to.include('Delete denied');
    });

    it('keeps partially created project links in the current environment without automatically opening tabs', async () => {
        const open = sinon.stub(window, 'open');
        element.phase = 'result';
        element.result = {
            promotion: { status: 'not-started' },
            error: 'Second project creation failed',
            projects: [{ id: 'real-id', surface: 'acom-cc', title: 'Sale', dispatchStatus: 'not-started' }],
        };
        await element.updateComplete;
        const link = element.shadowRoot.querySelector('sp-link');
        expect(link.getAttribute('href')).to.match(/^#/);
        const params = new URLSearchParams(link.getAttribute('href').slice(1));
        expect(params.get('bulkPublishProjectId')).to.equal('real-id');
        expect(params.get('path')).to.equal('acom-cc');
        expect(element.shadowRoot.textContent).to.include('Second project creation failed');
        expect(open.called).to.be.false;
    });

    async function confirmPublishing() {
        element.phase = 'confirm';
        await element.updateComplete;
        await waitUntil(() => element.shadowRoot.querySelector('sp-overlay').state === 'opened', 'Confirmation should open', {
            timeout: 1500,
        });
        const dialog = element.shadowRoot.querySelector('sp-dialog-wrapper');
        const button = dialog.shadowRoot.querySelector('sp-button[variant="accent"]');
        button.focus();
        button.click();
        await waitUntil(() => element.phase === 'submitting', 'Publish should enter progress', { timeout: 1500 });
        await element.updateComplete;
    }

    function makeRequest() {
        const path = '/content/dam/mas/nala/fr_FR/promotions/sale/card';
        return {
            promotion: {
                id: 'promotion-1',
                tags: [{ id: 'mas:promotion/sale' }],
                getFieldValues: () => ['/content/dam/mas/nala/fr_FR/card'],
            },
            repository: {
                operation: { set: sinon.stub() },
                clearStagedTag: sinon.stub().resolves(),
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                search: makeSearchStub(sinon, {
                                    '/content/dam/mas/nala/fr_FR/promotions/sale': [
                                        { id: 'variation-1', path, status: 'DRAFT' },
                                    ],
                                }),
                                create: sinon.stub(),
                                getWithEtag: sinon.stub().resolves({
                                    id: 'promotion-1',
                                    path: '/content/dam/mas/promotions/sale',
                                    etag: '"revision"',
                                    fields: [],
                                    tags: [],
                                }),
                                publish: sinon.stub().resolves({
                                    items: [{ path: '/content/dam/mas/promotions/sale', status: 'SUCCESS_TRIGGERED' }],
                                }),
                            },
                        },
                    },
                },
            },
        };
    }

    function makePendingDiscovery() {
        const request = makeRequest();
        let resolve;
        let reject;
        const lookup = new Promise((onResolve, onReject) => {
            resolve = onResolve;
            reject = onReject;
        });
        const fragments = request.repository.aem.sites.cf.fragments;
        const search = fragments.search;
        fragments.search = sinon.stub().callsFake(async function* (query) {
            await lookup;
            yield* search(query);
        });
        return { ...request, resolve, reject };
    }

    async function expectSettled(pending) {
        let settled = false;
        pending.then(() => {
            settled = true;
        });
        await waitUntil(() => settled, 'Canceled discovery must settle without waiting for the lookup', { timeout: 250 });
    }

    for (const action of ['Cancel', 'Escape']) {
        it(`cancels a never-ending lookup with ${action} and immediately reuses the dialog`, async () => {
            const { repository, promotion } = makePendingDiscovery();
            const pending = element.requestPublish(repository, promotion);
            await waitUntil(() => repository.aem.sites.cf.fragments.search.calledOnce);
            await element.updateComplete;
            await waitUntil(() => element.shadowRoot.querySelector('sp-overlay').state === 'opened');
            if (action === 'Cancel') {
                const dialog = element.shadowRoot.querySelector('sp-dialog-wrapper');
                await waitUntil(() => dialog.shadowRoot.querySelector('sp-button[variant="secondary"]'));
                const cancel = [...dialog.shadowRoot.querySelectorAll('sp-button')].find(
                    (button) => button.textContent.trim() === 'Cancel',
                );
                expect(cancel).to.exist;
                cancel.click();
            } else {
                await waitUntil(() => element.shadowRoot.querySelector('sp-dialog-wrapper').matches(':focus-within'));
                await sendKeys({ press: 'Escape' });
            }
            await expectSettled(pending);
            expect(element.phase).to.equal('closed');
            expect(repository.aem.sites.cf.fragments.publish.called).to.be.false;
            expect(repository.aem.sites.cf.fragments.create.called).to.be.false;

            const next = makeRequest();
            const nextPending = element.requestPublish(next.repository, next.promotion);
            await waitUntil(() => element.phase === 'confirm');
            element.close();
            await nextPending;
            expect(element.phase).to.equal('closed');
        });
    }

    for (const cancellation of ['cancel', 'disconnect']) {
        for (const outcome of ['success', 'error']) {
            for (const nextPhase of ['confirm', 'submitting', 'result']) {
                it(`ignores late discovery ${outcome} after ${cancellation} while a newer request is ${nextPhase}`, async () => {
                    const old = makePendingDiscovery();
                    const pending = element.requestPublish(old.repository, old.promotion);
                    await waitUntil(() => old.repository.aem.sites.cf.fragments.search.calledOnce);
                    if (cancellation === 'disconnect') {
                        const parent = element.parentNode;
                        element.remove();
                        parent.append(element);
                    } else {
                        element.close();
                    }
                    await expectSettled(pending);
                    expect(element.phase).to.equal('closed');

                    const next = makeRequest();
                    next.promotion.id = 'newer-promotion';
                    let finishPublishing;
                    if (nextPhase === 'submitting') {
                        next.repository.aem.sites.cf.fragments.publish.returns(
                            new Promise((resolve) => {
                                finishPublishing = resolve;
                            }),
                        );
                    }
                    const resultEvent = sinon.spy();
                    const errorLog = sinon.stub(console, 'error');
                    element.addEventListener('promotion-publish-result', resultEvent);
                    const nextPending = element.requestPublish(next.repository, next.promotion);
                    await waitUntil(() => element.phase !== 'loading');
                    expect(element.phase, JSON.stringify(element.result)).to.equal('confirm');
                    if (nextPhase !== 'confirm') {
                        element.checked = false;
                        element.confirm();
                        await waitUntil(() => next.repository.aem.sites.cf.fragments.publish.calledOnce);
                        if (nextPhase === 'result') await nextPending;
                    }
                    const plan = element.plan;
                    const result = element.result;
                    const eventCount = resultEvent.callCount;

                    if (outcome === 'success') old.resolve();
                    else old.reject(new Error('Obsolete lookup failed'));
                    await new Promise((resolve) => setTimeout(resolve, 0));
                    await element.updateComplete;

                    expect(element.phase).to.equal(nextPhase);
                    expect(element.plan).to.equal(plan);
                    expect(element.plan.promotionId).to.equal('newer-promotion');
                    expect(element.result).to.equal(result);
                    expect(resultEvent.callCount).to.equal(eventCount);
                    expect(errorLog.called).to.be.false;
                    expect(old.repository.aem.sites.cf.fragments.publish.called).to.be.false;
                    expect(old.repository.aem.sites.cf.fragments.create.called).to.be.false;

                    if (nextPhase === 'submitting') {
                        finishPublishing({
                            items: [{ path: '/content/dam/mas/promotions/sale', status: 'SUCCESS_TRIGGERED' }],
                        });
                    } else {
                        element.close();
                    }
                    await nextPending;
                });
            }
        }
    }

    it('ignores obsolete overlay close and confirmation events after immediate reuse', async () => {
        const old = makePendingDiscovery();
        const pending = element.requestPublish(old.repository, old.promotion);
        await waitUntil(() => old.repository.aem.sites.cf.fragments.search.calledOnce);
        await element.updateComplete;
        const overlay = element.shadowRoot.querySelector('sp-overlay');
        const dialog = element.shadowRoot.querySelector('sp-dialog-wrapper');
        element.close();
        const next = makeRequest();
        const nextPending = element.requestPublish(next.repository, next.promotion);
        await expectSettled(pending);
        await waitUntil(() => element.phase === 'confirm');
        await element.updateComplete;

        dialog.dispatchEvent(new Event('confirm'));
        dialog.dispatchEvent(new Event('cancel'));
        dialog.dispatchEvent(new Event('close'));
        overlay.dispatchEvent(new Event('sp-closed'));

        expect(element.phase).to.equal('confirm');
        expect(element.shadowRoot.querySelector('sp-overlay')).not.to.equal(overlay);
        expect(next.repository.aem.sites.cf.fragments.publish.called).to.be.false;
        element.close();
        await nextPending;
    });

    it('cancels confirmation on disconnect without affecting a reused dialog', async () => {
        const old = makeRequest();
        const pending = element.requestPublish(old.repository, old.promotion);
        await waitUntil(() => element.phase === 'confirm');
        const parent = element.parentNode;
        element.remove();
        parent.append(element);
        await expectSettled(pending);

        const next = makeRequest();
        const nextPending = element.requestPublish(next.repository, next.promotion);
        await waitUntil(() => element.phase === 'confirm');

        expect(old.repository.aem.sites.cf.fragments.publish.called).to.be.false;
        element.close();
        await nextPending;
    });

    it('keeps an accepted submission active across disconnect and reconnect without allowing replacement', async () => {
        const { repository, promotion } = makeRequest();
        let finishPublishing;
        repository.aem.sites.cf.fragments.publish.returns(
            new Promise((resolve) => {
                finishPublishing = resolve;
            }),
        );
        const pending = element.requestPublish(repository, promotion);
        await waitUntil(() => element.phase === 'confirm');
        element.checked = false;
        element.confirm();
        await waitUntil(() => repository.aem.sites.cf.fragments.publish.calledOnce);
        const parent = element.parentNode;
        element.remove();
        parent.append(element);
        element.close();
        const next = makeRequest();
        await element.requestPublish(next.repository, next.promotion);

        expect(element.phase).to.equal('submitting');
        expect(next.repository.aem.sites.cf.fragments.search.called).to.be.false;

        finishPublishing({ items: [{ path: '/content/dam/mas/promotions/sale', status: 'SUCCESS_TRIGGERED' }] });
        await pending;
        expect(element.phase).to.equal('result');
        expect(element.result.promotion.status).to.equal('accepted');
    });

    it('shows a preparation failure without starting publication when discovery fails', async () => {
        const { repository, promotion } = makeRequest();
        const failure = new Error('Variation discovery unavailable');
        repository.aem.sites.cf.fragments.search = sinon.stub().throws(failure);
        const errorLog = sinon.stub(console, 'error');
        const result = new Promise((resolve) => element.addEventListener('promotion-publish-result', resolve, { once: true }));

        await element.requestPublish(repository, promotion);
        const event = await result;
        await element.updateComplete;

        expect(element.phase).to.equal('result');
        expect(event.detail).to.deep.equal({
            promotionId: promotion.id,
            promotion: { status: 'not-started', error: null },
            projects: [],
            error: 'Could not prepare publishing: Variation discovery unavailable',
        });
        expect(element.shadowRoot.querySelector('[role="alert"]').textContent).to.include(failure.message);
        expect(repository.aem.sites.cf.fragments.create.called).to.be.false;
        expect(errorLog.calledOnceWith('Failed to prepare promotion publishing', failure)).to.be.true;
    });

    it('closes without creating when the parent rejects confirmation after a permission change', async () => {
        const { repository, promotion } = makeRequest();
        element.addEventListener('promotion-publish-confirm', (event) => event.preventDefault());
        const pending = element.requestPublish(repository, promotion);
        await waitUntil(() => element.phase === 'confirm');
        element.confirm();
        await pending;
        expect(element.phase).to.equal('closed');
        expect(repository.aem.sites.cf.fragments.create.called).to.be.false;
    });

    for (const change of ['permission', 'promotion content']) {
        it(`rechecks ${change} after empty discovery and safely reuses the rejected request's dialog`, async () => {
            const { repository, promotion } = makeRequest();
            let completeDiscovery;
            const discovery = new Promise((resolve) => {
                completeDiscovery = resolve;
            });
            const fragments = repository.aem.sites.cf.fragments;
            fragments.search = sinon.stub().callsFake(async function* () {
                await discovery;
                yield [];
            });
            let authorized = true;
            const confirmation = sinon.spy();
            const closed = sinon.spy();
            const result = sinon.spy();
            element.addEventListener('promotion-publish-confirm', (event) => {
                confirmation(event);
                if (!authorized || event.detail.promotion.hasChanges) event.preventDefault();
            });
            element.addEventListener('promotion-publish-closed', closed);
            element.addEventListener('promotion-publish-result', result);
            const pending = element.requestPublish(repository, promotion);
            await waitUntil(() => fragments.search.calledOnce);
            await element.updateComplete;
            const oldOverlay = element.shadowRoot.querySelector('sp-overlay');
            const oldDialog = element.shadowRoot.querySelector('sp-dialog-wrapper');
            if (change === 'permission') authorized = false;
            else promotion.hasChanges = true;

            completeDiscovery();
            await pending;

            expect(confirmation.calledOnce).to.be.true;
            expect(confirmation.firstCall.args[0].detail.promotion).to.equal(promotion);
            expect(confirmation.firstCall.args[0].defaultPrevented).to.be.true;
            expect(element.phase).to.equal('closed');
            expect(closed.calledOnce).to.be.true;
            expect(result.called).to.be.false;
            expect(repository.operation.set.called).to.be.false;
            expect(fragments.getWithEtag.called).to.be.false;
            expect(fragments.create.called).to.be.false;
            expect(fragments.publish.called).to.be.false;

            authorized = true;
            const next = makeRequest();
            next.promotion.id = 'next-promotion';
            const nextPending = element.requestPublish(next.repository, next.promotion);
            await waitUntil(() => element.phase === 'confirm');
            await element.updateComplete;
            oldOverlay.dispatchEvent(new Event('sp-closed'));
            oldDialog.dispatchEvent(new Event('confirm'));
            oldDialog.dispatchEvent(new Event('cancel'));
            expect(element.phase).to.equal('confirm');
            expect(element.plan.promotionId).to.equal('next-promotion');
            expect(next.repository.aem.sites.cf.fragments.publish.called).to.be.false;

            element.checked = false;
            element.confirm();
            await nextPending;
            expect(confirmation.callCount).to.equal(2);
            expect(confirmation.secondCall.args[0].detail.promotion).to.equal(next.promotion);
            expect(confirmation.secondCall.args[0].defaultPrevented).to.be.false;
            expect(element.result.promotionId).to.equal('next-promotion');
            expect(element.result.promotion.status).to.equal('accepted');
        });
    }

    it('does not start another discovery while a confirmation is already open', async () => {
        const { repository, promotion } = makeRequest();
        const pending = element.requestPublish(repository, promotion);
        await waitUntil(() => element.phase === 'confirm');
        const calls = repository.aem.sites.cf.fragments.search.callCount;
        await element.requestPublish(repository, promotion);
        expect(repository.aem.sites.cf.fragments.search.callCount).to.equal(calls);
        element.close();
        await pending;
    });

    it('settles a request removed while discovery is still in progress without opening a new confirmation', async () => {
        const { repository, promotion } = makeRequest();
        let finish;
        const discovery = new Promise((resolve) => {
            finish = resolve;
        });
        const search = repository.aem.sites.cf.fragments.search;
        repository.aem.sites.cf.fragments.search = async function* (query) {
            await discovery;
            yield* search(query);
        };
        const pending = element.requestPublish(repository, promotion);
        element.remove();
        finish();
        const settled = await Promise.race([
            pending.then(() => true),
            new Promise((resolve) => setTimeout(() => resolve(false), 50)),
        ]);
        if (!settled) element.close();
        await pending;
        expect(settled).to.be.true;
        expect(repository.aem.sites.cf.fragments.create.called).to.be.false;
    });
});
