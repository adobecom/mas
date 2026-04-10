function isAlreadyPublished(fragment) {
    if (!fragment) {
        return { skip: false, reason: 'no-fragment' };
    }
    const publishedAt = fragment.published?.at;
    const modifiedAt = fragment.modified?.at;
    if (!publishedAt) {
        return { skip: false, reason: 'never-published' };
    }
    if (!modifiedAt) {
        return { skip: true, reason: 'already-published', publishedAt, modifiedAt: null };
    }
    if (publishedAt >= modifiedAt) {
        return { skip: true, reason: 'already-published', publishedAt, modifiedAt };
    }
    return { skip: false, reason: 'modified-after-publish', publishedAt, modifiedAt };
}

module.exports = { isAlreadyPublished };
