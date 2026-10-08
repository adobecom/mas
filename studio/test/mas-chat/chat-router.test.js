import { expect } from '@esm-bundle/chai';
import '../../src/swc.js';
import { handleChatDrawerToggle } from '../../src/mas-chat/chat-router.js';
import Store from '../../src/store.js';
import { WCS_LANDSCAPE_PUBLISHED, WCS_LANDSCAPE_DRAFT } from '../../src/constants.js';

describe('chat-router handleChatDrawerToggle', () => {
    const host = { querySelector: () => null };
    let original;

    beforeEach(() => {
        original = Store.landscape.value;
    });

    afterEach(() => {
        Store.landscape.set(original);
    });

    it('defaults to the DRAFT landscape when the assistant opens', () => {
        Store.landscape.set(WCS_LANDSCAPE_PUBLISHED);
        handleChatDrawerToggle({ detail: { open: true } }, host);
        expect(Store.landscape.value).to.equal(WCS_LANDSCAPE_DRAFT);
    });

    it('leaves the landscape untouched when the assistant closes', () => {
        Store.landscape.set(WCS_LANDSCAPE_PUBLISHED);
        handleChatDrawerToggle({ detail: { open: false } }, host);
        expect(Store.landscape.value).to.equal(WCS_LANDSCAPE_PUBLISHED);
    });
});
