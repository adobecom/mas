import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';

/**
 * Product cards render before the follow-up model turn resolves, so the user
 * can answer the step while that turn is still in flight. Nothing used to tie
 * the two together: the stale turn landed afterwards, re-rendered the product
 * list the user had already moved past, rewound the conversation history to
 * before the click, and cleared the spinner belonging to the live turn.
 */
const RAW = [
    {
        arrangement_code: 'phsp_direct_individual',
        product_code: 'PHSP',
        name: 'Photoshop',
        copy: { name: 'Adobe Photoshop' },
        assets: { icons: { svg: 'https://example.com/phsp.svg' } },
    },
    {
        arrangement_code: 'illu_direct_individual',
        product_code: 'ILLU',
        name: 'Illustrator',
        copy: { name: 'Adobe Illustrator' },
        assets: { icons: { svg: 'https://example.com/illu.svg' } },
    },
];

const STALE_CARDS = [
    { label: 'Adobe Photoshop', value: 'phsp_direct_individual', arrangement_code: 'phsp_direct_individual' },
    { label: 'Adobe Illustrator', value: 'illu_direct_individual', arrangement_code: 'illu_direct_individual' },
];

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Waiting a fixed number of macrotasks makes a result depend on how loaded the
 * machine is. Wait for the condition the assertion actually needs instead.
 */
const until = async (predicate, what) => {
    const deadline = Date.now() + 2000;
    while (!predicate()) {
        if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
        await tick();
    }
};

const deferred = () => {
    let resolve;
    const promise = new Promise((res) => {
        resolve = res;
    });
    return { promise, resolve };
};

const cardMessages = (el) => el.messages.filter((m) => m.productCards?.length);

const pickPhotoshop = (el) =>
    el.handleButtonSelected({
        detail: {
            value: 'phsp_direct_individual',
            label: 'Adobe Photoshop',
            product: { arrangement_code: 'phsp_direct_individual', name: 'Adobe Photoshop' },
        },
    });

