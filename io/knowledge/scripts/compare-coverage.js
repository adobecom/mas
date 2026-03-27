import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_CHUNKS_DIR = join(__dirname, '../src/knowledge-chunks');
const SCRAPED_DOCS_DIR = join(__dirname, '../scraped-docs');

function extractTopicsFromMarkdown(content) {
    const topics = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2].replace(/\{#[\w-]+\}/g, '').trim();
            topics.push({ level, text, original: line });
        }
    }

    return topics;
}

function extractKeyTerms(content) {
    const terms = new Set();
    const patterns = [
        /\bmerch-card\b/gi,
        /\binline-price\b/gi,
        /\bcheckout-link\b/gi,
        /\bmas\.js\b/gi,
        /\bWCS\b/g,
        /\bOdin\b/g,
        /\bAEM\b/g,
        /\bvariant[s]?\b/gi,
        /\bcatalog\b/gi,
        /\bslice\b/gi,
        /\bsuggested\b/gi,
        /\bplans\b/gi,
        /\bfries\b/gi,
        /\bOST\b/g,
        /\bCCD\b/g,
        /\banalytics\b/gi,
        /\bfragment[s]?\b/gi,
        /\bpipeline\b/gi,
        /\btransformer[s]?\b/gi,
        /\bsettings\b/gi,
        /\blocale\b/gi,
        /\bpricing\b/gi,
    ];

    for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
            matches.forEach((m) => terms.add(m.toLowerCase()));
        }
    }

    return Array.from(terms);
}

function loadKnowledgeChunks() {
    const chunks = [];

    function walkDir(dir, category = '') {
        const items = readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = join(dir, item.name);

            if (item.isDirectory()) {
                walkDir(fullPath, item.name);
            } else if (item.name.endsWith('.md')) {
                const content = readFileSync(fullPath, 'utf-8');
                const topics = extractTopicsFromMarkdown(content);
                const terms = extractKeyTerms(content);

                chunks.push({
                    file: item.name,
                    category: category,
                    path: fullPath,
                    topics,
                    terms,
                    charCount: content.length,
                });
            }
        }
    }

    walkDir(KNOWLEDGE_CHUNKS_DIR);
    return chunks;
}

function loadScrapedDocs() {
    const docPath = join(SCRAPED_DOCS_DIR, 'mas-documentation.md');

    if (!existsSync(docPath)) {
        console.error('Scraped documentation not found. Run scrape-mas-docs.js first.');
        process.exit(1);
    }

    const content = readFileSync(docPath, 'utf-8');
    const topics = extractTopicsFromMarkdown(content);
    const terms = extractKeyTerms(content);

    let demosData = [];
    const demosPath = join(SCRAPED_DOCS_DIR, 'demos-data.json');
    if (existsSync(demosPath)) {
        demosData = JSON.parse(readFileSync(demosPath, 'utf-8'));
    }

    return {
        content,
        topics,
        terms,
        demos: demosData,
        charCount: content.length,
    };
}

function compareTopics(ragTopics, webTopics) {
    const ragSet = new Set(ragTopics.map((t) => t.text.toLowerCase()));
    const webSet = new Set(webTopics.map((t) => t.text.toLowerCase()));

    const onlyInRag = ragTopics.filter((t) => !webSet.has(t.text.toLowerCase()));
    const onlyInWeb = webTopics.filter((t) => !ragSet.has(t.text.toLowerCase()));
    const inBoth = ragTopics.filter((t) => webSet.has(t.text.toLowerCase()));

    return { onlyInRag, onlyInWeb, inBoth };
}

function compareTerms(ragTerms, webTerms) {
    const ragSet = new Set(ragTerms);
    const webSet = new Set(webTerms);

    const onlyInRag = ragTerms.filter((t) => !webSet.has(t));
    const onlyInWeb = webTerms.filter((t) => !ragSet.has(t));
    const inBoth = ragTerms.filter((t) => webSet.has(t));

    return { onlyInRag, onlyInWeb, inBoth };
}

