import { expect, fixture, fixtureSync, html, oneEvent, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import sinon from 'sinon';
import '../../src/swc.js';
import '../../src/references/mas-external-usage-dialog.js';
import Events from '../../src/events.js';

const usage = {
    available: true,
    updatedAt: '2026-09-17T12:00:00.000Z',
    pages: [
        { url: 'https://www.adobe.com/express/', requests: 900, countries: ['us', 'uk'], region: 'Global', locale: 'en_US' },
        {
            url: 'https://www.adobe.com/ca/creativecloud/business.html',
            requests: 120,
            countries: ['ca'],
            region: 'LATAM/Americas',
            locale: 'en_CA',
        },
        { url: 'https://www.adobe.com/express/business', requests: 40, countries: [], region: 'Global', locale: '' },
    ],
};

// Opening and closing the modal each run a Spectrum transition, which can take over a second on a
// loaded CI runner.
const modalTransition = { timeout: 5000 };
const wrapperOf = (element) => element.shadowRoot.querySelector('sp-dialog-wrapper');
const closeButtonOf = (element) =>
    wrapperOf(element).shadowRoot.querySelector('sp-dialog').shadowRoot.querySelector('.close-button');

async function openDialog(data = usage) {
    const element = await fixture(html`<mas-external-usage-dialog .usage=${data}></mas-external-usage-dialog>`);
    element.open = true;
    await element.updateComplete;
    await waitUntil(() => wrapperOf(element)?.matches(':focus-within'), 'Focus never moved into the dialog', modalTransition);
    return element;
}

async function closeFixture() {
    const overlay = document.querySelector('mas-external-usage-dialog')?.shadowRoot.querySelector('sp-overlay');
    if (!overlay?.open) return;
    const closed = oneEvent(overlay, 'sp-closed');
    overlay.open = false;
    await closed;
}

const pageLabels = (element) => [...element.shadowRoot.querySelectorAll('.page-url')].map((node) => node.textContent.trim());
const pageHrefs = (element) => [...element.shadowRoot.querySelectorAll('.page-url')].map((node) => node.getAttribute('href'));
const requestCounts = (element) =>
    [...element.shadowRoot.querySelectorAll('.page-requests')].map((node) => node.textContent.trim());
const headerCell = (element, index) => element.shadowRoot.querySelectorAll('sp-table-head-cell')[index];

describe('mas-external-usage-dialog', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(async () => {
        await closeFixture();
        sandbox.restore();
    });

    it('renders nothing while closed', async () => {
        const element = await fixture(
            html`<mas-external-usage-dialog .open=${false} .usage=${usage}></mas-external-usage-dialog>`,
        );
        expect(wrapperOf(element)).to.equal(null);
    });

    it('scrolls the row list instead of clipping it when the pages outrun the dialog', async () => {
        const many = Array.from({ length: 40 }, (unused, index) => ({
            url: `https://www.adobe.com/page-${index}`,
            requests: 100 - index,
            countries: ['us'],
            region: 'Global',
            locale: 'en_US',
        }));
        const element = await openDialog({ ...usage, pages: many });
        const body = element.shadowRoot.querySelector('sp-table-body');
        // The table must stay a flex column for the body to be height-bounded. When it is not, the
        // body grows to fit every row, scrollHeight equals clientHeight and nothing can scroll --
        // which is what sp-table-body checks before granting itself overflow:auto.
        expect(getComputedStyle(element.shadowRoot.querySelector('.dialog-table')).display).to.equal('flex');
        expect(body.scrollHeight).to.be.greaterThan(body.clientHeight);
    });

    it('lists every consuming page', async () => {
        const element = await openDialog();
        expect(pageLabels(element)).to.have.lengthOf(3);
    });

    it('makes each page url the link that opens it in a new tab', async () => {
        const element = await openDialog();
        expect(pageHrefs(element)).to.deep.equal([
            'https://www.adobe.com/express/',
            'https://www.adobe.com/ca/creativecloud/business.html',
            'https://www.adobe.com/express/business',
        ]);
        for (const link of element.shadowRoot.querySelectorAll('.page-url')) {
            expect(link.getAttribute('target')).to.equal('_blank');
        }
    });

    it('drops the host every row shares, which is the part that is never what tells them apart', async () => {
        const element = await openDialog();
        expect(pageLabels(element)).to.deep.equal(['/express/', '/ca/creativecloud/business.html', '/express/business']);
        expect(element.shadowRoot.querySelector('sp-table-head-cell').textContent).to.contain('www.adobe.com');
    });

    it('keeps whole urls when the rows span different hosts', async () => {
        const element = await openDialog({
            ...usage,
            pages: [
                { url: 'https://www.adobe.com/express/', requests: 5, countries: ['us'], region: 'Global', locale: '' },
                {
                    url: 'https://mwpw-1--mas--adobecom.aem.live/express/',
                    requests: 2,
                    countries: ['us'],
                    region: 'Global',
                    locale: '',
                },
            ],
        });
        expect(pageLabels(element)).to.deep.equal([
            'https://www.adobe.com/express/',
            'https://mwpw-1--mas--adobecom.aem.live/express/',
        ]);
    });

    it('still shows the whole url in the tooltip when the host is hidden', async () => {
        const element = await openDialog();
        expect(element.shadowRoot.querySelector('.page-url').getAttribute('title')).to.equal('https://www.adobe.com/express/');
    });

    it('keeps a copy action on every row', async () => {
        const element = await openDialog();
        expect(element.shadowRoot.querySelectorAll('.page-copy')).to.have.lengthOf(3);
    });

    it('confirms a copied page url with a toast', async () => {
        sandbox.stub(navigator.clipboard, 'writeText').resolves();
        const emit = sandbox.stub(Events.toast, 'emit');
        const element = await openDialog();

        element.shadowRoot.querySelector('.page-copy').click();

        await waitUntil(() => emit.called);
        expect(emit.firstCall.args[0].variant).to.equal('positive');
    });

    it('reports a failed copy with a toast instead of an unhandled rejection', async () => {
        sandbox.stub(navigator.clipboard, 'writeText').rejects(new DOMException('Write permission denied.', 'NotAllowedError'));
        const emit = sandbox.stub(Events.toast, 'emit');
        const element = await openDialog();

        element.shadowRoot.querySelector('.page-copy').click();

        await waitUntil(() => emit.called);
        expect(emit.firstCall.args[0].variant).to.equal('negative');
    });

    it('does not leak the Studio referrer to the opened page', async () => {
        const element = await openDialog();
        expect(element.shadowRoot.querySelector('.page-url').getAttribute('rel')).to.contain('noreferrer');
    });

    it('lists the countries each page was served to', async () => {
        const element = await openDialog();
        const countries = [...element.shadowRoot.querySelectorAll('.page-countries')].map((node) => node.textContent.trim());
        expect(countries).to.deep.equal(['us, uk', 'ca', '']);
    });

    it('labels a row with its locale, which is what tells two rows of one url apart', async () => {
        const element = await openDialog();
        const locales = [...element.shadowRoot.querySelectorAll('.page-locale')].map((node) => node.textContent.trim());
        expect(locales).to.deep.equal(['en_US', 'en_CA']);
    });

    it('keeps the rows of one url adjacent and in a stable order', async () => {
        const element = await openDialog({
            ...usage,
            pages: [
                { url: 'https://www.adobe.com/', requests: 5, countries: ['us'], region: 'Global', locale: 'en_US' },
                { url: 'https://www.adobe.com/', requests: 3, countries: ['uk'], region: 'EMEA', locale: 'en_GB' },
            ],
        });
        const locales = [...element.shadowRoot.querySelectorAll('.page-locale')].map((node) => node.textContent.trim());
        expect(locales).to.deep.equal(['en_US', 'en_GB']);
    });

    it('titles itself Related pages', async () => {
        const element = await openDialog();
        expect(wrapperOf(element).headline).to.equal('Related pages');
    });

    it('shows how many requests each page made', async () => {
        const element = await openDialog();
        expect(requestCounts(element)).to.deep.equal(['900', '120', '40']);
    });

    it('groups the thousands so large counts stay readable', async () => {
        const element = await openDialog({ ...usage, pages: [{ ...usage.pages[0], requests: 1234567 }] });
        expect(requestCounts(element)[0]).to.equal((1234567).toLocaleString());
    });

    it('opens on the busiest pages, which is the ranking the action already computed', async () => {
        const element = await openDialog();
        expect(pageHrefs(element)).to.deep.equal([
            'https://www.adobe.com/express/',
            'https://www.adobe.com/ca/creativecloud/business.html',
            'https://www.adobe.com/express/business',
        ]);
    });

    it('reverses to the quietest pages when the Requests header is toggled', async () => {
        const element = await openDialog();
        headerCell(element, 1).click();
        await element.updateComplete;
        expect(requestCounts(element)).to.deep.equal(['40', '120', '900']);
    });

    it('switches to an alphabetical page order when the Page header is picked', async () => {
        const element = await openDialog();
        headerCell(element, 0).click();
        await element.updateComplete;
        expect(pageHrefs(element)).to.deep.equal([
            'https://www.adobe.com/ca/creativecloud/business.html',
            'https://www.adobe.com/express/',
            'https://www.adobe.com/express/business',
        ]);
    });

    it('keeps equally busy pages in a stable order rather than letting them shuffle', async () => {
        const tied = [
            { url: 'https://www.adobe.com/b', requests: 10, countries: ['us'], region: 'Global', locale: 'en_US' },
            { url: 'https://www.adobe.com/a', requests: 10, countries: ['us'], region: 'Global', locale: 'en_US' },
        ];
        const element = await openDialog({ ...usage, pages: tied });
        expect(pageHrefs(element)).to.deep.equal(['https://www.adobe.com/a', 'https://www.adobe.com/b']);
    });

    it('marks only the active column as sorted, so one arrow shows at a time', async () => {
        const element = await openDialog();
        expect(headerCell(element, 0).getAttribute('sort-direction')).to.equal(null);
        expect(headerCell(element, 1).getAttribute('sort-direction')).to.equal('desc');
        headerCell(element, 0).click();
        await element.updateComplete;
        expect(headerCell(element, 0).getAttribute('sort-direction')).to.equal('asc');
        expect(headerCell(element, 1).getAttribute('sort-direction')).to.equal(null);
    });

    it('announces the active sort to screen readers', async () => {
        const element = await openDialog();
        await headerCell(element, 1).updateComplete;
        expect(headerCell(element, 1).getAttribute('aria-sort')).to.equal('descending');
        headerCell(element, 1).click();
        await element.updateComplete;
        await headerCell(element, 1).updateComplete;
        expect(headerCell(element, 1).getAttribute('aria-sort')).to.equal('ascending');
    });

    it('still omits the aggregate traffic panel, which stayed out of scope', async () => {
        const element = await openDialog();
        expect(element.shadowRoot.querySelector('.usage-summary')).to.equal(null);
    });

    it('explains traffic that has no attributable page rather than looking broken', async () => {
        const element = await openDialog({ ...usage, pages: [] });
        expect(element.shadowRoot.querySelector('.usage-placeholder').textContent).to.contain('no referer');
    });

    it('reports unavailable data instead of rendering an empty table', async () => {
        const element = await openDialog({ available: false });
        expect(element.shadowRoot.querySelector('.usage-placeholder').textContent).to.contain('unavailable');
    });

    it('shows how fresh the data is', async () => {
        const element = await openDialog();
        expect(element.shadowRoot.querySelector('.usage-freshness').textContent).to.contain('Updated');
    });

    it('tells the author the counts are a bounded sample rather than a complete total', async () => {
        const element = await openDialog();
        expect(element.shadowRoot.querySelector('.usage-note').textContent).to.contain('bounded sample');
    });

    it('omits the bounded-sample note when there is no data to qualify', async () => {
        const element = await openDialog({ available: false });
        expect(element.shadowRoot.querySelector('.usage-note')).to.equal(null);
    });

    it('emits close when the close button is pressed', async () => {
        const element = await openDialog();
        let closed = false;
        element.addEventListener('close', () => {
            closed = true;
        });
        closeButtonOf(element).click();
        await waitUntil(() => closed, 'Close button did not emit close', modalTransition);
        expect(closed).to.equal(true);
    });

    it('emits close when the underlay is clicked', async () => {
        const element = await openDialog();
        let closed = false;
        element.addEventListener('close', () => {
            closed = true;
        });
        // sp-underlay turns a real pointer press into its own close event; it never emits click.
        const underlay = wrapperOf(element).shadowRoot.querySelector('sp-underlay');
        underlay.dispatchEvent(new PointerEvent('pointerdown'));
        underlay.dispatchEvent(new PointerEvent('pointerup'));
        await waitUntil(() => closed, 'Underlay did not emit close', modalTransition);
        expect(closed).to.equal(true);
    });

    it('restores opener focus after Escape closes the related pages dialog', async () => {
        const host = fixtureSync(html`
            <div>
                <button>View related pages</button>
                <mas-external-usage-dialog .usage=${usage}></mas-external-usage-dialog>
            </div>
        `);
        const opener = host.querySelector('button');
        const dialog = host.querySelector('mas-external-usage-dialog');
        dialog.addEventListener('close', (event) => {
            event.currentTarget.open = false;
        });
        opener.focus();
        dialog.open = true;
        await dialog.updateComplete;
        await waitUntil(
            () => wrapperOf(dialog)?.matches(':focus-within'),
            'Focus never moved into the dialog',
            modalTransition,
        );

        await sendKeys({ press: 'Escape' });

        await waitUntil(() => !dialog.open, 'Escape did not close the dialog', modalTransition);
        await waitUntil(() => document.activeElement === opener, 'Focus did not return to the opener', modalTransition);
    });

    it('resets the sort order each time it reopens', async () => {
        const element = await openDialog();
        headerCell(element, 0).click();
        await element.updateComplete;
        element.open = false;
        await element.updateComplete;
        element.open = true;
        await element.updateComplete;
        expect(element.sortColumn).to.equal('requests');
        expect(element.sortDirection).to.equal('desc');
    });
});
