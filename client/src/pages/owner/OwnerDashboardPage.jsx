// client/src/pages/owner/OwnerDashboardPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid2X2,
  CalendarDays,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Store,
  DollarSign,
  ChefHat,
  BarChart3,
  Power,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { ownerService } from '../../services/ownerService';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const { socket, connected: socketConnected } = useSocket();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ownerService.getDashboardStats();
      setData(res);
    } catch (err) {
      console.error('Failed to load owner dashboard stats', err);
      toast.error(err.response?.data?.error?.message || 'Failed to fetch restaurant dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const restId = data?.restaurant?.id;
    if (restId) {
      socket.emit('join:restaurant', restId);
    }
    socket.emit('join:owner');

    const handleAvailability = (payload) => {
      // Re-fetch or update table state locally
      fetchDashboardStats();
    };

    const handleOrderEvent = () => {
      fetchDashboardStats();
    };

    const handleReservationEvent = () => {
      fetchDashboardStats();
    };

    socket.on('restaurant:availability_updated', handleAvailability);
    socket.on('order:created', handleOrderEvent);
    socket.on('order:status_changed', handleOrderEvent);
    socket.on('reservation:created', handleReservationEvent);
    socket.on('reservation:status_changed', handleReservationEvent);

    return () => {
      socket.off('restaurant:availability_updated', handleAvailability);
      socket.off('order:created', handleOrderEvent);
      socket.off('order:status_changed', handleOrderEvent);
      socket.off('reservation:created', handleReservationEvent);
      socket.off('reservation:status_changed', handleReservationEvent);
    };
  }, [socket, data?.restaurant?.id, fetchDashboardStats]);

  const toggleRestaurantActive = async () => {
    if (!data?.restaurant) return;
    try {
      setTogglingStatus(true);
      const newStatus = !data.restaurant.isActive;
      await ownerService.updateRestaurant({ is_active: newStatus });
      toast.success(newStatus ? 'Restaurant is now OPEN for dining!' : 'Restaurant is now CLOSED for dining');
      fetchDashboardStats();
    } catch (err) {
      toast.error('Failed to update restaurant status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const restaurant = data?.restaurant;
  const tables = data?.tables || { total: 0, available: 0, occupied: 0, reserved: 0, cleaning: 0, occupancyRate: 0, list: [] };
  const crowd = data?.crowd || { level: 'LOW', estimatedWaitMinutes: 0, waitReason: '' };
  const orders = data?.orders || { totalToday: 0, activeToday: 0, pendingToday: 0, completedToday: 0, revenueToday: 0, totalRevenue: 0, recent: [] };
  const reservations = data?.reservations || { totalToday: 0, pendingToday: 0, confirmedToday: 0, upcoming: [] };

  const getCrowdBadgeColor = (level) => {
    switch (level) {
      case 'FULL': return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'HIGH': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'MODERATE': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default: return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Restaurant Header */}
      <div className="card p-5 border border-surface-border bg-gradient-to-r from-surface-card via-surface-card to-brand/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                <Store size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-text-primary">
                    {restaurant?.name || 'My Restaurant'}
                  </h1>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      restaurant?.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {restaurant?.isActive ? 'OPEN FOR DINING' : 'CURRENTLY CLOSED'}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  {restaurant?.cuisineType || 'Dine-In Restaurant'} • {restaurant?.address || 'Chennai'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={toggleRestaurantActive}
              disabled={togglingStatus}
              className={`text-xs py-2 px-3.5 rounded-lg font-medium inline-flex items-center gap-2 border transition-all ${
                restaurant?.isActive
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <Power size={14} className={togglingStatus ? 'animate-spin' : ''} />
              <span>{restaurant?.isActive ? 'Close Restaurant' : 'Open Restaurant'}</span>
            </button>

            <button
              type="button"
              onClick={fetchDashboardStats}
              disabled={loading}
              className="btn-outline text-xs py-2 px-3 inline-flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Available Tables */}
        <div className="card p-4 border border-surface-border space-y-2 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium">Table Availability</span>
            <div className="w-7 h-7 rounded-lg bg-status-available/15 text-status-available flex items-center justify-center font-bold">
              <Grid2X2 size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-status-available font-mono">
              {tables.available}
            </span>
            <span className="text-xs text-text-muted">of {tables.total} tables free</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-text-secondary pt-1 border-t border-surface-border/50">
            <span>Occupied: <strong className="text-rose-400">{tables.occupied}</strong></span>
            <span>Cleaning: <strong className="text-purple-400">{tables.cleaning}</strong></span>
          </div>
        </div>

        {/* Live Crowd & Wait Time */}
        <div className="card p-4 border border-surface-border space-y-2 bg-gradient-to-br from-blue-500/10 to-transparent">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium">Crowd & Rush</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
              <Clock size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`px-2 py-0.5 rounded text-sm font-black border ${getCrowdBadgeColor(crowd.level)}`}>
              {crowd.level}
            </span>
            <span className="text-xs text-text-muted">{tables.occupancyRate}% occupancy</span>
          </div>
          <div className="text-[11px] text-text-secondary pt-1 border-t border-surface-border/50 truncate">
            <span>Est. Wait: <strong>{crowd.estimatedWaitMinutes} mins</strong></span>
          </div>
        </div>

        {/* Today's Orders & Revenue */}
        <div className="card p-4 border border-surface-border space-y-2 bg-gradient-to-br from-amber-500/10 to-transparent">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium">Today's Orders</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
              <ChefHat size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {orders.totalToday}
            </span>
            <span className="text-xs text-text-muted">({orders.activeToday} in kitchen)</span>
          </div>
          <div className="text-[11px] text-text-secondary pt-1 border-t border-surface-border/50 flex justify-between">
            <span>Today's Sales:</span>
            <strong className="text-amber-400 font-mono">₹{orders.revenueToday.toLocaleString()}</strong>
          </div>
        </div>

        {/* Today's Bookings */}
        <div className="card p-4 border border-surface-border space-y-2 bg-gradient-to-br from-purple-500/10 to-transparent">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium">Today's Reservations</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
              <CalendarDays size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400 font-mono">
              {reservations.totalToday}
            </span>
            <span className="text-xs text-text-muted">bookings today</span>
          </div>
          <div className="text-[11px] text-text-secondary pt-1 border-t border-surface-border/50 flex justify-between">
            <span>Confirmed: <strong className="text-emerald-400">{reservations.confirmedToday}</strong></span>
            <span>Pending: <strong className="text-amber-400">{reservations.pendingToday}</strong></span>
          </div>
        </div>
      </div>

      {/* Operational Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Restaurant Control Panel
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/owner/tables"
            className="card p-3.5 border border-surface-border hover:border-brand/40 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
              <Grid2X2 size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-primary group-hover:text-brand transition-colors">
                Live Tables
              </h3>
              <p className="text-[10px] text-text-muted">Turnarounds & Floor</p>
            </div>
          </Link>

          <Link
            to="/owner/orders"
            className="card p-3.5 border border-surface-border hover:border-amber-500/40 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-primary group-hover:text-amber-400 transition-colors">
                Kitchen KDS
              </h3>
              <p className="text-[10px] text-text-muted">Live Cooking Orders</p>
            </div>
          </Link>

          <Link
            to="/owner/reservations"
            className="card p-3.5 border border-surface-border hover:border-blue-500/40 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-primary group-hover:text-blue-400 transition-colors">
                Reservations
              </h3>
              <p className="text-[10px] text-text-muted">Confirm Bookings</p>
            </div>
          </Link>

          <Link
            to="/owner/menu"
            className="card p-3.5 border border-surface-border hover:border-emerald-500/40 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-primary group-hover:text-emerald-400 transition-colors">
                Digital Menu
              </h3>
              <p className="text-[10px] text-text-muted">Prices & Availability</p>
            </div>
          </Link>

          <Link
            to="/owner/customers"
            className="card p-3.5 border border-surface-border hover:border-purple-500/40 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-primary group-hover:text-purple-400 transition-colors">
                Customers
              </h3>
              <p className="text-[10px] text-text-muted">Diner History</p>
            </div>
          </Link>

          <Link
            to="/owner/reports"
            className="card p-3.5 border border-surface-border hover:border-indigo-500/40 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-primary group-hover:text-indigo-400 transition-colors">
                Analytics
              </h3>
              <p className="text-[10px] text-text-muted">Sales & Turnover</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Floor Snapshot & Recent Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Floor Snapshot (Left 2 cols) */}
        <div className="lg:col-span-2 card p-5 border border-surface-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Grid2X2 size={16} className="text-brand" />
                <span>Live Table Floorplan ({tables.list.length} Tables)</span>
              </h3>
              <p className="text-xs text-text-secondary">
                Tap any table on the Live Tables page to change its turnover status
              </p>
            </div>
            <Link
              to="/owner/tables"
              className="text-xs text-brand hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>Manage Floor</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tables.list.map((t) => {
              let color = 'bg-status-available/15 text-status-available border-status-available/30';
              if (t.status === 'occupied') color = 'bg-status-occupied/15 text-status-occupied border-status-occupied/30';
              if (t.status === 'reserved') color = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
              if (t.status === 'cleaning') color = 'bg-purple-500/15 text-purple-400 border-purple-500/30';

              return (
                <div
                  key={t.id}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1 transition-all ${color}`}
                >
                  <span className="font-mono font-black text-sm">{t.tableNumber}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">{t.status}</span>
                  <span className="text-[10px] text-text-muted">{t.capacity} seats</span>
                  {t.activeOrder && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-card/80 text-text-primary mt-1 truncate max-w-full">
                      Diner: {t.activeOrder.customer_name || 'Active'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Kitchen Orders / Activity (Right col) */}
        <div className="card p-5 border border-surface-border space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <ShoppingBag size={16} className="text-amber-400" />
              <span>Recent Dine-In Orders</span>
            </h3>
            <Link
              to="/owner/orders"
              className="text-xs text-brand hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>View KDS</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px]">
            {orders.recent.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-xs">
                No customer orders yet
              </div>
            ) : (
              orders.recent.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 rounded-lg bg-surface-elevated border border-surface-border/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text-primary">
                      Order #{ord.id} • Table {ord.tableNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ord.status === 'received'
                          ? 'bg-blue-500/15 text-blue-400'
                          : ord.status === 'preparing'
                          ? 'bg-amber-500/15 text-amber-400'
                          : ord.status === 'served'
                          ? 'bg-purple-500/15 text-purple-400'
                          : ord.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary truncate">
                    {ord.customerName} • {ord.items?.join(', ') || `${ord.itemCount} items`}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-surface-border/40">
                    <span>{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-mono font-bold text-text-primary">₹{ord.total}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Table Bookings */}
      <div className="card p-5 border border-surface-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <CalendarDays size={16} className="text-purple-400" />
              <span>Today's Table Bookings & Reservations ({reservations.upcoming.length})</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Actual reservations scheduled for dining today
            </p>
          </div>
          <Link
            to="/owner/reservations"
            className="text-xs text-brand hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>Manage All Bookings</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {reservations.upcoming.length === 0 ? (
          <div className="text-center py-10 text-text-muted text-xs space-y-1">
            <CalendarDays size={24} className="mx-auto text-text-disabled" />
            <p className="font-semibold text-text-primary text-sm">No reservations yet</p>
            <p className="text-text-muted text-xs">Customer reservations made through TablePulse AI will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reservations.upcoming.map((res) => (
              <div
                key={res.id}
                className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-primary">{res.customerName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      res.status === 'confirmed'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : res.status === 'pending'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-surface-card text-text-muted'
                    }`}
                  >
                    {res.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>Time: <strong className="text-text-primary font-mono">{res.reservationTime}</strong></span>
                  <span>Party: <strong className="text-text-primary">{res.partySize} guests</strong></span>
                </div>
                <div className="text-[11px] text-text-muted pt-1 border-t border-surface-border/50 flex justify-between">
                  <span>Table: {res.tableNumber}</span>
                  <span>{res.customerPhone || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
