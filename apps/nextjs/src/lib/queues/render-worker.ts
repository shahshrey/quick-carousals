/**
 * Render Worker - BullMQ Worker for Export Processing
 * 
 * Processes background jobs for carousel exports:
 * 1. Fetch project and slide data from database
 * 2. Render slides to PNG/PDF using server-side canvas
 * 3. Upload completed export to storage
 * 4. Update export status in database
 */

import { Worker, Job } from 'bullmq';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import IORedis from 'ioredis';
import type { RenderJobData } from './render-queue';
import { generatePDF } from '../generate-pdf';
import { renderSlideToCanvas } from '../render-slide';
import { uploadFile, getUserFilePath, STORAGE_BUCKETS } from '../storage';
import type { Database } from '@saasfly/db/prisma/types';
import type { SlideData, StyleKit, LayersBlueprint } from '~/components/editor/types';

/**
 * Create database client for worker
 */
function createWorkerDb() {
  const dialect = new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.POSTGRES_URL,
    }),
  });

  return new Kysely<Database>({ dialect });
}

/**
 * Create Redis connection for worker
 * Same configuration as render-queue.ts
 */
function createRedisConnection(): IORedis {
  let redisUrl = process.env.UPSTASH_REDIS_URL;
  
  if (!redisUrl && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const restUrl = process.env.UPSTASH_REDIS_REST_URL;
    const host = restUrl.replace('https://', '').replace('http://', '');
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    redisUrl = `rediss://default:${token}@${host}:6379`;
  }
  
  if (!redisUrl) {
    throw new Error('Redis configuration missing for worker');
  }

  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: {
      rejectUnauthorized: true,
    },
  });
}

/**
 * Fetch slide data from database and format for rendering
 */
async function fetchSlideDataForRendering(
  db: Kysely<Database>,
  projectId: string
): Promise<SlideData[]> {
  // Fetch project with style kit
  const project = await db
    .selectFrom('Project')
    .where('id', '=', projectId)
    .selectAll()
    .executeTakeFirstOrThrow();

  // Fetch style kit
  const styleKit = await db
    .selectFrom('StyleKit')
    .where('id', '=', project.styleKitId)
    .selectAll()
    .executeTakeFirstOrThrow();

  // Fetch slides with layouts
  const slides = await db
    .selectFrom('Slide')
    .innerJoin('TemplateLayout', 'Slide.layoutId', 'TemplateLayout.id')
    .where('Slide.projectId', '=', projectId)
    .select([
      'Slide.id',
      'Slide.orderIndex',
      'Slide.content',
      'Slide.layoutId',
      'TemplateLayout.layersBlueprint',
    ])
    .orderBy('Slide.orderIndex', 'asc')
    .execute();

  // Format slide data for rendering
  return slides.map((slide) => ({
    id: slide.id,
    layoutId: slide.layoutId,
    content: slide.content as Record<string, string | string[]>,
    styleKit: styleKit as unknown as StyleKit,
    blueprint: slide.layersBlueprint as unknown as LayersBlueprint,
  }));
}

/**
 * Process PDF export job
 */
async function processPDFExport(
  db: Kysely<Database>,
  job: Job<RenderJobData>
): Promise<string> {
  const { projectId, exportId, userId } = job.data;

  // Update status to PROCESSING
  await db
    .updateTable('Export')
    .set({ status: 'PROCESSING' })
    .where('id', '=', exportId)
    .execute();

  // Fetch slide data
  const slides = await fetchSlideDataForRendering(db, projectId);

  // Generate PDF
  const pdfBuffer = await generatePDF(slides);

  // Upload to storage
  const filename = `${projectId}-${Date.now()}.pdf`;
  const path = getUserFilePath(userId, filename);
  
  const { url } = await uploadFile(
    STORAGE_BUCKETS.EXPORTS,
    path,
    pdfBuffer,
    'application/pdf'
  );

  // Update export with file URL and status
  await db
    .updateTable('Export')
    .set({
      status: 'COMPLETED',
      fileUrl: url,
      completedAt: new Date(),
    })
    .where('id', '=', exportId)
    .execute();

  return url;
}

/**
 * Process PNG export job (individual slide images)
 */
