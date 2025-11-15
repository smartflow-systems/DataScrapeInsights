import { db } from './db';
import { scrapedData, socialMediaData, queries, activities } from '../shared/schema';
import { sql } from 'drizzle-orm';

interface PredictionResult {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  insights: string[];
}

interface AnomalyDetection {
  timestamp: Date;
  metric: string;
  actualValue: number;
  expectedValue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface SmartRecommendation {
  id: string;
  type: 'optimization' | 'insight' | 'action' | 'warning';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  action?: string;
  priority: number;
}

// Simple Moving Average for trend prediction
function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(data[i]);
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }
  return result;
}

// Linear regression for predictions
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

// Predict future values using linear regression
export async function predictMetrics(metricName: string, days: number = 7): Promise<PredictionResult> {
  // Get historical data (last 30 days)
  const historicalData = await db.execute(sql`
    SELECT
      DATE("createdAt") as date,
      COUNT(*) as count
    FROM activities
    WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `);

  const values = historicalData.rows.map((row: any) => parseFloat(row.count));

  if (values.length < 7) {
    throw new Error('Insufficient historical data for prediction');
  }

  // Calculate moving average
  const smoothed = calculateMovingAverage(values, 3);

  // Perform linear regression
  const { slope, intercept } = linearRegression(smoothed);

  // Predict future value
  const currentValue = values[values.length - 1];
  const predictedValue = slope * (values.length + days) + intercept;

  // Calculate confidence based on R-squared
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const ssTotal = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  const ssPredicted = smoothed.map((val, i) => slope * i + intercept);
  const ssRes = smoothed.reduce((sum, val, i) => sum + Math.pow(val - ssPredicted[i], 2), 0);
  const rSquared = 1 - (ssRes / ssTotal);
  const confidence = Math.max(0, Math.min(100, rSquared * 100));

  // Determine trend
  let trend: 'up' | 'down' | 'stable';
  const percentChange = ((predictedValue - currentValue) / currentValue) * 100;
  if (percentChange > 5) trend = 'up';
  else if (percentChange < -5) trend = 'down';
  else trend = 'stable';

  // Generate insights
  const insights: string[] = [];
  if (trend === 'up') {
    insights.push(`${metricName} is expected to increase by ${Math.abs(percentChange).toFixed(1)}% in the next ${days} days`);
    insights.push('Consider scaling resources to handle increased load');
  } else if (trend === 'down') {
    insights.push(`${metricName} is expected to decrease by ${Math.abs(percentChange).toFixed(1)}% in the next ${days} days`);
    insights.push('Investigate potential causes for the decline');
  } else {
    insights.push(`${metricName} is expected to remain stable`);
  }

  if (confidence < 70) {
    insights.push('Low confidence prediction - data may be volatile');
  }

  return {
    metric: metricName,
    currentValue,
    predictedValue: Math.round(predictedValue),
    confidence: Math.round(confidence),
    trend,
    insights
  };
}

// Detect anomalies using Z-score method
export async function detectAnomalies(
  threshold: number = 2.5
): Promise<AnomalyDetection[]> {
  const anomalies: AnomalyDetection[] = [];

  // Get recent activity counts by hour
  const hourlyData = await db.execute(sql`
    SELECT
      DATE_TRUNC('hour', "createdAt") as hour,
      COUNT(*) as count,
      status
    FROM activities
    WHERE "createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    GROUP BY DATE_TRUNC('hour', "createdAt"), status
    ORDER BY hour DESC
  `);

  const errorCounts = hourlyData.rows
    .filter((row: any) => row.status === 'error')
    .map((row: any) => parseFloat(row.count));

  if (errorCounts.length < 10) return anomalies;

  // Calculate mean and standard deviation
  const mean = errorCounts.reduce((a, b) => a + b, 0) / errorCounts.length;
  const stdDev = Math.sqrt(
    errorCounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / errorCounts.length
  );

  // Detect anomalies
  hourlyData.rows.forEach((row: any) => {
    if (row.status !== 'error') return;

    const value = parseFloat(row.count);
    const zScore = Math.abs((value - mean) / stdDev);

    if (zScore > threshold) {
      let severity: 'low' | 'medium' | 'high' | 'critical';
      if (zScore > 4) severity = 'critical';
      else if (zScore > 3.5) severity = 'high';
      else if (zScore > 3) severity = 'medium';
      else severity = 'low';

      anomalies.push({
        timestamp: new Date(row.hour),
        metric: 'Error Rate',
        actualValue: value,
        expectedValue: mean,
        severity,
        description: `Unusual spike in errors: ${value} errors detected (expected ~${Math.round(mean)})`
      });
    }
  });

  return anomalies.slice(0, 10); // Return top 10
}

