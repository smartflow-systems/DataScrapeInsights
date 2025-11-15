import OpenAI from 'openai';
import { db } from './db';
import { scrapedData, activities } from '../shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Advanced NLP Processing
export async function advancedNLPAnalysis(text: string): Promise<{
  entities: Array<{ text: string; type: string; confidence: number }>;
  keywords: string[];
  topics: string[];
  language: string;
  sentiment: { score: number; label: string };
  summary: string;
  categories: string[];
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an advanced NLP analyzer. Analyze the text and extract:
1. Named entities (people, organizations, locations, dates, etc.)
2. Keywords (important terms)
3. Topics (main themes)
4. Language detection
5. Sentiment analysis
6. Summary
7. Categories

Return JSON format.`
        },
        { role: 'user', content: text }
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      entities: result.entities || [],
      keywords: result.keywords || [],
      topics: result.topics || [],
      language: result.language || 'en',
      sentiment: result.sentiment || { score: 0, label: 'neutral' },
      summary: result.summary || '',
      categories: result.categories || [],
    };
  } catch (error) {
    console.error('[NLP] Error:', error);
    throw error;
  }
}

// Auto-tagging for content
export async function autoTagContent(content: string): Promise<string[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Generate 5-10 relevant tags for the given content. Return as JSON array of strings.'
        },
        { role: 'user', content }
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result.tags || [];
  } catch (error) {
    console.error('[Auto-Tag] Error:', error);
    return [];
  }
}

// Content classification
export async function classifyContent(content: string, categories: string[]): Promise<{
  category: string;
  confidence: number;
  subcategories: Array<{ name: string; score: number }>;
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Classify the content into one of these categories: ${categories.join(', ')}.
          Also identify relevant subcategories. Return JSON.`
        },
        { role: 'user', content }
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('[Classify] Error:', error);
    throw error;
  }
}

// Text summarization
export async function summarizeText(text: string, length: 'short' | 'medium' | 'long' = 'medium'): Promise<string> {
  const maxTokens = { short: 100, medium: 250, long: 500 }[length];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Summarize the following text in ${length} form.`
        },
        { role: 'user', content: text }
      ],
      max_tokens: maxTokens,
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('[Summarize] Error:', error);
    return text.substring(0, maxTokens);
  }
}

// Intent detection
export async function detectIntent(text: string): Promise<{
  intent: string;
  confidence: number;
  entities: Record<string, any>;
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Detect the user intent from the text and extract relevant entities. Return JSON.'
        },
        { role: 'user', content: text }
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('[Intent] Error:', error);
    throw error;
  }
}

// Question answering
export async function answerQuestion(context: string, question: string): Promise<{
  answer: string;
  confidence: number;
  sources: string[];
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Answer the question based on the provided context. Include confidence score and sources.'
        },
        { role: 'user', content: `Context: ${context}\n\nQuestion: ${question}` }
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('[Q&A] Error:', error);
    throw error;
  }
}

// Text translation
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Translate the following text to ${targetLanguage}.`
        },
        { role: 'user', content: text }
      ],
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('[Translate] Error:', error);
    return text;
  }
}

// Image analysis (using GPT-4 Vision)
export async function analyzeImage(imageUrl: string): Promise<{
  description: string;
  objects: string[];
  text: string;
  colors: string[];
  tags: string[];
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and provide: description, objects detected, any text, dominant colors, and relevant tags. Return as JSON.'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 500,
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('[Image Analysis] Error:', error);
    throw error;
  }
}

// Content moderation
export async function moderateContent(content: string): Promise<{
  flagged: boolean;
  categories: Array<{ name: string; score: number }>;
  suggestion: string;
}> {
  try {
    const moderation = await openai.moderations.create({
      input: content,
    });

    const result = moderation.results[0];
    const flaggedCategories = Object.entries(result.category_scores)
      .filter(([_, score]) => score > 0.5)
      .map(([name, score]) => ({ name, score }));

    return {
      flagged: result.flagged,
      categories: flaggedCategories,
      suggestion: result.flagged ? 'Content may violate policies' : 'Content is safe',
    };
  } catch (error) {
    console.error('[Moderation] Error:', error);
    throw error;
  }
}

// Smart search with embeddings
export async function semanticSearch(query: string, documents: string[]): Promise<Array<{
  document: string;
  similarity: number;
  index: number;
}>> {
  try {
    // Get embedding for query
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    // Get embeddings for all documents
    const docEmbeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: documents,
    });

    // Calculate cosine similarity
    const results = documents.map((doc, index) => {
      const similarity = cosineSimilarity(
        queryEmbedding.data[0].embedding,
        docEmbeddings.data[index].embedding
      );

      return { document: doc, similarity, index };
    });

    // Sort by similarity
    return results.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error('[Semantic Search] Error:', error);
    return [];
  }
}

// Helper: Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Conversation AI
export async function conversationalAI(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  context?: string
): Promise<string> {
  try {
    const systemMessage = context
      ? { role: 'system' as const, content: `Context: ${context}\n\nYou are a helpful AI assistant for DataFlow analytics platform.` }
      : { role: 'system' as const, content: 'You are a helpful AI assistant for DataFlow analytics platform.' };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [systemMessage, ...messages],
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('[Conversational AI] Error:', error);
    return 'I apologize, but I encountered an error. Please try again.';
  }
}

// Smart data extraction
export async function extractStructuredData(unstructuredText: string, schema: Record<string, string>): Promise<Record<string, any>> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Extract structured data from the text according to this schema: ${JSON.stringify(schema)}. Return JSON.`
        },
        { role: 'user', content: unstructuredText }
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('[Data Extraction] Error:', error);
    return {};
  }
}

// Generate synthetic data
export async function generateSyntheticData(schema: any, count: number = 10): Promise<any[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Generate ${count} realistic synthetic data records matching this schema: ${JSON.stringify(schema)}. Return as JSON array.`
        },
        { role: 'user', content: 'Generate the data' }
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result.data || [];
  } catch (error) {
    console.error('[Synthetic Data] Error:', error);
    return [];
  }
}
