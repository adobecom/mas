const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '../../src/ai-chat/index.js');

describe('ai-chat/retry usage merge', () => {
    let source;

    before(() => {
        source = fs.readFileSync(INDEX_PATH, 'utf8');
    });

    it('never reads camelCase token keys Bedrock does not return', () => {
        const camelReads = source.match(/usage\?\.(inputTokens|outputTokens)/g) ?? [];

        expect(camelReads).to.deep.equal([]);
    });

    it('merges retry usage through the shared sumUsage helper', () => {
        expect(source).to.match(/import \{[^}]*sumUsage[^}]*\} from '\.\/bedrock-client\.js'/);

        const totalUsageAssignments = source.match(/totalUsage = \{/g) ?? [];
        expect(totalUsageAssignments, 'hand-rolled usage object literals remain').to.deep.equal([]);
    });
});
