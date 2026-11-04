import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup, oneEvent } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/translation/mas-translation-duplicate-dialog.js';

describe('MasTranslationDuplicateDialog', () => {
    afterEach(() => {
        fixtureCleanup();
    });

    it('renders nothing when open is false', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog .proposedTitle=${'My Project'} .open=${false}></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-dialog-wrapper')).to.be.null;
    });

    it('renders dialog when open is true', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog .proposedTitle=${'My Project'} .open=${true}></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-dialog-wrapper')).to.exist;
    });

    it('does not render a variations checkbox', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog .proposedTitle=${'My Project'} .open=${true}></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-checkbox')).to.be.null;
    });

    it('syncs newTitle to proposedTitle when opened', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog
                .proposedTitle=${'Spring Campaign'}
                .open=${false}
            ></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        el.open = true;
        await el.updateComplete;
        expect(el.newTitle).to.equal('Spring Campaign');
    });

    it('dispatches duplicate-confirmed with newTitle when confirm() is called', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog .proposedTitle=${'Original'} .open=${true}></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        el.newTitle = 'My-Custom-Name';
        setTimeout(() => el.confirm());
        const ev = await oneEvent(el, 'duplicate-confirmed');
        expect(ev.detail.title).to.equal('My-Custom-Name');
    });

    it('does not dispatch duplicate-confirmed when newTitle is cleared to empty', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog
                .proposedTitle=${'Fallback Title'}
                .open=${true}
            ></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        el.newTitle = '';
        let dispatched = false;
        el.addEventListener('duplicate-confirmed', () => {
            dispatched = true;
        });
        el.confirm();
        await new Promise((r) => setTimeout(r, 20));
        expect(dispatched).to.be.false;
    });

    it('marks the textfield invalid when newTitle is cleared to empty', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog
                .proposedTitle=${'Fallback Title'}
                .open=${true}
            ></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        el.newTitle = '';
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-textfield').hasAttribute('invalid')).to.be.true;
    });

    it('dispatches duplicate-cancelled when cancel() is called', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog .proposedTitle=${'X'} .open=${true}></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        setTimeout(() => el.cancel());
        const ev = await oneEvent(el, 'duplicate-cancelled');
        expect(ev).to.exist;
    });

    it('handleInput updates newTitle', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog .proposedTitle=${'X'} .open=${true}></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        el.handleInput({ target: { value: 'Updated Name' } });
        expect(el.newTitle).to.equal('Updated Name');
    });

    it('dispatches duplicate-cancelled when @close fires on the dialog wrapper', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog .proposedTitle=${'X'} .open=${true}></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        const wrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
        setTimeout(() => wrapper.dispatchEvent(new Event('close', { bubbles: true, composed: true })));
        const ev = await oneEvent(el, 'duplicate-cancelled');
        expect(ev).to.exist;
    });

    it('marks the textfield invalid when newTitle matches an existing title (case-insensitive)', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog
                .proposedTitle=${'Spring Campaign copy'}
                .existingTitles=${['Spring Campaign Copy']}
                .open=${true}
            ></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-textfield').hasAttribute('invalid')).to.be.true;
    });

    it('does not mark the textfield invalid for a unique title', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog
                .proposedTitle=${'Unique-Title'}
                .existingTitles=${['Spring-Campaign']}
                .open=${true}
            ></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-textfield').hasAttribute('invalid')).to.be.false;
    });

    it('does not dispatch duplicate-confirmed when the title matches an existing title', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog
                .proposedTitle=${'Spring Campaign'}
                .existingTitles=${['Spring Campaign']}
                .open=${true}
            ></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        let dispatched = false;
        el.addEventListener('duplicate-confirmed', () => {
            dispatched = true;
        });
        el.confirm();
        await new Promise((r) => setTimeout(r, 20));
        expect(dispatched).to.be.false;
    });

    it('does not dispatch duplicate-confirmed when newTitle is whitespace-only', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog .proposedTitle=${'Original'} .open=${true}></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        el.newTitle = '   ';
        let dispatched = false;
        el.addEventListener('duplicate-confirmed', () => {
            dispatched = true;
        });
        el.confirm();
        await new Promise((r) => setTimeout(r, 20));
        expect(dispatched).to.be.false;
    });

    it('marks the textfield invalid for characters not allowed when creating a translation project', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog
                .proposedTitle=${'Spring Campaign!'}
                .open=${true}
            ></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-textfield').hasAttribute('invalid')).to.be.true;
        expect(el.shadowRoot.querySelector('.validation-message').textContent).to.contain(
            'may only use letters, numbers, hyphens, underscores and dots',
        );
    });

    it('does not dispatch duplicate-confirmed for a title with disallowed characters', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog .proposedTitle=${'Original'} .open=${true}></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        el.newTitle = 'Spring Campaign!';
        let dispatched = false;
        el.addEventListener('duplicate-confirmed', () => {
            dispatched = true;
        });
        el.confirm();
        await new Promise((r) => setTimeout(r, 20));
        expect(dispatched).to.be.false;
    });

    it('allows a title made only of letters, numbers, hyphens, underscores and dots', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog
                .proposedTitle=${'Spring-Campaign_2.copy'}
                .open=${true}
            ></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-textfield').hasAttribute('invalid')).to.be.false;
    });

    it('reserves the validation message space so the dialog does not resize when an error appears', async () => {
        const el = await fixture(html`
            <mas-translation-duplicate-dialog .proposedTitle=${'Valid-Title'} .open=${true}></mas-translation-duplicate-dialog>
        `);
        await el.updateComplete;
        const message = el.shadowRoot.querySelector('.validation-message');
        const heightWhenValid = message.getBoundingClientRect().height;
        expect(heightWhenValid).to.be.greaterThan(0);

        el.newTitle = 'Invalid Title!';
        await el.updateComplete;
        const heightWhenInvalid = message.getBoundingClientRect().height;
        expect(heightWhenInvalid).to.equal(heightWhenValid);
    });
});
