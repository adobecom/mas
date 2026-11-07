import { expect } from '@esm-bundle/chai';
import { fixture, html } from '@open-wc/testing';
import '../src/swc.js';
import '../src/mas-chat-message.js';
import { spTheme } from './utils.js';

const WIDE_TABLE = [
    '| Card | Offer | Plan type | Market segment | Customer segment | Offer selector |',
    '| --- | --- | --- | --- | --- | --- |',
    '| Photoshop | photoshop-individual | annual-commitment | commercial-education | individual-team | osi-photoshop-individual |',
].join('\n');
const LONG_CODE = `\`\`\`js\nconst selectors = ['${'osi-photoshop-individual-annual-'.repeat(8)}'];\n\`\`\``;
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

const userBubble = (content) =>
    fixture(html`<mas-chat-message .message=${{ role: 'user', content, timestamp: 1 }}></mas-chat-message>`, {
        parentNode: spTheme(),
    });

describe('MasChatMessage user bubble', () => {
    it('renders a URL as a link that opens in a new tab', async () => {
        const el = await userBubble('Check https://x.test/a?b=1&c=2 please');
        const link = el.querySelector('.message-text a');
        expect(link.getAttribute('href')).to.equal('https://x.test/a?b=1&c=2');
        expect(link.getAttribute('target')).to.equal('_blank');
        expect(link.getAttribute('rel')).to.equal('noopener noreferrer');
    });

    it('keeps markdown syntax literal', async () => {
        const el = await userBubble('*not bold*');
        const text = el.querySelector('.message-text');
        expect(text.textContent.trim()).to.equal('*not bold*');
        expect(text.querySelector('em, strong')).to.equal(null);
    });

    it('shows an ampersand saved as an entity by the earlier input', async () => {
        const el = await userBubble('a?b=1&amp;c=2');
        expect(el.querySelector('.message-text').textContent.trim()).to.equal('a?b=1&c=2');
    });

    it('decodes a saved entity only once', async () => {
        const el = await userBubble('Type &amp;lt; for &lt;');
        expect(el.querySelector('.message-text').textContent.trim()).to.equal('Type &lt; for <');
    });
});

describe('MasChatMessage assistant formatting', () => {
    let style;

    before(async () => {
        const chatStyles = await (await fetch(new URL('../src/styles/chat.css', import.meta.url))).text();
        style = document.createElement('style');
        style.textContent = `${chatStyles}\n.narrow-drawer { display: block; width: 320px; }`;
        document.head.append(style);
    });

    after(() => style.remove());

    const assistant = (content) => {
        const drawer = document.createElement('div');
        drawer.className = 'mas-feature narrow-drawer';
        return fixture(
            html`<mas-chat-message
                .message=${{ role: 'assistant', content, type: 'message', timestamp: 1 }}
            ></mas-chat-message>`,
            { parentNode: drawer },
        );
    };

    const insideDrawer = (el) =>
        el.querySelector('.message-card').getBoundingClientRect().right <= el.parentNode.getBoundingClientRect().right;

    it('scrolls a wide table inside the bubble instead of overflowing the drawer', async () => {
        const el = await assistant(WIDE_TABLE);
        const wrap = el.querySelector('.message-text div.table-wrap');
        expect(wrap.querySelectorAll('table thead th').length).to.equal(6);
        expect(getComputedStyle(wrap).overflowX).to.equal('auto');
        expect(wrap.scrollWidth).to.be.greaterThan(wrap.clientWidth);
        expect(insideDrawer(el)).to.equal(true);
    });

    it('keeps a fenced block on its lines and scrolls it inside the drawer', async () => {
        const el = await assistant(LONG_CODE);
        const pre = el.querySelector('.message-text pre');
        expect(pre.querySelector('code.language-js')).to.exist;
        const preStyle = getComputedStyle(pre);
        expect(preStyle.whiteSpace).to.equal('pre');
        expect(preStyle.overflowX).to.equal('auto');
        expect(preStyle.backgroundColor).not.to.equal(TRANSPARENT);
        expect(pre.scrollWidth).to.be.greaterThan(pre.clientWidth);
        expect(insideDrawer(el)).to.equal(true);
    });

    it('formats inline code', async () => {
        const el = await assistant('Check `data-wcs-osi` first.');
        const code = getComputedStyle(el.querySelector('.message-text code'));
        expect(code.fontFamily).to.contain('monospace');
        expect(code.backgroundColor).not.to.equal(TRANSPARENT);
        expect(parseFloat(code.paddingLeft)).to.be.greaterThan(0);
        expect(parseFloat(code.borderTopLeftRadius)).to.be.greaterThan(0);
    });
});
