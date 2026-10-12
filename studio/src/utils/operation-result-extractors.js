export function extractFragmentIdsFromMessage(message) {
    const result = message?.operationResult;
    if (!result) return [];
    if (Array.isArray(result.results)) {
        return result.results.map((f) => f?.id).filter(Boolean);
    }
    if (Array.isArray(result.rawResult?.cards)) {
        return result.rawResult.cards
            .filter((c) => c?.success !== false)
            .map((c) => c?.card?.id ?? c?.id)
            .filter(Boolean);
    }
    if (Array.isArray(result.updatedCards)) {
        return result.updatedCards.map((f) => f?.id).filter(Boolean);
    }
    if (Array.isArray(result.fragmentIds)) {
        return result.fragmentIds.filter(Boolean);
    }
    return [];
}

export function extractFragmentSummariesFromMessage(message, host) {
    const result = message?.operationResult;
    if (!result) return [];
    const variantOf = (f) => host?.extractVariant?.(f) ?? f?.variant ?? null;
    const osiOf = (f) => host?.extractOsi?.(f) ?? f?.osi ?? null;
    if (Array.isArray(result.results)) {
        return result.results.map((f) => ({
            id: f?.id,
            title: f?.title || f?.cardTitle,
            variant: variantOf(f),
            osi: osiOf(f),
        }));
    }
    if (Array.isArray(result.rawResult?.cards)) {
        return result.rawResult.cards
            .filter((c) => c?.success !== false)
            .map((c) => {
                const card = c?.card ?? c;
                const data = card?.fragmentData ?? card;
                return {
                    id: card?.id,
                    title: card?.title,
                    variant: card?.variant ?? variantOf(data),
                    osi: osiOf(data),
                };
            });
    }
    return [];
}
