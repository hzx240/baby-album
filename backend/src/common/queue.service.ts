import { Injectable, Logger } from '@nestjs/common';

interface QueueJob<T> {
  id: string;
  data: T;
  processor: (data: T) => Promise<any>;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private queues = new Map<string, QueueJob<any>[]>();
  private processing = new Set<string>();

  /**
   * Register a queue
   */
  registerQueue(name: string) {
    if (!this.queues.has(name)) {
      this.queues.set(name, []);
      this.logger.log(`Queue registered: ${name}`);
    }
  }

  /**
   * Add a job to the queue
   */
  async add<T>(queueName: string, data: T, processor: (data: T) => Promise<any>): Promise<string> {
    this.registerQueue(queueName);

    const jobId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const job: QueueJob<T> = {
      id: jobId,
      data,
      processor,
    };

    this.queues.get(queueName)!.push(job);
    this.logger.log(`Job added to queue ${queueName}: ${jobId}`);

    // Start processing if not already processing
    this.processQueue(queueName);

    return jobId;
  }

  /**
   * Process queue asynchronously
   */
  private async processQueue(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue || queue.length === 0 || this.processing.has(queueName)) {
      return;
    }

    this.processing.add(queueName);

    while (queue.length > 0) {
      const job = queue.shift()!;
      try {
        this.logger.log(`Processing job ${job.id}...`);
        await job.processor(job.data);
        this.logger.log(`Job ${job.id} completed`);
      } catch (error) {
        this.logger.error(`Job ${job.id} failed:`, error);
      }
    }

    this.processing.delete(queueName);
  }

  /**
   * Get queue status
   */
  getQueueStatus(queueName: string) {
    const queue = this.queues.get(queueName);
    return {
      length: queue?.length || 0,
      isProcessing: this.processing.has(queueName),
    };
  }
}
