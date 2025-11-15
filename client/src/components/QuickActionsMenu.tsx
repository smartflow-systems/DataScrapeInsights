import { useState } from 'react';
import { Plus, X, Zap, Database, FileText, Download, Hash, Settings } from 'lucide-react';
import { useLocation } from 'wouter';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

export default function QuickActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const actions: QuickAction[] = [
    {
      id: 'new-scraper',
      label: 'New Scraper',
      icon: <Database className="w-5 h-5" />,
      onClick: () => {
        setLocation('/scraper');
        setIsOpen(false);
      },
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'new-query',
      label: 'New Query',
      icon: <FileText className="w-5 h-5" />,
      onClick: () => {
        setLocation('/nl-sql');
        setIsOpen(false);
      },
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'new-export',
      label: 'Export Data',
      icon: <Download className="w-5 h-5" />,
      onClick: () => {
        setLocation('/exports');
        setIsOpen(false);
      },
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'social-media',
      label: 'Social Analytics',
      icon: <Hash className="w-5 h-5" />,
      onClick: () => {
        setLocation('/social');
        setIsOpen(false);
      },
      color: 'from-pink-500 to-pink-600',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      onClick: () => {
        setLocation('/settings');
        setIsOpen(false);
      },
      color: 'from-gray-500 to-gray-600',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[80] animate-in fade-in duration-200"
        />
      )}

      {/* Quick Actions Menu */}
      <div className="fixed bottom-6 right-6 z-[81]">
        {/* Action buttons */}
        <div
          className={`
            flex flex-col-reverse gap-3 mb-3
            transition-all duration-300 origin-bottom-right
            ${
              isOpen
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
            }
          `}
        >
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`
                group flex items-center gap-3 px-4 py-3
                bg-[#0D0D0D]/95 border-2 border-[#FFD700]/30
                rounded-xl shadow-lg
                hover:border-[#FFD700]/60 hover:shadow-xl
                transition-all duration-200
                animate-in slide-in-from-right-5
              `}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} text-white`}>
                {action.icon}
              </div>
              <span className="text-[#F5F5DC] font-medium whitespace-nowrap pr-2">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Main FAB button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-16 h-16 rounded-full
            bg-gradient-to-br from-[#FFD700] to-[#E6C200]
            shadow-2xl shadow-[#FFD700]/30
            flex items-center justify-center
            hover:shadow-[#FFD700]/50 hover:scale-110
            active:scale-95
            transition-all duration-200
            group relative
          `}
        >
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[#FFD700] animate-ping opacity-20" />

          {/* Icon */}
          <div className="relative z-10">
            {isOpen ? (
              <X className="w-7 h-7 text-[#0D0D0D] transition-transform duration-200 rotate-90" />
            ) : (
              <Plus className="w-7 h-7 text-[#0D0D0D] transition-transform duration-200 group-hover:rotate-90" />
            )}
          </div>

          {/* Tooltip */}
          {!isOpen && (
            <div className="absolute bottom-full mb-2 right-0 px-3 py-1.5 bg-[#0D0D0D] border border-[#FFD700]/30 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <span className="text-[#F5F5DC] text-sm font-medium">Quick Actions</span>
              <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#FFD700]/30" />
            </div>
          )}
        </button>
      </div>
    </>
  );
}

// Compact version for mobile
export function QuickActionsMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <div className="md:hidden fixed bottom-20 right-4 z-[81]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFD700] to-[#E6C200] shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-[#0D0D0D]" />
        ) : (
          <Zap className="w-6 h-6 text-[#0D0D0D]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-[#0D0D0D]/98 border-2 border-[#FFD700]/30 rounded-lg shadow-2xl p-2 min-w-[200px] animate-in slide-in-from-bottom-5">
          <button
            onClick={() => {
              setLocation('/scraper');
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-[#F5F5DC] hover:bg-[#FFD700]/10 rounded transition-colors"
          >
            <Database className="w-4 h-4" />
            New Scraper
          </button>
          <button
            onClick={() => {
              setLocation('/nl-sql');
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-[#F5F5DC] hover:bg-[#FFD700]/10 rounded transition-colors"
          >
            <FileText className="w-4 h-4" />
            New Query
          </button>
          <button
            onClick={() => {
              setLocation('/exports');
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-[#F5F5DC] hover:bg-[#FFD700]/10 rounded transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      )}
    </div>
  );
}
