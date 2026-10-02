import { Users, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { TABLE_STATUS } from '../../constants/tableStatus';

export default function TableGrid({ tables = [], updatedTableId = null }) {
  if (!tables || tables.length === 0) {
    return (
      <div className="card text-center py-8 text-text-muted">
        <p className="text-sm">No table layout data available for this restaurant.</p>
      </div>
    );
  }

  // Summary counts
  const available = tables.filter((t) => t.status === 'available').length;
  const occupied  = tables.filter((t) => t.status === 'occupied').length;
  const reserved  = tables.filter((t) => t.status === 'reserved').length;
  const cleaning  = tables.filter((t) => t.status === 'cleaning').length;

  return (
    <div className="space-y-4">
      {/* Legend & Quick Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-elevated/60 rounded-xl border border-surface-border text-xs">
        <span className="font-semibold text-text-secondary">Live Table State:</span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-available animate-pulse" />
            <span className="text-text-primary">Available ({available})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-occupied" />
            <span className="text-text-primary">Occupied ({occupied})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-reserved" />
            <span className="text-text-primary">Reserved ({reserved})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-cleaning" />
            <span className="text-text-primary">Cleaning ({cleaning})</span>
          </div>
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {tables.map((table) => {
          const statusKey = table.status?.toLowerCase() || 'available';
          const cfg = TABLE_STATUS[statusKey] || TABLE_STATUS.available;
          const isJustUpdated = updatedTableId === table.id;

          return (
            <div
              key={table.id}
              className={`relative rounded-xl p-3 border transition-all duration-300 flex flex-col justify-between ${
                isJustUpdated
                  ? 'ring-2 ring-brand scale-105 shadow-glow'
                  : 'border-surface-border bg-surface-card hover:border-surface-border/80'
              }`}
            >
              {/* Header: Table Number & Status Indicator */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="font-bold text-sm text-text-primary">
                  {table.tableNumber}
                </span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.dotColor }}
                  title={cfg.label}
                />
              </div>

              {/* Capacity */}
              <div className="flex items-center gap-1.5 text-xs text-text-muted mb-3">
                <Users size={13} className="text-text-disabled" />
                <span>{table.capacity} Seats</span>
              </div>

              {/* Status Badge */}
              <div
                className={`py-1 px-2 rounded-md text-[11px] font-semibold text-center border ${
                  statusKey === 'available'
                    ? 'bg-status-available/15 text-status-available border-status-available/30'
                    : statusKey === 'occupied'
                    ? 'bg-status-occupied/15 text-status-occupied border-status-occupied/30'
                    : statusKey === 'reserved'
                    ? 'bg-status-reserved/15 text-status-reserved border-status-reserved/30'
                    : 'bg-status-cleaning/15 text-status-cleaning border-status-cleaning/30'
                }`}
              >
                {cfg.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
