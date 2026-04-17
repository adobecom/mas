const { init } = require('@adobe/aio-lib-state');

const QUEUE_KEY = 'translation-queue.pending';
const QUEUE_LOCK_KEY = 'translation-queue.lock';
const QUEUE_TTL = 7 * 24 * 60 * 60;
const DEFAULT_QUEUE_LOCK_LEASE_MS = 30 * 1000;
const DEFAULT_QUEUE_MUTATION_RETRY_DELAY_MS = 50;
const DEFAULT_QUEUE_MUTATION_MAX_ATTEMPTS = 5;

function toDate(value) {
    return value instanceof Date ? value : new Date(value);
}

function createQueueLockRecord(ownerId, options = {}) {
    const now = options.now ? toDate(options.now()) : new Date();
    const leaseDurationMs = options.leaseDurationMs ?? DEFAULT_QUEUE_LOCK_LEASE_MS;
    return {
        ownerId,
        acquiredAt: now.toISOString(),
        leaseUntil: new Date(now.getTime() + leaseDurationMs).toISOString(),
    };
}

function isQueueLockExpired(lock, options = {}) {
    if (!lock?.leaseUntil) {
        return true;
    }
    const now = options.now ? toDate(options.now()) : new Date();
    return new Date(lock.leaseUntil).getTime() <= now.getTime();
}

async function getPendingQueue() {
    const state = await init();
    const result = await state.get(QUEUE_KEY);
    if (!result?.value) {
        return [];
    }
    return JSON.parse(result.value);
}

async function putPendingQueue(queue, options = {}) {
    const state = await init();
    const ttl = options.ttl ?? QUEUE_TTL;
    await state.put(QUEUE_KEY, JSON.stringify(queue), { ttl });
    return queue;
}

async function getQueueLength() {
    const queue = await getPendingQueue();
    return queue.length;
}

async function peekNextJob() {
    const queue = await getPendingQueue();
    return queue[0] || null;
}

async function enqueueJob(jobId, options = {}) {
    if (options.skipLock) {
        return enqueueJobUnsafe(jobId, options);
    }
    return withQueueMutationLock(async () => enqueueJobUnsafe(jobId, options), options);
}

async function removeJob(jobId, options = {}) {
    if (options.skipLock) {
        return removeJobUnsafe(jobId, options);
    }
    return withQueueMutationLock(async () => removeJobUnsafe(jobId, options), options);
}

async function enqueueJobUnsafe(jobId, options = {}) {
    const queue = await getPendingQueue();
    if (!queue.includes(jobId)) {
        queue.push(jobId);
        await putPendingQueue(queue, options);
    }
    return queue;
}

async function removeJobUnsafe(jobId, options = {}) {
    const queue = await getPendingQueue();
    const filteredQueue = queue.filter((queuedJobId) => queuedJobId !== jobId);
    if (filteredQueue.length !== queue.length) {
        await putPendingQueue(filteredQueue, options);
    }
    return filteredQueue;
}

async function getQueueLock() {
    const state = await init();
    const result = await state.get(QUEUE_LOCK_KEY);
    if (!result?.value) {
        return null;
    }
    return JSON.parse(result.value);
}

async function putQueueLock(lock, options = {}) {
    const state = await init();
    const ttlSeconds = Math.max(1, Math.ceil((options.leaseDurationMs ?? DEFAULT_QUEUE_LOCK_LEASE_MS) / 1000));
    await state.put(QUEUE_LOCK_KEY, JSON.stringify(lock), { ttl: ttlSeconds });
    return lock;
}

async function acquireQueueLock(ownerId, options = {}) {
    const currentLock = await getQueueLock();
    if (!currentLock || isQueueLockExpired(currentLock, options)) {
        const lock = createQueueLockRecord(ownerId, options);
        await putQueueLock(lock, options);
        return {
            acquired: true,
            lock,
        };
    }

    if (currentLock.ownerId === ownerId) {
        const renewedLock = createQueueLockRecord(ownerId, options);
        await putQueueLock(renewedLock, options);
        return {
            acquired: true,
            lock: renewedLock,
            alreadyOwned: true,
        };
    }

    return {
        acquired: false,
        lock: currentLock,
        reason: 'locked',
    };
}

async function releaseQueueLock(ownerId) {
    const currentLock = await getQueueLock();
    if (!currentLock) {
        return {
            released: false,
            reason: 'missing',
        };
    }
    if (currentLock.ownerId !== ownerId) {
        return {
            released: false,
            reason: 'not_owner',
            lock: currentLock,
        };
    }

    const state = await init();
    await state.delete(QUEUE_LOCK_KEY);
    return {
        released: true,
    };
}

async function withQueueMutationLock(callback, options = {}) {
    const ownerId = options.ownerId || `queue-mutation-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const maxAttempts = options.maxAttempts ?? DEFAULT_QUEUE_MUTATION_MAX_ATTEMPTS;
    const retryDelayMs = options.retryDelayMs ?? DEFAULT_QUEUE_MUTATION_RETRY_DELAY_MS;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const lock = await acquireQueueLock(ownerId, options);
        if (lock.acquired) {
            try {
                return await callback();
            } finally {
                await releaseQueueLock(ownerId);
            }
        }

        if (attempt === maxAttempts) {
            throw new Error('Queue lock is already held');
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }

    throw new Error('Queue lock is already held');
}

module.exports = {
    QUEUE_KEY,
    QUEUE_LOCK_KEY,
    QUEUE_TTL,
    DEFAULT_QUEUE_LOCK_LEASE_MS,
    DEFAULT_QUEUE_MUTATION_RETRY_DELAY_MS,
    DEFAULT_QUEUE_MUTATION_MAX_ATTEMPTS,
    isQueueLockExpired,
    acquireQueueLock,
    releaseQueueLock,
    getPendingQueue,
    putPendingQueue,
    getQueueLength,
    peekNextJob,
    enqueueJob,
    removeJob,
    enqueueJobUnsafe,
    removeJobUnsafe,
    withQueueMutationLock,
};
