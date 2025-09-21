import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Exports() {
  const [exportName, setExportName] = useState("");
  const [exportType, setExportType] = useState("csv");
  const [selectedQueryId, setSelectedQueryId] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exports, isLoading: exportsLoading } = useQuery({
    queryKey: ["/api/exports"],
  });

  const { data: queries } = useQuery({
    queryKey: ["/api/queries", { saved: "true" }],
  });

  const createExportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/exports", {
        name: exportName,
        type: exportType,
        queryId: selectedQueryId ? parseInt(selectedQueryId) : undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Export Created",
        description: "Your export is being processed.",
      });
      setExportName("");
      setSelectedQueryId("");
      queryClient.invalidateQueries({ queryKey: ["/api/exports"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create export.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-accent/10 text-accent";
      case "pending":
        return "bg-chart-4/10 text-chart-4";
      case "failed":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "fas fa-check-circle";
      case "pending":
        return "fas fa-clock";
      case "failed":
        return "fas fa-exclamation-circle";
      default:
        return "fas fa-question-circle";
    }
  };

  const handleCreateExport = () => {
    if (!exportName) {
      toast({
        title: "Error",
        description: "Please provide an export name.",
        variant: "destructive",
      });
      return;
    }
    createExportMutation.mutate();
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Data Exports</h2>
            <p className="text-muted-foreground">Export your data in various formats</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Create New Export */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Export</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Export Name
                  </label>
                  <Input
                    value={exportName}
                    onChange={(e) => setExportName(e.target.value)}
                    placeholder="My Data Export"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Format
                  </label>
                  <Select value={exportType} onValueChange={setExportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Source Query (optional)
                  </label>
                  <Select value={selectedQueryId} onValueChange={setSelectedQueryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select query" />
                    </SelectTrigger>
                    <SelectContent>
                      {queries?.map((query: any) => (
                        <SelectItem key={query.id} value={query.id.toString()}>
                          {query.name || `Query #${query.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleCreateExport}
                  disabled={createExportMutation.isPending}
                >
                  {createExportMutation.isPending ? (
                    <i className="fas fa-spinner fa-spin w-4 h-4 mr-2"></i>
                  ) : (
                    <i className="fas fa-plus w-4 h-4 mr-2"></i>
                  )}
                  Create Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Exports */}
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
            </CardHeader>
            <CardContent>
              {exportsLoading ? (
                <div className="text-center py-8">
                  <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
                  <p className="text-muted-foreground">Loading exports...</p>
                </div>
              ) : exports?.length > 0 ? (
                <div className="space-y-4">
                  {exports.map((exportItem: any) => (
                    <div key={exportItem.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center">
                            <i className="fas fa-file-export text-chart-4"></i>
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{exportItem.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {exportItem.type.toUpperCase()} format
                              {exportItem.completedAt && (
                                <> • {new Date(exportItem.completedAt).toLocaleDateString()}</>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(exportItem.status)}>
                            <i className={`${getStatusIcon(exportItem.status)} mr-1`}></i>
                            {exportItem.status}
                          </Badge>
                          
                          {exportItem.status === "completed" && exportItem.filePath && (
                            <Button size="sm" variant="outline">
                              <i className="fas fa-download w-3 h-3 mr-1"></i>
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-download text-2xl text-muted-foreground mb-2"></i>
                  <p className="text-muted-foreground">No exports created yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create your first export to download your data
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
