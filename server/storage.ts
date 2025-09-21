import {
  scrapedData,
  scrapers,
  queries,
  socialMediaData,
  exports,
  activities,
  type ScrapedData,
  type InsertScrapedData,
  type Scraper,
  type InsertScraper,
  type Query,
  type InsertQuery,
  type SocialMediaData,
  type InsertSocialMediaData,
  type Export,
  type InsertExport,
  type Activity,
  type InsertActivity,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Dashboard stats
  getDashboardStats(): Promise<{
    scrapedUrls: number;
    sqlQueries: number;
    exports: number;
    activeProjects: number;
    scrapedUrlsChange?: number;
    sqlQueriesChange?: number;
    exportsChange?: number;
  }>;

  // Scraper operations
  createScraper(scraper: InsertScraper): Promise<Scraper>;
  getScraper(id: number): Promise<Scraper | undefined>;
  getScrapers(): Promise<Scraper[]>;
  updateScraper(id: number, updates: Partial<InsertScraper>): Promise<Scraper>;

  // Scraped data operations
  createScrapedData(data: InsertScrapedData): Promise<ScrapedData>;
  getScrapedData(options?: { limit?: number; scraperId?: number }): Promise<ScrapedData[]>;

  // Query operations
  createQuery(query: InsertQuery): Promise<Query>;
  getQuery(id: number): Promise<Query | undefined>;
  getQueries(options?: { saved?: boolean; limit?: number }): Promise<Query[]>;
  updateQuery(id: number, updates: Partial<InsertQuery>): Promise<Query>;
  executeQuery(sqlQuery: string): Promise<any[]>;

  // Social media operations
  getSocialMediaData(options?: { platform?: string; limit?: number }): Promise<SocialMediaData[]>;
  getSocialMediaDataById(id: number): Promise<SocialMediaData | undefined>;
  updateSocialMediaData(id: number, updates: Partial<InsertSocialMediaData>): Promise<SocialMediaData>;
  createSocialMediaData(data: InsertSocialMediaData): Promise<SocialMediaData>;

  // Export operations
  createExport(exportData: InsertExport): Promise<Export>;
  getExports(): Promise<Export[]>;
  updateExport(id: number, updates: Partial<InsertExport>): Promise<Export>;

  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(limit?: number): Promise<Activity[]>;
}

