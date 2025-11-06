/**
 * Singleton JobManager instance for shared access across all I/O Runtime actions
 * This ensures that jobs created by bulk operation actions can be retrieved by status actions
 * (Important for consistent job state across serverless function invocations)
 */
import { JobManager } from './job-manager.js';

export const sharedJobManager = new JobManager();
