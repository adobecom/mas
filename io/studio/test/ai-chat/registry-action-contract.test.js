const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

/**
 * The intent registry is the assistant's promise: every intent it advertises,
 * the model can pick. Nothing checked that the action behind the promise
 * exists, or that it reads the slots the registry says to send.
 *
 * It did not, in three ways, and every existing suite stayed green because
 * they all assert on the ENVELOPE and never on whether the envelope can be
 * executed:
 *   - 14 tool_targets had no action file, so the user confirmed an operation
 *     and got a 404.
 *   - update_card's registry contract sends `updates`; the action reads
 *     `fields`, so every envelope-path card update failed after confirmation.
 *   - the Find Cards chips sent status/sortBy/sortDirection, which search_cards
 *     does not read, so a "draft cards" request returned an unfiltered list
 *     labelled as filtered. A wrong answer that looks right.
 *
 * KNOWN_UNBACKED and KNOWN_SLOT_GAPS below are the debt this found, not
 * permission to add more. Both should shrink to empty; nothing new belongs in
 * either without a very good reason.
 */

const ACTIONS_DIR = path.join(__dirname, '../../../mcp-server/src/actions');
const MCP_CLIENT = path.join(__dirname, '../../../../studio/src/services/mcp-client.js');

/**
 * tool_targets with no action behind them today.
 *
 *   alias    - reachable, the client rewrites the name (get_variations)
 *   unwired  - the logic exists in mcp-server/src/lib/studio-operations.js but
 *              no action exposes it; these are plumbing, not new work
 *   missing  - no implementation anywhere; the docs corpus advertises these
 */
const KNOWN_UNBACKED = {
    get_variations: 'alias',
    create_locale_variation: 'unwired',
    create_grouped_variation: 'unwired',
    get_card_with_variations: 'unwired',
    list_variation_locales: 'unwired',
    get_variation_parent: 'unwired',
    create_tags: 'missing',
    find_untranslated_cards: 'missing',
    translation_coverage_report: 'missing',
    create_translation_project: 'missing',
    submit_translation_project: 'missing',
    get_translation_project: 'missing',
    list_translation_projects: 'missing',
    check_translation_status: 'missing',
};

/**
 * Slots the registry sends that the action never reads. Each is a live bug:
 * the model can fill the slot, the user can confirm it, and it is dropped.
 *
 * Most are a name disagreement rather than a missing feature, which is worth
 * knowing before anyone "implements" one that already works under another name.
 */
const KNOWN_SLOT_GAPS = {
    // Registry requires `updates`; update-card.js reads { id, fields, title, tags }.
    update_card: ['updates'],
    // status/sortBy/sortDirection: the Find Cards chips promise filtering and
    // sorting search-cards.js does not implement, so a "draft cards" request
    // returns an unfiltered list under a heading that says otherwise.
    // offset: never read, so paging past the first page silently repeats it.
    search_cards: ['status', 'sortBy', 'sortDirection', 'offset'],
    // copy-card.js reads `newTitle`.
    copy_card: ['title'],
    // get-offer-by-id.js takes `country` only; there is no locale handling.
    get_offer_by_id: ['locale'],
    // search-offers.js calls the same concept `language`.
    search_offers: ['locale'],
    // search-collections.js derives its path from `surface`, ignoring the slot.
    search_collections: ['path'],
    // create-release-cards.js reads `variants`. Probably unreachable today: the
    // release flow returns a typed release_cards payload rather than routing
    // this intent through the envelope, so the mismatch has not surfaced.
    'release_create.confirm': ['cardConfigs'],
};

/** Params every action receives from the platform rather than from a slot. */
const PLATFORM_PARAMS = new Set([
    '__ow_headers',
    '__ow_method',
    '__ow_path',
    '__ow_query',
    '__ow_body',
    'landscape',
    '_aemBaseUrl',
]);

function actionFileFor(toolTarget) {
    return path.join(ACTIONS_DIR, `${toolTarget.replace(/_/g, '-')}.js`);
}

/** Names the client rewrites before calling, e.g. get_variations. */
function readClientAliases() {
    const src = fs.readFileSync(MCP_CLIENT, 'utf8');
    const block = src.match(/ACTION_NAME_OVERRIDES\s*=\s*\{([\s\S]*?)\}/);
    if (!block) return {};
    const aliases = {};
    for (const line of block[1].split('\n')) {
        const entry = line.match(/([a-zA-Z_]+)\s*:\s*'([^']+)'/);
        if (entry) aliases[entry[1]] = entry[2];
    }
    return aliases;
}

/**
 * The top-level params an action destructures. Actions declare their contract
 * as `const { a, b, __ow_headers } = params;` on entry, so that line is the
 * closest thing to a signature they have.
 */
