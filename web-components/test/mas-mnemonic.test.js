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

async function connected(attrs = {}) {
    const el = makeMnemonic(attrs);
    document.body.append(el);
    await el.updateComplete;
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

    describe('property defaults', () => {
        it('smartPlacement defaults to false', () => {
            expect(makeMnemonic().smartPlacement).to.be.false;
        });

        it('smart-placement attribute sets property to true', () => {
            const el = makeMnemonic({
                'smart-placement': true,
                'tooltip-text': 'Hi',
            });
            document.body.append(el);
            expect(el.smartPlacement).to.be.true;
        });
    });

    describe('connectedCallback auto-enable', () => {
        it('enables inside merch-card[variant="fries"]', () => {
            const el = makeMnemonic({ 'tooltip-text': 'Foo' });
            inCard(el, 'fries');
            expect(el.smartPlacement).to.be.true;
        });

        it('does not enable inside merch-card[variant="plans"]', () => {
            const el = makeMnemonic({ 'tooltip-text': 'Foo' });
            inCard(el, 'plans');
            expect(el.smartPlacement).to.be.false;
        });

        it('does not enable inside merch-card[variant="catalog"]', () => {
            const el = makeMnemonic({ 'tooltip-text': 'Foo' });
            inCard(el, 'catalog');
            expect(el.smartPlacement).to.be.false;
        });

        it('does not enable with no merch-card ancestor', () => {
            const el = makeMnemonic({ 'tooltip-text': 'Foo' });
            document.body.append(el);
            expect(el.smartPlacement).to.be.false;
        });

        it('does not override an explicit smart-placement attribute', () => {
            const el = makeMnemonic({
                'smart-placement': true,
                'tooltip-text': 'Foo',
            });
            inCard(el, 'plans');
            expect(el.smartPlacement).to.be.true;
        });
    });

    describe('render – wrapper class', () => {
        it('renders .css-tooltip.smart when smartPlacement is true', async () => {
            const el = await connected({
                'smart-placement': true,
                'tooltip-text': 'Hi',
            });
            const wrapper = el.shadowRoot.querySelector('.css-tooltip');
            expect(wrapper).to.exist;
            expect(wrapper.classList.contains('smart')).to.be.true;
        });

        it('does not add placement class in smart mode', async () => {
            const el = await connected({
                'smart-placement': true,
                'tooltip-text': 'Hi',
            });
            const wrapper = el.shadowRoot.querySelector('.css-tooltip');
            for (const cls of ['top', 'bottom', 'left', 'right']) {
                expect(
                    wrapper.classList.contains(cls),
                    `unexpected class "${cls}"`,
                ).to.be.false;
            }
        });

        it('renders .css-tooltip.top (not smart) by default', async () => {
            const el = await connected({ 'tooltip-text': 'Hi' });
            const wrapper = el.shadowRoot.querySelector('.css-tooltip');
            expect(wrapper.classList.contains('top')).to.be.true;
            expect(wrapper.classList.contains('smart')).to.be.false;
        });

        it('renders .css-tooltip.bottom when placement="bottom"', async () => {
            const el = await connected({
                'tooltip-text': 'Hi',
                placement: 'bottom',
            });
            const wrapper = el.shadowRoot.querySelector('.css-tooltip');
            expect(wrapper.classList.contains('bottom')).to.be.true;
            expect(wrapper.classList.contains('smart')).to.be.false;
        });

        it('renders .css-tooltip.left when placement="left"', async () => {
            const el = await connected({
                'tooltip-text': 'Hi',
                placement: 'left',
            });
            const wrapper = el.shadowRoot.querySelector('.css-tooltip');
            expect(wrapper.classList.contains('left')).to.be.true;
            expect(wrapper.classList.contains('smart')).to.be.false;
        });

        it('renders .css-tooltip.right when placement="right"', async () => {
            const el = await connected({
                'tooltip-text': 'Hi',
                placement: 'right',
            });
            const wrapper = el.shadowRoot.querySelector('.css-tooltip');
            expect(wrapper.classList.contains('right')).to.be.true;
            expect(wrapper.classList.contains('smart')).to.be.false;
        });
    });

    describe('render – inner structure', () => {
        it('renders .css-tooltip-tip inside .css-tooltip-body in smart mode', async () => {
            const el = await connected({
                'smart-placement': true,
                'tooltip-text': 'Hi',
            });
            const body = el.shadowRoot.querySelector('.css-tooltip-body');
            expect(body).to.exist;
            expect(body.querySelector('.css-tooltip-tip')).to.exist;
        });

        it('.css-tooltip-tip carries a placement class in smart mode', async () => {
            const el = await connected({
                'smart-placement': true,
                'tooltip-text': 'Hi',
            });
            const tip = el.shadowRoot.querySelector('.css-tooltip-tip');
            const hasPlacement = ['top', 'bottom', 'left', 'right'].some((c) =>
                tip.classList.contains(c),
            );
            expect(hasPlacement).to.be.true;
        });

        it('does not render .css-tooltip-tip in non-smart mode', async () => {
            const el = await connected({ 'tooltip-text': 'Hi' });
            expect(el.shadowRoot.querySelector('.css-tooltip-tip')).to.be.null;
        });
    });

    describe('no-content fast path', () => {
        it('renders no tooltip wrapper when tooltip-text is absent', async () => {
            const el = await connected();
            expect(el.shadowRoot.querySelector('.css-tooltip')).to.be.null;
        });
    });

    describe('tooltip visibility', () => {
        it('adds tooltip-visible on showTooltip() in smart mode', async () => {
            const el = await connected({
                'smart-placement': true,
                'tooltip-text': 'Hi',
            });
            el.showTooltip();
            await el.updateComplete;
            expect(
                el.shadowRoot
                    .querySelector('.css-tooltip')
                    .classList.contains('tooltip-visible'),
            ).to.be.true;
        });

        it('adds tooltip-visible on showTooltip() in non-smart mode', async () => {
            const el = await connected({ 'tooltip-text': 'Hi' });
            el.showTooltip();
            await el.updateComplete;
            expect(
                el.shadowRoot
                    .querySelector('.css-tooltip')
                    .classList.contains('tooltip-visible'),
            ).to.be.true;
        });

        it('removes tooltip-visible on hideTooltip()', async () => {
            const el = await connected({ 'tooltip-text': 'Hi' });
            el.showTooltip();
            await el.updateComplete;
            el.hideTooltip();
            await el.updateComplete;
            expect(
                el.shadowRoot
                    .querySelector('.css-tooltip')
                    .classList.contains('tooltip-visible'),
            ).to.be.false;
        });
    });

    describe('effectivePlacement precedence', () => {
        it('tooltip-placement takes priority over placement', () => {
            const el = makeMnemonic({
                placement: 'bottom',
                'tooltip-placement': 'right',
            });
            expect(el.effectivePlacement).to.equal('right');
        });

        it('mnemonic-placement is used when tooltip-placement is absent', () => {
            const el = makeMnemonic({
                placement: 'bottom',
                'mnemonic-placement': 'left',
            });
            expect(el.effectivePlacement).to.equal('left');
        });

        it('falls back to placement when no tooltip/mnemonic placement set', () => {
            expect(
                makeMnemonic({ placement: 'bottom' }).effectivePlacement,
            ).to.equal('bottom');
        });

        it('defaults to "top" when no placement attributes set', () => {
            expect(makeMnemonic().effectivePlacement).to.equal('top');
        });
    });
});
