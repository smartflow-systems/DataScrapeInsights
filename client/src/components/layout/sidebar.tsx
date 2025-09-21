import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/App";

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "fas fa-tachometer-alt",
    href: "/",
  },
  {
    id: "scraper",
    label: "Web Scraper",
    icon: "fas fa-spider",
    href: "/scraper",
  },
  {
    id: "social",
    label: "Social Media",
    icon: "fas fa-hashtag",
    href: "/social",
  },
  {
    id: "nl-sql",
    label: "NL to SQL",
    icon: "fas fa-brain",
    href: "/nl-sql",
  },
  {
    id: "queries",
    label: "Query History",
    icon: "fas fa-history",
    href: "/queries",
  },
  {
    id: "exports",
    label: "Exports",
    icon: "fas fa-download",
    href: "/exports",
  },
];

const bottomItems = [
  {
    id: "settings",
    label: "Settings",
    icon: "fas fa-cog",
    href: "/settings",
  },
  {
    id: "help",
    label: "Help & Docs",
    icon: "fas fa-question-circle",
    href: "/help",
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-chart-line text-primary-foreground text-sm"></i>
          </div>
          <h1 className="text-xl font-bold text-foreground">DataFlow</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Product Data Intelligence</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <Link key={item.id} href={item.href}>
              <a
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "sidebar-active"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                }`}
              >
                <i className={`${item.icon} w-4 h-4`}></i>
                <span>{item.label}</span>
              </a>
            </Link>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-8 pt-4 border-t border-border">
          <div className="space-y-2">
            {bottomItems.map((item) => (
              <Link key={item.id} href={item.href}>
                <a className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors">
                  <i className={`${item.icon} w-4 h-4`}></i>
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-medium">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Jane Doe</p>
            <p className="text-xs text-muted-foreground truncate">Product Manager</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <i className={`fas ${isDark ? "fa-sun" : "fa-moon"} w-4 h-4`}></i>
          </Button>
        </div>
      </div>
    </div>
  );
}
