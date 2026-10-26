// Decides, per rendered card field, which source produced it (default card, a variation, a mask,
// an MEP swap) from the page's own stamps plus already-fetched fragment data. When the inputs
// cannot settle a field, the answer is Unknown rather than a guess.
(() => {
    const BARE_FIELDS = new Map([
        ['price', 'prices'],
        ['cta', 'ctas'],
    ]);
    const FIELD_TYPES = ['field', 'mas-field'];
    const MEP_HINT = 'Swapped by MEP — add ?mep to the URL to see which manifest';
    const MEP_MANIFEST_UNKNOWN = 'Swapped by MEP — manifest unknown';
    const UNAVAILABLE = 'Variation fields unavailable';
    const DEFAULT_CARD = { source: 'default', label: 'Default card' };
    const UNKNOWN = { source: 'unknown', label: 'Unknown' };
    const NOT_SWAPPED = { swapped: false, authoredId: null, manifestId: null };

    function deps() {
        return { mirror: window.MASMergeMirror, mep: window.MASMepState, parser: window.MASFragmentParser };
    }

    function id8(id) {
        return String(id ?? '').slice(0, 8);
    }

    function attr(element, name) {
        return element.getAttribute(name) || null;
    }

    function readContext(element) {
        return {
            resolvedId: attr(element, 'fragment-id'),
            variationId: attr(element, 'variation-id'),
            maskId: attr(element, 'mask-id'),
            promoProject: attr(element, 'data-promotion-project'),
            promoVariationProject: attr(element, 'data-promotion-variation-project'),
        };
    }

    // elementType is the card detector's: 'field' (mas-field), 'price'/'cta' (bare), else a card.
    function readStamps(element, elementType) {
        if (BARE_FIELDS.has(elementType)) {
            const owner = element.closest('mas-field[field]');
            const field = owner ? owner.getAttribute('field') : BARE_FIELDS.get(elementType);
            return { field, requestedId: null, ...readContext(element), failed: false, loading: false };
        }
        const fragment = element.querySelector('aem-fragment');
        const requestedId = fragment ? attr(fragment, 'fragment') : null;
        const context = readContext(element);
        if (FIELD_TYPES.includes(elementType)) {
            // mas-field stamps fragment-id once its fragment loads; aem-fragment gets class error if it fails.
            const failed = Boolean(fragment?.classList.contains('error'));
            const loading = !context.resolvedId && !failed;
            return { field: attr(element, 'field') || '', requestedId, ...context, failed, loading };
        }
        const failed = element.hasAttribute('failed');
        return { field: '', requestedId, ...context, resolvedId: requestedId, failed, loading: false };
    }

    // mas-overrides is the evidence only while the MEP map is missing or still empty: a card authored
    // directly with a replacement id is listed there too, so a populated map overrules it.
    function swapFor(stamps, mepState = null, overrideIds = null) {
        const swap = deps().mep.findSwap(mepState, stamps);
        if (swap) return { swapped: true, ...swap };
        if (mepState?.swaps?.length) return NOT_SWAPPED;
        const replacementId = stamps.requestedId ?? stamps.resolvedId;
        return overrideIds?.has(replacementId) ? { swapped: true, authoredId: null, manifestId: null } : NOT_SWAPPED;
    }

    function hasFieldSwap(mepState, field) {
        const { normalizeField } = deps().mep;
        return Boolean(mepState?.swaps?.some((swap) => normalizeField(swap.field) === normalizeField(field)));
    }

    function hasFields(data) {
        const fields = data?.fields;
        return Boolean(fields) && typeof fields === 'object' && !Array.isArray(fields);
    }

    // MEP names manifests only in preview, so the ?mep hint is useless once preview is already on.
    function swapReason(swap, mepState) {
        if (swap.manifestId) return `Swapped by MEP · ${swap.manifestId}`;
        return mepState?.preview === true ? MEP_MANIFEST_UNKNOWN : MEP_HINT;
    }

    function describe(type, audiences, project) {
        const audience = audiences.join(', ');
        if (type === 'grouped') return { source: 'grouped', label: audience ? `Grouped · ${audience}` : 'Grouped variation' };
        if (type === 'promo') return { source: 'promo', label: project ? `Promo · ${project}` : 'Promo variation' };
        if (type === 'locale') return { source: 'locale', label: 'Locale variation (legacy)' };
        return DEFAULT_CARD;
    }

    // What a promo link needs to find its project: the variation's folder name and the title IO stamped.
    function promotionOf(type, name, title = null) {
        return type === 'promo' ? { name, title } : null;
    }

    function appliedReason(type, audiences, project) {
        if (type === 'promo') return project ? `IO applied promo ${project}` : 'IO applied promo';
        if (type === 'grouped') {
            return audiences.length
                ? `IO applied grouped variation for ${audiences.join(', ')}`
                : 'IO applied grouped variation';
        }
        return 'IO applied locale variation (legacy)';
    }

    // IO stamps promoVariationProject only when it merged promo content.
    function appliedType(stamps, classification) {
        return stamps.promoVariationProject ? 'promo' : classification.type;
    }

    const CONTRIBUTION_REASONS = {
        cleared: 'Variation cleared this field',
        combined: 'Combined with default card features',
    };

    // What the IO-merged variation did to this field, or null when the field was left to the parent.
    function mergedVariation(stamps, variationData, variant) {
        if (!hasFields(variationData)) return { ...UNKNOWN, reason: UNAVAILABLE };
        const { mirror, mep, parser } = deps();
        const name = mep.normalizeField(stamps.field);
        // attributeFields knows which variant arrays IO concatenates with the parent ('combined').
        const [attributed] = mirror.attributeFields({ [name]: variationData.fields[name] }, { variant });
        const contribution = attributed?.contribution ?? 'inherit';
        if (contribution === 'inherit') return null;
        const classification = parser.classifyVariation(variationData);
        const type = appliedType(stamps, classification);
        if (!type) return { ...UNKNOWN, reason: 'Variation type unknown' };
        const { audiences, promotionName } = classification;
        const project = stamps.promoVariationProject || promotionName;
        const reason = CONTRIBUTION_REASONS[contribution] || appliedReason(type, audiences, project);
        const promotion = promotionOf(type, promotionName, stamps.promoVariationProject);
        return { ...describe(type, audiences, project), reason, ioMerged: true, promotion };
    }

    function contentSource(stamps, { variationData = null, requestedData = null, variant, mepState = null }, swap) {
        const merged = stamps.variationId ? mergedVariation(stamps, variationData, variant) : null;
        if (swap.swapped) {
            const reason = swapReason(swap, mepState);
            if (merged) return { ...merged, reason: `${reason}; ${merged.reason}` };
            if (!hasFields(requestedData)) return { ...UNKNOWN, reason: `${reason}; ${UNAVAILABLE}` };
            const { type, audiences, promotionName } = deps().parser.classifyVariation(requestedData);
            return { ...describe(type, audiences, promotionName), reason, promotion: promotionOf(type, promotionName) };
        }
        if (merged) return merged;
        return {
            ...DEFAULT_CARD,
            reason: stamps.variationId ? 'Inherited from default card — variation left it empty' : 'No variation applied',
        };
    }

    // Without the mask's fields there is no telling whether the mask replaced this field.
    function withMask(content, stamps, maskData) {
        if (!stamps.maskId) return content;
        const maskId8 = id8(stamps.maskId);
        if (!hasFields(maskData)) return { ...UNKNOWN, reason: `${content.reason}; Mask ${maskId8} fields unavailable` };
        const { mirror, mep } = deps();
        const contribution = mirror.fieldContribution(maskData.fields[mep.normalizeField(stamps.field)]);
        if (contribution === 'inherit') return content;
        return { source: 'mask', label: 'Mask', reason: `Mask ${maskId8} applied after the variation` };
    }

    // IO merges the default and the regional promo together but stamps only the default one, so on a
    // region-locale page any field of a promo card may come from the regional promo.
    function withRegionalNote(content, stamps, { variationData = null, isRegionLocale = false }) {
        const promoApplied =
            Boolean(stamps.variationId) && appliedType(stamps, deps().parser.classifyVariation(variationData)) === 'promo';
        if (!isRegionLocale || !promoApplied || content.source === 'mask') return content;
        return { ...content, reason: `${content.reason}; Regional promo may also apply` };
    }

    // IO's 404 tells a fragment with no copy in the page's language from one that does not exist.
    const FAILURES = {
        'missing-locale': ({ locale }) => ({
            label: `Not in ${locale}`,
            detail: `has no ${locale} copy, so this field renders empty`,
        }),
        'not-found': () => ({ label: 'Not found', detail: 'does not exist or is not published' }),
    };
    const DID_NOT_LOAD = { label: 'Failed to load', detail: 'did not load' };

    function failedSource(requestedId, swap, mepState, miss) {
        const { label, detail } = FAILURES[miss?.kind]?.(miss) ?? DID_NOT_LOAD;
        const reason = requestedId ? `Fragment ${id8(requestedId)} ${detail}` : `Fragment ${detail}`;
        return { source: 'failed', label, reason: swap.swapped ? `${reason}; ${swapReason(swap, mepState)}` : reason };
    }

    function stampedSource(stamps, inputs, requestedId, swap) {
        if (stamps.failed) return failedSource(requestedId, swap, inputs.mepState, inputs.miss);
        if (stamps.loading) return { ...UNKNOWN, reason: 'Fragment still loading' };
        if (!requestedId) return { ...UNKNOWN, reason: 'Not linked to a MAS fragment' };
        // An unwrapped element's resolved id can differ from the MEP replacement id (e.g. on localized pages).
        if (!swap.swapped && !stamps.requestedId && hasFieldSwap(inputs.mepState, stamps.field)) {
            return { ...UNKNOWN, reason: 'Could not match this element to an MEP swap' };
        }
        return withRegionalNote(withMask(contentSource(stamps, inputs, swap), stamps, inputs.maskData), stamps, inputs);
    }

    // The fragment whose content the field shows: the IO-merged variation, else the requested fragment.
    // Studio cannot open a mask by id, so a masked field links nowhere.
    function supplierOf(content, stamps, requestedId) {
        if (content.source === 'mask') return null;
        return content.ioMerged ? stamps.variationId : requestedId;
    }

    // An unwrapped price/CTA keeps no aem-fragment, so its resolved id stands in for the requested one.
    function resolveWithSwap(stamps, inputs, swap) {
        const requestedId = stamps.requestedId ?? stamps.resolvedId;
        const content = stampedSource(stamps, inputs, requestedId, swap);
        return {
            field: stamps.field,
            ...content,
            requestedId,
            variationId: stamps.variationId ?? null,
            authoredId: swap.swapped ? swap.authoredId : requestedId,
            manifestId: swap.manifestId,
            swapped: swap.swapped,
            ioMerged: content.ioMerged === true,
            supplierId: supplierOf(content, stamps, requestedId),
            promotion: content.promotion ?? null,
        };
    }

    function resolveField(stamps, inputs = {}) {
        return resolveWithSwap(stamps, inputs, swapFor(stamps, inputs.mepState, inputs.overrideIds));
    }

    function cardFields(stamps, { variationData = null, requestedData = null }, variant) {
        const { mirror } = deps();
        let fields = [];
        if (stamps.variationId && hasFields(variationData)) {
            fields = mirror.attributeFields(variationData.fields, { variant }).map(({ field }) => field);
        } else if (hasFields(requestedData)) {
            fields = Object.keys(requestedData.fields).filter((field) => !mirror.INTERNAL_FIELDS.includes(field));
        }
        return fields.length ? fields : [''];
    }

    // A whole card is requested (and MEP-swapped) once, so the card-level swap applies to every field.
    function resolveCard(stamps, inputs = {}, { variant } = {}) {
        const swap = swapFor(stamps, inputs.mepState, inputs.overrideIds);
        if (stamps.failed || stamps.loading) return [resolveWithSwap(stamps, inputs, swap)];
        const cardInputs = { ...inputs, variant };
        return cardFields(stamps, inputs, variant).map((field) => resolveWithSwap({ ...stamps, field }, cardInputs, swap));
    }

    function groupKey(stamps, mepState) {
        return deps().mep.findSwap(mepState, stamps)?.authoredId ?? stamps.requestedId ?? stamps.resolvedId;
    }

    // Mixed only when the entries came from more than one fragment request or IO-merged variation.
    function isMixed(entries) {
        return new Set(entries.map((entry) => `${entry.requestedId ?? ''}|${entry.variationId ?? ''}`)).size > 1;
    }

    function uniqueBy(items, keyOf) {
        const seen = new Map();
        items.forEach((item) => {
            const key = keyOf(item);
            if (!seen.has(key)) seen.set(key, item);
        });
        return [...seen.values()];
    }

    function groupBy(items, keyOf) {
        const groups = new Map();
        items.forEach((item) => {
            const key = keyOf(item);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(item);
        });
        return [...groups.values()];
    }

    // A swap keyed by the empty field replaces the whole card.
    function joinFields(fields) {
        return [...new Set(fields.map((field) => field || 'whole card'))].join(', ');
    }

    function swapStep(fields, replacementId, manifestId) {
        return `MEP swaps ${joinFields(fields)} → ${id8(replacementId)} (${manifestId || 'manifest unknown'})`;
    }

    function groupSwaps(group, mepState) {
        return (mepState?.swaps ?? []).filter((swap) => swap.authoredId === group.groupKey);
    }

    function mapSwapSteps(group, mepState) {
        const { normalizeField } = deps().mep;
        return groupBy(groupSwaps(group, mepState), (swap) => swap.replacementId).map((swaps) => {
            const [first] = swaps;
            const fields = swaps.map((swap) => normalizeField(swap.field));
            return swapStep(fields, first.replacementId, first.manifestId);
        });
    }

    function mapExplains(entry, mepState) {
        return Boolean(
            mepState?.swaps.some((swap) => swap.authoredId === entry.authoredId && swap.replacementId === entry.requestedId),
        );
    }

    // Swapped entries the map does not list (known only from mas-overrides) still show their swap.
    function unmappedSwapSteps(entries, mepState) {
        const swapped = entries.filter((entry) => entry.swapped && !mapExplains(entry, mepState));
        return groupBy(swapped, (entry) => entry.requestedId).map((group) => {
            const fields = group.map((entry) => entry.field);
            return swapStep(fields, group[0].requestedId, null);
        });
    }

    function ioMergeSteps(entries) {
        const merged = entries.filter((entry) => entry.ioMerged);
        return groupBy(merged, (entry) => `${entry.variationId}|${entry.label}`).map((group) => {
            const [first] = group;
            const fields = group.map((entry) => entry.field);
            return `IO merges ${first.label} (${id8(first.variationId)}) into ${joinFields(fields)}`;
        });
    }

    // Text in a card's steps that opens in Studio: every fragment id, and each IO-merged promo label.
    function traceLinks(group, entries, mepState) {
        const merged = entries.filter((entry) => entry.ioMerged);
        const ids = [
            group.groupKey,
            ...groupSwaps(group, mepState).map((swap) => swap.replacementId),
            ...entries.map((entry) => entry.requestedId),
            ...merged.map((entry) => entry.variationId),
        ].filter(Boolean);
        const fragmentLinks = [...new Set(ids)].map((id) => ({ text: id8(id), fragmentId: id }));
        const promoLinks = uniqueBy(
            merged.filter((entry) => entry.promotion),
            (entry) => entry.label,
        ).map((entry) => ({ text: entry.label, promotion: entry.promotion }));
        return [...fragmentLinks, ...promoLinks];
    }

    function failedSteps(entries) {
        return entries
            .filter((entry) => entry.source === 'failed')
            .map((entry) => `${entry.label}: ${entry.field || 'card'} (${id8(entry.requestedId)})`);
    }

    function cardTrace(group, mepState) {
        const entries = uniqueBy(
            group.entries,
            (entry) => `${entry.field}|${entry.source}|${entry.requestedId}|${entry.variationId}`,
        );
        return {
            groupKey: group.groupKey,
            cardName: group.cardName,
            mixed: Boolean(group.mixed),
            steps: [
                `Page asks for ${id8(group.groupKey)}`,
                ...mapSwapSteps(group, mepState),
                ...unmappedSwapSteps(entries, mepState),
                ...ioMergeSteps(entries),
                ...failedSteps(entries),
            ],
            links: traceLinks(group, entries, mepState),
        };
    }

    function mepManifests(mepState) {
        if (!mepState) return [];
        return groupBy(mepState.swaps, (swap) => swap.manifestId).map((swaps) => ({
            manifestId: swaps[0].manifestId,
            swaps: swaps.map(({ authoredId, field, replacementId }) => ({ authoredId, field, replacementId })),
        }));
    }

    function buildPageTrace(groups, mepState) {
        return {
            mep: { available: Boolean(mepState), preview: mepState?.preview === true, manifests: mepManifests(mepState) },
            cards: groups.map((group) => cardTrace(group, mepState)),
        };
    }

    const MASSourceEngine = { readStamps, swapFor, resolveField, resolveCard, groupKey, isMixed, buildPageTrace };

    if (typeof window !== 'undefined') {
        window.MASSourceEngine = MASSourceEngine;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MASSourceEngine;
    }
})();
