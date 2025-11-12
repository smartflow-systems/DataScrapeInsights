import GitHubSidebar from "@/components/dashboard/GitHubSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Help() {
  return (
    <div className="min-h-screen bg-[#F5F5DC] circuit-pattern">
      <GitHubSidebar />

      <div className="flex flex-col">
        {/* Header */}
        <header className="smartflow-header px-6 py-4 mt-16">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <i className="fas fa-question-circle text-sf-gold mr-3"></i>
              Help & Documentation
            </h2>
            <p className="text-muted-foreground">Find answers and learn how to use SmartFlow Systems</p>
          </div>
        </header>

        {/* Content */}
        <main className="overflow-auto p-6 max-w-7xl mx-auto w-full">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Search */}
            <Card className="sfs-glow-hover">
              <CardContent className="pt-6">
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                  <Input
                    type="text"
                    placeholder="Search documentation..."
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="sfs-glow-hover cursor-pointer hover:border-sf-gold">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-play text-primary text-xl"></i>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Getting Started</h3>
                  <p className="text-sm text-muted-foreground">Quick start guide and tutorials</p>
                </CardContent>
              </Card>

              <Card className="sfs-glow-hover cursor-pointer hover:border-sf-gold">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-book text-chart-2 text-xl"></i>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">API Reference</h3>
                  <p className="text-sm text-muted-foreground">Complete API documentation</p>
                </CardContent>
              </Card>

              <Card className="sfs-glow-hover cursor-pointer hover:border-sf-gold">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-video text-chart-4 text-xl"></i>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Video Tutorials</h3>
                  <p className="text-sm text-muted-foreground">Step-by-step video guides</p>
                </CardContent>
              </Card>
            </div>

            {/* FAQ */}
            <Card className="sfs-glow-hover">
              <CardHeader className="circuit-accent">
                <CardTitle>
                  <i className="fas fa-list text-primary mr-2"></i>
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Common questions and answers about SmartFlow Systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>How do I start scraping a website?</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>To start scraping a website:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Navigate to the Web Scraper page from the sidebar</li>
                          <li>Enter the target URL you want to scrape</li>
                          <li>Configure the scrape frequency (hourly, daily, weekly)</li>
                          <li>Set the maximum number of pages to scrape</li>
                          <li>Click "Start Scraper" to begin collecting data</li>
                        </ol>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>What is Natural Language to SQL?</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          Natural Language to SQL is an AI-powered feature that converts your questions in plain English
                          into SQL database queries. Instead of writing complex SQL, you can simply ask questions like:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>"Show me the top 10 most visited websites"</li>
                          <li>"What are the most popular keywords this month?"</li>
                          <li>"Find all social media posts with positive sentiment"</li>
                        </ul>
                        <p className="mt-2">
                          The system will automatically generate the SQL query, explain it, and allow you to execute it
                          with one click.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>How do I export my data?</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>To export your collected data:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Go to the Exports page from the sidebar</li>
                          <li>Choose your export format (CSV, JSON, or Excel)</li>
                          <li>Optionally select a saved query to filter the data</li>
                          <li>Click "Create Export" to generate the file</li>
                          <li>Once complete, download the file from the Export History section</li>
                        </ol>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger>How often does the scraper run?</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-muted-foreground">
                        <p>
                          Scraper frequency is configurable per scraper. You can set it to run hourly, daily, weekly,
                          or monthly depending on your needs. The frequency can be changed at any time in the scraper
                          configuration. Default frequency can be set in Settings.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                    <AccordionTrigger>What social media platforms are supported?</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>SmartFlow Systems currently supports:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Twitter/X - Track tweets, mentions, and hashtags</li>
                          <li>LinkedIn - Monitor company posts and engagement</li>
                          <li>Facebook - Collect public page data</li>
                          <li>Instagram - Track posts and hashtags (business accounts)</li>
                        </ul>
                        <p className="mt-2">
                          Each platform requires API credentials to be configured in Settings.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-6">
                    <AccordionTrigger>Is my data secure?</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          Yes! SmartFlow Systems takes data security seriously:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>All data is encrypted at rest and in transit</li>
                          <li>API keys are securely stored and never exposed in logs</li>
                          <li>Access is controlled with authentication and authorization</li>
                          <li>Data retention policies can be configured in Settings</li>
                          <li>You can export or delete all your data at any time</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="sfs-glow-hover border-chart-2/20">
              <CardHeader className="circuit-accent">
                <CardTitle>
                  <i className="fas fa-life-ring text-chart-2 mr-2"></i>
                  Need More Help?
                </CardTitle>
                <CardDescription>
                  Can't find what you're looking for? Get in touch with our support team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start h-auto py-4">
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <i className="fas fa-envelope text-chart-2 mr-2"></i>
                        <span className="font-semibold">Email Support</span>
                      </div>
                      <p className="text-xs text-muted-foreground">support@smartflowsystems.com</p>
                    </div>
                  </Button>

                  <Button variant="outline" className="justify-start h-auto py-4">
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <i className="fas fa-comments text-primary mr-2"></i>
                        <span className="font-semibold">Live Chat</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Chat with our team now</p>
                    </div>
                  </Button>

                  <Button variant="outline" className="justify-start h-auto py-4">
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <i className="fab fa-github text-foreground mr-2"></i>
                        <span className="font-semibold">GitHub Issues</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Report bugs and request features</p>
                    </div>
                  </Button>

                  <Button variant="outline" className="justify-start h-auto py-4">
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <i className="fas fa-book-open text-chart-4 mr-2"></i>
                        <span className="font-semibold">Documentation</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Full developer docs</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
