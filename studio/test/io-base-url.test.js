import { expect } from '@open-wc/testing';
import { stub } from 'sinon';
import { resolveIoBaseUrl } from '../src/io-base-url.js';

const host = (search) => new URL(resolveIoBaseUrl(search)).host;

describe('resolveIoBaseUrl', () => {
    it('defaults to the production masstudio namespace', () => {
        expect(resolveIoBaseUrl('')).to.equal('https://14257-masstudio.adobeioruntime.net/api/v1/web/MerchAtScaleStudio');
    });

    it('appends io.studio.env as the workspace', () => {
        expect(host('?io.studio.env=axel')).to.equal('14257-masstudio-axel.adobeioruntime.net');
    });

    it('falls back to aem.env for the workspace', () => {
        expect(host('?aem.env=stage')).to.equal('14257-masstudio-stage.adobeioruntime.net');
    });

    it('prefers io.studio.env over aem.env', () => {
        expect(host('?aem.env=stage&io.studio.env=axel')).to.equal('14257-masstudio-axel.adobeioruntime.net');
    });

    it('selects the merchatscale console project with io.project', () => {
        expect(host('?io.project=merchatscale&io.studio.env=pinata')).to.equal('14257-merchatscale-pinata.adobeioruntime.net');
    });

    it('ignores an unknown io.project', () => {
        expect(host('?io.project=other&io.studio.env=axel')).to.equal('14257-masstudio-axel.adobeioruntime.net');
    });

    it('normalizes an uppercase explicit workspace', () => {
        expect(host('?io.studio.env=MWPW-123')).to.equal('14257-masstudio-mwpw-123.adobeioruntime.net');
    });

    it('normalizes an uppercase fallback workspace', () => {
        expect(host('?aem.env=STAGE')).to.equal('14257-masstudio-stage.adobeioruntime.net');
    });

    it('warns and uses a valid fallback when the explicit workspace is invalid', () => {
        const warning = stub(console, 'warn');
        try {
            expect(host('?io.studio.env=bad.value&aem.env=STAGE')).to.equal('14257-masstudio-stage.adobeioruntime.net');
            expect(warning.calledOnce).to.be.true;
        } finally {
            warning.restore();
        }
    });

    it('rejects an invalid explicit workspace without a fallback', () => {
        expect(() => resolveIoBaseUrl('?io.studio.env=bad.value')).to.throw('Invalid IO workspace');
    });

    it('rejects an invalid fallback workspace', () => {
        expect(() => resolveIoBaseUrl('?aem.env=bad.value')).to.throw('Invalid IO workspace');
    });

    it('rejects an invalid explicit workspace with an invalid fallback', () => {
        expect(() => resolveIoBaseUrl('?io.studio.env=bad.value&aem.env=other.value')).to.throw('Invalid IO workspace');
    });

    it('preserves production defaults when both selectors are empty', () => {
        expect(host('?io.studio.env=&aem.env=')).to.equal('14257-masstudio.adobeioruntime.net');
    });

    it('uses a valid fallback when the explicit selector is empty', () => {
        expect(host('?io.studio.env=&aem.env=stage')).to.equal('14257-masstudio-stage.adobeioruntime.net');
    });

    for (const workspace of [
        'https://evil.example',
        'x.evil.example',
        'x:443',
        'x@y',
        'x/y',
        'x%23y',
        'x%3Fy',
        'x'.repeat(41),
    ]) {
        for (const selector of ['io.studio.env', 'aem.env']) {
            it(`rejects ${selector} containing ${workspace}`, () => {
                expect(() => resolveIoBaseUrl(`?${selector}=${workspace}`)).to.throw('Invalid IO workspace');
            });
        }
    }

    it('decodes a valid encoded workspace label', () => {
        expect(host('?io.studio.env=%70inata&io.project=merchatscale')).to.equal(
            '14257-merchatscale-pinata.adobeioruntime.net',
        );
    });
});