function declaredParams(file) {
    const src = fs.readFileSync(file, 'utf8');
    const destructure = src.match(/const\s*\{([^}]*)\}\s*=\s*params\s*;/);
    if (!destructure) return null;
    return new Set(
        destructure[1]
            .split(',')
            .map((part) => part.split(':')[0].split('=')[0].trim())
            .filter(Boolean)
            .filter((name) => !PLATFORM_PARAMS.has(name)),
    );
}

describe('intent registry / mcp action contract', () => {
    let INTENTS;
    let aliases;

    before(async () => {
        ({ INTENTS } = await import('../../src/ai-chat/intent-registry.js'));
        aliases = readClientAliases();
    });

    const routable = () => INTENTS.filter((intent) => intent.tool_target);

    it('finds the action directory and the registry', () => {
        expect(fs.existsSync(ACTIONS_DIR), `actions dir missing at ${ACTIONS_DIR}`).to.equal(true);
        expect(routable().length).to.be.above(20);
    });

    it('has an action, or a client alias, behind every routable intent', () => {
        const unbacked = routable()
            .map((intent) => intent.tool_target)
            .filter((target) => !fs.existsSync(actionFileFor(target)))
            .filter((target) => !aliases[target])
            .filter((target) => !(target in KNOWN_UNBACKED));

        expect(unbacked, `intents the model can pick with nothing behind them: ${unbacked.join(', ')}`).to.deep.equal([]);
    });

    it('does not send a slot the action never reads', () => {
        const gaps = [];

        for (const intent of routable()) {
            if (intent.tool_target in KNOWN_UNBACKED) continue;
            const file = actionFileFor(intent.tool_target);
            if (!fs.existsSync(file)) continue;

            const declared = declaredParams(file);
            if (!declared) continue;

            const allowed = new Set(KNOWN_SLOT_GAPS[intent.name] ?? []);
            const slots = [...(intent.required_slots ?? []), ...(intent.optional_slots ?? [])];
            const unread = slots.filter((slot) => !declared.has(slot) && !allowed.has(slot));

            if (unread.length) gaps.push(`${intent.name} -> ${intent.tool_target}: ${unread.join(', ')}`);
        }

        expect(gaps, `slots the registry sends that the action ignores:\n  ${gaps.join('\n  ')}`).to.deep.equal([]);
    });

    it('reads every required slot, so a confirmed operation cannot fail on arrival', () => {
        const broken = [];

        for (const intent of routable()) {
            if (intent.tool_target in KNOWN_UNBACKED) continue;
            const file = actionFileFor(intent.tool_target);
            if (!fs.existsSync(file)) continue;

            const declared = declaredParams(file);
            if (!declared) continue;

            const allowed = new Set(KNOWN_SLOT_GAPS[intent.name] ?? []);
            const missing = (intent.required_slots ?? []).filter((slot) => !declared.has(slot) && !allowed.has(slot));

            if (missing.length) broken.push(`${intent.name}: ${missing.join(', ')}`);
        }

        expect(broken, `required slots the action never reads:\n  ${broken.join('\n  ')}`).to.deep.equal([]);
    });

    describe('the known debt', () => {
        it('still names only intents that are actually in the registry', () => {
            const names = new Set(routable().map((intent) => intent.tool_target));
            const stale = Object.keys(KNOWN_UNBACKED).filter((target) => !names.has(target));

            expect(stale, `KNOWN_UNBACKED lists targets the registry no longer has: ${stale.join(', ')}`).to.deep.equal([]);
        });

        it('shrinks: an entry that now has an action must leave the list', () => {
            const fixed = Object.keys(KNOWN_UNBACKED)
                .filter((target) => KNOWN_UNBACKED[target] !== 'alias')
                .filter((target) => fs.existsSync(actionFileFor(target)));

            expect(
                fixed,
                `these now have actions and should be removed from KNOWN_UNBACKED: ${fixed.join(', ')}`,
            ).to.deep.equal([]);
        });

        it('shrinks: a slot the action now reads must leave the list', () => {
            const fixed = [];

            for (const [intentName, slots] of Object.entries(KNOWN_SLOT_GAPS)) {
                const intent = INTENTS.find((candidate) => candidate.name === intentName);
                if (!intent) continue;
                const declared = declaredParams(actionFileFor(intent.tool_target));
                if (!declared) continue;
                const nowRead = slots.filter((slot) => declared.has(slot));
                if (nowRead.length) fixed.push(`${intentName}: ${nowRead.join(', ')}`);
            }

            expect(
                fixed,
                `these slots are now read and should be removed from KNOWN_SLOT_GAPS:\n  ${fixed.join('\n  ')}`,
            ).to.deep.equal([]);
        });
    });
});
