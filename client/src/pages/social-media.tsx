import { useQuery } from "@tanstack/react-query";
import GitHubSidebar from "@/components/dashboard/GitHubSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SocialMedia() {
  const { data: socialData, isLoading } = useQuery({
    queryKey: ["/api/social-media"],
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-accent/10 text-accent";
      case "negative":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return "fab fa-twitter";
      case "linkedin":
        return "fab fa-linkedin";
      case "facebook":
        return "fab fa-facebook";
      case "instagram":
        return "fab fa-instagram";
      default:
        return "fas fa-hashtag";
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5DC] circuit-pattern">
      <GitHubSidebar />

      <div className="flex flex-col">
        {/* Header */}
        <header className="smartflow-header px-6 py-4 mt-16">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <i className="fas fa-hashtag text-sf-gold mr-3"></i>
              Social Media Analytics
            </h2>
            <p className="text-muted-foreground">Monitor social media mentions and sentiment</p>
          </div>
        </header>

        {/* Content */}
        <main className="overflow-auto p-6 max-w-7xl mx-auto w-full">
          {/* Mock Data Notice */}
          <Card className="mb-6 border-chart-4/20 bg-chart-4/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <i className="fas fa-info-circle text-chart-4"></i>
                <div>
                  <p className="text-sm font-medium text-foreground">MVP Notice</p>
                  <p className="text-xs text-muted-foreground">
                    Currently showing sample data. Connect your social media APIs for real-time data collection.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Social Media Data</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
                  <p className="text-muted-foreground">Loading social media data...</p>
                </div>
              ) : socialData?.length > 0 ? (
                <div className="space-y-4">
                  {socialData.map((post: any) => (
                    <div key={post.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <i className={`${getPlatformIcon(post.platform)} text-primary`}></i>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{post.author}</p>
                            <p className="text-xs text-muted-foreground capitalize">{post.platform}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {post.sentiment && (
                            <Badge className={getSentimentColor(post.sentiment)}>
                              {post.sentiment}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.collectedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-foreground mb-3">{post.content}</p>
                      
                      {post.keywords && post.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.keywords.map((keyword: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {post.metrics && (
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          {post.metrics.likes && (
                            <span>
                              <i className="fas fa-heart mr-1"></i>
                              {post.metrics.likes}
                            </span>
                          )}
                          {post.metrics.shares && (
                            <span>
                              <i className="fas fa-share mr-1"></i>
                              {post.metrics.shares}
                            </span>
                          )}
                          {post.metrics.comments && (
                            <span>
                              <i className="fas fa-comment mr-1"></i>
                              {post.metrics.comments}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-hashtag text-2xl text-muted-foreground mb-2"></i>
                  <p className="text-muted-foreground">No social media data available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connect your social media accounts to start collecting data
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
