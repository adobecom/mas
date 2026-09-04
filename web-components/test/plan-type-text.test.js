import { expect } from '@open-wc/testing';
import {
    planTypeTextOptionsProvider,
    precedingChar,
    planTypeCaseFor,
} from '../src/plan-type-text.js';
import '../src/mas-commerce-service.js';
import '../src/merch-card.js';

before(async () => {
    if (!document.querySelector('mas-commerce-service')) {
        document.head.appendChild(
            document.createElement('mas-commerce-service'),
        );
    }
    await customElements.whenDefined('merch-card');
});

const tokenCard = (before) => {
    const card = document.createElement('merch-card');
    card.innerHTML =
        '<span is="inline-price" data-template="price" data-wcs-osi="ABC"></span>' +
        `<p>${before}<span is="inline-price" data-template="legal" data-placeholder="plan-type-text"></span></p>`;
    document.body.append(card);
    return card.querySelector('[data-placeholder="plan-type-text"]');
};

describe('planTypeTextOptionsProvider', () => {
    it('injects the host OSI and leaves display flags to the marker', () => {
        const options = {};
        planTypeTextOptionsProvider(tokenCard('text '), options);
        expect(options.wcsOsi).to.equal('ABC');
        expect(options.displayPerUnit).to.equal(undefined);
        expect(options.displayTax).to.equal(undefined);
        expect(options.displayPlanType).to.equal(undefined);
    });

    it('is a no-op for elements without the placeholder attribute', () => {
        const el = document.createElement('span');
        const options = {};
        planTypeTextOptionsProvider(el, options);
        expect(options).to.deep.equal({});
    });

    it('is a no-op when the host has no osi', () => {
        const card = document.createElement('merch-card');
        card.innerHTML =
            '<span is="inline-price" data-template="legal" data-placeholder="plan-type-text"></span>';
        document.body.append(card);
        const token = card.querySelector('[data-placeholder="plan-type-text"]');
        const options = {};
        planTypeTextOptionsProvider(token, options);
        expect(options.wcsOsi).to.equal(undefined);
        expect(options.displayPlanType).to.equal(undefined);
    });

    it('sets planTypeCase=lower mid-sentence (preceding word)', () => {
        const options = {};
        planTypeTextOptionsProvider(tokenCard('your plan is '), options);
        expect(options.planTypeCase).to.equal('lower');
    });

    it('sets planTypeCase=lower after a comma (still mid-sentence)', () => {
        const options = {};
        planTypeTextOptionsProvider(tokenCard('flexible, '), options);
        expect(options.planTypeCase).to.equal('lower');
    });
});

describe('planTypeCaseFor (sentence-boundary casing)', () => {
    it('is upper at a sentence start (nothing precedes)', () => {
        expect(planTypeCaseFor(tokenCard(''))).to.equal('upper');
    });

    for (const term of ['.', '!', '?']) {
        it(`is upper after a "${term}" terminator`, () => {
            expect(
                planTypeCaseFor(tokenCard(`This is a plan${term} `)),
            ).to.equal('upper');
        });
    }

    it('is lower mid-sentence', () => {
        expect(planTypeCaseFor(tokenCard('billed '))).to.equal('lower');
    });
});

describe('precedingChar', () => {
    it('returns the last non-space character before the element in its block', () => {
        const token = tokenCard('hello ');
        expect(precedingChar(token)).to.equal('o');
    });

    it('returns empty string when nothing precedes', () => {
        const token = tokenCard('');
        expect(precedingChar(token)).to.equal('');
    });
});

describe('marker styles', () => {
    it('self-injects the plan-type-text stylesheet on import', () => {
        expect(document.querySelector('style[data-plan-type-text]')).to.exist;
    });
});
