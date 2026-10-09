import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';
import Store from '../src/store.js';

describe('MasChat.handleReleaseCardsResponse', () => {
    let el;
    let storageSandbox;
    let searchBefore;
    let filtersBefore;

    beforeEach(async () => {
        storageSandbox = useIsolatedChatSessionStorage();
        searchBefore = Store.search.value;
        filtersBefore = Store.filters.value;
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        sinon.stub(el, 'isCurrentWork').returns(true);
    });

    afterEach(() => {
        sinon.restore();
        Store.search.set(searchBefore);
        Store.filters.set(filtersBefore);
        el.remove();
        storageSandbox.restore();
    });

    it('appends an error and creates nothing when there are no card configs', async () => {
        const save = sinon.stub(el, 'saveDraftToAEM').resolves({});
        await el.handleReleaseCardsResponse({ cardConfigs: [] });
        expect(save.called).to.equal(false);
        expect(el.messages.at(-1).role).to.equal('error');
        expect(el.messages.at(-1).content).to.include('No card configurations');
    });

    it('creates one draft per config and reports a full-success result', async () => {
        const save = sinon.stub(el, 'saveDraftToAEM');
        save.onCall(0).resolves({ id: 'f1', title: 'A', path: '/p/a' });
        save.onCall(1).resolves({ id: 'f2', title: 'B', path: '/p/b' });
        el.selectedReleaseProduct = { name: 'Photoshop' };

        await el.handleReleaseCardsResponse({
            cardConfigs: [{ variant: 'plans' }, { variant: 'catalog' }],
            parentPath: '/content/dam/mas/acom/en_US',
        });

        expect(save.callCount).to.equal(2);
        expect(save.firstCall.args[1].title).to.equal('Photoshop - Plans');
        expect(save.firstCall.args[1].parentPath).to.equal('/content/dam/mas/acom/en_US');
        const result = el.messages.at(-1).operationResult;
        expect(result.success).to.equal(true);
        expect(result.rawResult.cards.filter((c) => c.success)).to.have.lengthOf(2);
    });

    it('marks a failing config as unsuccessful and reports a partial result', async () => {
        const save = sinon.stub(el, 'saveDraftToAEM');
        save.onCall(0).resolves({ id: 'f1', title: 'A', path: '/p/a' });
        save.onCall(1).rejects(new Error('AEM 500'));
        el.selectedReleaseProduct = { name: 'Acrobat' };

        await el.handleReleaseCardsResponse({
            cardConfigs: [{ variant: 'plans' }, { variant: 'catalog' }],
            parentPath: '/content/dam/mas/acom/en_US',
        });

        const result = el.messages.at(-1).operationResult;
        expect(result.success).to.equal(false);
        expect(result.rawResult.cards.find((c) => !c.success).error).to.equal('AEM 500');
    });

    it('ignores an unsafe model parentPath and falls back to the UI-derived path', async () => {
        Store.search.set({ path: 'acom' });
        Store.filters.set({ locale: 'en_US' });
        const save = sinon.stub(el, 'saveDraftToAEM').resolves({ id: 'f', title: 'T', path: '/p' });

        await el.handleReleaseCardsResponse({
            cardConfigs: [{ variant: 'plans' }],
            parentPath: '/content/dam/mas/acom/../ccd/en_US',
        });

        expect(save.firstCall.args[1].parentPath).to.not.contain('..');
    });
});
