import Sidebar from "@/components/layout/sidebar";
import NLSQLInterface from "@/components/dashboard/nl-sql-interface";

export default function NLToSQL() {
  return (
    <div className="flex h-screen circuit-pattern">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="smartflow-header px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <i className="fas fa-brain text-sf-gold mr-3"></i>
              Natural Language to SQL
            </h2>
            <p className="text-muted-foreground">Convert your questions into powerful database queries</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <NLSQLInterface />
            
            {/* Help Section */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <i className="fas fa-lightbulb text-chart-4 mr-2"></i>
                  Example Queries
                </h3>
                <div className="space-y-2">
                  <div className="text-sm bg-muted rounded p-2">
                    "Show me the top 10 websites by page views this month"
                  </div>
                  <div className="text-sm bg-muted rounded p-2">
                    "What are the most common keywords in social media posts?"
                  </div>
                  <div className="text-sm bg-muted rounded p-2">
                    "Find scraped data with bounce rate higher than 60%"
                  </div>
                  <div className="text-sm bg-muted rounded p-2">
                    "Show sentiment analysis for posts containing 'product launch'"
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <i className="fas fa-database text-primary mr-2"></i>
                  Available Data
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• <strong>Scraped Data:</strong> URLs, domains, content, timestamps</div>
                  <div>• <strong>Social Media:</strong> Posts, sentiment, keywords, metrics</div>
                  <div>• <strong>Scrapers:</strong> Configuration, status, frequency</div>
                  <div>• <strong>Queries:</strong> History, saved queries, results</div>
                  <div>• <strong>Exports:</strong> Generated files, formats, status</div>
                  <div>• <strong>Activities:</strong> System events, logs, errors</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
