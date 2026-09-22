import { expect } from '@esm-bundle/chai';
import { elementUpdated } from '@open-wc/testing-helpers';
import sinon from 'sinon';
import Events from '../../src/events.js';
import Store from '../../src/store.js';
import { Placeholder } from '../../src/aem/placeholder.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import '../../src/placeholders/mas-placeholders.js';

const PLACEHOLDER_IDS = [
    '9a75e22f-9c48-418d-8da3-687e8f635282',
    '652722a1-b1d7-415f-9c3f-e88d3b3f7333',
    'b8bb460d-cf4d-47e7-b03f-a1117dd1628e',
];

function makePlaceholderStore(id, key, value, path = `/content/dam/mas/sandbox/en_US/dictionary/${key}`) {
    return new FragmentStore(
        new Placeholder({
            id,
            path,
            fields: [
                { name: 'key', values: [key] },
                { name: 'value', values: [value] },
                { name: 'richTextValue', values: [] },
            ],
        }),
    );
}

describe('mas-placeholders copy links', () => {
    let element;
    let clipboardWrite;
    let toastStub;

    beforeEach(async () => {
        Store.profile.set(null);
        Store.search.set({ path: 'sandbox' });
        Store.filters.set({ locale: 'en_US' });
        Store.sort.set({ sortBy: 'key', sortDirection: 'asc' });
        Store.placeholders.list.loading.set(false);
        Store.placeholders.selection.set([]);
        Store.placeholders.search.set('');
        Store.placeholders.list.data.set([
            makePlaceholderStore(PLACEHOLDER_IDS[0], 'first', 'First'),
            makePlaceholderStore(PLACEHOLDER_IDS[1], 'second', 'Second'),
        ]);
        clipboardWrite = sinon.stub().resolves();
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: clipboardWrite },
            configurable: true,
        });
        toastStub = sinon.stub(Events.toast, 'emit');
        element = document.createElement('mas-placeholders');
        document.body.append(element);
        await elementUpdated(element);
    });

    afterEach(() => {
        element.remove();
        sinon.restore();
    });

    it('copies one UUID link for a single selection', async () => {
        await element.handleCopyStudioLinks(['first']);

        expect(clipboardWrite.calledOnce).to.be.true;
        expect(clipboardWrite.firstCall.args[0]).to.equal(
            `${window.location.origin}/studio.html#content-type=placeholder&page=placeholders&path=sandbox&locale=en_US&search=${PLACEHOLDER_IDS[0]}`,
        );
    });

    it('shows a negative toast and does not copy when a selected key is no longer loaded', async () => {
        await element.handleCopyStudioLinks(['first', 'missing']);

        expect(clipboardWrite.called).to.be.false;
        expect(
            toastStub.calledWith(
                sinon.match({ variant: 'negative', content: 'Selection is out of date. Reselect and try again.' }),
            ),
        ).to.be.true;
    });

    it('shows a negative toast and does not copy when a selected record is under a different locale/surface folder', async () => {
        Store.placeholders.list.data.set([
            makePlaceholderStore(PLACEHOLDER_IDS[0], 'first', 'First', '/content/dam/mas/sandbox/fr_FR/dictionary/first'),
        ]);

        await element.handleCopyStudioLinks(['first']);

        expect(clipboardWrite.called).to.be.false;
        expect(
            toastStub.calledWith(
                sinon.match({ variant: 'negative', content: 'Selection is out of date. Reselect and try again.' }),
            ),
        ).to.be.true;
    });

    it('copies newline-separated UUID links without a trailing newline', async () => {
        await element.handleCopyStudioLinks(['first', 'second']);

        const copied = clipboardWrite.firstCall.args[0];
        expect(copied.split('\n')).to.have.lengthOf(2);
        expect(copied).to.include(`search=${PLACEHOLDER_IDS[0]}`);
        expect(copied).to.include(`search=${PLACEHOLDER_IDS[1]}`);
        expect(copied.endsWith('\n')).to.be.false;
    });

    it('shows a negative toast when the clipboard write is rejected', async () => {
        clipboardWrite.rejects(new Error('Permission denied'));
        sinon.stub(console, 'error');

        await element.handleCopyStudioLinks(['first']);

        expect(toastStub.calledWith(sinon.match({ variant: 'negative' }))).to.be.true;
    });

    it('does nothing for an empty selection', async () => {
        await element.handleCopyStudioLinks([]);

        expect(clipboardWrite.called).to.be.false;
        expect(toastStub.called).to.be.false;
    });

    it('uses the bulk-copy handler for the row-menu Copy Link action', async () => {
        const item = element.shadowRoot.querySelector('mas-placeholders-item');
        item.activeDropdown = true;
        await elementUpdated(item);

        const copyItem = [...item.querySelectorAll('.dropdown-item')].find((menuItem) =>
            menuItem.textContent.includes('Copy Link'),
        );
        copyItem.click();

        expect(clipboardWrite.calledOnce).to.be.true;
        expect(clipboardWrite.firstCall.args[0]).to.include(`search=${PLACEHOLDER_IDS[0]}`);
    });
});

describe('mas-placeholders search', () => {
    let element;

    beforeEach(() => {
        Store.sort.set({ sortBy: 'key', sortDirection: 'asc' });
        Store.placeholders.selection.set([]);
        element = document.createElement('mas-placeholders');
    });

    afterEach(() => {
        element.remove();
        Store.placeholders.search.set('');
        Store.placeholders.list.data.set([]);
    });

    it('matches a UUID search term to exactly one placeholder id', () => {
        Store.placeholders.list.data.set([
            makePlaceholderStore(PLACEHOLDER_IDS[0], 'abm-first', 'shared'),
            makePlaceholderStore(PLACEHOLDER_IDS[1], 'abm-second', PLACEHOLDER_IDS[0]),
        ]);
        Store.placeholders.search.set(PLACEHOLDER_IDS[0]);

        element.sortAndFilter();

        expect(element.internalPlaceholders.map((store) => store.get().id)).to.deep.equal([PLACEHOLDER_IDS[0]]);
    });

    it('keeps substring matching keys and values for plain-text searches', () => {
        Store.placeholders.list.data.set([
            makePlaceholderStore(PLACEHOLDER_IDS[0], 'abm-key', 'other'),
            makePlaceholderStore(PLACEHOLDER_IDS[1], 'other-key', 'contains ABM value'),
            makePlaceholderStore(PLACEHOLDER_IDS[2], 'unrelated', 'other'),
        ]);
        Store.placeholders.search.set('abm');

        element.sortAndFilter();

        expect(element.internalPlaceholders.map((store) => store.get().id)).to.deep.equal([
            PLACEHOLDER_IDS[0],
            PLACEHOLDER_IDS[1],
        ]);
    });
});
