import OpenAI from 'openai';
import { db } from './db';
import { scrapedData, socialMediaData, queries as queriesTable } from '../shared/schema';
import { sql } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface SchemaInfo {
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      nullable: boolean;
    }>;
    description: string;
  }>;
}

// Enhanced schema information for better NL-SQL conversion
const SCHEMA_INFO: SchemaInfo = {
  tables: [
    {
      name: 'scrapers',
      description: 'Web scraper configurations',
      columns: [
        { name: 'id', type: 'integer', nullable: false },
        { name: 'name', type: 'text', nullable: false },
        { name: 'url', type: 'text', nullable: false },
        { name: 'selectors', type: 'jsonb', nullable: false },
        { name: 'frequency', type: 'text', nullable: true },
        { name: 'maxPages', type: 'integer', nullable: true },
        { name: 'isActive', type: 'boolean', nullable: false },
        { name: 'createdAt', type: 'timestamp', nullable: false },
        { name: 'updatedAt', type: 'timestamp', nullable: false },
      ],
    },
    {
      name: 'scrapedData',
      description: 'Data collected from web scraping',
      columns: [
        { name: 'id', type: 'integer', nullable: false },
        { name: 'url', type: 'text', nullable: false },
        { name: 'domain', type: 'text', nullable: false },
        { name: 'title', type: 'text', nullable: true },
        { name: 'content', type: 'jsonb', nullable: true },
        { name: 'selectors', type: 'jsonb', nullable: true },
        { name: 'scrapedAt', type: 'timestamp', nullable: false },
        { name: 'scraperId', type: 'integer', nullable: true },
      ],
    },
    {
      name: 'queries',
      description: 'SQL query history and saved queries',
      columns: [
        { name: 'id', type: 'integer', nullable: false },
        { name: 'name', type: 'text', nullable: true },
        { name: 'naturalLanguageQuery', type: 'text', nullable: false },
        { name: 'sqlQuery', type: 'text', nullable: false },
        { name: 'results', type: 'jsonb', nullable: true },
        { name: 'isSaved', type: 'boolean', nullable: false },
        { name: 'executedAt', type: 'timestamp', nullable: true },
        { name: 'createdAt', type: 'timestamp', nullable: false },
      ],
    },
    {
      name: 'socialMediaData',
      description: 'Social media posts and analytics',
      columns: [
        { name: 'id', type: 'integer', nullable: false },
        { name: 'platform', type: 'text', nullable: false },
        { name: 'content', type: 'text', nullable: false },
        { name: 'author', type: 'text', nullable: true },
        { name: 'metrics', type: 'jsonb', nullable: true },
        { name: 'sentiment', type: 'text', nullable: true },
        { name: 'keywords', type: 'jsonb', nullable: true },
        { name: 'collectedAt', type: 'timestamp', nullable: false },
      ],
    },
    {
      name: 'exports',
      description: 'Data export records',
      columns: [
        { name: 'id', type: 'integer', nullable: false },
        { name: 'name', type: 'text', nullable: false },
        { name: 'type', type: 'text', nullable: false },
        { name: 'queryId', type: 'integer', nullable: true },
        { name: 'filePath', type: 'text', nullable: true },
        { name: 'status', type: 'text', nullable: false },
        { name: 'createdAt', type: 'timestamp', nullable: false },
        { name: 'completedAt', type: 'timestamp', nullable: true },
      ],
    },
    {
      name: 'activities',
      description: 'System activity log',
      columns: [
        { name: 'id', type: 'integer', nullable: false },
        { name: 'type', type: 'text', nullable: false },
        { name: 'message', type: 'text', nullable: false },
        { name: 'status', type: 'text', nullable: false },
        { name: 'metadata', type: 'jsonb', nullable: true },
        { name: 'createdAt', type: 'timestamp', nullable: false },
      ],
    },
  ],
};

// Generate schema description for OpenAI
function generateSchemaDescription(): string {
  let description = 'Database Schema:\n\n';

  for (const table of SCHEMA_INFO.tables) {
    description += `Table: ${table.name}\n`;
    description += `Description: ${table.description}\n`;
    description += 'Columns:\n';

    for (const column of table.columns) {
      description += `  - ${column.name} (${column.type})${column.nullable ? ' NULL' : ' NOT NULL'}\n`;
    }

    description += '\n';
  }

  return description;
}

