/**
 * One-off port of the MASA knowledge corpus into src/ai-chat/knowledge/*.md,
 * normalized to the format knowledge-parser.js already reads (topic/keywords
 * frontmatter, one H1, `## ` sections of 150-2000 chars). Re-runnable: it only
 * rewrites files it generates, and leaves Studio-authored files alone.
 *
 *   node scripts/port-masa-corpus.mjs [masaKnowledgeDir] [--report out.json]
 *
 * Audience rule: a unit ships only when its frontmatter says `audience: any`
 * and `status: stable`, and its file is not on EXCLUDE (engineer-facing
 * diagnosis or MASA-internal routing that an author never needs).
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, '../src/ai-chat/knowledge');
const MIN_SECTION = 150;
const MAX_SECTION = 2000;
const GENERATED_MARK = '<!-- ported from the MASA knowledge corpus -->';

export const EXCLUDE = {
    'layers.md': 'MASA triage routing: which layer to suspect first for a symptom; for engineers',
    'playbooks/error-taxonomy.md': 'runtime event, error class and status-code taxonomy; engineer-facing',
    'playbooks/3in1-modal-trouble.md': 'distinguishes Dexter vs Commerce-owned modals and who owns the bug; cross-team ops',
    'concepts/io-pipeline.md': 'IO transformer internals and ordering; engineer-facing',
    'concepts/bundle-delivery.md': 'what the maslibs parameter does inside the bundle; developer testing',
};

// Files kept for their author-visible guidance with the engineer-only parts cut out.
export const TRIM = {
    'playbooks/price-trouble.md': {
        dropSections: ['Step 4: check AOS'],
        dropPatterns: [/wcs\.adobe\.(com|io)/i, /wcs-st/i, /aos\.adobe\.io/i, /Akamai/i, /\bCSO\b/, /api_key/i, /This assistant can run/i, /Query WCS directly/i, /Try changing the `country`/i, /WCS lookup/i, /^It lists every offer WCS returns/],
    },
};

// Studio files fully replaced by a MASA file on the same topic (MASA is the richer version).
export const REPLACES_STUDIO = {
    'concepts/card-variants.md': 'card-variants.md',
    'concepts/collections.md': 'collections-and-variations.md',
    'concepts/variations.md': 'collections-and-variations.md',
    'concepts/placeholders.md': 'placeholders.md',
    'concepts/promotions.md': 'promotions.md',
};

const MASA_TOOL_NAMES = /\b(io_fragment|odin_fragment_get|wcs_offer|promo_code_lookup|knowledge_search|settings_trace|github_pr_info|nala_results|code_search|code_read|jira_search|jira_issue|wiki_search|wiki_page)\b/;
const INTERNAL_SENTENCE = [MASA_TOOL_NAMES, /adobeio_events/i, /(^|[\s(])#[a-z][\w-]{3,}/, /wiki\.corp/i, /jira\.corp/i, /corp\.adobe\.com/i, /\bSlack\b/];

function walk(dir, prefix = '') {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name), `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`]));
}

function parseFrontmatter(text) {
    const match = text.match(/^---\n([\s\S]*?)\n---\n/);
    const data = {};
    if (match) for (const line of match[1].split('\n')) {
        const pair = line.match(/^(\w+):\s*(.*)$/);
        if (pair) data[pair[1]] = pair[2].trim().replace(/^"|"$/g, '');
    }
    return { data, body: match ? text.slice(match[0].length) : text };
}

// Keywords hand-written on the Studio file a MASA file replaces carry the words authors
// actually type ("card variants"), so they are kept on the replacement.
function studioKeywords(path) {
    const studioFile = REPLACES_STUDIO[path];
    if (!studioFile) return [];
    try {
        const text = execFileSync('git', ['show', `HEAD:io/studio/src/ai-chat/knowledge/${studioFile}`], { cwd: here, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        return (parseFrontmatter(text).data.keywords ?? '').split(',').map((word) => word.trim().toLowerCase()).filter(Boolean);
    } catch {
        return [];
    }
}

function outputName(path) {
    const [first, ...rest] = path.split('/');
    if (rest.length === 0) return first;
    const stem = rest.join('-');
    return first === 'concepts' ? stem : `${first === 'howto' ? 'howto' : 'playbook'}-${stem}`;
}

function stripInternal(text, removed, file, extraPatterns = []) {
    const patterns = [...INTERNAL_SENTENCE, ...extraPatterns];
    return text
        .split('\n')
        .map((line) => {
            if (!patterns.some((pattern) => pattern.test(line))) return line;
            if (/^\s*(\||[-*]\s)/.test(line)) {
                removed.push({ file, text: line.trim() });
                return null;
            }
            const kept = line.split(/(?<=[.!?])\s+/).filter((sentence) => {
                const drop = patterns.some((pattern) => pattern.test(sentence));
                if (drop) removed.push({ file, text: sentence.trim() });
                return !drop;
            });
            return kept.join(' ');
        })
        .filter((line) => line !== null)
        .join('\n');
}

function cleanBody(body, removed, file) {
    const extra = TRIM[file]?.dropPatterns ?? [];
    const noFootnotes = body.replace(/\[\^[\w.-]+\]/g, '');
    return stripInternal(noFootnotes, removed, file, extra).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function splitSections(body) {
    const [intro, ...raw] = body.split(/\n##\s+/);
    const sections = raw.map((chunk) => {
        const at = chunk.indexOf('\n');
        return { heading: (at === -1 ? chunk : chunk.slice(0, at)).trim(), text: at === -1 ? '' : chunk.slice(at + 1).trim() };
    });
    const lead = intro.replace(/^#\s+.+\n?/, '').trim();
    return { lead, sections };
}

function splitLong(section) {
    if (section.text.length <= MAX_SECTION) return [section];
    const parts = [];
    let current = '';
    for (const block of section.text.split('\n\n')) {
        if (current && current.length + block.length + 2 > MAX_SECTION) {
            parts.push(current);
            current = block;
        } else current = current ? `${current}\n\n${block}` : block;
    }
    if (current) parts.push(current);
    return parts.map((text, index) => ({ heading: index === 0 ? section.heading : `${section.heading} (part ${index + 1})`, text }));
}

function sized(sections) {
    const out = [];
    for (const section of sections.flatMap(splitLong)) {
        const previous = out.at(-1);
        if (section.text.length < MIN_SECTION && previous && previous.text.length + section.text.length + 2 <= MAX_SECTION) previous.text += `\n\n**${section.heading}.** ${section.text}`;
        else out.push({ ...section });
    }
    return out;
}

function render({ topic, title, keywords, lead, sections }) {
    const all = lead.length >= MIN_SECTION ? [{ heading: `About ${title}`, text: lead }, ...sections] : sections;
    const body = sized(all)
        .filter((section) => section.text.length >= MIN_SECTION)
        .map((section) => `## ${section.heading}\n\n${section.text}`)
        .join('\n\n');
    return `---\ntopic: ${topic}\nkeywords: ${keywords.join(', ')}\n---\n${GENERATED_MARK}\n# ${title}\n\n${body}\n`;
}

export function portCorpus(masaDir, outDir = OUT_DIR) {
    const report = { ported: [], dropped: [], removedSentences: [], studioReplaced: [] };
    mkdirSync(outDir, { recursive: true });
    for (const existing of readdirSync(outDir)) {
        if (existing.endsWith('.md') && readFileSync(join(outDir, existing), 'utf8').includes(GENERATED_MARK)) rmSync(join(outDir, existing));
    }
    for (const studioFile of new Set(Object.values(REPLACES_STUDIO))) rmSync(join(outDir, studioFile), { force: true });
    for (const path of walk(masaDir).filter((file) => file.endsWith('.md')).sort()) {
        const { data, body } = parseFrontmatter(readFileSync(join(masaDir, path), 'utf8'));
        const reason = EXCLUDE[path] ?? (data.status !== 'stable' ? `status ${data.status}` : data.audience !== 'any' ? `audience ${data.audience}` : null);
        if (reason) {
            report.dropped.push({ file: path, reason });
            continue;
        }
        const title = data.title ?? path;
        const tags = (data.tags ?? '').replace(/^\[|\]$/g, '').split(',').map((tag) => tag.trim()).filter(Boolean);
        const split = splitSections(cleanBody(body, report.removedSentences, path));
        const { lead } = split;
        const sections = split.sections.filter((section) => !(TRIM[path]?.dropSections ?? []).includes(section.heading));
        const name = outputName(path);
        const topic = name.replace(/\.md$/, '');
        writeFileSync(join(outDir, name), render({ topic, title, keywords: [...new Set([...tags, title.toLowerCase(), ...studioKeywords(path)])], lead, sections }));
        report.ported.push({ file: path, as: name, sections: sections.length });
        if (REPLACES_STUDIO[path]) report.studioReplaced.push({ masa: path, studio: REPLACES_STUDIO[path] });
    }
    return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const reportAt = args.includes('--report') ? args[args.indexOf('--report') + 1] : null;
    const masaDir = args.find((arg) => !arg.startsWith('--') && arg !== reportAt) ?? '/Users/axelcurenobasurto/Web/adobe/mas-agent/knowledge';
    const report = portCorpus(masaDir);
    if (reportAt) writeFileSync(reportAt, JSON.stringify(report, null, 2));
    console.log(`ported ${report.ported.length}, dropped ${report.dropped.length}, removed ${report.removedSentences.length} internal sentences, replaced ${new Set(report.studioReplaced.map((r) => r.studio)).size} Studio files`);
}
