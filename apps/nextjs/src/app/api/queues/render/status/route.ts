/**
 * GET /api/queues/render/status
 * 
 * Returns status and statistics for the render queue.
 * Shows counts of waiting, active, completed, and failed jobs.
 * 
 * Authentication: Optional (can be used for monitoring)
 */

import { NextResponse } from 'next/server';
import { getQueueStats } from '~/lib/queues/render-queue';
import { ApiError } from '~/lib/api-error';

/**
 * GET handler - Get queue statistics
 */
export async function GET() {
  try {
    const stats = await getQueueStats();
    
    return NextResponse.json({
      success: true,
      queue: 'render',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    
    // Return error response
    return NextResponse.json(
      ApiError.internal('Failed to retrieve queue statistics', {
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
}
