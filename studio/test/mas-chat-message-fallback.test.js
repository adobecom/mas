import { expect } from '@esm-bundle/chai';
import { fixture, html } from '@open-wc/testing';
import '../src/swc.js';
import '../src/mas-chat-message.js';
import { spTheme } from './utils.js';

describe('MasChatMessage empty-content fallback', () => {
    it('exposes operation progress as an accessible native progress value', async () => {
        const el = await fixture(
            html`<mas-chat-message
                .message=${{
                    role: 'assistant',
                    content: '',
                    operationLoading: true,
                    progress: { current: 1, total: 4, percentage: 25 },
                }}
            ></mas-chat-message>`,
        );
        const progress = el.querySelector('progress');
        expect(progress).to.exist;
        expect(progress.value / progress.max).to.equal(0.25);
        expect(progress.getAttribute('aria-label')).to.equal('Card processing');
    });

    it('renders a visible fallback instead of a blank bubble for an empty assistant message', async () => {
        const el = await fixture(
            html`<mas-chat-message
                .message=${{ role: 'assistant', content: '', type: 'message', timestamp: 1 }}
            ></mas-chat-message>`,
            { parentNode: spTheme() },
        );
        expect(el.textContent).to.include('nothing to display');
    });

    it('renders normal assistant content unchanged', async () => {
        const el = await fixture(
            html`<mas-chat-message
                .message=${{ role: 'assistant', content: 'Here are your cards.', type: 'message', timestamp: 1 }}
            ></mas-chat-message>`,
            { parentNode: spTheme() },
        );
        expect(el.textContent).to.include('Here are your cards.');
        expect(el.textContent).to.not.include('nothing to display');
    });
});
