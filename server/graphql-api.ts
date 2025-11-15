import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLBoolean, GraphQLNonNull, GraphQLInputObjectType } from 'graphql';
import { storage } from './db';
import { generateSQLFromNaturalLanguage } from './services/openai';
import { predictMetrics, detectAnomalies, generateSmartRecommendations } from './ml-analytics';

// Query Type
const QueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Root query type for DataFlow API',
  fields: {
    // Dashboard stats
    stats: {
      type: StatsType,
      description: 'Get dashboard statistics',
      resolve: async () => {
        return await storage.getDashboardStats();
      },
    },

    // Scrapers
    scrapers: {
      type: new GraphQLList(ScraperType),
      description: 'Get all scrapers',
      resolve: async () => {
        return await storage.getScrapers();
      },
    },

    scraper: {
      type: ScraperType,
      description: 'Get a specific scraper by ID',
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_parent, args) => {
        return await storage.getScraper(args.id);
      },
    },

    // Queries
    queries: {
      type: new GraphQLList(QueryResultType),
      description: 'Get saved queries',
      args: {
        saved: { type: GraphQLBoolean, defaultValue: false },
        limit: { type: GraphQLInt, defaultValue: 20 },
      },
      resolve: async (_parent, args) => {
        return await storage.getQueries({
          saved: args.saved,
          limit: args.limit,
        });
      },
    },

    // Social media data
    socialMedia: {
      type: new GraphQLList(SocialMediaType),
      description: 'Get social media data',
      args: {
        platform: { type: GraphQLString },
        limit: { type: GraphQLInt, defaultValue: 50 },
      },
      resolve: async (_parent, args) => {
        return await storage.getSocialMediaData({
          platform: args.platform,
          limit: args.limit,
        });
      },
    },

    // Activities
    activities: {
      type: new GraphQLList(ActivityType),
      description: 'Get recent activities',
      args: {
        limit: { type: GraphQLInt, defaultValue: 20 },
      },
      resolve: async (_parent, args) => {
        return await storage.getActivities(args.limit);
      },
    },

    // ML Predictions
    predictions: {
      type: PredictionType,
      description: 'Get ML-powered predictions',
      args: {
        metric: { type: new GraphQLNonNull(GraphQLString) },
        days: { type: GraphQLInt, defaultValue: 7 },
      },
      resolve: async (_parent, args) => {
        return await predictMetrics(args.metric, args.days);
      },
    },

    // Anomaly Detection
    anomalies: {
      type: new GraphQLList(AnomalyType),
      description: 'Detect system anomalies',
      args: {
        threshold: { type: GraphQLInt, defaultValue: 2.5 },
      },
      resolve: async (_parent, args) => {
        return await detectAnomalies(args.threshold);
      },
    },

    // Smart Recommendations
    recommendations: {
      type: new GraphQLList(RecommendationType),
      description: 'Get AI-powered recommendations',
      resolve: async () => {
        return await generateSmartRecommendations();
      },
    },
  },
});

// Mutation Type
const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Root mutation type for DataFlow API',
  fields: {
    // Natural Language to SQL
    nlToSql: {
      type: NLSQLResultType,
      description: 'Convert natural language to SQL',
      args: {
        query: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_parent, args) => {
        const result = await generateSQLFromNaturalLanguage(args.query);
        const queryData = await storage.createQuery({
          naturalLanguageQuery: args.query,
          sqlQuery: result.sql,
          results: null,
          isSaved: false,
        });
        return { ...result, queryId: queryData.id };
      },
    },

    // Execute query
    executeQuery: {
      type: ExecutionResultType,
      description: 'Execute a SQL query',
      args: {
        queryId: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_parent, args) => {
        const query = await storage.getQuery(args.queryId);
        if (!query) {
          throw new Error('Query not found');
        }
        const results = await storage.executeQuery(query.sqlQuery);
        await storage.updateQuery(args.queryId, { results });
        return { results, count: results.length };
      },
    },

    // Save query
    saveQuery: {
      type: QueryResultType,
      description: 'Save a query',
      args: {
        queryId: { type: new GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLString },
      },
      resolve: async (_parent, args) => {
        return await storage.updateQuery(args.queryId, {
          isSaved: true,
          name: args.name || `Saved Query ${args.queryId}`,
        });
      },
    },

    // Create scraper
    createScraper: {
      type: ScraperType,
      description: 'Create a new scraper',
      args: {
        input: { type: new GraphQLNonNull(ScraperInputType) },
      },
      resolve: async (_parent, args) => {
        const scraper = await storage.createScraper(args.input);
        await storage.createActivity({
          type: 'scraper',
          message: `Created new scraper: ${scraper.name}`,
          status: 'success',
          metadata: { scraperId: scraper.id },
        });
        return scraper;
      },
    },
  },
});

// Object Types
const StatsType = new GraphQLObjectType({
  name: 'Stats',
  fields: {
    totalScrapers: { type: GraphQLInt },
    activeScrapers: { type: GraphQLInt },
    totalScrapedPages: { type: GraphQLInt },
    totalQueries: { type: GraphQLInt },
    totalExports: { type: GraphQLInt },
    recentActivitiesCount: { type: GraphQLInt },
  },
});

