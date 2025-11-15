import cron from 'node-cron';
import { createExport } from './export-service';
import { sendEmail } from './notification-service';
import { db } from './db';

interface ScheduledReport {
  id: string;
  name: string;
  queryId: number;
  schedule: string; // cron expression
  recipients: string[];
  format: 'csv' | 'excel' | 'json' | 'pdf';
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

const scheduledReports = new Map<string, { report: ScheduledReport; task: cron.ScheduledTask }>();

export async function createScheduledReport(report: Omit<ScheduledReport, 'id'>): Promise<string> {
  const id = `report_${Date.now()}`;
  const fullReport: ScheduledReport = { ...report, id };

  const task = cron.schedule(report.schedule, async () => {
    await executeReport(fullReport);
  });

  scheduledReports.set(id, { report: fullReport, task });

  console.log(`[Scheduled Reports] Created report "${report.name}" with schedule: ${report.schedule}`);

  return id;
}

async function executeReport(report: ScheduledReport): Promise<void> {
  try {
    console.log(`[Scheduled Reports] Executing report: ${report.name}`);

    // Generate export
    const filename = await createExport({
      name: report.name,
      type: report.format,
      queryId: report.queryId,
    });

    // Send email to recipients
    for (const recipient of report.recipients) {
      await sendEmail({
        to: recipient,
        subject: `Scheduled Report: ${report.name}`,
        text: `Your scheduled report "${report.name}" is ready.`,
        html: `
          <h2>Scheduled Report Ready</h2>
          <p>Your report <strong>${report.name}</strong> has been generated.</p>
          <p><a href="${process.env.APP_URL}/api/exports/download/${filename}">Download Report</a></p>
        `,
      });
    }

    // Update last run
    const stored = scheduledReports.get(report.id);
    if (stored) {
      stored.report.lastRun = new Date();
    }

    console.log(`[Scheduled Reports] Report "${report.name}" sent to ${report.recipients.length} recipients`);
  } catch (error) {
    console.error(`[Scheduled Reports] Error executing report "${report.name}":`, error);
  }
}

export function deleteScheduledReport(id: string): boolean {
  const stored = scheduledReports.get(id);
  if (stored) {
    stored.task.stop();
    scheduledReports.delete(id);
    return true;
  }
  return false;
}

export function getScheduledReports(): ScheduledReport[] {
  return Array.from(scheduledReports.values()).map(s => s.report);
}

// Automated insights
export interface AutomatedInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'achievement' | 'warning';
  title: string;
  description: string;
  data: any;
  createdAt: Date;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendations: string[];
}

const insights: AutomatedInsight[] = [];

export async function generateAutomatedInsights(): Promise<AutomatedInsight[]> {
  const newInsights: AutomatedInsight[] = [];

  // Check for data spikes
  const recentActivity = await db.execute(sql`
    SELECT COUNT(*) as count, DATE("createdAt") as date
    FROM activities
    WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE("createdAt")
    ORDER BY date DESC
  `);

  // Detect trends
  // (Implementation would analyze the data)

  insights.push(...newInsights);
  return newInsights;
}

// Dashboard snapshots
export async function createDashboardSnapshot(dashboardId: string): Promise<string> {
  const snapshotId = `snapshot_${Date.now()}`;

  // Capture current dashboard state
  const snapshot = {
    id: snapshotId,
    dashboardId,
    timestamp: new Date(),
    data: {}, // Would contain actual dashboard data
  };

  console.log(`[Snapshots] Created snapshot ${snapshotId} for dashboard ${dashboardId}`);

  return snapshotId;
}

// Report templates
export const ReportTemplates = {
  dailySummary: {
    name: 'Daily Summary',
    schedule: '0 9 * * *', // 9 AM daily
    sections: [
      { type: 'stats', title: 'Key Metrics' },
      { type: 'charts', title: 'Trends' },
      { type: 'activities', title: 'Recent Activity' },
    ],
  },

  weeklySummary: {
    name: 'Weekly Summary',
    schedule: '0 9 * * 1', // 9 AM Monday
    sections: [
      { type: 'stats', title: 'Weekly Performance' },
      { type: 'charts', title: '7-Day Trends' },
      { type: 'insights', title: 'Key Insights' },
      { type: 'recommendations', title: 'Recommendations' },
    ],
  },

  monthlySummary: {
    name: 'Monthly Summary',
    schedule: '0 9 1 * *', // 9 AM 1st of month
    sections: [
      { type: 'executive', title: 'Executive Summary' },
      { type: 'performance', title: 'Monthly Performance' },
      { type: 'comparisons', title: 'Month-over-Month' },
      { type: 'goals', title: 'Goal Progress' },
    ],
  },
};

// Custom alert rules
export interface AlertRule {
  id: string;
  name: string;
  condition: string; // e.g., "scraper_error_rate > 10"
  threshold: number;
  window: string; // e.g., "1hour", "1day"
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: Array<{
    type: 'email' | 'webhook' | 'slack';
    config: any;
  }>;
  enabled: boolean;
}

const alertRules = new Map<string, AlertRule>();

export function createAlertRule(rule: Omit<AlertRule, 'id'>): string {
  const id = `rule_${Date.now()}`;
  alertRules.set(id, { ...rule, id });
  return id;
}

export async function checkAlertRules(): Promise<void> {
  for (const [id, rule] of alertRules) {
    if (!rule.enabled) continue;

    // Evaluate condition
    const triggered = await evaluateCondition(rule.condition, rule.threshold);

    if (triggered) {
      console.log(`[Alert] Rule "${rule.name}" triggered`);

      // Execute actions
      for (const action of rule.actions) {
        await executeAlertAction(action, rule);
      }
    }
  }
}

async function evaluateCondition(condition: string, threshold: number): Promise<boolean> {
  // Parse and evaluate condition
  // This would query the database based on the condition
  return false; // Placeholder
}

async function executeAlertAction(action: any, rule: AlertRule): Promise<void> {
  switch (action.type) {
    case 'email':
      // Send email
      break;
    case 'webhook':
      // Call webhook
      break;
    case 'slack':
      // Send to Slack
      break;
  }
}
