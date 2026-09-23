import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import '../../src/placeholders/mas-placeholder-references-modal.js';

const references = [
    {
        id: 'card-1',
        path: '/content/dam/mas/sandbox/en_US/cards/a',
        title: 'Card A',
        model: { path: '/conf/mas/settings/dam/cfm/models/card' },
    },
    {
        id: 'coll-1',
        path: '/content/dam/mas/sandbox/en_US/collections/b',
        title: 'Collection B',
        model: { path: '/conf/mas/settings/dam/cfm/models/collection' },
    },
];

function buttonLabels(el) {
    return [...el.shadowRoot.querySelectorAll('sp-button')].map((button) => button.textContent.trim());
}

describe('mas-placeholder-references-modal', () => {
    it('renders Cancel only for remove mode with references', async () => {
        const el = await fixture(html`
            <mas-placeholder-references-modal
                .open=${true}
                .mode=${'remove'}
                .placeholderKey=${'buy-now'}
                .references=${references}
                .allowProceed=${false}
            ></mas-placeholder-references-modal>
        `);
        await el.updateComplete;

        expect(el.shadowRoot.querySelectorAll('a')).to.have.lengthOf(2);
        expect(buttonLabels(el)).to.deep.equal(['Cancel']);
    });

    it('renders Cancel and Proceed for publish mode when allowProceed is true', async () => {
        const el = await fixture(html`
            <mas-placeholder-references-modal
                .open=${true}
                .mode=${'publish'}
                .placeholderKey=${'buy-now'}
                .references=${references}
                .allowProceed=${true}
            ></mas-placeholder-references-modal>
        `);
        await el.updateComplete;

        expect(buttonLabels(el)).to.deep.equal(['Cancel', 'Proceed']);
    });

    it('renders Cancel only for publish mode when allowProceed is false', async () => {
        const el = await fixture(html`
            <mas-placeholder-references-modal
                .open=${true}
                .mode=${'publish'}
                .placeholderKey=${'buy-now'}
                .references=${references}
                .allowProceed=${false}
            ></mas-placeholder-references-modal>
        `);
        await el.updateComplete;

        expect(buttonLabels(el)).to.deep.equal(['Cancel']);
    });

    it('renders "No usage detected" with a Proceed button when there are no references', async () => {
        const el = await fixture(html`
            <mas-placeholder-references-modal
                .open=${true}
                .mode=${'remove'}
                .placeholderKey=${'buy-now'}
                .references=${[]}
                .allowProceed=${false}
            ></mas-placeholder-references-modal>
        `);
        await el.updateComplete;

        expect(el.shadowRoot.textContent).to.include('No usage detected');
        expect(buttonLabels(el)).to.deep.equal(['Cancel', 'Proceed']);
    });

    it('renders nothing when open is false', async () => {
        const el = await fixture(html` <mas-placeholder-references-modal .open=${false}></mas-placeholder-references-modal> `);
        await el.updateComplete;

        expect(el.shadowRoot.querySelector('sp-dialog-wrapper')).to.not.exist;
    });

    it('dispatches a composed, bubbling proceed event on Proceed click', async () => {
        const el = await fixture(html`
            <mas-placeholder-references-modal
                .open=${true}
                .mode=${'remove'}
                .placeholderKey=${'buy-now'}
                .references=${[]}
                .allowProceed=${false}
            ></mas-placeholder-references-modal>
        `);
        await el.updateComplete;

        const proceedButton = [...el.shadowRoot.querySelectorAll('sp-button')].find(
            (button) => button.textContent.trim() === 'Proceed',
        );
        setTimeout(() => proceedButton.click());
        const event = await oneEvent(el, 'proceed');
        expect(event.bubbles).to.be.true;
        expect(event.composed).to.be.true;
    });

    it('dispatches a composed, bubbling cancel event on Cancel click', async () => {
        const el = await fixture(html`
            <mas-placeholder-references-modal
                .open=${true}
                .mode=${'remove'}
                .placeholderKey=${'buy-now'}
                .references=${references}
                .allowProceed=${false}
            ></mas-placeholder-references-modal>
        `);
        await el.updateComplete;

        const cancelButton = el.shadowRoot.querySelector('sp-button');
        setTimeout(() => cancelButton.click());
        const event = await oneEvent(el, 'cancel');
        expect(event.bubbles).to.be.true;
        expect(event.composed).to.be.true;
    });
});
