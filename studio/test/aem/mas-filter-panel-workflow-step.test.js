import { expect, fixture, html } from '@open-wc/testing';
import '../../src/swc.js';
import '../../src/aem/mas-filter-panel.js';
import '../../src/aem/aem-tag-picker-field.js';
import Store from '../../src/store.js';
import { WORKFLOW_STEP_OPTIONS } from '../../src/constants.js';
import { resetTagCache, seedTagCache } from '../helpers/tag-cache.js';

const MAS_TAG_NAMESPACE = '/content/cq:tags/mas';

const seedWorkflowStepTaxonomy = () => {
    const entries = WORKFLOW_STEP_OPTIONS.map(({ id, title }) => {
        const path = `${MAS_TAG_NAMESPACE}/workflow-step/${id}`;
        return [path, { path, name: id, title }];
    });
    seedTagCache(MAS_TAG_NAMESPACE, entries);
};

describe('MasFilterPanel workflow step tags', () => {
    let originalFilters;

    beforeEach(() => {
        originalFilters = Store.filters.get();
        Store.filters.set({ tags: '' });
        resetTagCache(MAS_TAG_NAMESPACE);
        seedWorkflowStepTaxonomy();
    });

    afterEach(() => {
        resetTagCache(MAS_TAG_NAMESPACE);
        Store.filters.set(originalFilters);
    });

    it('registers workflow-step in the tag filter dictionary and offers exactly the 8 fixture values', async () => {
        const el = await fixture(html`<mas-filter-panel></mas-filter-panel>`);
        await el.updateComplete;

        expect(el.tagsByType).to.have.property('workflow-step').that.deep.equals([]);

        const picker = el.shadowRoot.querySelector('aem-tag-picker-field[top="workflow-step"]');
        expect(picker, 'workflow step picker should exist').to.exist;
        expect(picker.getAttribute('label')).to.equal('Workflow Step');

        await picker.loadTags();
        await picker.updateComplete;

        expect(picker.flatTags.sort()).to.deep.equal(
            WORKFLOW_STEP_OPTIONS.map(({ id }) => `${MAS_TAG_NAMESPACE}/workflow-step/${id}`).sort(),
        );
    });

    it('classifies two workflow-step tags on the same card under workflow-step and keeps both', async () => {
        Store.filters.set({
            tags: 'mas:workflow-step/email,mas:workflow-step/payment',
        });

        const el = await fixture(html`<mas-filter-panel></mas-filter-panel>`);
        await el.updateComplete;

        expect(el.tagsByType['workflow-step']).to.have.lengthOf(2);
        const paths = el.tagsByType['workflow-step'].map((tag) => tag.path);
        expect(paths).to.include.members([
            `${MAS_TAG_NAMESPACE}/workflow-step/email`,
            `${MAS_TAG_NAMESPACE}/workflow-step/payment`,
        ]);
        el.tagsByType['workflow-step'].forEach((tag) => expect(tag.top).to.equal('workflow-step'));
    });

    it('defaults workflow-step to no constraint while other tag types are still classified', async () => {
        Store.filters.set({
            tags: 'mas:offer_type/base',
        });

        const el = await fixture(html`<mas-filter-panel></mas-filter-panel>`);
        await el.updateComplete;

        expect(el.tagsByType['workflow-step']).to.deep.equal([]);
        expect(el.tagsByType.offer_type).to.have.lengthOf(1);
    });
});
