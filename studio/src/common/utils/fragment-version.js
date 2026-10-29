export function versionFieldValues(fragment) {
    if (!fragment) return new Map();
    return new Map([
        ['@title', fragment.title ?? ''],
        ['@description', fragment.description ?? ''],
        ['@tags', fragment.tags ?? []],
        ...(fragment.fields ?? []).map((field) => [field.name, field.values ?? null]),
    ]);
}

export function compareVersionValues(before, after, missingValue) {
    const differences = [];
    for (const field of new Set([...before.keys(), ...after.keys()])) {
        const previous = before.has(field) ? before.get(field) : missingValue;
        const next = after.has(field) ? after.get(field) : missingValue;
        if (JSON.stringify(previous) !== JSON.stringify(next)) {
            differences.push({ field, before: previous, after: next });
        }
    }
    return differences;
}

export function restoreVersionFields(current, historical, fields) {
    const selected = new Set(fields);
    const previous = new Map(historical.map((field) => [field.name, field]));
    const restored = current.map((field) =>
        selected.has(field.name) && previous.has(field.name)
            ? { ...field, values: structuredClone(previous.get(field.name).values) }
            : field,
    );
    for (const field of historical) {
        if (selected.has(field.name) && !restored.some((item) => item.name === field.name)) {
            restored.push(structuredClone(field));
        }
    }
    return restored;
}
