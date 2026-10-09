import { expect } from '@open-wc/testing';
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

    it('keeps the host on adobeioruntime.net for a crafted io.studio.env', () => {
        expect(host('?io.studio.env=x.evil.example/%23')).to.equal('14257-masstudio.adobeioruntime.net');
    });

    it('keeps the host on adobeioruntime.net for a crafted aem.env', () => {
        expect(host('?aem.env=x.evil.example%3F')).to.equal('14257-masstudio.adobeioruntime.net');
    });
});
