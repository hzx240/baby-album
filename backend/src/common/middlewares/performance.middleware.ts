import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Performance Monitoring Middleware
 *
 * Tracks API response times and logs performance metrics
 * for identifying slow endpoints and optimization opportunities.
 */
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Performance');
  private readonly slowRequestThreshold = 1000; // 1 second
  private readonly verySlowRequestThreshold = 3000; // 3 seconds

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Capture original end to wrap it
    const originalEnd = res.end;
    const resAny = res as any;

    // Wrap the end method to capture timing
    resAny.end = (...args: any[]) => {
      const duration = Date.now() - startTime;

      // Log based on performance tier
      if (duration > this.verySlowRequestThreshold) {
        this.logger.warn(
          `VERY SLOW: ${req.method} ${req.path} - ${duration}ms`,
        );
      } else if (duration > this.slowRequestThreshold) {
        this.logger.log(
          `SLOW: ${req.method} ${req.path} - ${duration}ms`,
        );
      } else {
        this.logger.debug(
          `${req.method} ${req.path} - ${duration}ms`,
        );
      }

      // Add performance header
      resAny.setHeader('X-Response-Time', `${duration}ms`);

      // Call original end
      originalEnd.apply(res, args);
    };

    next();
  }
}
