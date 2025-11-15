import { useState } from 'react';
import { Trash2, Play, Pause, Download, Archive, Copy, Check } from 'lucide-react';
import { toast } from './RichToast';

interface BulkActionsProps {
  selectedCount: number;
  onDelete?: () => void;
  onRun?: () => void;
  onPause?: () => void;
  onExport?: () => void;
  onArchive?: () => void;
  onDuplicate?: () => void;
  onDeselectAll: () => void;
}

export default function BulkActions({
  selectedCount,
  onDelete,
  onRun,
  onPause,
  onExport,
  onArchive,
  onDuplicate,
  onDeselectAll,
}: BulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedCount === 0) return null;

  const handleAction = async (
    action: (() => void) | undefined,
    actionName: string,
    confirmMessage?: string
  ) => {
    if (!action) return;

    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setIsProcessing(true);

    try {
      await action();
      toast.success(
        `${actionName} completed`,
        `Successfully processed ${selectedCount} item${selectedCount > 1 ? 's' : ''}`
      );
      onDeselectAll();
    } catch (error) {
      toast.error(
        `${actionName} failed`,
        'Please try again or check the console for details'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#0D0D0D]/98 border-2 border-[#FFD700]/40 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="flex items-center gap-1 p-2">
          {/* Selection info */}
          <div className="px-4 py-2 flex items-center gap-2 border-r border-[#3B2F2F]">
            <div className="w-5 h-5 rounded bg-[#FFD700] flex items-center justify-center">
              <Check className="w-3 h-3 text-[#0D0D0D]" />
            </div>
            <span className="text-[#F5F5DC] font-semibold">
              {selectedCount} selected
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 px-2">
            {onRun && (
              <button
                onClick={() => handleAction(onRun, 'Run')}
                disabled={isProcessing}
                className="px-3 py-2 text-[#F5F5DC] hover:bg-[#FFD700]/20 hover:text-[#FFD700] rounded-lg transition-colors flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Run selected items"
              >
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Run</span>
              </button>
            )}

            {onPause && (
              <button
                onClick={() => handleAction(onPause, 'Pause')}
                disabled={isProcessing}
                className="px-3 py-2 text-[#F5F5DC] hover:bg-[#FFD700]/20 hover:text-[#FFD700] rounded-lg transition-colors flex items-center gap-2 group disabled:opacity-50"
                title="Pause selected items"
              >
                <Pause className="w-4 h-4" />
                <span className="text-sm font-medium">Pause</span>
              </button>
            )}

            {onExport && (
              <button
                onClick={() => handleAction(onExport, 'Export')}
                disabled={isProcessing}
                className="px-3 py-2 text-[#F5F5DC] hover:bg-[#FFD700]/20 hover:text-[#FFD700] rounded-lg transition-colors flex items-center gap-2 group disabled:opacity-50"
                title="Export selected items"
              >
                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                <span className="text-sm font-medium">Export</span>
              </button>
            )}

            {onDuplicate && (
              <button
                onClick={() => handleAction(onDuplicate, 'Duplicate')}
                disabled={isProcessing}
                className="px-3 py-2 text-[#F5F5DC] hover:bg-[#FFD700]/20 hover:text-[#FFD700] rounded-lg transition-colors flex items-center gap-2 group disabled:opacity-50"
                title="Duplicate selected items"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm font-medium">Duplicate</span>
              </button>
            )}

            {onArchive && (
              <button
                onClick={() => handleAction(onArchive, 'Archive')}
                disabled={isProcessing}
                className="px-3 py-2 text-[#F5F5DC] hover:bg-[#FFD700]/20 hover:text-[#FFD700] rounded-lg transition-colors flex items-center gap-2 group disabled:opacity-50"
                title="Archive selected items"
              >
                <Archive className="w-4 h-4" />
                <span className="text-sm font-medium">Archive</span>
              </button>
            )}

            {/* Divider */}
            {onDelete && (
              <div className="w-px h-6 bg-[#3B2F2F] mx-1" />
            )}

            {onDelete && (
              <button
                onClick={() =>
                  handleAction(
                    onDelete,
                    'Delete',
                    `Are you sure you want to delete ${selectedCount} item${selectedCount > 1 ? 's' : ''}?`
                  )
                }
                disabled={isProcessing}
                className="px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-2 group disabled:opacity-50"
                title="Delete selected items"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Delete</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-[#3B2F2F] mx-1" />

          {/* Deselect all */}
          <button
            onClick={onDeselectAll}
            className="px-3 py-2 text-[#F5F5DC]/60 hover:text-[#F5F5DC] hover:bg-[#3B2F2F]/50 rounded-lg transition-colors text-sm font-medium"
          >
            Clear
          </button>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="h-1 bg-[#3B2F2F]">
            <div className="h-full bg-[#FFD700] animate-pulse" style={{ width: '100%' }} />
          </div>
        )}
      </div>
    </div>
  );
}

// Select all checkbox component
export function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          ref={(el) => {
            if (el) el.indeterminate = !!indeterminate;
          }}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={`
            w-5 h-5 rounded border-2 transition-all duration-200
            ${
              checked || indeterminate
                ? 'bg-[#FFD700] border-[#FFD700]'
                : 'bg-transparent border-[#3B2F2F] group-hover:border-[#FFD700]/50'
            }
          `}
        >
          {checked && (
            <Check className="w-full h-full text-[#0D0D0D] p-0.5" />
          )}
          {indeterminate && !checked && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2.5 h-0.5 bg-[#0D0D0D]" />
            </div>
          )}
        </div>
      </div>
      <span className="text-sm text-[#F5F5DC]/70 group-hover:text-[#F5F5DC]">
        Select all
      </span>
    </label>
  );
}

// Individual item checkbox
export function ItemCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={`
            w-5 h-5 rounded border-2 transition-all duration-200
            ${
              checked
                ? 'bg-[#FFD700] border-[#FFD700] scale-110'
                : 'bg-transparent border-[#3B2F2F] group-hover:border-[#FFD700]/50 group-hover:scale-105'
            }
          `}
        >
          {checked && (
            <Check className="w-full h-full text-[#0D0D0D] p-0.5" />
          )}
        </div>
      </div>
      {label && (
        <span className="text-sm text-[#F5F5DC]/70 group-hover:text-[#F5F5DC]">
          {label}
        </span>
      )}
    </label>
  );
}
