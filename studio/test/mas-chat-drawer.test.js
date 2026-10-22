import { expect } from '@esm-bundle/chai';
import { fixture, fixtureCleanup, html } from '@open-wc/testing';
import '../src/swc.js';
import '../src/mas-chat-drawer.js';

describe('MasChatDrawer resizing', () => {
    let storedWidth;

    beforeEach(() => {
        storedWidth = localStorage.getItem('mas-chat-drawer-width');
        localStorage.setItem('mas-chat-drawer-width', '420');
    });

    afterEach(() => {
        fixtureCleanup();
        if (storedWidth === null) localStorage.removeItem('mas-chat-drawer-width');
        else localStorage.setItem('mas-chat-drawer-width', storedWidth);
    });

    it('restores and resizes its width without an inline declaration', async () => {
        const drawer = await fixture(html`<mas-chat-drawer open></mas-chat-drawer>`);
        const panel = drawer.querySelector('.chat-drawer');
        expect(getComputedStyle(panel).getPropertyValue('--chat-drawer-width').trim()).to.equal('420px');
        drawer.handleResizeStart(new MouseEvent('mousedown', { clientX: 500 }));
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 450 }));
        document.dispatchEvent(new MouseEvent('mouseup'));
        expect(getComputedStyle(panel).getPropertyValue('--chat-drawer-width').trim()).to.equal('470px');
        expect(localStorage.getItem('mas-chat-drawer-width')).to.equal('470');
        expect(panel.hasAttribute('style')).to.be.false;
    });

    it('stops resizing when disconnected', async () => {
        const drawer = await fixture(html`<mas-chat-drawer open></mas-chat-drawer>`);
        drawer.handleResizeStart(new MouseEvent('mousedown', { clientX: 500 }));
        drawer.remove();
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 450 }));
        expect(drawer.drawerWidth).to.equal(420);
        expect(document.body.classList.contains('chat-resizing')).to.be.false;
    });
});
