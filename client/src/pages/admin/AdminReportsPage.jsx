import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Store,
  Users,
  CalendarDays,
  Download,
  MapPin,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

export default function AdminReportsPage() {
  const [metricTimeframe, setMetricTimeframe] = useState('30d');

  const handleExport = () => {
    toast.success('Platform analytics report exported to CSV!');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Platform Analytics & Reports"
        subtitle="Network-wide dining reservation volumes, user acquisition, and geographic hub distribution."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={metricTimeframe}
              onChange={(e) => setMetricTimeframe(e.target.value)}
              className="input text-xs py-1.5 px-3"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Quarterly</option>
            </select>
            <button
              type="button"
              onClick={handleExport}
              className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Export Report</span>
            </button>
          </div>
        }
      />

      {/* Primary platform metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="card p-4 border border-surface-border space-y-1">
          <span className="text-xs text-text-muted">Total Reservations Booked</span>
          <p className="text-2xl font-bold font-mono text-accent">3,482</p>
          <span className="text-[10px] text-emerald-400 font-semibold">+24.5% month-on-month</span>
        </div>

        <div className="card p-4 border border-surface-border space-y-1">
          <span className="text-xs text-text-muted">Virtual Queue Diners</span>
          <p className="text-2xl font-bold font-mono text-amber-400">1,940</p>
          <span className="text-[10px] text-text-muted">Average queue time: 14 mins</span>
        </div>

        <div className="card p-4 border border-surface-border space-y-1">
          <span className="text-xs text-text-muted">Customer Repeat Rate</span>
          <p className="text-2xl font-bold font-mono text-emerald-400">62.8%</p>
          <span className="text-[10px] text-text-muted">High retention index</span>
        </div>

        <div className="card p-4 border border-surface-border space-y-1">
          <span className="text-xs text-text-muted">Active Dining Hubs</span>
          <p className="text-2xl font-bold font-mono text-blue-400">7 Cities</p>
          <span className="text-[10px] text-text-muted">Overpass dynamic discovery</span>
        </div>
      </div>

      {/* City Volume Breakdown */}
      <div className="card p-5 border border-surface-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <MapPin size={16} className="text-accent" />
              <span>Geographic Dining Traffic by City</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Distribution of restaurant discovery queries and reservations across major dining hubs
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {[
            { city: 'Chennai (T. Nagar, Adyar, Anna Nagar)', pct: 42, volume: '1,462 bookings' },
            { city: 'Bengaluru (Indiranagar, Koramangala)', pct: 28, volume: '975 bookings' },
            { city: 'Hyderabad (Banjara Hills, Hitec City)', pct: 15, volume: '522 bookings' },
            { city: 'Mumbai (Bandra West, Colaba)', pct: 9, volume: '313 bookings' },
            { city: 'Delhi NCR (Connaught Place, Hauz Khas)', pct: 6, volume: '210 bookings' },
          ].map((c) => (
            <div key={c.city} className="space-y-1 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span className="font-medium text-text-primary">{c.city}</span>
                <span className="font-mono text-text-muted">{c.volume} ({c.pct}%)</span>
              </div>
              <div className="w-full bg-surface-elevated h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400 transition-all duration-500"
                  style={{ width: `${c.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
