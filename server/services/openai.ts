import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface SQLGenerationResult {
  sql: string;
  explanation: string;
  confidence: number;
}

export async function generateSQLFromNaturalLanguage(
  naturalLanguageQuery: string,
  schema?: string
): Promise<SQLGenerationResult> {
  try {
    const schemaContext = schema || `
      Available tables:
      - scraped_data (id, url, domain, title, content, scraped_at, scraper_id)
      - scrapers (id, name, url, selectors, frequency, max_pages, is_active)
      - social_media_data (id, platform, content, author, metrics, sentiment, keywords)
      - queries (id, name, natural_language_query, sql_query, results, is_saved)
      - exports (id, name, type, query_id, file_path, status)
      - activities (id, type, message, status, metadata, created_at)
    `;

    const prompt = `
      You are a SQL expert. Convert the following natural language query into a valid PostgreSQL SQL query.
      
      Database Schema:
      ${schemaContext}
      
      Natural Language Query: "${naturalLanguageQuery}"
      
      Requirements:
      1. Generate a valid PostgreSQL SQL query
      2. Use appropriate JOINs when needed
      3. Include proper filtering and ordering
      4. Limit results to a reasonable number (e.g., 100) unless specified
      5. Provide an explanation of what the query does
      6. Rate your confidence in the query (0-1)
      
      Return your response in JSON format with these fields:
      - sql: the generated SQL query
      - explanation: explanation of what the query does
      - confidence: confidence score between 0 and 1
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a database expert specializing in PostgreSQL. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      sql: result.sql || "",
      explanation: result.explanation || "No explanation provided",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
    };
  } catch (error) {
    throw new Error(`Failed to generate SQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeSocialMediaSentiment(text: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis expert. Analyze the sentiment of social media content and extract key topics/keywords. Respond with JSON in this format: { 'sentiment': 'positive'|'negative'|'neutral', 'confidence': number, 'keywords': string[] }"
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      sentiment: result.sentiment || 'neutral',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      keywords: Array.isArray(result.keywords) ? result.keywords : []
    };
  } catch (error) {
    throw new Error(`Failed to analyze sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function explainSQLQuery(sqlQuery: string): Promise<string> {
  try {
    const prompt = `
      Explain this SQL query in simple terms that a product manager would understand:
      
      ${sqlQuery}
      
      Provide a clear, non-technical explanation of:
      1. What data this query retrieves
      2. How it filters or processes the data
      3. What insights it might provide for product management decisions
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a data analyst who explains technical concepts to business stakeholders."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.choices[0].message.content || "No explanation available";
  } catch (error) {
    throw new Error(`Failed to explain query: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
