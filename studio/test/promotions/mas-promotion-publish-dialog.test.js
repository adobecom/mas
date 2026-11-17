import { expect, fixture, fixtureCleanup, html, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import { sendKeys } from '@web/test-runner-commands';
import '../../src/swc.js';
import '../../src/promotions/mas-promotion-publish-dialog.js';
import { makeSearchStub } from '../helpers/aem-tag-fetch.js';

describe('mas-promotion-publish-dialog', () => {
    let element;

    beforeEach(async () => {
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

    it('offers no confirm or cancel action while creating projects', async () => {
        element.phase = 'submitting';
        await element.updateComplete;
        const dialog = element.shadowRoot.querySelector('sp-dialog-wrapper');
        expect(dialog.confirmLabel).to.equal('');
        expect(dialog.cancelLabel).to.equal('');
        expect(element.shadowRoot.querySelector('sp-progress-circle')).to.exist;
    });

    it('keeps partially created project links in the current environment without opening tabs', async () => {
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

    function makeRequest() {
        const path = '/content/dam/mas/nala/fr_FR/promotions/sale/card';
        return {
            promotion: {
                id: 'promotion-1',
                tags: [{ id: 'mas:promotion/sale' }],
                getFieldValues: () => ['/content/dam/mas/nala/fr_FR/card'],
            },
            repository: {
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
                            },
                        },
                    },
                },
            },
        };
    }

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