const ScraperType = new GraphQLObjectType({
  name: 'Scraper',
  fields: {
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    url: { type: GraphQLString },
    selectors: { type: GraphQLString },
    frequency: { type: GraphQLString },
    maxPages: { type: GraphQLInt },
    isActive: { type: GraphQLBoolean },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  },
});

const QueryResultType = new GraphQLObjectType({
  name: 'QueryResult',
  fields: {
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    naturalLanguageQuery: { type: GraphQLString },
    sqlQuery: { type: GraphQLString },
    results: { type: GraphQLString },
    isSaved: { type: GraphQLBoolean },
    executedAt: { type: GraphQLString },
    createdAt: { type: GraphQLString },
  },
});

const SocialMediaType = new GraphQLObjectType({
  name: 'SocialMedia',
  fields: {
    id: { type: GraphQLInt },
    platform: { type: GraphQLString },
    content: { type: GraphQLString },
    author: { type: GraphQLString },
    metrics: { type: GraphQLString },
    sentiment: { type: GraphQLString },
    keywords: { type: GraphQLString },
    collectedAt: { type: GraphQLString },
  },
});

const ActivityType = new GraphQLObjectType({
  name: 'Activity',
  fields: {
    id: { type: GraphQLInt },
    type: { type: GraphQLString },
    message: { type: GraphQLString },
    status: { type: GraphQLString },
    metadata: { type: GraphQLString },
    createdAt: { type: GraphQLString },
  },
});

const PredictionType = new GraphQLObjectType({
  name: 'Prediction',
  fields: {
    metric: { type: GraphQLString },
    currentValue: { type: GraphQLInt },
    predictedValue: { type: GraphQLInt },
    confidence: { type: GraphQLInt },
    trend: { type: GraphQLString },
    insights: { type: new GraphQLList(GraphQLString) },
  },
});

const AnomalyType = new GraphQLObjectType({
  name: 'Anomaly',
  fields: {
    timestamp: { type: GraphQLString },
    metric: { type: GraphQLString },
    actualValue: { type: GraphQLInt },
    expectedValue: { type: GraphQLInt },
    severity: { type: GraphQLString },
    description: { type: GraphQLString },
  },
});

const RecommendationType = new GraphQLObjectType({
  name: 'Recommendation',
  fields: {
    id: { type: GraphQLString },
    type: { type: GraphQLString },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    impact: { type: GraphQLString },
    action: { type: GraphQLString },
    priority: { type: GraphQLInt },
  },
});

const NLSQLResultType = new GraphQLObjectType({
  name: 'NLSQLResult',
  fields: {
    sql: { type: GraphQLString },
    explanation: { type: GraphQLString },
    queryId: { type: GraphQLInt },
  },
});

const ExecutionResultType = new GraphQLObjectType({
  name: 'ExecutionResult',
  fields: {
    results: { type: GraphQLString },
    count: { type: GraphQLInt },
  },
});

// Input Types
const ScraperInputType = new GraphQLInputObjectType({
  name: 'ScraperInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    url: { type: new GraphQLNonNull(GraphQLString) },
    selectors: { type: new GraphQLNonNull(GraphQLString) },
    frequency: { type: GraphQLString },
    maxPages: { type: GraphQLInt },
    isActive: { type: GraphQLBoolean },
  },
});

// Create GraphQL Schema
export const graphqlSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  description: 'DataFlow GraphQL API - Powerful querying for all your analytics needs',
});

// GraphQL Playground HTML
export const playgroundHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DataFlow GraphQL Playground</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
  <link rel="shortcut icon" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/favicon.png" />
  <script src="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      background: #1a1a2e;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    window.addEventListener('load', function(event) {
      GraphQLPlayground.init(document.getElementById('root'), {
        endpoint: '/graphql',
        settings: {
          'editor.theme': 'dark',
          'editor.cursorShape': 'line',
          'editor.fontSize': 14,
          'editor.fontFamily': "'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace",
          'editor.reuseHeaders': true,
          'prettier.printWidth': 80,
          'request.credentials': 'same-origin',
          'tracing.hideTracingResponse': true
        },
        tabs: [
          {
            endpoint: '/graphql',
            query: \`# Welcome to DataFlow GraphQL Playground!
#
# Example queries to get you started:

# Get dashboard statistics
query GetStats {
  stats {
    totalScrapers
    activeScrapers
    totalScrapedPages
    totalQueries
  }
}

# Get all scrapers
query GetScrapers {
  scrapers {
    id
    name
    url
    isActive
    frequency
  }
}

# Get AI-powered recommendations
query GetRecommendations {
  recommendations {
    id
    type
    title
    description
    impact
    priority
  }
}

# Predict future metrics
query PredictMetrics {
  predictions(metric: "activity_count", days: 7) {
    metric
    currentValue
    predictedValue
    confidence
    trend
    insights
  }
}

# Detect anomalies
query DetectAnomalies {
  anomalies(threshold: 2.5) {
    timestamp
    metric
    actualValue
    expectedValue
    severity
    description
  }
}

# Natural Language to SQL
mutation ConvertNLToSQL {
  nlToSql(query: "Show me the top 10 domains we scraped") {
    sql
    explanation
    queryId
  }
}
\`
          }
        ]
      });
    });
  </script>
</body>
</html>
`;
