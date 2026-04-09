import { expect } from '@esm-bundle/chai';
import { getAIChatBaseURL, getMCPServerURL } from '../src/constants.js';

const ATTACKER_AI_CHAT = 'https://attacker.example/chat';
const ATTACKER_MCP = 'https://attacker.example/mcp';
const PROD_AI_CHAT_HOST = '14257-merchatscale-axel.adobeioruntime.net';
const PROD_MCP_HOST = '14257-merchatscale-axel.adobeioruntime.net';

function loc(hostname, search) {
    return { hostname, search };
}

describe('constants — IO Runtime URL overrides', () => {
    describe('localhost honors overrides', () => {
        it('honors ai.chat override on localhost', () => {
            const url = getAIChatBaseURL(loc('localhost', `?ai.chat=${encodeURIComponent(ATTACKER_AI_CHAT)}`));
            expect(url).to.equal(ATTACKER_AI_CHAT);
        });

        it('honors mcp.server override on localhost', () => {
            const url = getMCPServerURL(loc('localhost', `?mcp.server=${encodeURIComponent(ATTACKER_MCP)}`));
            expect(url).to.equal(ATTACKER_MCP);
        });

        it('honors ai.chat override on 127.0.0.1', () => {
            const url = getAIChatBaseURL(loc('127.0.0.1', `?ai.chat=${encodeURIComponent(ATTACKER_AI_CHAT)}`));
            expect(url).to.equal(ATTACKER_AI_CHAT);
        });

        it('returns default URL when no override is given on localhost', () => {
            const aiChat = getAIChatBaseURL(loc('localhost', ''));
            const mcp = getMCPServerURL(loc('localhost', ''));
            expect(aiChat).to.include(PROD_AI_CHAT_HOST);
            expect(mcp).to.include(PROD_MCP_HOST);
        });
    });

    describe('non-localhost ignores overrides', () => {
        it('ignores ai.chat override on a production hostname', () => {
            const url = getAIChatBaseURL(loc('studio.adobe.com', `?ai.chat=${encodeURIComponent(ATTACKER_AI_CHAT)}`));
            expect(url).to.not.equal(ATTACKER_AI_CHAT);
            expect(url).to.include(PROD_AI_CHAT_HOST);
        });

        it('ignores mcp.server override on a production hostname', () => {
            const url = getMCPServerURL(loc('studio.adobe.com', `?mcp.server=${encodeURIComponent(ATTACKER_MCP)}`));
            expect(url).to.not.equal(ATTACKER_MCP);
            expect(url).to.include(PROD_MCP_HOST);
        });

        it('ignores both overrides on an aem.live preview host even when both are set', () => {
            const search = `?ai.chat=${encodeURIComponent(ATTACKER_AI_CHAT)}&mcp.server=${encodeURIComponent(ATTACKER_MCP)}`;
            const aiChat = getAIChatBaseURL(loc('main--mas--adobecom.aem.live', search));
            const mcp = getMCPServerURL(loc('main--mas--adobecom.aem.live', search));
            expect(aiChat).to.not.equal(ATTACKER_AI_CHAT);
            expect(mcp).to.not.equal(ATTACKER_MCP);
        });

        it('ignores ai.chat override on adobe.com', () => {
            const url = getAIChatBaseURL(loc('adobe.com', `?ai.chat=${encodeURIComponent(ATTACKER_AI_CHAT)}`));
            expect(url).to.not.equal(ATTACKER_AI_CHAT);
        });
    });
});
