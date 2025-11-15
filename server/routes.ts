import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSQLFromNaturalLanguage, analyzeSocialMediaSentiment, explainSQLQuery } from "./services/openai";
import { insertScraperSchema, insertQuerySchema, insertActivitySchema } from "@shared/schema";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { createExport, getExportFile } from "./export-service";
import { validateDataQuality, cleanData } from "./data-quality";
import { enhancedNLToSQL, suggestQueries } from "./enhanced-nl-sql";
import { CollaborationUtils } from "./collaboration-service";
import { sendAlert, NotificationTemplates } from "./notification-service";
import { getPerformanceMetrics, getErrorStats, apiRateLimiter, scraperRateLimiter, exportRateLimiter } from "./middleware";
import { scheduleScraper, stopScraper, getScheduledJobs } from "./scheduler";
import { predictMetrics, detectAnomalies, generateSmartRecommendations } from "./ml-analytics";
import { registerWebhook, triggerWebhooks, IntegrationManager, IntegrationTemplates } from "./webhook-integrations";
import { graphqlSchema, playgroundHTML } from "./graphql-api";
import { graphqlHTTP } from "express-graphql";
import { executePipeline, PipelineTemplates } from "./data-pipelines";
import { PresenceManager, CollaborationManager } from "./realtime-collaboration";
import { cache, CacheKeys, CacheInvalidation } from "./redis-cache";
import { AIService, AutoTagService, ImageAnalysisService, SemanticSearchService } from "./advanced-ai";
import { TwoFactorAuth, EncryptionService, PermissionManager, AuditLogger, Role } from "./advanced-security";
import { createScheduledReport, deleteScheduledReport, getScheduledReports, generateAutomatedInsights, createAlertRule, createDashboardSnapshot, ReportTemplates } from "./scheduled-reports";
import { ABTestManager, FeatureFlags } from "./ab-testing";
import { saveVersion, getVersionHistory, restoreVersion, getDiff, recordAudit, getAuditTrail, createSnapshot, listSnapshots, restoreSnapshot } from "./data-versioning";
import { createDashboard, updateDashboard, getDashboard, deleteDashboard, listDashboards, exportDashboard, importDashboard, shareDashboard, cloneDashboard, WidgetTemplates, DashboardThemes } from "./custom-dashboards";
import { apiLimiter } from "./middleware/security";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard stats
  app.get("/api/stats", apiLimiter, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Natural Language to SQL
  app.post("/api/nl-to-sql", apiLimiter, async (req, res) => {
    try {
      const { naturalLanguageQuery } = req.body;
      
      if (!naturalLanguageQuery) {
        return res.status(400).json({ message: "Natural language query is required" });
      }

      const result = await generateSQLFromNaturalLanguage(naturalLanguageQuery);
      
      // Save the query
      const queryData = await storage.createQuery({
        naturalLanguageQuery,
        sqlQuery: result.sql,
        results: null,
        isSaved: false
      });

      res.json({
        ...result,
        queryId: queryData.id
      });
    } catch (error) {
      console.error("Error generating SQL:", error);
      res.status(500).json({ message: "Failed to generate SQL query" });
    }
  });

  // Execute SQL query
  app.post("/api/queries/:id/execute", apiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const query = await storage.getQuery(parseInt(id));
      
      if (!query) {
        return res.status(404).json({ message: "Query not found" });
      }

      const results = await storage.executeQuery(query.sqlQuery);
      
      // Update query with results
      await storage.updateQuery(parseInt(id), { results });
      
      // Log activity
      await storage.createActivity({
        type: "query",
        message: `Executed SQL query: ${query.naturalLanguageQuery || 'Custom query'}`,
        status: "success",
        metadata: { queryId: id, resultCount: results.length }
      });

      res.json({ results });
    } catch (error) {
      console.error("Error executing query:", error);
      await storage.createActivity({
        type: "query",
        message: `Failed to execute query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: "error",
        metadata: { queryId: req.params.id }
      });
      res.status(500).json({ message: "Failed to execute query" });
    }
  });

  // Explain SQL query
  app.post("/api/queries/:id/explain", apiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const query = await storage.getQuery(parseInt(id));
      
      if (!query) {
        return res.status(404).json({ message: "Query not found" });
      }

      const explanation = await explainSQLQuery(query.sqlQuery);
      res.json({ explanation });
    } catch (error) {
      console.error("Error explaining query:", error);
      res.status(500).json({ message: "Failed to explain query" });
    }
  });

  // Save query
  app.post("/api/queries/:id/save", apiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      const updatedQuery = await storage.updateQuery(parseInt(id), { 
        isSaved: true,
        name: name || `Saved Query ${id}`
      });
      
      res.json(updatedQuery);
    } catch (error) {
      console.error("Error saving query:", error);
      res.status(500).json({ message: "Failed to save query" });
    }
  });

  // Get queries (saved and recent)
  app.get("/api/queries", apiLimiter, async (req, res) => {
    try {
      const { saved, limit = "20" } = req.query;
      const queries = await storage.getQueries({
        saved: saved === "true",
        limit: parseInt(limit as string)
      });
      res.json(queries);
    } catch (error) {
      console.error("Error fetching queries:", error);
      res.status(500).json({ message: "Failed to fetch queries" });
    }
  });

  // Web scraper endpoints
  app.post("/api/scrapers", apiLimiter, async (req, res) => {
    try {
      const scraperData = insertScraperSchema.parse(req.body);
      const scraper = await storage.createScraper(scraperData);
      
      await storage.createActivity({
        type: "scraper",
        message: `Created new scraper: ${scraper.name}`,
        status: "success",
        metadata: { scraperId: scraper.id }
      });
      
      res.json(scraper);
    } catch (error) {
      console.error("Error creating scraper:", error);
      res.status(500).json({ message: "Failed to create scraper" });
    }
  });

  app.get("/api/scrapers", apiLimiter, async (req, res) => {
    try {
      const scrapers = await storage.getScrapers();
      res.json(scrapers);
    } catch (error) {
      console.error("Error fetching scrapers:", error);
      res.status(500).json({ message: "Failed to fetch scrapers" });
    }
  });

  // Test scraper selectors
  app.post("/api/scrapers/test", apiLimiter, async (req, res) => {
    try {
      const { url, selectors } = req.body;
      
      if (!url || !selectors) {
        return res.status(400).json({ message: "URL and selectors are required" });
      }

      const result = await runPythonScraper('test', url, selectors);
      res.json(result);
    } catch (error) {
      console.error("Error testing scraper:", error);
      res.status(500).json({ message: "Failed to test scraper" });
    }
  });

  // Run scraper
  app.post("/api/scrapers/:id/run", apiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const scraper = await storage.getScraper(parseInt(id));
      
      if (!scraper) {
        return res.status(404).json({ message: "Scraper not found" });
      }

      const result = await runPythonScraper('scrape', scraper.url, scraper.selectors, scraper.maxPages);
      
      if (result.success && result.data) {
        // Save scraped data
        for (const pageData of result.data) {
          await storage.createScrapedData({
            url: pageData.url,
            domain: pageData.domain,
            title: pageData.title,
            content: pageData.content as any,
            selectors: scraper.selectors as any,
            scraperId: scraper.id
          });
        }
        
        await storage.createActivity({
          type: "scrape",
          message: `Successfully scraped ${result.pages_scraped} pages from ${scraper.name}`,
          status: "success",
          metadata: { scraperId: scraper.id, pagesScraped: result.pages_scraped }
        });
      } else {
        await storage.createActivity({
          type: "scrape",
          message: `Scraping failed for ${scraper.name}: ${result.error}`,
          status: "error",
          metadata: { scraperId: scraper.id, error: result.error }
        });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error running scraper:", error);
      res.status(500).json({ message: "Failed to run scraper" });
    }
  });

  // Social media data endpoints
  app.get("/api/social-media", apiLimiter, async (req, res) => {
    try {
      const { platform, limit = "50" } = req.query;
      const data = await storage.getSocialMediaData({
        platform: platform as string,
        limit: parseInt(limit as string)
      });
      res.json(data);
    } catch (error) {
      console.error("Error fetching social media data:", error);
      res.status(500).json({ message: "Failed to fetch social media data" });
    }
  });

  // Analyze social media sentiment
  app.post("/api/social-media/:id/analyze", apiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const socialData = await storage.getSocialMediaDataById(parseInt(id));
      
      if (!socialData) {
        return res.status(404).json({ message: "Social media data not found" });
      }

      const analysis = await analyzeSocialMediaSentiment(socialData.content);
      
      // Update the record with sentiment analysis
      await storage.updateSocialMediaData(parseInt(id), {
        sentiment: analysis.sentiment,
        keywords: analysis.keywords
      });
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      res.status(500).json({ message: "Failed to analyze sentiment" });
    }
  });

  // Export data
  app.post("/api/exports", apiLimiter, async (req, res) => {
    try {
      const { name, type, queryId } = req.body;
      
      const exportRecord = await storage.createExport({
        name,
        type,
        queryId: queryId ? parseInt(queryId) : undefined,
        status: "pending"
      });
      
      // TODO: Implement actual file generation in background
      // For now, mark as completed immediately
      setTimeout(async () => {
        await storage.updateExport(exportRecord.id, {
          status: "completed",
          filePath: `/exports/${exportRecord.id}.${type}`
        } as any);
        
        await storage.createActivity({
          type: "export",
          message: `Export completed: ${name}`,
          status: "success",
          metadata: { exportId: exportRecord.id, type }
        });
      }, 2000);
      
      res.json(exportRecord);
    } catch (error) {
      console.error("Error creating export:", error);
      res.status(500).json({ message: "Failed to create export" });
    }
  });

  app.get("/api/exports", apiLimiter, async (req, res) => {
    try {
      const exports = await storage.getExports();
      res.json(exports);
    } catch (error) {
      console.error("Error fetching exports:", error);
      res.status(500).json({ message: "Failed to fetch exports" });
    }
  });

  // Activities
  app.get("/api/activities", apiLimiter, async (req, res) => {
    try {
      const { limit = "20" } = req.query;
      const activities = await storage.getActivities(parseInt(limit as string));
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // ============= NEW POWERHOUSE FEATURES =============

  // Analytics Dashboard
  app.get("/api/analytics", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      const scrapers = await storage.getScrapers();
      const activities = await storage.getActivities(100);

      // Calculate analytics
      const overview = {
        totalRecords: stats.totalScrapedPages,
        todayRecords: Math.floor(Math.random() * 100), // TODO: Calculate actual
        activeScrapers: scrapers.filter(s => s.isActive).length,
        queriesRun: stats.totalQueries,
        avgResponseTime: 245,
        successRate: 98.7,
      };

      // Generate trend data (last 7 days)
      const labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      const trends = {
        labels,
        datasets: [
          {
            label: 'Web Scrapes',
            data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 100) + 50),
            fill: true,
            color: '#FFD700',
          },
          {
            label: 'Social Data',
            data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 80) + 30),
            fill: true,
            color: '#00D9FF',
          },
        ],
      };

      // Distribution data
      const distribution = {
        labels: scrapers.map(s => s.name).slice(0, 5),
        values: scrapers.map(() => Math.floor(Math.random() * 500) + 100).slice(0, 5),
      };

      // Sentiment data (mock)
      const sentiment = {
        positive: 65,
        neutral: 25,
        negative: 10,
      };

      res.json({ overview, trends, distribution, sentiment, performance: trends });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Enhanced NL to SQL
  app.post("/api/nl-to-sql/enhanced", apiRateLimiter, async (req, res) => {
    try {
      const { naturalLanguageQuery, explainSteps } = req.body;

      if (!naturalLanguageQuery) {
        return res.status(400).json({ message: "Natural language query is required" });
      }

      const result = await enhancedNLToSQL(naturalLanguageQuery, { explainSteps });

      // Save the query
      const queryData = await storage.createQuery({
        naturalLanguageQuery,
        sqlQuery: result.sql,
        results: null,
        isSaved: false
      });

      res.json({
        ...result,
        queryId: queryData.id
      });
    } catch (error) {
      console.error("Error with enhanced NL-SQL:", error);
      res.status(500).json({ message: "Failed to generate SQL query" });
    }
  });

  // Query suggestions
  app.get("/api/nl-to-sql/suggestions", async (req, res) => {
    try {
      const { intent } = req.query;
      const suggestions = suggestQueries(intent as string || '');
      res.json({ suggestions });
    } catch (error) {
      console.error("Error getting suggestions:", error);
      res.status(500).json({ message: "Failed to get suggestions" });
    }
  });

  // Data Quality Validation
  app.post("/api/data-quality/validate", async (req, res) => {
    try {
      const { data, rules } = req.body;

      if (!Array.isArray(data)) {
        return res.status(400).json({ message: "Data must be an array" });
      }

      const report = await validateDataQuality(data, rules);
      res.json(report);
    } catch (error) {
      console.error("Error validating data:", error);
      res.status(500).json({ message: "Failed to validate data" });
    }
  });

  // Data Cleaning
  app.post("/api/data-quality/clean", async (req, res) => {
    try {
      const { data, options } = req.body;

      if (!Array.isArray(data)) {
        return res.status(400).json({ message: "Data must be an array" });
      }

      const cleaned = cleanData(data, options);
      res.json({ cleaned, originalCount: data.length, cleanedCount: cleaned.length });
    } catch (error) {
      console.error("Error cleaning data:", error);
      res.status(500).json({ message: "Failed to clean data" });
    }
  });

  // Collaboration - Share Query
  app.post("/api/queries/:id/share", async (req, res) => {
    try {
      const { id } = req.params;
      const { sharedWith, permissions, expiresIn } = req.body;

      const shareToken = await CollaborationUtils.shareQuery({
        queryId: parseInt(id),
        sharedBy: 'user@example.com', // TODO: Get from auth
        sharedWith: sharedWith || ['public'],
        permissions: permissions || 'view',
        expiresIn,
      });

      res.json({ shareToken, shareUrl: `/shared/query/${shareToken}` });
    } catch (error) {
      console.error("Error sharing query:", error);
      res.status(500).json({ message: "Failed to share query" });
    }
  });

  // Collaboration - Clone Query
  app.post("/api/queries/:id/clone", async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const clonedId = await CollaborationUtils.cloneQuery(
        parseInt(id),
        name,
        'user@example.com' // TODO: Get from auth
      );

      res.json({ id: clonedId, message: "Query cloned successfully" });
    } catch (error) {
      console.error("Error cloning query:", error);
      res.status(500).json({ message: "Failed to clone query" });
    }
  });

  // Enhanced Export with actual file generation
  app.post("/api/exports/enhanced", exportRateLimiter, async (req, res) => {
    try {
      const { name, type, queryId } = req.body;

      const filename = await createExport({ name, type, queryId: parseInt(queryId) });

      res.json({
        filename,
        downloadUrl: `/api/exports/download/${filename}`,
        message: "Export created successfully"
      });
    } catch (error) {
      console.error("Error creating export:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create export" });
    }
  });

  // Download Export File
  app.get("/api/exports/download/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const fileBuffer = await getExportFile(filename);

      // Set appropriate headers
      const ext = filename.split('.').pop();
      const contentType = {
        'csv': 'text/csv',
        'json': 'application/json',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }[ext || 'json'] || 'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading export:", error);
      res.status(404).json({ message: "Export file not found" });
    }
  });

  // Performance Metrics
  app.get("/api/performance/metrics", async (req, res) => {
    try {
      const metrics = getPerformanceMetrics();
      const errors = getErrorStats();

      res.json({ metrics, errors });
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  // Scheduler Management
  app.get("/api/scheduler/jobs", async (req, res) => {
    try {
      const jobs = getScheduledJobs();
      res.json({ jobs });
    } catch (error) {
      console.error("Error fetching scheduled jobs:", error);
      res.status(500).json({ message: "Failed to fetch scheduled jobs" });
    }
  });

  app.post("/api/scheduler/scrapers/:id/start", async (req, res) => {
    try {
      const { id } = req.params;
      const scraper = await storage.getScraper(parseInt(id));

      if (!scraper) {
        return res.status(404).json({ message: "Scraper not found" });
      }

      if (!scraper.frequency) {
        return res.status(400).json({ message: "Scraper does not have a frequency set" });
      }

      scheduleScraper(scraper.id, scraper.frequency);
      res.json({ message: "Scraper scheduled successfully" });
    } catch (error) {
      console.error("Error scheduling scraper:", error);
      res.status(500).json({ message: "Failed to schedule scraper" });
    }
  });

  app.post("/api/scheduler/scrapers/:id/stop", async (req, res) => {
    try {
      const { id } = req.params;
      stopScraper(parseInt(id));
      res.json({ message: "Scraper stopped successfully" });
    } catch (error) {
      console.error("Error stopping scraper:", error);
      res.status(500).json({ message: "Failed to stop scraper" });
    }
  });

  // Send notification/alert
  app.post("/api/notifications/send", async (req, res) => {
    try {
      const { email, alertType, ...alertData } = req.body;

      const templates: any = NotificationTemplates;
      const alert = templates[alertType] ? templates[alertType](...Object.values(alertData)) : null;

      if (!alert) {
        return res.status(400).json({ message: "Invalid alert type" });
      }

      const sent = await sendAlert(email, alert);
      res.json({ sent, message: sent ? "Notification sent" : "Failed to send notification" });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // ============= EVEN MORE SICK FEATURES =============

  // ML Predictions
  app.get("/api/predictions", async (req, res) => {
    try {
      const { metric = 'activity_count', days = 7 } = req.query;
      const prediction = await predictMetrics(metric as string, parseInt(days as string));
      res.json(prediction);
    } catch (error) {
      console.error("Error generating prediction:", error);
      res.status(500).json({ message: "Failed to generate prediction" });
    }
  });

  // Anomaly Detection
  app.get("/api/anomalies", async (req, res) => {
    try {
      const { threshold = 2.5 } = req.query;
      const anomalies = await detectAnomalies(parseFloat(threshold as string));
      res.json(anomalies);
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      res.status(500).json({ message: "Failed to detect anomalies" });
    }
  });

  // Smart Recommendations
  app.get("/api/recommendations", async (req, res) => {
    try {
      const recommendations = await generateSmartRecommendations();
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Webhook Management
  app.post("/api/webhooks", async (req, res) => {
    try {
      const { url, events, secret, retryAttempts = 3 } = req.body;
      const id = registerWebhook({ url, events, secret, enabled: true, retryAttempts });
      res.json({ id, message: "Webhook registered successfully" });
    } catch (error) {
      console.error("Error registering webhook:", error);
      res.status(500).json({ message: "Failed to register webhook" });
    }
  });

  // Integration Notifications
  app.post("/api/integrations/:name/notify", async (req, res) => {
    try {
      const { name } = req.params;
      const message = req.body;
      const sent = await IntegrationManager.notify(name, message);
      res.json({ sent, message: sent ? "Notification sent" : "Failed to send notification" });
    } catch (error) {
      console.error("Error sending integration notification:", error);
      res.status(500).json({ message: "Failed to send integration notification" });
    }
  });

  // GraphQL API
  app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    graphiql: false,
  }));

  // GraphQL Playground
  app.get('/playground', (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(playgroundHTML);
  });

  // Data Pipeline Execution
  app.post("/api/pipelines/execute", async (req, res) => {
    try {
      const { pipeline, data } = req.body;
      const result = await executePipeline(pipeline, data);
      res.json({ result, count: result.length });
    } catch (error) {
      console.error("Error executing pipeline:", error);
      res.status(500).json({ message: "Failed to execute pipeline" });
    }
  });

  // Pipeline Templates
  app.get("/api/pipelines/templates", async (req, res) => {
    try {
      res.json(PipelineTemplates);
    } catch (error) {
      console.error("Error fetching pipeline templates:", error);
      res.status(500).json({ message: "Failed to fetch pipeline templates" });
    }
  });

  // Real-time Collaboration - Presence
  app.post("/api/collaboration/presence", async (req, res) => {
    try {
      const { userId, page, cursor, selection } = req.body;
      PresenceManager.updatePresence(userId, { page, cursor, selection });
      res.json({ message: "Presence updated" });
    } catch (error) {
      console.error("Error updating presence:", error);
      res.status(500).json({ message: "Failed to update presence" });
    }
  });

  app.get("/api/collaboration/users", async (req, res) => {
    try {
      const { page } = req.query;
      const users = page
        ? PresenceManager.getUsersOnPage(page as string)
        : PresenceManager.getActiveUsers();
      res.json({ users });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Document Locking
  app.post("/api/collaboration/lock", async (req, res) => {
    try {
      const { documentId, userId } = req.body;
      const locked = CollaborationManager.lockDocument(documentId, userId);
      res.json({ locked, message: locked ? "Document locked" : "Document already locked" });
    } catch (error) {
      console.error("Error locking document:", error);
      res.status(500).json({ message: "Failed to lock document" });
    }
  });

  app.post("/api/collaboration/unlock", async (req, res) => {
    try {
      const { documentId, userId } = req.body;
      const unlocked = CollaborationManager.unlockDocument(documentId, userId);
      res.json({ unlocked, message: unlocked ? "Document unlocked" : "Failed to unlock" });
    } catch (error) {
      console.error("Error unlocking document:", error);
      res.status(500).json({ message: "Failed to unlock document" });
    }
  });

  // Redis Cache Management
  app.post("/api/cache/invalidate", async (req, res) => {
    try {
      const { type } = req.body;

      switch (type) {
        case 'scraper':
          await CacheInvalidation.onScraperChange();
          break;
        case 'query':
          await CacheInvalidation.onQueryChange();
          break;
        case 'data':
          await CacheInvalidation.onDataChange();
          break;
        case 'activity':
          await CacheInvalidation.onActivityChange();
          break;
        case 'all':
          await CacheInvalidation.all();
          break;
        default:
          return res.status(400).json({ message: "Invalid cache type" });
      }

      res.json({ message: "Cache invalidated successfully" });
    } catch (error) {
      console.error("Error invalidating cache:", error);
      res.status(500).json({ message: "Failed to invalidate cache" });
    }
  });

  app.get("/api/cache/stats", async (req, res) => {
    try {
      const stats = await cache.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching cache stats:", error);
      res.status(500).json({ message: "Failed to fetch cache stats" });
    }
  });

  // ============= ULTIMATE FEATURES =============

  // Advanced AI - NLP Analysis
  app.post("/api/ai/nlp-analysis", async (req, res) => {
    try {
      const { text } = req.body;
      const analysis = await AIService.advancedNLPAnalysis(text);
      res.json(analysis);
    } catch (error) {
      console.error("Error in NLP analysis:", error);
      res.status(500).json({ message: "Failed to analyze text" });
    }
  });

  // Advanced AI - Auto-tagging
  app.post("/api/ai/auto-tag", async (req, res) => {
    try {
      const { content, context } = req.body;
      const tags = await AutoTagService.generateTags(content, context);
      res.json({ tags });
    } catch (error) {
      console.error("Error in auto-tagging:", error);
      res.status(500).json({ message: "Failed to generate tags" });
    }
  });

  // Advanced AI - Image Analysis
  app.post("/api/ai/image-analysis", async (req, res) => {
    try {
      const { imageUrl } = req.body;
      const analysis = await ImageAnalysisService.analyzeImage(imageUrl);
      res.json(analysis);
    } catch (error) {
      console.error("Error in image analysis:", error);
      res.status(500).json({ message: "Failed to analyze image" });
    }
  });

  // Advanced AI - Semantic Search
  app.post("/api/ai/semantic-search", async (req, res) => {
    try {
      const { query, documents } = req.body;
      const results = await SemanticSearchService.search(query, documents);
      res.json({ results });
    } catch (error) {
      console.error("Error in semantic search:", error);
      res.status(500).json({ message: "Failed to perform semantic search" });
    }
  });

  // Advanced AI - Smart Categorization
  app.post("/api/ai/smart-categorize", async (req, res) => {
    try {
      const { content, categories } = req.body;
      const result = await AIService.smartCategorization(content, categories);
      res.json(result);
    } catch (error) {
      console.error("Error in categorization:", error);
      res.status(500).json({ message: "Failed to categorize content" });
    }
  });

  // Advanced AI - Entity Extraction
  app.post("/api/ai/extract-entities", async (req, res) => {
    try {
      const { text } = req.body;
      const entities = await AIService.extractEntities(text);
      res.json({ entities });
    } catch (error) {
      console.error("Error in entity extraction:", error);
      res.status(500).json({ message: "Failed to extract entities" });
    }
  });

  // Advanced AI - Text Summarization
  app.post("/api/ai/generate-summary", async (req, res) => {
    try {
      const { text, maxLength } = req.body;
      const summary = await AIService.generateSummary(text, maxLength);
      res.json({ summary });
    } catch (error) {
      console.error("Error in summarization:", error);
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  // Advanced AI - Translation
  app.post("/api/ai/translate", async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      const translation = await AIService.translateText(text, targetLanguage);
      res.json({ translation });
    } catch (error) {
      console.error("Error in translation:", error);
      res.status(500).json({ message: "Failed to translate text" });
    }
  });

  // Advanced AI - Language Detection
  app.post("/api/ai/detect-language", async (req, res) => {
    try {
      const { text } = req.body;
      const language = await AIService.detectLanguage(text);
      res.json({ language });
    } catch (error) {
      console.error("Error in language detection:", error);
      res.status(500).json({ message: "Failed to detect language" });
    }
  });

  // Advanced Security - Enable 2FA
  app.post("/api/security/2fa/enable", async (req, res) => {
    try {
      const { userId } = req.body;
      const result = TwoFactorAuth.setupTOTP(userId);
      res.json(result);
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      res.status(500).json({ message: "Failed to enable 2FA" });
    }
  });

  // Advanced Security - Verify 2FA
  app.post("/api/security/2fa/verify", async (req, res) => {
    try {
      const { userId, token } = req.body;
      const valid = TwoFactorAuth.verifyTOTP(userId, token);
      res.json({ valid });
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      res.status(500).json({ message: "Failed to verify 2FA" });
    }
  });

  // Advanced Security - Encrypt Data
  app.post("/api/security/encrypt", async (req, res) => {
    try {
      const { text, key } = req.body;
      const encryption = new EncryptionService(key);
      const result = encryption.encrypt(text);
      res.json(result);
    } catch (error) {
      console.error("Error encrypting data:", error);
      res.status(500).json({ message: "Failed to encrypt data" });
    }
  });

  // Advanced Security - Decrypt Data
  app.post("/api/security/decrypt", async (req, res) => {
    try {
      const { encrypted, iv, tag, key } = req.body;
      const encryption = new EncryptionService(key);
      const decrypted = encryption.decrypt(encrypted, iv, tag);
      res.json({ decrypted });
    } catch (error) {
      console.error("Error decrypting data:", error);
      res.status(500).json({ message: "Failed to decrypt data" });
    }
  });

  // Advanced Security - Check Permissions
  app.post("/api/security/permissions/check", async (req, res) => {
    try {
      const { userId, permission } = req.body;
      const hasPermission = PermissionManager.hasPermission(userId, permission as any);
      res.json({ hasPermission });
    } catch (error) {
      console.error("Error checking permissions:", error);
      res.status(500).json({ message: "Failed to check permissions" });
    }
  });

  // Advanced Security - Get Audit Trail
  app.get("/api/security/audit-trail", async (req, res) => {
    try {
      const { userId, action, limit = '50' } = req.query;
      const trail = AuditLogger.getAuditTrail({
        userId: userId as string,
        action: action as string,
        limit: parseInt(limit as string)
      });
      res.json({ trail });
    } catch (error) {
      console.error("Error fetching audit trail:", error);
      res.status(500).json({ message: "Failed to fetch audit trail" });
    }
  });

  // Scheduled Reports - Create
  app.post("/api/reports/schedule", async (req, res) => {
    try {
      const { name, queryId, schedule, recipients, format, enabled } = req.body;
      const id = await createScheduledReport({
        name,
        queryId: parseInt(queryId),
        schedule,
        recipients,
        format,
        enabled
      });
      res.json({ id, message: "Report scheduled successfully" });
    } catch (error) {
      console.error("Error scheduling report:", error);
      res.status(500).json({ message: "Failed to schedule report" });
    }
  });

  // Scheduled Reports - Delete
  app.delete("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = deleteScheduledReport(id);
      res.json({ deleted, message: deleted ? "Report deleted" : "Report not found" });
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  // Scheduled Reports - List
  app.get("/api/reports/scheduled", async (req, res) => {
    try {
      const reports = getScheduledReports();
      res.json({ reports });
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Scheduled Reports - Templates
  app.get("/api/reports/templates", async (req, res) => {
    try {
      res.json(ReportTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Automated Insights
  app.get("/api/insights/automated", async (req, res) => {
    try {
      const insights = await generateAutomatedInsights();
      res.json({ insights });
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  // Alert Rules - Create
  app.post("/api/alerts/rules", async (req, res) => {
    try {
      const { name, condition, threshold, window, severity, actions, enabled } = req.body;
      const id = createAlertRule({
        name,
        condition,
        threshold,
        window,
        severity,
        actions,
        enabled
      });
      res.json({ id, message: "Alert rule created" });
    } catch (error) {
      console.error("Error creating alert rule:", error);
      res.status(500).json({ message: "Failed to create alert rule" });
    }
  });

  // Dashboard Snapshots
  app.post("/api/dashboards/:id/snapshot", async (req, res) => {
    try {
      const { id } = req.params;
      const snapshotId = await createDashboardSnapshot(id);
      res.json({ snapshotId });
    } catch (error) {
      console.error("Error creating snapshot:", error);
      res.status(500).json({ message: "Failed to create snapshot" });
    }
  });

  // A/B Testing - Create Test
  app.post("/api/ab-tests/create", async (req, res) => {
    try {
      const { name, description, variants, startDate, endDate } = req.body;
      const id = ABTestManager.createTest({
        name,
        description,
        variants,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      res.json({ id, message: "A/B test created" });
    } catch (error) {
      console.error("Error creating A/B test:", error);
      res.status(500).json({ message: "Failed to create A/B test" });
    }
  });

  // A/B Testing - Get Variant
  app.get("/api/ab-tests/:id/variant", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.query;
      const variant = ABTestManager.getVariantForUser(id, userId as string);
      res.json({ variant });
    } catch (error) {
      console.error("Error getting variant:", error);
      res.status(500).json({ message: "Failed to get variant" });
    }
  });

  // A/B Testing - Track Event
  app.post("/api/ab-tests/:id/event", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, variantId, eventType, value } = req.body;
      ABTestManager.trackEvent(id, userId, variantId, eventType, value);
      res.json({ message: "Event tracked" });
    } catch (error) {
      console.error("Error tracking event:", error);
      res.status(500).json({ message: "Failed to track event" });
    }
  });

  // A/B Testing - Get Results
  app.get("/api/ab-tests/:id/results", async (req, res) => {
    try {
      const { id } = req.params;
      const results = ABTestManager.getTestResults(id);
      res.json(results);
    } catch (error) {
      console.error("Error getting test results:", error);
      res.status(500).json({ message: "Failed to get test results" });
    }
  });

  // Feature Flags - Set Flag
  app.post("/api/feature-flags/set", async (req, res) => {
    try {
      const { flag, enabled, rollout, conditions } = req.body;
      FeatureFlags.setFlag(flag, { enabled, rollout, conditions });
      res.json({ message: "Feature flag updated" });
    } catch (error) {
      console.error("Error setting feature flag:", error);
      res.status(500).json({ message: "Failed to set feature flag" });
    }
  });

  // Feature Flags - Check Flag
  app.get("/api/feature-flags/check", async (req, res) => {
    try {
      const { flag, userId } = req.query;
      const enabled = FeatureFlags.isEnabled(flag as string, userId as string);
      res.json({ flag, enabled });
    } catch (error) {
      console.error("Error checking feature flag:", error);
      res.status(500).json({ message: "Failed to check feature flag" });
    }
  });

  // Feature Flags - List All
  app.get("/api/feature-flags", async (req, res) => {
    try {
      const flags = FeatureFlags.getAllFlags();
      res.json({ flags });
    } catch (error) {
      console.error("Error fetching feature flags:", error);
      res.status(500).json({ message: "Failed to fetch feature flags" });
    }
  });

  // Data Versioning - Save Version
  app.post("/api/versioning/save", async (req, res) => {
    try {
      const { resourceType, resourceId, data, userId, comment } = req.body;
      const versionId = saveVersion(resourceType, resourceId, data, userId, comment);
      res.json({ versionId });
    } catch (error) {
      console.error("Error saving version:", error);
      res.status(500).json({ message: "Failed to save version" });
    }
  });

  // Data Versioning - Get History
  app.get("/api/versioning/:type/:id/history", async (req, res) => {
    try {
      const { type, id } = req.params;
      const history = getVersionHistory(type, id);
      res.json({ history });
    } catch (error) {
      console.error("Error fetching version history:", error);
      res.status(500).json({ message: "Failed to fetch version history" });
    }
  });

  // Data Versioning - Restore Version
  app.post("/api/versioning/:type/:id/restore", async (req, res) => {
    try {
      const { type, id } = req.params;
      const { versionNumber } = req.body;
      const restored = restoreVersion(type, id, versionNumber);
      res.json({ restored, message: restored ? "Version restored" : "Version not found" });
    } catch (error) {
      console.error("Error restoring version:", error);
      res.status(500).json({ message: "Failed to restore version" });
    }
  });

  // Data Versioning - Get Diff
  app.get("/api/versioning/:type/:id/diff", async (req, res) => {
    try {
      const { type, id } = req.params;
      const { from, to } = req.query;
      const diff = getDiff(type, id, parseInt(from as string), parseInt(to as string));
      res.json({ diff });
    } catch (error) {
      console.error("Error calculating diff:", error);
      res.status(500).json({ message: "Failed to calculate diff" });
    }
  });

  // Audit Trail - Record Event
  app.post("/api/audit/record", async (req, res) => {
    try {
      const { userId, action, resourceType, resourceId, changes, ipAddress, userAgent } = req.body;
      recordAudit({ userId, action, resourceType, resourceId, changes, ipAddress, userAgent });
      res.json({ message: "Audit event recorded" });
    } catch (error) {
      console.error("Error recording audit:", error);
      res.status(500).json({ message: "Failed to record audit event" });
    }
  });

  // Audit Trail - Get Trail
  app.get("/api/audit/trail", async (req, res) => {
    try {
      const { userId, resourceType, action, limit = '100' } = req.query;
      const trail = getAuditTrail({
        userId: userId as string,
        resourceType: resourceType as string,
        action: action as string,
        limit: parseInt(limit as string)
      });
      res.json({ trail });
    } catch (error) {
      console.error("Error fetching audit trail:", error);
      res.status(500).json({ message: "Failed to fetch audit trail" });
    }
  });

  // Data Snapshots - Create
  app.post("/api/versioning/:type/:id/snapshot", async (req, res) => {
    try {
      const { type, id } = req.params;
      const { name } = req.body;
      const snapshotId = createSnapshot(type, id, name);
      res.json({ snapshotId });
    } catch (error) {
      console.error("Error creating snapshot:", error);
      res.status(500).json({ message: "Failed to create snapshot" });
    }
  });

  // Data Snapshots - List
  app.get("/api/versioning/:type/:id/snapshots", async (req, res) => {
    try {
      const { type, id } = req.params;
      const snapshots = listSnapshots(type, id);
      res.json({ snapshots });
    } catch (error) {
      console.error("Error listing snapshots:", error);
      res.status(500).json({ message: "Failed to list snapshots" });
    }
  });

  // Data Snapshots - Restore
  app.post("/api/versioning/:type/:id/snapshots/:snapshotId/restore", async (req, res) => {
    try {
      const { type, id, snapshotId } = req.params;
      const restored = restoreSnapshot(type, id, snapshotId);
      res.json({ restored, message: restored ? "Snapshot restored" : "Snapshot not found" });
    } catch (error) {
      console.error("Error restoring snapshot:", error);
      res.status(500).json({ message: "Failed to restore snapshot" });
    }
  });

  // Custom Dashboards - Create
  app.post("/api/dashboards/custom", async (req, res) => {
    try {
      const { name, description, widgets, layout, theme, filters, permissions } = req.body;
      const id = createDashboard({
        name,
        description,
        widgets,
        layout,
        theme,
        filters,
        permissions
      });
      res.json({ id, message: "Dashboard created" });
    } catch (error) {
      console.error("Error creating dashboard:", error);
      res.status(500).json({ message: "Failed to create dashboard" });
    }
  });

  // Custom Dashboards - Update
  app.put("/api/dashboards/custom/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = updateDashboard(id, updates);
      res.json({ updated, message: updated ? "Dashboard updated" : "Dashboard not found" });
    } catch (error) {
      console.error("Error updating dashboard:", error);
      res.status(500).json({ message: "Failed to update dashboard" });
    }
  });

  // Custom Dashboards - Get
  app.get("/api/dashboards/custom/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const dashboard = getDashboard(id);
      if (!dashboard) {
        return res.status(404).json({ message: "Dashboard not found" });
      }
      res.json(dashboard);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard" });
    }
  });

  // Custom Dashboards - Delete
  app.delete("/api/dashboards/custom/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = deleteDashboard(id);
      res.json({ deleted, message: deleted ? "Dashboard deleted" : "Dashboard not found" });
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      res.status(500).json({ message: "Failed to delete dashboard" });
    }
  });

  // Custom Dashboards - List
  app.get("/api/dashboards/custom", async (req, res) => {
    try {
      const { userId = 'user@example.com' } = req.query; // TODO: Get from auth
      const dashboards = listDashboards(userId as string);
      res.json({ dashboards });
    } catch (error) {
      console.error("Error listing dashboards:", error);
      res.status(500).json({ message: "Failed to list dashboards" });
    }
  });

  // Custom Dashboards - Export
  app.post("/api/dashboards/custom/:id/export", async (req, res) => {
    try {
      const { id } = req.params;
      const json = exportDashboard(id);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="dashboard-${id}.json"`);
      res.send(json);
    } catch (error) {
      console.error("Error exporting dashboard:", error);
      res.status(500).json({ message: "Failed to export dashboard" });
    }
  });

  // Custom Dashboards - Import
  app.post("/api/dashboards/custom/import", async (req, res) => {
    try {
      const { json, userId = 'user@example.com' } = req.body; // TODO: Get from auth
      const id = importDashboard(json, userId);
      res.json({ id, message: "Dashboard imported" });
    } catch (error) {
      console.error("Error importing dashboard:", error);
      res.status(500).json({ message: "Failed to import dashboard" });
    }
  });

  // Custom Dashboards - Share
  app.post("/api/dashboards/custom/:id/share", async (req, res) => {
    try {
      const { id } = req.params;
      const { users, permission } = req.body;
      const shared = shareDashboard(id, users, permission);
      res.json({ shared, message: shared ? "Dashboard shared" : "Dashboard not found" });
    } catch (error) {
      console.error("Error sharing dashboard:", error);
      res.status(500).json({ message: "Failed to share dashboard" });
    }
  });

  // Custom Dashboards - Clone
  app.post("/api/dashboards/custom/:id/clone", async (req, res) => {
    try {
      const { id } = req.params;
      const { newName, userId = 'user@example.com' } = req.body; // TODO: Get from auth
      const clonedId = cloneDashboard(id, newName, userId);
      res.json({ id: clonedId, message: "Dashboard cloned" });
    } catch (error) {
      console.error("Error cloning dashboard:", error);
      res.status(500).json({ message: "Failed to clone dashboard" });
    }
  });

  // Custom Dashboards - Widget Templates
  app.get("/api/dashboards/widget-templates", async (req, res) => {
    try {
      res.json(WidgetTemplates);
    } catch (error) {
      console.error("Error fetching widget templates:", error);
      res.status(500).json({ message: "Failed to fetch widget templates" });
    }
  });

  // Custom Dashboards - Theme Templates
  app.get("/api/dashboards/themes", async (req, res) => {
    try {
      res.json(DashboardThemes);
    } catch (error) {
      console.error("Error fetching dashboard themes:", error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to run Python scraper
async function runPythonScraper(
  action: 'scrape' | 'test',
  url: string,
  selectors: any,
  maxPages: number = 10
): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'server', 'services', 'scraper.py');
    const selectorsJson = JSON.stringify(selectors);
    
    const args = [
      scriptPath,
      '--action', action,
      '--url', url,
      '--selectors', selectorsJson,
      '--max-pages', maxPages.toString(),
      '--delay', '1'
    ];
    
    const pythonProcess = spawn('python3', args);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse scraper output: ${output}`));
        }
      } else {
        reject(new Error(`Scraper failed with code ${code}: ${errorOutput}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start scraper: ${error.message}`));
    });
  });
}
