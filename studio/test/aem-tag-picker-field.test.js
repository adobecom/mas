import { expect, fixture, html } from '@open-wc/testing';
import '../src/swc.js';
import '../src/aem/aem-tag-picker-field.js';
import { TAG_COMPARE_CHART, TAG_COMPARE_CHART_PATH, TAG_MERCH_CARD, TAG_MERCH_CARD_COLLECTION } from '../src/constants.js';
import { setNamespaceCache } from '../src/aem/tag-cache.js';

describe('AemTagPickerField', () => {
    const namespace = '/content/cq:tags/mas';
    const contentTypePath = (tag) => `/content/cq:tags/${tag.replace(':', '/')}`;

    beforeEach(() => {
        setNamespaceCache(
            namespace,
            new Map([
                [
                    contentTypePath(TAG_MERCH_CARD),
                    {
                        name: 'merch-card',
                        title: 'Merch Card',
                        path: contentTypePath(TAG_MERCH_CARD),
                    },
                ],
                [
                    contentTypePath(TAG_MERCH_CARD_COLLECTION),
                    {
                        name: 'merch-card-collection',
                        title: 'Merch Card Collection',
                        path: contentTypePath(TAG_MERCH_CARD_COLLECTION),
                    },
                ],
            ]),
        );
    });

    it('adds Compare chart as a local content type option and resolves selected title', async () => {
        const el = await fixture(html`
            <aem-tag-picker-field
                namespace=${namespace}
                top="studio/content-type"
                selection="checkbox"
                value=${TAG_COMPARE_CHART}
            ></aem-tag-picker-field>
        `);

        await el.loadTags();
        await el.updateComplete;

        expect(el.flatTags).to.include(TAG_COMPARE_CHART_PATH);
        expect(el.selectedTags[0]).to.deep.include({
            name: 'compare-chart',
            title: 'Compare chart',
            path: TAG_COMPARE_CHART_PATH,
        });
    });

    it('returns no selected tags while namespace tags are still loading', async () => {
        setNamespaceCache(namespace, new Promise(() => {}));

        const el = await fixture(html`
            <aem-tag-picker-field
                namespace=${namespace}
                top="studio/content-type"
                selection="checkbox"
                value=${TAG_COMPARE_CHART}
            ></aem-tag-picker-field>
        `);

        expect(el.selectedTags).to.deep.equal([]);
    });
});
