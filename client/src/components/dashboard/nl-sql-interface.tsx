import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function NLSQLInterface() {
  const [naturalQuery, setNaturalQuery] = useState("");
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [explanation, setExplanation] = useState("");
  const [currentQueryId, setCurrentQueryId] = useState<number | null>(null);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-brain w-5 h-5 mr-2 text-primary"></i>
          Natural Language to SQL
        </CardTitle>
        <p className="text-sm text-muted-foreground">Ask questions about your data in plain English</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Query Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Ask a question about your data
          </label>
          <div className="relative">
            <Textarea
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              placeholder="e.g., Show me the top 10 websites by traffic this month"
              rows={3}
              className="resize-none"
            />
            <Button
              onClick={handleGenerateSQL}
              disabled={generateSQLMutation.isPending}
              className="absolute bottom-3 right-3"
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
