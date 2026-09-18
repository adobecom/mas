import { expect } from '@esm-bundle/chai';
import {
    getAIChatBaseURL,
    getMCPServerURL,
    getKnowledgeServiceURL,
    getIoMcpURL,
    getIoStudioURL,
} from '../src/mas-chat/config.js';

/**
 * These URLs were built from a hardcoded IO_DEV_NAMESPACE of
 * '14257-merchatscale-axel' — a personal workspace — which would have pointed
 * production Studio's assistant, MCP client, knowledge service and OST product
 * lookup at one developer's namespace. They must never do that again.
 *
 * The repo already has the right mechanism: studio.html writes the
 * `io-base-url` meta tag (honouring ?io.studio.env=), and users.js, translation
 * and bulk-publish all read it. These URLs read it too, so a personal namespace
 * can only ever be selected the same way every other environment is.
 *
 * All four assistant packages resolve to that ONE namespace:
 *
 *   MerchAtScaleStudio/ai-chat            the assistant
 *   MerchAtScaleStudio/ost-products-read  the OST product catalog
 *   MerchAtScaleMCP/*                     the tools the assistant executes
 *   MerchAtScaleKnowledge/query           the docs corpus
 *
 * That is a deployment requirement, not just a client one. When a package is
 * missing from the selected namespace, OpenWhisk answers with a 404 that
 * carries no CORS headers, so the browser rejects the request before reading a
 * status and the assistant reports "Failed to fetch" rather than a 404. That is
 * exactly how a namespace holding ai-chat but not MerchAtScaleMCP presented:
 * the chat answered, then every tool call died.
 */
const PERSONAL = 'merchatscale-axel';
const META = 'meta[name="io-base-url"]';
const DEV = 'https://14257-masstudio-axel.adobeioruntime.net/api/v1/web/MerchAtScaleStudio';
const DEV_NAMESPACE = 'https://14257-masstudio-axel.adobeioruntime.net/api/v1/web';

function setMeta(content) {
    let tag = document.querySelector(META);
    if (content === null) {
        tag?.remove();
        return;
    }
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'io-base-url');
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
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

    describe('follows the io-base-url meta tag, as ?io.studio.env= writes it', () => {
        beforeEach(() => {
            setMeta(DEV);
        });

        it('uses it for the assistant', () => {
            expect(getAIChatBaseURL(loc('mwpw-183572--mas--adobecom.aem.page'))).to.equal(DEV);
        });

        it('uses it for the OST product catalog', () => {
            expect(getIoStudioURL()).to.equal(DEV);
        });

        it('keeps MCP on the same namespace rather than a second hardcoded one', () => {
            expect(getMCPServerURL(loc('mwpw-183572--mas--adobecom.aem.page'))).to.equal(`${DEV_NAMESPACE}/MerchAtScaleMCP`);
        });

        it('keeps the knowledge service on it too', () => {
            expect(getKnowledgeServiceURL(loc('mwpw-183572--mas--adobecom.aem.page'))).to.equal(
                `${DEV_NAMESPACE}/MerchAtScaleKnowledge`,
            );
        });

        it('keeps the product detail lookup on it', () => {
            expect(getIoMcpURL()).to.equal(`${DEV_NAMESPACE}/MerchAtScaleMCP`);
        });

        it('puts every assistant package in one namespace, so one deploy target serves them all', () => {
            const hosts = new Set(
                [
                    getAIChatBaseURL(loc('mas.adobe.com')),
                    getIoStudioURL(),
                    getMCPServerURL(loc('mas.adobe.com')),
                    getKnowledgeServiceURL(loc('mas.adobe.com')),
                    getIoMcpURL(),
                ].map((url) => new URL(url).host),
            );
            expect([...hosts]).to.deep.equal(['14257-masstudio-axel.adobeioruntime.net']);
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
            expect(getAIChatBaseURL(loc('localhost', '?ai.chat=https%3A%2F%2Flocal.test%2Fchat'))).to.equal(
                'https://local.test/chat',
            );
        });

        it('honours ?mcp.server on localhost', () => {
            expect(getMCPServerURL(loc('localhost', '?mcp.server=https%3A%2F%2Flocal.test%2Fmcp'))).to.equal(
                'https://local.test/mcp',
            );
        });

        it('ignores ?ai.chat off localhost', () => {
            expect(getAIChatBaseURL(loc('mas.adobe.com', '?ai.chat=https%3A%2F%2Fattacker.example%2Fchat'))).to.not.include(
                'attacker.example',
            );
        });

        it('ignores ?mcp.server off localhost', () => {
            expect(getMCPServerURL(loc('mas.adobe.com', '?mcp.server=https%3A%2F%2Fattacker.example%2Fmcp'))).to.not.include(
                'attacker.example',
            );
        });
    });

    it('never hardcodes a personal namespace anywhere in the module', async () => {
        const source = await fetch(new URL('../src/mas-chat/config.js', import.meta.url)).then((r) => r.text());
        expect(source).to.not.include(PERSONAL);
    });
});
