import { sharedJobManager } from '../lib/shared-job-manager.js';
import { requireIMSAuth } from '../lib/ims-validator.js';

/**
 * Get job status for bulk operations
 * Adobe I/O Runtime action for checking progress of background jobs
 */
async function main(params) {
    const { jobId, __ow_headers } = params;

    try {
        const authError = await requireIMSAuth(__ow_headers);
        if (authError) {
            return authError;
        }

        if (!jobId) {
            return {
                statusCode: 400,
                body: { error: 'jobId parameter is required' },
            };
        }

        const job = await sharedJobManager.getJob(jobId);

        if (!job) {
            return {
                statusCode: 404,
                body: { error: `Job ${jobId} not found` },
            };
        }

        return {
            statusCode: 200,
            body: {
                jobId: job.jobId,
                type: job.type,
                status: job.status,
                total: job.total,
                completed: job.completed,
                successful: job.successful,
                failed: job.failed,
                skipped: job.skipped,
                successCount: job.successful.length,
                failureCount: job.failed.length,
                skippedCount: job.skipped.length,
                startedAt: job.startedAt,
                updatedAt: job.updatedAt,
                completedAt: job.completedAt,
                percentage: job.total > 0 ? Math.round((job.completed / job.total) * 100) : 0,
            },
        };
    } catch (error) {
        console.error('Get job status error:', error);
        return {
            statusCode: 500,
            body: { error: error.message },
        };
    }
}

export { main };
