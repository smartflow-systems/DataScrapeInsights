import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { createContext, useContext, useEffect } from "react";

import Dashboard from "@/pages/dashboard";
import WebScraper from "@/pages/web-scraper";
import SocialMedia from "@/pages/social-media";
import NLToSQL from "@/pages/nl-to-sql";
import QueryHistory from "@/pages/query-history";
import Exports from "@/pages/exports";
import NotFound from "@/pages/not-found";

// Theme context
const ThemeContext = createContext<{
  isDark: boolean;
  toggleTheme: () => void;
}>({
  isDark: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useLocalStorage("dataflow-theme", false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/scraper" component={WebScraper} />
          <Route path="/social" component={SocialMedia} />
          <Route path="/nl-sql" component={NLToSQL} />
          <Route path="/queries" component={QueryHistory} />
          <Route path="/exports" component={Exports} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
