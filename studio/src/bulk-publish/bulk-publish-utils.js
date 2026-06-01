export function getProjectField(project, name, fallback) {
    const data = project.value ?? project;
    return data.getFieldValue?.(name) ?? data[name] ?? fallback;
}

export function getProjectFieldList(project, name) {
    const data = project.value ?? project;
    return data.getFieldValues?.(name) ?? data[name] ?? [];
}
