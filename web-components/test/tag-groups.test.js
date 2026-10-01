import { expect } from './utilities.js';

import {
    parseTagFilter,
    matchesTagGroups,
    groupTagFilters,
    cardFilterTags,
    tagLabel,
} from '../src/tag-groups.js';

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

    it('keeps one namespace as a single group with the authored title', () => {
        const result = groupTagFilters(
            ['mas:types/desktop', 'mas:types/web'],
            'Types',
            { tagLabels: { desktop: 'Desktop', web: 'Web' } },
        );
        expect(result).to.have.length(1);
        expect(result[0]).to.deep.include({
            title: 'Types',
            deeplink: 'types',
        });
        expect(result[0].checkboxes).to.deep.equal([
            { name: 'desktop', label: 'Desktop' },
            { name: 'web', label: 'Web' },
        ]);
    });

    it('splits multiple namespaces into groups, title from the tag', () => {
        const result = groupTagFilters(
            ['mas:types/desktop', 'mas:pricing/individual'],
            'Types',
            {},
        );
        expect(result.map((g) => g.deeplink)).to.deep.equal([
            'types',
            'pricing',
        ]);
        // title falls back to the namespace when no label placeholder
        expect(result[1].title).to.equal('pricing');
    });

    it("scopes a card's tags to the group namespaces", () => {
        const tags = ['mas:pricing/individual', 'mas:region/us', 'bare'];
        expect(cardFilterTags(tags, new Set(['pricing']))).to.deep.equal([
            'pricing:individual',
        ]);
        expect(cardFilterTags(undefined, new Set(['pricing']))).to.deep.equal(
            [],
        );
    });

    it('ANDs across groups, ORs options within a group', () => {
        const card = ['pricing:individual', 'type:desktop'];
        expect(matchesTagGroups(card, groups, { pricing: 'individual,team' }))
            .to.be.true;
        expect(matchesTagGroups(card, groups, { type: 'web' })).to.be.false;
        expect(
            matchesTagGroups(card, groups, {
                pricing: 'individual',
                type: 'desktop',
            }),
        ).to.be.true;
    });
});
