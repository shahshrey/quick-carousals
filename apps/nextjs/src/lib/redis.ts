/**
 * Redis Client Singleton
 * 
 * Provides a singleton instance of Upstash Redis client for:
 * - Caching
 * - Session storage
 * - Job queue backend (BullMQ)
 * 
 * Uses Upstash Redis REST API for serverless-friendly connections.
 */

import { Redis } from '@upstash/redis';

/**
 * Global Redis client singleton
 * 
 * Using a singleton pattern ensures we reuse the same Redis connection
 * across the application, which is important for:
 * - Performance (avoid creating multiple connections)
 * - Rate limiting (Upstash has per-connection limits)
 * - Resource efficiency
 */
let redisClient: Redis | null = null;

/**
 * Get or create the Redis client singleton
 * 
 * @returns Redis client instance
 * @throws Error if Redis environment variables are not configured
 */
export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Redis configuration missing: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set'
    );
  }

  redisClient = new Redis({
    url,
    token,
    // Retry configuration for reliability
    retry: {
      retries: 3,
      backoff: (retryCount) => Math.min(1000 * 2 ** retryCount, 10000),
    },
  });

  return redisClient;
}

/**
 * Test Redis connection
 * 
 * Performs a simple ping to verify the Redis connection is working.
 * Useful for health checks and startup validation.
 * 
 * @returns Promise that resolves to true if connection is successful
 * @throws Error if connection fails
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    
    if (result === 'PONG') {
      console.log('✅ Redis connection successful');
      return true;
    }
    
    throw new Error(`Unexpected ping response: ${result}`);
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
}

/**
 * Get connection info for debugging
 * 
 * @returns Object with connection details (safe for logging)
 */
export function getRedisConnectionInfo() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  
  return {
    configured: !!(url && process.env.UPSTASH_REDIS_REST_TOKEN),
    url: url ? `${url.split('@')[1] || url}` : undefined, // Hide credentials
  };
}

// Export the Redis type for use in other modules
export type { Redis };

/**
 * Example Usage:
 * 
 * ```typescript
 * import { getRedisClient } from '~/lib/redis';
 * 
 * // Get the client
 * const redis = getRedisClient();
 * 
 * // Set a value
 * await redis.set('key', 'value');
 * 
 * // Get a value
 * const value = await redis.get('key');
 * 
 * // Set with expiration (in seconds)
 * await redis.set('session:123', { userId: '123' }, { ex: 3600 });
 * 
 * // Delete a key
 * await redis.del('key');
 * 
 * // Increment a counter
 * await redis.incr('counter');
 * 
 * // Hash operations
 * await redis.hset('user:123', { name: 'John', age: 30 });
 * const user = await redis.hgetall('user:123');
 * 
 * // List operations
 * await redis.lpush('queue', 'job1');
 * const job = await redis.rpop('queue');
 * ```
 */
