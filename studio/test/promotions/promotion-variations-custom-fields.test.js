import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    mergeMissingCustomFieldLabels,
    propagateCustomFieldsToPromoVariations,
} from '../../src/promotions/promotion-variations.js';

describe('promotion-variations custom fields', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    const createAemMock = (overrides = {}) => ({
        sites: {
            cf: {
                fragments: {
                    getByPath: sandbox.stub(),
                    save: sandbox.stub().resolves({}),
                    ...overrides.fragments,
                },
            },
        },
    });

    describe('mergeMissingCustomFieldLabels', () => {
        it('returns null when the variation already has every default label', () => {
            const result = mergeMissingCustomFieldLabels(
                { customFieldLabels: ['Field A', 'Field B'] },
                { customFieldLabels: ['Field A', 'Field B'], customFields: ['value a', 'value b'] },
            );
            expect(result).to.equal(null);
        });

        it('appends only missing labels with empty values, keeping existing labels/values and their indices', () => {
            const result = mergeMissingCustomFieldLabels(
                { customFieldLabels: ['Field A', 'Field B'] },
                { customFieldLabels: ['Field A'], customFields: ['value a'] },
            );
            expect(result).to.deep.equal({
                customFieldLabels: ['Field A', 'Field B'],
                customFields: ['value a', ''],
            });
        });

        it('leaves an already-diverged label untouched (no rewrite)', () => {
            const result = mergeMissingCustomFieldLabels(
                { customFieldLabels: ['Field A'] },
                { customFieldLabels: ['Renamed Field A'], customFields: ['value a'] },
            );
            expect(result).to.deep.equal({
                customFieldLabels: ['Renamed Field A', 'Field A'],
                customFields: ['value a', ''],
            });
        });

        it('returns null when the default fragment has no custom field labels', () => {
            const result = mergeMissingCustomFieldLabels({ customFieldLabels: [] }, { customFieldLabels: [] });
            expect(result).to.equal(null);
        });
    });

    describe('propagateCustomFieldsToPromoVariations', () => {
        const defaultFragmentData = {
            fields: [
                { name: 'customFieldLabels', values: ['Field A', 'Field B'] },
                { name: 'customFields', values: ['value a', 'value b'] },
            ],
        };

        it('saves only variations that are missing a default label', async () => {
            const upToDateVariation = {
                id: 'up-to-date',
                path: '/content/dam/mas/sandbox/en_US/promotions/black-friday/up-to-date',
                fields: [
                    { name: 'customFieldLabels', values: ['Field A', 'Field B'] },
                    { name: 'customFields', values: ['value a', 'value b'] },
                ],
            };
            const missingFieldVariation = {
                id: 'missing-field',
                path: '/content/dam/mas/sandbox/en_US/promotions/black-friday/missing-field',
                fields: [
                    { name: 'customFieldLabels', values: ['Field A'] },
                    { name: 'customFields', values: ['value a'] },
                ],
            };
            const getByPath = sandbox.stub();
            getByPath.withArgs(upToDateVariation.path).resolves(upToDateVariation);
            getByPath.withArgs(missingFieldVariation.path).resolves(missingFieldVariation);
            const save = sandbox.stub().resolves({});
            const aem = createAemMock({ fragments: { getByPath, save } });

            const { updatedPaths, failures } = await propagateCustomFieldsToPromoVariations(aem, defaultFragmentData, [
                upToDateVariation.path,
                missingFieldVariation.path,
            ]);

            expect(updatedPaths).to.deep.equal([missingFieldVariation.path]);
            expect(failures).to.deep.equal([]);
            expect(save.calledOnce).to.be.true;
            const [savedFragment] = save.firstCall.args;
            expect(savedFragment.id).to.equal('missing-field');
            const savedLabels = savedFragment.fields.find((field) => field.name === 'customFieldLabels');
            const savedValues = savedFragment.fields.find((field) => field.name === 'customFields');
            expect(savedLabels.values).to.deep.equal(['Field A', 'Field B']);
            expect(savedValues.values).to.deep.equal(['value a', '']);
        });

        it('reports a failing variation instead of throwing', async () => {
            const failingPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/failing';
            const getByPath = sandbox.stub().resolves({
                id: 'failing',
                path: failingPath,
                fields: [
                    { name: 'customFieldLabels', values: [] },
                    { name: 'customFields', values: [] },
                ],
            });
            const save = sandbox.stub().rejects(new Error('save failed'));
            const aem = createAemMock({ fragments: { getByPath, save } });

            const { updatedPaths, failures } = await propagateCustomFieldsToPromoVariations(aem, defaultFragmentData, [
                failingPath,
            ]);

            expect(updatedPaths).to.deep.equal([]);
            expect(failures).to.have.lengthOf(1);
            expect(failures[0].path).to.equal(failingPath);
            expect(failures[0].error.message).to.equal('save failed');
        });

        it('does nothing when the default fragment has no custom fields', async () => {
            const aem = createAemMock();
            const result = await propagateCustomFieldsToPromoVariations(aem, { fields: [] }, ['/some/path']);
            expect(result).to.deep.equal({ updatedPaths: [], failures: [] });
            expect(aem.sites.cf.fragments.getByPath.called).to.be.false;
        });
    });
});
