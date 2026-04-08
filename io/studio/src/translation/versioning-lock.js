const { init } = require('@adobe/aio-lib-state');

const VERSIONING_LOCK_KEY = 'translation-versioning.lock';
const DEFAULT_LEASE_DURATION_MS = 90 * 1000;
const DEFAULT_MAX_ATTEMPTS = 1;
const DEFAULT_INITIAL_RETRY_DELAY_MS = 1000;
const DEFAULT_MAX_RETRY_DELAY_MS = 15000;
const DEFAULT_JITTER_RATIO = 0.2;

function normalizeOwner(owner = {}) {
    return {
        jobId: owner.jobId || null,
        projectId: owner.projectId || null,
        activationId: owner.activationId || null,
    };
}

function sameOwner(lock, owner) {
    const normalizedOwner = normalizeOwner(owner);
    return (
        lock?.jobId === normalizedOwner.jobId &&
        lock?.projectId === normalizedOwner.projectId &&
        (lock?.activationId || null) === normalizedOwner.activationId
    );
}

function toDate(value) {
    return value instanceof Date ? value : new Date(value);
}

function isLockExpired(lock, options = {}) {
    if (!lock?.leaseUntil) {
        return true;
    }
    const now = options.now ? toDate(options.now()) : new Date();
    return new Date(lock.leaseUntil).getTime() <= now.getTime();
}

function buildLockRecord(owner, options = {}) {
    const now = options.now ? toDate(options.now()) : new Date();
    const leaseDurationMs = options.leaseDurationMs ?? DEFAULT_LEASE_DURATION_MS;
    const normalizedOwner = normalizeOwner(owner);
    return {
        ...normalizedOwner,
        acquiredAt: options.acquiredAt || now.toISOString(),
        renewedAt: options.renewedAt || now.toISOString(),
        leaseUntil: new Date(now.getTime() + leaseDurationMs).toISOString(),
    };
}

function getBackoffDelay(attempt, options = {}) {
    const initialRetryDelayMs = options.initialRetryDelayMs ?? DEFAULT_INITIAL_RETRY_DELAY_MS;
    const maxRetryDelayMs = options.maxRetryDelayMs ?? DEFAULT_MAX_RETRY_DELAY_MS;
    const jitterRatio = options.jitterRatio ?? DEFAULT_JITTER_RATIO;
    const random = options.random || Math.random;

    const baseDelay = Math.min(initialRetryDelayMs * 2 ** Math.max(attempt - 1, 0), maxRetryDelayMs);
    const jitterWindow = Math.floor(baseDelay * jitterRatio);
    const jitter = jitterWindow > 0 ? Math.floor(random() * (jitterWindow + 1)) : 0;
    return baseDelay + jitter;
}

async function getVersioningLock() {
    const state = await init();
    const result = await state.get(VERSIONING_LOCK_KEY);
    if (!result?.value) {
        return null;
    }
    return JSON.parse(result.value);
}

async function putVersioningLock(lock, options = {}) {
    const state = await init();
    const ttlSeconds = Math.max(1, Math.ceil((options.leaseDurationMs ?? DEFAULT_LEASE_DURATION_MS) / 1000));
    await state.put(VERSIONING_LOCK_KEY, JSON.stringify(lock), { ttl: ttlSeconds });
    return lock;
}

async function acquireVersioningLock(owner, options = {}) {
    const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    const sleep =
        options.sleep ||
        ((delayMs) => {
            return new Promise((resolve) => setTimeout(resolve, delayMs));
        });

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const currentLock = await getVersioningLock();

        if (!currentLock || isLockExpired(currentLock, options)) {
            const lock = buildLockRecord(owner, options);
            await putVersioningLock(lock, options);
            return {
                acquired: true,
                lock,
                attempt,
            };
        }

        if (sameOwner(currentLock, owner)) {
            const renewedLock = buildLockRecord(owner, {
                ...options,
                acquiredAt: currentLock.acquiredAt,
            });
            await putVersioningLock(renewedLock, options);
            return {
                acquired: true,
                lock: renewedLock,
                attempt,
                alreadyOwned: true,
            };
        }

        if (attempt === maxAttempts) {
            return {
                acquired: false,
                lock: currentLock,
                attempt,
                reason: 'locked',
            };
        }

        const delayMs = getBackoffDelay(attempt, options);
        await sleep(delayMs);
    }

    return {
        acquired: false,
        lock: null,
        attempt: maxAttempts,
        reason: 'unknown',
    };
}

async function renewVersioningLock(owner, options = {}) {
    const currentLock = await getVersioningLock();
    if (!currentLock) {
        return {
            renewed: false,
            reason: 'missing',
        };
    }
    if (!sameOwner(currentLock, owner)) {
        return {
            renewed: false,
            reason: 'not_owner',
            lock: currentLock,
        };
    }
    if (isLockExpired(currentLock, options)) {
        return {
            renewed: false,
            reason: 'expired',
            lock: currentLock,
        };
    }

    const renewedLock = buildLockRecord(owner, {
        ...options,
        acquiredAt: currentLock.acquiredAt,
    });
    await putVersioningLock(renewedLock, options);
    return {
        renewed: true,
        lock: renewedLock,
    };
}

async function releaseVersioningLock(owner) {
    const currentLock = await getVersioningLock();
    if (!currentLock) {
        return {
            released: false,
            reason: 'missing',
        };
    }
    if (!sameOwner(currentLock, owner)) {
        return {
            released: false,
            reason: 'not_owner',
            lock: currentLock,
        };
    }

    const state = await init();
    await state.delete(VERSIONING_LOCK_KEY);
    return {
        released: true,
    };
}

module.exports = {
    VERSIONING_LOCK_KEY,
    DEFAULT_LEASE_DURATION_MS,
    DEFAULT_MAX_ATTEMPTS,
    DEFAULT_INITIAL_RETRY_DELAY_MS,
    DEFAULT_MAX_RETRY_DELAY_MS,
    DEFAULT_JITTER_RATIO,
    isLockExpired,
    acquireVersioningLock,
    getVersioningLock,
    renewVersioningLock,
    releaseVersioningLock,
};
