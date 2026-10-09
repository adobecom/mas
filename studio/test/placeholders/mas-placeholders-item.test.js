import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import '../../src/placeholders/mas-placeholders-item.js';
import { MasPlaceholderReferencesModal } from '../../src/placeholders/mas-placeholder-references-modal.js';
import { STATUS_PUBLISHED } from '../../src/constants.js';

/**
 * Tests for MasPlaceholdersItem#onDelete and #onPublish
 *
 * Strategy
 * - The methods are invoked via `prototype.method.call(context, event)` with a lightweight
 *   fake `this`, so no Lit rendering / Store wiring is needed.
 * - `confirmPlaceholderReferences`, `removeFromIndexFragment` and `publishPlaceholder` are ES module
 *   imports and cannot be stubbed with sinon. The reference guard is therefore driven through its
 *   public seam: `MasPlaceholderReferencesModal.show` (static) is stubbed to simulate the user's
 *   choice, and `repository.aem` is a fake that returns "no references".
 */

const PLACEHOLDER_PATH = '/content/dam/mas/sandbox/en_US/dictionary/index/my-key';
const EVENT = { stopPropagation: () => {} };

const proto = customElements.get('mas-placeholders-item').prototype;

/** aem fake: every method resolves to an empty result set (i.e. "no references found"). */
function createAemStub() {
    const empty = async () => ({ items: [], data: [], cursor: null });
    return new Proxy(
        {},
        {
            get: (_target, prop) => (prop === 'then' ? undefined : sinon.spy(empty)),
        },
    );
}

function createContext({ status = 'DRAFT', aem = createAemStub() } = {}) {
    return {
        placeholder: { key: 'my-key', path: PLACEHOLDER_PATH, status },
        repository: {
            aem,
            deleteFragment: sinon.stub().resolves(),
        },
        updatePending: sinon.spy(),
        toggleDropdown: sinon.spy(),
    };
}

describe('MasPlaceholdersItem - onDelete / onPublish (reference guard)', () => {
    let showStub;
    let fetchStub;

    beforeEach(() => {
        // Default: user dismisses the modal.
        showStub = sinon.stub(MasPlaceholderReferencesModal, 'show').resolves({ confirmed: false });
        // Safety net: nothing in these tests may reach the network.
        fetchStub = sinon.stub(window, 'fetch').rejects(new Error('network disabled in unit test'));
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('onDelete', () => {
        it('marks the item as pending and closes the dropdown before running the check', async () => {
            const ctx = createContext();

            await proto.onDelete.call(ctx, EVENT);

            expect(ctx.updatePending.firstCall.args).to.deep.equal([true]);
            expect(ctx.toggleDropdown.calledOnceWith('my-key', EVENT)).to.be.true;
            expect(ctx.updatePending.calledBefore(showStub)).to.be.true;
        });

        it('does not delete anything and clears pending when the user cancels the modal', async () => {
            const ctx = createContext();
            showStub.resolves({ confirmed: false });

            await proto.onDelete.call(ctx, EVENT);

            expect(ctx.repository.deleteFragment.called).to.be.false;
            expect(fetchStub.called).to.be.false;
            expect(ctx.updatePending.lastCall.args).to.deep.equal([false]);
        });

        it('aborts without deleting and clears pending when the reference check fails', async () => {
            const failingAem = new Proxy(
                {},
                {
                    get: (_target, prop) => (prop === 'then' ? undefined : sinon.stub().rejects(new Error('boom'))),
                },
            );
            const ctx = createContext({ aem: failingAem });

            await proto.onDelete.call(ctx, EVENT);

            expect(ctx.repository.deleteFragment.called).to.be.false;
            expect(ctx.updatePending.lastCall.args).to.deep.equal([false]);
        });

        it('does not leave the item stuck in the pending state on any non-confirming path', async () => {
            const ctx = createContext();
            showStub.resolves({ confirmed: false });

            await proto.onDelete.call(ctx, EVENT);

            const calls = ctx.updatePending.getCalls().map((c) => c.args[0]);
            expect(calls[0]).to.equal(true);
            expect(calls[calls.length - 1]).to.equal(false);
        });
    });

    describe('onPublish', () => {
        it('returns immediately for an already published placeholder', async () => {
            const ctx = createContext({ status: STATUS_PUBLISHED });

            await proto.onPublish.call(ctx, EVENT);

            expect(ctx.toggleDropdown.called).to.be.false;
            expect(showStub.called).to.be.false;
            expect(fetchStub.called).to.be.false;
        });

        it('does not publish when the user cancels the modal', async () => {
            const ctx = createContext({ status: 'DRAFT' });
            showStub.resolves({ confirmed: false });

            const result = await proto.onPublish.call(ctx, EVENT);

            expect(result).to.be.undefined;
            expect(fetchStub.called).to.be.false;
        });

        it('does not publish when the reference check fails', async () => {
            const failingAem = new Proxy(
                {},
                {
                    get: (_target, prop) => (prop === 'then' ? undefined : sinon.stub().rejects(new Error('boom'))),
                },
            );
            const ctx = createContext({ status: 'DRAFT', aem: failingAem });

            await proto.onPublish.call(ctx, EVENT);

            expect(fetchStub.called).to.be.false;
        });
    });
});
