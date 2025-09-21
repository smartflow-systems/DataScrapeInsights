import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsGridProps {
  stats?: {
    scrapedUrls: number;
    sqlQueries: number;
    exports: number;
    activeProjects: number;
    scrapedUrlsChange?: number;
    sqlQueriesChange?: number;
    exportsChange?: number;
  };
  isLoading: boolean;
}

export default function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: "Total Scraped URLs",
      value: stats?.scrapedUrls || 0,
      change: stats?.scrapedUrlsChange || 0,
      icon: "fas fa-globe",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "SQL Queries",
      value: stats?.sqlQueries || 0,
      change: stats?.sqlQueriesChange || 0,
      icon: "fas fa-database",
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
    },
    {
      title: "Data Exports",
      value: stats?.exports || 0,
      change: stats?.exportsChange || 0,
      icon: "fas fa-file-export",
      iconBg: "bg-chart-4/10",
      iconColor: "text-chart-4",
    },
    {
      title: "Active Projects",
      value: stats?.activeProjects || 0,
      change: null,
      icon: "fas fa-project-diagram",
      iconBg: "bg-chart-5/10",
      iconColor: "text-chart-5",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                {stat.change !== null && (
                  <p className={`text-xs flex items-center mt-1 ${
                    stat.change > 0 ? "text-accent" : stat.change < 0 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {stat.change !== 0 && (
                      <i className={`fas ${stat.change > 0 ? "fa-arrow-up" : "fa-arrow-down"} w-3 h-3 mr-1`}></i>
                    )}
                    {stat.change > 0 ? "+" : ""}{stat.change}% from last week
                  </p>
                )}
                {stat.change === null && (
                  <p className="text-xs text-muted-foreground mt-1">2 completed this week</p>
                )}
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <i className={`${stat.icon} ${stat.iconColor}`}></i>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
