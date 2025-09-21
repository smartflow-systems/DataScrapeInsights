import { sql } from 'drizzle-orm';
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from 'drizzle-orm';

// Scraped data table
export const scrapedData = pgTable("scraped_data", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  title: text("title"),
  content: jsonb("content").notNull(), // JSON data extracted from the page
  selectors: jsonb("selectors"), // CSS selectors used
  scrapedAt: timestamp("scraped_at").defaultNow(),
  scraperId: integer("scraper_id").references(() => scrapers.id),
});

// Web scrapers configuration
export const scrapers = pgTable("scrapers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  selectors: jsonb("selectors").notNull(), // Array of CSS selectors
  frequency: text("frequency").notNull(), // hourly, daily, weekly, monthly
  maxPages: integer("max_pages").default(10),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SQL queries (both generated and manual)
export const queries = pgTable("queries", {
  id: serial("id").primaryKey(),
  name: text("name"),
  naturalLanguageQuery: text("natural_language_query"),
  sqlQuery: text("sql_query").notNull(),
  results: jsonb("results"), // Cached query results
  isSaved: boolean("is_saved").default(false),
  executedAt: timestamp("executed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social media data (mock for MVP)
export const socialMediaData = pgTable("social_media_data", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(), // twitter, linkedin, facebook, etc.
  content: text("content").notNull(),
  author: text("author"),
  metrics: jsonb("metrics"), // likes, shares, comments, etc.
  sentiment: text("sentiment"), // positive, negative, neutral
  keywords: jsonb("keywords"), // Array of keywords
  collectedAt: timestamp("collected_at").defaultNow(),
});

// Data exports
export const exports = pgTable("exports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // csv, json, excel
  queryId: integer("query_id").references(() => queries.id),
  filePath: text("file_path"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Activity log
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // scrape, query, export, etc.
  message: text("message").notNull(),
  status: text("status").notNull(), // success, error, warning
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const scrapersRelations = relations(scrapers, ({ many }) => ({
  scrapedData: many(scrapedData),
}));

export const scrapedDataRelations = relations(scrapedData, ({ one }) => ({
  scraper: one(scrapers, {
    fields: [scrapedData.scraperId],
    references: [scrapers.id],
  }),
}));

export const queriesRelations = relations(queries, ({ many }) => ({
  exports: many(exports),
}));

export const exportsRelations = relations(exports, ({ one }) => ({
  query: one(queries, {
    fields: [exports.queryId],
    references: [queries.id],
  }),
}));

// Insert schemas
export const insertScraperSchema = createInsertSchema(scrapers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScrapedDataSchema = createInsertSchema(scrapedData).omit({
  id: true,
  scrapedAt: true,
});

export const insertQuerySchema = createInsertSchema(queries).omit({
  id: true,
  executedAt: true,
  createdAt: true,
});

export const insertSocialMediaDataSchema = createInsertSchema(socialMediaData).omit({
  id: true,
  collectedAt: true,
});

export const insertExportSchema = createInsertSchema(exports).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type Scraper = typeof scrapers.$inferSelect;
export type InsertScraper = z.infer<typeof insertScraperSchema>;

export type ScrapedData = typeof scrapedData.$inferSelect;
export type InsertScrapedData = z.infer<typeof insertScrapedDataSchema>;

export type Query = typeof queries.$inferSelect;
export type InsertQuery = z.infer<typeof insertQuerySchema>;

export type SocialMediaData = typeof socialMediaData.$inferSelect;
export type InsertSocialMediaData = z.infer<typeof insertSocialMediaDataSchema>;

export type Export = typeof exports.$inferSelect;
export type InsertExport = z.infer<typeof insertExportSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
