import crypto from 'crypto';
import { db } from './db';
import { queries } from '../shared/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { broadcastEvent, WebSocketEvents } from './websocket';

interface ShareOptions {
  queryId: number;
  sharedBy: string;
  sharedWith: string[]; // User emails or ['public']
  permissions: 'view' | 'edit' | 'execute';
  expiresIn?: number; // Hours until expiration
}

interface Dashboard {
  id?: number;
  name: string;
  description?: string;
  layout: any; // Widget configuration
  filters?: any;
  refreshInterval?: number;
  isPublic: boolean;
  createdBy: string;
}

// Generate unique share token
function generateShareToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Share a query with users or publicly
export async function shareQuery(options: ShareOptions): Promise<string> {
  const shareToken = generateShareToken();
  const expiresAt = options.expiresIn
    ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000)
    : null;

  // In a real implementation, this would insert into shared_queries table
  // For now, we'll simulate the functionality
  console.log('[Collaboration] Query shared:', {
    queryId: options.queryId,
    shareToken,
    sharedWith: options.sharedWith,
    permissions: options.permissions,
  });

  // Broadcast share event
  broadcastEvent(WebSocketEvents.QUERY_SAVED, {
    queryId: options.queryId,
    action: 'shared',
    sharedWith: options.sharedWith,
  });

  return shareToken;
}

// Get shared query by token
export async function getSharedQuery(shareToken: string): Promise<any> {
  // In a real implementation, this would query shared_queries table
  // and check expiration, permissions, etc.
  console.log('[Collaboration] Accessing shared query:', shareToken);

  return {
    shareToken,
    query: null, // Would return actual query data
    permissions: 'view',
  };
}

// Revoke query share access
export async function revokeQueryShare(shareToken: string): Promise<boolean> {
  console.log('[Collaboration] Revoking share access:', shareToken);
  return true;
}

// Create a dashboard
export async function createDashboard(dashboard: Dashboard): Promise<number> {
  console.log('[Collaboration] Creating dashboard:', dashboard.name);

  // In a real implementation, insert into dashboards table
  const dashboardId = Math.floor(Math.random() * 10000);

  broadcastEvent(WebSocketEvents.ACTIVITY_CREATED, {
    type: 'dashboard',
    message: `Dashboard "${dashboard.name}" created`,
    dashboardId,
  });

  return dashboardId;
}

// Share a dashboard
export async function shareDashboard(
  dashboardId: number,
  sharedBy: string,
  sharedWith: string[],
  permissions: 'view' | 'edit' = 'view'
): Promise<string> {
  const shareToken = generateShareToken();

  console.log('[Collaboration] Dashboard shared:', {
    dashboardId,
    shareToken,
    sharedWith,
  });

  return shareToken;
}

// Add comment to query
export async function addQueryComment(
  queryId: number,
  userEmail: string,
  comment: string
): Promise<number> {
  console.log('[Collaboration] Adding comment to query:', queryId);

  // In a real implementation, insert into query_comments table
  const commentId = Math.floor(Math.random() * 10000);

  broadcastEvent(WebSocketEvents.QUERY_EXECUTED, {
    queryId,
    action: 'commented',
    userEmail,
  });

  return commentId;
}

// Get comments for a query
export async function getQueryComments(queryId: number): Promise<Array<{
  id: number;
  userEmail: string;
  comment: string;
  createdAt: Date;
}>> {
  console.log('[Collaboration] Getting comments for query:', queryId);

  // In a real implementation, query query_comments table
  return [];
}

// Favorite a query
export async function favoriteQuery(queryId: number, userEmail: string): Promise<boolean> {
  console.log('[Collaboration] Favoriting query:', queryId, userEmail);
  return true;
}

// Unfavorite a query
export async function unfavoriteQuery(queryId: number, userEmail: string): Promise<boolean> {
  console.log('[Collaboration] Unfavoriting query:', queryId, userEmail);
  return true;
}

// Get user's favorite queries
export async function getFavoriteQueries(userEmail: string): Promise<any[]> {
  console.log('[Collaboration] Getting favorite queries for:', userEmail);
  return [];
}

// Get shared queries for a user
export async function getSharedQueriesForUser(userEmail: string): Promise<any[]> {
  console.log('[Collaboration] Getting shared queries for:', userEmail);
  return [];
}

// Get user's dashboards
export async function getUserDashboards(userEmail: string): Promise<any[]> {
  console.log('[Collaboration] Getting dashboards for:', userEmail);
  return [];
}

// Clone a query
export async function cloneQuery(queryId: number, newName: string, clonedBy: string): Promise<number> {
  const [originalQuery] = await db
    .select()
    .from(queries)
    .where(eq(queries.id, queryId))
    .limit(1);

  if (!originalQuery) {
    throw new Error('Query not found');
  }

  const [clonedQuery] = await db
    .insert(queries)
    .values({
      name: newName || `${originalQuery.name} (Copy)`,
      naturalLanguageQuery: originalQuery.naturalLanguageQuery,
      sqlQuery: originalQuery.sqlQuery,
      results: null,
      isSaved: true,
    })
    .returning();

  broadcastEvent(WebSocketEvents.QUERY_SAVED, {
    queryId: clonedQuery.id,
    action: 'cloned',
    originalId: queryId,
  });

  return clonedQuery.id;
}

// Export collaboration utilities
export const CollaborationUtils = {
  shareQuery,
  getSharedQuery,
  revokeQueryShare,
  createDashboard,
  shareDashboard,
  addQueryComment,
  getQueryComments,
  favoriteQuery,
  unfavoriteQuery,
  getFavoriteQueries,
  getSharedQueriesForUser,
  getUserDashboards,
  cloneQuery,
};
