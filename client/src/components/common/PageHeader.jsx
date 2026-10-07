import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({
  title,
  subtitle,
  backUrl,
  onBack,
  actions,
  badge,
  className = '',
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-6 border-b border-surface-border ${className}`}>
      <div className="flex items-start gap-3">
        {(backUrl || onBack) && (
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-text-secondary hover:text-brand hover:border-brand/40 transition-colors shrink-0 mt-0.5"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-text-secondary">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