function generateReport(chunks, scrapedDocs) {
    const allRagTopics = [];
    const allRagTerms = new Set();

    chunks.forEach((chunk) => {
        chunk.topics.forEach((t) => {
            allRagTopics.push({ ...t, source: `${chunk.category}/${chunk.file}` });
        });
        chunk.terms.forEach((t) => allRagTerms.add(t));
    });

    const topicComparison = compareTopics(allRagTopics, scrapedDocs.topics);
    const termComparison = compareTerms(Array.from(allRagTerms), scrapedDocs.terms);

    let report = `# RAG Knowledge Coverage Report\n\n`;
    report += `> Generated: ${new Date().toISOString()}\n\n`;

    report += `## Summary Statistics\n\n`;
    report += `| Metric | RAG Knowledge Base | Web Documentation |\n`;
    report += `|--------|-------------------|-------------------|\n`;
    report += `| Total files/pages | ${chunks.length} | 1 |\n`;
    report += `| Total characters | ${chunks.reduce((s, c) => s + c.charCount, 0).toLocaleString()} | ${scrapedDocs.charCount.toLocaleString()} |\n`;
    report += `| Topic headings | ${allRagTopics.length} | ${scrapedDocs.topics.length} |\n`;
    report += `| Key terms found | ${allRagTerms.size} | ${scrapedDocs.terms.length} |\n`;
    report += `| Demo examples | N/A | ${scrapedDocs.demos.length} |\n\n`;

    report += `## RAG Knowledge Chunks by Category\n\n`;
    const byCategory = {};
    chunks.forEach((c) => {
        if (!byCategory[c.category]) byCategory[c.category] = [];
        byCategory[c.category].push(c.file);
    });
    for (const [cat, files] of Object.entries(byCategory)) {
        report += `### ${cat || 'root'}\n`;
        files.forEach((f) => (report += `- ${f}\n`));
        report += '\n';
    }

    report += `## Topic Coverage Analysis\n\n`;

    report += `### Topics in Web Docs NOT in RAG (${topicComparison.onlyInWeb.length})\n\n`;
    if (topicComparison.onlyInWeb.length === 0) {
        report += `All web doc topics appear to be covered by RAG.\n\n`;
    } else {
        report += `These topics from the web documentation may be missing from the RAG knowledge base:\n\n`;
        topicComparison.onlyInWeb.forEach((t) => {
            report += `- ${'#'.repeat(t.level)} ${t.text}\n`;
        });
        report += '\n';
    }

    report += `### Topics in RAG NOT in Web Docs (${topicComparison.onlyInRag.length})\n\n`;
    if (topicComparison.onlyInRag.length === 0) {
        report += `All RAG topics appear in web documentation.\n\n`;
    } else {
        report += `These topics are extracted from code but not visible in public web docs:\n\n`;
        const grouped = {};
        topicComparison.onlyInRag.forEach((t) => {
            const source = t.source || 'unknown';
            if (!grouped[source]) grouped[source] = [];
            grouped[source].push(t.text);
        });
        for (const [source, topics] of Object.entries(grouped)) {
            report += `**${source}**:\n`;
            topics.slice(0, 5).forEach((t) => (report += `  - ${t}\n`));
            if (topics.length > 5) {
                report += `  - ... and ${topics.length - 5} more\n`;
            }
        }
        report += '\n';
    }

    report += `## Key Terms Coverage\n\n`;
    report += `| Term | In RAG | In Web Docs |\n`;
    report += `|------|--------|-------------|\n`;

    const allTerms = new Set([...allRagTerms, ...scrapedDocs.terms]);
    Array.from(allTerms)
        .sort()
        .forEach((term) => {
            const inRag = allRagTerms.has(term) ? 'Yes' : 'No';
            const inWeb = scrapedDocs.terms.includes(term) ? 'Yes' : 'No';
            report += `| ${term} | ${inRag} | ${inWeb} |\n`;
        });
    report += '\n';

    report += `## Demo Components from Web Docs\n\n`;
    if (scrapedDocs.demos.length === 0) {
        report += `No demo components were captured.\n\n`;
    } else {
        report += `The following live demos were captured from the documentation:\n\n`;
        scrapedDocs.demos.forEach((demo) => {
            report += `### Demo ${demo.index}\n`;
            report += `- Screenshot: \`${demo.screenshot}\`\n`;
            if (demo.analytics?.merchCards?.length > 0) {
                report += `- Merch cards found:\n`;
                demo.analytics.merchCards.forEach((card) => {
                    report += `  - variant: ${card.variant || 'none'}, size: ${card.size || 'default'}\n`;
                });
            }
            report += '\n';
        });
    }

    report += `## Recommendations\n\n`;

    const recommendations = [];

    if (topicComparison.onlyInWeb.length > 0) {
        recommendations.push(`Consider adding ${topicComparison.onlyInWeb.length} topics from web docs to improve coverage.`);
    }

    if (topicComparison.onlyInRag.length > 10) {
        recommendations.push(
            `RAG has ${topicComparison.onlyInRag.length} unique topics from code extraction - this is valuable technical detail not in public docs.`,
        );
    }

    if (scrapedDocs.demos.length > 0) {
        recommendations.push(`${scrapedDocs.demos.length} live demos could provide example-based knowledge for the RAG.`);
    }

    if (recommendations.length === 0) {
        recommendations.push('Coverage appears comprehensive. Consider periodic re-scraping to catch documentation updates.');
    }

    recommendations.forEach((r, i) => {
        report += `${i + 1}. ${r}\n`;
    });

    return report;
}

function main() {
    console.log('Loading RAG knowledge chunks...');
    const chunks = loadKnowledgeChunks();
    console.log(`Found ${chunks.length} knowledge chunk files\n`);

    console.log('Loading scraped web documentation...');
    const scrapedDocs = loadScrapedDocs();
    console.log(`Scraped doc has ${scrapedDocs.topics.length} topics\n`);

    console.log('Generating coverage report...');
    const report = generateReport(chunks, scrapedDocs);

    const reportPath = join(SCRAPED_DOCS_DIR, 'coverage-report.md');
    writeFileSync(reportPath, report);
    console.log(`\nReport saved to: ${reportPath}`);

    console.log(`\n${'='.repeat(50)}`);
    console.log('QUICK SUMMARY');
    console.log('='.repeat(50));
    console.log(`RAG chunks: ${chunks.length} files`);
    console.log(`Web doc topics: ${scrapedDocs.topics.length}`);
    console.log(`Web doc demos: ${scrapedDocs.demos.length}`);
}

main();
