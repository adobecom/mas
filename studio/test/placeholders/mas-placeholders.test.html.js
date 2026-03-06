import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { elementUpdated } from '@open-wc/testing-helpers';

// Import Store first - component imports it directly
import Store from '../../src/store.js';
// Import the component being tested
import '../../src/placeholders/mas-placeholders.js';
// Import necessary dependencies potentially used by the component or tests
import '../../src/mas-repository.js';
import '../../src/rte/rte-field.js';
import '../../src/mas-fragment-status.js';
import { PAGE_NAMES } from '../../src/constants.js';
import Events from '../../src/events.js';

// Mock Store - Simplified for UI tests
function createObservable(initialValue) {
    let value = initialValue;
    const listeners = new Set();
    const stubSet = sinon.stub().callsFake((newValue) => {
        const oldValue = value;
        if (typeof newValue === 'function') {
            value = newValue(value);
        } else {
            value = newValue;
        }
        listeners.forEach((listener) => listener(value, oldValue));
        return value;
    });
    return {
        value: initialValue, // Keep track for direct access if needed
        get: () => value,
        set: stubSet,
        subscribe: (listener) => {
            listeners.add(listener);
            return { unsubscribe: () => listeners.delete(listener) };
        },
    };
}

function createStoreMock(initialData = {}) {
    return {
        search: createObservable(initialData.search || { path: 'test-folder' }),
        filters: createObservable(initialData.filters || { locale: 'en_US' }),
        page: createObservable(initialData.page || PAGE_NAMES.PLACEHOLDERS),
        folders: {
            data: createObservable(initialData.folderData || ['test-folder']),
            loaded: createObservable(true),
        },
        placeholders: {
            list: {
                data: createObservable(initialData.placeholders || []),
                loading: createObservable(false),
            },
            index: createObservable(null),
            selection: createObservable([]),
            search: createObservable(''),
        },
        sort: createObservable({ sortBy: 'key', sortDirection: 'asc' }),
        // Mock necessary event emitters if component interacts with them directly
        toast: {
            emit: sinon.stub(),
        },
    };
}

// Let's simplify our mock data to reduce test complexity
const mockPlaceholdersData = [
    {
        id: '1',
        key: 'key-one',
        value: 'Value One',
        displayValue: 'Value One',
        locale: 'en_US',
        status: 'Draft',
        updatedBy: 'User A',
        updatedAt: '2024-01-01',
        isRichText: false,
        modified: false,
        path: '/path/one',
        fragment: { id: 'frag1', path: '/path/one' },
    },
    {
        id: '2',
        key: 'key-two',
        value: '<p>Value Two</p>',
        displayValue: 'Value Two',
        locale: 'en_US',
        status: 'Published',
        updatedBy: 'User B',
        updatedAt: '2024-01-02',
        isRichText: true,
        modified: true,
        path: '/path/two',
        fragment: { id: 'frag2', path: '/path/two' },
    },
];

