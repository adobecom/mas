import { expect } from '@esm-bundle/chai';
import MasMnemonic from '../src/mas-mnemonic.js';

function makeMnemonic(attrs = {}) {
    const el = document.createElement('mas-mnemonic');
    for (const [k, v] of Object.entries(attrs)) {
        if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
    }
    return el;
}

function inCard(el, variant) {
    const card = document.createElement('merch-card');
    card.setAttribute('variant', variant);
    card.append(el);
    document.body.append(card);
    return card;
}

describe('mas-mnemonic – smart-placement', () => {
    afterEach(() => {
        document.body
            .querySelectorAll('mas-mnemonic, merch-card')
            .forEach((el) => el.remove());
        MasMnemonic.activeTooltip = null;
    });

    // ── Property defaults ────────────────────────────────────────────────────

    it('smartPlacement defaults to false', () => {
        const el = makeMnemonic();
        expect(el.smartPlacement).to.be.false;
    });

    it('smart-placement attribute sets property to true', () => {
        const el = makeMnemonic({ 'smart-placement': true, 'tooltip-text': 'Hi' });
        document.body.append(el);
        expect(el.smartPlacement).to.be.true;
    });

    // ── connectedCallback auto-enable ────────────────────────────────────────

    it('auto-enables smartPlacement inside merch-card[variant="fries"]', () => {
        const el = makeMnemonic({ 'tooltip-text': 'Foo' });
        inCard(el, 'fries');
        expect(el.smartPlacement).to.be.true;
    });

    it('does not enable smartPlacement inside merch-card[variant="plans"]', () => {
        const el = makeMnemonic({ 'tooltip-text': 'Foo' });
        inCard(el, 'plans');
        expect(el.smartPlacement).to.be.false;
    });

    it('does not enable smartPlacement inside merch-card[variant="catalog"]', () => {
        const el = makeMnemonic({ 'tooltip-text': 'Foo' });
        inCard(el, 'catalog');
        expect(el.smartPlacement).to.be.false;
    });

    it('does not enable smartPlacement with no merch-card ancestor', () => {
        const el = makeMnemonic({ 'tooltip-text': 'Foo' });
        document.body.append(el);
        expect(el.smartPlacement).to.be.false;
    });

    it('does not override an explicit smart-placement attribute when inside a non-fries card', () => {
        const el = makeMnemonic({ 'smart-placement': true, 'tooltip-text': 'Foo' });
        inCard(el, 'plans');
        expect(el.smartPlacement).to.be.true;
    });

    // ── render – wrapper class ────────────────────────────────────────────────

    it('renders .css-tooltip.smart when smartPlacement is true', async () => {
        const el = makeMnemonic({ 'smart-placement': true, 'tooltip-text': 'Hi' });
        document.body.append(el);
        await el.updateComplete;
        const wrapper = el.shadowRoot.querySelector('.css-tooltip');
        expect(wrapper).to.exist;
        expect(wrapper.classList.contains('smart')).to.be.true;
    });

    it('does not add placement class in smart mode', async () => {
        const el = makeMnemonic({ 'smart-placement': true, 'tooltip-text': 'Hi' });
        document.body.append(el);
        await el.updateComplete;
        const wrapper = el.shadowRoot.querySelector('.css-tooltip');
        for (const cls of ['top', 'bottom', 'left', 'right']) {
            expect(wrapper.classList.contains(cls), `unexpected class "${cls}"`).to.be.false;
        }
    });

    it('renders .css-tooltip.top (not smart) when smartPlacement is false – default', async () => {
        const el = makeMnemonic({ 'tooltip-text': 'Hi' });
        document.body.append(el);
        await el.updateComplete;
        const wrapper = el.shadowRoot.querySelector('.css-tooltip');
        expect(wrapper.classList.contains('top')).to.be.true;
        expect(wrapper.classList.contains('smart')).to.be.false;
    });

    it('renders .css-tooltip.bottom when placement="bottom" and smartPlacement is false', async () => {
        const el = makeMnemonic({ 'tooltip-text': 'Hi', placement: 'bottom' });
        document.body.append(el);
        await el.updateComplete;
        const wrapper = el.shadowRoot.querySelector('.css-tooltip');
        expect(wrapper.classList.contains('bottom')).to.be.true;
        expect(wrapper.classList.contains('smart')).to.be.false;
    });

    it('renders .css-tooltip.left when placement="left" and smartPlacement is false', async () => {
        const el = makeMnemonic({ 'tooltip-text': 'Hi', placement: 'left' });
        document.body.append(el);
        await el.updateComplete;
        const wrapper = el.shadowRoot.querySelector('.css-tooltip');
        expect(wrapper.classList.contains('left')).to.be.true;
        expect(wrapper.classList.contains('smart')).to.be.false;
    });

    it('renders .css-tooltip.right when placement="right" and smartPlacement is false', async () => {
        const el = makeMnemonic({ 'tooltip-text': 'Hi', placement: 'right' });
        document.body.append(el);
        await el.updateComplete;
        const wrapper = el.shadowRoot.querySelector('.css-tooltip');
        expect(wrapper.classList.contains('right')).to.be.true;
        expect(wrapper.classList.contains('smart')).to.be.false;
    });

    // ── render – inner structure ─────────────────────────────────────────────

    it('renders .css-tooltip-tip inside .css-tooltip-body in smart mode', async () => {
        const el = makeMnemonic({ 'smart-placement': true, 'tooltip-text': 'Hi' });
        document.body.append(el);
        await el.updateComplete;
        const body = el.shadowRoot.querySelector('.css-tooltip-body');
        expect(body).to.exist;
        const tip = body.querySelector('.css-tooltip-tip');
        expect(tip).to.exist;
    });

    it('.css-tooltip-tip carries a placement class in smart mode', async () => {
        const el = makeMnemonic({ 'smart-placement': true, 'tooltip-text': 'Hi' });
        document.body.append(el);
        await el.updateComplete;
        const tip = el.shadowRoot.querySelector('.css-tooltip-tip');
        const hasPlacement = ['top', 'bottom', 'left', 'right'].some((c) =>
            tip.classList.contains(c),
        );
        expect(hasPlacement).to.be.true;
    });

    it('does not render .css-tooltip-tip in non-smart mode', async () => {
        const el = makeMnemonic({ 'tooltip-text': 'Hi' });
        document.body.append(el);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.css-tooltip-tip')).to.be.null;
    });

    // ── no-content fast path ─────────────────────────────────────────────────

    it('renders no tooltip wrapper when tooltip-text is absent', async () => {
        const el = makeMnemonic();
        document.body.append(el);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.css-tooltip')).to.be.null;
    });

    // ── tooltip visibility ───────────────────────────────────────────────────

    it('adds tooltip-visible class on showTooltip() in smart mode', async () => {
        const el = makeMnemonic({ 'smart-placement': true, 'tooltip-text': 'Hi' });
        document.body.append(el);
        await el.updateComplete;
        el.showTooltip();
        await el.updateComplete;
        const wrapper = el.shadowRoot.querySelector('.css-tooltip');
        expect(wrapper.classList.contains('tooltip-visible')).to.be.true;
    });

    it('adds tooltip-visible class on showTooltip() in non-smart mode', async () => {
        const el = makeMnemonic({ 'tooltip-text': 'Hi' });
        document.body.append(el);
        await el.updateComplete;
        el.showTooltip();
        await el.updateComplete;
        const wrapper = el.shadowRoot.querySelector('.css-tooltip');
        expect(wrapper.classList.contains('tooltip-visible')).to.be.true;
    });

    it('removes tooltip-visible class on hideTooltip()', async () => {
        const el = makeMnemonic({ 'tooltip-text': 'Hi' });
        document.body.append(el);
        await el.updateComplete;
        el.showTooltip();
        await el.updateComplete;
        el.hideTooltip();
        await el.updateComplete;
        const wrapper = el.shadowRoot.querySelector('.css-tooltip');
        expect(wrapper.classList.contains('tooltip-visible')).to.be.false;
    });

    // ── effectivePlacement precedence ────────────────────────────────────────

    it('tooltip-placement takes priority over placement', () => {
        const el = makeMnemonic({ placement: 'bottom', 'tooltip-placement': 'right' });
        expect(el.effectivePlacement).to.equal('right');
    });

    it('mnemonic-placement is used when tooltip-placement is absent', () => {
        const el = makeMnemonic({ placement: 'bottom', 'mnemonic-placement': 'left' });
        expect(el.effectivePlacement).to.equal('left');
    });

    it('falls back to placement when no tooltip/mnemonic placement set', () => {
        const el = makeMnemonic({ placement: 'bottom' });
        expect(el.effectivePlacement).to.equal('bottom');
    });

    it('defaults to "top" when no placement attributes set', () => {
        const el = makeMnemonic();
        expect(el.effectivePlacement).to.equal('top');
    });
});
