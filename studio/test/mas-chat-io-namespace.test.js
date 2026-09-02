import { expect } from '@esm-bundle/chai';
import { getAIChatBaseURL, getMCPServerURL, getKnowledgeServiceURL, getIoMcpURL } from '../src/mas-chat/config.js';

/**
 * The ai-chat, MCP and knowledge URLs were built from a hardcoded
 * IO_DEV_NAMESPACE of '14257-merchatscale-axel' — a personal workspace. That
 * constant does not exist on main; this branch introduced it. Merging it would
 * have pointed production Studio's assistant, MCP client, knowledge service and
 * OST product lookup at one developer's namespace.
 *
 * The repo already has the right mechanism: studio.html writes the
 * `io-base-url` meta tag (honouring ?io.studio.env=), and users.js,
 * translation and bulk-publish all read it. These URLs should too, so a
 * personal namespace can only ever be selected the same way every other
 * environment is.
 */
const PERSONAL = 'merchatscale-axel';
const META = 'meta[name="io-base-url"]';

function setMeta(content) {
    let tag = document.querySelector(META);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'io-base-url');
        document.head.appendChild(tag);
    }
    if (content === null) tag.remove();
    else tag.setAttribute('content', content);
}

const loc = (hostname, search = '') => ({ hostname, search });

describe('mas-chat IO namespace resolution', () => {
    let original;

    before(() => {
        original = document.querySelector(META)?.getAttribute('content') ?? null;
    });

    afterEach(() => {
        setMeta(original);
    });

    describe('follows the io-base-url meta tag', () => {
        beforeEach(() => {
            setMeta('https://14257-masstudio-stage.adobeioruntime.net/api/v1/web/MerchAtScaleStudio');
        });

        it('uses it for the assistant', () => {
            expect(getAIChatBaseURL(loc('mas.adobe.com'))).to.equal(
                'https://14257-masstudio-stage.adobeioruntime.net/api/v1/web/MerchAtScaleStudio',
            );
        });

        it('keeps MCP on the same namespace rather than a second hardcoded one', () => {
            expect(getMCPServerURL(loc('mas.adobe.com'))).to.equal(
                'https://14257-masstudio-stage.adobeioruntime.net/api/v1/web/MerchAtScaleMCP',
            );
        });

        it('keeps the knowledge service on it too', () => {
            expect(getKnowledgeServiceURL(loc('mas.adobe.com'))).to.equal(
                'https://14257-masstudio-stage.adobeioruntime.net/api/v1/web/MerchAtScaleKnowledge',
            );
        });

        it('keeps the OST product lookup on it', () => {
            expect(getIoMcpURL(loc('mas.adobe.com'))).to.equal(
                'https://14257-masstudio-stage.adobeioruntime.net/api/v1/web/MerchAtScaleMCP',
            );
        });
    });

    describe('with no meta tag', () => {
        beforeEach(() => setMeta(null));

        it('falls back to the shared namespace, never a personal one', () => {
            for (const url of [
                getAIChatBaseURL(loc('mas.adobe.com')),
                getMCPServerURL(loc('mas.adobe.com')),
                getKnowledgeServiceURL(loc('mas.adobe.com')),
            ]) {
                expect(url, url).to.not.include(PERSONAL);
                expect(url, url).to.include('14257-masstudio');
            }
        });
    });

    describe('localhost overrides still work', () => {
        beforeEach(() => {
            setMeta('https://14257-masstudio.adobeioruntime.net/api/v1/web/MerchAtScaleStudio');
        });

        it('honours ?ai.chat on localhost', () => {
            const url = getAIChatBaseURL(loc('localhost', '?ai.chat=https%3A%2F%2Flocal.test%2Fchat'));
            expect(url).to.equal('https://local.test/chat');
        });

        it('ignores ?ai.chat off localhost', () => {
            const url = getAIChatBaseURL(loc('mas.adobe.com', '?ai.chat=https%3A%2F%2Fattacker.example%2Fchat'));
            expect(url).to.not.include('attacker.example');
        });
    });

    it('never hardcodes a personal namespace anywhere in the module', async () => {
        const source = await fetch(new URL('../src/mas-chat/config.js', import.meta.url)).then((r) => r.text());
        expect(source).to.not.include(PERSONAL);
    });
});
