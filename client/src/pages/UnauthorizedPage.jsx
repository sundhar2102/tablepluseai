import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center px-4 text-center">
      <ShieldX size={56} className="text-status-occupied mb-4" />
      <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
      <p className="text-text-secondary mb-6 max-w-sm">
        You don't have permission to access this page. Please log in with the correct account.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link to="/login" className="btn-primary">Customer Login</Link>
        <Link to="/owner/login" className="btn-secondary">Owner Login</Link>
      </div>
    </div>
  );
}
