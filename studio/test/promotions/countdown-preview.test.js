import { expect } from '@esm-bundle/chai';
import { Promotion } from '../../src/aem/promotion.js';
import {
    countdownDatesOfProvenance,
    countdownDatesOfTag,
    hasCountdownSentinel,
    toCountdownProject,
} from '../../src/promotions/countdown-preview.js';

const DATES = { cdtStart: '2026-02-01T00:00:00Z', cdtEnd: '2026-02-10T00:00:00Z' };

describe('countdown-preview', () => {
    describe('hasCountdownSentinel', () => {
        it('detects the sentinel link in any field value, including formatted text', () => {
            expect(hasCountdownSentinel([{ values: ['x'] }, { values: ['<p>Ends <a href="#">countdown-timer</a></p>'] }])).to.be
                .true;
            expect(hasCountdownSentinel([{ values: ['<a href="#"><strong> Countdown-Timer </strong></a>'] }])).to.be.true;
        });

        it('ignores plain text, other links, and missing values', () => {
            expect(hasCountdownSentinel([{ values: ['countdown-timer'] }, { values: ['<a href="#">terms</a>'] }, {}])).to.be
                .false;
            expect(hasCountdownSentinel()).to.be.false;
        });
    });

    describe('toCountdownProject', () => {
        const raw = {
            id: 'p1',
            tags: [{ id: 'mas:promotion/p1' }],
            fields: [
                { name: 'cdtStart', values: [DATES.cdtStart] },
                { name: 'cdtEnd', values: [DATES.cdtEnd] },
            ],
        };

        it('serializes a raw author object (no Fragment methods)', () => {
            expect(toCountdownProject(raw)).to.deep.equal({ tag: 'mas:promotion/p1', ...DATES });
        });

        it('serializes a Promotion fragment the same way', () => {
            expect(toCountdownProject(new Promotion(raw))).to.deep.equal({ tag: 'mas:promotion/p1', ...DATES });
        });

        it('reads the promotion tag from the tags field before the metadata tags', () => {
            const project = toCountdownProject({ fields: [{ name: 'tags', values: ['mas:promotion/p2'] }], tags: [] });
            expect(project).to.deep.equal({ tag: 'mas:promotion/p2', cdtStart: undefined, cdtEnd: undefined });
        });

        it('tolerates an object without fields', () => {
            expect(toCountdownProject({})).to.deep.equal({ tag: null, cdtStart: undefined, cdtEnd: undefined });
        });
    });

    describe('countdownDatesOfTag', () => {
        const projects = [
            { tag: 'mas:promotion/other', cdtStart: 'a', cdtEnd: 'b' },
            { tag: 'mas:promotion/p1', ...DATES },
        ];

        it('returns the tagged project dates, normalizing the tag form', () => {
            expect(countdownDatesOfTag(projects, '/content/cq:tags/mas/promotion/p1')).to.deep.equal(DATES);
        });

        it('returns nothing for an unknown tag or a project with one date', () => {
            expect(countdownDatesOfTag(projects, 'mas:promotion/missing')).to.deep.equal({});
            expect(countdownDatesOfTag([{ tag: 'mas:promotion/p1', cdtStart: 'a' }], 'mas:promotion/p1')).to.deep.equal({});
        });
    });

    describe('countdownDatesOfProvenance', () => {
        const promoProjects = [
            { label: 'Other', project: { cdtStart: 'a', cdtEnd: 'b' } },
            { label: 'Black Friday', project: DATES },
        ];

        it('returns the dates of the project named by body.promoProject', () => {
            expect(countdownDatesOfProvenance({ body: { promoProject: 'Black Friday' }, promoProjects })).to.deep.equal(DATES);
        });

        it('does not use the root cdt pair, only the selected project', () => {
            const context = { body: { promoProject: 'Black Friday', cdtStart: 'x', cdtEnd: 'y' }, promoProjects };
            expect(countdownDatesOfProvenance(context)).to.deep.equal(DATES);
        });

        it('returns nothing without a selected project, a matching label, or both dates', () => {
            expect(countdownDatesOfProvenance({ body: {}, promoProjects })).to.deep.equal({});
            expect(countdownDatesOfProvenance({ body: { promoProject: 'Missing' }, promoProjects })).to.deep.equal({});
            expect(
                countdownDatesOfProvenance({
                    body: { promoProject: 'P' },
                    promoProjects: [{ label: 'P', project: { cdtEnd: 'b' } }],
                }),
            ).to.deep.equal({});
            expect(countdownDatesOfProvenance()).to.deep.equal({});
        });
    });
});
