import { LayoutDashboard } from 'lucide-react';

/**
 * Owner Dashboard — /owner
 * Stage 5: Foundation placeholder.
 * Stage 6 will implement: live stats, table grid, order feed.
 */
export default function OwnerDashboardPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Your restaurant at a glance</p>
      </div>

      {/* Placeholder stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {['Available Tables', 'Active Orders', 'Queue Length', 'Today\'s Revenue'].map((label) => (
          <div key={label} className="card">
            <p className="text-text-secondary text-xs mb-1">{label}</p>
            <div className="skeleton h-8 w-16 mt-2" />
          </div>
        ))}
      </div>

      <div className="card text-center py-10">
        <LayoutDashboard size={36} className="text-brand mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Full dashboard coming in Stage 6
        </h2>
        <p className="text-text-secondary text-sm max-w-sm mx-auto">
          Live table grid, order management, queue control, and real-time Socket.IO updates
          will be implemented in Stage 6.
        </p>
      </div>
    </div>
  );
}
