import { expect } from '@esm-bundle/chai';
import { fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';
import '../src/mas-chat-message.js';
import { spTheme } from './utils.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';

/**
 * The Select Template step (and so the enabled Create Cards button) renders
 * only when the confirmation summary has a surface. It used to read the raw
 * Store.search.value.path in the message template, which is empty or a full
 * path depending on how the session was entered — so the step silently
 * vanished and Create Cards stayed disabled. The surface is now resolved once,
 * canonically (getCurrentSurface: hash fallback + extractSurfaceFromPath), onto
 * the summary, and the message binding reads it from there.
 */
describe('release confirmation summary — surface resolution', () => {
    let el;
    let storageSandbox;

    beforeEach(async () => {
        storageSandbox = useIsolatedChatSessionStorage();
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        el.selectedReleaseProduct = { arrangement_code: 'PA-1930', description: 'a product' };
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
        storageSandbox.restore();
    });

    it('enrich carries the canonically-resolved surface on the summary', async () => {
        sinon.stub(el, 'getCurrentSurface').returns('sandbox');

        const enriched = await el.enrichReleaseConfirmationSummary({ product: {}, osi: 'osi-1' });

        expect(enriched.surface).to.equal('sandbox');
    });
});

describe('MasChatMessage renders the Select Template step from the summary surface', () => {
    it('passes the summary surface to the confirmation summary so the template step renders', async () => {
        const message = {
            role: 'assistant',
            type: 'message',
            timestamp: 1,
            confirmationSummary: {
                surface: 'sandbox',
                product: { name: 'Photoshop' },
                segment: { label: 'Team' },
                offeringType: { label: 'Annual, prepaid' },
                osi: 'osi-1',
                locale: 'en_US',
            },
        };
        const el = await fixture(html`<mas-chat-message .message=${message}></mas-chat-message>`, {
            parentNode: spTheme(),
        });

        const summaryEl = el.querySelector('mas-chat-confirmation-summary');
        expect(summaryEl, 'confirmation summary should render').to.exist;
        expect(summaryEl.surface).to.equal('sandbox');

        await summaryEl.updateComplete;
        expect(summaryEl.querySelector('.summary-template-action'), 'the Select Template step must render').to.exist;
    });
});
