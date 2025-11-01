import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function QueryHistory() {
  const { data: queries, isLoading } = useQuery({
    queryKey: ["/api/queries"],
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      const response = await apiRequest("POST", `/api/queries/${queryId}/save`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Query Saved",
        description: "Query has been saved to your collection.",
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

  return (
    <div className="flex h-screen bg-background circuit-pattern">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="smartflow-header px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <i className="fas fa-history text-sf-gold mr-3"></i>
              Query History
            </h2>
            <p className="text-muted-foreground">View and manage your saved and recent queries</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>All Queries</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
                  <p className="text-muted-foreground">Loading queries...</p>
                </div>
              ) : queries?.length > 0 ? (
                <div className="space-y-4">
                  {queries.map((query: any) => (
                    <div key={query.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-foreground">
                              {query.name || `Query #${query.id}`}
                            </h3>
                            {query.isSaved && (
                              <Badge className="bg-accent/10 text-accent">
                                <i className="fas fa-star mr-1"></i>
                                Saved
                              </Badge>
                            )}
                          </div>
                          {query.naturalLanguageQuery && (
                            <p className="text-sm text-muted-foreground mb-2">
                              <strong>Question:</strong> {query.naturalLanguageQuery}
                            </p>
                          )}
                          <div className="bg-muted rounded p-3">
                            <pre className="text-xs text-foreground overflow-x-auto">
                              <code>{query.sqlQuery}</code>
                            </pre>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          <span className="text-xs text-muted-foreground">
                            {new Date(query.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => executeQueryMutation.mutate(query.id)}
                              disabled={executeQueryMutation.isPending}
                            >
                              <i className="fas fa-play w-3 h-3 mr-1"></i>
                              Run
                            </Button>
                            {!query.isSaved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => saveQueryMutation.mutate(query.id)}
                                disabled={saveQueryMutation.isPending}
                              >
                                <i className="fas fa-star w-3 h-3 mr-1"></i>
                                Save
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {query.results && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            Last execution returned {Array.isArray(query.results) ? query.results.length : 0} rows
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-history text-2xl text-muted-foreground mb-2"></i>
                  <p className="text-muted-foreground">No queries found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start by creating queries in the NL to SQL section
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
