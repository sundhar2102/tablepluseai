import { Loader2 } from 'lucide-react';

export default function LoadingState({
  message = 'Loading...',
  subtext = 'Fetching latest data from server',
  fullPage = false,
  className = '',
}) {
  const content = (
    <div className={`flex flex-col items-center justify-center p-8 space-y-3.5 text-center ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
          <Loader2 size={24} className="animate-spin text-brand" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-sm text-text-primary tracking-wide">
          {message}
        </p>
        {subtext && (
          <p className="text-xs text-text-muted">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
