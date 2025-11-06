/**
 * Job Manager for tracking bulk operation progress
 * Uses Adobe I/O Runtime State API when available, falls back to in-memory storage
 */
export class JobManager {
    constructor(useInMemory = false) {
        this.useInMemory = useInMemory;
        this.memoryStore = new Map();
    }

    generateJobId(type) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `${type}-${timestamp}-${random}`;
    }

    async createJob(type, total, metadata = {}) {
        const jobId = this.generateJobId(type);
        const job = {
            jobId,
            type,
            status: 'processing',
            total,
            completed: 0,
            successful: [],
            failed: [],
            skipped: [],
            startedAt: new Date().toISOString(),
            ...metadata,
        };

        await this.saveJob(jobId, job);
        console.log('[JobManager] Created job:', { jobId, type, total });
        return jobId;
    }

    async updateJobProgress(jobId, update) {
        const job = await this.getJob(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        const updatedJob = {
            ...job,
            ...update,
            updatedAt: new Date().toISOString(),
        };

        await this.saveJob(jobId, updatedJob);
        return updatedJob;
    }

    async addSuccessfulItem(jobId, item) {
        const job = await this.getJob(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        const updatedJob = {
            ...job,
            completed: job.completed + 1,
            successful: [...job.successful, item],
            updatedAt: new Date().toISOString(),
        };

        await this.saveJob(jobId, updatedJob);
        return updatedJob;
    }

    async addFailedItem(jobId, item) {
        const job = await this.getJob(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        const updatedJob = {
            ...job,
            completed: job.completed + 1,
            failed: [...job.failed, item],
            updatedAt: new Date().toISOString(),
        };

        await this.saveJob(jobId, updatedJob);
        return updatedJob;
    }

    async addSkippedItem(jobId, item) {
        const job = await this.getJob(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        const updatedJob = {
            ...job,
            completed: job.completed + 1,
            skipped: [...job.skipped, item],
            updatedAt: new Date().toISOString(),
        };

        await this.saveJob(jobId, updatedJob);
        return updatedJob;
    }

    async completeJob(jobId, finalData = {}) {
        const job = await this.getJob(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        const completedJob = {
            ...job,
            ...finalData,
            status: 'completed',
            completedAt: new Date().toISOString(),
        };

        await this.saveJob(jobId, completedJob);
        console.log('[JobManager] Completed job:', {
            jobId,
            total: job.total,
            successful: job.successful.length,
            skipped: job.skipped.length,
            failed: job.failed.length,
        });
        return completedJob;
    }

    async failJob(jobId, error) {
        const job = await this.getJob(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        const failedJob = {
            ...job,
            status: 'failed',
            error: error.message || error,
            failedAt: new Date().toISOString(),
        };

        await this.saveJob(jobId, failedJob);
        console.error('[JobManager] Job failed:', { jobId, error: failedJob.error });
        return failedJob;
    }

    async getJob(jobId) {
        if (this.useInMemory) {
            return this.memoryStore.get(jobId);
        }

        if (typeof process !== 'undefined' && process.env.__OW_ACTION_NAME) {
            const stateLib = await import('@adobe/aio-lib-state');
            const state = await stateLib.init();
            const result = await state.get(`job-${jobId}`);
            return result?.value ? JSON.parse(result.value) : null;
        }

        return this.memoryStore.get(jobId);
    }

    async saveJob(jobId, job) {
        if (this.useInMemory) {
            this.memoryStore.set(jobId, job);
            return;
        }

        if (typeof process !== 'undefined' && process.env.__OW_ACTION_NAME) {
            const stateLib = await import('@adobe/aio-lib-state');
            const state = await stateLib.init();
            await state.put(`job-${jobId}`, JSON.stringify(job), { ttl: 3600 });
            return;
        }

        this.memoryStore.set(jobId, job);
    }

    async deleteJob(jobId) {
        if (this.useInMemory) {
            this.memoryStore.delete(jobId);
            return;
        }

        if (typeof process !== 'undefined' && process.env.__OW_ACTION_NAME) {
            const stateLib = await import('@adobe/aio-lib-state');
            const state = await stateLib.init();
            await state.delete(`job-${jobId}`);
            return;
        }

        this.memoryStore.delete(jobId);
    }
}
