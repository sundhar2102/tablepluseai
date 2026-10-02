import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center px-4 text-center">
      <MapPinOff size={56} className="text-text-disabled mb-4" />
      <h1 className="text-5xl font-bold text-brand mb-3">404</h1>
      <h2 className="text-xl font-semibold text-text-primary mb-2">Page not found</h2>
      <p className="text-text-secondary mb-8 max-w-sm">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link to="/" className="btn-primary btn-lg">← Back to Home</Link>
    </div>
  );
}
