import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuickActions() {
  const { data: recentQueries } = useQuery({
    queryKey: ["/api/queries", { limit: "3" }],
  });

  return (
    <Card className="smartflow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <i className="fas fa-bolt text-sfs-gold-200"></i>
          Quick Actions
        </CardTitle>
        <p className="text-sm text-muted-foreground">Common data operations</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Action Buttons */}
        <div className="space-y-3">
          <Link href="/scraper">
            <Button className="w-full justify-between bg-sfs-gradient text-sfs-black font-semibold hover:opacity-90 transition-opacity">
              <div className="flex items-center">
                <i className="fas fa-spider w-5 h-5 mr-3"></i>
                <span>Start New Scrape</span>
              </div>
              <i className="fas fa-arrow-right w-4 h-4"></i>
            </Button>
          </Link>

          <Button variant="outline" className="w-full justify-between border-sfs-gold-200/30 hover:bg-sfs-gold-200/10 hover:border-sfs-gold-200/50">
            <div className="flex items-center">
              <i className="fas fa-upload w-5 h-5 mr-3 text-sfs-gold-200"></i>
              <span>Import CSV/JSON</span>
            </div>
            <i className="fas fa-arrow-right w-4 h-4"></i>
          </Button>

          <Link href="/social">
            <Button variant="outline" className="w-full justify-between border-sfs-gold-200/30 hover:bg-sfs-gold-200/10 hover:border-sfs-gold-200/50">
              <div className="flex items-center">
                <i className="fas fa-hashtag w-5 h-5 mr-3 text-sfs-gold-200"></i>
                <span>Social Analytics</span>
              </div>
              <i className="fas fa-arrow-right w-4 h-4"></i>
            </Button>
          </Link>

          <Button variant="outline" className="w-full justify-between border-sfs-gold-200/30 hover:bg-sfs-gold-200/10 hover:border-sfs-gold-200/50">
            <div className="flex items-center">
              <i className="fas fa-plug w-5 h-5 mr-3 text-sfs-gold-200"></i>
              <span>API Integration</span>
            </div>
            <i className="fas fa-arrow-right w-4 h-4"></i>
          </Button>
        </div>

        {/* Recent Queries */}
        <div className="mt-6 pt-4 border-t border-sfs-gold-200/20">
          <h4 className="text-sm font-semibold text-sfs-gold-200 mb-3 flex items-center gap-2">
            <i className="fas fa-history"></i>
            Recent Queries
          </h4>
          <div className="space-y-2">
            {(recentQueries as any[])?.length > 0 ? (
              (recentQueries as any[]).slice(0, 3).map((query: any) => (
                <div
                  key={query.id}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-sfs-gold-200/10 border border-transparent hover:border-sfs-gold-200/20 transition-all cursor-pointer"
                >
                  <i className="fas fa-history w-3 h-3 text-muted-foreground"></i>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {query.naturalLanguageQuery || query.name || "Custom Query"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(query.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                No recent queries
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