// Generate smart recommendations based on system state
export async function generateSmartRecommendations(): Promise<SmartRecommendation[]> {
  const recommendations: SmartRecommendation[] = [];

  // Get system stats
  const stats = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'error') as error_count,
      COUNT(*) FILTER (WHERE status = 'success') as success_count,
      COUNT(DISTINCT type) as activity_types
    FROM activities
    WHERE "createdAt" >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
  `);

  const errorCount = parseInt(stats.rows[0]?.error_count || '0');
  const successCount = parseInt(stats.rows[0]?.success_count || '0');
  const errorRate = errorCount / (errorCount + successCount) * 100;

  // Check error rate
  if (errorRate > 10) {
    recommendations.push({
      id: 'high-error-rate',
      type: 'warning',
      title: 'High Error Rate Detected',
      description: `Your system has a ${errorRate.toFixed(1)}% error rate in the last 24 hours. This is above the healthy threshold of 5%.`,
      impact: 'high',
      action: 'Review error logs and fix failing scrapers',
      priority: 1
    });
  }

  // Check scraper efficiency
  const scrapers = await db.execute(sql`
    SELECT
      s.id,
      s.name,
      COUNT(sd.id) as scrape_count,
      MAX(sd."scrapedAt") as last_scrape
    FROM scrapers s
    LEFT JOIN "scrapedData" sd ON s.id = sd."scraperId"
    WHERE s."isActive" = true
    GROUP BY s.id, s.name
  `);

  scrapers.rows.forEach((scraper: any) => {
    const lastScrape = scraper.last_scrape ? new Date(scraper.last_scrape) : null;
    const hoursSinceLastScrape = lastScrape
      ? (Date.now() - lastScrape.getTime()) / (1000 * 60 * 60)
      : 999;

    if (hoursSinceLastScrape > 24) {
      recommendations.push({
        id: `inactive-scraper-${scraper.id}`,
        type: 'insight',
        title: 'Inactive Scraper Detected',
        description: `Scraper "${scraper.name}" hasn't collected data in ${Math.round(hoursSinceLastScrape)} hours.`,
        impact: 'medium',
        action: 'Check scraper configuration and schedule',
        priority: 3
      });
    }
  });

  // Check query performance
  const queries = await db.execute(sql`
    SELECT COUNT(*) as total_queries
    FROM queries
    WHERE "createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days'
  `);

  const queryCount = parseInt(queries.rows[0]?.total_queries || '0');

  if (queryCount < 10) {
    recommendations.push({
      id: 'low-query-usage',
      type: 'insight',
      title: 'Low Query Activity',
      description: 'Your team is not utilizing the NL-SQL feature frequently. This powerful tool can save significant time.',
      impact: 'low',
      action: 'Explore the NL-SQL interface and save common queries',
      priority: 5
    });
  }

  // Optimization recommendations
  const dataVolume = await db.execute(sql`
    SELECT COUNT(*) as total_records
    FROM "scrapedData"
  `);

  const recordCount = parseInt(dataVolume.rows[0]?.total_records || '0');

  if (recordCount > 10000) {
    recommendations.push({
      id: 'data-archival',
      type: 'optimization',
      title: 'Consider Data Archival',
      description: `You have ${recordCount.toLocaleString()} scraped records. Archiving old data can improve performance.`,
      impact: 'medium',
      action: 'Set up data retention policies',
      priority: 4
    });
  }

  // Export usage
  const exports = await db.execute(sql`
    SELECT COUNT(*) as export_count
    FROM exports
    WHERE status = 'completed'
    AND "createdAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days'
  `);

  const exportCount = parseInt(exports.rows[0]?.export_count || '0');

  if (exportCount === 0) {
    recommendations.push({
      id: 'export-feature',
      type: 'action',
      title: 'Export Your Data',
      description: 'You haven\'t exported any data yet. Regular exports help with reporting and backup.',
      impact: 'low',
      action: 'Try creating an export in CSV or Excel format',
      priority: 6
    });
  }

  // Success recommendation
  if (errorRate < 2 && successCount > 50) {
    recommendations.push({
      id: 'great-performance',
      type: 'insight',
      title: '🎉 Excellent System Performance!',
      description: `Your system is running smoothly with a ${errorRate.toFixed(1)}% error rate and ${successCount} successful operations.`,
      impact: 'high',
      priority: 10
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}

// Cohort analysis
export async function performCohortAnalysis(metric: string): Promise<any> {
  // Group users/activities by cohort (e.g., week of first activity)
  const cohortData = await db.execute(sql`
    WITH cohorts AS (
      SELECT
        DATE_TRUNC('week', MIN("createdAt")) as cohort_week,
        type
      FROM activities
      GROUP BY type
    )
    SELECT
      c.cohort_week,
      c.type,
      COUNT(a.id) as activity_count
    FROM cohorts c
    LEFT JOIN activities a ON a.type = c.type
    WHERE a."createdAt" >= c.cohort_week
    GROUP BY c.cohort_week, c.type
    ORDER BY c.cohort_week DESC
  `);

  return cohortData.rows;
}

// Time series decomposition
export function decomposeTimeSeries(data: number[]): {
  trend: number[];
  seasonal: number[];
  residual: number[];
} {
  const n = data.length;
  const windowSize = Math.min(7, Math.floor(n / 2));

  // Calculate trend using moving average
  const trend = calculateMovingAverage(data, windowSize);

  // Detrend the data
  const detrended = data.map((val, i) => val - trend[i]);

  // Calculate seasonal component (simple approach)
  const seasonalPeriod = 7; // Weekly pattern
  const seasonal = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const seasonalIndex = i % seasonalPeriod;
    const seasonalValues = detrended.filter((_, j) => j % seasonalPeriod === seasonalIndex);
    seasonal[i] = seasonalValues.reduce((a, b) => a + b, 0) / seasonalValues.length;
  }

  // Calculate residual
  const residual = data.map((val, i) => val - trend[i] - seasonal[i]);

  return { trend, seasonal, residual };
}

// Pattern recognition
export function detectPatterns(data: number[]): {
  hasUpwardTrend: boolean;
  hasDownwardTrend: boolean;
  hasCyclical: boolean;
  volatility: 'low' | 'medium' | 'high';
} {
  const { slope } = linearRegression(data);
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const stdDev = Math.sqrt(
    data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
  );
  const cv = stdDev / mean; // Coefficient of variation

  return {
    hasUpwardTrend: slope > 0.1,
    hasDownwardTrend: slope < -0.1,
    hasCyclical: false, // Simplified - would need FFT for proper detection
    volatility: cv > 0.3 ? 'high' : cv > 0.15 ? 'medium' : 'low'
  };
}

// ML Model training placeholder
export async function trainPredictionModel(modelType: 'regression' | 'classification'): Promise<{
  accuracy: number;
  features: string[];
  modelId: string;
}> {
  // This would integrate with TensorFlow.js or similar
  // For now, return a mock response
  return {
    accuracy: 0.87,
    features: ['time_of_day', 'day_of_week', 'historical_average'],
    modelId: `model_${Date.now()}`
  };
}
