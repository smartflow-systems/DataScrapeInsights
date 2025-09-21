import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import StatsGrid from "@/components/dashboard/stats-grid";
import NLSQLInterface from "@/components/dashboard/nl-sql-interface";
import QuickActions from "@/components/dashboard/quick-actions";
import DataVisualization from "@/components/dashboard/data-visualization";
import ActivityFeed from "@/components/dashboard/activity-feed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="smartflow-header border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">SmartFlow Dashboard</h2>
              <p className="text-muted-foreground">Monitor your data collection and analysis</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search data..."
                  className="pl-10 w-64"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"></i>
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <i className="fas fa-bell w-5 h-5"></i>
                <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {/* Stats Overview */}
          <StatsGrid stats={stats as any} isLoading={statsLoading} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Natural Language to SQL Interface */}
            <div className="lg:col-span-2">
              <NLSQLInterface />
            </div>
            
            {/* Quick Actions Panel */}
            <QuickActions />
          </div>

          {/* Data Visualization and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <DataVisualization />
            <ActivityFeed />
          </div>
        </main>
      </div>
    </div>
  );
}
