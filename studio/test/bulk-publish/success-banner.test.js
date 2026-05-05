import { fixture, html, expect } from '@open-wc/testing';
import '../../src/bulk-publish/mas-bulk-publish-success-banner.js';

describe('mas-bulk-publish-success-banner', () => {
    it('renders copy with publishedAt and publishedBy', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-success-banner
                .publishedAt=${'2026-04-23T10:00:00Z'}
                .publishedBy=${'Fred'}
            ></mas-bulk-publish-success-banner>
        `);
        await el.updateComplete;
        const text = el.shadowRoot.textContent;
        expect(text).to.include('Project published successfully');
        expect(text).to.include('Fred');
        expect(text).to.include('2026');
    });
});