runTests(async () => {
    describe('mas-placeholders component - UI Tests', () => {
        let element;
        let masRepository;
        let store;
        let fetchStub;
        let toastEmitStub;

        beforeEach(async function () {
            // Ensure clean DOM
            const existing = document.body.querySelector('mas-placeholders');
            if (existing) existing.remove();
            const repoExisting = document.body.querySelector('mas-repository');
            if (repoExisting) repoExisting.remove();

            // Mock fetch used by dependencies with realistic responses
            fetchStub = sinon.stub(window, 'fetch').callsFake((url) => {
                const urlStr = typeof url === 'string' ? url : '';
                // AEM QueryBuilder call used by listFolders
                if (urlStr.includes('/bin/querybuilder.json') && urlStr.includes('type=sling:Folder')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({
                            hits: [
                                { name: 'images', title: 'Images' },
                                { name: 'test-folder', title: 'Test Folder' },
                            ],
                        }),
                        text: async () => '',
                    });
                }
                // CSRF token endpoint (in case code touches it)
                if (urlStr.includes('/libs/granite/csrf/token.json')) {
                    return Promise.resolve({ ok: true, json: async () => ({ token: 'fake-token' }), text: async () => '' });
                }
                // Default response for any other calls used in these UI tests
                return Promise.resolve({ ok: true, json: async () => ({}), text: async () => '' });
            });
            toastEmitStub = sinon.stub(Events.toast, 'emit'); // Use the actual Events object

            // Initialize Store with test data
            Store.search.set({ path: 'test-folder' });
            Store.filters.set({ locale: 'en_US' });
            Store.page.set(PAGE_NAMES.PLACEHOLDERS);
            Store.folders.data.set(['test-folder']);
            Store.folders.loaded.set(true);
            Store.sort.set({ sortBy: 'key', sortDirection: 'asc' });
            Store.placeholders.list.data.set([]);
            Store.placeholders.list.loading.set(false);
            Store.placeholders.selection.set([]);
            Store.placeholders.search.set('');
            Store.placeholders.index.set(null);

            // Create elements manually for more control
            const parent = document.createElement('div');
            masRepository = document.createElement('mas-repository');
            masRepository.setAttribute('bucket', 'test-bucket');
            element = document.createElement('mas-placeholders');
            parent.appendChild(masRepository);
            parent.appendChild(element);
            document.body.appendChild(parent);
            // Wait for element to be connected
            await new Promise((r) => setTimeout(r, 0));
            // Mock repository methods minimally
            masRepository.aem = { sites: { cf: { fragments: {} } } };
            await new Promise((r) => setTimeout(r, 10)); // Small delay to ensure rendering
        });

        afterEach(function () {
            sinon.restore(); // Restore all stubs/spies
            // Fix parentElement error by safeguarding
            if (element && element.parentElement) {
                element.parentElement.remove();
            } else if (element) {
                element.remove(); // Direct removal if no parent
            }
        });

        // Basic render test
        it('should render correctly with initial data', async function () {
            expect(element).to.exist;
            expect(element.shadowRoot).to.exist;
        });

        // Loading state test
        it('should display loading indicator when loading', async function () {
            // Set loading state via Store
            Store.placeholders.list.loading.set(true);
            await elementUpdated(element);

            // Check for progress circle
            await new Promise((r) => setTimeout(r, 50));
            const progressCircle = element.shadowRoot.querySelector('sp-progress-circle');
            expect(progressCircle).to.exist;

            // Reset state
            Store.placeholders.list.loading.set(false);
            await elementUpdated(element);
            await new Promise((r) => setTimeout(r, 50));

            // Check progress circle is gone
            const progressAfter = element.shadowRoot.querySelector('sp-progress-circle');
            expect(progressAfter).to.not.exist;
        });

        // Error display test
        it('should display error message when error property is set', async function () {
            element.error = 'Test Error';
            await elementUpdated(element);
            // Check for error message
            const errorElement = element.shadowRoot.querySelector('.error-message');

            expect(errorElement).to.exist;
            expect(errorElement.textContent).to.include('Test Error');
        });

        // Test search functionality
        it('should update search query on input', async function () {
            // Find search input
            const searchInput = element.shadowRoot.querySelector('sp-search');
            // Set value and dispatch event
            searchInput.value = 'test';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            await elementUpdated(element);

            // Check Store was updated
            expect(Store.placeholders.search.get()).to.equal('test');
        });

        // Save placeholder use case: open creation modal
        it('should open creation modal when Create New Placeholder is clicked', async function () {
            expect(element.shadowRoot.querySelector('mas-placeholders-creation-modal')).to.not.exist;

            const createButton = element.shadowRoot.querySelector('.create-button');
            expect(createButton).to.exist;
            createButton.click();
            await elementUpdated(element);

            const modal = element.shadowRoot.querySelector('mas-placeholders-creation-modal');
            expect(modal).to.exist;
        });

        // Save placeholder use case: onSave runs (clearCaches + refresh) when modal dispatches save
        it('should run onSave and refresh when modal dispatches save event', async function () {
            const refreshSpy = sinon.spy(element, 'refresh');

            const createButton = element.shadowRoot.querySelector('.create-button');
            createButton.click();
            await elementUpdated(element);

            const modal = element.shadowRoot.querySelector('mas-placeholders-creation-modal');
            expect(modal).to.exist;
            modal.dispatchEvent(new CustomEvent('save'));
            await elementUpdated(element);

            expect(refreshSpy.calledOnce).to.be.true;
        });

        // Save placeholder use case: onSave() clears caches and refreshes list
        it('should refresh when onSave is called', async function () {
            const refreshSpy = sinon.spy(element, 'refresh');
            element.onSave();
            await elementUpdated(element);
            expect(refreshSpy.calledOnce).to.be.true;
        });
    });
});
