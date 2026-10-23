export function isFragmentNotFoundError(error) {
    const status = error?.status ?? error?.response?.status;
    if (status !== undefined) return status === 404;
    return /\b404\b/.test(error?.message ?? '');
}

export async function getFragmentByPathOrNull(fragmentsApi, path, options) {
    try {
        return (await fragmentsApi.getByPath(path, options)) ?? null;
    } catch (error) {
        if (isFragmentNotFoundError(error)) return null;
        throw error;
    }
}
