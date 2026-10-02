import { expect } from '@esm-bundle/chai';
import { fixture } from '@open-wc/testing-helpers/pure';
import {
    getSpectrumVersion,
    renderSpIcon,
    ICON_LIBRARY,
    COLLECTION_ICON_LIBRARY,
    ICON_SVGS,
} from '../../src/constants/icon-library.js';
import { VARIANT_NAMES } from '../../src/editors/variant-picker.js';

const NEW_SPECTRUM_2_ICONS = [
    {
        id: 'sp-icon-s2-3d',
        name: '3D',
        firstD: 'M15.1892 4.35674L10.0142 1.36934C9.3875 1.00723 8.61143 1.0081 7.98828 1.36934',
        fill: '#292929',
    },
    {
        id: 'sp-icon-s2-acrobat-solid',
        name: 'Acrobat solid',
        firstD: 'M8.82113 5.16059C8.82113 4.9012 8.76499 4.59128 8.50797 4.59128',
        fill: '#292929',
    },
    {
        id: 'sp-icon-s2-apps-all',
        name: 'Apps all',
        firstD: 'M4.27539 2.02499H2.92539C2.42833 2.02499 2.02539 2.42794 2.02539 2.92499V4.27499',
        fill: '#292929',
    },
    {
        id: 'sp-icon-s2-brush',
        name: 'Brush',
        firstD: 'M16.2672 1.44047C15.7917 1.0432 15.1941 0.851602 14.5727 0.911371',
        fill: '#292929',
    },
    {
        id: 'sp-icon-s2-camera',
        name: 'Camera',
        firstD: 'M15.0754 15.3H2.92539C1.80874 15.3 0.900391 14.3912 0.900391 13.275V6.52501',
        fill: '#292929',
    },
    {
        id: 'sp-icon-s2-shapes',
        name: 'Shapes',
        firstD: 'M10.647 11.7H2.8524C2.12027 11.7 1.46461 11.3212 1.09855 10.6875',
        fill: '#292929',
    },
    {
        id: 'sp-icon-s2-social-network',
        name: 'Social network',
        firstD: 'M16.1604 7.31624C16.1852 7.11585 16.1072 6.9137 15.9395 6.79176',
        fill: '#292929',
    },
    {
        id: 'sp-icon-s2-video',
        name: 'Video',
        firstD: 'M14.1758 16.2H3.82578C2.70957 16.2 1.80078 15.2912 1.80078 14.175V3.82499',
        fill: '#292929',
    },
];