export class DatabaseStorage implements IStorage {
  async getDashboardStats() {
    const [scrapedUrlsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(scrapedData);
    
    const [sqlQueriesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(queries);
    
    const [exportsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(exports);
    
    const [activeScrapersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(scrapers)
      .where(eq(scrapers.isActive, true));

    return {
      scrapedUrls: scrapedUrlsResult.count,
      sqlQueries: sqlQueriesResult.count,
      exports: exportsResult.count,
      activeProjects: activeScrapersResult.count,
      scrapedUrlsChange: 12, // TODO: Calculate actual changes
      sqlQueriesChange: 23,
      exportsChange: -5,
    };
  }

  // Scraper operations
  async createScraper(scraperData: InsertScraper): Promise<Scraper> {
    const [scraper] = await db
      .insert(scrapers)
      .values({
        ...scraperData,
        updatedAt: new Date(),
      })
      .returning();
    return scraper;
  }

  async getScraper(id: number): Promise<Scraper | undefined> {
    const [scraper] = await db
      .select()
      .from(scrapers)
      .where(eq(scrapers.id, id));
    return scraper;
  }

  async getScrapers(): Promise<Scraper[]> {
    return db
      .select()
      .from(scrapers)
      .orderBy(desc(scrapers.createdAt));
  }

  async updateScraper(id: number, updates: Partial<InsertScraper>): Promise<Scraper> {
    const [scraper] = await db
      .update(scrapers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scrapers.id, id))
      .returning();
    return scraper;
  }

  // Scraped data operations
  async createScrapedData(data: InsertScrapedData): Promise<ScrapedData> {
    const [scrapedDataRecord] = await db
      .insert(scrapedData)
      .values(data)
      .returning();
    return scrapedDataRecord;
  }

  async getScrapedData(options: { limit?: number; scraperId?: number } = {}): Promise<ScrapedData[]> {
    let query = db.select().from(scrapedData);
    
    if (options.scraperId) {
      query = query.where(eq(scrapedData.scraperId, options.scraperId));
    }
    
    query = query.orderBy(desc(scrapedData.scrapedAt));
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }

  // Query operations
  async createQuery(queryData: InsertQuery): Promise<Query> {
    const [query] = await db
      .insert(queries)
      .values(queryData)
      .returning();
    return query;
  }

  async getQuery(id: number): Promise<Query | undefined> {
    const [query] = await db
      .select()
      .from(queries)
      .where(eq(queries.id, id));
    return query;
  }

  async getQueries(options: { saved?: boolean; limit?: number } = {}): Promise<Query[]> {
    let query = db.select().from(queries);
    
    if (options.saved !== undefined) {
      query = query.where(eq(queries.isSaved, options.saved));
    }
    
    query = query.orderBy(desc(queries.createdAt));
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }

  async updateQuery(id: number, updates: Partial<InsertQuery>): Promise<Query> {
    const [query] = await db
      .update(queries)
      .set(updates)
      .where(eq(queries.id, id))
      .returning();
    return query;
  }

  async executeQuery(sqlQuery: string): Promise<any[]> {
    try {
      // For safety, only allow SELECT queries
      if (!sqlQuery.trim().toLowerCase().startsWith('select')) {
        throw new Error('Only SELECT queries are allowed');
      }
      
      const result = await db.execute(sql.raw(sqlQuery));
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Social media operations
  async getSocialMediaData(options: { platform?: string; limit?: number } = {}): Promise<SocialMediaData[]> {
    // First, seed some sample data if the table is empty
    await this.seedSocialMediaData();
    
    let query = db.select().from(socialMediaData);
    
    if (options.platform) {
      query = query.where(eq(socialMediaData.platform, options.platform));
    }
    
    query = query.orderBy(desc(socialMediaData.collectedAt));
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }

  async getSocialMediaDataById(id: number): Promise<SocialMediaData | undefined> {
    const [socialData] = await db
      .select()
      .from(socialMediaData)
      .where(eq(socialMediaData.id, id));
    return socialData;
  }

  async updateSocialMediaData(id: number, updates: Partial<InsertSocialMediaData>): Promise<SocialMediaData> {
    const [socialData] = await db
      .update(socialMediaData)
      .set(updates)
      .where(eq(socialMediaData.id, id))
      .returning();
    return socialData;
  }

  async createSocialMediaData(data: InsertSocialMediaData): Promise<SocialMediaData> {
    const [socialData] = await db
      .insert(socialMediaData)
      .values(data)
      .returning();
    return socialData;
  }

  // Export operations
  async createExport(exportData: InsertExport): Promise<Export> {
    const [exportRecord] = await db
      .insert(exports)
      .values(exportData)
      .returning();
    return exportRecord;
  }

  async getExports(): Promise<Export[]> {
    return db
      .select()
      .from(exports)
      .orderBy(desc(exports.createdAt));
  }

  async updateExport(id: number, updates: Partial<InsertExport>): Promise<Export> {
    const [exportRecord] = await db
      .update(exports)
      .set(updates)
      .where(eq(exports.id, id))
      .returning();
    return exportRecord;
  }

  // Activity operations
  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(activityData)
      .returning();
    return activity;
  }

  async getActivities(limit: number = 20): Promise<Activity[]> {
    return db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  // Helper method to seed social media data for MVP
  private async seedSocialMediaData(): Promise<void> {
    const [existing] = await db
      .select({ count: sql<number>`count(*)` })
      .from(socialMediaData);
    
    if (existing.count > 0) {
      return; // Data already exists
    }

    const sampleData = [
      {
        platform: "twitter",
        content: "Just launched our new product feature! The user feedback has been incredible. #ProductLaunch #Innovation",
        author: "@techstartup",
        metrics: { likes: 45, shares: 12, comments: 8 },
        sentiment: "positive" as const,
        keywords: ["product", "launch", "feedback", "innovation"],
      },
      {
        platform: "linkedin",
        content: "Market analysis shows significant growth in our sector. Time to capitalize on emerging opportunities.",
        author: "Jane Smith, Product Manager",
        metrics: { likes: 23, shares: 5, comments: 3 },
        sentiment: "neutral" as const,
        keywords: ["market", "analysis", "growth", "opportunities"],
      },
      {
        platform: "twitter",
        content: "Disappointed with the latest update. Several features are broken and customer support is unresponsive.",
        author: "@frustrated_user",
        metrics: { likes: 8, shares: 15, comments: 22 },
        sentiment: "negative" as const,
        keywords: ["disappointed", "broken", "customer support"],
      },
      {
        platform: "facebook",
        content: "Love how this company listens to customer feedback and implements changes quickly. Great user experience!",
        author: "Happy Customer",
        metrics: { likes: 67, shares: 8, comments: 12 },
        sentiment: "positive" as const,
        keywords: ["feedback", "changes", "user experience"],
      },
      {
        platform: "instagram",
        content: "Behind the scenes of our product development process. Exciting things coming soon! 🚀",
        author: "@company_official",
        metrics: { likes: 156, shares: 23, comments: 31 },
        sentiment: "positive" as const,
        keywords: ["development", "exciting", "coming soon"],
      },
    ];

    for (const data of sampleData) {
      await db.insert(socialMediaData).values(data);
    }
  }
}

export const storage = new DatabaseStorage();
