import { expect } from '@esm-bundle/chai';
import { nothing, render } from 'lit';
import { renderFragmentStatusCell, getItemTypeLabel, getItemTitle } from '../../../src/common/utils/render-utils.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, FRAGMENT_STATUS } from '../../../src/constants.js';

describe('render-utils', () => {
    describe('renderFragmentStatusCell', () => {
        it('returns nothing when status is missing', () => {
            expect(renderFragmentStatusCell()).to.equal(nothing);
            expect(renderFragmentStatusCell('')).to.equal(nothing);
        });

        it('renders published status with green class', () => {
            const container = document.createElement('div');
            render(renderFragmentStatusCell(FRAGMENT_STATUS.PUBLISHED), container);
            const dot = container.querySelector('.status-dot');
            expect(dot?.classList.contains('green')).to.be.true;
            expect(container.textContent).to.include('Published');
        });

        it('renders modified status with blue class', () => {
            const container = document.createElement('div');
            render(renderFragmentStatusCell(FRAGMENT_STATUS.MODIFIED), container);
            const dot = container.querySelector('.status-dot');
            expect(dot?.classList.contains('blue')).to.be.true;
            expect(container.textContent).to.include('Modified');
        });
    });

    describe('getItemTypeLabel', () => {
        it('returns Unknown for falsy item', () => {
            expect(getItemTypeLabel(null)).to.equal('Unknown');
            expect(getItemTypeLabel(undefined)).to.equal('Unknown');
        });

        it('returns Grouped variation when path is a grouped variation path', () => {
            expect(getItemTypeLabel({ path: '/content/x/pzn/y/var' })).to.equal('Grouped variation');
        });

        it('returns Placeholder for dictionary model', () => {
            expect(getItemTypeLabel({ model: { path: '/conf/.../dictionary/foo' } })).to.equal('Placeholder');
        });

        it('returns Collection for collection model', () => {
            expect(getItemTypeLabel({ model: { path: COLLECTION_MODEL_PATH } })).to.equal('Collection');
        });

        it('returns Default for card model', () => {
            expect(getItemTypeLabel({ model: { path: CARD_MODEL_PATH } })).to.equal('Default');
        });
    });

    describe('getItemTitle', () => {
        it('returns dash for falsy item', () => {
            expect(getItemTitle(null)).to.equal('-');
        });

        it('truncates long card titles', () => {
            const long = 'a'.repeat(60);
            expect(getItemTitle({ model: { path: CARD_MODEL_PATH }, title: long }).length).to.be.lessThan(long.length);
            expect(getItemTitle({ model: { path: CARD_MODEL_PATH }, title: long })).to.include('...');
        });

        it('uses key for placeholder-like items', () => {
            expect(getItemTitle({ key: 'my-key' })).to.equal('my-key');
        });

        it('uses getFieldValue when present', () => {
            expect(
                getItemTitle({
                    getFieldValue: (f) => (f === 'key' ? 'from-field' : ''),
                }),
            ).to.equal('from-field');
        });
    });
});
