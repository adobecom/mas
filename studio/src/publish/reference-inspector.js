const EMPTY_FIELD_MESSAGE = 'Removing these references would leave the field empty. Edit the fragment instead.';
const PENDING_SAVE_MESSAGE =
    'A fragment save is still pending; its outcome is unknown. Reopen the diagnosis after it completes.';
const pendingSaves = new WeakMap();

function combineDetails(...details) {
    return [...new Set(details.filter(Boolean))].join(' ');
}

function fragmentLabel(fragment) {
    return fragment?.fields?.find((field) => ['cardTitle', 'label'].includes(field.name))?.values?.[0] ?? '';
}

function missingValidation(owner, fieldName, valueIndex) {
    const property = `fields.${fieldName}.values[${valueIndex}].<list element>`;
    return owner.validationStatus?.find(
        (entry) => entry.property === property && entry.message === 'references a path that does not exist in JCR',
    );
}

async function removalUpdate(fragments, owner, issues) {
    const removals = new Map();
    const checkedTargets = new Set();
    for (const issue of issues) {
        const field = owner.fields.find((entry) => entry.name === issue.fieldName);
        if (!field?.multiple || !['content-fragment', 'content-reference'].includes(field.type)) {
            throw new Error('Only multi-value reference fields can be cleaned up.');
        }
        if (
            field.values.length !== issue.ownerValues.length ||
            field.values.some((value, index) => value !== issue.ownerValues[index])
        ) {
            throw new Error('The reference field changed. Review the updated diagnosis before removing references.');
        }
        if (field.values[issue.valueIndex] !== issue.targetPath || !missingValidation(owner, field.name, issue.valueIndex)) {
            throw new Error('This reference is no longer confirmed missing.');
        }
        if (!checkedTargets.has(issue.targetPath)) {
            let missing = false;
            try {
                await readFragment(
                    (controller) => fragments.getByPath(issue.targetPath, { references: 'none', signal: controller.signal }),
                    10000,
                );
            } catch (error) {
                if (error.message !== 'Fragment not found') throw error;
                missing = true;
            }
            if (!missing) throw new Error('The reference target is available again. Nothing was removed.');
            checkedTargets.add(issue.targetPath);
        }
        if (!removals.has(field.name)) removals.set(field.name, new Set());
        removals.get(field.name).add(issue.valueIndex);
    }
    return {
        ...owner,
        fields: owner.fields.map((field) => {
            const positions = removals.get(field.name);
            if (!positions) return field;
            const values = field.values.filter((value, index) => !positions.has(index));
            if (!values.some(Boolean)) throw new Error(EMPTY_FIELD_MESSAGE);
            return { ...field, values };
        }),
    };
}

function assertSaveAvailable(saves, id) {
    if (saves.has(id)) throw new Error(PENDING_SAVE_MESSAGE);
}

async function saveRemoval(fragments, updated, saves, timeoutMs) {
    assertSaveAvailable(saves, updated.id);
    const operation = Promise.resolve(fragments.save(updated, { refetchEtag: false })).finally(() => saves.delete(updated.id));
    saves.set(updated.id, operation);
    return readFragment(() => operation, timeoutMs, 'Fragment save timed out.');
}

export async function removeMissingReferences(aem, issues, { hasUnsavedChanges = () => false, saveTimeoutMs = 10000 } = {}) {
    const result = { removedCount: 0, failures: [], savedFragments: [] };
    const owners = new Map();
    for (const issue of issues.filter((entry) => entry.removable)) {
        if (!owners.has(issue.ownerId)) owners.set(issue.ownerId, []);
        owners.get(issue.ownerId).push(issue);
    }
    const fragments = aem.sites.cf.fragments;
    const saves = pendingSaves.get(fragments) ?? new Map();
    pendingSaves.set(fragments, saves);
    for (const [id, ownerIssues] of owners) {
        try {
            assertSaveAvailable(saves, id);
            if (hasUnsavedChanges()) throw new Error('Save or discard unsaved editor changes before removing references.');
            const owner = await readFragment(() => fragments.getWithEtag(id), 10000);
            const updated = await removalUpdate(fragments, owner, ownerIssues);
            if (hasUnsavedChanges()) throw new Error('Save or discard unsaved editor changes before removing references.');
            const saved = await saveRemoval(fragments, updated, saves, saveTimeoutMs);
            result.savedFragments.push(saved);
            result.removedCount += ownerIssues.length;
        } catch (error) {
            result.failures.push({
                ownerId: id,
                ownerPath: ownerIssues[0].ownerPath,
                pending: saves.has(id),
                detail: combineDetails(saves.has(id) ? PENDING_SAVE_MESSAGE : '', error.message),
            });
        }
    }
    return result;
}

function isConfirmedMissing(validation, error) {
    return Boolean(validation && error?.message === 'Fragment not found');
}

function makeIssue({ owner, field, valueIndex, targetPath, validation, ownerValues = [] }, error, target) {
    return {
        category: validation ? 'confirmed-problem' : 'needs-review',
        ownerId: owner.id,
        ownerPath: owner.path,
        ownerTitle: owner.title,
        ownerLabel: fragmentLabel(owner),
        ownerValues,
        fieldName: field.name,
        valueIndex,
        targetPath,
        targetId: target?.id,
        targetTitle: target?.title,
        targetLabel: fragmentLabel(target),
        removable: Boolean(isConfirmedMissing(validation, error) && !target && field.multiple && field.values.length > 1),
        detail: combineDetails(validation?.message, error?.message),
        evidence: validation?.property ?? '',
    };
}

