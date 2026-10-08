import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup, waitUntil } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import router from '../../src/router.js';
import Store from '../../src/store.js';
import { PAGE_NAMES, COLLECTION_MODEL_PATH } from '../../src/constants.js';
import '../../src/swc.js';
import { MasReferenceDiagnosisDialog } from '../../src/publish/mas-reference-diagnosis-dialog.js';

const report = {
    complete: false,
    issues: [
        {
            category: 'confirmed-problem',
            ownerId: 'collection-id',
            ownerLabel: '<strong>All plans</strong>',
            ownerTitle: 'Collection',
            ownerPath: '/content/dam/mas/collection',
            fieldName: 'cards',
            valueIndex: 0,
            targetPath: '/content/dam/mas/missing',
            detail: 'references a path that does not exist in JCR',
            evidence: 'fields.cards.values[0].<list element>',
        },
        {
            category: 'needs-review',
            ownerTitle: 'Card',
            ownerPath: '/content/dam/mas/card',
            fieldName: 'product',
            valueIndex: 0,
            targetPath: '/content/dam/mcs/product',
            detail: 'Failed to get fragment: 403 Forbidden',
            evidence: '',
        },
    ],
    coverageGaps: [{ ownerPath: '/content/dam/mcs/product', detail: 'References below this target could not be inspected.' }],
};

