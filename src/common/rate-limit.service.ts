import { Injectable, Logger } from '@nestjs/common';

interface QueueItem {
  resolve: () => void;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private queue: QueueItem[] = [];
  private tokens = 10;
  private readonly maxTokens = 10;
  private readonly refillInterval = 1000;
  private lastRefill = Date.now();

  constructor() {
    setInterval(() => this.refill(), this.refillInterval);
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed >= this.refillInterval) {
      this.tokens = this.maxTokens;
      this.lastRefill = now;
      this.processQueue();
    }
  }

  private processQueue(): void {
    while (this.tokens > 0 && this.queue.length > 0) {
      this.tokens -= 1;
      this.queue.shift()?.resolve();
    }
  }

  async consume(): Promise<void> {
    if (this.tokens > 0) {
      this.tokens -= 1;
      return;
    }

    return new Promise((resolve) => {
      this.queue.push({ resolve });
      this.logger.debug(`Rate limit reached. Queue size: ${this.queue.length}`);
    });
  }
}
