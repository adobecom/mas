import { expect } from 'chai';
import {
    PATH_TOKENS,
    odinReferences,
    FRAGMENT_URL_PREFIX,
    FREYJA_PREVIEW_URL,
    ODIN_PREVIEW_URL,
    freyjaUrl,
} from '../../src/fragment/utils/paths.js';

describe('PATH_TOKENS', () => {
    it('should work with adobe-home surface', async () => {
        const match = '/content/dam/mas/adobe-home/en_US/myadobehomecard'.match(PATH_TOKENS);
        expect(match).to.not.be?.null;
        expect(match).to.not.be?.undefined;
        const { surface } = match.groups;
        expect(surface).to.equal('adobe-home');
    });
});

describe('odinReferences', () => {
    it('should return URL without references parameter when allHydrated is false', () => {
        const result = odinReferences('test-id', false);
        expect(result).to.equal(`${FRAGMENT_URL_PREFIX}/test-id`);
    });

    it('should return URL with references=all-hydrated when allHydrated is true', () => {
        const result = odinReferences('test-id', true);
        expect(result).to.equal(`${FRAGMENT_URL_PREFIX}/test-id?references=all-hydrated`);
    });

    it('should return URL without references parameter when allHydrated is not provided', () => {
        const result = odinReferences('test-id');
        expect(result).to.equal(`${FRAGMENT_URL_PREFIX}/test-id`);
    });
});

describe('FREYJA_PREVIEW_URL', () => {
    it('should point to Freyja v2 contentFragments endpoint', () => {
        expect(FREYJA_PREVIEW_URL).to.equal('https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments');
    });
});

describe('ODIN_PREVIEW_URL', () => {
    it('should point to Odin preview fragments endpoint', () => {
        expect(ODIN_PREVIEW_URL).to.equal('https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments');
    });
});

describe('freyjaUrl', () => {
    it('defaults to prod when no env given', () => {
        expect(freyjaUrl()).to.include('e59433');
    });
    it('returns stage URL for stage env', () => {
        expect(freyjaUrl('stage')).to.include('e59471');
    });
    it('returns qa URL for qa env', () => {
        expect(freyjaUrl('qa')).to.include('e155390');
    });
    it('falls back to prod for unknown env', () => {
        expect(freyjaUrl('dev')).to.include('e59433');
    });
});
