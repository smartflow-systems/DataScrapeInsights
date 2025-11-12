import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Database, Search, Hash, Brain, History, Download, Settings, HelpCircle, Home, LayoutDashboard, TrendingUp, FileText, Code, Filter, Share2, Bell, Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/App";
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: any;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "MAIN",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard },
      { id: "scraper", label: "Web Scraper", href: "/scraper", icon: Search },
      { id: "social", label: "Social Media", href: "/social", icon: Hash },
      { id: "nl-sql", label: "NL to SQL", href: "/nl-sql", icon: Brain },
    ]
  },
  {
    title: "DATA & ANALYTICS",
    items: [
      { id: "queries", label: "Query History", href: "/queries", icon: History },
      { id: "exports", label: "Exports", href: "/exports", icon: Download },
      { id: "visualizations", label: "Data Visualization", href: "/visualizations", icon: TrendingUp },
      { id: "reports", label: "Reports", href: "/reports", icon: FileText },
    ]
  },
  {
    title: "TOOLS",
    items: [
      { id: "query-builder", label: "Query Builder", href: "/query-builder", icon: Code },
      { id: "filters", label: "Data Filters", href: "/filters", icon: Filter },
      { id: "api", label: "API Integration", href: "/api", icon: Share2 },
    ]
  },
  {
    title: "SETTINGS & SUPPORT",
    items: [
      { id: "settings", label: "Settings", href: "/settings", icon: Settings },
      { id: "help", label: "Help & Docs", href: "/help", icon: HelpCircle },
      { id: "notifications", label: "Notifications", href: "/notifications", icon: Bell },
    ]
  }
];

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const handleLinkClick = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-sf-gold hover:text-sf-gold-light transition-colors focus:outline-none focus:ring-2 focus:ring-sf-gold rounded-md"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 z-50",
          "bg-gradient-to-b from-blue-950/95 via-slate-900/95 to-black/95 backdrop-blur-xl border-r border-sf-gold/30",
          "transform transition-transform duration-300 ease-in-out shadow-2xl shadow-sf-gold/10",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sf-gold/30 smartflow-gradient">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <Database className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">SmartFlow</h1>
              <p className="text-blue-100 text-xs">Data Insights</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-white/70 hover:text-white transition-colors rounded-md" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="py-4">
            {menuSections.map((section, idx) => (
              <div key={section.title} className={idx > 0 ? "mt-6" : ""}>
                <div className="px-4 mb-2">
                  <h3 className="text-sf-gold/60 text-xs font-bold uppercase tracking-wider">{section.title}</h3>
                </div>
                <div className="space-y-1 px-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link key={item.id} href={item.href} onClick={handleLinkClick}>
                        <a className={cn("flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden",
                          active ? "bg-sf-gold/20 text-sf-gold border-l-2 border-sf-gold" : "text-blue-100/70 hover:bg-sf-gold/10 hover:text-sf-gold")}>
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-sf-gold/10 to-transparent" />
                          <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-sf-gold" : "")} />
                          <span className="font-medium text-sm relative z-10">{item.label}</span>
                        </a>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sf-gold/30 circuit-accent bg-gradient-to-r from-blue-950/90 to-slate-900/90">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 smartflow-gradient rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">SF</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">SmartFlow</p>
                <p className="text-xs text-blue-200/60">Admin User</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="text-blue-200/70 hover:text-white p-2">
              {isDark ? "☀️" : "🌙"}
            </Button>
          </div>
          <div className="text-xs text-blue-300/40 text-center">
            <p>© 2025 SmartFlow Systems</p>
          </div>
        </div>
      </div>
    </>
  );
}
