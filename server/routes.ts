import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSQLFromNaturalLanguage, analyzeSocialMediaSentiment, explainSQLQuery } from "./services/openai";
import { insertScraperSchema, insertQuerySchema, insertActivitySchema } from "@shared/schema";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
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
