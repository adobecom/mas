import { expect } from 'chai';
import {
    COUNTDOWN_UNITS,
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
});
