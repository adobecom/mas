import { expect } from '@esm-bundle/chai';
import { html, nothing } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { Fragment } from '../../src/aem/fragment.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, FRAGMENT_STATUS } from '../../src/constants.js';
import {
    getFragmentName,
    getOdinLocTaskNameValidationError,
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
});
