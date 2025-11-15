import cron from 'node-cron';
import { db } from './db';
import { scrapers, scrapedData, activities } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { broadcastEvent, WebSocketEvents } from './websocket';

interface ScheduledJob {
  scraperId: number;
  task: cron.ScheduledTask;
}

const scheduledJobs: Map<number, ScheduledJob> = new Map();

// Convert frequency string to cron pattern
function frequencyToCron(frequency: string): string {
  const patterns: Record<string, string> = {
    'hourly': '0 * * * *',           // Every hour
    'daily': '0 0 * * *',             // Every day at midnight
    'weekly': '0 0 * * 0',            // Every Sunday at midnight
    'every-5-minutes': '*/5 * * * *', // Every 5 minutes
    'every-15-minutes': '*/15 * * * *', // Every 15 minutes
    'every-30-minutes': '*/30 * * * *', // Every 30 minutes
    'twice-daily': '0 0,12 * * *',     // At midnight and noon
  };

  return patterns[frequency.toLowerCase()] || '0 0 * * *'; // Default to daily
}

// Execute scraper job
async function executeScraperJob(scraperId: number) {
  try {
    console.log(`[Scheduler] Starting scheduled scrape for scraper ${scraperId}`);

    // Broadcast scraper started event
    broadcastEvent(WebSocketEvents.SCRAPER_STARTED, {
      scraperId,
      startTime: new Date().toISOString()
    });

    // Get scraper configuration
    const [scraper] = await db
      .select()
      .from(scrapers)
      .where(eq(scrapers.id, scraperId))
      .limit(1);

    if (!scraper || !scraper.isActive) {
      console.log(`[Scheduler] Scraper ${scraperId} not found or inactive`);
      return;
    }

    // Import the scraping logic dynamically to avoid circular dependencies
    const { runScraper } = await import('./scraper-engine');
    const result = await runScraper(scraper);

    // Log activity
    await db.insert(activities).values({
      type: 'scrape',
      message: `Scheduled scrape completed for "${scraper.name}"`,
      status: 'success',
      metadata: JSON.stringify({
        scraperId: scraper.id,
        itemsScraped: result.itemsScraped,
        pagesVisited: result.pagesVisited
      })
    });

    // Broadcast completion event
    broadcastEvent(WebSocketEvents.SCRAPER_COMPLETED, {
      scraperId,
      itemsScraped: result.itemsScraped,
      pagesVisited: result.pagesVisited,
      endTime: new Date().toISOString()
    });

    console.log(`[Scheduler] Scrape completed for scraper ${scraperId}: ${result.itemsScraped} items`);
  } catch (error) {
    console.error(`[Scheduler] Error executing scraper ${scraperId}:`, error);

    // Log failure
    await db.insert(activities).values({
      type: 'scrape',
      message: `Scheduled scrape failed for scraper ${scraperId}`,
      status: 'error',
      metadata: JSON.stringify({
        scraperId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    });

    // Broadcast failure event
    broadcastEvent(WebSocketEvents.SCRAPER_FAILED, {
      scraperId,
      error: error instanceof Error ? error.message : 'Unknown error',
      endTime: new Date().toISOString()
    });
  }
}

// Schedule a scraper
export function scheduleScraper(scraperId: number, frequency: string) {
  // Stop existing job if any
  stopScraper(scraperId);

  const cronPattern = frequencyToCron(frequency);

  if (!cron.validate(cronPattern)) {
    throw new Error(`Invalid cron pattern: ${cronPattern}`);
  }

  const task = cron.schedule(cronPattern, () => {
    executeScraperJob(scraperId);
  });

  scheduledJobs.set(scraperId, { scraperId, task });
  console.log(`[Scheduler] Scheduled scraper ${scraperId} with pattern: ${cronPattern}`);

  return task;
}

// Stop a scheduled scraper
export function stopScraper(scraperId: number) {
  const existing = scheduledJobs.get(scraperId);
  if (existing) {
    existing.task.stop();
    scheduledJobs.delete(scraperId);
    console.log(`[Scheduler] Stopped scraper ${scraperId}`);
  }
}

// Initialize all active scrapers
export async function initializeScheduler() {
  try {
    const activeScrapers = await db
      .select()
      .from(scrapers)
      .where(eq(scrapers.isActive, true));

    console.log(`[Scheduler] Initializing ${activeScrapers.length} active scrapers`);

    for (const scraper of activeScrapers) {
      if (scraper.frequency) {
        scheduleScraper(scraper.id, scraper.frequency);
      }
    }

    console.log('[Scheduler] All active scrapers initialized');
  } catch (error) {
    console.error('[Scheduler] Error initializing scheduler:', error);
  }
}

// Get all scheduled jobs
export function getScheduledJobs() {
  return Array.from(scheduledJobs.values()).map(job => ({
    scraperId: job.scraperId,
    isRunning: job.task.getStatus() === 'scheduled'
  }));
}

// Shutdown all jobs
export function shutdownScheduler() {
  console.log('[Scheduler] Shutting down all scheduled jobs');
  scheduledJobs.forEach((job) => {
    job.task.stop();
  });
  scheduledJobs.clear();
}
