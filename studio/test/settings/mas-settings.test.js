import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/swc.js';
import '../../src/settings/mas-settings.js';
import { SettingsStore } from '../../src/settings/settings-store.js';
import Store from '../../src/store.js';
import { PAGE_NAMES } from '../../src/constants.js';

describe('MasSettings', () => {
    let sandbox;
    let previousSearch;
    let previousFilters;
    let previousPage;

    const settingFragments = [
        {
            id: 'setting-secure-transaction',
            title: 'Secure transaction',
            path: '/content/dam/mas/acom/en_US/settings/secure-transaction',
            status: 'PUBLISHED',
            modified: { by: 'Mr Bean', at: '2025-10-16T11:14:00.000Z' },
            tags: [{ id: 'mas:keyword/all', title: 'All' }],
            fields: [
                { name: 'name', values: ['showSecureTransaction'] },
                { name: 'label', values: ['Secure transaction'] },
                { name: 'variant', values: ['catalog', 'mini'] },
                { name: 'value', values: [true] },
            ],
        },
        {
            id: 'setting-show-addon',
            title: 'Show Addon',
            path: '/content/dam/mas/acom/en_US/settings/show-addon',
            status: 'PUBLISHED',
            modified: { by: 'Mr Bean', at: '2025-10-15T10:10:00.000Z' },
            tags: [{ id: 'mas:keyword/checkout', title: 'Checkout' }],
            fields: [
                { name: 'name', values: ['showAddon'] },
                { name: 'label', values: ['Show Addon'] },
                { name: 'variant', values: [] },
                { name: 'value', values: [true] },
            ],
        },
        {
            id: 'setting-show-plan-type',
            title: 'Show Plan type',
            path: '/content/dam/mas/acom/en_US/settings/show-plan-type',
            status: 'PUBLISHED',
            modified: { by: 'Mr Bean', at: '2025-10-14T09:11:00.000Z' },
            tags: [{ id: 'mas:keyword/pricing', title: 'Pricing' }],
            fields: [
                { name: 'name', values: ['showPlanType'] },
                { name: 'label', values: ['Show Plan type'] },
                { name: 'variant', values: ['catalog', 'plans'] },
                { name: 'value', values: [true] },
            ],
        },
        {
            id: 'setting-see-all-plans',
            title: 'See all plans & pricing details',
            path: '/content/dam/mas/acom/en_US/settings/see-all-plans',
            status: 'PUBLISHED',
            modified: { by: 'Mr Bean', at: '2025-10-13T08:21:00.000Z' },
            tags: [{ id: 'mas:keyword/legal', title: 'Legal' }],
            fields: [
                { name: 'name', values: ['showPlansPricingDetails'] },
                { name: 'label', values: ['See all plans & pricing details'] },
                { name: 'variant', values: ['plans'] },
                { name: 'value', values: ['See all plans & pricing details'] },
            ],
        },
        {
            id: 'setting-acrobat-ai-assistant',
            title: 'Acrobat AI assistant',
            path: '/content/dam/mas/acom/en_US/settings/acrobat-ai-assistant',
            status: 'PUBLISHED',
            modified: { by: 'Mr Bean', at: '2025-10-12T10:25:00.000Z' },
            tags: [{ id: 'mas:keyword/all', title: 'All' }],
            fields: [
                { name: 'name', values: ['showAcrobatAiAssistant'] },
                { name: 'label', values: ['Acrobat AI assistant'] },
                { name: 'variant', values: [] },
                {
                    name: 'value',
                    values: [
                        'Add AI Assistant to your free Reader app for US$59.88/yr. Add AI Assistant to your free Reader app for US$4.99/mo.',
                    ],
                },
            ],
        },
    ];

    const createMockAem = (items) => ({
        sites: {
            cf: {
                fragments: {
                    getByPath: async (path) => ({
                        id: 'settings-index',
                        path,
                        fields: [{ name: 'entries', values: items.map((item) => item.path) }],
                        references: items.map((item) => ({ ...item, fieldName: 'entries' })),
                    }),
                },
            },
        },
    });

    const waitForRows = async (table, expectedCount) => {
        let attempts = 0;
        while (attempts < 20) {
            await table.updateComplete;
            const count = table.shadowRoot.querySelectorAll('mas-setting-item').length;
            if (count === expectedCount) return;
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        previousSearch = structuredClone(Store.search.get());
        previousFilters = structuredClone(Store.filters.get());
        previousPage = Store.page.get();
        Store.search.set({ path: 'acom' });
        Store.filters.set({ ...Store.filters.get(), locale: 'en_US' });
        Store.page.set(PAGE_NAMES.SETTINGS);
        Store.settings.fragmentId.set(null);
        Store.settings.creating.set(false);
    });

    afterEach(() => {
        SettingsStore.destroy();
        SettingsStore.setAem(null);
        Store.search.set(previousSearch);
        Store.filters.set(previousFilters);
        Store.page.set(previousPage);
        Store.settings.fragmentId.set(null);
        Store.settings.creating.set(false);
        sandbox.restore();
    });

    it('renders settings header and rows', async () => {
        const el = await fixture(html`<mas-settings .aem=${createMockAem(settingFragments)}></mas-settings>`);
        await el.updateComplete;
        await el.updateComplete;

        expect(el.shadowRoot.querySelector('#title').textContent.trim()).to.equal('Settings');

        const table = el.shadowRoot.querySelector('#settings-table');
        await waitForRows(table, 5);

        const rows = table.shadowRoot.querySelectorAll('mas-setting-item');
        expect(rows.length).to.equal(5);
    });

    it('opens create setting modal when create setting is clicked', async () => {
        const el = await fixture(html`<mas-settings .aem=${createMockAem([])}></mas-settings>`);
        await el.updateComplete;

        el.shadowRoot.querySelector('#create-setting-button').click();
        await el.updateComplete;
        await el.updateComplete;

        expect(Store.settings.fragmentId.get()).to.equal(null);
        expect(Store.settings.creating.get()).to.equal(true);
        expect(Store.page.get()).to.equal(PAGE_NAMES.SETTINGS);
        expect(el.shadowRoot.querySelector('.settings-editor-dialog').headline).to.equal('Create new setting');
        expect(el.shadowRoot.querySelector('#settings-table')).to.exist;
    });

    it('does not render edit dialog until settings rows are loaded', async () => {
        Store.settings.fragmentId.set('setting-secure-transaction');

        let resolveIndex;
        const delayedAem = {
            sites: {
                cf: {
                    fragments: {
                        getByPath: () =>
                            new Promise((resolve) => {
                                resolveIndex = resolve;
                            }),
                    },
                },
            },
        };

        const el = await fixture(html`<mas-settings .aem=${delayedAem}></mas-settings>`);
        await el.updateComplete;
        await el.updateComplete;

        expect(el.shadowRoot.querySelector('.settings-editor-dialog')).to.equal(null);

        resolveIndex({
            id: 'settings-index',
            path: '/content/dam/mas/acom/settings/index',
            fields: [{ name: 'entries', values: settingFragments.map((item) => item.path) }],
            references: settingFragments.map((item) => ({ ...item, fieldName: 'entries' })),
        });

        await new Promise((resolve) => setTimeout(resolve, 0));
        await el.updateComplete;
        await el.updateComplete;

        expect(el.shadowRoot.querySelector('.settings-editor-dialog')).to.exist;
    });
});
