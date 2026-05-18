import { expect } from '@open-wc/testing';
import { getProjectField, getProjectFieldList } from '../../src/bulk-publish/bulk-publish-utils.js';

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

    it('returns undefined (not fallback) when field value is null', () => {
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
