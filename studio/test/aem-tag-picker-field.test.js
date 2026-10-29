import { expect, fixture, html } from '@open-wc/testing';
import '../src/swc.js';
import '../src/aem/aem-tag-picker-field.js';
import { TAG_COMPARE_CHART, TAG_COMPARE_CHART_PATH, TAG_MERCH_CARD, TAG_MERCH_CARD_COLLECTION } from '../src/constants.js';
import { blockTagCacheLoading, resetTagCache, seedTagCache } from './helpers/tag-cache.js';

describe('AemTagPickerField', () => {
    const namespace = '/content/cq:tags/mas';
    const contentTypePath = (tag) => `/content/cq:tags/${tag.replace(':', '/')}`;

    beforeEach(() => {
        resetTagCache(namespace);
        seedTagCache(namespace, [
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
        ]);
    });

    afterEach(() => {
        resetTagCache(namespace);
    });

    for (const { name, top, excludeCountryTags, expectedTags } of [
        {
            name: 'includes country tags in combined locale and personalization options by default',
            top: 'locale,pzn',
            excludeCountryTags: false,
            expectedTags: ['locale/pl_PL', 'pzn/country/PL', 'pzn/smb'],
        },
        {
            name: 'excludes country tags from combined options when explicitly requested',
            top: 'locale,pzn',
            excludeCountryTags: true,
            expectedTags: ['locale/pl_PL', 'pzn/smb'],
        },
        {
            name: 'excludes country tags from personalization-only options when explicitly requested',
            top: 'pzn',
            excludeCountryTags: true,
            expectedTags: ['pzn/smb'],
        },
    ]) {
        it(name, async () => {
            const tagNames = ['locale/pl_PL', 'pzn/smb', 'pzn/country', 'pzn/country/PL'];
            seedTagCache(
                namespace,
                tagNames.map((name) => {
                    const path = `${namespace}/${name}`;
                    return [path, { name: name.split('/').pop(), title: name, path }];
                }),
            );
            const el = await fixture(html`
                <aem-tag-picker-field
                    namespace=${namespace}
                    top=${top}
                    ?exclude-country-tags=${excludeCountryTags}
                    selection="checkbox-tags"
                    display-value
                    multiple
                ></aem-tag-picker-field>
            `);

            await el.loadTags();
            await el.updateComplete;

            expect(el.flatTags).to.have.members(expectedTags.map((tag) => `${namespace}/${tag}`));
        });
    }

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
        blockTagCacheLoading(namespace);

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
