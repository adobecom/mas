import { expect } from 'chai';
import {
    COUNTDOWN_UNITS,
    countdownLocalTime,
    countdownUnitPlaceholder,
    isCountdownLinkText,
    supportsCountdown,
} from '../../src/fragment/utils/countdown.js';

describe('countdown rules', () => {
    it('matches the marker ignoring case and spacing', () => {
        expect(isCountdownLinkText(' COUNTDOWN-TIMER\n')).to.be.true;
        expect(isCountdownLinkText('countdown timer')).to.be.false;
    });

    it('supports Pro, bizpro and Plans variants only', () => {
        for (const variant of ['pro', 'bizpro', 'plans', 'plans-students']) expect(supportsCountdown(variant)).to.be.true;
        for (const variant of ['mini', undefined]) expect(supportsCountdown(variant)).to.be.false;
    });

    it('wraps each unit entry pair in a tag', () => {
        expect(COUNTDOWN_UNITS).to.deep.equal(['day', 'hour', 'minute']);
        expect(countdownUnitPlaceholder('day')).to.equal('<day>{{countdown-day-singular}}|{{countdown-day-plural}}</day>');
    });

    it('drops the zone so browsers read dates as local wall-clock time', () => {
        for (const date of [
            '2026-11-13T16:00:00.000Z',
            '2026-11-13T16:00:00Z',
            '2026-11-13T16:00:00+05:30',
            '2026-11-13T16:00:00',
        ])
            expect(countdownLocalTime(date)).to.equal('2026-11-13T16:00:00');
        expect(countdownLocalTime('2026-11-13T16:00Z')).to.equal('2026-11-13T16:00');
    });
});
