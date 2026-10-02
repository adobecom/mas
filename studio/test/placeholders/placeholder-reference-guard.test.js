import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Events from '../../src/events.js';
import '../../src/placeholders/mas-placeholder-references-modal.js';
import {
    PLACEHOLDER_REFERENCES_MODAL_TAG_NAME,
    confirmPlaceholderReferences,
} from '../../src/placeholders/placeholder-reference-guard.js';

function makeCursor(pages) {
    return (async function* () {
        for (const page of pages) yield page;
    })();
}

function createAem(pages) {
    return {
        sites: {
            cf: {
                fragments: {
                    search: sinon.stub().callsFake(async () => makeCursor(pages)),
                },
            },
        },
    };
}

async function waitForOpenModal() {
    for (let attempt = 0; attempt < 50; attempt++) {
        const modal = document.querySelector(PLACEHOLDER_REFERENCES_MODAL_TAG_NAME);
        if (modal?.open) {
            await modal.updateComplete;
            return modal;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error('Timed out waiting for the placeholder references modal to open.');
}

function buttonLabels(modal) {
    return [...modal.shadowRoot.querySelectorAll('sp-button')].map((button) => button.textContent.trim());
}

describe('placeholder-reference-guard', () => {
    afterEach(() => {
        document.querySelector(PLACEHOLDER_REFERENCES_MODAL_TAG_NAME)?.remove();
    });

    it('blocks removal when references exist and never offers Proceed', async () => {
        const aem = createAem([[{ path: '/content/dam/mas/sandbox/en_US/cards/a', fields: [{ values: ['{{buy-now}}'] }] }]]);

        const resultPromise = confirmPlaceholderReferences({
            aem,
            key: 'buy-now',
            surface: 'sandbox',
            locale: 'en_US',
            mode: 'remove',
        });

        const modal = await waitForOpenModal();
        expect(buttonLabels(modal)).to.deep.equal(['Cancel']);

        modal.shadowRoot.querySelector('sp-button').click();
        expect(await resultPromise).to.be.false;
    });

    it('resolves true for publish after the proceed event when the check is fast', async () => {
        const aem = createAem([]);

        const resultPromise = confirmPlaceholderReferences({
            aem,
            key: 'buy-now',
            surface: 'sandbox',
            locale: 'en_US',
            mode: 'publish',
        });

        const modal = await waitForOpenModal();
        const proceedButton = [...modal.shadowRoot.querySelectorAll('sp-button')].find(
            (button) => button.textContent.trim() === 'Proceed',
        );
        proceedButton.click();
        expect(await resultPromise).to.be.true;
    });

    it('resolves false and toasts once when the check throws a non-abort error', async () => {
        const aem = {
            sites: { cf: { fragments: { search: sinon.stub().rejects(new Error('boom')) } } },
        };
        const toastSpy = sinon.stub();
        Events.toast.subscribe(toastSpy);

        let result;
        try {
            result = await confirmPlaceholderReferences({
                aem,
                key: 'buy-now',
                surface: 'sandbox',
                locale: 'en_US',
                mode: 'publish',
            });
        } finally {
            Events.toast.unsubscribe(toastSpy);
        }

        expect(result).to.be.false;
        expect(toastSpy.callCount).to.equal(1);
    });

    it('resolves false without a toast when the check is aborted', async () => {
        const abortError = new Error('aborted');
        abortError.name = 'AbortError';
        const aem = {
            sites: { cf: { fragments: { search: sinon.stub().rejects(abortError) } } },
        };
        const toastSpy = sinon.stub();
        Events.toast.subscribe(toastSpy);

        let result;
        try {
            result = await confirmPlaceholderReferences({
                aem,
                key: 'buy-now',
                surface: 'sandbox',
                locale: 'en_US',
                mode: 'publish',
            });
        } finally {
            Events.toast.unsubscribe(toastSpy);
        }

        expect(result).to.be.false;
        expect(toastSpy.callCount).to.equal(0);
    });
});
