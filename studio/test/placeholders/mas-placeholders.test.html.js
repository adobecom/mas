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

runTests(async () => {
    describe('mas-placeholders component - UI Tests', () => {
        let element;
        let fetchStub;
        let parent;

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
            // Keep repository search side effects out of this component-only suite.
            Store.profile.set(null);
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

            // Create element manually for more control
            parent = document.createElement('div');
            element = document.createElement('mas-placeholders');
            parent.appendChild(element);
            document.body.appendChild(parent);
            await new Promise((r) => setTimeout(r, 10));
        });

        afterEach(function () {
            sinon.restore(); // Restore all stubs/spies
            parent?.remove();
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
