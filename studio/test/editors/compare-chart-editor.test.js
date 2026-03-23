import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/swc.js';
import '../../src/editors/compare-chart-editor.js';
import generateFragmentStore from '../../src/reactivity/source-fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';

const waitForUpdates = async (element) => {
    await element.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await element.updateComplete;
};

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

        const newCardButton = [...element.shadowRoot.querySelectorAll('sp-button')].find(
            (button) => button.textContent.trim() === 'New Card',
        );

        expect(newCardButton).to.exist;
        expect(element.shadowRoot.textContent).to.include('Add a card to start building the compare chart');
        expect(element.shadowRoot.textContent).not.to.include('In Memory');
        expect(element.shadowRoot.textContent).not.to.include('save action runs');
    });

    it('creates a new in-memory mini compare card draft', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = [...element.shadowRoot.querySelectorAll('sp-button')].find(
            (button) => button.textContent.trim() === 'New Card',
        );
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

    it('reorders cards with drag and drop', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = [...element.shadowRoot.querySelectorAll('sp-button')].find(
            (button) => button.textContent.trim() === 'New Card',
        );

        newCardButton.click();
        await waitForUpdates(element);
        newCardButton.click();
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
    });

    it('creates new draft cards on save and rewrites the collection card paths', async () => {
        const fragmentStore = createCollectionStore();
        const element = await fixture(html`<compare-chart-editor .fragmentStore=${fragmentStore}></compare-chart-editor>`);

        await waitForUpdates(element);

        const newCardButton = [...element.shadowRoot.querySelectorAll('sp-button')].find(
            (button) => button.textContent.trim() === 'New Card',
        );
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

        const newCardButton = [...element.shadowRoot.querySelectorAll('sp-button')].find(
            (button) => button.textContent.trim() === 'New Card',
        );
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

        const newCardButton = [...element.shadowRoot.querySelectorAll('sp-button')].find(
            (button) => button.textContent.trim() === 'New Card',
        );
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

        const newCardButton = [...element.shadowRoot.querySelectorAll('sp-button')].find(
            (button) => button.textContent.trim() === 'New Card',
        );
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
});
