import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/swc.js';
import '../../src/editors/compare-chart-editor.js';
import '../../src/editors/acom-content-preview.js';
import generateFragmentStore from '../../src/reactivity/source-fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import Store from '../../src/store.js';

const waitForUpdates = async (element) => {
    await element.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await element.updateComplete;
};

const getControl = (root, selector) => root.querySelector(selector);

const ensureAemFragmentDefinition = () => {
    if (customElements.get('aem-fragment')) return;

    class TestAemFragment extends HTMLElement {
        constructor() {
            super();
            this.cache = {
                store: new Map(),
                get: (id) => this.cache.store.get(id),
                add: (fragment) => this.cache.store.set(fragment.id, fragment),
                remove: (id) => this.cache.store.delete(id),
            };
        }
    }

    customElements.define('aem-fragment', TestAemFragment);
};

const createCollectionStore = () =>
    generateFragmentStore(
        new Fragment({
            id: 'collection-id',
            path: '/content/dam/mas/sandbox/en_US/compare-chart',
            title: 'Compare Chart',
            fields: [
                { name: 'cards', type: 'content-fragment', multiple: true, values: [] },
                {
                    name: 'compareChart',
                    type: 'long-text',
                    multiple: false,
                    mimeType: 'text/html',
                    values: [''],
                },
            ],
            references: [],
        }),
    );

const createPersistedCardFragment = () =>
    new Fragment({
        id: 'saved-card-id',
        path: '/content/dam/mas/sandbox/en_US/new-compare-card-1-a1b2',
        title: 'New Compare Card 1',
        tags: [{ id: 'mas:offerless/dx' }],
        model: {
            id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ',
            path: '/conf/mas/settings/dam/cfm/models/card',
        },
        fields: [
            { name: 'variant', type: 'text', values: ['mini-compare-chart'] },
            { name: 'cardName', type: 'text', values: ['New Compare Card 1'] },
            { name: 'cardTitle', type: 'text', values: ['New Compare Card 1'] },
            { name: 'osi', type: 'text', values: [''] },
        ],
        references: [],
    });

