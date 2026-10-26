import { expect } from '@esm-bundle/chai';
import { Promotion } from '../../src/aem/promotion.js';
import {
    countdownDateError,
    countdownPreviewOfProvenance,
    countdownPreviewOfTag,
    countdownPreviewState,
    countdownProjectTargetsPath,
    hasCountdownSentinel,
    toCountdownProject,
} from '../../src/promotions/countdown-preview.js';

const DATES = { cdtStart: '2026-02-01T00:00:00Z', cdtEnd: '2026-02-10T00:00:00Z' };
const READY = { ...DATES, countdownStatus: 'ready' };
const NO_PROJECT = { countdownStatus: 'no-project' };
const MISSING_DATES = { countdownStatus: 'missing-dates' };

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
                { name: 'fragments', values: ['/content/dam/mas/acom/en_US/card'] },
            ],
        };
        const expected = { tag: 'mas:promotion/p1', ...DATES, fragments: ['/content/dam/mas/acom/en_US/card'] };

        it('serializes a raw author object (no Fragment methods)', () => {
            expect(toCountdownProject(raw)).to.deep.equal(expected);
        });

        it('serializes a Promotion fragment the same way', () => {
            expect(toCountdownProject(new Promotion(raw))).to.deep.equal(expected);
        });

        it('reads the promotion tag from the tags field before the metadata tags', () => {
            const project = toCountdownProject({ fields: [{ name: 'tags', values: ['mas:promotion/p2'] }], tags: [] });
            expect(project).to.deep.equal({ tag: 'mas:promotion/p2', cdtStart: undefined, cdtEnd: undefined, fragments: [] });
        });

        it('tolerates an object without fields', () => {
            expect(toCountdownProject({})).to.deep.equal({ tag: null, cdtStart: undefined, cdtEnd: undefined, fragments: [] });
        });
    });

    describe('countdownProjectTargetsPath', () => {
        const project = { fragments: ['/content/dam/mas/acom/en_US/card'] };

        it('matches translated cards by surface and locale-independent path', () => {
            expect(countdownProjectTargetsPath(project, '/content/dam/mas/acom/en_GB/card')).to.be.true;
        });

        it('does not inherit membership for a cloned path or another surface', () => {
            for (const path of ['/content/dam/mas/acom/en_US/card-copy', '/content/dam/mas/ccd/en_US/card', '/elsewhere']) {
                expect(countdownProjectTargetsPath(project, path)).to.be.false;
            }
        });
    });

    describe('countdownPreviewOfTag', () => {
        const projects = [{ tag: 'mas:promotion/other' }, { tag: 'mas:promotion/p1', ...DATES }];

        it('returns the tagged project dates, normalizing the tag form', () => {
            expect(countdownPreviewOfTag(projects, '/content/cq:tags/mas/promotion/p1')).to.deep.equal(READY);
        });

        it('distinguishes an unknown tag from a project with missing dates', () => {
            expect(countdownPreviewOfTag(projects, 'mas:promotion/missing')).to.deep.equal(NO_PROJECT);
            expect(countdownPreviewOfTag([{ tag: 'mas:promotion/p1', cdtStart: 'a' }], 'mas:promotion/p1')).to.deep.equal(
                MISSING_DATES,
            );
        });
    });

    describe('countdownPreviewOfProvenance', () => {
        const promoProjects = [
            { label: 'Other', project: {} },
            { label: 'Black Friday', project: DATES },
        ];

        it('returns the dates of the project named by body.promoProject', () => {
            expect(countdownPreviewOfProvenance({ body: { promoProject: 'Black Friday' }, promoProjects })).to.deep.equal(
                READY,
            );
        });

        it('does not use the root cdt pair, only the selected project', () => {
            const context = { body: { promoProject: 'Black Friday', cdtStart: 'x', cdtEnd: 'y' }, promoProjects };
            expect(countdownPreviewOfProvenance(context)).to.deep.equal(READY);
        });

        it('distinguishes no selection, missing dates, and an incomplete lookup', () => {
            expect(countdownPreviewOfProvenance({ body: {}, promoProjects })).to.deep.equal(NO_PROJECT);
            expect(countdownPreviewOfProvenance({ body: { promoProject: 'Other' }, promoProjects })).to.deep.equal(
                MISSING_DATES,
            );
            expect(countdownPreviewOfProvenance({ body: { promoProject: 'Missing' }, promoProjects })).to.deep.equal({
                countdownStatus: 'lookup-failed',
            });
            expect(countdownPreviewOfProvenance()).to.deep.equal(NO_PROJECT);
        });
    });

    describe('countdownDateError', () => {
        for (const [name, start, end, expected] of [
            ['optional empty pair', undefined, undefined, null],
            ['valid pair', DATES.cdtStart, DATES.cdtEnd, null],
            ['missing end', DATES.cdtStart, '', 'missing-dates'],
            ['missing start', '', DATES.cdtEnd, 'missing-dates'],
            ['invalid start', 'bad', DATES.cdtEnd, 'invalid-dates'],
            ['invalid end', DATES.cdtStart, 'bad', 'invalid-dates'],
            ['equal dates', DATES.cdtStart, DATES.cdtStart, 'invalid-range'],
            ['reversed dates', DATES.cdtEnd, DATES.cdtStart, 'invalid-range'],
        ]) {
            it(`validates ${name}`, () => {
                expect(countdownDateError(start, end)).to.equal(expected);
            });
        }
    });

    describe('countdownPreviewState', () => {
        for (const [name, instant, expected] of [
            ['before start', '2026-01-31T23:59:59Z', 'scheduled'],
            ['at start', DATES.cdtStart, null],
            ['while active', '2026-02-05T00:00:00Z', null],
            ['just before expiry', '2026-02-09T23:59:59Z', null],
            ['at expiry', DATES.cdtEnd, 'expired'],
            ['after expiry', '2026-02-11T00:00:00Z', 'expired'],
        ]) {
            it(`reports the state ${name} using the supplied preview time`, () => {
                expect(countdownPreviewState(READY, Date.parse(instant))).to.equal(expected);
            });
        }

        it('preserves lookup and configuration diagnoses instead of inferring missing dates', () => {
            for (const countdownStatus of ['lookup-failed', 'no-project', 'no-match', 'missing-dates']) {
                expect(countdownPreviewState({ countdownStatus }, 0)).to.equal(countdownStatus);
            }
        });

        it('diagnoses missing or invalid dates and invalid preview time', () => {
            expect(countdownPreviewState({}, 0)).to.equal('missing-dates');
            expect(countdownPreviewState({ cdtStart: 'bad', cdtEnd: 'bad' }, 0)).to.equal('invalid-dates');
            expect(countdownPreviewState({ cdtStart: DATES.cdtEnd, cdtEnd: DATES.cdtStart }, 0)).to.equal('invalid-range');
            expect(countdownPreviewState(READY, NaN)).to.equal('invalid-preview-time');
        });
    });
});
