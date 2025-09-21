import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ScraperConfig() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [selectors, setSelectors] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [maxPages, setMaxPages] = useState("10");
  const [testResults, setTestResults] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const testScraperMutation = useMutation({
    mutationFn: async () => {
      const selectorsArray = selectors.split('\n').filter(s => s.trim()).map(s => s.trim());
      const response = await apiRequest("POST", "/api/scrapers/test", {
        url,
        selectors: selectorsArray,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setTestResults(data);
      if (data.success) {
        toast({
          title: "Test Successful",
          description: "Scraper selectors validated successfully.",
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.error || "Failed to test scraper.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to test scraper.",
        variant: "destructive",
      });
    },
  });

  const createScraperMutation = useMutation({
    mutationFn: async () => {
      const selectorsArray = selectors.split('\n').filter(s => s.trim()).map(s => s.trim());
      const response = await apiRequest("POST", "/api/scrapers", {
        name: name || `Scraper for ${new URL(url).hostname}`,
        url,
        selectors: selectorsArray,
        frequency,
        maxPages: parseInt(maxPages),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Scraper Created",
        description: "Your scraper has been configured and saved.",
      });
      // Reset form
      setUrl("");
      setName("");
      setSelectors("");
      setFrequency("daily");
      setMaxPages("10");
      setTestResults(null);
      queryClient.invalidateQueries({ queryKey: ["/api/scrapers"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create scraper.",
        variant: "destructive",
      });
    },
  });

  const handleTestScraper = () => {
    if (!url || !selectors) {
      toast({
        title: "Error",
        description: "Please provide both URL and CSS selectors.",
        variant: "destructive",
      });
      return;
    }
    testScraperMutation.mutate();
  };

  const handleSaveScraper = () => {
    if (!url || !selectors) {
      toast({
        title: "Error",
        description: "Please provide both URL and CSS selectors.",
        variant: "destructive",
      });
      return;
    }
    createScraperMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Web Scraper Configuration</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Set up automated data collection from websites
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Scraper Name (optional)
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Product Scraper"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Target URL
              </label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/products"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                CSS Selectors (one per line)
              </label>
              <Textarea
                value={selectors}
                onChange={(e) => setSelectors(e.target.value)}
                placeholder=".product-title&#10;.price&#10;.rating"
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter CSS selectors to extract specific data elements
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Frequency
                </label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Pages
                </label>
                <Input
                  type="number"
                  value={maxPages}
                  onChange={(e) => setMaxPages(e.target.value)}
                  placeholder="10"
                  min="1"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Preview/Test Section */}
          <div className="space-y-4">
            <div className="bg-muted rounded-md p-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Preview Results</h4>
              {testResults?.success ? (
                <div className="space-y-2">
                  <div className="text-xs bg-background border border-border rounded p-2">
                    <span className="text-muted-foreground">Page Title:</span>{" "}
                    <span className="text-foreground">{testResults.page_title || "No title found"}</span>
                  </div>
                  {Object.entries(testResults.results || {}).map(([key, result]: [string, any]) => (
                    <div key={key} className="text-xs bg-background border border-border rounded p-2">
                      <span className="text-muted-foreground">
                        {result.selector}:
                      </span>{" "}
                      <span className="text-foreground">
                        {result.matches} matches
                        {result.preview?.length > 0 && ` - "${result.preview[0]}"`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : testResults?.error ? (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
                  Error: {testResults.error}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-flask text-2xl text-muted-foreground mb-2"></i>
                  <p className="text-sm text-muted-foreground">
                    Test your selectors to see preview results
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={handleTestScraper}
                disabled={testScraperMutation.isPending}
                className="flex-1"
              >
                {testScraperMutation.isPending ? (
                  <i className="fas fa-spinner fa-spin w-4 h-4 mr-2"></i>
                ) : (
                  <i className="fas fa-play w-4 h-4 mr-2"></i>
                )}
                Test Scraper
              </Button>
              <Button
                onClick={handleSaveScraper}
                disabled={createScraperMutation.isPending}
                className="flex-1"
              >
                {createScraperMutation.isPending ? (
                  <i className="fas fa-spinner fa-spin w-4 h-4 mr-2"></i>
                ) : (
                  <i className="fas fa-save w-4 h-4 mr-2"></i>
                )}
                Save & Deploy
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
