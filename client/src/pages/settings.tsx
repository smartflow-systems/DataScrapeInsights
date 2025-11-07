import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [scrapeFrequency, setScrapeFrequency] = useState("daily");
  const [maxConcurrentScrapers, setMaxConcurrentScrapers] = useState("5");
  const { toast } = useToast();

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been successfully updated.",
    });
  };

  return (
    <div className="flex h-screen circuit-pattern">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="smartflow-header px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <i className="fas fa-cog text-sf-gold mr-3"></i>
              Settings
            </h2>
            <p className="text-muted-foreground">Configure your SmartFlow application preferences</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* API Configuration */}
            <Card className="smartflow-card sfs-glow-hover">
              <CardHeader className="circuit-accent">
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-key text-sfs-gold-200"></i>
                  API Configuration
                </CardTitle>
                <CardDescription>
                  Manage your API keys and external service integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Required for Natural Language to SQL features
                  </p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="proxy-url">Proxy URL (optional)</Label>
                  <Input
                    id="proxy-url"
                    type="url"
                    placeholder="https://proxy.example.com"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use a proxy for web scraping requests
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Scraping Settings */}
            <Card className="smartflow-card sfs-glow-hover">
              <CardHeader className="circuit-accent">
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-spider text-sfs-gold-200"></i>
                  Scraping Settings
                </CardTitle>
                <CardDescription>
                  Configure automated web scraping behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="frequency">Default Scrape Frequency</Label>
                  <Select value={scrapeFrequency} onValueChange={setScrapeFrequency}>
                    <SelectTrigger id="frequency" className="mt-2">
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
                  <Label htmlFor="concurrent">Max Concurrent Scrapers</Label>
                  <Select value={maxConcurrentScrapers} onValueChange={setMaxConcurrentScrapers}>
                    <SelectTrigger id="concurrent" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher values may trigger rate limits
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="respect-robots">Respect robots.txt</Label>
                    <p className="text-xs text-muted-foreground">
                      Follow website crawling rules
                    </p>
                  </div>
                  <Switch id="respect-robots" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-js">Enable JavaScript Rendering</Label>
                    <p className="text-xs text-muted-foreground">
                      Use headless browser for dynamic content
                    </p>
                  </div>
                  <Switch id="enable-js" />
                </div>
              </CardContent>
            </Card>

            {/* Notifications & Automated Alerts */}
            <Card className="smartflow-card sfs-glow-hover border-sfs-gold-200/30">
              <CardHeader className="circuit-accent">
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-bell text-sfs-gold-200"></i>
                  Notifications & Automated Alerts
                </CardTitle>
                <CardDescription>
                  Configure intelligent monitoring and notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-notif">Enable Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive alerts about scraping status
                    </p>
                  </div>
                  <Switch
                    id="enable-notif"
                    checked={enableNotifications}
                    onCheckedChange={setEnableNotifications}
                  />
                </div>

                <Separator />

                <div className="p-4 rounded-lg bg-sfs-gold-200/10 border border-sfs-gold-200/20">
                  <h4 className="text-sm font-semibold text-sfs-gold-200 mb-3 flex items-center gap-2">
                    <i className="fas fa-robot"></i>
                    Automated Alert Triggers
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="error-threshold">High Error Rate Detection</Label>
                        <p className="text-xs text-muted-foreground">
                          Alert when more than 3 operations fail
                        </p>
                      </div>
                      <Switch id="error-threshold" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="inactivity-alert">Inactivity Detection</Label>
                        <p className="text-xs text-muted-foreground">
                          Alert when no data collection for 1+ hour
                        </p>
                      </div>
                      <Switch id="inactivity-alert" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="success-notif">Success Notifications</Label>
                        <p className="text-xs text-muted-foreground">
                          Alert on successful data collection
                        </p>
                      </div>
                      <Switch id="success-notif" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="performance-alert">Performance Degradation</Label>
                        <p className="text-xs text-muted-foreground">
                          Alert when queries take longer than 5 seconds
                        </p>
                      </div>
                      <Switch id="performance-alert" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="threshold-alert">Data Volume Thresholds</Label>
                        <p className="text-xs text-muted-foreground">
                          Alert when daily scrapes exceed 1000
                        </p>
                      </div>
                      <Switch id="threshold-alert" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notif">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Get updates via email
                    </p>
                  </div>
                  <Switch id="email-notif" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="browser-notif">Browser Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Show desktop notifications
                    </p>
                  </div>
                  <Switch id="browser-notif" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="error-notif">Error Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Notify when scrapers fail
                    </p>
                  </div>
                  <Switch id="error-notif" defaultChecked />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="alert-email">Alert Email Address</Label>
                  <Input
                    id="alert-email"
                    type="email"
                    placeholder="alerts@example.com"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Receive automated alerts at this email address
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card className="smartflow-card sfs-glow-hover border-destructive/20">
              <CardHeader className="circuit-accent">
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-shield-alt text-destructive"></i>
                  Data & Privacy
                </CardTitle>
                <CardDescription>
                  Manage your data and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Data Retention</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Scraped data is retained for 90 days by default
                  </p>
                  <Button variant="outline" size="sm">
                    <i className="fas fa-calendar-alt w-4 h-4 mr-2"></i>
                    Configure Retention Policy
                  </Button>
                </div>

                <Separator />

                <div>
                  <Label>Export Your Data</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Download all your data in JSON format
                  </p>
                  <Button variant="outline" size="sm">
                    <i className="fas fa-download w-4 h-4 mr-2"></i>
                    Export All Data
                  </Button>
                </div>

                <Separator />

                <div>
                  <Label className="text-destructive">Danger Zone</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Permanently delete all scraped data and configurations
                  </p>
                  <Button variant="destructive" size="sm">
                    <i className="fas fa-trash-alt w-4 h-4 mr-2"></i>
                    Delete All Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleSaveSettings}
                className="bg-sfs-gradient text-sfs-black font-semibold sfs-glow-hover animate-gold-pulse"
              >
                <i className="fas fa-save w-4 h-4 mr-2"></i>
                Save Settings
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
