// client/src/pages/owner/OwnerTablesPage.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  Grid2X2,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Edit2,
  Filter,
  ShoppingBag,
  CalendarDays,
  Radio,
  Check,
} from 'lucide-react';
import { ownerService } from '../../services/ownerService';
import { useSocket } from '../../context/SocketContext';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import LoadingState from '../../components/common/LoadingState';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { value: 'occupied',  label: 'Occupied',  color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  { value: 'reserved',  label: 'Reserved',  color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { value: 'cleaning',  label: 'Cleaning',  color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
];

export default function OwnerTablesPage() {
  const { socket, connected: socketConnected } = useSocket();

  const [tables, setTables] = useState([]);
  const [summary, setSummary] = useState({ total: 0, available: 0, occupied: 0, reserved: 0, cleaning: 0, crowdLevel: 'LOW' });
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedTable, setSelectedTable] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ownerService.getTables();
      setTables(res.tables || []);
      setSummary(res.summary || {});
      setRestaurantName(res.restaurantName || '');
      setRestaurantId(res.restaurantId || null);
    } catch (err) {
      console.error('Failed to load owner tables', err);
      toast.error(err.response?.data?.error?.message || 'Failed to load restaurant tables');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Real-time Socket.IO listener for live floor updates
  useEffect(() => {
    if (!socket) return;

    if (restaurantId) {
      socket.emit('join:restaurant', restaurantId);
    }
    socket.emit('join:owner');

    const handleAvailability = (payload) => {
      if (payload?.table) {
        setTables((prev) =>
          prev.map((t) => (t.id === payload.table.id ? { ...t, status: payload.table.status } : t))
        );
      } else {
        fetchTables();
      }
    };

    socket.on('restaurant:availability_updated', handleAvailability);
    return () => {
      socket.off('restaurant:availability_updated', handleAvailability);
    };
  }, [socket, restaurantId, fetchTables]);

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      setUpdating(true);
      await ownerService.updateTableStatus(tableId, newStatus);
      toast.success(`Table marked as ${newStatus.toUpperCase()}`);
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t))
      );
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
      }
      // Re-fetch summary to get updated crowd level
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update table status');
    } finally {
      setUpdating(false);
    }
  };

  const filteredTables = tables.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={`Live Table Management ${restaurantName ? `• ${restaurantName}` : ''}`}
        subtitle="Control live seating turnarounds, mark tables cleaning or occupied, and synchronize with customer wait times."
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-elevated text-brand border border-brand/20">
              <Radio size={12} className={socketConnected ? 'text-brand animate-pulse' : 'text-text-disabled'} />
              <span>{socketConnected ? 'Live Floor Synced' : 'Connecting'}</span>
            </span>
            <button
              type="button"
              onClick={fetchTables}
              disabled={loading}
              className="btn-outline text-xs py-2 px-3 inline-flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card p-3 border border-surface-border text-center space-y-1">
          <span className="text-[11px] text-text-muted">Total Tables</span>
          <p className="text-xl font-bold font-mono text-text-primary">{summary.total}</p>
        </div>
        <div className="card p-3 border border-surface-border text-center space-y-1 bg-emerald-500/5">
          <span className="text-[11px] text-emerald-400 font-medium">Available</span>
          <p className="text-xl font-bold font-mono text-emerald-400">{summary.available}</p>
        </div>
        <div className="card p-3 border border-surface-border text-center space-y-1 bg-rose-500/5">
          <span className="text-[11px] text-rose-400 font-medium">Occupied</span>
          <p className="text-xl font-bold font-mono text-rose-400">{summary.occupied}</p>
        </div>
        <div className="card p-3 border border-surface-border text-center space-y-1 bg-blue-500/5">
          <span className="text-[11px] text-blue-400 font-medium">Reserved</span>
          <p className="text-xl font-bold font-mono text-blue-400">{summary.reserved}</p>
        </div>
        <div className="card p-3 border border-surface-border text-center space-y-1 bg-purple-500/5">
          <span className="text-[11px] text-purple-400 font-medium">Cleaning</span>
          <p className="text-xl font-bold font-mono text-purple-400">{summary.cleaning}</p>
        </div>
        <div className="card p-3 border border-surface-border text-center space-y-1">
          <span className="text-[11px] text-text-muted">Crowd Rush</span>
          <p className="text-base font-bold font-mono text-brand uppercase">{summary.crowdLevel || 'LOW'}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'available', 'occupied', 'reserved', 'cleaning'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              filter === st
                ? 'bg-brand text-surface-bg font-bold'
                : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      {loading ? (
        <LoadingState message="Loading restaurant floor tables..." />
      ) : filteredTables.length === 0 ? (
        <div className="card p-12 text-center text-text-muted text-sm border border-surface-border">
          No tables found for filter "{filter}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const statusConfig = STATUS_OPTIONS.find((s) => s.value === table.status) || STATUS_OPTIONS[0];

            return (
              <div
                key={table.id}
                className="card p-4 border border-surface-border space-y-3 hover:border-brand/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-text-primary font-mono flex items-center gap-2">
                        <span>Table {table.tableNumber}</span>
                        <span className="text-[11px] font-normal text-text-muted font-sans">
                          ({table.capacity} seats)
                        </span>
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${statusConfig.color}`}>
                      {table.status}
                    </span>
                  </div>

                  {/* Active Diner Context */}
                  {table.activeOrder && (
                    <div className="mt-2.5 p-2 rounded-lg bg-surface-elevated/70 border border-surface-border text-xs space-y-1">
                      <div className="flex items-center justify-between text-text-muted text-[11px]">
                        <span className="flex items-center gap-1 font-medium text-text-primary">
                          <ShoppingBag size={12} className="text-amber-400" />
                          <span>Order #{table.activeOrder.id}</span>
                        </span>
                        <span className="font-semibold uppercase text-amber-400">{table.activeOrder.status}</span>
                      </div>
                      <p className="text-text-secondary text-[11px] truncate">
                        Customer: <strong className="text-text-primary">{table.activeOrder.customer_name}</strong>
                      </p>
                      {table.activeOrder.items && (
                        <p className="text-text-muted text-[10px] truncate">
                          {table.activeOrder.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Active Reservation Context */}
                  {table.activeReservation && (
                    <div className="mt-2.5 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
                      <div className="flex items-center justify-between text-blue-400 text-[11px]">
                        <span className="flex items-center gap-1 font-medium">
                          <CalendarDays size={12} />
                          <span>Reserved for {table.activeReservation.reservationTime}</span>
                        </span>
                        <span>{table.activeReservation.partySize} guests</span>
                      </div>
                      <p className="text-text-secondary text-[11px]">
                        Guest: <strong className="text-text-primary">{table.activeReservation.customerName}</strong>
                      </p>
                    </div>
                  )}
                </div>

                {/* Status Changer Actions */}
                <div className="pt-2 border-t border-surface-border/50">
                  <span className="text-[10px] text-text-disabled uppercase tracking-wider font-semibold block mb-1.5">
                    Change Status
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleStatusChange(table.id, opt.value)}
                        disabled={updating || table.status === opt.value}
                        className={`py-1 px-2 rounded text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                          table.status === opt.value
                            ? 'bg-brand/20 text-brand border border-brand/40 cursor-default'
                            : 'bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80'
                        }`}
                      >
                        {table.status === opt.value && <Check size={10} />}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
