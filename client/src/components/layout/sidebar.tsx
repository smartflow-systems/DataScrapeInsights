import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/App";
import HamburgerMenu from "../HamburgerMenu";

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
    <div className="w-64 glass-panel border-r border-border flex flex-col relative overflow-hidden">
      {/* Logo/Brand */}
      <div className="smartflow-gradient p-6 border-b border-sf-gold/30 circuit-accent">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg" style={{background: 'linear-gradient(135deg, hsl(45,88%,62%) 0%, hsl(45,85%,52%) 100%)'}}>
            <i className="fas fa-chart-line text-lg text-black"></i>
          </div>
            <div>
              <h1 className="text-xl font-bold text-sf-gold">SmartFlow</h1>
              <p className="text-xs text-muted-foreground">Systems Dashboard</p>
            </div>
          </div>
          <div className="lg:hidden">
            <HamburgerMenu />
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <Link key={item.id} href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? "sidebar-active"
                  : "text-muted-foreground hover:bg-gradient-to-r hover:from-sf-gold/10 hover:to-sf-gold-light/10 hover:text-sf-gold hover:border-sf-gold/20"
              }`}
            >
              <i className={`${item.icon} w-4 h-4`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-8 pt-4 border-t border-sf-gold/20">
          <div className="space-y-2">
            {bottomItems.map((item) => (
              <Link key={item.id} href={item.href} className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-gradient-to-r hover:from-sf-gold/10 hover:to-sf-gold-light/10 hover:text-sf-gold hover:border-sf-gold/20 transition-all duration-200">
                <i className={`${item.icon} w-4 h-4`}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sf-gold/30 circuit-accent">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, hsl(45,88%,62%) 0%, hsl(45,85%,52%) 100%)'}}>
            <span className="text-black text-sm font-bold">SF</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">SmartFlow</p>
            <p className="text-xs text-muted-foreground truncate">Admin User</p>
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
