import { fixture, html, expect } from '@open-wc/testing';
import '../../src/references/mas-related-artifacts-dialog.js';

const collRow = (title, id) => ({
    groupKey: id,
    title,
    representative: {
        id,
        path: `/content/dam/mas/acom/en_US/${id}`,
        status: 'PUBLISHED',
        link: `https://mas.adobe.com/studio.html#content-type=merch-card-collection&query=${id}`,
    },
    locales: ['en_US'],
    localeCount: 1,
});

// Only collections + bulk-publish carry rows here; promo/translation are intentionally empty.
const buckets = () => [
    { key: 'collections', label: 'Collections', rows: [collRow('Zeta', 'c-z'), collRow('Alpha', 'c-a')] },
    { key: 'bulkPublishProjects', label: 'Bulk Publish Project', rows: [collRow('Launch', 'b-1')] },
];

const openDialog = async (bucketData = buckets()) => {
    const el = await fixture(html`<mas-related-artifacts-dialog></mas-related-artifacts-dialog>`);
    el.buckets = bucketData;
    el.open = true;
    await el.updateComplete;
    return el;
};

describe('mas-related-artifacts-dialog', () => {
    it('renders nothing while closed', async () => {
        const el = await fixture(html`<mas-related-artifacts-dialog></mas-related-artifacts-dialog>`);
        el.buckets = buckets();
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-dialog')).to.equal(null);
        expect(el.shadowRoot.querySelector('sp-underlay')).to.equal(null);
    });

    it('renders one tab per artifact type in order', async () => {
        const el = await openDialog();
        const labels = [...el.shadowRoot.querySelectorAll('sp-tab')].map((tab) => tab.getAttribute('value'));
        expect(labels).to.deep.equal(['collections', 'bulkPublishProjects', 'promoProjects', 'localizationProjects']);
    });

    it('opens on the first type that has rows, sorted ascending by title with deep links', async () => {
        const el = await openDialog();
        expect(el.selectedTab).to.equal('collections');
        const links = [...el.shadowRoot.querySelectorAll('.artifact-link')];
        expect(links.map((a) => a.textContent.trim())).to.deep.equal(['Alpha', 'Zeta']);
        expect(links[0].getAttribute('href')).to.include('c-a');
        expect(links[0].getAttribute('target')).to.equal('_blank');
    });

    it('reverses the row order when the Page header is clicked', async () => {
        const el = await openDialog();
        el.shadowRoot.querySelector('sp-table-head-cell').click();
        await el.updateComplete;
        expect(el.sortDirection).to.equal('desc');
        const titles = [...el.shadowRoot.querySelectorAll('.artifact-link')].map((a) => a.textContent.trim());
        expect(titles).to.deep.equal(['Zeta', 'Alpha']);
    });

    it('shows an empty message for a type with no references', async () => {
        const el = await openDialog();
        el.selectedTab = 'promoProjects';
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.empty-tab-message').textContent).to.include('No Promo Project references');
        expect(el.shadowRoot.querySelector('.artifact-link')).to.equal(null);
    });

    it('dispatches a close event when the close button is clicked', async () => {
        const el = await openDialog();
        let closed = false;
        el.addEventListener('close', () => {
            closed = true;
        });
        el.shadowRoot.querySelector('.dialog-close').click();
        expect(closed).to.equal(true);
    });
});
