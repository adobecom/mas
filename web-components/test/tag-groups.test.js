import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import {
    parseTagFilter,
    matchesTagGroups,
    normalizeCheckboxGroups,
    cardFilterTags,
    tagLabel,
} from '../src/tag-groups.js';

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

        it('resolves tag labels, falling back past coll-tag-filter', () => {
            const settings = {
                tagLabels: { individual: 'For one', team: 'coll-tag-filter-x' },
            };
            expect(tagLabel('individual', settings)).to.equal('For one');
            expect(tagLabel('team', settings)).to.equal('Team');
            expect(tagLabel('web', undefined)).to.equal('web');
        });

        it('normalizes author JSON into sidenav groups', () => {
            const json = JSON.stringify([
                {
                    title: 'Pricing',
                    single: true,
                    tags: ['mas:pricing/individual', 'mas:pricing/team'],
                },
            ]);
            const [group] = normalizeCheckboxGroups(json, {
                tagLabels: { individual: 'For one' },
            });
            expect(group.deeplink).to.equal('pricing');
            expect(group.single).to.be.true;
            expect(group.checkboxes).to.deep.equal([
                { name: 'individual', label: 'For one' },
                { name: 'team', label: 'team' },
            ]);
        });

        it("scopes a card's tags to the group namespaces", () => {
            const tags = ['mas:pricing/individual', 'mas:region/us', 'bare'];
            expect(cardFilterTags(tags, new Set(['pricing']))).to.deep.equal([
                'pricing:individual',
            ]);
            expect(
                cardFilterTags(undefined, new Set(['pricing'])),
            ).to.deep.equal([]);
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
