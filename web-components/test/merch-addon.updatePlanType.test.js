import { expect } from '@esm-bundle/chai';
import '../src/mas.js';
import { EVENT_TYPE_RESOLVED } from '../src/constants.js';

async function makeAddon(pBlocks) {
    const addon = document.createElement('merch-addon');
    pBlocks.forEach(({ planType = '' }) => {
        const p = document.createElement('p');
        p.setAttribute('data-plan-type', planType);
        const span = document.createElement('span');
        p.append(span);
        addon.append(p);
    });
    document.body.append(addon);
    await addon.updateComplete;
    return addon;
}

function resolve(span, offer) {
    span.value = [offer];
    span.dispatchEvent(
        new CustomEvent(EVENT_TYPE_RESOLVED, {
            bubbles: true,
            composed: true,
        }),
    );
}

describe('MerchAddon.updatePlanType', () => {
    afterEach(() => {
        document.querySelectorAll('merch-addon').forEach((el) => el.remove());
    });

    it('assigns distinct plan types to each block when offers do not collide', async () => {
        const addon = await makeAddon([{}, {}]);
        const [p1, p2] = addon.querySelectorAll('p');
        resolve(p1.querySelector('span'), {
            planType: 'M2M',
            offerType: 'BASE',
        });
        resolve(p2.querySelector('span'), {
            planType: 'PUF',
            offerType: 'BASE',
        });
        expect(p1.getAttribute('data-plan-type')).to.equal('M2M');
        expect(p2.getAttribute('data-plan-type')).to.equal('PUF');
    });

    it('does not let a second block claim a plan type already claimed by another block', async () => {
        const addon = await makeAddon([{}, {}]);
        const [p1, p2] = addon.querySelectorAll('p');
        // First block resolves and claims PUF.
        resolve(p1.querySelector('span'), {
            planType: 'PUF',
            offerType: 'PROMOTION',
        });
        // Second block's OSI has no real M2M offer in this market and falls
        // back to a PUF-shaped offer too.
        resolve(p2.querySelector('span'), {
            planType: 'PUF',
            offerType: 'PROMOTION',
        });
        expect(p1.getAttribute('data-plan-type')).to.equal('PUF');
        // p2 must not also display as PUF, or both blocks render at once.
        expect(p2.getAttribute('data-plan-type')).to.equal('');
        expect(
            addon.querySelectorAll('p[data-plan-type="PUF"]'),
        ).to.have.lengthOf(1);
    });

    it('does not overwrite an explicitly authored plan type', async () => {
        const addon = await makeAddon([{ planType: 'M2M' }]);
        const [p1] = addon.querySelectorAll('p');
        resolve(p1.querySelector('span'), {
            planType: 'PUF',
            offerType: 'PROMOTION',
        });
        expect(p1.getAttribute('data-plan-type')).to.equal('M2M');
    });
});
