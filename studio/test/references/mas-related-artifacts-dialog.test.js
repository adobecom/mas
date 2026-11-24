import { aTimeout, fixture, fixtureSync, html, expect, waitUntil, oneEvent } from '@open-wc/testing';
// Registers the real sp-* components: against unregistered stubs the underlay and scroll contracts
// below silently pass no matter what the dialog binds.
import { sendKeys, setViewport } from '@web/test-runner-commands';
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

// Opening and closing the modal each run a Spectrum transition. On the CI runner (run 41587889767)
// one open plus one close outlasted mocha's 5000ms, so each wait gets 8s inside a 20s suite limit and
// a slow step fails with its own message instead of a generic mocha timeout.
const modalTransition = { timeout: 8000 };
const wrapperOf = (el) => el.shadowRoot.querySelector('sp-dialog-wrapper');
const closeButtonOf = (el) => wrapperOf(el).shadowRoot.querySelector('sp-dialog').shadowRoot.querySelector('.close-button');
const headCellOf = (el) => el.shadowRoot.querySelector('sp-table-head-cell');

const openDialog = async (bucketData = buckets()) => {
    const el = await fixture(html`<mas-related-artifacts-dialog></mas-related-artifacts-dialog>`);
    el.buckets = bucketData;
    el.open = true;
    await el.updateComplete;
    await waitUntil(() => wrapperOf(el)?.matches(':focus-within'), 'Focus never moved into the dialog', modalTransition);
    return el;
};

const closeFixture = async () => {
    const overlay = document.querySelector('mas-related-artifacts-dialog')?.shadowRoot.querySelector('sp-overlay');
    if (!overlay?.open) return;
    const closed = oneEvent(overlay, 'sp-closed');
    overlay.open = false;
    // sp-closed waits on animation frames, which a starved CI runner can withhold past the hook
    // timeout. The fixture teardown that follows disconnects the overlay either way.
    await Promise.race([closed, aTimeout(1000)]);
};

