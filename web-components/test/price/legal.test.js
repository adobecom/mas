import { expect } from '../utilities.js';
import * as snapshots from './__snapshots__/legal.snapshots.js';
import { legalTemplate } from '../../src/price/legal.js';

const root = document.createElement('div');
document.body.append(root);

function renderAndComparePrice(id, html) {
    const el = document.createElement('p', { id });
    el.setAttribute('id', id);
    el.innerHTML = html;
    root.append(el);
    expect(el.innerHTML).to.be.html(snapshots[id]);
}

describe('function "createLegalTemplate"', () => {
    const legalPlanType = (planTypeCase) =>
        legalTemplate(
            {
                country: 'US',
                language: 'en',
                displayPlanType: true,
                planTypeCase,
                literals: { planTypeLabel: 'Annual, billed monthly' },
            },
            { planType: 'ABM' },
            {},
        );

    it('lowercases the plan type first letter when planTypeCase is lower', () => {
        expect(legalPlanType('lower')).to.contain('annual, billed monthly');
    });

    it('uppercases the plan type first letter when planTypeCase is upper', () => {
        expect(
            legalTemplate(
                {
                    country: 'US',
                    language: 'en',
                    displayPlanType: true,
                    planTypeCase: 'upper',
                    literals: { planTypeLabel: 'annual, billed monthly' },
                },
                { planType: 'ABM' },
                {},
            ),
        ).to.contain('Annual, billed monthly');
    });

    it('leaves the plan type label unchanged when planTypeCase is absent', () => {
        expect(legalPlanType(undefined)).to.contain('Annual, billed monthly');
    });

    it('displays legal template with tax and plan type texts', () => {
        renderAndComparePrice(
            'createLegalTemplate2',
            legalTemplate(
                {
                    country: 'FR',
                    language: 'fr',
                    displayTax: true,
                    displayPlanType: true,
                    literals: {
                        taxInclusiveLabel: 'incl. VAT',
                        planTypeLabel: 'Annuel, facturé mensuellement',
                    },
                },
                {
                    taxDisplay: 'TAX_INCLUSIVE_DETAILS',
                    taxTerm: 'VAT',
                    planType: 'ABM',
                },
                {},
            ),
        );
    });

    it('displays legal template with tax and plan type texts without dot separator', () => {
        renderAndComparePrice(
            'createLegalTemplate4',
            legalTemplate(
                {
                    country: 'FR',
                    language: 'fr',
                    displayTax: true,
                    displayPlanType: true,
                    displayDot: false,
                    literals: {
                        taxInclusiveLabel: 'incl. VAT',
                        planTypeLabel: 'Annuel, facturé mensuellement',
                    },
                },
                {
                    taxDisplay: 'TAX_INCLUSIVE_DETAILS',
                    taxTerm: 'VAT',
                    planType: 'ABM',
                },
                {},
            ),
        );
    });

    it('displays legal template with plan type text and hides tax text when country is US and language is en', () => {
        renderAndComparePrice(
            'createLegalTemplate3',
            legalTemplate(
                {
                    country: 'US',
                    language: 'en',
                    displayTax: true,
                    displayPlanType: true,
                    literals: {
                        taxInclusiveLabel: 'Exclusive of VAT',
                        planTypeLabel: 'Annual, billed monthly',
                    },
                },
                {
                    taxDisplay: 'TAX_EXCLUSIVE',
                    taxTerm: 'TAX',
                    planType: 'ABM',
                },
                {},
            ),
        );
    });
});
