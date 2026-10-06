import { expect } from '@esm-bundle/chai';
import { html, nothing } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { Fragment } from '../../src/aem/fragment.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, FRAGMENT_STATUS, TRANSLATION_PROJECT_MODEL_ID } from '../../src/constants.js';
import {
    buildTranslationProjectDuplicatePayload,
    canDuplicateTranslationProject,
    duplicateTranslationProject,
    getFragmentName,
    getOdinLocTaskNameValidationError,
    getTranslationProjectTitles,
    isTranslationProjectTitleTaken,
    ODIN_LOC_TASK_NAME_MAX_LENGTH,
    renderFragmentStatusCell,
} from '../../src/translation/translation-utils.js';
import '../../src/swc.js';

describe('translation-utils', () => {
    let sandbox;
    let originalSearchValue;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalSearchValue = Store.search.get();
        Store.search.set({ path: 'acom' });
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.search.set(originalSearchValue);
    });

    describe('canDuplicateTranslationProject', () => {
        for (const { status, allowed } of [
            { status: undefined, allowed: true },
            { status: '', allowed: true },
            { status: 'ASYNC_PROCESSING', allowed: true },
            { status: 'FAILED', allowed: true },
            { status: 'QUEUED', allowed: false },
            { status: 'RUNNING', allowed: false },
            { status: 'COMPLETED', allowed: true },
            { status: 'CANCELLED', allowed: true },
            { status: 'UNKNOWN', allowed: false },
            { status: null, allowed: false },
        ]) {
            it(`${allowed ? 'allows' : 'blocks'} duplication for status ${status === undefined ? 'Draft' : status}`, () => {
                expect(canDuplicateTranslationProject(status)).to.equal(allowed);
            });
        }
    });

    describe('getFragmentName', () => {
        it('returns formatted name for card fragment', () => {
            const fragment = new Fragment({
                path: '/content/dam/mas/acom/en_US/cards/test',
                model: { path: CARD_MODEL_PATH },
                title: 'Test Card',
                fields: [
                    { name: 'name', values: ['test-card'] },
                    { name: 'cardTitle', values: ['Test Card'] },
                    { name: 'variant', values: ['catalog'] },
                ],
                tags: [],
            });
            const name = getFragmentName(fragment);
            expect(name).to.match(/^merch-card: ACOM/);
            expect(name).to.include('Catalog');
        });

        it('returns formatted name for collection fragment', () => {
            const fragment = new Fragment({
                path: '/content/dam/mas/acom/en_US/collections/test',
                model: { path: COLLECTION_MODEL_PATH },
                title: 'My Collection',
                fields: [],
                tags: [],
            });
            const name = getFragmentName(fragment);
            expect(name).to.equal('merch-card-collection: ACOM / My Collection');
        });

        it('includes the promotion title when a promotion tag is present', () => {
            const fragment = new Fragment({
                path: '/content/dam/mas/acom/en_US/cards/promo-test',
                model: { path: CARD_MODEL_PATH },
                title: 'Promo Card',
                fields: [
                    { name: 'name', values: ['promo-card'] },
                    { name: 'cardTitle', values: ['Promo Card'] },
                    { name: 'variant', values: ['catalog'] },
                    { name: 'tags', values: ['mas:promotion/holiday-sale'] },
                ],
                tags: [{ id: 'mas:promotion/holiday-sale', title: 'Holiday Sale' }],
            });
            const name = getFragmentName(fragment);
            expect(name).to.include('Holiday Sale');
        });

        it('returns format with undefined web component name when model path is unknown', () => {
            const fragment = new Fragment({
                path: '/content/dam/mas/acom/test',
                model: { path: '/unknown/model/path' },
                title: 'Unknown',
                fields: [],
                tags: [],
            });
            const name = getFragmentName(fragment);
            expect(name).to.include('undefined:');
        });

        it('handles null data gracefully', () => {
            const name = getFragmentName(null);
            expect(name).to.be.a('string');
        });

        it('handles undefined data gracefully', () => {
            const name = getFragmentName(undefined);
            expect(name).to.be.a('string');
        });
    });

    describe('renderFragmentStatusCell', () => {
        it('returns nothing when status is falsy', () => {
            const result = renderFragmentStatusCell();
            expect(result).to.equal(nothing);
        });

        it('returns nothing when status is null', () => {
            const result = renderFragmentStatusCell(null);
            expect(result).to.equal(nothing);
        });

        it('returns nothing when status is empty string', () => {
            const result = renderFragmentStatusCell('');
            expect(result).to.equal(nothing);
        });

        it('renders PUBLISHED status with green class', async () => {
            const result = renderFragmentStatusCell(FRAGMENT_STATUS.PUBLISHED);
            const el = await fixture(html`
                <sp-table>
                    <sp-table-body>
                        <sp-table-row>${result}</sp-table-row>
                    </sp-table-body>
                </sp-table>
            `);
            const statusDot = el.querySelector('.status-dot');
            const cell = el.querySelector('sp-table-cell');
            expect(cell).to.exist;
            expect(statusDot).to.exist;
            expect(statusDot.classList.contains('green')).to.be.true;
            expect(el.textContent.trim()).to.include('Published');
        });

        it('renders MODIFIED status with blue class', async () => {
            const result = renderFragmentStatusCell(FRAGMENT_STATUS.MODIFIED);
            const el = await fixture(html`
                <sp-table>
                    <sp-table-body>
                        <sp-table-row>${result}</sp-table-row>
                    </sp-table-body>
                </sp-table>
            `);
            const statusDot = el.querySelector('.status-dot');
            expect(statusDot).to.exist;
            expect(statusDot.classList.contains('blue')).to.be.true;
            expect(el.textContent.trim()).to.include('Modified');
        });

        it('renders DRAFT status without color class', async () => {
            const result = renderFragmentStatusCell(FRAGMENT_STATUS.DRAFT);
            const el = await fixture(html`
                <sp-table>
                    <sp-table-body>
                        <sp-table-row>${result}</sp-table-row>
                    </sp-table-body>
                </sp-table>
            `);
            const statusDot = el.querySelector('.status-dot');
            expect(statusDot).to.exist;
            expect(statusDot.classList.contains('green')).to.be.false;
            expect(statusDot.classList.contains('blue')).to.be.false;
            expect(el.textContent.trim()).to.include('Draft');
        });

        it('capitalizes first letter and lowercases rest for display', async () => {
            const result = renderFragmentStatusCell('CUSTOM_STATUS');
            const el = await fixture(html`
                <sp-table>
                    <sp-table-body>
                        <sp-table-row>${result}</sp-table-row>
                    </sp-table-body>
                </sp-table>
            `);
            expect(el.textContent.trim()).to.include('Custom_status');
        });
    });

    describe('getOdinLocTaskNameValidationError', () => {
        it('returns null for valid project title', () => {
            expect(getOdinLocTaskNameValidationError('ODIN_TASK-test.1')).to.be.null;
            expect(getOdinLocTaskNameValidationError('test1')).to.be.null;
            expect(getOdinLocTaskNameValidationError('  ok-name  ')).to.be.null;
        });

        it('returns null when value uses allowed punctuation with alphanumerics', () => {
            expect(getOdinLocTaskNameValidationError('a-b_c.d1')).to.be.null;
        });

        it('rejects empty and whitespace-only', () => {
            expect(getOdinLocTaskNameValidationError('')).to.be.a('string');
            expect(getOdinLocTaskNameValidationError('   ')).to.be.a('string');
            expect(getOdinLocTaskNameValidationError(null)).to.be.a('string');
        });

        it('rejects names longer than max length', () => {
            const long = 'a'.repeat(ODIN_LOC_TASK_NAME_MAX_LENGTH + 1);
            expect(getOdinLocTaskNameValidationError(long)).to.include(`${ODIN_LOC_TASK_NAME_MAX_LENGTH}`);
        });

        it('rejects names with no alphanumeric character', () => {
            expect(getOdinLocTaskNameValidationError('._-')).to.be.a('string');
            expect(getOdinLocTaskNameValidationError('...')).to.be.a('string');
        });

        it('rejects disallowed characters including spaces', () => {
            expect(getOdinLocTaskNameValidationError('bad name')).to.be.a('string');
            expect(getOdinLocTaskNameValidationError('a@b')).to.be.a('string');
        });

        it('rejects consecutive dots', () => {
            expect(getOdinLocTaskNameValidationError('task..name-test')).to.be.a('string');
        });
    });

    describe('isTranslationProjectTitleTaken', () => {
        it('returns false when title is empty', () => {
            expect(isTranslationProjectTitleTaken('', ['Spring Campaign'])).to.be.false;
        });

        it('returns false when there are no existing titles', () => {
            expect(isTranslationProjectTitleTaken('Spring Campaign')).to.be.false;
        });

        it('returns true when the title matches an existing one, case-insensitively', () => {
            expect(isTranslationProjectTitleTaken('spring campaign', ['Spring Campaign'])).to.be.true;
        });

        it('returns false for a unique title', () => {
            expect(isTranslationProjectTitleTaken('Summer Campaign', ['Spring Campaign'])).to.be.false;
        });

        it('returns true when titles differ in punctuation/spacing but normalize to the same slug', () => {
            expect(isTranslationProjectTitleTaken('Spring  Campaign!!', ['spring-campaign'])).to.be.true;
        });
    });

    describe('getTranslationProjectTitles', () => {
        it('extracts non-empty titles from a list of projects', () => {
            const projects = [{ title: 'Spring Campaign' }, { title: 'Summer Campaign' }];
            expect(getTranslationProjectTitles(projects)).to.deep.equal(['Spring Campaign', 'Summer Campaign']);
        });

        it('filters out falsy titles', () => {
            const projects = [{ title: '' }, { title: 'Summer Campaign' }, { title: null }];
            expect(getTranslationProjectTitles(projects)).to.deep.equal(['Summer Campaign']);
        });

        it('returns an empty array when no projects are given', () => {
            expect(getTranslationProjectTitles()).to.deep.equal([]);
        });
    });

    describe('buildTranslationProjectDuplicatePayload', () => {
        const sourceFragment = new Fragment({
            id: 'src-1',
            title: 'Spring Campaign',
            fields: [
                { name: 'title', type: 'text', multiple: false, values: ['Spring Campaign'] },
                { name: 'status', type: 'text', multiple: false, values: ['ASYNC_PROCESSING'] },
                {
                    name: 'fragments',
                    type: 'content-fragment',
                    multiple: true,
                    values: ['/content/dam/mas/acom/en_US/cards/a'],
                },
                { name: 'placeholders', type: 'content-fragment', multiple: true, values: [] },
                { name: 'collections', type: 'content-fragment', multiple: true, values: [] },
                { name: 'targetLocales', type: 'text', multiple: true, values: ['fr_FR', 'de_DE'] },
                { name: 'completedLocales', values: ['fr_FR'] },
                { name: 'submissionDate', type: 'date-time', multiple: false, values: ['2026-01-01T00:00:00.000Z'] },
                { name: 'projectType', type: 'enumeration', multiple: false, values: ['translation'] },
            ],
        });

        it('sets the new title on the payload and on the title field', () => {
            const payload = buildTranslationProjectDuplicatePayload(sourceFragment, 'Spring Campaign copy');
            expect(payload.title).to.equal('Spring Campaign copy');
            expect(payload.fields.find((f) => f.name === 'title').values).to.deep.equal(['Spring Campaign copy']);
        });

        it('derives name from a normalized version of the title', () => {
            const payload = buildTranslationProjectDuplicatePayload(sourceFragment, 'Spring Campaign copy');
            expect(payload.name).to.equal('spring-campaign-copy');
        });

        it('resets status and submissionDate to empty, so the copy is a fresh Draft', () => {
            const payload = buildTranslationProjectDuplicatePayload(sourceFragment, 'Spring Campaign copy');
            expect(payload.fields.find((f) => f.name === 'status').values).to.deep.equal([]);
            expect(payload.fields.find((f) => f.name === 'submissionDate').values).to.deep.equal([]);
        });

        it('clears completed locales when duplicating a partially completed project without changing the source', () => {
            const payload = buildTranslationProjectDuplicatePayload(sourceFragment, 'Spring-Campaign-copy');
            expect(payload.fields.find((field) => field.name === 'completedLocales')).to.deep.equal({
                name: 'completedLocales',
                type: 'text',
                multiple: true,
                values: [],
            });
            expect(sourceFragment.getFieldValues('completedLocales')).to.deep.equal(['fr_FR']);
        });

        it('carries over fragments, targetLocales, and projectType unchanged', () => {
            const payload = buildTranslationProjectDuplicatePayload(sourceFragment, 'Spring Campaign copy');
            expect(payload.fields.find((f) => f.name === 'fragments').values).to.deep.equal([
                '/content/dam/mas/acom/en_US/cards/a',
            ]);
            expect(payload.fields.find((f) => f.name === 'targetLocales').values).to.deep.equal(['fr_FR', 'de_DE']);
            expect(payload.fields.find((f) => f.name === 'projectType').values).to.deep.equal(['translation']);
        });
    });

    describe('duplicateTranslationProject', () => {
        it('creates the duplicate under the translations path with the translation project model id', async () => {
            const sourceFragment = new Fragment({
                id: 'src-1',
                title: 'Spring Campaign',
                fields: [
                    { name: 'title', type: 'text', multiple: false, values: ['Spring Campaign'] },
                    { name: 'status', type: 'text', multiple: false, values: ['FAILED'] },
                ],
            });
            const createdFragment = new Fragment({ id: 'new-1', title: 'Spring Campaign copy' });
            const createFragment = sinon.stub().resolves(createdFragment);
            const repository = {
                createFragment,
                getTranslationsPath: () => '/content/dam/mas/acom/translations',
            };

            const result = await duplicateTranslationProject(repository, sourceFragment, 'Spring Campaign copy');

            expect(result).to.equal(createdFragment);
            expect(createFragment.calledOnce).to.be.true;
            const [payload, withToast] = createFragment.firstCall.args;
            expect(withToast).to.be.false;
            expect(payload.parentPath).to.equal('/content/dam/mas/acom/translations');
            expect(payload.modelId).to.equal(TRANSLATION_PROJECT_MODEL_ID);
            expect(payload.title).to.equal('Spring Campaign copy');
        });

        it('throws when createFragment resolves falsy', async () => {
            const sourceFragment = new Fragment({ id: 'src-1', title: 'Spring Campaign', fields: [] });
            const repository = {
                createFragment: sinon.stub().resolves(null),
                getTranslationsPath: () => '/content/dam/mas/acom/translations',
            };

            let error;
            try {
                await duplicateTranslationProject(repository, sourceFragment, 'Spring Campaign copy');
            } catch (e) {
                error = e;
            }
            expect(error).to.exist;
            expect(error.message).to.equal('Failed to duplicate project.');
            expect(error.alreadyToasted).to.be.true;
        });
    });
});
