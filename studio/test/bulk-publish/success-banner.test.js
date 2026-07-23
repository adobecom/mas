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

    it('renders publish error state when error prop is set', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-success-banner
                .error=${'Publish failed due to timeout'}
                .publishedAt=${''}
                .publishedBy=${''}
            ></mas-bulk-publish-success-banner>
        `);
        await el.updateComplete;
        const text = el.shadowRoot.textContent;
        expect(text).to.include('Publish failed');
        expect(text).to.include('Publish failed due to timeout');
    });

    it('renders revert error state with fragment list when error has REVERT prefix', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-success-banner
                .error=${'REVERT:\n/content/dam/mas/en_US/frag-1: Failed to restore fragment version: 404\n/content/dam/mas/en_US/frag-2: Not found'}
                .publishedAt=${''}
                .publishedBy=${''}
            ></mas-bulk-publish-success-banner>
        `);
        await el.updateComplete;
        const text = el.shadowRoot.textContent;
        expect(text).to.include('Revert failed');
        expect(text).to.include('/content/dam/mas/en_US/frag-1');
        expect(text).to.include('/content/dam/mas/en_US/frag-2');
        expect(text).not.to.include('Publish failed');
    });

    it('formatDate returns raw string when date parse fails', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-success-banner
                .publishedAt=${'2026-04-23T10:00:00Z'}
                .publishedBy=${''}
            ></mas-bulk-publish-success-banner>
        `);
        const result = el.formatDate('not-a-date');
        expect(result).to.equal('not-a-date');
    });

    it('renders partial summary with published and failed counts', async () => {
        const result = {
            published: 3,
            failed: 2,
            failures: [{ path: '/a', reason: 'not-localized' }],
            failuresTruncated: false,
        };
        const el = await fixture(html`<mas-bulk-publish-success-banner .result=${result}></mas-bulk-publish-success-banner>`);
        await el.updateComplete;
        const text = el.shadowRoot.textContent;
        expect(text).to.include('3');
        expect(text).to.include('2');
        expect(text).to.include('not-localized');
        expect(el.getAttribute('variant')).to.equal('partial');
    });

    it('notes truncation when failuresTruncated', async () => {
        const failures = Array.from({ length: 100 }, (v, i) => ({ path: `/p${i}`, reason: 'not-localized' }));
        const result = { published: 100, failed: 100, failures, failuresTruncated: true };
        const el = await fixture(html`<mas-bulk-publish-success-banner .result=${result}></mas-bulk-publish-success-banner>`);
        await el.updateComplete;
        expect(el.shadowRoot.textContent).to.include('100 of 100');
    });
});