// Enhanced NL to SQL conversion with context awareness
export async function enhancedNLToSQL(
  naturalLanguageQuery: string,
  options?: {
    includeExamples?: boolean;
    optimizeQuery?: boolean;
    explainSteps?: boolean;
  }
): Promise<{
  sql: string;
  explanation: string;
  confidence: number;
  suggestions: string[];
  steps?: string[];
}> {
  const schemaDescription = generateSchemaDescription();

  const systemPrompt = `You are an expert SQL query generator for a PostgreSQL database.
Your job is to convert natural language queries into valid, safe, and optimized SQL queries.

${schemaDescription}

IMPORTANT RULES:
1. Only generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, etc.)
2. Always use proper JOIN syntax when querying multiple tables
3. Use aggregate functions (COUNT, SUM, AVG, MAX, MIN) when appropriate
4. Add LIMIT clauses to prevent returning too many rows (default: 100)
5. Use proper date/time functions for temporal queries
6. For JSON fields (content, metrics, selectors, keywords, metadata), use PostgreSQL JSON operators (->>, ->, #>)
7. Always validate that tables and columns exist in the schema
8. Use appropriate WHERE clauses for filtering
9. Use ORDER BY for sorting results
10. Return results as JSON with: sql, explanation, confidence (0-100), suggestions[]

Format your response as JSON:
{
  "sql": "SELECT ...",
  "explanation": "This query...",
  "confidence": 95,
  "suggestions": ["Consider adding an index on...", "..."],
  "steps": ["Step 1: ...", "Step 2: ..."]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: naturalLanguageQuery },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      sql: response.sql || '',
      explanation: response.explanation || 'No explanation provided',
      confidence: response.confidence || 0,
      suggestions: response.suggestions || [],
      steps: options?.explainSteps ? response.steps : undefined,
    };
  } catch (error) {
    console.error('[Enhanced NL-SQL] Error:', error);
    throw new Error('Failed to convert natural language to SQL');
  }
}

// Query optimization suggestions
export async function analyzeQueryPerformance(sqlQuery: string): Promise<{
  estimatedCost: number;
  indexSuggestions: string[];
  optimizationTips: string[];
}> {
  // Use EXPLAIN to analyze query
  try {
    const explainResult = await db.execute(sql.raw(`EXPLAIN (FORMAT JSON) ${sqlQuery}`));

    // Parse EXPLAIN output
    const plan = JSON.parse(JSON.stringify(explainResult));

    return {
      estimatedCost: 0, // Extract from plan
      indexSuggestions: [],
      optimizationTips: [],
    };
  } catch (error) {
    return {
      estimatedCost: 0,
      indexSuggestions: [],
      optimizationTips: ['Query analysis failed. Ensure the query is valid.'],
    };
  }
}

// Query templates for common operations
export const QUERY_TEMPLATES = {
  topDomains: `
    SELECT domain, COUNT(*) as count
    FROM "scrapedData"
    GROUP BY domain
    ORDER BY count DESC
    LIMIT 10
  `,

  recentScrapes: `
    SELECT id, url, title, "scrapedAt"
    FROM "scrapedData"
    ORDER BY "scrapedAt" DESC
    LIMIT 20
  `,

  sentimentAnalysis: `
    SELECT
      sentiment,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
    FROM "socialMediaData"
    WHERE sentiment IS NOT NULL
    GROUP BY sentiment
    ORDER BY count DESC
  `,

  platformComparison: `
    SELECT
      platform,
      COUNT(*) as total_posts,
      COUNT(DISTINCT author) as unique_authors,
      AVG((metrics->>'likes')::int) as avg_likes
    FROM "socialMediaData"
    WHERE metrics->>'likes' IS NOT NULL
    GROUP BY platform
    ORDER BY total_posts DESC
  `,

  activeScrapers: `
    SELECT
      s.id,
      s.name,
      s.url,
      s.frequency,
      COUNT(sd.id) as total_scraped,
      MAX(sd."scrapedAt") as last_scrape
    FROM scrapers s
    LEFT JOIN "scrapedData" sd ON s.id = sd."scraperId"
    WHERE s."isActive" = true
    GROUP BY s.id, s.name, s.url, s.frequency
    ORDER BY total_scraped DESC
  `,

  errorRate: `
    SELECT
      DATE("createdAt") as date,
      COUNT(*) FILTER (WHERE status = 'error') as errors,
      COUNT(*) FILTER (WHERE status = 'success') as successes,
      ROUND(
        COUNT(*) FILTER (WHERE status = 'error') * 100.0 / COUNT(*),
        2
      ) as error_rate
    FROM activities
    WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE("createdAt")
    ORDER BY date DESC
  `,
};

// Suggest queries based on user intent
export function suggestQueries(intent: string): string[] {
  const suggestions: Record<string, string[]> = {
    performance: [
      'Show me the slowest queries from the past week',
      'What is the average response time for scrapers?',
      'Which scrapers have the highest failure rate?',
    ],
    data: [
      'What are the top 10 domains we scraped?',
      'Show recent scraped data',
      'How many records do we have per domain?',
    ],
    sentiment: [
      'Analyze sentiment distribution across all platforms',
      'Show me the most positive posts from this week',
      'Compare sentiment between Twitter and LinkedIn',
    ],
    trends: [
      'Show data collection trends over the past month',
      'What are the most active scraping times?',
      'Track query execution frequency',
    ],
  };

  const lowercaseIntent = intent.toLowerCase();

  for (const [key, queries] of Object.entries(suggestions)) {
    if (lowercaseIntent.includes(key)) {
      return queries;
    }
  }

  return [
    'Show me recent activity',
    'What are the top domains?',
    'Analyze sentiment distribution',
  ];
}
