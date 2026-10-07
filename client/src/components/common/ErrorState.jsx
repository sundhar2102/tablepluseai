import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this content.',
  onRetry,
  backUrl,
  className = '',
}) {
  const navigate = useNavigate();

  return (
    <div className={`card p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-4 border border-red-500/20 bg-red-500/5 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
        <AlertCircle size={28} />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="font-bold text-base text-text-primary">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          {message}
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Try Again</span>
          </button>
        )}
        {backUrl && (
          <button
            type="button"
            onClick={() => navigate(backUrl)}
            className="btn-outline text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={13} />
            <span>Go Back</span>
          </button>
        )}
      </div>
    </div>
  );
}
