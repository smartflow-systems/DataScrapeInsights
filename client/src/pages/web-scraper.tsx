import Sidebar from "@/components/layout/sidebar";
import ScraperConfig from "@/components/scraper/scraper-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function WebScraper() {
  const { data: scrapers, isLoading } = useQuery({
    queryKey: ["/api/scrapers"],
  });

  return (
    <div className="flex h-screen bg-background circuit-pattern">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="smartflow-header px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <i className="fas fa-spider text-sf-gold mr-3"></i>
              Web Scraper
            </h2>
            <p className="text-muted-foreground">Configure and manage automated data collection</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <ScraperConfig />
          
          {/* Existing Scrapers */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Existing Scrapers</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
                    <p className="text-muted-foreground">Loading scrapers...</p>
                  </div>
                ) : scrapers?.length > 0 ? (
                  <div className="space-y-4">
                    {scrapers.map((scraper: any) => (
                      <div key={scraper.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-foreground">{scraper.name}</h3>
                            <p className="text-sm text-muted-foreground">{scraper.url}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Frequency: {scraper.frequency} • Max pages: {scraper.maxPages}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              scraper.isActive 
                                ? "bg-accent/10 text-accent" 
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {scraper.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-spider text-2xl text-muted-foreground mb-2"></i>
                    <p className="text-muted-foreground">No scrapers configured yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
