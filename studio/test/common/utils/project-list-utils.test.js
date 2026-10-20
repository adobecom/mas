import { expect } from '@open-wc/testing';
import { render } from 'lit';
import sinon from 'sinon';
import {
    getProjectField,
    getProjectFieldList,
    getSearchSurface,
    formatProjectDate,
    renderSkeletonRows,
    loadProjectList,
} from '../../../src/common/utils/project-list-utils.js';
import { ReactiveStore } from '../../../src/reactivity/reactive-store.js';

describe('getProjectField()', () => {
    it('reads value via getFieldValue() when available', () => {
        const project = { getFieldValue: (k) => (k === 'title' ? 'Hello' : undefined) };
        expect(getProjectField(project, 'title')).to.equal('Hello');
    });

    it('falls back to plain property when getFieldValue is absent', () => {
        const project = { title: 'Plain' };
        expect(getProjectField(project, 'title')).to.equal('Plain');
    });

    it('unwraps store wrapper via .value before reading', () => {
        const project = { value: { getFieldValue: (k) => (k === 'status' ? 'Draft' : undefined) } };
        expect(getProjectField(project, 'status')).to.equal('Draft');
    });

    it('unwraps .value and falls back to property when getFieldValue absent', () => {
        const project = { value: { status: 'Published' } };
        expect(getProjectField(project, 'status')).to.equal('Published');
    });

    it('returns fallback when field is undefined and no property exists', () => {
        const project = { getFieldValue: () => undefined };
        expect(getProjectField(project, 'missing', 'default')).to.equal('default');
    });

    it('returns fallback when field value is null', () => {
        const project = { getFieldValue: () => null };
        expect(getProjectField(project, 'field', 'default')).to.equal('default');
    });

    it('returns undefined when no fallback and field missing', () => {
        expect(getProjectField({}, 'nope')).to.equal(undefined);
    });
});

describe('getProjectFieldList()', () => {
    it('reads array via getFieldValues() when available', () => {
        const project = { getFieldValues: (k) => (k === 'locales' ? ['en', 'ja'] : []) };
        expect(getProjectFieldList(project, 'locales')).to.deep.equal(['en', 'ja']);
    });

    it('falls back to plain array property when getFieldValues is absent', () => {
        const project = { locales: ['fr', 'de'] };
        expect(getProjectFieldList(project, 'locales')).to.deep.equal(['fr', 'de']);
    });

    it('unwraps store wrapper via .value before reading', () => {
        const project = { value: { getFieldValues: (k) => (k === 'locales' ? ['ko'] : []) } };
        expect(getProjectFieldList(project, 'locales')).to.deep.equal(['ko']);
    });

    it('returns empty array when field is missing entirely', () => {
        expect(getProjectFieldList({}, 'locales')).to.deep.equal([]);
    });
});

describe('formatProjectDate()', () => {
    it('returns — for null', () => {
        expect(formatProjectDate(null)).to.equal('—');
    });

    it('returns — for an invalid date string', () => {
        expect(formatProjectDate('not-a-date')).to.equal('—');
    });

    it('formats a valid date', () => {
        expect(formatProjectDate('2026-01-15T10:00:00Z')).to.include('2026');
    });
});

describe('renderSkeletonRows()', () => {
    it('renders five rows with the requested number of cells', () => {
        const el = document.createElement('div');
        render(renderSkeletonRows(3), el);
        expect(el.querySelectorAll('sp-table-row')).to.have.lengthOf(5);
        expect(el.querySelectorAll('sp-table-row:first-child .skeleton-table-cell')).to.have.lengthOf(3);
    });
});

describe('loadProjectList()', () => {
    const createList = () => ({ data: new ReactiveStore([]), loading: new ReactiveStore(false) });
    const createRepository = (searchFragmentList) => ({ searchFragmentList, processError: sinon.stub() });

    it('stores the found fragments as fragment stores', async () => {
        const list = createList();
        const repository = createRepository(sinon.stub().resolves([{ id: 'f1', fields: [] }]));
        await loadProjectList(repository, { path: '/p', list, errorMessage: 'err' });
        expect(list.data.get()[0].get().id).to.equal('f1');
    });

    it('searches the given path, newest first', async () => {
        const repository = createRepository(sinon.stub().resolves([]));
        const abortController = new AbortController();
        await loadProjectList(repository, { path: '/p', list: createList(), abortController, errorMessage: 'err' });
        expect(repository.searchFragmentList.firstCall.args).to.deep.equal([
            { path: '/p', sort: [{ on: 'modifiedOrCreated', order: 'DESC' }] },
            50,
            abortController,
        ]);
    });

    it('reports errors and clears the loading flag', async () => {
        const list = createList();
        const error = new Error('boom');
        const repository = createRepository(sinon.stub().rejects(error));
        await loadProjectList(repository, { path: '/p', list, errorMessage: 'err' });
        expect(repository.processError.calledWith(error, 'err')).to.be.true;
        expect(list.loading.get()).to.be.false;
    });

    it('keeps loading while a newer request is pending after the previous one is aborted', async () => {
        const list = createList();
        const abortError = new DOMException('aborted', 'AbortError');
        let resolveSecond;
        const searchFragmentList = sinon.stub();
        searchFragmentList
            .onFirstCall()
            .callsFake(
                (options, limit, controller) =>
                    new Promise((resolve, reject) => controller.signal.addEventListener('abort', () => reject(abortError))),
            );
        searchFragmentList.onSecondCall().returns(
            new Promise((resolve) => {
                resolveSecond = resolve;
            }),
        );
        const repository = createRepository(searchFragmentList);
        const first = new AbortController();
        const firstLoad = loadProjectList(repository, { path: '/a', list, abortController: first, errorMessage: 'err' });
        first.abort();
        const second = new AbortController();
        const secondLoad = loadProjectList(repository, { path: '/b', list, abortController: second, errorMessage: 'err' });
        await firstLoad;
        expect(list.loading.get()).to.be.true;
        expect(repository.processError.called).to.be.false;
        resolveSecond([{ id: 'b1', fields: [] }]);
        await secondLoad;
        expect(list.loading.get()).to.be.false;
        expect(list.data.get()[0].get().id).to.equal('b1');
    });

    it('does not publish results of a request aborted after it resolved', async () => {
        const list = createList();
        const abortController = new AbortController();
        const repository = createRepository(
            sinon.stub().callsFake(async () => {
                abortController.abort();
                return [{ id: 'stale', fields: [] }];
            }),
        );
        await loadProjectList(repository, { path: '/p', list, abortController, errorMessage: 'err' });
        expect(list.data.get()).to.deep.equal([]);
        expect(list.loading.get()).to.be.true;
    });
});

describe('getSearchSurface()', () => {
    it('returns the lowercased first segment of a known surface path', () => {
        expect(getSearchSurface('ACOM-CC/en_US')).to.equal('acom-cc');
    });

    it('falls back to sandbox when the path is empty', () => {
        expect(getSearchSurface(undefined)).to.equal('sandbox');
    });

    it('falls back to sandbox when the surface is unknown', () => {
        expect(getSearchSurface('../../etc')).to.equal('sandbox');
    });
});
