export const DEFAULT_REQUEST_BUDGETS = { eds: 180, odin: 20 };

export function resolveRequestBudgets(environment = process.env) {
    const fleet = environment.NALA_TOTAL_WORKERS !== undefined || environment.NALA_WORKER_COUNT !== undefined;
    const actualWorkers = Number(environment.NALA_RUN_WORKERS || 1);
    const totalWorkers = fleet ? Number(environment.NALA_TOTAL_WORKERS) : actualWorkers;
    const allocatedWorkers = fleet ? Number(environment.NALA_WORKER_COUNT) : actualWorkers;
    if (
        !Number.isInteger(actualWorkers) ||
        actualWorkers <= 0 ||
        !Number.isInteger(totalWorkers) ||
        !Number.isInteger(allocatedWorkers) ||
        allocatedWorkers <= 0 ||
        totalWorkers < allocatedWorkers ||
        actualWorkers > allocatedWorkers
    ) {
        throw new Error(
            'Nala worker allocation requires positive counts, both fleet counts together, and actual workers within the allocation',
        );
    }
    const edsBudget = Number(environment.NALA_EDS_TOTAL_MAX_RPS || DEFAULT_REQUEST_BUDGETS.eds);
    const odinBudget = Number(environment.NALA_ODIN_MAX_RPS || DEFAULT_REQUEST_BUDGETS.odin);
    if (!Number.isFinite(edsBudget) || edsBudget <= 0 || !Number.isFinite(odinBudget) || odinBudget <= 0) {
        throw new Error('Nala request budgets must be finite positive RPS values');
    }
    const edsDisabled = environment.NALA_EDS_THROTTLE_DISABLED === '1';
    const edsOverride = environment.NALA_EDS_MAX_RPS !== undefined && environment.NALA_EDS_MAX_RPS !== '';
    const odinOverride = environment.NALA_ODIN_PREVIEW_MAX_RPS !== undefined && environment.NALA_ODIN_PREVIEW_MAX_RPS !== '';
    const edsPerWorker = edsDisabled ? 0 : edsOverride ? Number(environment.NALA_EDS_MAX_RPS) : edsBudget / totalWorkers;
    const odinPerInvocation = odinOverride
        ? Number(environment.NALA_ODIN_PREVIEW_MAX_RPS)
        : (odinBudget * allocatedWorkers) / totalWorkers;
    if (
        (!edsDisabled && (!Number.isFinite(edsPerWorker) || edsPerWorker <= 0)) ||
        !Number.isFinite(odinPerInvocation) ||
        odinPerInvocation <= 0
    ) {
        throw new Error('Nala per-worker/per-invocation overrides must be finite positive RPS values');
    }
    return {
        fleet,
        actualWorkers,
        totalWorkers,
        allocatedWorkers,
        edsBudget,
        odinBudget,
        edsPerWorker,
        odinPerInvocation,
        edsDisabled,
        edsOverride,
        odinOverride,
    };
}

export function initializeRequestBudgets(config) {
    const actualWorkers = String(config?.workers ?? process.env.NALA_RUN_WORKERS ?? 1);
    const budgets = resolveRequestBudgets({ ...process.env, NALA_RUN_WORKERS: actualWorkers });
    process.env.NALA_RUN_WORKERS = actualWorkers;
    console.info(
        `[NALA] ${budgets.fleet ? 'Fleet' : 'Local'} request budgets: ${budgets.actualWorkers} actual workers, ` +
            `${budgets.allocatedWorkers}/${budgets.totalWorkers} allocated; ` +
            `EDS ${budgets.edsBudget} RPS total, ${budgets.edsPerWorker} RPS/worker; ` +
            `Odin ${budgets.odinBudget} RPS total, ${budgets.odinPerInvocation} RPS/invocation.`,
    );
    if (budgets.edsDisabled || budgets.edsOverride || budgets.odinOverride) {
        console.warn('[NALA] Explicit throttle disable/override is active; fleet-derived caps are not guaranteed.');
    }
    return budgets;
}

export const resolveEdsMaxRps = () => resolveRequestBudgets().edsPerWorker;
export const resolveOdinMaxRps = () => resolveRequestBudgets().odinPerInvocation;
