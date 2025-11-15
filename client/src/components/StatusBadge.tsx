import { LucideIcon, CheckCircle, XCircle, Clock, AlertCircle, Loader2, Zap, Pause, Play } from 'lucide-react';

export type BadgeVariant =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'pending'
  | 'active'
  | 'inactive'
  | 'processing'
  | 'completed';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  icon?: LucideIcon;
}

const variantStyles = {
  success: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-400',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    icon: XCircle,
  },
  warning: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    icon: AlertCircle,
  },
  info: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    icon: AlertCircle,
  },
  pending: {
    bg: 'bg-gray-500/20',
    border: 'border-gray-500/50',
    text: 'text-gray-400',
    icon: Clock,
  },
  active: {
    bg: 'bg-[#FFD700]/20',
    border: 'border-[#FFD700]/50',
    text: 'text-[#FFD700]',
    icon: Zap,
  },
  inactive: {
    bg: 'bg-[#3B2F2F]',
    border: 'border-[#3B2F2F]',
    text: 'text-[#F5F5DC]/50',
    icon: Pause,
  },
  processing: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    icon: Loader2,
  },
  completed: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-400',
    icon: CheckCircle,
  },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export default function StatusBadge({
  variant,
  label,
  size = 'sm',
  pulse = false,
  icon: CustomIcon,
}: StatusBadgeProps) {
  const styles = variantStyles[variant];
  const Icon = CustomIcon || styles.icon;

  const displayLabel = label || variant.charAt(0).toUpperCase() + variant.slice(1);

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-semibold
        ${styles.bg} ${styles.border} ${styles.text} ${sizeStyles[size]}
        ${pulse ? 'animate-pulse' : ''}
        relative
      `}
    >
      {pulse && (
        <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: styles.text.replace('text-', 'bg-') }} />
      )}

      <Icon
        className={`
          ${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'}
          ${variant === 'processing' ? 'animate-spin' : ''}
        `}
      />
      <span className="relative z-10">{displayLabel}</span>
    </span>
  );
}

// Preset badges for common statuses
export function ActiveBadge({ size }: { size?: 'sm' | 'md' | 'lg' }) {
  return <StatusBadge variant="active" label="Active" size={size} pulse />;
}

export function InactiveBadge({ size }: { size?: 'sm' | 'md' | 'lg' }) {
  return <StatusBadge variant="inactive" label="Inactive" size={size} />;
}

export function ProcessingBadge({ size }: { size?: 'sm' | 'md' | 'lg' }) {
  return <StatusBadge variant="processing" label="Processing" size={size} />;
}

export function CompletedBadge({ size }: { size?: 'sm' | 'md' | 'lg' }) {
  return <StatusBadge variant="completed" label="Completed" size={size} />;
}

export function PendingBadge({ size }: { size?: 'sm' | 'md' | 'lg' }) {
  return <StatusBadge variant="pending" label="Pending" size={size} />;
}

export function SuccessBadge({ size, label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  return <StatusBadge variant="success" label={label || 'Success'} size={size} />;
}

export function ErrorBadge({ size, label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  return <StatusBadge variant="error" label={label || 'Error'} size={size} />;
}

// Count badge (like notification badges)
export function CountBadge({ count, max = 99 }: { count: number; max?: number }) {
  const displayCount = count > max ? `${max}+` : count;

  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-[#FFD700] text-[#0D0D0D] text-xs font-bold rounded-full">
      {displayCount}
    </span>
  );
}

// Priority badges
export function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' | 'critical' }) {
  const styles = {
    low: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
    medium: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
    high: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
    critical: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
  };

  const style = styles[priority];

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold
        ${style.bg} ${style.border} ${style.text}
      `}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-current" />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

// Category/Tag badge
export function CategoryBadge({ label, color }: { label: string; color?: string }) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium
        ${color || 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]'}
      `}
    >
      #{label}
    </span>
  );
}

// New badge (for new features)
export function NewBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FFD700] to-[#E6C200] text-[#0D0D0D] text-xs font-bold uppercase tracking-wide">
      New
    </span>
  );
}

// Beta badge
export function BetaBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-400 text-xs font-bold uppercase">
      Beta
    </span>
  );
}

// Pro badge (for premium features)
export function ProBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FFD700] to-[#E6C200] text-[#0D0D0D] text-xs font-bold uppercase">
      <Zap className="w-3 h-3 mr-0.5" />
      Pro
    </span>
  );
}
