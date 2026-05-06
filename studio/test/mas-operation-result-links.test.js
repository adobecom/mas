import { expect } from '@esm-bundle/chai';
import { fixture, html } from '@open-wc/testing';
import '../src/mas-operation-result.js';

const SAMPLE_RESULT = {
    success: true,
    operation: 'search',
    count: 3,
    results: [
        {
            id: 'aaaa-1111',
            title: 'Photoshop plan',
            path: '/content/dam/mas/acom/en_US/photoshop',
            status: 'PUBLISHED',
            fields: [{ name: 'variant', values: ['plans'] }],
        },
        {
            id: 'bbbb-2222',
            title: 'Photoshop individual',
            path: '/content/dam/mas/acom/en_US/photoshop-ind',
            status: 'DRAFT',
            fields: [{ name: 'variant', values: ['catalog'] }],
        },
        {
            id: 'cccc-3333',
            title: 'Photoshop teams',
            path: '/content/dam/mas/acom/en_US/photoshop-teams',
            status: 'PUBLISHED',
            fields: [{ name: 'variant', values: ['plans'] }],
        },
    ],
};

describe('mas-operation-result — lightweight links mode', () => {
    it('renders anchor links (no aem-fragment / merch-card hydration)', async () => {
        const el = await fixture(html`
            <mas-operation-result
                .result=${SAMPLE_RESULT}
                .operationType=${'search_cards'}
                .mode=${'links'}
                .displayContext=${{ surface: 'acom', locale: 'en_US', query: 'photoshop' }}
            ></mas-operation-result>
        `);

        const anchors = el.querySelectorAll('sp-table-cell.title-cell a');
        expect(anchors.length).to.equal(3);
        for (const a of anchors) {
            expect(a.getAttribute('href')).to.match(/^https:\/\/mas\.adobe\.com\/studio\.html#/);
            expect(a.getAttribute('target')).to.equal('_blank');
        }

        expect(el.querySelector('merch-card')).to.equal(null);
        expect(el.querySelector('aem-fragment')).to.equal(null);
    });

    it('renders a "view all" Studio folder link', async () => {
        const el = await fixture(html`
            <mas-operation-result
                .result=${SAMPLE_RESULT}
                .operationType=${'search_cards'}
                .mode=${'links'}
                .displayContext=${{ surface: 'acom', locale: 'en_US' }}
            ></mas-operation-result>
        `);

        const viewAll = el.querySelector('a.view-all-link');
        expect(viewAll).to.exist;
        expect(viewAll.getAttribute('href')).to.contain('path=%2Fcontent%2Fdam%2Fmas%2Facom');
    });

    it('renders an empty-state with a folder browse link when no results', async () => {
        const el = await fixture(html`
            <mas-operation-result
                .result=${{ success: true, operation: 'search', count: 0, results: [] }}
                .operationType=${'search_cards'}
                .mode=${'links'}
                .displayContext=${{ surface: 'acom', locale: 'en_US' }}
            ></mas-operation-result>
        `);

        expect(el.textContent).to.contain('No cards found');
        const browseLink = el.querySelector('a');
        expect(browseLink).to.exist;
        expect(browseLink.getAttribute('href')).to.contain('path=%2Fcontent%2Fdam%2Fmas%2Facom');
    });

    it('falls back to "full" mode by default when mode is not set', async () => {
        const el = await fixture(html`
            <mas-operation-result .result=${SAMPLE_RESULT} .operationType=${'search_cards'}></mas-operation-result>
        `);
        expect(el.mode).to.equal('full');
    });
});