describe('MasChat drops a turn the user has superseded', () => {
    let el;
    let calls;
    let turn;

    beforeEach(async () => {
        localStorage.removeItem('mas-chat-sessions');
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        calls = [];
        turn = (index) => until(() => calls.length > index, `chat request ${index}`).then(() => calls[index]);
        // Title and feedback posts are not conversation turns; keeping them out
        // of `calls` keeps the indexes below pointing at the turns under test.
        sinon.stub(el, 'callAIChatAction').callsFake((params) => {
            if (params?.requestType) return Promise.resolve({});
            const next = deferred();
            calls.push(next);
            return next.promise;
        });
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
        // Sessions persist to localStorage, which is shared with every other
        // test file's page. Leaving this file's product-card messages behind
        // makes them the starting transcript of whatever runs next.
        localStorage.removeItem('mas-chat-sessions');
    });

    it('does not re-render the product list after the user has picked one', async () => {
        const pending = el.handleProductListResult({ products: RAW }, { searchText: 'photoshop' });
        const followUp = await turn(0);
        expect(cardMessages(el)).to.have.length(1);

        pickPhotoshop(el);
        await turn(1);

        followUp.resolve({ type: 'guided_step', message: 'Select a product:', productCards: STALE_CARDS });
        await pending;

        expect(cardMessages(el)).to.have.length(1);
    });

    it('does not rewind the conversation history the live turn is building on', async () => {
        const pending = el.handleProductListResult({ products: RAW }, { searchText: 'photoshop' });
        const followUp = await turn(0);

        pickPhotoshop(el);
        await turn(1);
        const historyAfterClick = el.conversationHistory;

        followUp.resolve({
            type: 'message',
            message: 'stale',
            conversationHistory: [{ role: 'user', content: 'stale' }],
        });
        await pending;

        expect(el.conversationHistory).to.equal(historyAfterClick);
    });

    it('leaves the spinner up for the turn the user is actually waiting on', async () => {
        const pending = el.handleProductListResult({ products: RAW }, { searchText: 'photoshop' });
        const followUp = await turn(0);

        pickPhotoshop(el);
        await turn(1);
        expect(el.isLoading).to.equal(true);

        followUp.resolve({ type: 'message', message: 'stale' });
        await pending;

        expect(el.isLoading).to.equal(true);
    });

    it('marks the product list answered so its tiles stop accepting clicks', async () => {
        const pending = el.handleProductListResult({ products: RAW }, { searchText: 'photoshop' });
        const followUp = await turn(0);

        pickPhotoshop(el);

        const [list] = cardMessages(el);
        expect(list.productCardsSelectedValue).to.equal('phsp_direct_individual');

        followUp.resolve({ type: 'message', message: 'stale' });
        await pending;
    });

    it('names what is still running while the follow-up turn is in flight', async () => {
        const pending = el.handleProductListResult({ products: RAW }, { searchText: 'photoshop' });
        const followUp = await turn(0);

        expect(el.isLoading).to.equal(true);
        expect(el.loadingLabel).to.be.a('string').and.not.equal('');

        followUp.resolve({ type: 'message', message: 'done' });
        await pending;

        expect(el.loadingLabel).to.equal('');
    });

    /**
     * The follow-up turn has no per-send context object; the offer it needs is
     * the one the release flow is already holding. Reading an undeclared
     * `context` here threw a ReferenceError in the browser, which the catch
     * turned into "I could not finish that request".
     */
    it('auto-answers the segment step from the offer the release flow holds', async () => {
        el.selectedReleaseOffer = { customer_segment: 'TEAM' };
        const pending = el.handleProductListResult({ products: RAW }, { searchText: 'photoshop' });
        const followUp = await turn(0);

        followUp.resolve({
            type: 'guided_step',
            message: 'Which customer segment?',
            buttonGroup: {
                label: 'Customer Segment',
                options: [
                    { label: 'Team', value: 'TEAM' },
                    { label: 'Individual', value: 'INDIVIDUAL' },
                ],
            },
        });
        (await turn(1)).resolve({ type: 'message', message: 'ok' });
        await pending;

        expect(el.messages.some((m) => m.buttonGroup?.label === 'Customer Segment')).to.equal(false);
        expect(el.messages.some((m) => m.role === 'user' && m.content === 'Team')).to.equal(true);
    });
});

describe('MasChat aborts the request a new turn supersedes', () => {
    let el;
    let signals;

    beforeEach(async () => {
        localStorage.removeItem('mas-chat-sessions');
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        signals = [];
        window.adobeIMS = {
            getAccessToken: () => ({ token: 'test-token' }),
            adobeIdData: { client_id: 'test-client' },
        };
        sinon.stub(window, 'fetch').callsFake((url, init) => {
            signals.push(init.signal);
            return new Promise(() => {});
        });
    });

    afterEach(() => {
        sinon.restore();
        delete window.adobeIMS;
        el.remove();
        localStorage.removeItem('mas-chat-sessions');
    });

    const send = (message) => el.handleSendMessage({ detail: { message, context: { skipDeterministicRouter: true } } });

    it('aborts the in-flight chat request when the next turn starts', async () => {
        send('find photoshop');
        await until(() => signals.length === 1, 'the first request');
        expect(signals[0].aborted).to.equal(false);

        send('actually, illustrator');
        await until(() => signals.length === 2, 'the second request');

        expect(signals[0].aborted).to.equal(true);
        expect(signals[1].aborted).to.equal(false);
    });

    it('leaves feedback and title posts out of turn cancellation', async () => {
        el.callAIChatAction({ requestType: 'feedback', rating: 'up' });
        await until(() => signals.length === 1, 'the feedback post');

        send('next question');
        await until(() => signals.length === 2, 'the next turn');

        expect(signals[0].aborted).to.equal(false);
    });

    it('does not surface a cancelled turn as a chat error', async () => {
        send('find photoshop');
        await until(() => signals.length === 1, 'the first request');

        send('actually, illustrator');
        await until(() => signals.length === 2, 'the second request');

        expect(el.error).to.equal(null);
        expect(el.messages.some((m) => m.role === 'error')).to.equal(false);
    });
});
