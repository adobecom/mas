import { v4 as uuidv4 } from 'uuid';

class JobManager {
    constructor() {
        this.jobs = new Map();
        this.cleanupInterval = 5 * 60 * 1000;
        this.startCleanupTimer();
    }

    createJob(type, total, metadata = {}) {
        const jobId = `job_${uuidv4()}`;
        const job = {
            id: jobId,
            type,
            status: 'pending',
            current: 0,
            total,
            successful: 0,
            failed: 0,
            skipped: 0,
            items: [],
            results: null,
            metadata,
            createdAt: Date.now(),
            completedAt: null,
        };

        this.jobs.set(jobId, job);
        console.log(`[JobManager] Created job ${jobId} (type: ${type}, total: ${total})`);

        return jobId;
    }

    updateProgress(jobId, update) {
        const job = this.jobs.get(jobId);
        if (!job) {
            console.warn(`[JobManager] Job ${jobId} not found for progress update`);
            return false;
        }

        if (update.current !== undefined) job.current = update.current;
        if (update.successful !== undefined) job.successful = update.successful;
        if (update.failed !== undefined) job.failed = update.failed;
        if (update.skipped !== undefined) job.skipped = update.skipped;

        if (job.status === 'pending') {
            job.status = 'running';
        }

        console.log(
            `[JobManager] Job ${jobId} progress: ${job.current}/${job.total} ` +
                `(success: ${job.successful}, failed: ${job.failed}, skipped: ${job.skipped})`,
        );

        return true;
    }

    updateItemStatus(jobId, itemUpdate) {
        const job = this.jobs.get(jobId);
        if (!job) {
            console.warn(`[JobManager] Job ${jobId} not found for item update`);
            return false;
        }

        const existingItemIndex = job.items.findIndex((item) => item.fragmentId === itemUpdate.fragmentId);

        const item = {
            fragmentId: itemUpdate.fragmentId,
            fragmentName: itemUpdate.fragmentName || itemUpdate.fragmentId,
            status: itemUpdate.status || 'processing',
            changes: itemUpdate.changes || [],
            error: itemUpdate.error || null,
            timestamp: Date.now(),
        };

        if (existingItemIndex >= 0) {
            job.items[existingItemIndex] = item;
        } else {
            job.items.push(item);
        }

        if (itemUpdate.status === 'completed') {
            job.successful++;
        } else if (itemUpdate.status === 'failed') {
            job.failed++;
        } else if (itemUpdate.status === 'skipped') {
            job.skipped++;
        }

        job.current = job.successful + job.failed + job.skipped;

        if (job.status === 'pending') {
            job.status = 'running';
        }

        return true;
    }

    completeJob(jobId, results) {
        const job = this.jobs.get(jobId);
        if (!job) {
            console.warn(`[JobManager] Job ${jobId} not found for completion`);
            return false;
        }

        job.status = 'completed';
        job.results = results;
        job.completedAt = Date.now();

        const duration = ((job.completedAt - job.createdAt) / 1000).toFixed(2);
        console.log(
            `[JobManager] Job ${jobId} completed in ${duration}s ` +
                `(success: ${job.successful}, failed: ${job.failed}, skipped: ${job.skipped})`,
        );

        return true;
    }

    failJob(jobId, error) {
        const job = this.jobs.get(jobId);
        if (!job) {
            console.warn(`[JobManager] Job ${jobId} not found for failure`);
            return false;
        }

        job.status = 'failed';
        job.results = { error: error.message || String(error) };
        job.completedAt = Date.now();

        console.error(`[JobManager] Job ${jobId} failed:`, error);

        return true;
    }

    getJobStatus(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return {
                found: false,
                error: `Job ${jobId} not found`,
            };
        }

        return {
            found: true,
            id: job.id,
            type: job.type,
            status: job.status,
            current: job.current,
            total: job.total,
            successful: job.successful,
            failed: job.failed,
            skipped: job.skipped,
            items: job.items,
            results: job.results,
            metadata: job.metadata,
            createdAt: job.createdAt,
            completedAt: job.completedAt,
        };
    }

    startCleanupTimer() {
        setInterval(() => {
            this.cleanupOldJobs();
        }, this.cleanupInterval);
    }

    cleanupOldJobs() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [jobId, job] of this.jobs.entries()) {
            if (job.status === 'completed' || job.status === 'failed') {
                const age = now - (job.completedAt || job.createdAt);
                if (age > this.cleanupInterval) {
                    this.jobs.delete(jobId);
                    cleanedCount++;
                }
            }
        }

        if (cleanedCount > 0) {
            console.log(`[JobManager] Cleaned up ${cleanedCount} old job(s)`);
        }
    }

    getAllJobs() {
        return Array.from(this.jobs.values());
    }

    getActiveJobs() {
        return Array.from(this.jobs.values()).filter((job) => job.status === 'pending' || job.status === 'running');
    }
}

export const jobManager = new JobManager();
