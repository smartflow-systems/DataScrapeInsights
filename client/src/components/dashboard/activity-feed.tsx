import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type AlertType = "error" | "warning" | "info" | "success";

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export default function ActivityFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);

  // Simulate automated alerts based on activity patterns
  useEffect(() => {
    const generateAlerts = () => {
      const newAlerts: Alert[] = [];

      // Check for error patterns
      const errorActivities = (activities as any[])?.filter(a => a.status === "error") || [];
      if (errorActivities.length > 3) {
        newAlerts.push({
          id: "alert-errors",
          type: "error",
          title: "High Error Rate Detected",
          message: `${errorActivities.length} failed operations in recent activity`,
          timestamp: new Date(),
          read: false,
        });
      }

      // Success notification for completed scrapes
      const recentScrapes = (activities as any[])?.filter(
        a => a.type === "scrape" && a.status === "success"
      ) || [];
      if (recentScrapes.length > 0) {
        newAlerts.push({
          id: "alert-scrapes",
          type: "success",
          title: "Data Collection Complete",
          message: `${recentScrapes.length} web scraping operations completed successfully`,
          timestamp: new Date(),
          read: false,
        });
      }

      // Warning for inactivity
      const lastActivity = (activities as any[])?.[0];
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - new Date(lastActivity.createdAt).getTime();
        if (timeSinceLastActivity > 3600000) { // 1 hour
          newAlerts.push({
            id: "alert-inactive",
            type: "warning",
            title: "Low Activity Detected",
            message: "No data collection in the last hour",
            timestamp: new Date(),
            read: false,
          });
        }
      }

      setAlerts(newAlerts);
    };

    if (activities) {
      generateAlerts();
    }
  }, [activities]);

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case "error":
        return "fas fa-exclamation-circle";
      case "warning":
        return "fas fa-exclamation-triangle";
      case "success":
        return "fas fa-check-circle";
      case "info":
        return "fas fa-info-circle";
    }
  };

  const getAlertColor = (type: AlertType) => {
    switch (type) {
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "success":
        return "text-green-500";
      case "info":
        return "text-blue-500";
    }
  };

  const getActivityIcon = (type: string, status: string) => {
    if (status === "error") return "fas fa-exclamation-triangle text-destructive";

    switch (type) {
      case "scrape":
        return "fas fa-check text-sfs-gold-200";
      case "query":
        return "fas fa-brain text-sfs-gold-300";
      case "export":
        return "fas fa-download text-sfs-gold-400";
      case "social":
        return "fas fa-hashtag text-sfs-gold-100";
      default:
        return "fas fa-info-circle text-muted-foreground";
    }
  };

  const getActivityBgColor = (type: string, status: string) => {
    if (status === "error") return "bg-destructive/10";

    switch (type) {
      case "scrape":
        return "bg-sfs-gold-200/10";
      case "query":
        return "bg-sfs-gold-300/10";
      case "export":
        return "bg-sfs-gold-400/10";
      case "social":
        return "bg-sfs-gold-100/10";
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
    <Card className="smartflow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-bell text-sfs-gold-200"></i>
              Activity & Alerts
            </CardTitle>
            <p className="text-sm text-muted-foreground">Automated monitoring and notifications</p>
          </div>
          {alerts.length > 0 && (
            <Badge variant="destructive" className="bg-sfs-gradient animate-gold-pulse">
              {alerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Automated Alerts Section */}
        {alerts.length > 0 && showAlerts && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-sfs-gold-200 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i>
                Automated Alerts
              </h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAlerts(false)}
                className="text-xs"
              >
                Dismiss All
              </Button>
            </div>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-sfs-gold-200/20 bg-sfs-black/50 backdrop-blur-sm"
              >
                <div className={`mt-1 ${getAlertColor(alert.type)}`}>
                  <i className={`${getAlertIcon(alert.type)} text-lg`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))}
                  className="text-xs"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Activity Feed Section */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <i className="fas fa-history text-sfs-gold-200"></i>
            Recent Activity
          </h4>
          <div className="space-y-3">
            {(activities as any[])?.length > 0 ? (
              (activities as any[]).slice(0, 5).map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-sfs-black/30 transition-colors">
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
        </div>

        {(activities as any[])?.length > 0 && (
          <Button variant="ghost" className="w-full mt-4 text-sm text-sfs-gold-200 hover:text-sfs-gold-300 border border-sfs-gold-200/20">
            <i className="fas fa-list mr-2"></i>
            View all activity
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
