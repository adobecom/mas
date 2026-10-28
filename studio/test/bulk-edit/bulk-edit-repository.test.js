import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import { trackPendingProject } from '../../src/common/utils/project-list-utils.js';
import {
    getBulkEditProjectsPath,
    isBulkEditProjectTitleTaken,
    isValidBulkEditProjectTitle,
    loadBulkEditProjects,
} from '../../src/bulk-edit/bulk-edit-repository.js';

describe('loadBulkEditProjects', () => {
    let initialSearch;

    beforeEach(() => {
        initialSearch = Store.search.get();
        Store.search.set({ ...initialSearch, path: 'sandbox' });
    });

    afterEach(() => {
        Store.search.set(initialSearch);
        Store.bulkEditProjects.list.data.set([]);
        Store.bulkEditProjects.list.data.removeMeta('pendingProjects');
    });

    it('keeps a pending project of the active surface first until search returns it', async () => {
        const path = getBulkEditProjectsPath();
        const pending = new FragmentStore(new Fragment({ id: 'new', path: `${path}/new`, fields: [] }));
        trackPendingProject(Store.bulkEditProjects.list.data, pending);
        const repository = {
            searchFragmentList: sinon.stub().resolves([{ id: 'a', path: `${path}/a`, fields: [] }]),
            processError: sinon.stub(),
        };
        await loadBulkEditProjects(repository);
        expect(repository.searchFragmentList.firstCall.args[0].path).to.equal(path);
        expect(Store.bulkEditProjects.list.data.get().map((store) => store.id)).to.deep.equal(['new', 'a']);
        expect(Store.bulkEditProjects.list.data.get()[0]).to.equal(pending);
    });
});

describe('getBulkEditProjectsPath', () => {
    let initialSearch;

    beforeEach(() => {
        initialSearch = Store.search.get();
    });

    afterEach(() => {
        Store.search.set(initialSearch);
    });

    it('points to the surface folder under the root bulk-edit-projects folder', () => {
        Store.search.set({ ...initialSearch, path: 'acom-cc' });
        expect(getBulkEditProjectsPath()).to.equal('/content/dam/mas/bulk-edit-projects/acom-cc');
    });

    it('falls back to sandbox when no surface is selected', () => {
        Store.search.set({ ...initialSearch, path: undefined });
        expect(getBulkEditProjectsPath()).to.equal('/content/dam/mas/bulk-edit-projects/sandbox');
    });

    it('falls back to sandbox when the surface is unknown', () => {
        Store.search.set({ ...initialSearch, path: 'not-a-surface' });
        expect(getBulkEditProjectsPath()).to.equal('/content/dam/mas/bulk-edit-projects/sandbox');
    });
});

describe('isValidBulkEditProjectTitle', () => {
    for (const title of ['Spring sale-MWPW-123456', 'a-MWPW-1', 'Q3 promo - CC-MWPW-191299']) {
        it(`accepts "${title}"`, () => {
            expect(isValidBulkEditProjectTitle(title)).to.be.true;
        });
    }

    for (const title of [
        '',
        'Spring sale',
        'MWPW-123456',
        '-MWPW-1',
        'Spring sale-MWPW-',
        'Spring sale-mwpw-1',
        'Sale-MWPW-12a',
    ]) {
        it(`rejects "${title}"`, () => {
            expect(isValidBulkEditProjectTitle(title)).to.be.false;
        });
    }
});

describe('isBulkEditProjectTitleTaken', () => {
    const projectStore = (id, title) => ({ get: () => ({ id, getFieldValue: () => title }) });

    beforeEach(() => {
        Store.bulkEditProjects.list.data.set([projectStore('p1', 'Spring sale-MWPW-1')]);
    });

    afterEach(() => {
        Store.bulkEditProjects.list.data.set([]);
    });

    it('detects a title used by another project, ignoring case', () => {
        expect(isBulkEditProjectTitleTaken('spring SALE-MWPW-1')).to.be.true;
    });

    it('ignores the project being edited', () => {
        expect(isBulkEditProjectTitleTaken('Spring sale-MWPW-1', 'p1')).to.be.false;
    });

    it('accepts a title not used by any project', () => {
        expect(isBulkEditProjectTitleTaken('Summer sale-MWPW-1')).to.be.false;
    });
});
