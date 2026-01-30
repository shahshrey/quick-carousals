/**
 * Render Queue - BullMQ Queue for Background Rendering
 * 
 * Handles background processing for:
 * - PDF export generation
 * - PNG export generation
 * - Thumbnail generation
 * 
 * Uses BullMQ with Upstash Redis backend for reliable job processing.
 */

import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';

/**
 * Job data structure for render jobs
 */
export interface RenderJobData {
  projectId: string;
  exportId: string;
  exportType: 'PDF' | 'PNG' | 'THUMBNAIL';
  userId: string;
  slideIds: string[];
}

/**
 * Create Redis connection for BullMQ
 * 
 * BullMQ requires ioredis, not @upstash/redis.
 * For Upstash Redis, we need to use the native Redis URL (not REST API).
 * 
 * Upstash provides both:
 * - REST URL: UPSTASH_REDIS_REST_URL (for @upstash/redis client)
 * - Native URL: UPSTASH_REDIS_URL (for ioredis/BullMQ)
 * 
 * Format: rediss://default:PASSWORD@HOST:PORT
 */
function createRedisConnection(): IORedis {
  // Try UPSTASH_REDIS_URL first (native Redis URL)
  let redisUrl = process.env.UPSTASH_REDIS_URL;
  
  // Fallback: construct from REST URL if native URL not provided
  if (!redisUrl && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Extract host from REST URL: https://host.upstash.io -> host.upstash.io
    const restUrl = process.env.UPSTASH_REDIS_REST_URL;
    const host = restUrl.replace('https://', '').replace('http://', '');
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    // Construct native Redis URL
    // Upstash Redis uses TLS (rediss://) on port 6379 with password authentication
    redisUrl = `rediss://default:${token}@${host}:6379`;
    
    console.warn('⚠️ Using UPSTASH_REDIS_REST_URL to construct native URL. Set UPSTASH_REDIS_URL for better performance.');
  }
  
  if (!redisUrl) {
    throw new Error(
      'Redis configuration missing for BullMQ. Set either:\n' +
      '  - UPSTASH_REDIS_URL (native Redis URL), or\n' +
      '  - Both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN'
    );
  }

  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,    // Required for BullMQ
    tls: {
      // Upstash Redis requires TLS
      rejectUnauthorized: true,
    },
  });
}

/**
 * Queue configuration
 */
const queueOptions: QueueOptions = {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,                    // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',          // Exponential backoff
      delay: 5000,                  // Start with 5 second delay
    },
    removeOnComplete: {
      age: 86400,                   // Keep completed jobs for 24 hours
      count: 1000,                  // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 604800,                  // Keep failed jobs for 7 days
      count: 5000,                  // Keep max 5000 failed jobs
    },
  },
};

/**
 * Render Queue singleton
 */
let renderQueueInstance: Queue<RenderJobData> | null = null;

/**
 * Get or create the render queue singleton
 * 
 * @returns Queue instance for render jobs
 */
export function getRenderQueue(): Queue<RenderJobData> {
  if (renderQueueInstance) {
    return renderQueueInstance;
  }

  renderQueueInstance = new Queue<RenderJobData>('render', queueOptions);
  
  // Log queue initialization
  console.log('✅ Render queue initialized');

  return renderQueueInstance;
}

/**
 * Add a render job to the queue
 * 
 * @param data Job data
 * @param priority Optional priority (lower number = higher priority)
 * @returns Job ID
 */
export async function addRenderJob(
  data: RenderJobData,
  priority: number = 10
): Promise<string> {
  const queue = getRenderQueue();
  
  const job = await queue.add('render-export', data, {
    priority,
    jobId: data.exportId, // Use exportId as job ID for idempotency
  });

  console.log(`📋 Render job added: ${job.id} (type: ${data.exportType})`);
  
  return job.id;
}

/**
 * Get queue statistics
 * 
 * @returns Object with queue counts
 */
export async function getQueueStats() {
  const queue = getRenderQueue();
  
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
  };
}

/**
 * Get job status by ID
 * 
 * @param jobId Job ID (typically the exportId)
 * @returns Job status or null if not found
 */
export async function getJobStatus(jobId: string) {
  const queue = getRenderQueue();
  
  const job = await queue.getJob(jobId);
  
  if (!job) {
    return null;
  }

  const state = await job.getState();
  
  return {
    id: job.id,
    state,
    progress: job.progress,
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  };
}

/**
 * Clean up old jobs
 * 
 * Removes completed jobs older than specified time.
 * Should be called periodically (e.g., daily cron job).
 * 
 * @param maxAge Maximum age in milliseconds (default: 7 days)
 */
export async function cleanOldJobs(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
  const queue = getRenderQueue();
  
  await queue.clean(maxAge, 1000, 'completed');
  await queue.clean(maxAge, 1000, 'failed');
  
  console.log(`🧹 Cleaned jobs older than ${maxAge}ms`);
}

/**
 * Close queue connection (for cleanup)
 * 
 * Should be called when shutting down the application.
 */
export async function closeRenderQueue() {
  if (renderQueueInstance) {
    await renderQueueInstance.close();
    renderQueueInstance = null;
    console.log('👋 Render queue closed');
  }
}

/**
 * Example Usage:
 * 
 * ```typescript
 * import { addRenderJob, getQueueStats } from '~/lib/queues/render-queue';
 * 
 * // Add a job
 * await addRenderJob({
 *   projectId: 'proj_123',
 *   exportId: 'exp_456',
 *   exportType: 'PDF',
 *   userId: 'user_789',
 *   slideIds: ['slide_1', 'slide_2', 'slide_3'],
 * });
 * 
 * // Get stats
 * const stats = await getQueueStats();
 * console.log(stats); // { waiting: 5, active: 2, completed: 100, failed: 1 }
 * ```
 */
