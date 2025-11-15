import { db } from './db';
import { scrapedData, activities } from '../shared/schema';
import type { Scraper } from '../shared/schema';

interface ScrapeResult {
  itemsScraped: number;
  pagesVisited: number;
  errors: string[];
}

// Basic scraper engine - can be enhanced with Puppeteer/Playwright
export async function runScraper(scraper: Scraper): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    itemsScraped: 0,
    pagesVisited: 0,
    errors: []
  };

  try {
    const maxPages = scraper.maxPages || 1;
    const selectors = typeof scraper.selectors === 'string'
      ? JSON.parse(scraper.selectors)
      : scraper.selectors;

    // For each page to scrape
    for (let page = 1; page <= maxPages; page++) {
      try {
        const url = page === 1 ? scraper.url : `${scraper.url}?page=${page}`;

        // Fetch the page
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          result.errors.push(`Failed to fetch ${url}: ${response.statusText}`);
          continue;
        }

        const html = await response.text();
        result.pagesVisited++;

        // Simple extraction using regex (for demo - in production use cheerio or jsdom)
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'Untitled';

        // Extract content based on selectors
        const extractedContent: Record<string, any> = {};

        for (const [key, selector] of Object.entries(selectors)) {
          if (typeof selector === 'string') {
            // Simple tag extraction
            const regex = new RegExp(`<${selector}[^>]*>(.*?)<\/${selector}>`, 'gi');
            const matches = [...html.matchAll(regex)];
            extractedContent[key] = matches.map(m => m[1].replace(/<[^>]*>/g, '').trim());
          }
        }

        // Save scraped data
        await db.insert(scrapedData).values({
          url,
          domain: new URL(url).hostname,
          title,
          content: JSON.stringify(extractedContent),
          selectors: JSON.stringify(selectors),
          scraperId: scraper.id
        });

        result.itemsScraped++;

        // Add delay between requests to be polite
        if (page < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        result.errors.push(`Error on page ${page}: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    return result;
  } catch (error) {
    result.errors.push(`Scraper error: ${error instanceof Error ? error.message : 'Unknown'}`);
    return result;
  }
}
