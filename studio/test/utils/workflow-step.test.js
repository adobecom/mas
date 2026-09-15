import { expect } from '@esm-bundle/chai';
import {
    WORKFLOW_STEPS,
    detectWorkflowStepFromHref,
    extractPrimaryCtaHref,
    detectWorkflowStep,
    matchesWorkflowStep,
    filterByWorkflowStep,
} from '../../src/utils/workflow-step.js';

function cardWithCta(href) {
    if (!href) return { fields: [] };
    return { fields: [{ name: 'ctas', values: [`<a href="${href}">Buy now</a>`] }] };
}

describe('workflow-step', () => {
    describe('detectWorkflowStepFromHref', () => {
        it('detects each of the 8 known steps from its own segment, as a single id', () => {
            const hrefs = {
                email: '/store/email',
                commitment: '/store/commitment',
                recommendation: '/store/recommendation',
                segmentation: '/store/segmentation',
                bundle: '/store/bundle',
                payment: '/store/payment',
                'change-plan-team-plans': '/store/change-plan/team-upgrade/plans',
                'change-plan-team-payment': '/store/change-plan/team-upgrade/payment',
            };
            expect(WORKFLOW_STEPS).to.have.lengthOf(8);
            for (const step of WORKFLOW_STEPS) {
                const result = detectWorkflowStepFromHref(hrefs[step.id]);
                expect(result).to.be.a('string');
                expect(result).to.equal(step.id);
            }
        });

        it('matches /email inside a longer absolute URL with a query string and trailing slash', () => {
            expect(detectWorkflowStepFromHref('https://www.adobe.com/store/email/?ep=abc123&locale=en#top')).to.equal('email');
        });

        it('returns null for a falsy or non-string href', () => {
            expect(detectWorkflowStepFromHref('')).to.be.null;
            expect(detectWorkflowStepFromHref(null)).to.be.null;
            expect(detectWorkflowStepFromHref(undefined)).to.be.null;
        });

        it('returns null for a headless-style path matching no known segment', () => {
            expect(detectWorkflowStepFromHref('/store/headless/checkout')).to.be.null;
        });

        it('does not match a segment that merely contains a known keyword as a substring', () => {
            expect(detectWorkflowStepFromHref('/store/emails-archive')).to.be.null;
        });

        it('resolves an href matching two entries to the most specific (longest) id only', () => {
            const result = detectWorkflowStepFromHref('/store/change-plan/team-upgrade/payment');
            expect(result).to.be.a('string');
            expect(result).to.equal('change-plan-team-payment');
        });
    });

    describe('extractPrimaryCtaHref', () => {
        it('returns null for a card with no CTA field', () => {
            expect(extractPrimaryCtaHref({ fields: [] })).to.be.null;
        });

        it('returns null for a card with an empty CTA value', () => {
            expect(extractPrimaryCtaHref({ fields: [{ name: 'ctas', values: [''] }] })).to.be.null;
        });

        it('extracts the href from the first authored CTA anchor', () => {
            expect(extractPrimaryCtaHref(cardWithCta('/store/email'))).to.equal('/store/email');
        });

        it('reads via getFieldValues when the fragment exposes that accessor', () => {
            const ctaHtml = '<a href="/store/commitment">Buy</a>';
            const fragmentLike = { getFieldValues: (name) => (name === 'ctas' ? [ctaHtml] : []) };
            expect(extractPrimaryCtaHref(fragmentLike)).to.equal('/store/commitment');
        });
    });

    describe('detectWorkflowStep', () => {
        it('detects the step from a card CTA link', () => {
            expect(detectWorkflowStep(cardWithCta('/store/email'))).to.equal('email');
        });

        it('returns null for a card with no CTA link', () => {
            expect(detectWorkflowStep({ fields: [] })).to.be.null;
        });
    });

    describe('matchesWorkflowStep / filterByWorkflowStep', () => {
        const untaggedCards = [{ fields: [] }, cardWithCta('/store/headless/checkout')];
        const emailCard = cardWithCta('/store/email');

        it('matchesWorkflowStep is false for every untagged card, across all 8 step ids', () => {
            for (const step of WORKFLOW_STEPS) {
                for (const card of untaggedCards) {
                    expect(matchesWorkflowStep(card, step.id)).to.equal(false);
                }
            }
        });

        it('matchesWorkflowStep is false for an unknown stepId', () => {
            expect(matchesWorkflowStep(emailCard, 'unknown-step')).to.equal(false);
        });

        it('matchesWorkflowStep is true when the detected step matches stepId', () => {
            expect(matchesWorkflowStep(emailCard, 'email')).to.equal(true);
        });

        it('filterByWorkflowStep excludes untagged cards and keeps the matching one', () => {
            const list = [...untaggedCards, emailCard];
            expect(filterByWorkflowStep(list, 'email')).to.deep.equal([emailCard]);
        });

        it('filterByWorkflowStep returns the list unchanged when stepId is falsy', () => {
            const list = [...untaggedCards, emailCard];
            expect(filterByWorkflowStep(list, '')).to.equal(list);
            expect(filterByWorkflowStep(list, null)).to.equal(list);
        });
    });
});
