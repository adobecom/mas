import { expect } from '@esm-bundle/chai';
import { fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/swc.js';
import '../../src/mas-chat-masa-session.js';
import { InvestigationSession } from '../../src/mas-chat/investigation-session.js';
import { spTheme } from '../utils.js';

const sid = 'ses_11111111-1111-4111-8111-111111111111';
const now = Date.now();
const lease = (expiresIn = 1800000, extra = {}) => ({
    id: sid,
    status: 'active',
    expiresAt: new Date(now + expiresIn).toISOString(),
    activeInvestigations: 0,
    ...extra,
});

describe('MASA session strip', () => {
    let controllers;

    const mountStrip = async (session, setup = () => {}) => {
        const controller = new InvestigationSession({
            conversationId: 'masa-strip-fixture',
            client: { control: sinon.stub().resolves({ result: session, retryAfter: 10 }) },
            now: () => now,
        });
        controllers.push(controller);
        controller.session = session;
        setup(controller);
        const el = await fixture(html`<mas-chat-masa-session .controller=${controller}></mas-chat-masa-session>`, {
            parentNode: spTheme(),
        });
        return { el, controller };
    };
    const label = (button) => button.firstChild.textContent.trim();
    const buttonLabels = (el) => [...el.shadowRoot.querySelectorAll('sp-action-button')].map(label);
    const buttonNamed = (el, name) => [...el.shadowRoot.querySelectorAll('sp-action-button')].find((b) => label(b) === name);
    const time = (expiresIn) => new Date(now + expiresIn).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const text = (el) => el.shadowRoot.querySelector('[role="status"]').textContent.replace(/\s+/g, ' ').trim();

    beforeEach(() => {
        controllers = [];
    });

    afterEach(() => {
        for (const instance of controllers) {
            clearInterval(instance.timer);
            clearTimeout(instance.expiryTimer);
        }
    });

    it('shows when an idle session ends with both actions', async () => {
        const { el } = await mountStrip(lease());
        expect(text(el)).to.equal(`MASA session active until ${time(1800000)}`);
        expect(buttonLabels(el)).to.deep.equal(['Keep active', 'End session']);
        expect(el.shadowRoot.querySelector('sp-icon-clock')).to.exist;
    });

    it('hides Keep active while MASA is working', async () => {
        const { el } = await mountStrip(lease(1800000, { activeInvestigations: 1 }));
        expect(text(el)).to.equal('MASA is working · session stays active');
        expect(buttonLabels(el)).to.deep.equal(['End session']);
    });

    it('keeps the working copy within two minutes of expiry while MASA works', async () => {
        const { el } = await mountStrip(lease(60000, { activeInvestigations: 1 }));
        expect(text(el)).to.equal('MASA is working · session stays active');
        expect(buttonLabels(el)).to.deep.equal(['End session']);
        expect(el.shadowRoot.querySelector('.strip.expiring')).to.equal(null);
    });

    it('warns with an emphasized Keep active when the session is about to end', async () => {
        const { el } = await mountStrip(lease(60000));
        expect(text(el)).to.equal(`Session ends at ${time(60000)}`);
        expect(el.shadowRoot.querySelector('.strip.expiring')).to.exist;
        expect(el.shadowRoot.querySelector('sp-icon-alert')).to.exist;
        expect(buttonNamed(el, 'Keep active').hasAttribute('emphasized')).to.equal(true);
    });

    it('says the session ended without actions', async () => {
        const { el } = await mountStrip(lease(1800000, { status: 'ended' }));
        expect(text(el)).to.equal('Session ended. Saved answers stay in this chat.');
        expect(el.shadowRoot.querySelectorAll('sp-action-button').length).to.equal(0);
        expect(el.shadowRoot.querySelector('sp-icon-info')).to.exist;
    });

    it('counts a single kept file in the singular', async () => {
        const { el } = await mountStrip(lease(), (controller) => {
            controller.images = [{ id: 'a', name: 'a.png', preview: 'blob:a' }];
        });
        expect(text(el)).to.equal(`MASA session active until ${time(1800000)} · 1 file kept until ${time(1800000)}`);
    });

    it('counts several kept files, including downloads, in the plural', async () => {
        const { el } = await mountStrip(lease(), (controller) => {
            controller.images = [{ id: 'a', name: 'a.png', preview: 'blob:a' }];
            controller.downloads.set('d', { url: 'blob:d' });
        });
        expect(text(el)).to.contain('2 files kept until');
    });

    it('shows the time without seconds', async () => {
        const { el } = await mountStrip(lease());
        expect(text(el))
            .to.contain(time(1800000))
            .and.not.to.match(/\d:\d\d:\d\d/);
    });

    it('describes what End session does in a tooltip', async () => {
        const { el } = await mountStrip(lease());
        expect(buttonNamed(el, 'End session').querySelector('sp-tooltip').textContent).to.equal(
            'Ends the MASA session and clears its files',
        );
    });

    it('renews and ends through the controller', async () => {
        const { el, controller } = await mountStrip(lease());
        controller.renew = sinon.stub().resolves();
        controller.end = sinon.stub().resolves();
        buttonNamed(el, 'Keep active').click();
        buttonNamed(el, 'End session').click();
        expect(controller.renew.calledOnce).to.equal(true);
        expect(controller.end.calledOnce).to.equal(true);
    });
});
