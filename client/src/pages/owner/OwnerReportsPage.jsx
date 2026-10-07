// client/src/pages/owner/OwnerReportsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  CalendarDays,
  Clock,
  Download,
  Calendar,
  DollarSign,
  UtensilsCrossed,
  RefreshCw,
  Award,
} from 'lucide-react';
import { ownerService } from '../../services/ownerService';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import toast from 'react-hot-toast';

export default function OwnerReportsPage() {
  const [timeframe, setTimeframe] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ownerService.getAnalytics(timeframe);
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics', err);
      toast.error('Failed to load analytics metrics');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Restaurant', data.restaurantName || 'My Restaurant'],
      ['Timeframe', timeframe],
      ['Total Orders', data.kpis?.totalOrders || 0],
      ['Total Revenue (INR)', data.kpis?.totalRevenue || 0],
      ['Average Order Value (INR)', data.kpis?.avgOrderValue || 0],
      ['Current Occupancy Rate (%)', data.kpis?.currentOccupancyPct || 0],
      ['Total Reservations', data.reservations?.total || 0],
      ['Confirmed Reservations', data.reservations?.confirmed || 0],
      ['Completed Reservations', data.reservations?.completed || 0],
      ['Cancelled Reservations', data.reservations?.cancelled || 0],
      [],
      ['Top Selling Items', 'Quantity', 'Revenue (INR)'],
      ...(data.topItems?.map((i) => [i.name, i.quantity, i.sales]) || []),
      [],
      ['Peak Hour', 'Orders'],
      ...(data.peakHours?.map((h) => [h.label, h.orders]) || []),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartTable_${data.restaurantName || 'Restaurant'}_Analytics_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Dining operational report exported to CSV!');
  };

  const kpis = data?.kpis || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, currentOccupancyPct: 0, totalReservations: 0 };
  const topItems = data?.topItems || [];
  const peakHours = data?.peakHours || [];
  const tableUtilization = data?.tableUtilization || { available: 0, occupied: 0, reserved: 0, cleaning: 0, total: 0, occupancyPercentage: 0 };
  const resStats = data?.reservations || { total: 0, completed: 0, cancelled: 0, confirmed: 0 };

  const maxPeakOrders = Math.max(...peakHours.map((h) => h.orders), 1);
  const maxItemQty = Math.max(...topItems.map((i) => i.quantity), 1);

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={`Operational Analytics & Insights ${data?.restaurantName ? `• ${data.restaurantName}` : ''}`}
        subtitle="Analyze table turnover rates, peak hours, top selling menu items, and reservation volume."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="input text-xs py-1.5 px-3"
            >
              <option value="24h">Today / 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            <button
              type="button"
              onClick={handleExport}
              disabled={!data || loading}
              className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={fetchAnalytics}
              disabled={loading}
              className="btn-outline text-xs py-2 px-3 inline-flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {loading ? (
        <LoadingState message="Aggregating dining analytics..." />
      ) : (
        <>
          {/* KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="card p-4 border border-surface-border space-y-1 bg-gradient-to-br from-brand/10 to-transparent">
              <span className="text-xs text-text-muted">Total Dine-In Orders</span>
              <p className="text-2xl font-bold font-mono text-brand">{kpis.totalOrders}</p>
              <span className="text-[10px] text-text-secondary block">Completed & active dining bills</span>
            </div>

            <div className="card p-4 border border-surface-border space-y-1 bg-gradient-to-br from-emerald-500/10 to-transparent">
              <span className="text-xs text-text-muted">Total Sales & Revenue</span>
              <p className="text-2xl font-bold font-mono text-emerald-400">₹{kpis.totalRevenue.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-400 font-semibold">Includes items + 5% GST</span>
            </div>

            <div className="card p-4 border border-surface-border space-y-1 bg-gradient-to-br from-blue-500/10 to-transparent">
              <span className="text-xs text-text-muted">Average Order Value (AOV)</span>
              <p className="text-2xl font-bold font-mono text-blue-400">₹{kpis.avgOrderValue}</p>
              <span className="text-[10px] text-text-secondary block">Average spend per table party</span>
            </div>

            <div className="card p-4 border border-surface-border space-y-1 bg-gradient-to-br from-amber-500/10 to-transparent">
              <span className="text-xs text-text-muted">Current Table Occupancy</span>
              <p className="text-2xl font-bold font-mono text-amber-400">{kpis.currentOccupancyPct}%</p>
              <span className="text-[10px] text-amber-400 font-semibold">{tableUtilization.occupied + tableUtilization.reserved} of {tableUtilization.total} tables active</span>
            </div>
          </div>

          {/* Top Selling Items & Peak Hours Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Items */}
            <div className="card p-5 border border-surface-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Award size={16} className="text-amber-400" />
                  <span>Top 5 Best-Selling Dishes</span>
                </h3>
                <span className="text-xs text-text-muted font-mono">{topItems.length} items</span>
              </div>

              {topItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-text-muted">No orders yet</div>
              ) : (
                <div className="space-y-3.5">
                  {topItems.map((item, idx) => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-text-primary flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-surface-elevated text-text-secondary text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span>{item.name}</span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-text-muted font-mono text-[11px]">{item.quantity} ordered</span>
                          <span className="font-mono font-bold text-text-primary">₹{item.sales}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((item.quantity / maxItemQty) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Peak Ordering Hours */}
            <div className="card p-5 border border-surface-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Clock size={16} className="text-blue-400" />
                  <span>Peak Ordering Hours (24H Timeline)</span>
                </h3>
                <span className="text-xs text-text-muted font-mono">Kitchen Activity</span>
              </div>

              {peakHours.length === 0 ? (
                <div className="text-center py-8 text-xs text-text-muted">No recent activity</div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-end gap-1.5 h-36 pt-4 pb-2 border-b border-surface-border">
                    {peakHours.map((h) => {
                      const heightPct = Math.round((h.orders / maxPeakOrders) * 100);
                      return (
                        <div
                          key={h.hour}
                          className="flex-1 flex flex-col items-center justify-end h-full group relative"
                        >
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-1.5 py-0.5 rounded bg-surface-elevated border border-surface-border text-[9px] font-mono whitespace-nowrap z-10">
                            {h.orders} orders at {h.label}
                          </div>
                          <div
                            className="w-full rounded-t bg-brand/80 hover:bg-brand transition-all"
                            style={{ height: `${Math.max(heightPct, 8)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-text-muted font-mono">
                    <span>11:00 AM</span>
                    <span>3:00 PM</span>
                    <span>7:00 PM</span>
                    <span>11:00 PM</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table Floor & Reservation Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table Utilization Breakdown */}
            <div className="card p-5 border border-surface-border space-y-4">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 pb-3 border-b border-surface-border">
                <Users size={16} className="text-purple-400" />
                <span>Live Table Floor Utilization</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Available</span>
                  <p className="text-xl font-bold font-mono text-emerald-400">{tableUtilization.available}</p>
                </div>
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[10px] text-rose-400 font-bold uppercase">Occupied</span>
                  <p className="text-xl font-bold font-mono text-rose-400">{tableUtilization.occupied}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-[10px] text-blue-400 font-bold uppercase">Reserved</span>
                  <p className="text-xl font-bold font-mono text-blue-400">{tableUtilization.reserved}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <span className="text-[10px] text-purple-400 font-bold uppercase">Cleaning</span>
                  <p className="text-xl font-bold font-mono text-purple-400">{tableUtilization.cleaning}</p>
                </div>
              </div>
            </div>

            {/* Reservations Breakdown */}
            <div className="card p-5 border border-surface-border space-y-4">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 pb-3 border-b border-surface-border">
                <CalendarDays size={16} className="text-blue-400" />
                <span>Reservations Fulfillment Metrics</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-lg bg-surface-elevated">
                  <span className="text-[10px] text-text-muted font-bold uppercase">Total Bookings</span>
                  <p className="text-xl font-bold font-mono text-text-primary">{resStats.total}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Completed</span>
                  <p className="text-xl font-bold font-mono text-emerald-400">{resStats.completed}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-[10px] text-blue-400 font-bold uppercase">Confirmed</span>
                  <p className="text-xl font-bold font-mono text-blue-400">{resStats.confirmed}</p>
                </div>
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[10px] text-rose-400 font-bold uppercase">Cancelled</span>
                  <p className="text-xl font-bold font-mono text-rose-400">{resStats.cancelled}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
