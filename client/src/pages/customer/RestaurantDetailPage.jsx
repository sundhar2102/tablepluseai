import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Utensils,
  Radio,
  AlertCircle,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { CROWD_LEVELS } from '../../constants/tableStatus';
import TableGrid from '../../components/customer/TableGrid';
import toast from 'react-hot-toast';

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const { socket, connected: socketConnected } = useSocket();
  const { user } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedTableId, setUpdatedTableId] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Fetch restaurant details
  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: apiErr } = await restaurantService.getRestaurantById(id);
    setLoading(false);

    if (apiErr) {
      setError(apiErr.message || 'Restaurant not found');
    } else {
      setRestaurant(data);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Socket.IO real-time subscription for live availability
  useEffect(() => {
    if (!socket || !restaurant?.id) return;

    // Join the restaurant room
    socket.emit('join:restaurant', restaurant.id);
    socket.emit('joinRestaurant', restaurant.id);

    // Listen for live availability events
    const handleAvailabilityUpdate = (payload) => {
      if (Number(payload.restaurantId) === Number(restaurant.id)) {
        toast('Live table update received! ⚡', {
          icon: '🪑',
          style: { background: '#1A1E2E', color: '#00C2A8' },
        });

        // Highlight updated table briefly
        if (payload.tableId) {
          setUpdatedTableId(payload.tableId);
          setTimeout(() => setUpdatedTableId(null), 3000);
        }

        // Update restaurant state
        setRestaurant((prev) => {
          if (!prev) return prev;

          const updatedTables = prev.tables.map((t) => {
            if (t.id === payload.tableId) {
              return { ...t, status: payload.newStatus, statusChangedAt: payload.updatedAt };
            }
            return t;
          });

          return {
            ...prev,
            tables: updatedTables,
            tableAvailability: payload.tableAvailability || prev.tableAvailability,
            crowdLevel: payload.crowdLevel || prev.crowdLevel,
            estimatedWaitMinutes: payload.estimatedWaitMinutes ?? prev.estimatedWaitMinutes,
            waitEstimation: payload.waitEstimation || prev.waitEstimation,
          };
        });
      }
    };

    socket.on('restaurant:availability_updated', handleAvailabilityUpdate);

    return () => {
      socket.emit('leave:restaurant', restaurant.id);
      socket.emit('leaveRestaurant', restaurant.id);
      socket.off('restaurant:availability_updated', handleAvailabilityUpdate);
    };
  }, [socket, restaurant?.id]);

  // Staff/Owner simulation tool to test live Socket.IO update (Stage 6 Part 1 requirement)
  const handleSimulateStatus = async (tableId, newStatus) => {
    setSimulating(true);
    const { error: err } = await restaurantService.updateTableStatus(restaurant.id, tableId, newStatus);
    setSimulating(false);
    if (err) {
      toast.error(err.message || 'Simulation requires staff permission');
    }
  };

  if (loading) {
    return (
      <div className="page-container py-12 flex flex-col items-center justify-center space-y-4">
        <div className="spinner w-10 h-10 border-[3px]" />
        <p className="text-xs text-text-secondary">Loading live table data...</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="page-container py-12 text-center space-y-4">
        <AlertCircle size={36} className="text-status-occupied mx-auto" />
        <h2 className="text-xl font-bold text-text-primary">Restaurant Unavailable</h2>
        <p className="text-sm text-text-secondary max-w-sm mx-auto">{error || 'Restaurant not found'}</p>
        <Link to="/app" className="btn-primary btn-sm inline-flex items-center gap-1.5 mt-2">
          <ArrowLeft size={16} />
          <span>Back to Restaurants</span>
        </Link>
      </div>
    );
  }

  const crowdConfig = CROWD_LEVELS[restaurant.crowdLevel] || CROWD_LEVELS.LOW;
  const avail = restaurant.tableAvailability || {};

  return (
    <div className="page-container py-6 space-y-6 animate-fade-in">
      {/* ── Navigation & Live Stream Indicator ─────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          to="/app"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-brand transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Discovery</span>
        </Link>

        {/* Real-time indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-surface-border text-xs">
          <Radio size={12} className={socketConnected ? 'text-brand animate-pulse' : 'text-text-disabled'} />
          <span className={socketConnected ? 'text-brand font-medium' : 'text-text-disabled'}>
            {socketConnected ? 'Real-time Live' : 'Connecting Real-time...'}
          </span>
        </div>
      </div>

      {/* ── Restaurant Hero Card ───────────────────────────────── */}
      <div className="card overflow-hidden p-0 border border-surface-border">
        {/* Cover Image */}
        <div className="relative h-56 md:h-72 w-full overflow-hidden bg-surface-elevated">
          <img
            src={
              restaurant.coverPhotoUrl ||
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'
            }
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/40 to-transparent" />

          {/* Badges on Cover */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
                restaurant.isOpen ? 'bg-status-available/90 text-white' : 'bg-red-500/90 text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {restaurant.isOpen ? 'Open Now' : 'Closed'}
            </span>

            {restaurant.distanceKm !== null && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-surface-bg/85 text-text-primary backdrop-blur-md border border-white/10">
                <MapPin size={13} className="text-brand" />
                {restaurant.distanceKm} km from you
              </span>
            )}
          </div>

          {/* Title & Info inside Cover bottom */}
          <div className="absolute bottom-4 left-4 right-4 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-brand bg-brand/15 px-2 py-0.5 rounded backdrop-blur-sm">
                {restaurant.cuisineType}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              {restaurant.name}
            </h1>
          </div>
        </div>

        {/* Hero Body: Address & Phone */}
        <div className="p-4 md:p-6 space-y-3 bg-surface-card">
          <p className="text-sm text-text-secondary">{restaurant.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-2 border-t border-surface-border/60">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-brand" />
              <span>{restaurant.address}</span>
            </div>
            {restaurant.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={14} className="text-brand" />
                <span>{restaurant.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-brand" />
              <span>Today: {restaurant.todayHours}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Operational Status Banner: "Can I Get a Table Now?" ── */}
      <div className="card p-5 border-2 border-brand/30 bg-surface-elevated/70 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span className="text-lg">⚡</span> Can I Get a Table Now?
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Live operational metrics derived directly from connected tables.
            </p>
          </div>

          {/* Large Crowd Level Pill */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold text-xs self-start sm:self-auto border ${
              restaurant.crowdLevel === 'LOW'
                ? 'bg-status-available/15 text-status-available border-status-available/40'
                : restaurant.crowdLevel === 'MODERATE'
                ? 'bg-status-reserved/15 text-status-reserved border-status-reserved/40'
                : restaurant.crowdLevel === 'HIGH'
                ? 'bg-status-occupied/15 text-status-occupied border-status-occupied/40'
                : 'bg-red-950/40 text-red-400 border-red-500/40'
            }`}
          >
            <span>{crowdConfig.icon}</span>
            <span>Crowd Level: {crowdConfig.label}</span>
          </div>
        </div>

        {/* 4 Metric Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-surface-card border border-surface-border">
            <span className="text-[10px] uppercase font-bold text-text-muted block">
              Available Tables
            </span>
            <span className="text-xl font-extrabold text-status-available">
              {avail.availableTables ?? 0}
            </span>
            <span className="text-[10px] text-text-muted block">of {avail.totalTables ?? 0} total</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-card border border-surface-border">
            <span className="text-[10px] uppercase font-bold text-text-muted block">
              Occupied
            </span>
            <span className="text-xl font-extrabold text-status-occupied">
              {avail.occupiedTables ?? 0}
            </span>
            <span className="text-[10px] text-text-muted block">Dining now</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-card border border-surface-border">
            <span className="text-[10px] uppercase font-bold text-text-muted block">
              Cleaning / Prep
            </span>
            <span className="text-xl font-extrabold text-status-cleaning">
              {avail.cleaningTables ?? 0}
            </span>
            <span className="text-[10px] text-text-muted block">Sanitizing</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-card border border-surface-border">
            <span className="text-[10px] uppercase font-bold text-text-muted block">
              Estimated Wait
            </span>
            <span
              className={`text-xl font-extrabold ${
                restaurant.estimatedWaitMinutes === 0
                  ? 'text-brand'
                  : 'text-status-reserved'
              }`}
            >
              {restaurant.estimatedWaitMinutes === 0 ? '0 mins' : `~${restaurant.estimatedWaitMinutes}m`}
            </span>
            <span className="text-[10px] text-text-muted block">Operational estimate</span>
          </div>
        </div>

        {/* Transparent Estimate Note */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-card/60 text-xs text-text-muted">
          <Info size={14} className="text-brand shrink-0" />
          <span>
            {restaurant.waitEstimation?.reason || 'Rule-based operational estimate based on live table availability.'}{' '}
            <strong className="text-text-secondary">Not an AI prediction.</strong>
          </span>
        </div>
      </div>

      {/* ── Visual Table Layout Grid ───────────────────────────── */}
      <div className="card space-y-4 border border-surface-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-text-primary">
              Live Table Floor Status
            </h3>
            <p className="text-xs text-text-muted">
              Read-only visual layout of all restaurant tables.
            </p>
          </div>
          <button
            onClick={fetchDetails}
            className="btn-outline btn-sm text-xs inline-flex items-center gap-1"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>

        <TableGrid tables={restaurant.tables} updatedTableId={updatedTableId} />
      </div>

      {/* ── Weekly Operating Hours ─────────────────────────────── */}
      <div className="card space-y-3 border border-surface-border">
        <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
          <Calendar size={16} className="text-brand" />
          <span>Weekly Operating Hours</span>
        </h3>

        <div className="divide-y divide-surface-border/60 text-xs">
          {restaurant.weeklyHours?.map((day) => {
            const isToday = day.dayOfWeek === new Date().getDay();
            return (
              <div
                key={day.dayOfWeek}
                className={`py-2 flex items-center justify-between ${
                  isToday ? 'font-bold text-brand' : 'text-text-secondary'
                }`}
              >
                <span>
                  {day.dayName} {isToday && '(Today)'}
                </span>
                <span>{day.hours}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Technical Live Verification Control (Stage 6 Part 1) ─ */}
      {restaurant.tables && restaurant.tables.length > 0 && (
        <div className="p-4 rounded-xl bg-surface-elevated/40 border border-dashed border-surface-border text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text-muted">
              🧪 Live Socket.IO Technical Verification Tool (Staff Simulator):
            </span>
            <span className="text-[10px] text-text-disabled">Stage 6 Part 1 Verification</span>
          </div>
          <p className="text-text-muted text-[11px]">
            Toggle table status to trigger backend event <code className="text-brand">restaurant:availability_updated</code> and watch the UI update in real-time without reloading.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {restaurant.tables.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center gap-1 bg-surface-card px-2 py-1 rounded border border-surface-border">
                <span className="font-bold text-text-primary">{t.tableNumber}:</span>
                <button
                  disabled={simulating}
                  onClick={() => handleSimulateStatus(t.id, 'available')}
                  className="px-1.5 py-0.5 rounded bg-status-available/20 text-status-available hover:bg-status-available/30"
                >
                  Free
                </button>
                <button
                  disabled={simulating}
                  onClick={() => handleSimulateStatus(t.id, 'occupied')}
                  className="px-1.5 py-0.5 rounded bg-status-occupied/20 text-status-occupied hover:bg-status-occupied/30"
                >
                  Occupy
                </button>
                <button
                  disabled={simulating}
                  onClick={() => handleSimulateStatus(t.id, 'cleaning')}
                  className="px-1.5 py-0.5 rounded bg-status-cleaning/20 text-status-cleaning hover:bg-status-cleaning/30"
                >
                  Clean
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
