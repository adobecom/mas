// A card can be on the page before its template's bundle registers it.
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/mas.js';
import { EVENT_MAS_ERROR, TEMPLATE_LOAD_TIMEOUT } from '../src/constants.js';

const MerchCard = customElements.get('merch-card');

const defineTemplate =
    (name) =>
    ({ TemplateLayout }) => ({
        [name]: {
            class: class extends TemplateLayout {
                renderLayout() {
                    return `<p class="late-template">${name}</p><slot></slot>`;
                }
            },
        },
    });

before(() => {
    if (!document.querySelector('mas-commerce-service')) {
        document.head.appendChild(
            document.createElement('mas-commerce-service'),
        );
    }
});

describe('merch-card waiting for its template', () => {
    let card;
    afterEach(() => card?.remove());

    it('renders once the template registers after the card connects', async () => {
        card = document.createElement('merch-card');
        card.template = 'late-template';
        document.body.append(card);
        await card.updateComplete;
        expect(card.templateLayout).to.be.undefined;
        expect(card.shadowRoot.querySelector('.late-template')).to.be.null;

        MerchCard.registerTemplates(defineTemplate('late-template'));
        await MerchCard.whenTemplate('late-template');
        await card.updateComplete;
        expect(card.shadowRoot.querySelector('.late-template')).to.exist;
        expect(card.hasAttribute('failed')).to.be.false;
    });

    describe('when no bundle on the page has the template', () => {
        let clock;
        beforeEach(() => {
            Object.defineProperty(document, 'visibilityState', {
                configurable: true,
                get: () => 'visible',
            });
            clock = sinon.useFakeTimers({ toFake: ['setTimeout'] });
        });
        afterEach(() => {
            clock.restore();
            delete document.visibilityState;
        });

        it(`fails the card after ${TEMPLATE_LOAD_TIMEOUT} ms, naming the template`, async () => {
            card = document.createElement('merch-card');
            const errors = [];
            card.addEventListener(EVENT_MAS_ERROR, (event) =>
                errors.push(event.detail.message),
            );
            card.template = 'missing-template';
            document.body.append(card);
            await card.updateComplete;
            clock.tick(TEMPLATE_LOAD_TIMEOUT);
            await Promise.resolve();
            await Promise.resolve();
            expect(card.hasAttribute('failed')).to.be.true;
            expect(errors).to.have.length(1);
            expect(errors[0]).to.include('template "missing-template"');
        });
    });
});
