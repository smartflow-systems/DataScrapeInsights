import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DataVisualization() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Overview</CardTitle>
          <div className="flex space-x-2">
            <Button size="sm" className="px-3 py-1 text-xs">7D</Button>
            <Button size="sm" variant="outline" className="px-3 py-1 text-xs">30D</Button>
            <Button size="sm" variant="outline" className="px-3 py-1 text-xs">90D</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Placeholder */}
        <div className="h-64 bg-muted rounded-md flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-chart-line text-4xl text-muted-foreground mb-2"></i>
            <p className="text-muted-foreground">Chart will render here</p>
            <p className="text-xs text-muted-foreground mt-1">Scraped data volume over time</p>
          </div>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-chart-1 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Web Scrapes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Social Data</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-chart-3 rounded-full"></div>
            <span className="text-xs text-muted-foreground">API Calls</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
