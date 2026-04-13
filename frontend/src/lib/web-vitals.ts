/**
 * Core Web Vitals Monitoring
 * 核心Web性能指标监控
 *
 * Collects and reports Core Web Vitals:
 * - LCP (Largest Contentful Paint) - 最大内容绘制
 * - FID (First Input Delay) - 首次输入延迟
 * - CLS (Cumulative Layout Shift) - 累积布局偏移
 * - FCP (First Contentful Paint) - 首次内容绘制
 * - TTFB (Time to First Byte) - 首字节时间
 * - NTBT (Next Paint Time) - 下次绘制时间
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

interface Thresholds {
  GOOD: number;
  NEEDS_IMPROVEMENT: number;
  POOR: number;
}

interface MetricsData {
  LCP?: number;
  INP?: number;
  CLS?: number;
  FCP?: number;
  TTFB?: number;
}

// Configuration
const CONFIG = {
  // Metrics endpoint
  REPORT_URL: '/api/metrics/web-vitals',

  // Sample rate (10% - don't report every visit to save bandwidth)
  SAMPLE_RATE: 0.1,

  // Thresholds for alerting
  THRESHOLDS: {
    LCP: { GOOD: 2500, NEEDS_IMPROVEMENT: 4000, POOR: 6000 }, // ms
    INP: { GOOD: 200, NEEDS_IMPROVEMENT: 500, POOR: 1000 }, // ms (replaces FID)
    CLS: { GOOD: 0.1, NEEDS_IMPROVEMENT: 0.25, POOR: 0.5 }, // score
    FCP: { GOOD: 1800, NEEDS_IMPROVEMENT: 3000, POOR: 4000 }, // ms
    TTFB: { GOOD: 800, NEEDS_IMPROVEMENT: 1800, POOR: 2600 }, // ms
  },
};

// Rating helper
function getRating(value: number, thresholds: Thresholds): string {
  if (value <= thresholds.GOOD) return 'good';
  if (value <= thresholds.NEEDS_IMPROVEMENT) return 'needs-improvement';
  return 'poor';
}

// Send metrics to backend
async function sendMetrics(metrics: MetricsData): Promise<void> {
  try {
    const response = await fetch(CONFIG.REPORT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        timestamp: new Date().toISOString(),
        metrics: {
          lcp: {
            value: metrics.LCP,
            rating: getRating(metrics.LCP || 0, CONFIG.THRESHOLDS.LCP),
          },
          inp: {
            value: metrics.INP,
            rating: getRating(metrics.INP || 0, CONFIG.THRESHOLDS.INP),
          },
          cls: {
            value: metrics.CLS,
            rating: getRating(metrics.CLS || 0, CONFIG.THRESHOLDS.CLS),
          },
          fcp: {
            value: metrics.FCP,
            rating: getRating(metrics.FCP || 0, CONFIG.THRESHOLDS.FCP),
          },
          ttfb: {
            value: metrics.TTFB,
            rating: getRating(metrics.TTFB || 0, CONFIG.THRESHOLDS.TTFB),
          },
        },
        navigation: {
          type: performance.navigation?.type,
          redirectCount: performance.navigation?.redirectCount,
          domContentLoaded: Math.round(performance.timing?.domContentLoadedEventEnd - performance.timing?.navigationStart),
          loadComplete: Math.round(performance.timing?.loadEventEnd - performance.timing?.navigationStart),
        },
      }),
      // Keepalive if available
      keepalive: true,
    });

    if (!response.ok) {
      console.error('[Web Vitals] Failed to send metrics:', response.status);
    }
  } catch (error) {
    console.error('[Web Vitals] Error sending metrics:', error);
  }
}

// Sample rate check
function shouldSample() {
  return Math.random() < CONFIG.SAMPLE_RATE;
}

// Collect all vitals
function collectWebVitals(): void {
  const vitals: MetricsData = {};

  // LCP - Largest Contentful Paint
  onLCP((metric) => {
    vitals.LCP = metric.value;
    if (import.meta.env.DEV) console.log('[Web Vitals] LCP:', metric.value, 'ms', getRating(metric.value, CONFIG.THRESHOLDS.LCP));
  });

  // INP - Interaction to Next Paint (replaces FID)
  onINP((metric) => {
    vitals.INP = metric.value;
    if (import.meta.env.DEV) console.log('[Web Vitals] INP:', metric.value, 'ms', getRating(metric.value, CONFIG.THRESHOLDS.INP));
  });

  // CLS - Cumulative Layout Shift
  onCLS((metric) => {
    vitals.CLS = metric.value;
    if (import.meta.env.DEV) console.log('[Web Vitals] CLS:', metric.value, getRating(metric.value, CONFIG.THRESHOLDS.CLS));
  });

  // FCP - First Contentful Paint
  onFCP((metric) => {
    vitals.FCP = metric.value;
    if (import.meta.env.DEV) console.log('[Web Vitals] FCP:', metric.value, 'ms', getRating(metric.value, CONFIG.THRESHOLDS.FCP));
  });

  // TTFB - Time to First Byte
  onTTFB((metric) => {
    vitals.TTFB = metric.value;
    if (import.meta.env.DEV) console.log('[Web Vitals] TTFB:', metric.value, 'ms', getRating(metric.value, CONFIG.THRESHOLDS.TTFB));
  });

  // Send metrics when page is fully loaded
  window.addEventListener('load', () => {
    if (shouldSample()) {
      // Wait a bit to ensure all metrics are collected
      setTimeout(() => {
        sendMetrics(vitals);
      }, 1000);
    }
  });

  // Also send on visibility change (user navigates away)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && shouldSample() && Object.keys(vitals).length > 0) {
      sendMetrics(vitals);
    }
  });
}

// Start collecting when DOM is ready
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  if (document.readyState === 'complete') {
    collectWebVitals();
  } else {
    window.addEventListener('load', collectWebVitals);
  }
}

// Export for testing
export { collectWebVitals, sendMetrics, CONFIG };
