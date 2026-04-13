import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Performance Monitoring Interceptor
 *
 * Tracks API response times and logs warnings when requests exceed the target threshold (200ms).
 * This helps identify slow endpoints that need optimization.
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);
  private readonly TARGET_LATENCY_MS = 200;
  private readonly WARNING_LATENCY_MS = 500;

  // Track performance metrics
  private metrics = new Map<string, number[]>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Generate a unique request identifier
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    request.requestId = requestId;

    const startTime = Date.now();
    const method = request.method;
    const path = this.extractPath(request.url);

    // Log incoming request
    this.logger.debug(`[${requestId}] ${method} ${path} - Started`);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Record metrics
          this.recordMetric(path, duration);

          // Log completion
          this.logger.debug(`[${requestId}] ${method} ${path} - ${statusCode} (${duration}ms)`);

          // Log warning if request took too long
          if (duration > this.WARNING_LATENCY_MS) {
            this.logger.warn(
              `[${requestId}] ${method} ${path} - SLOW REQUEST: ${duration}ms (exceeded ${this.WARNING_LATENCY_MS}ms)`,
            );
          } else if (duration > this.TARGET_LATENCY_MS) {
            this.logger.log(
              `[${requestId}] ${method} ${path} - Above target: ${duration}ms (target: ${this.TARGET_LATENCY_MS}ms)`,
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          this.logger.error(
            `[${requestId}] ${method} ${path} - ERROR: ${error.message} (${duration}ms)`,
          );

          // Record metrics even for errors
          this.recordMetric(path, duration);
        },
      }),
    );
  }

  /**
   * Extract clean path without query parameters
   */
  private extractPath(url: string): string {
    const match = url.match(/^\/[^?#]*/);
    return match ? match[0] : url;
  }

  /**
   * Record performance metric for a path
   */
  private recordMetric(path: string, duration: number): void {
    if (!this.metrics.has(path)) {
      this.metrics.set(path, []);
    }

    const metrics = this.metrics.get(path)!;
    metrics.push(duration);

    // Keep only last 100 measurements per path
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Get performance statistics for all endpoints
   */
  getStatistics(): Record<string, PerformanceStats> {
    const stats: Record<string, PerformanceStats> = {};

    for (const [path, durations] of this.metrics.entries()) {
      if (durations.length === 0) continue;

      const sorted = [...durations].sort((a, b) => a - b);
      const sum = durations.reduce((a, b) => a + b, 0);

      stats[path] = {
        requestCount: durations.length,
        avg: Math.round(sum / durations.length),
        p50: sorted[Math.floor(durations.length * 0.5)],
        p95: sorted[Math.floor(durations.length * 0.95)],
        p99: sorted[Math.floor(durations.length * 0.99)],
        min: sorted[0],
        max: sorted[sorted.length - 1],
      };
    }

    return stats;
  }

  /**
   * Get statistics for a specific path
   */
  getPathStatistics(path: string): PerformanceStats | null {
    const durations = this.metrics.get(path);

    if (!durations || durations.length === 0) {
      return null;
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      requestCount: durations.length,
      avg: Math.round(sum / durations.length),
      p50: sorted[Math.floor(durations.length * 0.5)],
      p95: sorted[Math.floor(durations.length * 0.95)],
      p99: sorted[Math.floor(durations.length * 0.99)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.logger.log('Performance metrics cleared');
  }
}

export interface PerformanceStats {
  requestCount: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
