import { expect, fixture, html } from '@open-wc/testing';
import '../../src/settings/mas-settings-table.js';
import { SettingsStore } from '../../src/settings/settings-store.js';

describe('MasSettingsTable', () => {
    const references = [
            {
                id: 'setting-show-addon',
                title: 'Show Addon',
                fieldName: 'entries',
                status: 'PUBLISHED',
                modified: { by: 'Mr Bean', at: '2025-10-16T11:14:00.000Z' },
                path: '/content/dam/mas/acom/settings/show-addon',
                tags: [{ id: 'mas:keyword/checkout', title: 'Checkout' }],
                fields: [
                    { name: 'name', values: ['showAddon'] },
                    { name: 'label', values: ['Show Addon'] },
                    { name: 'templates', values: [] },
                    { name: 'locales', values: [] },
                    { name: 'valuetype', values: ['boolean'] },
                    { name: 'textValue', values: [] },
                    { name: 'richTextValue', values: [] },
                    { name: 'booleanValue', values: [true] },
                ],
            },
            {
                id: 'setting-show-plan-type',
                title: 'Show Plan type',
                fieldName: 'entries',
                status: 'DRAFT',
                modified: { by: 'Mr Bean', at: '2025-10-14T09:11:00.000Z' },
                path: '/content/dam/mas/acom/settings/show-plan-type',
                tags: [],
                fields: [
                    { name: 'name', values: ['showPlanType'] },
                    { name: 'label', values: ['Show Plan type'] },
                    { name: 'templates', values: ['catalog', 'mini'] },
                    { name: 'locales', values: [] },
                    { name: 'valuetype', values: ['boolean'] },
                    { name: 'textValue', values: [] },
                    { name: 'richTextValue', values: [] },
                    { name: 'booleanValue', values: [true] },
                ],
            },
            {
                id: 'setting-show-secure-transaction',
                title: 'Show secure transaction',
                fieldName: 'entries',
                status: 'PUBLISHED',
                modified: { by: 'Mr Bean', at: '2025-10-14T09:11:00.000Z' },
                path: '/content/dam/mas/acom/settings/show-secure-transaction',
                tags: [],
                fields: [
                    { name: 'name', values: ['showSecureTransaction'] },
                    { name: 'label', values: ['Show secure transaction'] },
                    { name: 'templates', values: ['catalog', 'plans'] },
                    { name: 'locales', values: [] },
                    { name: 'valuetype', values: ['boolean'] },
                    { name: 'textValue', values: [] },
                    { name: 'richTextValue', values: [] },
                    { name: 'booleanValue', values: [true] },
                ],
            },
            {
                id: 'setting-show-badge',
                title: 'Show Badge',
                fieldName: 'entries',
                status: 'PUBLISHED',
                modified: { by: 'Mr Bean', at: '2025-10-13T09:11:00.000Z' },
                path: '/content/dam/mas/acom/settings/show-badge',
                tags: [],
                fields: [
                    { name: 'name', values: ['showBadge'] },
                    { name: 'label', values: ['Show badge'] },
                    { name: 'templates', values: ['catalog', 'plans', 'mini', 'ccd-slice', 'special-offers'] },
                    { name: 'locales', values: [] },
                    { name: 'valuetype', values: ['boolean'] },
                    { name: 'textValue', values: [] },
                    { name: 'richTextValue', values: [] },
                    { name: 'booleanValue', values: [true] },
                ],
            },
    ];

    const aem = {
        sites: {
            cf: {
                fragments: {
                    getByPath: async (path) => ({
                        id: 'settings-index',
                        path,
                        fields: [{ name: 'entries', values: references.map((reference) => reference.path) }],
                        references,
                    }),
                },
            },
        },
    };

    beforeEach(async () => {
        SettingsStore.destroy();
        SettingsStore.setAem(aem);
        await SettingsStore.loadSurface('acom');
    });

    afterEach(() => {
        SettingsStore.destroy();
        SettingsStore.setAem(null);
    });

    it('renders setting items from fragment references', async () => {
        const el = await fixture(html`<mas-settings-table></mas-settings-table>`);
        await el.updateComplete;
        const rows = el.shadowRoot.querySelectorAll('mas-setting-item');
        expect(rows.length).to.equal(4);
        const tableText = el.shadowRoot.textContent;
        expect(tableText).to.include('All templates selected');
        expect(tableText).to.include('5 templates selected');
        expect(tableText).to.include('Merch card (2 selected)');
    });

    it('expands row and renders override container', async () => {
        const el = await fixture(html`<mas-settings-table></mas-settings-table>`);
        await el.updateComplete;

        const expandButton = el.shadowRoot.querySelector('mas-setting-item .expand-button');
        expandButton.click();
        await el.updateComplete;

        const expandedContainer = el.shadowRoot.querySelector('.mas-setting-expanded');
        expect(expandedContainer).to.exist;
    });

    it('sorts rows by label when label header emits sorted event', async () => {
        const el = await fixture(html`<mas-settings-table></mas-settings-table>`);
        await el.updateComplete;

        const getLabels = () =>
            [...el.shadowRoot.querySelectorAll('mas-setting-item .setting-label')].map((element) => element.textContent.trim());

        expect(getLabels()).to.deep.equal(['Show Addon', 'Show Badge', 'Show Plan type', 'Show secure transaction']);

        const labelHeader = el.shadowRoot.querySelector('#label-header-cell');
        labelHeader.dispatchEvent(
            new CustomEvent('sorted', {
                detail: { sortKey: 'label', sortDirection: 'desc' },
            }),
        );
        await el.updateComplete;

        expect(getLabels()).to.deep.equal(['Show secure transaction', 'Show Plan type', 'Show Badge', 'Show Addon']);
    });

    it('keeps table visible and shows spinner while loading updates', async () => {
        const el = await fixture(html`<mas-settings-table></mas-settings-table>`);
        await el.updateComplete;

        SettingsStore.loading.set(true);
        await el.updateComplete;

        expect(el.shadowRoot.querySelector('#settings-table')).to.exist;
        expect(el.shadowRoot.querySelector('#loading-state')).to.exist;

        SettingsStore.loading.set(false);
        await el.updateComplete;
    });

    it('does not render delete action for top-level settings rows', async () => {
        const el = await fixture(html`<mas-settings-table></mas-settings-table>`);
        await el.updateComplete;

        const firstRow = el.shadowRoot.querySelector('mas-setting-item');
        const rowActions = [...firstRow.querySelectorAll('.actions-cell sp-menu-item')].map((item) => item.textContent.trim());

        expect(rowActions.some((action) => action.includes('Delete'))).to.equal(false);
    });

    it('renders unpublish action enabled for published settings', async () => {
        const el = await fixture(html`<mas-settings-table></mas-settings-table>`);
        await el.updateComplete;

        const publishedRow = [...el.shadowRoot.querySelectorAll('mas-setting-item')].find((row) =>
            row.querySelector('.setting-label')?.textContent?.trim() === 'Show Addon',
        );
        const actions = [...publishedRow.querySelectorAll('.actions-cell sp-menu-item')];
        const unpublish = actions[3];

        expect(unpublish).to.exist;
        expect(unpublish.hasAttribute('disabled')).to.equal(false);
    });

    it('renders unpublish action disabled for non-published settings', async () => {
        const el = await fixture(html`<mas-settings-table></mas-settings-table>`);
        await el.updateComplete;

        const draftRow = [...el.shadowRoot.querySelectorAll('mas-setting-item')].find((row) =>
            row.querySelector('.setting-label')?.textContent?.trim() === 'Show Plan type',
        );
        const actions = [...draftRow.querySelectorAll('.actions-cell sp-menu-item')];
        const unpublish = actions[3];

        expect(unpublish).to.exist;
        expect(unpublish.hasAttribute('disabled')).to.equal(true);
    });

    it('renders illustrated empty state when there are no settings', async () => {
        SettingsStore.destroy();
        SettingsStore.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async (path) => ({
                            id: 'settings-index',
                            path,
                            fields: [{ name: 'entries', values: [] }],
                            references: [],
                        }),
                    },
                },
            },
        });
        await SettingsStore.loadSurface('acom');

        const el = await fixture(html`<mas-settings-table></mas-settings-table>`);
        await el.updateComplete;

        const emptyState = el.shadowRoot.querySelector('#empty-state');
        expect(emptyState).to.exist;
        expect(emptyState.textContent).to.include('No settings created yet');
        expect(emptyState.textContent).to.include('Click the button above to begin creating a setting list.');
        expect(el.shadowRoot.querySelector('mas-setting-item')).to.not.exist;
    });
});