describe('icon-library', () => {
    describe('getSpectrumVersion', () => {
        it('should return "spectrum" for plans variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.PLANS)).to.equal('spectrum');
        });

        it('should return "spectrum" for plans-v2 variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.PLANS_V2)).to.equal('spectrum');
        });

        it('should return "spectrum" for pro variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.PRO)).to.equal('spectrum');
        });

        it('should return "spectrum" for stored bizpro fragments', () => {
            expect(getSpectrumVersion('bizpro')).to.equal('spectrum');
        });

        it('should return "spectrum" for plans-students variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.PLANS_STUDENTS)).to.equal('spectrum');
        });

        it('should return "spectrum" for plans-education variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.PLANS_EDUCATION)).to.equal('spectrum');
        });

        it('should return "spectrum" for special-offers variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.SPECIAL_OFFERS)).to.equal('spectrum');
        });

        it('should return "spectrum" for segment variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.SEGMENT)).to.equal('spectrum');
        });

        it('should return "spectrum" for catalog variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.CATALOG)).to.equal('spectrum');
        });

        it('should return "spectrum" for product variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.PRODUCT)).to.equal('spectrum');
        });

        it('should return "spectrum" for mini-compare-chart variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.MINI_COMPARE_CHART)).to.equal('spectrum');
        });

        it('should return "spectrum" for mini-compare-chart-mweb variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.MINI_COMPARE_CHART_MWEB)).to.equal('spectrum');
        });

        it('should return "express" for simplified-pricing-express variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.SIMPLIFIED_PRICING_EXPRESS)).to.equal('express');
        });

        it('should return "express" for full-pricing-express variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.FULL_PRICING_EXPRESS)).to.equal('express');
        });

        it('should return "spectrum-two" for an unknown variant', () => {
            expect(getSpectrumVersion('unknown-variant')).to.equal('spectrum-two');
        });

        it('should return "spectrum-two" for undefined', () => {
            expect(getSpectrumVersion(undefined)).to.equal('spectrum-two');
        });

        it('should return "spectrum-two" for empty string', () => {
            expect(getSpectrumVersion('')).to.equal('spectrum-two');
        });
    });

    describe('ICON_LIBRARY', () => {
        it('should be a non-empty array', () => {
            expect(ICON_LIBRARY).to.be.an('array');
            expect(ICON_LIBRARY.length).to.be.greaterThan(0);
        });

        it('each icon should have an id and name', () => {
            ICON_LIBRARY.forEach((icon) => {
                expect(icon.id).to.be.a('string');
                expect(icon.name).to.be.a('string');
            });
        });

        it('each icon id should start with "sp-icon-"', () => {
            ICON_LIBRARY.forEach((icon) => {
                expect(icon.id.startsWith('sp-icon-')).to.be.true;
            });
        });

        it('should include sp-icon-star', () => {
            const star = ICON_LIBRARY.find((icon) => icon.id === 'sp-icon-star');
            expect(star).to.exist;
            expect(star.name).to.equal('Star');
        });

        it('should include sp-icon-ribbon', () => {
            const ribbon = ICON_LIBRARY.find((icon) => icon.id === 'sp-icon-ribbon');
            expect(ribbon).to.exist;
        });

        it('should have no duplicate ids', () => {
            const ids = ICON_LIBRARY.map((icon) => icon.id);
            expect(ids.length).to.equal(new Set(ids).size);
        });

        it('should still include the pre-existing entries unchanged', () => {
            const existing = [
                { id: 'sp-icon-star', name: 'Star' },
                { id: 'sp-icon-ribbon', name: 'Ribbon' },
                { id: 'sp-icon-brush', name: 'Brush' },
                { id: 'sp-icon-camera', name: 'Camera' },
                { id: 'sp-icon-social-network', name: 'Social network' },
                { id: 'sp-icon-video-filled', name: 'Video' },
            ];
            for (const expected of existing) {
                const icon = ICON_LIBRARY.find((i) => i.id === expected.id);
                expect(icon).to.exist;
                expect(icon.name).to.equal(expected.name);
            }
        });

        it('should have 13 entries, unaffected by the new Spectrum 2 icons', () => {
            expect(ICON_LIBRARY.length).to.equal(13);
        });

        for (const { id } of NEW_SPECTRUM_2_ICONS) {
            it(`should NOT include ${id} (collection-only icon)`, () => {
                expect(ICON_LIBRARY.find((i) => i.id === id)).to.not.exist;
            });
        }
    });

    describe('COLLECTION_ICON_LIBRARY', () => {
        it('should be ICON_LIBRARY plus the 8 new Spectrum 2 icons', () => {
            expect(COLLECTION_ICON_LIBRARY.length).to.equal(ICON_LIBRARY.length + NEW_SPECTRUM_2_ICONS.length);
        });

        it('should include every ICON_LIBRARY entry unchanged', () => {
            for (const icon of ICON_LIBRARY) {
                const found = COLLECTION_ICON_LIBRARY.find((i) => i.id === icon.id);
                expect(found).to.exist;
                expect(found.name).to.equal(icon.name);
            }
        });

        it('each icon id should start with "sp-icon-"', () => {
            COLLECTION_ICON_LIBRARY.forEach((icon) => {
                expect(icon.id.startsWith('sp-icon-')).to.be.true;
            });
        });

        it('should have no duplicate ids', () => {
            const ids = COLLECTION_ICON_LIBRARY.map((icon) => icon.id);
            expect(ids.length).to.equal(new Set(ids).size);
        });

        for (const { id, name } of NEW_SPECTRUM_2_ICONS) {
            it(`should include ${id}`, () => {
                const icon = COLLECTION_ICON_LIBRARY.find((i) => i.id === id);
                expect(icon).to.exist;
                expect(icon.name).to.equal(name);
            });
        }
    });

    describe('ICON_SVGS', () => {
        for (const { id, firstD, fill } of NEW_SPECTRUM_2_ICONS) {
            it(`should register markup for ${id} matching the supplied artwork`, () => {
                const markup = ICON_SVGS[id];
                expect(markup).to.be.a('string').that.is.not.empty;
                expect(markup).to.include('viewBox="0 0 18 18"');
                expect(markup).to.include(firstD);
                expect(markup).to.include(`fill="${fill}"`);
            });
        }

        it('should not register markup for an existing custom-element icon', () => {
            expect(ICON_SVGS['sp-icon-star']).to.be.undefined;
        });
    });

    describe('renderSpIcon', () => {
        it('should return a truthy TemplateResult', () => {
            const result = renderSpIcon('sp-icon-star', VARIANT_NAMES.PLANS);
            expect(result).to.exist;
        });

        it('should return a result for mini-compare-chart (spectrum)', () => {
            const result = renderSpIcon('sp-icon-ribbon', VARIANT_NAMES.MINI_COMPARE_CHART);
            expect(result).to.exist;
        });

        it('should return a result for express variant', () => {
            const result = renderSpIcon('sp-icon-star', VARIANT_NAMES.SIMPLIFIED_PRICING_EXPRESS);
            expect(result).to.exist;
        });

        it('should return a result for unknown variant (spectrum-two)', () => {
            const result = renderSpIcon('sp-icon-star', 'unknown');
            expect(result).to.exist;
        });

        it('should emit the custom-element tag for an existing id like sp-icon-star', async () => {
            const el = await fixture(renderSpIcon('sp-icon-star', VARIANT_NAMES.PLANS));
            expect(el.querySelector('sp-icon-star')).to.exist;
            expect(el.querySelector('svg')).to.not.exist;
        });

        it('should inline the registered SVG markup for a new Spectrum 2 id', async () => {
            const el = await fixture(renderSpIcon('sp-icon-s2-video', VARIANT_NAMES.PLANS));
            const svg = el.querySelector('svg');
            expect(svg).to.exist;
            expect(svg.getAttribute('viewBox')).to.equal('0 0 18 18');
            const path = svg.querySelector('path');
            expect(path.getAttribute('d')).to.include(
                'M14.1758 16.2H3.82578C2.70957 16.2 1.80078 15.2912 1.80078 14.175V3.82499',
            );
            expect(path.getAttribute('fill')).to.equal('#292929');
        });
    });
});