async function processPNGExport(
  db: Kysely<Database>,
  job: Job<RenderJobData>
): Promise<string> {
  const { projectId, exportId, userId } = job.data;

  // Update status to PROCESSING
  await db
    .updateTable('Export')
    .set({ status: 'PROCESSING' })
    .where('id', '=', exportId)
    .execute();

  // Fetch slide data
  const slides = await fetchSlideDataForRendering(db, projectId);

  // Render all slides to PNG buffers
  const buffers: Buffer[] = [];
  for (const slide of slides) {
    const buffer = await renderSlideToCanvas(slide);
    buffers.push(buffer);
  }

  // Upload all PNGs to storage and collect URLs
  const urls: string[] = [];
  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    const filename = `${projectId}-slide-${i + 1}-${Date.now()}.png`;
    const path = getUserFilePath(userId, filename);
    
    const { url } = await uploadFile(
      STORAGE_BUCKETS.EXPORTS,
      path,
      buffer,
      'image/png'
    );
    
    urls.push(url);
  }

  // Store URLs as JSON array in fileUrl field
  const fileUrlsJson = JSON.stringify(urls);

  // Update export with file URLs and status
  await db
    .updateTable('Export')
    .set({
      status: 'COMPLETED',
      fileUrl: fileUrlsJson,
      completedAt: new Date(),
    })
    .where('id', '=', exportId)
    .execute();

  return fileUrlsJson;
}

/**
 * Process THUMBNAIL export job (cover image)
 */
async function processThumbnailExport(
  db: Kysely<Database>,
  job: Job<RenderJobData>
): Promise<string> {
  const { projectId, exportId, userId } = job.data;

  // Update status to PROCESSING
  await db
    .updateTable('Export')
    .set({ status: 'PROCESSING' })
    .where('id', '=', exportId)
    .execute();

  // Fetch slide data (only first slide for thumbnail)
  const slides = await fetchSlideDataForRendering(db, projectId);
  
  if (slides.length === 0) {
    throw new Error('No slides found for thumbnail export');
  }

  // Render first slide as thumbnail
  const buffer = await renderSlideToCanvas(slides[0]);

  // Upload to storage
  const filename = `${projectId}-thumbnail-${Date.now()}.png`;
  const path = getUserFilePath(userId, filename);
  
  const { url } = await uploadFile(
    STORAGE_BUCKETS.EXPORTS,
    path,
    buffer,
    'image/png'
  );

  // Update export with file URL and status
  await db
    .updateTable('Export')
    .set({
      status: 'COMPLETED',
      fileUrl: url,
      completedAt: new Date(),
    })
    .where('id', '=', exportId)
    .execute();

  return url;
}

/**
 * Main job processor function
 */
async function processRenderJob(job: Job<RenderJobData>) {
  const db = createWorkerDb();
  
  try {
    console.log(`🎨 Processing render job ${job.id} (type: ${job.data.exportType})`);
    
    let result: string;
    
    switch (job.data.exportType) {
      case 'PDF':
        result = await processPDFExport(db, job);
        break;
      case 'PNG':
        result = await processPNGExport(db, job);
        break;
      case 'THUMBNAIL':
        result = await processThumbnailExport(db, job);
        break;
      default:
        throw new Error(`Unknown export type: ${job.data.exportType}`);
    }
    
    console.log(`✅ Render job ${job.id} completed: ${result}`);
    
    return { success: true, fileUrl: result };
  } catch (error) {
    console.error(`❌ Render job ${job.id} failed:`, error);
    
    // Update export status to FAILED with error message
    await db
      .updateTable('Export')
      .set({
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      .where('id', '=', job.data.exportId)
      .execute();
    
    throw error; // Re-throw to mark job as failed
  } finally {
    await db.destroy();
  }
}

/**
 * Create and start the render worker
 * 
 * @returns Worker instance
 */
export function createRenderWorker(): Worker<RenderJobData> {
  const connection = createRedisConnection();
  
  const worker = new Worker<RenderJobData>('render', processRenderJob, {
    connection,
    concurrency: 2, // Process 2 jobs at a time
  });
  
  // Event handlers
  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err);
  });
  
  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });
  
  console.log('🚀 Render worker started');
  
  return worker;
}

/**
 * Standalone worker script
 * Run with: node --loader ts-node/esm src/lib/queues/render-worker.ts
 */
if (require.main === module) {
  console.log('Starting render worker...');
  
  const worker = createRenderWorker();
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing worker...');
    await worker.close();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('SIGINT received, closing worker...');
    await worker.close();
    process.exit(0);
  });
}
