import { LayoutDashboard } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title">Admin Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Platform overview</p>
      </div>
      <div className="card text-center py-12">
        <LayoutDashboard size={36} className="text-accent mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">Admin Panel — Stage 6</h2>
        <p className="text-text-secondary text-sm max-w-sm mx-auto">
          Restaurant approvals, user management, and platform analytics will be implemented in Stage 6.
        </p>
      </div>
    </div>
  );
}