describe('mas-related-artifacts-dialog', function () {
    this.timeout(20000);
    afterEach(closeFixture);
    it('renders an underlay behind the dialog', async () => {
        const el = await openDialog();
        expect(wrapperOf(el).shadowRoot.querySelector('sp-underlay')).to.exist;
    });

    it('renders a close button', async () => {
        const el = await openDialog();
        expect(closeButtonOf(el)).to.exist;
    });

    it('dispatches close when its overlay closes', async () => {
        const el = await openDialog();
        let closed = false;
        el.addEventListener('close', () => {
            closed = true;
        });
        el.shadowRoot.querySelector('sp-overlay').dispatchEvent(new Event('sp-closed'));
        expect(closed).to.equal(true);
    });

    it('ignores sp-closed bubbling up from inside the dialog', async () => {
        const el = await openDialog();
        let closed = false;
        el.addEventListener('close', () => {
            closed = true;
        });
        wrapperOf(el).dispatchEvent(new Event('sp-closed', { bubbles: true }));
        expect(closed).to.equal(false);
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
});

describe('mas-related-artifacts-dialog restyle', function () {
    this.timeout(20000);
    afterEach(closeFixture);

    // Resolves a color expression through a probe in the same shadow root so tokens and fallbacks behave alike.
    const resolveColor = (el, expression) => {
        const probe = document.createElement('div');
        probe.style.color = expression;
        el.shadowRoot.append(probe);
        const { color } = getComputedStyle(probe);
        probe.remove();
        return color;
    };

    const centerY = (rect) => rect.top + rect.height / 2;

    it('frames the table in a 1px rounded border with no divider under the tabs', async () => {
        const el = await openDialog();
        const wrapper = getComputedStyle(el.shadowRoot.querySelector('.table-wrapper'));
        expect(wrapper.marginTop).to.equal('20px');
        expect(wrapper.borderTopWidth).to.equal('1px');
        expect(wrapper.borderTopStyle).to.equal('solid');
        expect(wrapper.borderTopColor).to.equal(resolveColor(el, 'var(--spectrum-gray-300, #dadada)'));
        expect(wrapper.borderTopLeftRadius).to.equal('12px');
        expect(wrapper.overflow).to.equal('hidden');
        expect(el.shadowRoot.querySelector('sp-divider')).to.equal(null);
    });

    it('centers the header label in a 44px gray band', async () => {
        const el = await openDialog();
        const cell = headCellOf(el);
        const style = getComputedStyle(cell);
        expect(style.display).to.equal('flex');
        expect(style.alignItems).to.equal('center');
        expect(style.height).to.equal('44px');
        expect(style.paddingLeft).to.equal('20px');
        expect(style.backgroundColor).to.equal(resolveColor(el, 'var(--spectrum-gray-75, #f3f3f3)'));
        expect(style.color).to.equal(resolveColor(el, 'var(--spectrum-gray-900, #222)'));
        expect(style.fontWeight).to.equal('700');
    });

    it('centers the link in a white body cell at least 68px tall', async () => {
        const el = await openDialog();
        const cell = el.shadowRoot.querySelector('sp-table-cell');
        const style = getComputedStyle(cell);
        expect(style.display).to.equal('flex');
        expect(style.alignItems).to.equal('center');
        expect(style.backgroundColor).to.equal(resolveColor(el, 'var(--spectrum-white, #fff)'));
        expect(style.borderTopWidth).to.equal('1px');
        expect(cell.getBoundingClientRect().height).to.be.at.least(68);
        const link = cell.querySelector('.artifact-link');
        expect(Math.abs(centerY(link.getBoundingClientRect()) - centerY(cell.getBoundingClientRect()))).to.be.below(1.5);
    });

    it('styles links blue, underlined and medium weight', async () => {
        const el = await openDialog();
        const link = el.shadowRoot.querySelector('.artifact-link');
        const style = getComputedStyle(link);
        expect(style.color).to.equal(resolveColor(el, 'var(--spectrum-blue-900, #3b63fb)'));
        expect(style.textDecorationLine).to.include('underline');
        expect(style.fontWeight).to.equal('500');
        expect(style.fontSize).to.equal('14px');
        expect(style.columnGap).to.equal('6px');
        expect(link.getAttribute('rel')).to.equal('noopener');
        expect(link.querySelector('sp-icon-open-in')).to.exist;
    });

    const longTitle = 'Very long artifact name '.repeat(9).trim();
    const longRows = () => [{ key: 'collections', label: 'Collections', rows: [collRow(longTitle, 'c-long')] }];

    it('table wrapper height equals header plus rows when rows fit', async () => {
        // 8 rows of 68px plus the header only fit inside the 60vh dialog content on a tall viewport.
        await setViewport({ width: 1280, height: 1400 });
        const rows = Array.from({ length: 8 }, (unused, index) => collRow(`Row ${index}`, `c-${index}`));
        const el = await openDialog([{ key: 'collections', label: 'Collections', rows }]);
        const wrapperRect = el.shadowRoot.querySelector('.table-wrapper').getBoundingClientRect();
        const headHeight = el.shadowRoot.querySelector('sp-table-head').getBoundingClientRect().height;
        const rowsHeight = [...el.shadowRoot.querySelectorAll('sp-table-row')].reduce(
            (sum, row) => sum + row.getBoundingClientRect().height,
            0,
        );
        expect(Math.abs(wrapperRect.height - (headHeight + rowsHeight + 2))).to.be.at.most(1);
        const contentRect = el.shadowRoot.querySelector('.dialog-content').getBoundingClientRect();
        expect(wrapperRect.bottom).to.be.below(contentRect.bottom);
    });

    it('long artifact name renders on one line with ellipsis', async () => {
        const el = await openDialog(longRows());
        const label = el.shadowRoot.querySelector('.artifact-label');
        const style = getComputedStyle(label);
        expect(style.minWidth).to.equal('0px');
        expect(style.overflow).to.equal('hidden');
        expect(style.textOverflow).to.equal('ellipsis');
        expect(style.whiteSpace).to.equal('nowrap');
        expect(label.getBoundingClientRect().height).to.be.below(36);
        expect(label.scrollWidth).to.be.greaterThan(label.clientWidth);
    });

    it('open-in icon is visible right after the label with a 6px gap', async () => {
        const el = await openDialog(longRows());
        const cell = el.shadowRoot.querySelector('sp-table-cell');
        const link = cell.querySelector('.artifact-link');
        const label = link.querySelector('.artifact-label').getBoundingClientRect();
        const icon = link.querySelector('sp-icon-open-in').getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        const cellRect = cell.getBoundingClientRect();
        const cellPaddingRight = parseFloat(getComputedStyle(cell).paddingRight);
        expect(icon.width).to.be.greaterThan(0);
        expect(icon.left).to.be.at.least(linkRect.left);
        expect(icon.right).to.be.at.most(linkRect.right + 0.5);
        expect(Math.abs(icon.left - label.right - 6)).to.be.at.most(1);
        expect(icon.right).to.be.at.most(cellRect.right - cellPaddingRight + 0.5);
    });

    it('artifact link title equals the full artifact name', async () => {
        const el = await openDialog(longRows());
        expect(el.shadowRoot.querySelector('.artifact-link').getAttribute('title')).to.equal(longTitle);
    });

    it('rows stay at least 68px with a long name', async () => {
        const el = await openDialog(longRows());
        const cell = el.shadowRoot.querySelector('sp-table-cell');
        const style = getComputedStyle(cell);
        expect(el.shadowRoot.querySelector('sp-table-row').getBoundingClientRect().height).to.be.at.least(68);
        expect(cell.getBoundingClientRect().height).to.be.at.least(68);
        expect(style.paddingTop).to.equal('16px');
        expect(style.paddingBottom).to.equal('16px');
        expect(style.paddingLeft).to.equal('20px');
        expect(style.paddingRight).to.equal('20px');
    });

    it('dialog is 500px wide with 20px padding, 16px radius and 22px title', async () => {
        const el = await openDialog();
        const dialog = wrapperOf(el).shadowRoot.querySelector('sp-dialog');
        const frame = getComputedStyle(wrapperOf(el).shadowRoot.querySelector('.modal'));
        expect(getComputedStyle(dialog).width).to.equal('500px');
        expect(frame.borderTopLeftRadius).to.equal('16px');
        // Spectrum draws the dialog padding as the first and last grid tracks, not as CSS padding.
        const tracks = getComputedStyle(dialog.shadowRoot.querySelector('.grid'))
            .gridTemplateColumns.replace(/\[[^\]]*\]/g, '')
            .trim()
            .split(/\s+/);
        expect(tracks[0]).to.equal('20px');
        const heading = getComputedStyle(dialog.querySelector('[slot=heading]'));
        expect(heading.fontSize).to.equal('22px');
        expect(heading.lineHeight).to.equal('26px');
        expect(heading.fontWeight).to.equal('700');
    });
});

describe('related artifacts modal keyboard lifecycle', function () {
    this.timeout(20000);
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
        await waitUntil(
            () => wrapperOf(dialog)?.matches(':focus-within'),
            'Focus never moved into the dialog',
            modalTransition,
        );
    });

    it('moves focus from the opener into the dialog', async () => {
        await waitUntil(() => document.activeElement === dialog, 'Opening must move focus into the modal', modalTransition);
        expect(wrapperOf(dialog).matches(':focus-within')).to.equal(true);
    });

    it('keeps Tab inside the dialog after the last link', async () => {
        const links = dialog.shadowRoot.querySelectorAll('.artifact-link');
        links[links.length - 1].focus();
        await sendKeys({ press: 'Tab' });
        expect(wrapperOf(dialog).matches(':focus-within')).to.equal(true);
    });
});
