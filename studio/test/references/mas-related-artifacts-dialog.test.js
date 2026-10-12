import { fixture, fixtureSync, html, expect, waitUntil, oneEvent } from '@open-wc/testing';
// Registers the real sp-* components: against unregistered stubs the underlay and scroll contracts
// below silently pass no matter what the dialog binds.
import { sendKeys } from '@web/test-runner-commands';
import '../../src/swc.js';
import '../../src/references/mas-related-artifacts-dialog.js';

const collRow = (title, id) => ({
    title,
    path: `/content/dam/mas/acom/en_US/${id}`,
    link: `https://mas.adobe.com/studio.html#content-type=merch-card-collection&query=${id}`,
});

// Only collections + bulk-publish carry rows here; promo/translation are intentionally empty.
const buckets = () => [
    { key: 'collections', label: 'Collections', rows: [collRow('Zeta', 'c-z'), collRow('Alpha', 'c-a')] },
    { key: 'bulkPublishProjects', label: 'Bulk Publish Project', rows: [collRow('Launch', 'b-1')] },
];

const wrapperOf = (el) => el.shadowRoot.querySelector('sp-dialog-wrapper');
const closeButtonOf = (el) => wrapperOf(el).shadowRoot.querySelector('sp-dialog').shadowRoot.querySelector('.close-button');
const headCellOf = (el) => el.shadowRoot.querySelector('sp-table-head-cell');

const openDialog = async (bucketData = buckets()) => {
    const el = await fixture(html`<mas-related-artifacts-dialog></mas-related-artifacts-dialog>`);
    el.buckets = bucketData;
    el.open = true;
    await el.updateComplete;
    await waitUntil(() => wrapperOf(el)?.matches(':focus-within'));
    return el;
};

const closeFixture = async () => {
    const overlay = document.querySelector('mas-related-artifacts-dialog')?.shadowRoot.querySelector('sp-overlay');
    if (!overlay?.open) return;
    const closed = oneEvent(overlay, 'sp-closed');
    overlay.open = false;
    await closed;
};

describe('mas-related-artifacts-dialog', () => {
    afterEach(closeFixture);
    it('closes when the underlay is clicked', async () => {
        const el = await openDialog();
        let closed = false;
        el.addEventListener('close', () => {
            closed = true;
        });
        // sp-underlay turns a real pointer press into its own close event; it never emits click.
        const underlay = wrapperOf(el).shadowRoot.querySelector('sp-underlay');
        underlay.dispatchEvent(new PointerEvent('pointerdown'));
        underlay.dispatchEvent(new PointerEvent('pointerup'));
        await waitUntil(() => closed);
        expect(closed).to.equal(true);
    });

    it('scrolls the rows instead of clipping them when a tab outruns the dialog', async () => {
        const many = Array.from({ length: 40 }, (unused, index) => collRow(`Row ${index}`, `c-${index}`));
        const el = await openDialog([{ key: 'collections', label: 'Collections', rows: many }]);
        const body = el.shadowRoot.querySelector('sp-table-body');
        // The table must stay a flex column for the body to be height-bounded. When it is not, the
        // body grows to fit every row, scrollHeight equals clientHeight and nothing can scroll --
        // which is what sp-table-body checks before granting itself overflow:auto.
        expect(getComputedStyle(el.shadowRoot.querySelector('.dialog-table')).display).to.equal('flex');
        expect(body.scrollHeight).to.be.greaterThan(body.clientHeight);
    });

    it('renders nothing while closed', async () => {
        const el = await fixture(html`<mas-related-artifacts-dialog></mas-related-artifacts-dialog>`);
        el.buckets = buckets();
        await el.updateComplete;
        expect(wrapperOf(el)).to.equal(null);
    });

    it('frames the content in a Spectrum dialog wrapper with a headline', async () => {
        const el = await openDialog();
        expect(wrapperOf(el).headline).to.equal('Related studio artifacts');
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
        headCellOf(el).click();
        await el.updateComplete;
        const titles = [...el.shadowRoot.querySelectorAll('.artifact-link')].map((a) => a.textContent.trim());
        expect(titles).to.deep.equal(['Zeta', 'Alpha']);
    });

    it('announces an ascending sort on the Page header when opened', async () => {
        const el = await openDialog();
        expect(headCellOf(el).getAttribute('sort-direction')).to.equal('asc');
        expect(headCellOf(el).getAttribute('aria-sort')).to.equal('ascending');
    });

    it('announces a descending sort on the Page header after it is clicked', async () => {
        const el = await openDialog();
        headCellOf(el).click();
        await el.updateComplete;
        await headCellOf(el).updateComplete;
        expect(headCellOf(el).getAttribute('sort-direction')).to.equal('desc');
        expect(headCellOf(el).getAttribute('aria-sort')).to.equal('descending');
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
        closeButtonOf(el).click();
        await waitUntil(() => closed);
        expect(closed).to.equal(true);
    });
});

describe('related artifacts modal keyboard lifecycle', () => {
    afterEach(closeFixture);
    let dialog;
    let opener;

    beforeEach(async () => {
        const host = fixtureSync(html`
            <div>
                <button>View artifacts</button>
                <mas-related-artifacts-dialog></mas-related-artifacts-dialog>
            </div>
        `);
        opener = host.querySelector('button');
        dialog = host.querySelector('mas-related-artifacts-dialog');
        dialog.buckets = buckets();
        dialog.addEventListener('close', (event) => {
            event.currentTarget.open = false;
        });
        opener.addEventListener('click', () => {
            dialog.open = true;
        });
        opener.focus();
        opener.click();
        await dialog.updateComplete;
        await waitUntil(() => wrapperOf(dialog)?.matches(':focus-within'));
    });

    it('moves focus from the opener into the dialog', async () => {
        await waitUntil(() => document.activeElement === dialog, 'Opening must move focus into the modal');
        expect(wrapperOf(dialog).matches(':focus-within')).to.equal(true);
    });

    it('keeps Tab inside the dialog after the last link', async () => {
        const links = dialog.shadowRoot.querySelectorAll('.artifact-link');
        links[links.length - 1].focus();
        await sendKeys({ press: 'Tab' });
        expect(wrapperOf(dialog).matches(':focus-within')).to.equal(true);
    });

    it('dismisses on Escape and restores focus to the opener', async () => {
        closeButtonOf(dialog).focus();
        await sendKeys({ press: 'Escape' });
        await waitUntil(() => !dialog.open, 'Escape must close the modal');
        await waitUntil(() => document.activeElement === opener, 'Closing must restore focus to the opener');
    });
});
