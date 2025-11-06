/**
 * Singleton JobManager instance for shared access across all server instances
 * This ensures that jobs created in one server instance can be retrieved by another
 * (Important for local development where multiple MCP server instances may be running)
 */
import { JobManager } from './job-manager.js';

export const sharedJobManager = new JobManager();
