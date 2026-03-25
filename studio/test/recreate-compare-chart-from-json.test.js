import { expect } from '@open-wc/testing';
import {
    buildCollectionSavePayload,
    buildRecreationPlan,
    dedupeReferencesByPath,
    getOrderedCardFragments,
    rewriteCompareChartCardPaths,
} from '../src/tools/recreate-compare-chart-from-json.js';

const createCardReference = (suffix, title) => ({
    path: `/content/dam/mas/sandbox/en_US/card-${suffix}`,
    title,
    model: { path: '/conf/mas/settings/dam/cfm/models/card' },
    fields: [{ name: 'variant', type: 'text', multiple: false, values: ['mini-compare-chart'] }],
});

const createCollectionFragment = () => ({
    path: '/content/dam/mas/sandbox/en_US/test-compare-chart',
    title: 'Test Compare Chart',
    description: 'desc',
    model: {
        id: 'collection-model-id',
        path: '/conf/mas/settings/dam/cfm/models/collection',
    },
    tags: [],
    fields: [
        {
            name: 'cards',
            type: 'content-fragment',
            multiple: true,
            values: [
                '/content/dam/mas/sandbox/en_US/card-b',
                '/content/dam/mas/sandbox/en_US/card-a',
            ],
        },
        {
            name: 'compareChart',
            type: 'long-text',
            multiple: false,
            mimeType: 'text/plain',
            values: [
                '<div class="compare-chart"><div class="compare-chart-row" data-row-id="row-1"><div class="compare-chart-label">Feature</div><div class="compare-chart-cell" data-card-path="/content/dam/mas/sandbox/en_US/card-b">B</div><div class="compare-chart-cell" data-card-path="/content/dam/mas/sandbox/en_US/card-a">A</div></div></div>',
            ],
        },
        {
            name: 'label',
            type: 'text',
            multiple: false,
            values: ['Compare'],
        },
    ],
    references: [
        createCardReference('a', 'Card A'),
        createCardReference('a', 'Card A duplicate'),
        createCardReference('b', 'Card B'),
    ],
});

describe('recreate-compare-chart-from-json', () => {
    it('dedupes references by path', () => {
        const result = dedupeReferencesByPath([
            createCardReference('a', 'Card A'),
            createCardReference('a', 'Card A duplicate'),
            createCardReference('b', 'Card B'),
        ]);

        expect(result).to.have.length(2);
        expect(result.map((reference) => reference.path)).to.deep.equal([
            '/content/dam/mas/sandbox/en_US/card-a',
            '/content/dam/mas/sandbox/en_US/card-b',
        ]);
    });

    it('orders card fragments by the collection cards field', () => {
        const result = getOrderedCardFragments(createCollectionFragment());
        expect(result.map((reference) => reference.path)).to.deep.equal([
            '/content/dam/mas/sandbox/en_US/card-b',
            '/content/dam/mas/sandbox/en_US/card-a',
        ]);
    });

    it('rewrites compareChart card paths', () => {
        const rewritten = rewriteCompareChartCardPaths(
            createCollectionFragment().fields[1].values[0],
            new Map([
                [
                    '/content/dam/mas/sandbox/en_US/card-b',
                    '/content/dam/mas/prod/en_US/card-b',
                ],
                [
                    '/content/dam/mas/sandbox/en_US/card-a',
                    '/content/dam/mas/prod/en_US/card-a',
                ],
            ]),
        );

        expect(rewritten).to.include('/content/dam/mas/prod/en_US/card-b');
        expect(rewritten).to.include('/content/dam/mas/prod/en_US/card-a');
        expect(rewritten).to.not.include('/content/dam/mas/sandbox/en_US/card-b');
    });

    it('builds the recreation plan from the collection payload', () => {
        const result = buildRecreationPlan(createCollectionFragment());

        expect(result.cardTargetPaths).to.deep.equal([
            '/content/dam/mas/sandbox/en_US/card-b',
            '/content/dam/mas/sandbox/en_US/card-a',
        ]);
        expect(result.collectionTargetPath).to.equal(
            '/content/dam/mas/sandbox/en_US/test-compare-chart',
        );
        expect(result.collectionShellPayload.fields.map((field) => field.name)).to.deep.equal([
            'label',
        ]);
    });

    it('builds a collection save payload with rewritten card paths', () => {
        const payload = buildCollectionSavePayload(
            { id: 'new-collection-id' },
            createCollectionFragment(),
            new Map([
                [
                    '/content/dam/mas/sandbox/en_US/card-b',
                    '/content/dam/mas/prod/en_US/card-b',
                ],
                [
                    '/content/dam/mas/sandbox/en_US/card-a',
                    '/content/dam/mas/prod/en_US/card-a',
                ],
            ]),
        );

        expect(payload.id).to.equal('new-collection-id');
        expect(payload.fields.find((field) => field.name === 'cards').values).to.deep.equal([
            '/content/dam/mas/prod/en_US/card-b',
            '/content/dam/mas/prod/en_US/card-a',
        ]);
        expect(
            payload.fields.find((field) => field.name === 'compareChart').values[0],
        ).to.include('/content/dam/mas/prod/en_US/card-b');
    });
});
