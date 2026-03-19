#!/usr/bin/env npx tsx
// ============================================================
// Adullam Import Pipeline Runner v2
// Entry point: npx tsx importer/run.ts <command> [options]
// Uses 2 endpoints: Search Items + Product Details
// ============================================================

import "dotenv/config";
import { Pipeline } from "./core/pipeline";
import { jobQueue } from "./queue/job-queue";
import { scheduler } from "./queue/scheduler";
import { rateLimiter } from "./core/rate-limiter";
import type { ImportSource } from "./config/types";

/**
 * Run a single import job
 */
async function runSingleImport(
  query: string,
  source: ImportSource = "ALIBABA",
  maxPages: number = 3,
  dryRun: boolean = false
): Promise<void> {
  console.log("\n");
  console.log("+==========================================================+");
  console.log("|           ADULLAM IMPORT PIPELINE v2                      |");
  console.log("|           Search + Detail Enrichment                      |");
  console.log("+==========================================================+");
  console.log("\n");

  const pipeline = new Pipeline();

  const stats = await pipeline.run({
    source,
    searchQuery: query,
    maxPages,
    dryRun,
  });

  console.log("\n[Runner] Import completed");
  console.log(`[Runner] Products cleaned: ${stats.totalCleaned}/${stats.totalFetched}`);
  console.log(
    `[Runner] Success rate: ${((stats.totalCleaned / Math.max(stats.totalFetched, 1)) * 100).toFixed(1)}%`
  );
}

/**
 * Run the queue processor
 */
async function runQueueProcessor(): Promise<void> {
  console.log("\n");
  console.log("+==========================================================+");
  console.log("|           ADULLAM IMPORT PIPELINE v2                      |");
  console.log("|           Queue Processor Mode                            |");
  console.log("+==========================================================+");
  console.log("\n");

  const pipeline = new Pipeline();

  await jobQueue.processQueue(async (job) => {
    const stats = await pipeline.run({
      source: job.payload.source,
      searchQuery: job.payload.query,
      maxPages: job.payload.maxPages || 3,
    });

    return {
      totalFetched: stats.totalFetched,
      totalCleaned: stats.totalCleaned,
      totalRejected: stats.totalRejected,
    };
  });

  const queueStats = jobQueue.getStats();
  console.log("\n[Runner] Queue processing completed");
  console.log(`[Runner] Completed: ${queueStats.completed}, Failed: ${queueStats.failed}`);
  console.log(`[Runner] Processed today: ${queueStats.processedToday} products`);
}

/**
 * Run the scheduler (continuous mode)
 */
async function runScheduler(): Promise<void> {
  console.log("\n");
  console.log("+==========================================================+");
  console.log("|           ADULLAM IMPORT PIPELINE v2                      |");
  console.log("|           Scheduler Mode (Continuous)                     |");
  console.log("+==========================================================+");
  console.log("\n");

  const pipeline = new Pipeline();

  scheduler.start();

  const status = scheduler.getStatus();
  console.log(`[Runner] Scheduler started with ${status.enabledTasks} enabled tasks`);
  if (status.nextTask) {
    console.log(`[Runner] Next task: "${status.nextTask.name}" at ${status.nextTask.nextRun}`);
  }

  // Process queue periodically
  const processInterval = setInterval(async () => {
    const queueStats = jobQueue.getStats();
    if (queueStats.pending > 0) {
      console.log(`\n[Runner] Processing ${queueStats.pending} pending jobs...`);

      await jobQueue.processQueue(async (job) => {
        const stats = await pipeline.run({
          source: job.payload.source,
          searchQuery: job.payload.query,
          maxPages: job.payload.maxPages || 3,
        });

        return {
          totalFetched: stats.totalFetched,
          totalCleaned: stats.totalCleaned,
          totalRejected: stats.totalRejected,
        };
      });
    }

    const rateStats = rateLimiter.getStats();
    console.log(`[Runner] Rate limit: ${rateStats.remaining.day} calls remaining today`);
  }, 60000);

  process.on("SIGINT", () => {
    console.log("\n[Runner] Shutting down...");
    clearInterval(processInterval);
    scheduler.stop();
    process.exit(0);
  });

  // Keep process running
  await new Promise(() => {});
}

/**
 * Add test jobs to the queue and process them
 */
async function addTestJobs(): Promise<void> {
  console.log("\n[Runner] Adding test jobs to queue...\n");

  const testQueries = [
    "wireless earbuds",
    "phone case iphone",
    "smart watch fitness",
    "women handbag leather",
    "led strip lights",
  ];

  for (const query of testQueries) {
    jobQueue.addJob("ALIBABA", query, 2);
  }

  const stats = jobQueue.getStats();
  console.log(`[Runner] Added ${stats.pending} jobs to queue`);
}

/**
 * Display help
 */
function showHelp(): void {
  console.log(`
Adullam Import Pipeline v2 Runner

Usage:
  npx tsx importer/run.ts <command> [options]

Commands:
  import <query>     Run a single import for the specified search query
  queue             Process all jobs in the queue
  scheduler         Start the continuous scheduler
  test              Add test jobs and process them
  help              Show this help message

Options:
  --source=<source>  Import source (ALIBABA, ALIEXPRESS, etc.) [default: ALIBABA]
  --pages=<n>        Maximum pages to fetch per query [default: 3]
  --dry-run          Run without saving to database

Pipeline Flow:
  1. Search Collector  (alibaba-datahub.p.rapidapi.com/item_search)
  2. Detail Collector  (alibaba-api2.p.rapidapi.com/alibaba/product-details)
  3. Parser            (normalize enriched data)
  4. Weight Estimator  (Google Search + OpenAI + heuristics)
  5. Validator         (strict validation)
  6. Transformer       (CleanProduct + 30% margin)
  7. Database          (Prisma upsert)
  8. Graph             (nodes + edges)

Examples:
  npx tsx importer/run.ts import "wireless earbuds" --pages=5
  npx tsx importer/run.ts import "laptop bag" --dry-run
  npx tsx importer/run.ts queue
  npx tsx importer/run.ts scheduler
  npx tsx importer/run.ts test --dry-run
`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  const options: Record<string, string | boolean> = {};
  for (const arg of args.slice(1)) {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      options[key] = value || true;
    }
  }

  const source = (options.source as ImportSource) || "ALIBABA";
  const maxPages = parseInt(options.pages as string, 10) || 3;
  const dryRun = options["dry-run"] === true;

  switch (command) {
    case "import": {
      const query = args[1];
      if (!query || query.startsWith("--")) {
        console.error("Error: Please provide a search query");
        console.error("Usage: npx tsx importer/run.ts import <query>");
        process.exit(1);
      }
      await runSingleImport(query, source, maxPages, dryRun);
      break;
    }

    case "queue":
      await runQueueProcessor();
      break;

    case "scheduler":
      await runScheduler();
      break;

    case "test":
      await addTestJobs();
      await runQueueProcessor();
      break;

    case "help":
    case "--help":
    case "-h":
      showHelp();
      break;

    default:
      if (command) {
        console.error(`Unknown command: ${command}`);
      }
      showHelp();
      process.exit(command ? 1 : 0);
  }
}

main().catch((error) => {
  console.error("\n[Runner] Fatal error:", error);
  process.exit(1);
});
