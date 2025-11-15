import crypto from 'crypto';
import { db } from './db';

// Role-Based Access Control
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
  GUEST = 'guest',
}

export enum Permission {
  // Scraper permissions
  SCRAPER_CREATE = 'scraper:create',
  SCRAPER_READ = 'scraper:read',
  SCRAPER_UPDATE = 'scraper:update',
  SCRAPER_DELETE = 'scraper:delete',
  SCRAPER_RUN = 'scraper:run',

  // Query permissions
  QUERY_CREATE = 'query:create',
  QUERY_READ = 'query:read',
  QUERY_EXECUTE = 'query:execute',
  QUERY_DELETE = 'query:delete',
  QUERY_SHARE = 'query:share',

  // Export permissions
  EXPORT_CREATE = 'export:create',
  EXPORT_READ = 'export:read',
  EXPORT_DELETE = 'export:delete',

  // Analytics permissions
  ANALYTICS_VIEW = 'analytics:view',
  PREDICTIONS_VIEW = 'predictions:view',

  // Admin permissions
  USER_MANAGE = 'user:manage',
  SETTINGS_MANAGE = 'settings:manage',
  INTEGRATION_MANAGE = 'integration:manage',
}

// Role permissions mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.SCRAPER_CREATE, Permission.SCRAPER_READ, Permission.SCRAPER_UPDATE, Permission.SCRAPER_DELETE, Permission.SCRAPER_RUN,
    Permission.QUERY_CREATE, Permission.QUERY_READ, Permission.QUERY_EXECUTE, Permission.QUERY_DELETE, Permission.QUERY_SHARE,
    Permission.EXPORT_CREATE, Permission.EXPORT_READ, Permission.EXPORT_DELETE,
    Permission.ANALYTICS_VIEW, Permission.PREDICTIONS_VIEW,
    Permission.USER_MANAGE,
  ],
  [Role.ANALYST]: [
    Permission.SCRAPER_READ, Permission.SCRAPER_RUN,
    Permission.QUERY_CREATE, Permission.QUERY_READ, Permission.QUERY_EXECUTE, Permission.QUERY_SHARE,
    Permission.EXPORT_CREATE, Permission.EXPORT_READ,
    Permission.ANALYTICS_VIEW, Permission.PREDICTIONS_VIEW,
  ],
  [Role.VIEWER]: [
    Permission.SCRAPER_READ,
    Permission.QUERY_READ,
    Permission.EXPORT_READ,
    Permission.ANALYTICS_VIEW,
  ],
  [Role.GUEST]: [
    Permission.ANALYTICS_VIEW,
  ],
};

// Check if user has permission
export function hasPermission(userRole: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

// Data encryption utilities
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor(secretKey?: string) {
    const key = secretKey || process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.key = crypto.scryptSync(key, 'salt', 32);
  }

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  compareHash(text: string, hash: string): boolean {
    return this.hash(text) === hash;
  }
}

// Field-level encryption
export async function encryptSensitiveFields(data: any, fields: string[]): Promise<any> {
  const encryption = new EncryptionService();
  const encrypted = { ...data };

  for (const field of fields) {
    if (data[field]) {
      const result = encryption.encrypt(String(data[field]));
      encrypted[field] = JSON.stringify(result);
      encrypted[`${field}_encrypted`] = true;
    }
  }

  return encrypted;
}

// API Key management
export class APIKeyManager {
  static generate(): string {
    const prefix = 'df_';
    const key = crypto.randomBytes(32).toString('hex');
    return `${prefix}${key}`;
  }

  static hash(apiKey: string): string {
    return crypto.createHash('sha512').update(apiKey).digest('hex');
  }

  static validate(apiKey: string): boolean {
    return apiKey.startsWith('df_') && apiKey.length === 67;
  }
}

// Two-Factor Authentication
export class TwoFactorAuth {
  static generateSecret(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  static generateTOTP(secret: string): string {
    const time = Math.floor(Date.now() / 1000 / 30);
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
    hmac.update(Buffer.from(time.toString(16).padStart(16, '0'), 'hex'));

    const hash = hmac.digest();
    const offset = hash[hash.length - 1] & 0xf;
    const binary = ((hash[offset] & 0x7f) << 24) |
                   ((hash[offset + 1] & 0xff) << 16) |
                   ((hash[offset + 2] & 0xff) << 8) |
                   (hash[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }

  static verifyTOTP(secret: string, token: string): boolean {
    const generated = this.generateTOTP(secret);
    return generated === token;
  }

  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}

// Session management
export class SessionManager {
  private static sessions = new Map<string, {
    userId: string;
    createdAt: Date;
    expiresAt: Date;
    ip: string;
    userAgent: string;
  }>();

  static createSession(userId: string, ip: string, userAgent: string, ttl: number = 24 * 60 * 60 * 1000): string {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = new Date();

    this.sessions.set(sessionId, {
      userId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttl),
      ip,
      userAgent,
    });

    return sessionId;
  }

  static validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);

    if (!session) return false;

    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return false;
    }

    return true;
  }

  static destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  static getUserId(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    return session?.userId || null;
  }
}

// Audit logging
export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ip: string;
  userAgent: string;
  status: 'success' | 'failure';
  metadata?: any;
}

const auditLogs: AuditLog[] = [];

export function logAuditEvent(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
  auditLogs.push({
    id: crypto.randomUUID(),
    timestamp: new Date(),
    ...log,
  });

  // Keep only last 10000 logs in memory
  if (auditLogs.length > 10000) {
    auditLogs.shift();
  }

  console.log(`[Audit] ${log.action} on ${log.resource} by ${log.userId} - ${log.status}`);
}

export function getAuditLogs(filters?: {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
}): AuditLog[] {
  let filtered = auditLogs;

  if (filters?.userId) {
    filtered = filtered.filter(log => log.userId === filters.userId);
  }

  if (filters?.action) {
    filtered = filtered.filter(log => log.action === filters.action);
  }

  if (filters?.resource) {
    filtered = filtered.filter(log => log.resource === filters.resource);
  }

  if (filters?.startDate) {
    filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
  }

  if (filters?.endDate) {
    filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
  }

  return filtered;
}

// IP whitelist/blacklist
export class IPFilter {
  private static whitelist = new Set<string>();
  private static blacklist = new Set<string>();

  static addToWhitelist(ip: string): void {
    this.whitelist.add(ip);
  }

  static addToBlacklist(ip: string): void {
    this.blacklist.add(ip);
  }

  static isAllowed(ip: string): boolean {
    if (this.blacklist.has(ip)) return false;
    if (this.whitelist.size === 0) return true;
    return this.whitelist.has(ip);
  }

  static removeFromWhitelist(ip: string): void {
    this.whitelist.delete(ip);
  }

  static removeFromBlacklist(ip: string): void {
    this.blacklist.delete(ip);
  }
}

// Data masking
export function maskSensitiveData(data: any, fields: string[]): any {
  const masked = { ...data };

  for (const field of fields) {
    if (masked[field]) {
      const value = String(masked[field]);

      if (field.includes('email')) {
        const [username, domain] = value.split('@');
        masked[field] = `${username.substring(0, 2)}***@${domain}`;
      } else if (field.includes('phone')) {
        masked[field] = `***${value.substring(value.length - 4)}`;
      } else if (field.includes('card') || field.includes('credit')) {
        masked[field] = `****-****-****-${value.substring(value.length - 4)}`;
      } else if (field.includes('ssn')) {
        masked[field] = `***-**-${value.substring(value.length - 4)}`;
      } else {
        masked[field] = '***REDACTED***';
      }
    }
  }

  return masked;
}

// Security headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };
}
