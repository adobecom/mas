import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import { Fragment } from '../src/aem/fragment.js';
import '../src/editors/mas-compare-chart-editor.js';
import { COMPARE_CHART_FIELD, TAG_COMPARE_CHART } from '../src/constants.js';
import {
    cellValueFromTableCell,
    normalizeCompareChartKey,
    parseCompareChartTables,
} from '../../web-components/src/compare-chart-table-parser.js';

describe('MasCompareChartEditor', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    const createFragmentStore = (fragment) => ({
        get: () => fragment,
        updateField: (name, value) => fragment.updateField(name, value),
        subscribe: sandbox.stub(),
        unsubscribe: sandbox.stub(),
        previewStore: {
            get: () => fragment,
            updateField: sandbox.stub(),
            subscribe: sandbox.stub(),
            unsubscribe: sandbox.stub(),
        },
    });

    it('adds the Compare chart tag without overwriting existing tags', async () => {
        const fragment = new Fragment({
            id: 'compare-chart-id',
            path: '/content/dam/mas/acom/en_US/compare-chart',
            references: [],
            tags: [{ id: 'mas:status/draft' }],
            fields: [
                {
                    name: 'tags',
                    type: 'tag',
                    multiple: true,
                    values: ['mas:custom/existing'],
                },
                {
                    name: COMPARE_CHART_FIELD,
                    type: 'long-text',
                    values: ['<mas-compare-chart></mas-compare-chart>'],
                },
            ],
        });
        const fragmentStore = createFragmentStore(fragment);

        await fixture(html`<mas-compare-chart-editor .fragmentStore=${fragmentStore}></mas-compare-chart-editor>`);

        expect(fragment.newTags).to.have.members(['mas:status/draft', 'mas:custom/existing', TAG_COMPARE_CHART]);
        expect(fragment.getFieldValues('tags')).to.have.members(['mas:status/draft', 'mas:custom/existing', TAG_COMPARE_CHART]);
    });

    it('does not duplicate the Compare chart tag when it already exists', async () => {
        const fragment = new Fragment({
            id: 'compare-chart-id',
            path: '/content/dam/mas/acom/en_US/compare-chart',
            references: [],
            tags: [{ id: TAG_COMPARE_CHART }],
            fields: [
                {
                    name: 'tags',
                    type: 'tag',
                    multiple: true,
                    values: ['mas:custom/existing'],
                },
                {
                    name: COMPARE_CHART_FIELD,
                    type: 'long-text',
                    values: ['<mas-compare-chart></mas-compare-chart>'],
                },
            ],
        });
        const fragmentStore = createFragmentStore(fragment);

        await fixture(html`<mas-compare-chart-editor .fragmentStore=${fragmentStore}></mas-compare-chart-editor>`);

        expect(fragment.newTags).to.equal(undefined);
        expect(fragment.getFieldValues('tags')).to.deep.equal(['mas:custom/existing']);
    });

    it('renders table-authored sections in the editor grid', async () => {
        const fragment = new Fragment({
            id: 'compare-chart-id',
            path: '/content/dam/mas/acom/en_US/compare-chart',
            references: [],
            tags: [{ id: TAG_COMPARE_CHART }],
            fields: [
                {
                    name: 'cards',
                    type: 'content-fragment',
                    multiple: true,
                    values: [],
                },
                {
                    name: COMPARE_CHART_FIELD,
                    type: 'long-text',
                    values: [
                        `<mas-compare-chart expanded-groups="all">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Adobe apps</th>
                                        <th scope="col">Adobe Express Free</th>
                                        <th scope="col">Adobe Express Premium</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <th scope="row">Seamless integration across Adobe apps like Photoshop, Illustrator, InDesign, Firefly, Acrobat and Lightroom</th>
                                        <td><span class="icon-checkmark-no-fill" role="img" aria-label="Yes"></span></td>
                                        <td><span class="icon-checkmark-no-fill" role="img" aria-label="Yes"></span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </mas-compare-chart>`,
                    ],
                },
            ],
        });
        const fragmentStore = createFragmentStore(fragment);

        const el = await fixture(html`<mas-compare-chart-editor .fragmentStore=${fragmentStore}></mas-compare-chart-editor>`);
        await el.updateComplete;

        expect(el.shadowRoot.querySelector('.compchart-group-title').textContent).to.include('Adobe apps');
        expect(el.shadowRoot.querySelector('.compchart-row-label').textContent).to.include('Seamless integration');
    });
});

