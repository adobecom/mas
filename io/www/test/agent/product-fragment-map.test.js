import { expect } from 'chai';
import { resolveFragmentId } from '../../src/agent/product-fragment-map.js';

describe('resolveFragmentId', () => {
    it('resolves a known product case-insensitively with trimming', () => {
        expect(resolveFragmentId('  Photoshop ')).to.equal('9941bca0-5304-47f7-aeb3-4f638aeb8791');
        expect(resolveFragmentId('  Photoshop ', 'team')).to.equal('c2c79d69-8990-44b8-9a86-071c69e4a25a');
    });

    for (const [segment, fragmentId] of [
        ['individual', '128b6634-6631-4081-a6d9-9a2c7c003414'],
        ['team', '5c3fe2ac-0dbb-4495-9858-feac379ca19b'],
        ['edu', '2b1a6493-e03b-4803-a150-eed983094a05'],
    ]) {
        it(`returns the ${segment} default for unknown and inherited property names`, () => {
            for (const name of ['Nonexistent', 'constructor', '__proto__', 'toString']) {
                expect(resolveFragmentId(name, segment)).to.equal(fragmentId);
            }
        });
    }

    it('returns the segment default when a known product has no card for that audience', () => {
        expect(resolveFragmentId('Photography', 'team')).to.equal('5c3fe2ac-0dbb-4495-9858-feac379ca19b');
        expect(resolveFragmentId('Frame.io')).to.equal('128b6634-6631-4081-a6d9-9a2c7c003414');
        expect(resolveFragmentId('Photoshop', 'edu')).to.equal('2b1a6493-e03b-4803-a150-eed983094a05');
    });

    it('resolves the standard and premium plans for each audience that has a card', () => {
        expect(resolveFragmentId('Creative Cloud Standard')).to.equal('a77d8129-320f-4eeb-bf51-a0836d864118');
        expect(resolveFragmentId('Adobe Firefly Standard')).to.equal('25542a46-df3d-4b6c-83dc-8fe4b8bce22b');
        expect(resolveFragmentId('Adobe Express Premium')).to.equal('b96244bb-9101-4b24-8f81-0808e7a815cf');
        expect(resolveFragmentId('Adobe Express Premium', 'team')).to.equal('e6df1626-22e1-440f-8b98-bdc8137d79f8');
        expect(resolveFragmentId('Adobe Express Premium', 'edu')).to.equal('413ea6c9-a6ac-422a-90ff-0db9ad30b7e1');
        expect(resolveFragmentId('Creative Cloud Standard', 'team')).to.equal('5c3fe2ac-0dbb-4495-9858-feac379ca19b');
    });

    it('resolves Adobe Express Free for individuals only', () => {
        expect(resolveFragmentId('Adobe Express Free')).to.equal('01e221d5-c255-4a15-a1d3-e9c12411f0dc');
        expect(resolveFragmentId('Adobe Express Free', 'team')).to.equal('5c3fe2ac-0dbb-4495-9858-feac379ca19b');
        expect(resolveFragmentId('Adobe Express Free', 'edu')).to.equal('2b1a6493-e03b-4803-a150-eed983094a05');
    });

    for (const [product, individual, team, edu] of [
        [
            'Adobe Firefly Premium',
            'c34e7581-cbe7-4c55-ae9b-3fc87408e788',
            '4d5fdc6e-00f4-4031-84c7-a94a6cca51ae',
            'de8104d3-fdf2-4587-b6ca-993506da70c6',
        ],
        [
            'Adobe Firefly Pro Plus',
            '0b47443c-f0a8-44a3-b577-7e4c7e77faf4',
            '98b10834-cff3-4f7e-9a12-05069ed03ef2',
            '5a769d77-efb2-4c1f-83a3-251fa0ff0a0c',
        ],
    ]) {
        it(`resolves ${product} for every audience`, () => {
            expect(resolveFragmentId(product)).to.equal(individual);
            expect(resolveFragmentId(product, 'team')).to.equal(team);
            expect(resolveFragmentId(product, 'edu')).to.equal(edu);
        });
    }

    it('resolves Adobe Firefly Pro for individuals and teams', () => {
        expect(resolveFragmentId('Adobe Firefly Pro')).to.equal('95c664e4-f605-41df-8f9c-4779d0ef58c5');
        expect(resolveFragmentId('Adobe Firefly Pro', 'team')).to.equal('d2721e56-7e0b-4b0b-a0fb-94f2396dd80f');
        expect(resolveFragmentId('Adobe Firefly Pro', 'edu')).to.equal('2b1a6493-e03b-4803-a150-eed983094a05');
    });
});
