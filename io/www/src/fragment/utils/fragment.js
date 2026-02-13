function getFieldValues(fragment, fieldName) {
    const fields = fragment?.fields;
    if (!Array.isArray(fields)) return [];
    return fields.find((f) => f.name === fieldName)?.values || [];
}

export { getFieldValues };
