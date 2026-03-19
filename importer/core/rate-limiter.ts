// ============================================================
// Rate Limiter for Adullam API calls
// ============================================================

import { CONFIG } from "../config";
import { sleep } from "../utils";

interface RateLimitState {
  requestsThisMinute: number;
  requestsToday: number;
  minuteStartTime: number;
  dayStartTime: number;
}

export class RateLimiter {
  private state: RateLimitState;
  private readonly maxPerMinute: number;
  private readonly maxPerDay: number;
  private readonly delayBetweenRequests: number;
  private lastRequestTime: number = 0;

  constructor(
    maxPerMinute: number = CONFIG.rateLimit.maxRequestsPerMinute,
    maxPerDay: number = CONFIG.rateLimit.maxRequestsPerDay,
    delayBetweenRequests: number = CONFIG.rateLimit.delayBetweenRequests
  ) {
    this.maxPerMinute = maxPerMinute;
    this.maxPerDay = maxPerDay;
    this.delayBetweenRequests = delayBetweenRequests;
    this.state = {
      requestsThisMinute: 0,
      requestsToday: 0,
      minuteStartTime: Date.now(),
      dayStartTime: this.getStartOfDay(),
    };
  }

  private getStartOfDay(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }

  private resetIfNeeded(): void {
    const now = Date.now();

    if (now - this.state.minuteStartTime >= 60000) {
      this.state.requestsThisMinute = 0;
      this.state.minuteStartTime = now;
    }

    const currentDayStart = this.getStartOfDay();
    if (currentDayStart > this.state.dayStartTime) {
      this.state.requestsToday = 0;
      this.state.dayStartTime = currentDayStart;
    }
  }

  async acquire(): Promise<void> {
    this.resetIfNeeded();

    if (this.state.requestsToday >= this.maxPerDay) {
      const msUntilTomorrow = this.state.dayStartTime + 86400000 - Date.now();
      throw new Error(
        `Daily API limit reached (${this.maxPerDay}). Reset in ${Math.ceil(msUntilTomorrow / 3600000)} hours.`
      );
    }

    if (this.state.requestsThisMinute >= this.maxPerMinute) {
      const msUntilNextMinute = this.state.minuteStartTime + 60000 - Date.now();
      if (msUntilNextMinute > 0) {
        console.log(`[RateLimiter] Waiting ${Math.ceil(msUntilNextMinute / 1000)}s for minute reset...`);
        await sleep(msUntilNextMinute);
        this.resetIfNeeded();
      }
    }

    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.delayBetweenRequests) {
      await sleep(this.delayBetweenRequests - timeSinceLastRequest);
    }

    this.state.requestsThisMinute++;
    this.state.requestsToday++;
    this.lastRequestTime = Date.now();
  }

  getRemainingToday(): number {
    this.resetIfNeeded();
    return this.maxPerDay - this.state.requestsToday;
  }

  getStats() {
    this.resetIfNeeded();
    return {
      perMinute: this.state.requestsThisMinute,
      perDay: this.state.requestsToday,
      remaining: {
        minute: this.maxPerMinute - this.state.requestsThisMinute,
        day: this.maxPerDay - this.state.requestsToday,
      },
    };
  }
}

export const rateLimiter = new RateLimiter();
