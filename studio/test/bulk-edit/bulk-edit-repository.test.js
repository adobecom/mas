import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import { trackPendingProject } from '../../src/common/utils/project-list-utils.js';
import {
    buildBulkEditReplaceRequest,
    getBulkEditProjectsPath,
    isBulkEditProjectTitleTaken,
    isValidBulkEditProjectTitle,
    loadBulkEditProjects,
} from '../../src/bulk-edit/bulk-edit-repository.js';

describe('buildBulkEditReplaceRequest', () => {
    let sandbox;
    let meta;
    let storedToken;
    let ims;
    let previousIms;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        meta = document.createElement('meta');
        meta.name = 'io-base-url';
        meta.content = 'https://14257-masstudio-stage.adobeioruntime.net/api/v1/web/MerchAtScaleStudio';
        document.head.append(meta);
        storedToken = sandbox.stub(sessionStorage, 'getItem').withArgs('masAccessToken').returns('stored-token');
        ims = sandbox.stub().returns({ token: 'ims-token' });
        previousIms = Object.getOwnPropertyDescriptor(window, 'adobeIMS');
        Object.defineProperty(window, 'adobeIMS', { configurable: true, value: { getAccessToken: ims } });
    });

    afterEach(() => {
        meta.remove();
        sandbox.restore();
        if (previousIms) Object.defineProperty(window, 'adobeIMS', previousIms);
        else delete window.adobeIMS;
    });

    it('prepares an authenticated dry-run request using the configured IO deployment without sending it', () => {
        const fetch = sandbox.stub(window, 'fetch');
        const request = buildBulkEditReplaceRequest('find-job-id');
        expect(request).to.deep.equal({
            url: `${meta.content}/bulk-edit-replace`,
            init: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer stored-token',
                    'x-gw-ims-org-id': '3B962FB55F5F922E0A495C88',
                },
                body: JSON.stringify({ findJobId: 'find-job-id', dryRun: true }),
            },
        });
        expect(ims.called).to.be.false;
        expect(fetch.called).to.be.false;
    });

    it('falls back to the IMS token when there is no session token', () => {
        storedToken.returns(null);
        const { init } = buildBulkEditReplaceRequest('find-job-id');
        expect(init.headers.Authorization).to.equal('Bearer ims-token');
    });

    it('prepares live mode only when explicitly requested', () => {
        const { init } = buildBulkEditReplaceRequest('find-job-id', { dryRun: false });
        expect(JSON.parse(init.body)).to.deep.equal({ findJobId: 'find-job-id', dryRun: false });
    });

    it('reports a missing backend Find job ID', () => {
        expect(() => buildBulkEditReplaceRequest('')).to.throw('A completed backend Find job ID is required.');
    });

    it('reports missing IO configuration', () => {
        meta.remove();
        expect(() => buildBulkEditReplaceRequest('find-job-id')).to.throw('Studio IO base URL is not configured.');
    });

    it('reports missing credentials', () => {
        storedToken.returns(null);
        ims.returns(undefined);
        expect(() => buildBulkEditReplaceRequest('find-job-id')).to.throw('An IMS access token is required');
    });
});

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
    for (const title of ['Spring sale-MWPW-123456', 'a-MWPW-1', 'Q3 promo - CC-MWPW-191299', 'Spring sale-DOTCOM-123456']) {
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
        'Spring sale-dotcom-1',
        'Spring sale-JIRA-1',
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