describe('compare-chart-editor', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(customElements.get('merch-card-editor').prototype, 'render').returns(html``);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('renders explicit new-card controls', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        const pasteCardButton = getControl(element.shadowRoot, '#paste-card-action');

        expect(newCardButton).to.exist;
        expect(pasteCardButton).to.exist;
        expect(element.shadowRoot.textContent).to.include('Add a card to start building the compare chart');
        expect(element.shadowRoot.textContent).not.to.include('In Memory');
        expect(element.shadowRoot.textContent).not.to.include('save action runs');
    });

    it('creates a new in-memory mini compare card draft', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);

        const [draftPath] = fragmentStore.get().getFieldValues('cards');
        const draftStore = element.selectedCardStore;

        expect(draftPath).to.include('__compare-chart-draft__');
        expect(draftStore.get().name).to.match(/^new-compare-card-1-[a-z0-9]{4}$/);
        expect(element.selectedCardPath).to.equal(draftPath);
        expect(draftStore.new).to.be.true;
        expect(draftStore.get().getFieldValue('variant')).to.equal('mini-compare-chart');
        expect(draftStore.get().title).to.equal('New Compare Card 1');
        expect(element.shadowRoot.textContent).to.not.include(draftPath);
    });

    it('renders a row-based Features table and adds rows to compareChart', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);

        const addRowButton = getControl(element.shadowRoot, '#add-feature-row-action');
        addRowButton.click();
        await waitForUpdates(element);

        const compareChartHtml = fragmentStore.get().getFieldValue('compareChart');
        const doc = new DOMParser().parseFromString(compareChartHtml, 'text/html');
        const row = doc.querySelector('.compare-chart-row');

        expect(element.shadowRoot.textContent).to.include('Features');
        expect(row).to.exist;
        expect(row.querySelector('.compare-chart-label')).to.exist;
        expect(row.querySelectorAll('.compare-chart-cell')).to.have.length(1);
    });

    it('does not inject dash placeholders into empty feature cells in preview markup', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        getControl(element.shadowRoot, '#new-card-action').click();
        await waitForUpdates(element);

        getControl(element.shadowRoot, '#add-feature-row-action').click();
        await waitForUpdates(element);

        const previewHtml = element.previewFragment?.getFieldValue?.('compareChart') || '';

        expect(previewHtml).to.not.include('<p>-</p>');
        expect(previewHtml).to.not.include('>-<');
    });

    it('groups cards and features inside a compare authoring container', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);

        const authoringContainer = element.shadowRoot.querySelector('.compare-authoring-container');
        const editorStack = element.shadowRoot.querySelector('.editor-stack');
        const [generalInfoPanel, cardsFeaturesPanel, selectedCardPanel] = [...editorStack.children];
        expect(authoringContainer).to.exist;
        expect(generalInfoPanel.textContent).to.include('General info');
        expect(cardsFeaturesPanel).to.equal(authoringContainer);
        expect(selectedCardPanel.tagName.toLowerCase()).to.equal('merch-card-editor');
        expect(authoringContainer.textContent).to.include('Cards');
        expect(authoringContainer.textContent).to.include('Features');

        const merchCardEditor = element.shadowRoot.querySelector('merch-card-editor');
        expect(authoringContainer.contains(merchCardEditor)).to.equal(false);
    });

    it('keeps only one active rte-field and disposes it on outside click', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);

        const addRowButton = getControl(element.shadowRoot, '#add-feature-row-action');
        addRowButton.click();
        await waitForUpdates(element);

        const [labelCell, valueCell] = element.shadowRoot.querySelectorAll(
            '.feature-label-cell.is-editable, .feature-value-cell.is-editable',
        );
        labelCell.click();
        await waitForUpdates(element);

        expect(element.shadowRoot.querySelectorAll('rte-field')).to.have.length(1);

        valueCell.click();
        await waitForUpdates(element);

        expect(element.shadowRoot.querySelectorAll('rte-field')).to.have.length(1);

        document.body.dispatchEvent(
            new PointerEvent('pointerdown', {
                bubbles: true,
                composed: true,
            }),
        );
        await waitForUpdates(element);

        expect(element.shadowRoot.querySelectorAll('rte-field')).to.have.length(0);
    });

    it('tabs to the next editable field and commits the current rich text', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);

        const addRowButton = getControl(element.shadowRoot, '#add-feature-row-action');
        addRowButton.click();
        await waitForUpdates(element);

        const [labelCell] = element.shadowRoot.querySelectorAll('.feature-label-cell.is-editable');
        labelCell.click();
        await waitForUpdates(element);

        const activeEditor = element.shadowRoot.querySelector('rte-field');
        activeEditor.value = '<p>Storage</p>';
        expect(activeEditor.hasAttribute('float')).to.equal(true);
        activeEditor.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'Tab',
                bubbles: true,
                composed: true,
            }),
        );
        await waitForUpdates(element);

        expect(element.activeEditorKey).to.match(/^cell:/);
        expect(fragmentStore.get().getFieldValue('compareChart')).to.include('>Storage<');
        expect(element.shadowRoot.querySelectorAll('rte-field')).to.have.length(1);
    });

    it('escapes out of an active feature editor and restores the original value', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);

        const addRowButton = getControl(element.shadowRoot, '#add-feature-row-action');
        addRowButton.click();
        await waitForUpdates(element);

        const [labelCell] = element.shadowRoot.querySelectorAll('.feature-label-cell.is-editable');
        labelCell.click();
        await waitForUpdates(element);

        const activeEditor = element.shadowRoot.querySelector('rte-field');
        activeEditor.value = '<p>Temporary</p>';
        activeEditor.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
        await waitForUpdates(element);

        activeEditor.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true,
                composed: true,
            }),
        );
        await waitForUpdates(element);

        expect(fragmentStore.get().getFieldValue('compareChart')).to.not.include('Temporary');
        expect(element.shadowRoot.querySelector('rte-field')).to.not.exist;
        expect(element.activeEditorKey).to.equal('');
    });

    it('pastes a card from a Studio URL in the clipboard and resolves its path by id', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);
        const fetchedCard = new Fragment({
            id: '2c91c10d-f869-4dbf-9f8c-723ff259b737',
            path: '/content/dam/mas/sandbox/en_US/pasted-card',
            title: 'Pasted Card',
            model: { path: '/conf/mas/settings/dam/cfm/models/card' },
            fields: [{ name: 'cardTitle', type: 'text', values: ['Pasted Card'] }],
            references: [],
        });
        const existingStores = Store.fragments.list.data.get();

        Object.defineProperty(window.navigator, 'clipboard', {
            configurable: true,
            value: {
                readText: sandbox
                    .stub()
                    .resolves(
                        'https://mas.adobe.com/studio.html#content-type=merch-card&page=content&path=sandbox&query=2c91c10d-f869-4dbf-9f8c-723ff259b737',
                    ),
            },
        });
        Store.fragments.list.data.set([generateFragmentStore(fetchedCard), ...existingStores]);

        await waitForUpdates(element);

        getControl(element.shadowRoot, '#paste-card-action').click();
        await waitForUpdates(element);
        await new Promise((resolve) => setTimeout(resolve, 0));
        await waitForUpdates(element);

        expect(fragmentStore.get().getFieldValues('cards')).to.deep.equal(['/content/dam/mas/sandbox/en_US/pasted-card']);
        expect(element.selectedCardPath).to.equal('/content/dam/mas/sandbox/en_US/pasted-card');

        Store.fragments.list.data.set(existingStores);
    });

    it('uses the shared icon picker modal for active feature editors', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);

        const addRowButton = getControl(element.shadowRoot, '#add-feature-row-action');
        addRowButton.click();
        await waitForUpdates(element);

        const [labelCell] = element.shadowRoot.querySelectorAll('.feature-label-cell.is-editable');
        labelCell.click();
        await waitForUpdates(element);

        const activeEditor = element.shadowRoot.querySelector('rte-field');

        expect(activeEditor.hasAttribute('icon-picker')).to.equal(true);
    });

    it('reorders feature rows with the hover row actions', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);

        const addRowButton = getControl(element.shadowRoot, '#add-feature-row-action');
        addRowButton.click();
        await waitForUpdates(element);
        addRowButton.click();
        await waitForUpdates(element);

        const [firstLabelCell, secondLabelCell] = element.shadowRoot.querySelectorAll('.feature-label-cell.is-editable');

        firstLabelCell.click();
        await waitForUpdates(element);
        let activeEditor = element.shadowRoot.querySelector('rte-field');
        activeEditor.value = '<p>First row</p>';
        activeEditor.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
        await waitForUpdates(element);

        secondLabelCell.click();
        await waitForUpdates(element);
        activeEditor = element.shadowRoot.querySelector('rte-field');
        activeEditor.value = '<p>Second row</p>';
        activeEditor.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
        await waitForUpdates(element);

        const moveDownButton = element.shadowRoot.querySelector('.feature-row-move-down');
        moveDownButton.click();
        await waitForUpdates(element);

        const doc = new DOMParser().parseFromString(fragmentStore.get().getFieldValue('compareChart'), 'text/html');
        const labels = [...doc.querySelectorAll('.compare-chart-label')].map((node) => node.textContent.trim());

        expect(labels).to.deep.equal(['Second row', 'First row']);
    });

    it('reorders cards with drag and drop', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');

        newCardButton.click();
        await waitForUpdates(element);
        newCardButton.click();
        await waitForUpdates(element);

        const addRowButton = getControl(element.shadowRoot, '#add-feature-row-action');
        addRowButton.click();
        await waitForUpdates(element);

        const [firstHandle] = element.shadowRoot.querySelectorAll('.drag-handle');
        const dropIndicators = [...element.shadowRoot.querySelectorAll('.drop-indicator')];
        const trailingIndicator = dropIndicators.at(-1);
        const dataTransfer = new DataTransfer();

        firstHandle.dispatchEvent(
            new DragEvent('dragstart', {
                bubbles: true,
                composed: true,
                dataTransfer,
            }),
        );
        trailingIndicator.dispatchEvent(
            new DragEvent('dragover', {
                bubbles: true,
                composed: true,
                cancelable: true,
                dataTransfer,
            }),
        );
        trailingIndicator.dispatchEvent(
            new DragEvent('drop', {
                bubbles: true,
                composed: true,
                cancelable: true,
                dataTransfer,
            }),
        );

        await waitForUpdates(element);

        expect(fragmentStore.get().getFieldValues('cards')[0]).to.match(/__compare-chart-draft__-collection-id-2-[a-z0-9]{4}$/);
        expect(fragmentStore.get().getFieldValue('compareChart')).to.include(
            'data-card-path',
        );
    });

    it('opens a remove-card dialog and leaves data untouched on cancel', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);

        const addRowButton = getControl(element.shadowRoot, '#add-feature-row-action');
        addRowButton.click();
        await waitForUpdates(element);

        const removeCardButton = getControl(element.shadowRoot, '#remove-card-action');
        removeCardButton.click();
        await waitForUpdates(element);

        expect(element.shadowRoot.querySelector('sp-dialog')).to.exist;

        const cancelButton = [...element.shadowRoot.querySelectorAll('sp-button')].find(
            (button) => button.textContent.trim() === 'Cancel',
        );
        cancelButton.click();
        await waitForUpdates(element);

        expect(element.shadowRoot.querySelector('sp-dialog')).to.not.exist;
        expect(fragmentStore.get().getFieldValues('cards')).to.have.length(1);
        expect(fragmentStore.get().getFieldValue('compareChart')).to.include('compare-chart-row');
    });

    it('creates new draft cards on save and rewrites the collection card paths', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);

        element.selectedCardStore.get().newTags = ['mas:offerless/dx'];

        const repository = {
            createFragment: sandbox.stub().resolves(createPersistedCardFragment()),
            saveFragment: sandbox.stub().resolves({ id: 'collection-id' }),
        };

        await element.savePendingChanges(repository);

        expect(repository.createFragment.calledOnce).to.be.true;
        expect(repository.createFragment.firstCall.args[0].fields).to.be.undefined;
        expect(repository.createFragment.firstCall.args[0].name).to.match(/^new-compare-card-1-[a-z0-9]{4}$/);
        expect(repository.saveFragment.calledTwice).to.be.true;
        expect(repository.saveFragment.firstCall.args[0]).to.equal(element.selectedCardStore);
        expect(repository.saveFragment.firstCall.args[1]).to.equal(false);
        expect(repository.saveFragment.secondCall.args).to.deep.equal([fragmentStore, false]);
        expect(fragmentStore.get().getFieldValues('cards')).to.deep.equal([
            '/content/dam/mas/sandbox/en_US/new-compare-card-1-a1b2',
        ]);
        expect(element.selectedCardPath).to.equal('/content/dam/mas/sandbox/en_US/new-compare-card-1-a1b2');
        expect(element.selectedCardStore.new).to.not.be.true;
    });

    it('rethrows create failures instead of crashing on draft path replacement', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);

        element.selectedCardStore.get().newTags = ['mas:offerless/dx'];

        const repository = {
            createFragment: sandbox.stub().rejects(new Error('Failed to create fragment: 400 Bad Request')),
            saveFragment: sandbox.stub().resolves({ id: 'collection-id' }),
        };

        let thrownError;
        try {
            await element.savePendingChanges(repository);
        } catch (error) {
            thrownError = error;
        }

        expect(thrownError).to.exist;
        expect(thrownError.message).to.include('400 Bad Request');
        expect(repository.saveFragment.called).to.be.false;
    });

    it('does not restore tags as a fragment field when saving a new card', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);

        element.selectedCardStore.updateField('tags', ['mas:offerless/dx']);
        await waitForUpdates(element);

        const repository = {
            createFragment: sandbox.stub().resolves(createPersistedCardFragment()),
            saveFragment: sandbox.stub().resolves({ id: 'collection-id' }),
        };

        await element.savePendingChanges(repository);

        const savedCardStore = repository.saveFragment.firstCall.args[0];
        expect(savedCardStore.get().getField('tags')).to.not.exist;
    });

    it('syncs nested card edits back to references and refreshes the table preview fragment', async () => {
        ensureAemFragmentDefinition();

        const fragmentStore = createCollectionStore();
        const previewFragment = document.createElement('aem-fragment');
        previewFragment.setAttribute('fragment', 'compare-table-preview-collection-id');
        previewFragment.refresh = sandbox.spy();
        document.body.append(previewFragment);

        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);
        previewFragment.refresh.resetHistory();

        element.selectedCardStore.updateField('cardTitle', ['Updated Compare Card']);
        await waitForUpdates(element);
        await new Promise((resolve) => setTimeout(resolve, 80));

        const [draftPath] = fragmentStore.get().getFieldValues('cards');
        const reference = fragmentStore.get().references.find((item) => item.path === draftPath);
        const cardTitleField = reference.fields.find((field) => field.name === 'cardTitle');

        expect(cardTitleField.values[0]).to.equal('Updated Compare Card');
        expect(previewFragment.refresh.called).to.be.true;

        previewFragment.remove();
    });

    it('does not refresh the preview fragment again when the preview payload is unchanged', async () => {
        ensureAemFragmentDefinition();

        const fragmentStore = createCollectionStore();
        const previewFragment = document.createElement('aem-fragment');
        previewFragment.setAttribute('fragment', 'compare-table-preview-collection-id');
        previewFragment.refresh = sandbox.spy();
        document.body.append(previewFragment);

        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = getControl(element.shadowRoot, '#new-card-action');
        newCardButton.click();
        await waitForUpdates(element);
        await new Promise((resolve) => setTimeout(resolve, 80));

        previewFragment.refresh.resetHistory();

        element.requestUpdate();
        await waitForUpdates(element);
        await new Promise((resolve) => setTimeout(resolve, 80));

        expect(previewFragment.refresh.called).to.be.false;

        previewFragment.remove();
    });
});
