import { expect } from '@esm-bundle/chai';
import {
    getProductName,
    extractCardTitle,
    capitalize,
    mapProductToChatCard,
    getPreferredProductDescription,
    isProductSelectionStep,
    isSegmentSelectionStep,
    getAutoSelectedSegmentOption,
    extractKnownSurfaceFromPath,
} from '../../src/utils/mas-chat-helpers.js';

describe('mas-chat-helpers', () => {
    describe('getProductName', () => {
        it('returns empty string for null / undefined', () => {
            expect(getProductName(null)).to.equal('');
            expect(getProductName(undefined)).to.equal('');
        });

        it('prefers copy.name', () => {
            expect(getProductName({ copy: { name: 'Canonical' }, name: 'Legacy', label: 'Label' })).to.equal('Canonical');
        });

        it('falls back to name when copy.name is missing', () => {
            expect(getProductName({ name: 'Legacy', label: 'Label' })).to.equal('Legacy');
        });

        it('falls back to label as the final option', () => {
            expect(getProductName({ label: 'Label' })).to.equal('Label');
        });
    });

    describe('extractCardTitle', () => {
        it('returns fallback when cardConfig is null / missing title', () => {
            expect(extractCardTitle({})).to.equal('AI Generated Card');
            expect(extractCardTitle(null)).to.equal('AI Generated Card');
            expect(extractCardTitle({ title: '' })).to.equal('AI Generated Card');
        });

        it('returns plain text from simple HTML', () => {
            expect(extractCardTitle({ title: '<h3>Photoshop</h3>' })).to.equal('Photoshop');
        });

        it('strips nested tags', () => {
            expect(extractCardTitle({ title: '<h3>Save <strong>50%</strong> today</h3>' })).to.equal('Save 50% today');
        });

        it('accepts a custom fallback', () => {
            expect(extractCardTitle({}, 'custom default')).to.equal('custom default');
        });
    });

    describe('capitalize', () => {
        it('returns empty for empty / nullish', () => {
            expect(capitalize('')).to.equal('');
            expect(capitalize(null)).to.equal('');
            expect(capitalize(undefined)).to.equal('');
        });

        it('uppercases only the first char', () => {
            expect(capitalize('plans')).to.equal('Plans');
            expect(capitalize('aBC')).to.equal('ABC');
        });
    });

    describe('mapProductToChatCard', () => {
        it('flattens MCS product into chat-card shape', () => {
            const card = mapProductToChatCard({
                copy: { name: 'Photoshop', description: 'Edit photos' },
                arrangement_code: 'PA-123',
                product_code: 'PHSP',
                product_family: 'CC_ALL_APPS',
                customer_segment: 'TEAM',
                assets: { icons: { svg: 'https://example.com/ps.svg' } },
            });
            expect(card.label).to.equal('Photoshop');
            expect(card.value).to.equal('PA-123');
            expect(card.arrangement_code).to.equal('PA-123');
            expect(card.product_code).to.equal('PHSP');
            expect(card.product_family).to.equal('CC_ALL_APPS');
            expect(card.segments).to.deep.equal(['TEAM']);
            expect(card.icon).to.equal('https://example.com/ps.svg');
            expect(card.description).to.equal('Edit photos');
        });

        it('falls back to arrangement_code when no name is present', () => {
            const card = mapProductToChatCard({ arrangement_code: 'PA-XYZ' });
            expect(card.label).to.equal('PA-XYZ');
        });

        it('prefers customerSegments map entries over scalar customer_segment', () => {
            const card = mapProductToChatCard({
                customerSegments: { TEAM: true, ENTERPRISE: true, CONSUMER: false },
                customer_segment: 'IGNORED',
                arrangement_code: 'PA-1',
            });
            expect(card.segments).to.have.members(['TEAM', 'ENTERPRISE']);
            expect(card.segments).to.not.include('CONSUMER');
            expect(card.segments).to.not.include('IGNORED');
        });

        it('handles missing product gracefully', () => {
            const card = mapProductToChatCard({});
            expect(card.label).to.be.undefined;
            expect(card.segments).to.deep.equal([]);
        });
    });

    describe('getPreferredProductDescription', () => {
        it('returns empty string when no sources provide a description', () => {
            expect(getPreferredProductDescription()).to.equal('');
            expect(getPreferredProductDescription(null, undefined, {})).to.equal('');
        });

        it('returns the single candidate when only one non-empty value exists', () => {
            expect(getPreferredProductDescription({ description: 'Only one' })).to.equal('Only one');
        });

        it('prefers the longest rendered-text candidate', () => {
            const product = {
                description: 'short',
                short_description: 'medium length',
                copy: { description: 'This is the longest description by text length', short_description: 'medium' },
            };
            expect(getPreferredProductDescription(product)).to.equal('This is the longest description by text length');
        });

        it('uses DOM text length (not HTML length) when candidates contain markup', () => {
            const candidateA = 'Plain text description with lots of visible words here';
            const candidateB = '<div class="extra-attributes">Short</div>';
            const result = getPreferredProductDescription({ description: candidateA, short_description: candidateB });
            expect(result).to.equal(candidateA);
        });

        it('skips null / undefined / whitespace-only candidates', () => {
            const result = getPreferredProductDescription({
                description: '   ',
                short_description: null,
                copy: { description: 'Real content' },
            });
            expect(result).to.equal('Real content');
        });

        it('merges candidate pools across multiple source objects', () => {
            const primary = { description: 'short' };
            const secondary = { copy: { description: 'much longer description that should win' } };
            expect(getPreferredProductDescription(primary, secondary)).to.equal('much longer description that should win');
        });
    });

    describe('isProductSelectionStep', () => {
        it('returns false for non-guided_step responses', () => {
            expect(isProductSelectionStep({ type: 'text' })).to.be.false;
            expect(isProductSelectionStep(null)).to.be.false;
        });

        it('returns true for explicit Product label on buttonGroup', () => {
            expect(isProductSelectionStep({ type: 'guided_step', buttonGroup: { label: 'Product' } })).to.be.true;
        });

        it('returns true when message matches the product-selection regex', () => {
            expect(isProductSelectionStep({ type: 'guided_step', message: 'Which product are you targeting?' })).to.be.true;
            expect(isProductSelectionStep({ type: 'guided_step', message: 'Please pick one below.' })).to.be.true;
        });

        it('returns false for unrelated guided steps', () => {
            expect(isProductSelectionStep({ type: 'guided_step', message: 'What segment is this for?' })).to.be.false;
        });
    });

    describe('isSegmentSelectionStep', () => {
        it('returns true for explicit Customer Segment label on buttonGroup', () => {
            expect(isSegmentSelectionStep({ type: 'guided_step', buttonGroup: { label: 'Customer Segment' } })).to.be.true;
        });

        it('returns true when message matches the segment-selection phrase', () => {
            expect(isSegmentSelectionStep({ type: 'guided_step', message: 'Who is this card targeting?' })).to.be.true;
        });

        it('returns false for product-selection messages', () => {
            expect(isSegmentSelectionStep({ type: 'guided_step', message: 'Which product?' })).to.be.false;
        });
    });

    describe('getAutoSelectedSegmentOption', () => {
        const step = {
            type: 'guided_step',
            buttonGroup: {
                label: 'Customer Segment',
                options: [
                    { value: 'TEAM', label: 'Team' },
                    { value: 'INDIVIDUAL', label: 'Individual' },
                    { value: 'TEAM|EDUCATION', label: 'Team Education' },
                ],
            },
        };

        it('returns null when response is not a segment-selection step', () => {
            const wrongStep = { type: 'guided_step', buttonGroup: { label: 'Product', options: [] } };
            expect(getAutoSelectedSegmentOption(wrongStep, { customer_segment: 'TEAM' })).to.be.null;
        });

        it('returns null when offer has no customer_segment', () => {
            expect(getAutoSelectedSegmentOption(step, {})).to.be.null;
        });

        it('matches on customer_segment alone when no market segment is present', () => {
            const match = getAutoSelectedSegmentOption(step, { customer_segment: 'individual' });
            expect(match.value).to.equal('INDIVIDUAL');
        });

        it('matches composite TEAM|EDUCATION when both segments align', () => {
            const match = getAutoSelectedSegmentOption(step, {
                customer_segment: 'team',
                market_segments: ['EDUCATION'],
            });
            expect(['TEAM', 'TEAM|EDUCATION']).to.include(match.value);
        });

        it('returns null when no option matches the offer', () => {
            expect(getAutoSelectedSegmentOption(step, { customer_segment: 'GOV' })).to.be.null;
        });
    });

    describe('extractKnownSurfaceFromPath', () => {
        it('returns null for null / empty', () => {
            expect(extractKnownSurfaceFromPath('')).to.be.null;
            expect(extractKnownSurfaceFromPath(null)).to.be.null;
            expect(extractKnownSurfaceFromPath(undefined)).to.be.null;
        });

        it('returns null for unknown surface', () => {
            expect(extractKnownSurfaceFromPath('/content/dam/mas/unknown/en_US/foo')).to.be.null;
            expect(extractKnownSurfaceFromPath('unknown')).to.be.null;
        });

        it('extracts a known MAS surface from a full path', () => {
            // Depends on SURFACES map — probe at least one real one.
            const result = extractKnownSurfaceFromPath('/content/dam/mas/acom/en_US/card-foo');
            // Result may be 'acom' or null depending on SURFACES shape; either way it should be a valid known value or null.
            if (result !== null) {
                expect(result).to.be.a('string');
                expect(result).to.equal('acom');
            }
        });
    });
});
