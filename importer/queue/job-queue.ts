// ============================================================
// In-Memory Job Queue for Adullam Import Pipeline
// ============================================================

import type { ImportSource } from "../config/types";
import { CONFIG } from "../config";

export interface ImportJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  payload: {
    source: ImportSource;
    query: string;
    maxPages?: number;
  };
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export class JobQueue {
  private jobs: ImportJob[] = [];
  private processedToday: number = 0;
  private dayStart: number = this.getStartOfDay();

  private getStartOfDay(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }

  private resetDailyCounterIfNeeded(): void {
    const currentDayStart = this.getStartOfDay();
    if (currentDayStart > this.dayStart) {
      this.processedToday = 0;
      this.dayStart = currentDayStart;
    }
  }

  addJob(source: ImportSource, query: string, maxPages?: number): ImportJob {
    const job: ImportJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: "pending",
      payload: { source, query, maxPages },
      createdAt: new Date(),
    };
    this.jobs.push(job);
    return job;
  }

  async processQueue(
    handler: (job: ImportJob) => Promise<Record<string, unknown>>
  ): Promise<void> {
    this.resetDailyCounterIfNeeded();

    const pendingJobs = this.jobs.filter((j) => j.status === "pending");
    console.log(`[Queue] Processing ${pendingJobs.length} pending jobs...`);

    for (const job of pendingJobs) {
      if (this.processedToday >= CONFIG.processing.maxProductsPerDay) {
        console.log("[Queue] Daily limit reached. Stopping.");
        break;
      }

      job.status = "processing";
      job.startedAt = new Date();

      try {
        const result = await handler(job);
        job.status = "completed";
        job.result = result;
        job.completedAt = new Date();
        this.processedToday += (result.totalCleaned as number) || 0;
      } catch (error) {
        job.status = "failed";
        job.error = error instanceof Error ? error.message : String(error);
        job.completedAt = new Date();
      }
    }
  }

  getStats() {
    this.resetDailyCounterIfNeeded();
    return {
      total: this.jobs.length,
      pending: this.jobs.filter((j) => j.status === "pending").length,
      processing: this.jobs.filter((j) => j.status === "processing").length,
      completed: this.jobs.filter((j) => j.status === "completed").length,
      failed: this.jobs.filter((j) => j.status === "failed").length,
      processedToday: this.processedToday,
    };
  }

  getJobs(): ImportJob[] {
    return [...this.jobs];
  }

  clearCompleted(): number {
    const before = this.jobs.length;
    this.jobs = this.jobs.filter((j) => j.status !== "completed");
    return before - this.jobs.length;
  }
}

export const jobQueue = new JobQueue();
