import { expect, sinon } from './utilities.js';
import {
    buildPriceHTML as sharedBuildPriceHTML,
    selectOffers as sharedSelectOffers,
} from '../../price/src/index.js';
import {
    Commitment as sharedCommitment,
    Term as sharedTerm,
} from '../../price/src/constants.js';
import { Price } from '../src/price.js';
import { Commitment, Term } from '../src/constants.js';
import { selectOffers, sumOffers } from '../src/utilities.js';
import { formatLiteral } from '../src/price/template.js';
import { Log } from '../src/log.js';
import {
    baseOffer,
    promotion,
    instant,
} from '../../price/test/fixtures/cases.js';

describe('shared price browser integration', () => {
    const settings = { country: 'US', language: 'en' };
    const service = () => Price({ settings, literals: { price: {} } });
    const promoOffer = () => ({
        ...structuredClone(baseOffer),
        promotion: structuredClone(promotion),
    });
    let clock;
    let originalUrl;

    beforeEach(() => {
        clock = sinon.useFakeTimers({
            now: new Date(instant),
            toFake: ['Date'],
        });
        originalUrl = location.href;
    });

    afterEach(() => {
        clock.restore();
        history.replaceState(null, '', originalUrl);
        Log.reset();
    });

    it('uses the shared offer-selection export', () => {
        expect(selectOffers).to.equal(sharedSelectOffers);
    });

    it('uses the shared commitment constants', () => {
        expect(Commitment).to.equal(sharedCommitment);
    });

    it('uses the shared term constants', () => {
        expect(Term).to.equal(sharedTerm);
    });

    it('merges price overrides after service settings', () => {
        const options = { country: 'GB', language: 'en' };
        expect(service().buildPriceHTML([baseOffer], options)).to.equal(
            sharedBuildPriceHTML([baseOffer], { ...settings, ...options }),
        );
    });

    for (const [key, value] of [
        ['template', 'discount'],
        ['displayAnnual', true],
        ['alternativePrice', true],
        ['promotionCode', 'PROMO'],
    ]) {
        it(`does not select a template from the service setting ${key}`, () => {
            const renderer = Price({
                settings: { ...settings, [key]: value },
                literals: { price: {} },
            });
            const offer = promoOffer();
            expect(renderer.buildPriceHTML([offer], {})).to.equal(
                sharedBuildPriceHTML([offer], settings),
            );
        });
    }

    it('uses query-string instant for promo-with-annual prices', () => {
        history.replaceState(null, '', '?instant=2030-01-01T00%3A00%3A00.000Z');
        const offer = promoOffer();
        const options = { displayAnnual: true, promotionCode: 'PROMO' };
        expect(service().buildPriceHTML([offer], options)).to.equal(
            sharedBuildPriceHTML([offer], {
                ...settings,
                ...options,
                instant: '2030-01-01T00:00:00.000Z',
            }),
        );
    });

    it('prefers explicit instant over the query-string instant', () => {
        history.replaceState(null, '', '?instant=2030-01-01T00%3A00%3A00.000Z');
        const offer = promoOffer();
        const options = {
            displayAnnual: true,
            promotionCode: 'PROMO',
            instant,
        };
        expect(service().buildPriceHTML([offer], options)).to.equal(
            sharedBuildPriceHTML([offer], { ...settings, ...options }),
        );
    });

    it('does not apply query-string instant to the annual template', () => {
        history.replaceState(null, '', '?instant=2030-01-01T00%3A00%3A00.000Z');
        const options = {
            template: 'annual',
            displayAnnual: true,
            promotionCode: 'PROMO',
        };
        const offer = promoOffer();
        expect(service().buildPriceHTML([offer], options)).to.equal(
            sharedBuildPriceHTML([offer], { ...settings, ...options }),
        );
    });

    it('leaves caller options unchanged when resolving query-string instant', () => {
        history.replaceState(null, '', '?instant=2030-01-01T00%3A00%3A00.000Z');
        const options = { displayAnnual: true, promotionCode: 'PROMO' };
        service().buildPriceHTML([promoOffer()], options);
        expect(options).to.deep.equal({
            displayAnnual: true,
            promotionCode: 'PROMO',
        });
    });

    it('returns empty markup when price options are absent', () => {
        expect(service().buildPriceHTML([baseOffer])).to.equal('');
    });

    it('forwards bundle compatibility warnings to browser logging', () => {
        const entries = [];
        Log.use({ append: (entry) => entries.push(entry) });
        const second = { ...structuredClone(baseOffer), commitment: 'MONTH' };
        sumOffers([baseOffer, second]);
        expect(
            entries.map(({ level, message, params }) => ({
                level,
                message,
                params,
            })),
        ).to.deep.equal([
            {
                level: 'warn',
                message:
                    'Offers have different commitment types, summing may produce unexpected results',
                params: [{ expected: 'YEAR', actual: 'MONTH' }],
            },
        ]);
    });

    it('forwards rendered literal errors to M@S logging', () => {
        const entries = [];
        Log.use({ append: (entry) => entries.push(entry) });

        service().buildPriceHTML([baseOffer], {
            literals: { recurrenceLabel: '{invalid' },
        });

        expect(
            entries.map(({ level, namespace, message, params }) => ({
                level,
                namespace,
                message,
                params,
            })),
        ).to.deep.equal([
            {
                level: 'error',
                namespace: 'ConsonantTemplates/price',
                message: 'Failed to format literal:',
                params: ['{invalid'],
            },
        ]);
    });

    it('forwards unavailable-price literal errors to M@S logging', () => {
        const entries = [];
        Log.use({ append: (entry) => entries.push(entry) });

        expect(
            formatLiteral(
                { priceUnavailableLabel: '{invalid' },
                'en-US',
                'priceUnavailableLabel',
                {},
            ),
        ).to.equal('');

        expect(
            entries.map(({ level, namespace, message, params }) => ({
                level,
                namespace,
                message,
                params,
            })),
        ).to.deep.equal([
            {
                level: 'error',
                namespace: 'ConsonantTemplates/price',
                message: 'Failed to format literal:',
                params: ['{invalid'],
            },
        ]);
    });
});