describe('reference diagnosis dialog', () => {
    const removalContext = () => {
        const owner = {
            id: 'collection-id',
            path: '/content/dam/mas/collection',
            title: 'Collection',
            etag: 'before-save',
            fields: [
                {
                    name: 'cards',
                    type: 'content-fragment',
                    multiple: true,
                    values: ['/content/dam/mas/missing', '/content/dam/mas/valid'],
                },
            ],
            validationStatus: [
                { property: 'fields.cards.values[0].<list element>', message: 'references a path that does not exist in JCR' },
            ],
        };
        const fragments = {
            getById: sinon.stub().resolves(owner),
            getWithEtag: sinon.stub().resolves(owner),
            getByPath: sinon.stub().callsFake(async (path) => {
                if (path.endsWith('/missing')) throw new Error('Fragment not found');
                return { id: 'valid', path, title: 'Valid card', fields: [] };
            }),
            save: sinon.stub().callsFake(async (updated) => {
                const saved = { ...updated, etag: 'after-save', validationStatus: [] };
                fragments.getById.resolves(saved);
                return saved;
            }),
            publish: sinon.stub(),
        };
        return {
            aem: { sites: { cf: { fragments } } },
            roots: [owner],
            fragments,
            report: { ...report, issues: [{ ...report.issues[0], removable: true, ownerValues: [...owner.fields[0].values] }] },
        };
    };

    afterEach(() => {
        for (const dialog of document.querySelectorAll('mas-reference-diagnosis-dialog')) dialog.finish(false);
        sinon.restore();
        fixtureCleanup();
    });

    it('recovers the dialog controls after a save timeout without offering a retry or publishing', async () => {
        const context = removalContext();
        context.fragments.save.returns(new Promise(() => {}));
        sinon.stub(Store.editor, 'hasChanges').get(() => false);
        const dialog = await fixture(html`
            <mas-reference-diagnosis-dialog .report=${context.report} .aem=${context.aem} .roots=${context.roots}>
            </mas-reference-diagnosis-dialog>
        `);
        const decided = sinon.stub();
        dialog.addEventListener('diagnosis-decided', decided);

        await dialog.removeMissing({ saveTimeoutMs: 10 });
        await dialog.updateComplete;

        expect(dialog.removing).to.be.false;
        expect(dialog.shadowRoot.querySelector('sp-progress-circle')).to.be.null;
        expect(dialog.shadowRoot.textContent).to.include('outcome is unknown');
        expect(dialog.shadowRoot.querySelector('.remove-missing')).to.be.null;
        expect(dialog.shadowRoot.querySelector('sp-button[variant="accent"]').disabled).to.be.false;
        expect(dialog.shadowRoot.querySelector('sp-button[treatment="outline"]').disabled).to.be.false;
        dialog.shadowRoot.querySelector('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
        expect(decided.firstCall.args[0].detail.confirmed).to.be.false;
        expect(context.fragments.save.callCount).to.equal(1);
        expect(context.fragments.publish.called).to.be.false;
    });

    it('does not offer bulk removal for review-only or unconfirmed issues', async () => {
        const context = removalContext();
        const dialog = await fixture(
            html`<mas-reference-diagnosis-dialog .report=${report} .aem=${context.aem}></mas-reference-diagnosis-dialog>`,
        );

        expect(dialog.shadowRoot.querySelector('.remove-missing')).to.be.null;
    });

    it('asks for confirmation before saving any references', async () => {
        const context = removalContext();
        const dialog = await fixture(
            html`<mas-reference-diagnosis-dialog
                .report=${context.report}
                .aem=${context.aem}
                .roots=${context.roots}
            ></mas-reference-diagnosis-dialog>`,
        );

        dialog.shadowRoot.querySelector('.remove-missing').click();
        await dialog.updateComplete;

        expect(dialog.shadowRoot.querySelector('.confirm-removal')).to.exist;
        expect(dialog.shadowRoot.textContent).to.include('Remove 1 missing reference');
        expect(context.fragments.save.called).to.be.false;
        dialog.shadowRoot.querySelector('.cancel-removal').click();
        await dialog.updateComplete;
        expect(dialog.shadowRoot.querySelector('.confirm-removal')).to.be.null;
        expect(context.fragments.save.called).to.be.false;
    });

    it('updates the same popup and root ETag after removal without publishing', async () => {
        const context = removalContext();
        const decision = MasReferenceDiagnosisDialog.show(context.report, context);
        await waitUntil(() => !!document.querySelector('mas-reference-diagnosis-dialog'));
        const dialog = document.querySelector('mas-reference-diagnosis-dialog');
        await dialog.updateComplete;
        let decided = false;
        decision.then(() => {
            decided = true;
        });

        await dialog.removeMissing();
        await dialog.updateComplete;

        expect(document.querySelector('mas-reference-diagnosis-dialog')).to.equal(dialog);
        expect(dialog.report.issues).to.have.length(0);
        expect(dialog.shadowRoot.textContent).to.include('No reference issues found');
        expect(dialog.shadowRoot.querySelector('sp-progress-circle')).to.be.null;
        expect(context.roots[0].etag).to.equal('after-save');
        expect(context.roots[0].fields[0].values).to.deep.equal(['/content/dam/mas/valid']);
        expect(context.fragments.publish.called).to.be.false;
        expect(decided).to.be.false;
        dialog.finish(false);
        expect(await decision).to.be.false;
    });

    it('recovers from a post-save synchronization error without offering unsafe removal or publishing', async () => {
        const context = removalContext();
        const dialog = await fixture(
            html`<mas-reference-diagnosis-dialog
                .report=${context.report}
                .aem=${context.aem}
                .roots=${context.roots}
            ></mas-reference-diagnosis-dialog>`,
        );
        sinon.stub(dialog, 'syncSavedFragments').throws(new Error('Saved fragment synchronization failed'));
        const decided = sinon.stub();
        dialog.addEventListener('diagnosis-decided', decided);

        await dialog.removeMissing();
        await dialog.updateComplete;

        expect(context.fragments.save.calledOnce).to.be.true;
        expect(dialog.report.complete).to.be.false;
        expect(dialog.report.issues).to.have.length(1);
        expect(dialog.report.issues.every((issue) => !issue.removable)).to.be.true;
        expect(dialog.shadowRoot.textContent).to.include('Saved fragment synchronization failed');
        expect(dialog.shadowRoot.querySelector('.remove-missing')).to.be.null;
        expect(dialog.shadowRoot.querySelector('sp-progress-circle')).to.be.null;
        expect(dialog.shadowRoot.querySelector('sp-button[variant="accent"]').disabled).to.be.false;
        expect(dialog.shadowRoot.querySelector('sp-button[treatment="outline"]').disabled).to.be.false;
        expect(context.fragments.publish.called).to.be.false;
        dialog.shadowRoot.querySelector('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
        expect(decided.firstCall.args[0].detail.confirmed).to.be.false;
    });

    it('shows a save conflict and keeps the unresolved issue in the popup', async () => {
        const context = removalContext();
        context.fragments.save.rejects(new Error('412 Precondition Failed'));
        const dialog = await fixture(
            html`<mas-reference-diagnosis-dialog
                .report=${context.report}
                .aem=${context.aem}
                .roots=${context.roots}
            ></mas-reference-diagnosis-dialog>`,
        );

        await dialog.removeMissing();
        await dialog.updateComplete;

        expect(dialog.shadowRoot.textContent).to.include('412 Precondition Failed');
        expect(dialog.shadowRoot.querySelector('sp-progress-circle')).to.be.null;
        expect(dialog.report.issues).to.have.length(1);
        expect(dialog.shadowRoot.textContent).not.to.include('No reference issues found');
        expect(context.fragments.publish.called).to.be.false;
    });

    it('blocks cleanup while the editor has unsaved changes', async () => {
        const context = removalContext();
        sinon.stub(Store.editor, 'hasChanges').get(() => true);
        const dialog = await fixture(
            html`<mas-reference-diagnosis-dialog
                .report=${context.report}
                .aem=${context.aem}
                .roots=${context.roots}
            ></mas-reference-diagnosis-dialog>`,
        );

        await dialog.removeMissing();
        await dialog.updateComplete;

        expect(context.fragments.save.called).to.be.false;
        expect(dialog.shadowRoot.textContent).to.include('unsaved');
    });

    it('keeps Close and Continue disabled until removal and reinspection finish', async () => {
        const context = removalContext();
        let finishSave;
        context.fragments.save.callsFake(
            (updated) =>
                new Promise((resolve) => {
                    finishSave = () => {
                        const saved = { ...updated, etag: 'after-save', validationStatus: [] };
                        context.fragments.getById.resolves(saved);
                        resolve(saved);
                    };
                }),
        );
        const decision = MasReferenceDiagnosisDialog.show(context.report, context);
        await waitUntil(() => !!document.querySelector('mas-reference-diagnosis-dialog'));
        const dialog = document.querySelector('mas-reference-diagnosis-dialog');
        await dialog.updateComplete;
        const removal = dialog.removeMissing();
        try {
            await waitUntil(() => !!finishSave);
            await dialog.updateComplete;
            expect(dialog.shadowRoot.querySelector('sp-button[variant="accent"]').disabled).to.be.true;
            expect(dialog.shadowRoot.querySelector('sp-button[treatment="outline"]').disabled).to.be.true;
            dialog.finish(true);
            expect(document.querySelector('mas-reference-diagnosis-dialog')).to.equal(dialog);
        } finally {
            finishSave();
            await removal;
        }
        await dialog.updateComplete;
        expect(dialog.shadowRoot.querySelector('sp-button[variant="accent"]').disabled).to.be.false;
        dialog.finish(false);
        expect(await decision).to.be.false;
    });

    it('refreshes a loaded owner store with the saved fragment', async () => {
        const context = removalContext();
        const store = { get: () => context.roots[0], refreshFrom: sinon.spy() };
        sinon.stub(Store.fragments.list.data, 'get').returns([store]);
        const dialog = await fixture(
            html`<mas-reference-diagnosis-dialog
                .report=${context.report}
                .aem=${context.aem}
                .roots=${context.roots}
            ></mas-reference-diagnosis-dialog>`,
        );

        await dialog.removeMissing();

        expect(store.refreshFrom.calledOnce).to.be.true;
        expect(store.refreshFrom.firstCall.args[0].etag).to.equal('after-save');
    });

    it('shows an indeterminate spinner until reinspection completes after saving', async () => {
        const context = removalContext();
        let finishInspection;
        context.fragments.save.callsFake(async (updated) => ({ ...updated, etag: 'after-save', validationStatus: [] }));
        context.fragments.getById.callsFake(
            () =>
                new Promise((resolve) => {
                    finishInspection = resolve;
                }),
        );
        const dialog = await fixture(
            html`<mas-reference-diagnosis-dialog
                .report=${context.report}
                .aem=${context.aem}
                .roots=${context.roots}
            ></mas-reference-diagnosis-dialog>`,
        );

        const removal = dialog.removeMissing();
        try {
            await waitUntil(() => !!finishInspection);
            await dialog.updateComplete;
            const spinner = dialog.shadowRoot.querySelector('sp-progress-circle');
            expect(spinner).to.exist;
            expect(spinner.indeterminate).to.be.true;
            expect(spinner.label).to.include('Removing missing references');
            expect(dialog.shadowRoot.querySelector('.cleanup-progress').getAttribute('role')).to.equal('status');
            expect(dialog.shadowRoot.querySelector('dialog').getAttribute('aria-busy')).to.equal('true');
        } finally {
            if (finishInspection) finishInspection(context.roots[0]);
            await removal;
        }
        await dialog.updateComplete;
        expect(dialog.shadowRoot.querySelector('sp-progress-circle')).to.be.null;
        expect(dialog.shadowRoot.querySelector('dialog').getAttribute('aria-busy')).to.equal('false');
    });

    it('shows the collection label and fragment title alongside the owner path', async () => {
        const dialog = await fixture(html`<mas-reference-diagnosis-dialog .report=${report}></mas-reference-diagnosis-dialog>`);
        const owner = dialog.shadowRoot.querySelector('.owner');

        expect(owner.textContent).to.include('All plans');
        expect(owner.textContent).to.include('Collection');
        expect(owner.textContent).to.include('/content/dam/mas/collection');
        expect(owner.textContent).not.to.include('<strong>');
    });

    it('keeps the missing target path visible without inventing a title or edit action', async () => {
        const dialog = await fixture(html`<mas-reference-diagnosis-dialog .report=${report}></mas-reference-diagnosis-dialog>`);
        const target = dialog.shadowRoot.querySelector('.target');

        expect(target.textContent).to.include('Reference unavailable');
        expect(target.textContent).to.include('/content/dam/mas/missing');
        expect(target.querySelector('.edit-target')).to.be.null;
    });

    it('keeps an owner without a title identifiable by its path', async () => {
        const untitledReport = {
            ...report,
            issues: [{ ...report.issues[0], ownerLabel: '', ownerTitle: '' }],
        };
        const dialog = await fixture(
            html`<mas-reference-diagnosis-dialog .report=${untitledReport}></mas-reference-diagnosis-dialog>`,
        );
        const owner = dialog.shadowRoot.querySelector('.owner');

        expect(owner.textContent).to.include('Fragment title unavailable');
        expect(owner.textContent).to.include('/content/dam/mas/collection');
        expect(owner.querySelector('.edit-owner')).to.exist;
    });

    it('shows a resolved target label, title, path and edit action', async () => {
        const resolvedReport = {
            ...report,
            issues: [
                { ...report.issues[0], targetId: 'card-id', targetLabel: '<b>Creative Cloud</b>', targetTitle: 'All apps' },
            ],
        };
        const dialog = await fixture(
            html`<mas-reference-diagnosis-dialog .report=${resolvedReport}></mas-reference-diagnosis-dialog>`,
        );
        const target = dialog.shadowRoot.querySelector('.target');

        expect(target.textContent).to.include('Creative Cloud');
        expect(target.textContent).to.include('All apps');
        expect(target.textContent).to.include('/content/dam/mas/missing');
        expect(target.querySelector('.edit-target')).to.exist;
    });

    it('cancels the publish decision and removes the popup before opening the owner editor', async () => {
        const navigate = sinon.stub(router, 'navigateToFragmentEditor').callsFake(async () => {
            expect(document.querySelector('mas-reference-diagnosis-dialog')).to.be.null;
        });
        const decision = MasReferenceDiagnosisDialog.show(report);
        await waitUntil(() => !!document.querySelector('mas-reference-diagnosis-dialog'));
        const dialog = document.querySelector('mas-reference-diagnosis-dialog');
        await dialog.updateComplete;

        dialog.shadowRoot.querySelector('.edit-owner').click();

        expect(await decision).to.be.false;
        expect(navigate.calledOnceWithExactly('collection-id', { viewPage: true })).to.be.true;
    });

    it('opens the resolved target editor without continuing publish', async () => {
        const navigate = sinon.stub(router, 'navigateToFragmentEditor').resolves();
        const decision = MasReferenceDiagnosisDialog.show({
            ...report,
            issues: [{ ...report.issues[0], targetId: 'card-id', targetTitle: 'All apps' }],
        });
        await waitUntil(() => !!document.querySelector('mas-reference-diagnosis-dialog'));
        const dialog = document.querySelector('mas-reference-diagnosis-dialog');
        await dialog.updateComplete;

        dialog.shadowRoot.querySelector('.edit-target').click();

        expect(await decision).to.be.false;
        expect(navigate.calledOnceWithExactly('card-id', { viewPage: true })).to.be.true;
    });

    it('opens the full-page collection editor rather than returning to the existing panel', async () => {
        const collection = { id: 'collection-id', model: { path: COLLECTION_MODEL_PATH }, fields: [] };
        sinon.stub(Store.fragments.list.data, 'get').returns([{ get: () => collection }]);
        sinon.stub(Store.editor, 'hasChanges').get(() => false);
        const setPage = sinon.stub(Store.page, 'set');
        const setId = sinon.stub(Store.fragmentEditor.fragmentId, 'set');
        sinon.stub(Store.fragments.inEdit, 'set');
        sinon.stub(Store.search, 'set');
        sinon.stub(Store.viewMode, 'set');
        const panel = { editFragment: sinon.stub().resolves() };
        sinon.stub(document, 'querySelector').callThrough().withArgs('editor-panel').returns(panel);
        const decision = MasReferenceDiagnosisDialog.show(report);
        await waitUntil(() => !!document.querySelector('mas-reference-diagnosis-dialog'));
        const dialog = document.querySelector('mas-reference-diagnosis-dialog');
        await dialog.updateComplete;

        dialog.shadowRoot.querySelector('.edit-owner').click();

        expect(await decision).to.be.false;
        expect(setId.calledOnceWithExactly('collection-id')).to.be.true;
        expect(setPage.calledOnceWithExactly(PAGE_NAMES.FRAGMENT_EDITOR)).to.be.true;
        expect(panel.editFragment.called).to.be.false;
    });

    it('shows an owner once when several missing references belong to the same collection', async () => {
        const groupedReport = {
            ...report,
            issues: [7, 15, 32].map((valueIndex) => ({ ...report.issues[0], valueIndex })),
        };
        const dialog = await fixture(
            html`<mas-reference-diagnosis-dialog .report=${groupedReport}></mas-reference-diagnosis-dialog>`,
        );

        expect(dialog.shadowRoot.querySelectorAll('.owner')).to.have.length(1);
        expect(dialog.shadowRoot.querySelectorAll('.edit-owner')).to.have.length(1);
        expect(dialog.shadowRoot.querySelectorAll('.issue')).to.have.length(3);
    });

    it('keeps original reference positions in details instead of presenting them as visible card numbers', async () => {
        const dialog = await fixture(html`<mas-reference-diagnosis-dialog .report=${report}></mas-reference-diagnosis-dialog>`);

        expect(dialog.shadowRoot.textContent).not.to.include('Item 1');
        dialog.shadowRoot.querySelector('sp-action-button[label="Details"]').click();
        await dialog.updateComplete;

        expect(dialog.shadowRoot.querySelector('.detail').textContent).to.include('cards[0]');
    });

    it('keeps detail actions attached to the correct issue after grouping different owners', async () => {
        const interleavedReport = {
            ...report,
            issues: [report.issues[0], report.issues[1], { ...report.issues[0], valueIndex: 9 }],
        };
        const dialog = await fixture(
            html`<mas-reference-diagnosis-dialog .report=${interleavedReport}></mas-reference-diagnosis-dialog>`,
        );

        dialog.shadowRoot.querySelectorAll('sp-action-button[label="Details"]')[1].click();
        await dialog.updateComplete;

        expect(dialog.shadowRoot.querySelectorAll('.owner')).to.have.length(2);
        expect(dialog.shadowRoot.querySelectorAll('.detail')).to.have.length(1);
        expect(dialog.shadowRoot.querySelector('.detail').textContent).to.include('cards[9]');
    });

    it('rebuilds owner groups when a new report is supplied', async () => {
        const dialog = await fixture(html`<mas-reference-diagnosis-dialog .report=${report}></mas-reference-diagnosis-dialog>`);

        dialog.report = { ...report, issues: [report.issues[1]] };
        await dialog.updateComplete;

        expect(dialog.shadowRoot.querySelectorAll('.owner')).to.have.length(1);
        expect(dialog.shadowRoot.querySelector('.owner').textContent).to.include('Card');
        expect(dialog.shadowRoot.textContent).not.to.include('All plans');
    });

    it('renders every issue when the report contains more than 100 items', async () => {
        const largeReport = {
            ...report,
            issues: Array.from({ length: 125 }, (value, index) => ({ ...report.issues[0], valueIndex: index })),
        };
        const dialog = await fixture(
            html`<mas-reference-diagnosis-dialog .report=${largeReport}></mas-reference-diagnosis-dialog>`,
        );

        expect(dialog.shadowRoot.querySelectorAll('.issue').length).to.equal(125);
        expect(dialog.shadowRoot.querySelectorAll('.owner')).to.have.length(1);
    });

    it('opens a modal dialog so background controls cannot receive focus', async () => {
        const dialog = await fixture(html`<mas-reference-diagnosis-dialog .report=${report}></mas-reference-diagnosis-dialog>`);

        expect(dialog.shadowRoot.querySelector('dialog:modal')).to.exist;
    });

    it('returns false when the diagnostic popup is closed', async () => {
        const root = { id: 'root', path: '/content/dam/mas/root', fields: [], validationStatus: [] };
        const aem = {
            sites: {
                cf: {
                    fragments: {
                        getById: async () => {
                            throw new Error('403 Forbidden');
                        },
                    },
                },
            },
        };
        const decision = MasReferenceDiagnosisDialog.confirmFor(aem, [root]);
        await waitUntil(() => !!document.querySelector('mas-reference-diagnosis-dialog'));
        const dialog = document.querySelector('mas-reference-diagnosis-dialog');

        expect(dialog).to.exist;
        dialog.finish(false);
        expect(await decision).to.be.false;
    });

    it('returns true only when Continue Publish is explicitly selected', async () => {
        const decision = MasReferenceDiagnosisDialog.show(report);
        await waitUntil(() => !!document.querySelector('mas-reference-diagnosis-dialog'));
        const dialog = document.querySelector('mas-reference-diagnosis-dialog');
        await dialog.updateComplete;

        dialog.shadowRoot.querySelector('sp-button[variant="accent"]').click();

        expect(await decision).to.be.true;
        expect(document.querySelector('mas-reference-diagnosis-dialog')).to.be.null;
    });

    it('shows the evidence when the detail icon is activated', async () => {
        const dialog = await fixture(html`<mas-reference-diagnosis-dialog .report=${report}></mas-reference-diagnosis-dialog>`);

        dialog.shadowRoot.querySelector('sp-action-button[label="Details"]').click();
        await dialog.updateComplete;

        expect(dialog.shadowRoot.querySelector('.detail').textContent).to.include('fields.cards.values[0].<list element>');
    });

    it('renders every issue with its category, owner, field and target', async () => {
        const dialog = await fixture(html`<mas-reference-diagnosis-dialog .report=${report}></mas-reference-diagnosis-dialog>`);

        expect(dialog.shadowRoot.querySelectorAll('.issue').length).to.equal(2);
        expect(dialog.shadowRoot.textContent).to.include('Problem');
        expect(dialog.shadowRoot.textContent).to.include('Needs review');
        expect(dialog.shadowRoot.textContent).to.include('Cards');
        expect(dialog.shadowRoot.textContent).not.to.include('Item 1');
        expect(dialog.shadowRoot.textContent).to.include('/content/dam/mcs/product');
    });
});
