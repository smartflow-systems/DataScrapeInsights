import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const SUGGESTED_QUERIES = [
  {
    category: "Popular",
    queries: [
      "Show me the top 10 websites by traffic this month",
      "What are the most frequently scraped domains?",
      "Show me all failed scraping attempts in the last 7 days",
    ],
  },
  {
    category: "Analytics",
    queries: [
      "Calculate the average response time for all API calls",
      "Show me social media engagement trends over the last 30 days",
      "List all data exports created this week",
    ],
  },
  {
    category: "Performance",
    queries: [
      "Which scraping jobs have the longest execution time?",
      "Show me error rates grouped by source type",
      "Find all queries that took longer than 5 seconds",
    ],
  },
];

export default function NLSQLInterface() {
  const [naturalQuery, setNaturalQuery] = useState("");
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [explanation, setExplanation] = useState("");
  const [currentQueryId, setCurrentQueryId] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateSQLMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/nl-to-sql", {
        naturalLanguageQuery: query,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedSQL(data.sql);
      setExplanation(data.explanation);
      setCurrentQueryId(data.queryId);
      toast({
        title: "SQL Generated",
        description: "Your natural language query has been converted to SQL.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate SQL query.",
        variant: "destructive",
      });
    },
  });

  const executeQueryMutation = useMutation({
    mutationFn: async (queryId: number) => {
      const response = await apiRequest("POST", `/api/queries/${queryId}/execute`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Query Executed",
        description: `Query returned ${data.results.length} rows.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to execute query.",
        variant: "destructive",
      });
    },
  });

  const saveQueryMutation = useMutation({
    mutationFn: async (queryId: number) => {
      const response = await apiRequest("POST", `/api/queries/${queryId}/save`, {
        name: `Query: ${naturalQuery.slice(0, 50)}...`,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Query Saved",
        description: "Your query has been saved for future use.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/queries"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save query.",
        variant: "destructive",
      });
    },
  });

  const explainQueryMutation = useMutation({
    mutationFn: async (queryId: number) => {
      const response = await apiRequest("POST", `/api/queries/${queryId}/explain`);
      return response.json();
    },
    onSuccess: (data) => {
      setExplanation(data.explanation);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to explain query.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateSQL = () => {
    if (!naturalQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a natural language query.",
        variant: "destructive",
      });
      return;
    }
    generateSQLMutation.mutate(naturalQuery);
  };

  const handleExecuteQuery = () => {
    if (currentQueryId) {
      executeQueryMutation.mutate(currentQueryId);
    }
  };

  const handleSaveQuery = () => {
    if (currentQueryId) {
      saveQueryMutation.mutate(currentQueryId);
    }
  };

  const handleExplainQuery = () => {
    if (currentQueryId) {
      explainQueryMutation.mutate(currentQueryId);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedSQL);
      toast({
        title: "Copied",
        description: "SQL query copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const useSuggestedQuery = (query: string) => {
    setNaturalQuery(query);
    setShowSuggestions(false);
  };

  return (
    <Card className="smartflow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <i className="fas fa-brain text-sfs-gold-200"></i>
          Natural Language to SQL
        </CardTitle>
        <p className="text-sm text-muted-foreground">Ask questions about your data in plain English with AI-powered assistance</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggested Queries */}
        {showSuggestions && !naturalQuery && (
          <div className="mb-4 p-4 rounded-lg border border-sfs-gold-200/20 bg-sfs-black/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-sfs-gold-200 flex items-center gap-2">
                <i className="fas fa-lightbulb"></i>
                Suggested Queries
              </h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSuggestions(false)}
                className="text-xs"
              >
                Hide
              </Button>
            </div>
            <div className="space-y-4">
              {SUGGESTED_QUERIES.map((section) => (
                <div key={section.category}>
                  <Badge variant="outline" className="mb-2 border-sfs-gold-200/30 text-sfs-gold-200">
                    {section.category}
                  </Badge>
                  <div className="space-y-2">
                    {section.queries.map((query, idx) => (
                      <button
                        key={idx}
                        onClick={() => useSuggestedQuery(query)}
                        className="w-full text-left text-sm p-2 rounded hover:bg-sfs-gold-200/10 border border-transparent hover:border-sfs-gold-200/20 transition-all"
                      >
                        <i className="fas fa-chevron-right text-sfs-gold-200 mr-2 text-xs"></i>
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Query Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">
              Ask a question about your data
            </label>
            {!showSuggestions && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSuggestions(true)}
                className="text-xs text-sfs-gold-200"
              >
                <i className="fas fa-lightbulb mr-1"></i>
                Show Suggestions
              </Button>
            )}
          </div>
          <div className="relative">
            <Textarea
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              placeholder="e.g., Show me the top 10 websites by traffic this month"
              rows={3}
              className="resize-none pr-32"
            />
            <Button
              onClick={handleGenerateSQL}
              disabled={generateSQLMutation.isPending}
              className="absolute bottom-3 right-3 bg-sfs-gradient hover:opacity-90"
              size="sm"
            >
              {generateSQLMutation.isPending ? (
                <i className="fas fa-spinner fa-spin w-4 h-4 mr-2"></i>
              ) : (
                <i className="fas fa-magic w-4 h-4 mr-2"></i>
              )}
              Generate SQL
            </Button>
          </div>
        </div>

        {/* Generated SQL */}
        {generatedSQL && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">Generated SQL Query</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="text-xs"
              >
                <i className="fas fa-copy w-3 h-3 mr-1"></i>
                Copy
              </Button>
            </div>
            <div className="code-editor rounded-md p-4">
              <pre className="text-sm overflow-x-auto">
                <code>{generatedSQL}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Explanation */}
        {explanation && (
          <div className="bg-muted rounded-md p-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Explanation</h4>
            <p className="text-sm text-muted-foreground">{explanation}</p>
          </div>
        )}

        {/* Action Buttons */}
        {generatedSQL && (
          <div className="flex space-x-3 pt-2">
            <Button
              onClick={handleExecuteQuery}
              disabled={executeQueryMutation.isPending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {executeQueryMutation.isPending ? (
                <i className="fas fa-spinner fa-spin w-4 h-4 mr-2"></i>
              ) : (
                <i className="fas fa-play w-4 h-4 mr-2"></i>
              )}
              Execute Query
            </Button>
            <Button
              variant="secondary"
              onClick={handleSaveQuery}
              disabled={saveQueryMutation.isPending}
            >
              {saveQueryMutation.isPending ? (
                <i className="fas fa-spinner fa-spin w-4 h-4 mr-2"></i>
              ) : (
                <i className="fas fa-save w-4 h-4 mr-2"></i>
              )}
              Save Query
            </Button>
            <Button
              variant="outline"
              onClick={handleExplainQuery}
              disabled={explainQueryMutation.isPending}
            >
              {explainQueryMutation.isPending ? (
                <i className="fas fa-spinner fa-spin w-4 h-4 mr-2"></i>
              ) : (
                <i className="fas fa-question-circle w-4 h-4 mr-2"></i>
              )}
              Explain
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
