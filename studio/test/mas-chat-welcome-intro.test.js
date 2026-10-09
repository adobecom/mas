import { expect } from '@esm-bundle/chai';
import '../src/swc.js';
import '../src/mas-chat.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';

describe('MASA welcome intro', () => {
    let el;
    let storageSandbox;

    beforeEach(async () => {
        storageSandbox = useIsolatedChatSessionStorage();
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
    });

    afterEach(() => {
        el.remove();
        storageSandbox.restore();
    });

    it('introduces MASA by name with an avatar and capability subtitle on the welcome screen', async () => {
        el.showWelcomeScreen = true;
        await el.updateComplete;

        expect(el.textContent).to.include("Hi, I'm MASA");
        expect(el.querySelector('.masa-avatar'), 'MASA avatar badge').to.exist;
        expect(el.querySelector('.welcome-subtitle'), 'capability subtitle').to.exist;
    });
});
