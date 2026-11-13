import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { mockLana } from './mocks/lana.js';
import { mockFetch } from './mocks/fetch.js';

import '../src/merch-quantity-select.js';

import { appendMiloStyles, delay } from './utils.js';
import { ARROW_DOWN, ARROW_UP } from '../src/focus.js';
import { withWcs } from './mocks/wcs.js';
import '../src/mas.js';

const nextFrame = () =>
    new Promise((resolve) => requestAnimationFrame(resolve));

const skipTests = sessionStorage.getItem('skipTests');

runTests(async () => {
    appendMiloStyles();

    if (skipTests === null) {
        mockLana();
        await mockFetch(withWcs);

        describe('merch-quantity-selector web component', () => {
            const quantitySelect = document.querySelector(
                'merch-quantity-select',
            );
            const pickerButton =
                quantitySelect.shadowRoot.querySelector('.picker-button');
            const popOver = quantitySelect.shadowRoot.querySelector('.popover');

            it('has the required properties set up correctly', async () => {
                expect(quantitySelect).to.exist;
                expect(quantitySelect.title).to.equal('Select a quantity');
                expect(quantitySelect.min).to.equal(1);
                expect(quantitySelect.max).to.equal(10);
                expect(quantitySelect.step).to.equal(1);
            });

            it('uses min when default-value is not on the step ladder', async () => {
                const el = document.createElement('merch-quantity-select');
                el.setAttribute('title', 'Qty');
                el.setAttribute('min', '2');
                el.setAttribute('max', '10');
                el.setAttribute('step', '2');
                el.setAttribute('default-value', '3');
                document.querySelector('main').append(el);
                await delay();
                expect(el.selectedValue).to.equal(2);
                expect(el.highlightedIndex).to.equal(0);
                el.remove();
            });

            it('should open and close the menu', async () => {
                expect(popOver.classList.contains('closed')).to.be.true;
                pickerButton.click();
                await delay();
                expect(popOver.classList.contains('open')).to.be.true;
                pickerButton.click();
                await delay();
                expect(popOver.classList.contains('closed')).to.be.true;
            });

            it('should set default value as 2 ', async () => {
                expect(quantitySelect.highlightedIndex).to.equal(1);
                expect(quantitySelect.selectedValue).to.equal(2);
            });

            it('should navigate up by the items ', async () => {
                quantitySelect.defaultValue = undefined;
                await delay();
                pickerButton.click();
                await delay();
                expect(popOver.classList.contains('open')).to.be.true;
                expect(quantitySelect.highlightedIndex).to.equal(0);
                quantitySelect.handleKeydown({
                    key: ARROW_UP,
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    composedPath() {
                        return [];
                    },
                });
                await delay();
                expect(quantitySelect.highlightedIndex).to.equal(9);
            });

            it('should navigate down by the items ', async () => {
                quantitySelect.handleKeydown({
                    key: ARROW_DOWN,
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    composedPath() {
                        return [];
                    },
                });
                await delay();
                expect(quantitySelect.highlightedIndex).to.equal(0);
            });

            it('should navigate and select with enter', async () => {
                quantitySelect.handleKeydown({
                    key: ARROW_DOWN,
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    composedPath() {
                        return [];
                    },
                });
                await delay();
                quantitySelect.handleKeydown({
                    key: 'Enter',
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    composedPath() {
                        return [];
                    },
                });
                await delay();
                expect(quantitySelect.highlightedIndex).to.equal(1);
                expect(quantitySelect.selectedValue).to.equal(2);
            });

            it('generates the correct options array', () => {
                const options = quantitySelect.generateOptionsArray();
                expect(options).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            });

            it('last option has + in the end', async () => {
                const options =
                    quantitySelect.shadowRoot.querySelectorAll('.item');
                const lastOption = options[options.length - 1];
                expect(lastOption.textContent.trim()).to.equal('10+');
            });

            it('select item when click it', async () => {
                const options =
                    quantitySelect.shadowRoot.querySelectorAll('.item');
                options[3].click();
                await delay();
                expect(quantitySelect.selectedValue).to.equal(4);
            });

            it('key up event', async () => {
                const inputField =
                    quantitySelect.shadowRoot.querySelector(
                        '.text-field-input',
                    );
                inputField.value = '3';
                const event = new KeyboardEvent('keyup', {
                    key: '3',
                    bubbles: true,
                });
                event.composedPath = () => [quantitySelect];
                inputField.dispatchEvent(event);
                await delay();
                expect(quantitySelect.selectedValue).to.equal(4);
                expect(popOver.classList.contains('closed')).to.be.true;
            });

            it('key up event and  invalid value', async () => {
                const inputField =
                    quantitySelect.shadowRoot.querySelector(
                        '.text-field-input',
                    );
                inputField.value = '-11';
                const event = new KeyboardEvent('keyup', {
                    key: '-11',
                    bubbles: true,
                });
                event.composedPath = () => [quantitySelect];
                inputField.dispatchEvent(event);
                await delay();
                expect(quantitySelect.selectedValue).to.equal(4);
                expect(popOver.classList.contains('closed')).to.be.true;
            });

            it('should handle mouse enter event and update highlighted index', async () => {
                const options =
                    quantitySelect.shadowRoot.querySelectorAll('.item');
                options[4].dispatchEvent(new MouseEvent('mouseenter'));
                await delay();
                expect(quantitySelect.highlightedIndex).to.equal(4);
            });

            it('handle click outside', async () => {
                pickerButton.click();
                await delay();
                expect(popOver.classList.contains('open')).to.be.true;
                quantitySelect.handleClickOutside({ composedPath: () => [] });
                await delay();
                expect(popOver.classList.contains('closed')).to.be.true;
            });

            it('should adjust to maxInput value', async () => {
                const inputField =
                    quantitySelect.shadowRoot.querySelector(
                        '.text-field-input',
                    );
                inputField.value = '300';
                const event = new KeyboardEvent('keyup', {
                    key: '300',
                    bubbles: true,
                });
                event.composedPath = () => [quantitySelect];
                inputField.dispatchEvent(event);
                await delay();
                expect(quantitySelect.selectedValue).to.equal(4);
            });

            it('reflects the open state on the host element', async () => {
                expect(quantitySelect.hasAttribute('closed')).to.be.true;
                pickerButton.click();
                await delay();
                expect(quantitySelect.hasAttribute('closed')).to.be.false;
                pickerButton.click();
                await delay();
                expect(quantitySelect.hasAttribute('closed')).to.be.true;
            });

            it('renders exactly 10 option elements for min=1, max=10, step=1', () => {
                const options =
                    quantitySelect.shadowRoot.querySelectorAll('.item');
                expect(options.length).to.equal(10);
            });

            it('computes placement after a layout frame on open, instead of a pre-layout rect', async () => {
                const el = document.createElement('merch-quantity-select');
                el.setAttribute('title', 'Qty');
                el.setAttribute('min', '1');
                el.setAttribute('max', '10');
                el.setAttribute('step', '1');
                el.style.position = 'fixed';
                el.style.top = `${window.innerHeight - 10}px`;
                document.querySelector('main').append(el);
                await delay();
                const button = el.shadowRoot.querySelector('.picker-button');
                const popover = el.shadowRoot.querySelector('.popover');
                button.click();
                await el.updateComplete;
                expect(popover.getAttribute('placement')).to.equal('bottom');
                await nextFrame();
                await delay();
                expect(popover.getAttribute('placement')).to.equal('top');
                el.remove();
            });

            it('re-evaluates placement on resize while open and stops listening after disconnect', async () => {
                const el = document.createElement('merch-quantity-select');
                el.setAttribute('title', 'Qty');
                el.setAttribute('min', '1');
                el.setAttribute('max', '10');
                el.setAttribute('step', '1');
                document.querySelector('main').append(el);
                await delay();
                const adjustSpy = sinon.spy(el, 'adjustPopoverPlacement');
                const button = el.shadowRoot.querySelector('.picker-button');
                button.click();
                await el.updateComplete;
                await nextFrame();
                adjustSpy.resetHistory();
                window.dispatchEvent(new Event('resize'));
                expect(adjustSpy.called).to.be.true;
                el.remove();
                adjustSpy.resetHistory();
                window.dispatchEvent(new Event('resize'));
                expect(adjustSpy.called).to.be.false;
            });
        });
    }
});
