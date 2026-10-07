import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records to display at this time.',
  action,
  className = '',
}) {
  return (
    <div className={`card p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 border border-surface-border ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-surface-elevated/70 border border-surface-border flex items-center justify-center text-text-muted">
        <Icon size={32} strokeWidth={1.5} className="text-brand/80" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="font-bold text-base text-text-primary">
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="pt-2">
          {action}
        </div>
      )}
    </div>
  );
}
