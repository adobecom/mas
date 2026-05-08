import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import { Fragment } from '../src/aem/fragment.js';
import '../src/editors/mas-compare-chart-editor.js';
import { COMPARE_CHART_FIELD, TAG_COMPARE_CHART } from '../src/constants.js';

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
});
