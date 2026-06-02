import { expect } from './utilities.js';

const { paramsToHash, historyPushState, shouldHideStPriceLabels } =
    await import('../src/utils.js');

describe('function "paramsToHash"', () => {
    it('Transfer query params to hash', () => {
        historyPushState('filter=photo&single_app=illustrator');
        paramsToHash(['filter', 'single_app']);
        expect(window.location.hash).to.equal(
            '#filter=photo&single_app=illustrator',
        );
    });

    it('Update existing hash from query params', () => {
        historyPushState('filter=3D&single_app=animate');
        paramsToHash(['filter', 'single_app']);
        expect(window.location.hash).to.equal('#filter=3D&single_app=animate');
    });
});

describe('function "shouldHideStPriceLabels"', () => {
    it('The simplest case', () => {
        const div = document.createElement('div');
        const elementST = document.createElement('span');
        div.append(elementST);
        elementST.setAttribute('data-template', 'strikethrough');
        const element = document.createElement('span');
        div.append(element);
        element.setAttribute('data-template', 'price');
        element.isInlinePrice = true;
        document.body.innerHTML = '';
        document.body.appendChild(div);
        expect(shouldHideStPriceLabels(document.querySelector('span'))).to.be
            .true;
    });
    it('With short text between prices', () => {
        const div = document.createElement('div');
        const elementST = document.createElement('span');
        div.append(elementST);
        const text = document.createTextNode('* ');
        div.append(text);
        elementST.setAttribute('data-template', 'strikethrough');
        const element = document.createElement('span');
        div.append(element);
        element.setAttribute('data-template', 'price');
        element.isInlinePrice = true;
        document.body.innerHTML = '';
        document.body.appendChild(div);
        expect(shouldHideStPriceLabels(document.querySelector('span'))).to.be
            .true;
    });
    it('With some element between prices', () => {
        const div = document.createElement('div');
        const elementST = document.createElement('span');
        div.appendChild(elementST);
        const el = document.createElement('i');
        el.isInlinePrice = false;
        div.appendChild(el);
        elementST.setAttribute('data-template', 'strikethrough');
        const element = document.createElement('span');
        div.appendChild(element);
        element.setAttribute('data-template', 'price');
        element.isInlinePrice = true;
        document.body.innerHTML = '';
        document.body.appendChild(div);
        expect(shouldHideStPriceLabels(document.querySelector('span'))).to.be
            .false;
    });
    it('Without promo price', () => {
        const div = document.createElement('div');
        const elementST = document.createElement('span');
        div.appendChild(elementST);
        const el = document.createElement('i');
        div.appendChild(el);
        elementST.setAttribute('data-template', 'strikethrough');
        document.body.innerHTML = '';
        document.body.appendChild(div);
        expect(!!shouldHideStPriceLabels(document.querySelector('span'))).to.be
            .false;
    });
});
