import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import '../../src/swc.js';
import '../../src/translation/mas-translation-files-table.js';

describe('MasTranslationFilesTable', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.translationProjects.inEdit.value = null;
        Store.translationProjects.fragmentsByPaths.value = new Map();
        Store.translationProjects.allFragments.value = [];
        Store.search.value = { path: 'acom/en_US' };
        Store.filters.value = { locale: 'en_US' };
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.translationProjects.inEdit.value = null;
        Store.translationProjects.fragmentsByPaths.value = new Map();
        Store.translationProjects.allFragments.value = [];
    });

    describe('copyToClipboard', () => {
        it('should copy text to clipboard and add copied class', async () => {
            const el = await fixture(html`<mas-translation-files-table></mas-translation-files-table>`);
            const writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').resolves();
            const mockButton = document.createElement('button');
            const event = {
                stopPropagation: sandbox.stub(),
                currentTarget: mockButton,
            };

            await el.copyToClipboard(event, 'test-text');

            expect(writeTextStub.calledWith('test-text')).to.be.true;
            expect(event.stopPropagation.called).to.be.true;
            expect(mockButton.classList.contains('copied')).to.be.true;
        });

        it('should remove copied class after timeout', async () => {
            const clock = sandbox.useFakeTimers();
            const el = await fixture(html`<mas-translation-files-table></mas-translation-files-table>`);
            sandbox.stub(navigator.clipboard, 'writeText').resolves();
            const mockButton = document.createElement('button');
            const event = {
                stopPropagation: sandbox.stub(),
                currentTarget: mockButton,
            };

            await el.copyToClipboard(event, 'test-text');
            expect(mockButton.classList.contains('copied')).to.be.true;

            clock.tick(1500);
            expect(mockButton.classList.contains('copied')).to.be.false;

            clock.restore();
        });

        it('should handle clipboard write failure gracefully', async () => {
            const el = await fixture(html`<mas-translation-files-table></mas-translation-files-table>`);
            const consoleErrorStub = sandbox.stub(console, 'error');
            const writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').rejects(new Error('Clipboard error'));
            const mockButton = document.createElement('button');
            const event = {
                stopPropagation: sandbox.stub(),
                currentTarget: mockButton,
            };

            await el.copyToClipboard(event, 'test-text');

            expect(writeTextStub.calledWith('test-text')).to.be.true;
            expect(event.stopPropagation.called).to.be.true;
            expect(consoleErrorStub.calledWith('Failed to copy:', sinon.match.instanceOf(Error))).to.be.true;
            expect(mockButton.classList.contains('copied')).to.be.false;
        });

        it('should stop event propagation even on failure', async () => {
            const el = await fixture(html`<mas-translation-files-table></mas-translation-files-table>`);
            sandbox.stub(console, 'error');
            sandbox.stub(navigator.clipboard, 'writeText').rejects(new Error('Clipboard error'));
            const mockButton = document.createElement('button');
            const event = {
                stopPropagation: sandbox.stub(),
                currentTarget: mockButton,
            };

            await el.copyToClipboard(event, 'test-text');

            expect(event.stopPropagation.called).to.be.true;
        });
    });
});
