import fetch from 'node-fetch';
import crypto from 'crypto';
import { db } from './db';
import { activities } from '../shared/schema';
import { broadcastEvent, WebSocketEvents } from './websocket';

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
  retryAttempts: number;
  headers?: Record<string, string>;
}

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  signature?: string;
}

// Webhook registry
const webhooks = new Map<string, WebhookConfig>();

// Register a webhook
export function registerWebhook(config: Omit<WebhookConfig, 'id'>): string {
  const id = crypto.randomBytes(16).toString('hex');
  webhooks.set(id, { ...config, id });
  console.log(`[Webhook] Registered webhook ${id} for events:`, config.events);
  return id;
}

// Unregister a webhook
export function unregisterWebhook(id: string): boolean {
  const deleted = webhooks.delete(id);
  if (deleted) {
    console.log(`[Webhook] Unregistered webhook ${id}`);
  }
  return deleted;
}

// Generate HMAC signature
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Send webhook with retry logic
async function sendWebhook(
  webhook: WebhookConfig,
  payload: WebhookPayload,
  attempt: number = 1
): Promise<boolean> {
  try {
    const payloadString = JSON.stringify(payload);

    // Add signature if secret is provided
    if (webhook.secret) {
      payload.signature = generateSignature(payloadString, webhook.secret);
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': payload.signature || '',
        'X-Webhook-Event': payload.event,
        'X-Webhook-Attempt': attempt.toString(),
        ...webhook.headers,
      },
      body: payloadString,
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    console.log(`[Webhook] Successfully sent ${payload.event} to ${webhook.url}`);
    return true;
  } catch (error) {
    console.error(`[Webhook] Attempt ${attempt} failed for ${webhook.url}:`, error);

    // Retry logic
    if (attempt < webhook.retryAttempts) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendWebhook(webhook, payload, attempt + 1);
    }

    return false;
  }
}

// Trigger webhooks for an event
export async function triggerWebhooks(event: string, data: any) {
  const timestamp = new Date().toISOString();
  const payload: WebhookPayload = {
    event,
    timestamp,
    data,
  };

  const matchingWebhooks = Array.from(webhooks.values()).filter(
    wh => wh.enabled && (wh.events.includes(event) || wh.events.includes('*'))
  );

  if (matchingWebhooks.length === 0) {
    return;
  }

  console.log(`[Webhook] Triggering ${matchingWebhooks.length} webhooks for event: ${event}`);

  // Send webhooks in parallel
  await Promise.allSettled(
    matchingWebhooks.map(webhook => sendWebhook(webhook, payload))
  );
}

// Slack integration
export async function sendSlackNotification(
  webhookUrl: string,
  message: {
    text: string;
    title?: string;
    color?: 'good' | 'warning' | 'danger';
    fields?: Array<{ title: string; value: string; short?: boolean }>;
  }
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [
          {
            fallback: message.text,
            title: message.title,
            text: message.text,
            color: message.color || 'good',
            fields: message.fields,
            footer: 'DataFlow Analytics',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Slack] Failed to send notification:', error);
    return false;
  }
}

// Discord integration
export async function sendDiscordNotification(
  webhookUrl: string,
  message: {
    content: string;
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  }
): Promise<boolean> {
  try {
    const embed = {
      title: message.title,
      description: message.description || message.content,
      color: message.color || 16766720, // Gold color
      fields: message.fields,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'DataFlow Analytics',
      },
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message.title ? undefined : message.content,
        embeds: [embed],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Discord] Failed to send notification:', error);
    return false;
  }
}

// Microsoft Teams integration
export async function sendTeamsNotification(
  webhookUrl: string,
  message: {
    title: string;
    text: string;
    themeColor?: string;
    sections?: Array<{
      activityTitle?: string;
      activitySubtitle?: string;
      facts?: Array<{ name: string; value: string }>;
    }>;
  }
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: message.themeColor || 'FFD700',
        title: message.title,
        text: message.text,
        sections: message.sections,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Teams] Failed to send notification:', error);
    return false;
  }
}

// Generic integration manager
export class IntegrationManager {
  private static instances = new Map<string, any>();

  static registerIntegration(name: string, config: any) {
    this.instances.set(name, config);
    console.log(`[Integration] Registered ${name}`);
  }

  static async notify(integrationName: string, message: any): Promise<boolean> {
    const config = this.instances.get(integrationName);

    if (!config) {
      console.error(`[Integration] ${integrationName} not found`);
      return false;
    }

    switch (integrationName) {
      case 'slack':
        return sendSlackNotification(config.webhookUrl, message);
      case 'discord':
        return sendDiscordNotification(config.webhookUrl, message);
      case 'teams':
        return sendTeamsNotification(config.webhookUrl, message);
      default:
        console.warn(`[Integration] Unknown integration: ${integrationName}`);
        return false;
    }
  }

  static listIntegrations(): string[] {
    return Array.from(this.instances.keys());
  }
}

// Pre-configured notification templates for integrations
export const IntegrationTemplates = {
  scraperCompleted: (scraperName: string, itemCount: number) => ({
    slack: {
      text: `Scraper "${scraperName}" completed successfully!`,
      title: '✅ Scrape Completed',
      color: 'good' as const,
      fields: [
        { title: 'Scraper', value: scraperName, short: true },
        { title: 'Items Collected', value: itemCount.toString(), short: true },
      ],
    },
    discord: {
      title: '✅ Scrape Completed',
      description: `Scraper **${scraperName}** completed successfully!`,
      color: 5763719, // Green
      fields: [
        { name: 'Scraper', value: scraperName, inline: true },
        { name: 'Items', value: itemCount.toString(), inline: true },
      ],
    },
    teams: {
      title: '✅ Scrape Completed',
      text: `Scraper "${scraperName}" completed successfully!`,
      themeColor: '28A745',
      sections: [
        {
          facts: [
            { name: 'Scraper', value: scraperName },
            { name: 'Items Collected', value: itemCount.toString() },
          ],
        },
      ],
    },
  }),

  highErrorRate: (errorCount: number, errorRate: number) => ({
    slack: {
      text: `⚠️ High error rate detected: ${errorRate.toFixed(1)}%`,
      title: '⚠️ System Alert',
      color: 'warning' as const,
      fields: [
        { title: 'Error Count', value: errorCount.toString(), short: true },
        { title: 'Error Rate', value: `${errorRate.toFixed(1)}%`, short: true },
      ],
    },
    discord: {
      title: '⚠️ System Alert',
      description: `High error rate detected: **${errorRate.toFixed(1)}%**`,
      color: 16776960, // Yellow
      fields: [
        { name: 'Error Count', value: errorCount.toString(), inline: true },
        { name: 'Error Rate', value: `${errorRate.toFixed(1)}%`, inline: true },
      ],
    },
    teams: {
      title: '⚠️ System Alert',
      text: `High error rate detected: ${errorRate.toFixed(1)}%`,
      themeColor: 'FFC107',
      sections: [
        {
          facts: [
            { name: 'Error Count', value: errorCount.toString() },
            { name: 'Error Rate', value: `${errorRate.toFixed(1)}%` },
          ],
        },
      ],
    },
  }),
};

// Auto-trigger integrations on system events
export function setupIntegrationTriggers() {
  // Listen for key events and trigger integrations
  // This would be called from the main application
  console.log('[Integration] Setting up automatic triggers');
}
