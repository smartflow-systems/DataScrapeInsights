import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type TimeRange = "7D" | "30D" | "90D";

const generateMockData = (days: number) => {
  const data = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      webScrapes: Math.floor(Math.random() * 500) + 100,
      socialData: Math.floor(Math.random() * 300) + 50,
      apiCalls: Math.floor(Math.random() * 200) + 30,
    });
  }

  return data;
};

export default function DataVisualization() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7D");
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("area");

  const days = timeRange === "7D" ? 7 : timeRange === "30D" ? 30 : 90;
  const data = generateMockData(days);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-sfs-black border border-sfs-gold-200/20 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-sfs-gold-200 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs text-foreground flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    };

    const chartColors = {
      webScrapes: "var(--sfs-gold-200)",
      socialData: "var(--sfs-gold-300)",
      apiCalls: "var(--sfs-gold-400)",
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 215, 0, 0.1)" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
            <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="webScrapes" stroke={chartColors.webScrapes} strokeWidth={2} name="Web Scrapes" />
            <Line type="monotone" dataKey="socialData" stroke={chartColors.socialData} strokeWidth={2} name="Social Data" />
            <Line type="monotone" dataKey="apiCalls" stroke={chartColors.apiCalls} strokeWidth={2} name="API Calls" />
          </LineChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorWeb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--sfs-gold-200)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--sfs-gold-200)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSocial" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--sfs-gold-300)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--sfs-gold-300)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAPI" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--sfs-gold-400)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--sfs-gold-400)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 215, 0, 0.1)" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
            <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area type="monotone" dataKey="webScrapes" stroke={chartColors.webScrapes} fillOpacity={1} fill="url(#colorWeb)" name="Web Scrapes" />
            <Area type="monotone" dataKey="socialData" stroke={chartColors.socialData} fillOpacity={1} fill="url(#colorSocial)" name="Social Data" />
            <Area type="monotone" dataKey="apiCalls" stroke={chartColors.apiCalls} fillOpacity={1} fill="url(#colorAPI)" name="API Calls" />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 215, 0, 0.1)" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
            <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="webScrapes" fill={chartColors.webScrapes} name="Web Scrapes" />
            <Bar dataKey="socialData" fill={chartColors.socialData} name="Social Data" />
            <Bar dataKey="apiCalls" fill={chartColors.apiCalls} name="API Calls" />
          </BarChart>
        );
    }
  };

  return (
    <Card className="smartflow-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-chart-line text-sfs-gold-200"></i>
            Data Overview
          </CardTitle>
          <div className="flex items-center gap-4">
            {/* Chart Type Selector */}
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={chartType === "area" ? "default" : "outline"}
                className="px-3 py-1 text-xs"
                onClick={() => setChartType("area")}
              >
                <i className="fas fa-chart-area mr-1"></i> Area
              </Button>
              <Button
                size="sm"
                variant={chartType === "line" ? "default" : "outline"}
                className="px-3 py-1 text-xs"
                onClick={() => setChartType("line")}
              >
                <i className="fas fa-chart-line mr-1"></i> Line
              </Button>
              <Button
                size="sm"
                variant={chartType === "bar" ? "default" : "outline"}
                className="px-3 py-1 text-xs"
                onClick={() => setChartType("bar")}
              >
                <i className="fas fa-chart-bar mr-1"></i> Bar
              </Button>
            </div>
            {/* Time Range Selector */}
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={timeRange === "7D" ? "default" : "outline"}
                className="px-3 py-1 text-xs"
                onClick={() => setTimeRange("7D")}
              >
                7D
              </Button>
              <Button
                size="sm"
                variant={timeRange === "30D" ? "default" : "outline"}
                className="px-3 py-1 text-xs"
                onClick={() => setTimeRange("30D")}
              >
                30D
              </Button>
              <Button
                size="sm"
                variant={timeRange === "90D" ? "default" : "outline"}
                className="px-3 py-1 text-xs"
                onClick={() => setTimeRange("90D")}
              >
                90D
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Enhanced Interactive Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Enhanced Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-sfs-gold-200/20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-sfs-gold-200 rounded-full animate-gold-pulse"></div>
              <span className="text-xs text-muted-foreground">Web Scrapes</span>
            </div>
            <p className="text-2xl font-bold text-sfs-gold-200">
              {data.reduce((sum, d) => sum + d.webScrapes, 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-sfs-gold-300 rounded-full animate-gold-pulse"></div>
              <span className="text-xs text-muted-foreground">Social Data</span>
            </div>
            <p className="text-2xl font-bold text-sfs-gold-300">
              {data.reduce((sum, d) => sum + d.socialData, 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-sfs-gold-400 rounded-full animate-gold-pulse"></div>
              <span className="text-xs text-muted-foreground">API Calls</span>
            </div>
            <p className="text-2xl font-bold text-sfs-gold-400">
              {data.reduce((sum, d) => sum + d.apiCalls, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
