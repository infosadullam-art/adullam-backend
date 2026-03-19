// ============================================================
// Scheduler for Adullam Import Pipeline
// Periodically adds import jobs to the queue
// ============================================================

import type { ImportSource } from "../config/types";
import { jobQueue } from "./job-queue";

interface ScheduledTask {
  name: string;
  source: ImportSource;
  queries: string[];
  maxPages: number;
  intervalMs: number;
  enabled: boolean;
}

const DEFAULT_TASKS: ScheduledTask[] = [
  {
    name: "Alibaba Trending Electronics",
    source: "ALIBABA",
    queries: [
      "wireless earbuds",
      "smart watch",
      "phone case",
      "led strip lights",
      "power bank",
    ],
    maxPages: 3,
    intervalMs: 4 * 60 * 60 * 1000, // every 4 hours
    enabled: true,
  },
  {
    name: "Alibaba Fashion",
    source: "ALIBABA",
    queries: [
      "women handbag leather",
      "men sneakers",
      "sunglasses fashion",
      "jewelry set",
    ],
    maxPages: 2,
    intervalMs: 6 * 60 * 60 * 1000, // every 6 hours
    enabled: true,
  },
];

export class Scheduler {
  private tasks: ScheduledTask[];
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private running: boolean = false;

  constructor(tasks?: ScheduledTask[]) {
    this.tasks = tasks || DEFAULT_TASKS;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    console.log("[Scheduler] Starting scheduler...");

    for (const task of this.tasks) {
      if (!task.enabled) continue;

      // Run immediately
      this.executeTask(task);

      // Schedule recurring
      const timer = setInterval(() => this.executeTask(task), task.intervalMs);
      this.timers.set(task.name, timer);

      console.log(
        `[Scheduler] Task "${task.name}" scheduled every ${task.intervalMs / 3600000}h`
      );
    }
  }

  stop(): void {
    this.running = false;
    for (const [name, timer] of this.timers) {
      clearInterval(timer);
      console.log(`[Scheduler] Stopped task "${name}"`);
    }
    this.timers.clear();
  }

  private executeTask(task: ScheduledTask): void {
    console.log(`[Scheduler] Executing task: ${task.name}`);
    for (const query of task.queries) {
      jobQueue.addJob(task.source, query, task.maxPages);
    }
  }

  getStatus() {
    const enabledTasks = this.tasks.filter((t) => t.enabled).length;
    const nextTask = this.tasks.find((t) => t.enabled);

    return {
      running: this.running,
      totalTasks: this.tasks.length,
      enabledTasks,
      nextTask: nextTask
        ? {
            name: nextTask.name,
            nextRun: new Date(Date.now() + nextTask.intervalMs).toISOString(),
          }
        : null,
    };
  }
}

export const scheduler = new Scheduler();
