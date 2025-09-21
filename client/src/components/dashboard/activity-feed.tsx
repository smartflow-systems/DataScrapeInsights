import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  const getActivityIcon = (type: string, status: string) => {
    if (status === "error") return "fas fa-exclamation-triangle text-destructive";
    
    switch (type) {
      case "scrape":
        return "fas fa-check text-accent";
      case "query":
        return "fas fa-brain text-primary";
      case "export":
        return "fas fa-download text-chart-4";
      case "social":
        return "fas fa-hashtag text-chart-2";
      default:
        return "fas fa-info-circle text-muted-foreground";
    }
  };

  const getActivityBgColor = (type: string, status: string) => {
    if (status === "error") return "bg-destructive/10";
    
    switch (type) {
      case "scrape":
        return "bg-accent/10";
      case "query":
        return "bg-primary/10";
      case "export":
        return "bg-chart-4/10";
      case "social":
        return "bg-chart-2/10";
      default:
        return "bg-muted";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <p className="text-sm text-muted-foreground">Latest data collection and analysis</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground">Latest data collection and analysis</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(activities as any[])?.length > 0 ? (
            (activities as any[]).map((activity: any) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${getActivityBgColor(activity.type, activity.status)} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <i className={`${getActivityIcon(activity.type, activity.status)} w-4 h-4`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-clock text-2xl text-muted-foreground mb-2"></i>
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          )}
        </div>
        
        {(activities as any[])?.length > 0 && (
          <Button variant="ghost" className="w-full mt-4 text-sm text-primary hover:text-primary/80">
            View all activity
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
