import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import { parseTagFilter, matchesTagGroups } from '../src/tag-groups.js';

runTests(() => {
    describe('author-defined tag groups', () => {
        const groups = [{ deeplink: 'pricing' }, { deeplink: 'type' }];

        it('splits mas:ns/leaf into [ns, leaf]', () => {
            expect(parseTagFilter('mas:pricing/individual')).to.deep.equal([
                'pricing',
                'individual',
            ]);
            expect(parseTagFilter('bare')).to.deep.equal([null, null]);
        });

        it('keeps a card when a group has no active selection', () => {
            expect(matchesTagGroups(['pricing:team'], groups, {})).to.be.true;
        });

        it('ANDs across groups, ORs options within a group', () => {
            const card = ['pricing:individual', 'type:desktop'];
            expect(
                matchesTagGroups(card, groups, { pricing: 'individual,team' }),
            ).to.be.true;
            expect(matchesTagGroups(card, groups, { type: 'web' })).to.be.false;
            expect(
                matchesTagGroups(card, groups, {
                    pricing: 'individual',
                    type: 'desktop',
                }),
            ).to.be.true;
        });
    });
});
