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

        it('renders merch-icon when src is set', async () => {
            const el = await connected({ src: 'https://example.com/icon.svg' });
            const icon = el.shadowRoot.querySelector('merch-icon');
            expect(icon).to.exist;
            expect(icon.getAttribute('src')).to.equal(
                'https://example.com/icon.svg',
            );
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

    describe('handleClickOutside', () => {
        it('hides tooltip when mousedown fires outside the element', async () => {
            const el = await connected({ 'tooltip-text': 'Hi' });
            el.showTooltip();
            await el.updateComplete;
            expect(el.tooltipVisible).to.be.true;

            const evt = new MouseEvent('mousedown', { bubbles: true });
            document.body.dispatchEvent(evt);
            expect(el.tooltipVisible).to.be.false;
        });

        it('does not hide tooltip when mousedown fires inside the element', async () => {
            const el = await connected({ 'tooltip-text': 'Hi' });
            el.showTooltip();
            await el.updateComplete;

            const wrapper = el.shadowRoot.querySelector('.css-tooltip');
            const evt = new MouseEvent('mousedown', {
                bubbles: true,
                composed: true,
            });
            wrapper.dispatchEvent(evt);
            expect(el.tooltipVisible).to.be.true;
        });
    });

    describe('dismiss active tooltip when showing a new one', () => {
        it('hides the previously active tooltip', async () => {
            const el1 = await connected({ 'tooltip-text': 'One' });
            const el2 = await connected({ 'tooltip-text': 'Two' });
            el1.showTooltip();
            await el1.updateComplete;
            expect(el1.tooltipVisible).to.be.true;

            el2.showTooltip();
            await el1.updateComplete;
            await el2.updateComplete;
            expect(el1.tooltipVisible).to.be.false;
            expect(el2.tooltipVisible).to.be.true;
        });
    });

    describe('handleTap', () => {
        it('shows tooltip on first tap', async () => {
            const el = await connected({ 'tooltip-text': 'Hi' });
            const evt = new MouseEvent('click', { bubbles: true });
            evt.preventDefault = () => {};
            el.handleTap(evt);
            expect(el.tooltipVisible).to.be.true;
        });

        it('hides tooltip on second tap', async () => {
            const el = await connected({ 'tooltip-text': 'Hi' });
            el.showTooltip();
            const evt = new MouseEvent('click', { bubbles: true });
            evt.preventDefault = () => {};
            el.handleTap(evt);
            expect(el.tooltipVisible).to.be.false;
        });
    });

    describe('closeOverlay', () => {
        it('does not throw when overlay-trigger is absent', async () => {
            const el = await connected({ 'tooltip-text': 'Hi' });
            expect(() => el.closeOverlay()).not.to.throw;
        });
    });

    describe('pointer event handlers', () => {
        it('records pointerType on pointerdown', async () => {
            const el = await connected({ 'tooltip-text': 'Hi' });
            const wrapper = el.shadowRoot.querySelector('.css-tooltip');
            wrapper.dispatchEvent(
                new PointerEvent('pointerdown', {
                    pointerType: 'touch',
                    bubbles: true,
                }),
            );
            expect(el.lastPointerType).to.equal('touch');
        });

        it('shows tooltip on non-touch pointerenter', async () => {
            const el = await connected({ 'tooltip-text': 'Hi' });
            const wrapper = el.shadowRoot.querySelector('.css-tooltip');
            wrapper.dispatchEvent(
                new PointerEvent('pointerenter', {
                    pointerType: 'mouse',
                    bubbles: true,
                }),
            );
            expect(el.tooltipVisible).to.be.true;
        });

        it('does not show tooltip on touch pointerenter', async () => {
            const el = await connected({ 'tooltip-text': 'Hi' });
            const wrapper = el.shadowRoot.querySelector('.css-tooltip');
            wrapper.dispatchEvent(
                new PointerEvent('pointerenter', {
                    pointerType: 'touch',
                    bubbles: true,
                }),
            );
            expect(el.tooltipVisible).to.be.false;
        });

        it('triggers handleTap on click when lastPointerType is touch', async () => {
            const el = await connected({ 'tooltip-text': 'Hi' });
            el.lastPointerType = 'touch';
            const wrapper = el.shadowRoot.querySelector('.css-tooltip');
            wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            expect(el.tooltipVisible).to.be.true;
            expect(el.lastPointerType).to.be.null;
        });
    });

    describe('_computeTooltipPosition placement fallbacks', () => {
        it('computes placement when starting from bottom in smart mode', async () => {
            const el = await connected({
                'smart-placement': true,
                'tooltip-text': 'Hi',
                placement: 'bottom',
            });
            el.showTooltip();
            await el.updateComplete;
            expect(el.tooltipVisible).to.be.true;
            expect(el._computedPlacement).to.be.oneOf([
                'top',
                'bottom',
                'left',
                'right',
            ]);
        });

        it('computes placement when starting from left in smart mode', async () => {
            const el = await connected({
                'smart-placement': true,
                'tooltip-text': 'Hi',
                placement: 'left',
            });
            el.showTooltip();
            await el.updateComplete;
            expect(el.tooltipVisible).to.be.true;
            expect(el._computedPlacement).to.be.oneOf([
                'top',
                'bottom',
                'left',
                'right',
            ]);
        });

        it('computes placement when starting from right in smart mode', async () => {
            const el = await connected({
                'smart-placement': true,
                'tooltip-text': 'Hi',
                placement: 'right',
            });
            el.showTooltip();
            await el.updateComplete;
            expect(el.tooltipVisible).to.be.true;
            expect(el._computedPlacement).to.be.oneOf([
                'top',
                'bottom',
                'left',
                'right',
            ]);
        });
    });
});