function applyBulkEligibility(issues) {
    const groups = new Map();
    const keyFor = (issue) => JSON.stringify([issue.ownerId, issue.fieldName]);
    for (const issue of issues.filter((entry) => entry.removable)) {
        const key = keyFor(issue);
        if (!groups.has(key)) groups.set(key, { positions: new Set(), valueCount: issue.ownerValues.filter(Boolean).length });
        groups.get(key).positions.add(issue.valueIndex);
    }
    for (const issue of issues) {
        if (!issue.removable) continue;
        const group = groups.get(keyFor(issue));
        if (group.positions.size < group.valueCount) continue;
        issue.removable = false;
        issue.detail = combineDetails(issue.detail, EMPTY_FIELD_MESSAGE);
    }
}

async function readFragment(load, timeoutMs, timeoutMessage = 'Reference lookup timed out.') {
    if (timeoutMs <= 0) throw new Error('The reference inspection time limit was reached.');
    const controller = new AbortController();
    let timer;
    try {
        return await Promise.race([
            load(controller),
            new Promise((resolve, reject) => {
                timer = setTimeout(() => {
                    reject(new Error(timeoutMessage));
                    controller.abort();
                }, timeoutMs);
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
}

function enqueueReferences(owner, queue) {
    for (const field of owner.fields) {
        if (!['content-fragment', 'content-reference'].includes(field.type)) continue;
        const ownerValues = [...field.values];
        for (const [valueIndex, targetPath] of field.values.entries()) {
            if (!targetPath) continue;
            const validation = missingValidation(owner, field.name, valueIndex);
            queue.push({ owner, field, ownerValues, valueIndex, targetPath, validation });
        }
    }
}

export async function inspectReferences(
    aem,
    roots,
    { maxFragments = 500, requestTimeoutMs = 10000, timeoutMs = 30000, concurrency = 4 } = {},
) {
    if (!Number.isInteger(concurrency) || concurrency < 1) throw new RangeError('Concurrency must be a positive integer.');
    const report = { complete: true, inspectedCount: 0, issues: [], coverageGaps: [] };
    const fragments = aem.sites.cf.fragments;
    const fetched = new Map();
    const visited = new Set();
    const budgetGaps = new Map();
    let requestedCount = 0;
    const queue = roots.map((owner) => ({ owner, field: { name: '' }, valueIndex: null, targetPath: owner.path, root: true }));
    const deadline = Date.now() + timeoutMs;
    const read = (load) => {
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) return Promise.resolve({ limited: 'inspection time limit' });
        const timeLimited = remainingMs <= requestTimeoutMs;
        const timeoutMessage = timeLimited ? 'The reference inspection time limit was reached.' : 'Reference lookup timed out.';
        return readFragment(load, Math.min(requestTimeoutMs, remainingMs), timeoutMessage).then(
            (fragment) => ({ fragment }),
            (error) => (timeLimited && error.message === timeoutMessage ? { limited: 'inspection time limit' } : { error }),
        );
    };
    const loadJob = (job) => {
        if (!job.root && !job.targetPath.startsWith('/content/dam/')) {
            return { error: new Error('Reference lookup is not supported for this identifier.') };
        }
        const key = job.root ? `id:${job.owner.id}` : `path:${job.targetPath}`;
        if (!fetched.has(key)) {
            if (requestedCount >= maxFragments) return { limited: 'reference lookup limit' };
            requestedCount++;
            const result = read((controller) =>
                job.root
                    ? fragments.getById(job.owner.id, controller, { references: 'none' })
                    : fragments.getByPath(job.targetPath, { references: 'none', signal: controller.signal }),
            );
            fetched.set(key, result);
            if (job.root && job.targetPath) fetched.set(`path:${job.targetPath}`, result);
        }
        return fetched.get(key);
    };

    while (queue.length) {
        const batch = queue.splice(0, concurrency);
        const results = await Promise.all(batch.map(loadJob));
        for (const [index, job] of batch.entries()) {
            const { fragment, error, limited } = results[index];
            if (error || job.validation) {
                report.issues.push(makeIssue(job, error, fragment));
            }
            if (limited) {
                report.complete = false;
                budgetGaps.set(limited, (budgetGaps.get(limited) ?? 0) + 1);
                continue;
            }
            if (error) {
                if (!isConfirmedMissing(job.validation, error)) {
                    report.complete = false;
                    report.coverageGaps.push({
                        ownerPath: job.targetPath,
                        detail: job.root
                            ? 'This fragment and its references could not be inspected.'
                            : 'References below this target could not be inspected.',
                    });
                }
                continue;
            }
            fetched.set(`path:${fragment.path}`, Promise.resolve({ fragment }));
            if (visited.has(fragment.id)) continue;
            visited.add(fragment.id);
            report.inspectedCount += 1;
            enqueueReferences(fragment, queue);
        }
    }
    for (const [reason, count] of budgetGaps) {
        report.coverageGaps.push({
            ownerPath: '',
            detail: `${count} reference${count === 1 ? '' : 's'} not inspected (${reason} reached).`,
        });
    }
    applyBulkEligibility(report.issues);
    return report;
}
