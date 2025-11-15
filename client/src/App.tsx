import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { createContext, useContext, useEffect } from "react";
import { initCircuitBackground } from "@/lib/circuit-background";

import Dashboard from "@/pages/dashboard";
import WebScraper from "@/pages/web-scraper";
import SocialMedia from "@/pages/social-media";
import NLToSQL from "@/pages/nl-to-sql";
import QueryHistory from "@/pages/query-history";
import Exports from "@/pages/exports";
import Settings from "@/pages/settings";
import Help from "@/pages/help";
import NotFound from "@/pages/not-found";
import CommandPalette from "@/components/CommandPalette";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import { ToastContainer } from "@/components/RichToast";
import OnboardingTour from "@/components/OnboardingTour";
import QuickActionsMenu from "@/components/QuickActionsMenu";

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
  useEffect(() => {
    // Initialize circuit background animation with cleanup
    const cleanup = initCircuitBackground();
    return cleanup; // Cleanup when component unmounts
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <canvas id="circuit-canvas"></canvas>
        <CommandPalette />
        <KeyboardShortcuts />
        <OnboardingTour />
        <QuickActionsMenu />
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/scraper" component={WebScraper} />
          <Route path="/social" component={SocialMedia} />
          <Route path="/nl-sql" component={NLToSQL} />
          <Route path="/queries" component={QueryHistory} />
          <Route path="/exports" component={Exports} />
          <Route path="/settings" component={Settings} />
          <Route path="/help" component={Help} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
        <ToastContainer />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
