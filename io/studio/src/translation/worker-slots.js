const { init } = require('@adobe/aio-lib-state');

const WORKER_SLOTS_KEY = 'translation-worker.slots';
const DEFAULT_CAPACITY = 2;
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

function sameOwner(slot, owner) {
    const normalizedOwner = normalizeOwner(owner);
    return (
        slot?.jobId === normalizedOwner.jobId &&
        slot?.projectId === normalizedOwner.projectId &&
        (slot?.activationId || null) === normalizedOwner.activationId
    );
}

function toDate(value) {
    return value instanceof Date ? value : new Date(value);
}

function isSlotExpired(slot, options = {}) {
    if (!slot?.leaseUntil) {
        return true;
    }
    const now = options.now ? toDate(options.now()) : new Date();
    return new Date(slot.leaseUntil).getTime() <= now.getTime();
}

function buildSlotRecord(owner, options = {}) {
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

async function readSlots() {
    const state = await init();
    const result = await state.get(WORKER_SLOTS_KEY);
    if (!result?.value) {
        return [];
    }
    try {
        const parsed = JSON.parse(result.value);
        return Array.isArray(parsed?.slots) ? parsed.slots : [];
    } catch (e) {
        return [];
    }
}

async function writeSlots(slots, options = {}) {
    const state = await init();
    const ttlSeconds = Math.max(1, Math.ceil((options.leaseDurationMs ?? DEFAULT_LEASE_DURATION_MS) / 1000));
    await state.put(WORKER_SLOTS_KEY, JSON.stringify({ slots }), { ttl: ttlSeconds });
    return slots;
}

function pruneExpired(slots, options = {}) {
    return slots.filter((slot) => !isSlotExpired(slot, options));
}

async function getActiveSlots(options = {}) {
    const slots = await readSlots();
    return pruneExpired(slots, options);
}

async function acquireWorkerSlot(owner, options = {}) {
    const capacity = options.capacity ?? DEFAULT_CAPACITY;
    const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    const sleep =
        options.sleep ||
        ((delayMs) => {
            return new Promise((resolve) => setTimeout(resolve, delayMs));
        });

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const slots = pruneExpired(await readSlots(), options);

        const existingIndex = slots.findIndex((slot) => sameOwner(slot, owner));
        if (existingIndex !== -1) {
            const renewed = buildSlotRecord(owner, {
                ...options,
                acquiredAt: slots[existingIndex].acquiredAt,
            });
            const updated = [...slots];
            updated[existingIndex] = renewed;
            await writeSlots(updated, options);
            return {
                acquired: true,
                slot: renewed,
                attempt,
                alreadyOwned: true,
            };
        }

        if (slots.length < capacity) {
            const slot = buildSlotRecord(owner, options);
            await writeSlots([...slots, slot], options);
            return {
                acquired: true,
                slot,
                attempt,
            };
        }

        if (attempt === maxAttempts) {
            return {
                acquired: false,
                slots,
                attempt,
                reason: 'no_slots_available',
            };
        }

        const delayMs = getBackoffDelay(attempt, options);
        await sleep(delayMs);
    }

    return {
        acquired: false,
        slots: [],
        attempt: maxAttempts,
        reason: 'unknown',
    };
}

async function renewWorkerSlot(owner, options = {}) {
    const slots = await readSlots();
    const index = slots.findIndex((slot) => sameOwner(slot, owner));
    if (index === -1) {
        return {
            renewed: false,
            reason: 'missing',
        };
    }
    if (isSlotExpired(slots[index], options)) {
        return {
            renewed: false,
            reason: 'expired',
            slot: slots[index],
        };
    }

    const renewed = buildSlotRecord(owner, {
        ...options,
        acquiredAt: slots[index].acquiredAt,
    });
    const updated = [...slots];
    updated[index] = renewed;
    await writeSlots(updated, options);
    return {
        renewed: true,
        slot: renewed,
    };
}

async function releaseWorkerSlot(owner) {
    const slots = await readSlots();
    const index = slots.findIndex((slot) => sameOwner(slot, owner));
    if (index === -1) {
        return {
            released: false,
            reason: 'missing',
        };
    }

    const remaining = slots.filter((_, i) => i !== index);
    if (remaining.length === 0) {
        const state = await init();
        await state.delete(WORKER_SLOTS_KEY);
    } else {
        await writeSlots(remaining);
    }
    return {
        released: true,
    };
}

module.exports = {
    WORKER_SLOTS_KEY,
    DEFAULT_CAPACITY,
    DEFAULT_LEASE_DURATION_MS,
    DEFAULT_MAX_ATTEMPTS,
    DEFAULT_INITIAL_RETRY_DELAY_MS,
    DEFAULT_MAX_RETRY_DELAY_MS,
    DEFAULT_JITTER_RATIO,
    isSlotExpired,
    acquireWorkerSlot,
    getActiveSlots,
    renewWorkerSlot,
    releaseWorkerSlot,
};
