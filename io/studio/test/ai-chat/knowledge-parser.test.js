const { expect } = require('chai');

let parseKnowledgeMarkdown;

const SAMPLE = `---
topic: translations
keywords: translation, translate, locale, language
---
# Translations in MAS Studio

## How do I create a translation project?
Open the Translations view from the side navigation and click New Project.
Pick the source cards and the target locales, then submit.

## What locales are supported?
Any locale configured for the surface. Regional variations are created per
locale, and only one variation per locale is allowed.
`;

describe('ai-chat/knowledge-parser', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/knowledge-parser.js');
        parseKnowledgeMarkdown = mod.parseKnowledgeMarkdown;
    });

    it('produces one chunk per ## section with topic, title, and keywords', () => {
        const chunks = parseKnowledgeMarkdown('translations.md', SAMPLE);
        expect(chunks).to.have.length(2);
        expect(chunks[0]).to.deep.include({
            topic: 'translations',
            title: 'Translations in MAS Studio',
            section: 'How do I create a translation project?',
        });
        expect(chunks[0].keywords).to.deep.equal(['translation', 'translate', 'locale', 'language']);
        expect(chunks[0].text).to.include('New Project');
        expect(chunks[1].section).to.equal('What locales are supported?');
        expect(chunks[1].text).to.include('one variation per locale');
    });

    it('assigns stable ids derived from file and section order', () => {
        const chunks = parseKnowledgeMarkdown('translations.md', SAMPLE);
        expect(chunks[0].id).to.equal('translations.md#0');
        expect(chunks[1].id).to.equal('translations.md#1');
    });

    it('handles files without frontmatter keywords gracefully', () => {
        const minimal = `---
topic: basics
---
# Basics

## What is MAS?
Merch at Scale is the system for authoring commerce cards.
`;
        const chunks = parseKnowledgeMarkdown('basics.md', minimal);
        expect(chunks).to.have.length(1);
        expect(chunks[0].keywords).to.deep.equal([]);
        expect(chunks[0].topic).to.equal('basics');
    });

    it('ignores prose between the H1 and the first section', () => {
        const withIntro = `---
topic: t
---
# Title

Intro paragraph that is not a chunk.

## Real section
Body text here.
`;
        const chunks = parseKnowledgeMarkdown('t.md', withIntro);
        expect(chunks).to.have.length(1);
        expect(chunks[0].text).to.equal('Body text here.');
    });
});
