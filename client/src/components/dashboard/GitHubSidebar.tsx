import { useState, useEffect } from 'react';
import { X, Menu, Sun, Moon } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useTheme } from '@/App';

export default function GitHubSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { isDark, toggleTheme } = useTheme();

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const menuItems = [
    { label: 'Dashboard', href: '/', icon: 'fas fa-tachometer-alt' },
    { label: 'Web Scraper', href: '/scraper', icon: 'fas fa-spider' },
    { label: 'Social Media', href: '/social', icon: 'fas fa-hashtag' },
    { label: 'NL to SQL', href: '/nl-sql', icon: 'fas fa-brain' },
    { label: 'Query History', href: '/queries', icon: 'fas fa-history' },
    { label: 'Exports', href: '/exports', icon: 'fas fa-download' },
    { label: 'Settings', href: '/settings', icon: 'fas fa-cog' },
    { label: 'Help & Docs', href: '/help', icon: 'fas fa-question-circle' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location === '/';
    }
    return location.startsWith(href);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-5 left-5 z-50 p-2.5 bg-[#0D0D0D] rounded hover:bg-[#3B2F2F] transition-colors shadow-lg"
        aria-label="Toggle Menu"
      >
        <Menu className="w-6 h-6 text-[#FFD700]" />
      </button>

      {/* Overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/70 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      />

      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 h-screen w-[300px] bg-[#0D0D0D] text-[#F5F5DC] z-50 flex flex-col overflow-y-auto transition-transform duration-300 shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-[#FFD700] hover:text-[#E6C200] transition-colors"
          aria-label="Close Menu"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Header */}
        <div className="pt-16 px-5 pb-5 border-b border-[#3B2F2F]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#FFD700] rounded-lg flex items-center justify-center shadow-lg">
              <i className="fas fa-chart-line text-lg text-[#0D0D0D]"></i>
            </div>
            <div>
              <h2 className="text-[#FFD700] text-xl font-semibold">
                SmartFlow Systems
              </h2>
              <p className="text-[#F5F5DC]/70 text-sm">Analytics Dashboard</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <ul className="flex-grow py-5">
          {menuItems.map((item) => (
            <li key={item.label}>
              <Link href={item.href}>
                <a
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 py-4 px-5 text-[#F5F5DC] hover:bg-[#3B2F2F] hover:pl-7 border-l-[3px] transition-all duration-200 ${
                    isActive(item.href)
                      ? 'border-[#FFD700] bg-[#3B2F2F] pl-7 text-[#FFD700]'
                      : 'border-transparent'
                  }`}
                >
                  <i className={`${item.icon} w-5 h-5`}></i>
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="p-5 border-t border-[#3B2F2F]">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center">
              <span className="text-[#0D0D0D] text-sm font-medium">SF</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#F5F5DC] truncate">SmartFlow</p>
              <p className="text-xs text-[#F5F5DC]/70 truncate">Admin User</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 text-[#FFD700] hover:text-[#E6C200] hover:bg-[#3B2F2F] rounded transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          <Link href="/">
            <a
              onClick={() => setIsOpen(false)}
              className="block w-full py-3 px-4 bg-[#FFD700] text-[#0D0D0D] text-center font-semibold rounded hover:bg-[#E6C200] transition-colors"
            >
              View Dashboard
            </a>
          </Link>
        </div>
      </nav>
    </>
  );
}