describe('compare-chart table parser', () => {
    const parse = (markup) => {
        const doc = new DOMParser().parseFromString(markup, 'text/html');
        return parseCompareChartTables(doc.body);
    };

    it('normalizes labels into compare-chart keys', () => {
        expect(normalizeCompareChartKey('Adobe apps')).to.equal('adobe-apps');
        expect(normalizeCompareChartKey('Adobe Stock audio/music')).to.equal('adobe-stock-audiomusic');
        expect(normalizeCompareChartKey('Generate images, text effects, templates & more')).to.equal(
            'generate-images-text-effects-templates--more',
        );
    });

    it('maps ctv2 icon cells to compare-chart cell values', () => {
        const doc = new DOMParser().parseFromString(
            `<table><tbody><tr>
                <td><span class="icon-checkmark-no-fill" role="img" aria-label="Yes"></span></td>
                <td><span class="icon-crossmark" role="img" aria-label="No"></span></td>
            </tr></tbody></table>`,
            'text/html',
        );
        const cells = doc.querySelectorAll('td');

        expect(cellValueFromTableCell(cells[0])).to.equal('✓');
        expect(cellValueFromTableCell(cells[1])).to.equal('✗');
    });

    it('parses table headers, feature labels, subheaders, and cells', () => {
        const groups = parse(`
            <table>
                <thead class="invisible-headers">
                    <tr>
                        <th>Adobe apps</th>
                        <th scope="col">Adobe Express Free</th>
                        <th scope="col">Adobe Express Premium</th>
                        <th scope="col" class="invisible-content">Adobe Firefly Pro</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="ctv2-tr">
                        <th scope="row">Seamless integration across Adobe apps like Photoshop, Illustrator, InDesign, Firefly, Acrobat and Lightroom</th>
                        <td><span class="icon-checkmark-no-fill" role="img" aria-label="Yes"></span></td>
                        <td><span class="icon-checkmark-no-fill" role="img" aria-label="Yes"></span></td>
                        <td class="invisible-content"><span class="icon-checkmark-no-fill" role="img" aria-label="Yes"></span></td>
                    </tr>
                    <tr class="ctv2-tr">
                        <th scope="row">
                            <p class="ctv2-th-header">Boost your creativity with Photoshop:</p>
                            <p class="ctv2-th-subheader">In addition to the Adobe Express Premium plan, get full access to Adobe Photoshop on web and mobile.</p>
                        </th>
                        <td><span class="icon-crossmark" role="img" aria-label="No"></span></td>
                        <td><span class="icon-crossmark" role="img" aria-label="No"></span></td>
                        <td class="invisible-content"><span class="icon-checkmark-no-fill" role="img" aria-label="Yes"></span></td>
                    </tr>
                </tbody>
            </table>
        `);

        expect(groups).to.deep.equal([
            {
                name: 'adobe-apps',
                label: 'Adobe apps',
                labelHtml: 'Adobe apps',
                columns: ['Adobe Express Free', 'Adobe Express Premium', 'Adobe Firefly Pro'],
                rows: [
                    {
                        name: 'seamless-integration-across-adobe-apps-like-photoshop-illustrator-indesign-firefly-acrobat-and-lightroom',
                        html: 'Seamless integration across Adobe apps like Photoshop, Illustrator, InDesign, Firefly, Acrobat and Lightroom',
                        cells: ['✓', '✓', '✓'],
                    },
                    {
                        name: 'boost-your-creativity-with-photoshop',
                        html: '<p class="ctv2-th-header">Boost your creativity with Photoshop:</p> <p class="ctv2-th-subheader">In addition to the Adobe Express Premium plan, get full access to Adobe Photoshop on web and mobile.</p>',
                        cells: ['✗', '✗', '✓'],
                    },
                ],
            },
        ]);
    });
});
