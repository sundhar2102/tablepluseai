import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Utensils,
  RefreshCw,
  Search,
  Sparkles,
  Radio,
  Clock,
  ShieldCheck,
  AlertCircle,
  Building2,
  Filter,
} from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';
import { useSocket } from '../../context/SocketContext';
import RestaurantCard from '../../components/customer/RestaurantCard';

export default function CustomerHomePage() {
  const navigate = useNavigate();
  const { socket, connected: socketConnected } = useSocket();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const [crowdFilter, setCrowdFilter] = useState('ALL');

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: apiErr } = await restaurantService.getRestaurants();
    setLoading(false);

    if (apiErr) {
      setError(apiErr.message || 'Unable to load restaurants. Please check your network connection.');
      setRestaurants([]);
    } else {
      setRestaurants(data?.restaurants || []);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Real-time socket updates for all registered restaurants
  useEffect(() => {
    if (!socket || restaurants.length === 0) return;

    restaurants.forEach((r) => {
      socket.emit('join:restaurant', r.id);
      socket.emit('joinRestaurant', r.id);
    });

    const handleAvailabilityUpdate = (payload) => {
      const restId = Number(payload.restaurantId);
      setRestaurants((prev) =>
        prev.map((r) => {
          if (Number(r.id) === restId) {
            return {
              ...r,
              tableAvailability: payload.tableAvailability || r.tableAvailability,
              crowdLevel: payload.crowdLevel || r.crowdLevel,
              estimatedWaitMinutes: payload.estimatedWaitMinutes ?? r.estimatedWaitMinutes,
              waitEstimation: payload.waitEstimation || r.waitEstimation,
            };
          }
          return r;
        })
      );
    };

    socket.on('restaurant:availability_updated', handleAvailabilityUpdate);

    return () => {
      restaurants.forEach((r) => {
        socket.emit('leave:restaurant', r.id);
        socket.emit('leaveRestaurant', r.id);
      });
      socket.off('restaurant:availability_updated', handleAvailabilityUpdate);
    };
  }, [socket, restaurants]);

  // Unique cuisines list
  const availableCuisines = useMemo(() => {
    const set = new Set();
    restaurants.forEach((r) => {
      if (r.cuisineType) set.add(r.cuisineType);
    });
    return Array.from(set);
  }, [restaurants]);

  // Filtered restaurants
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = r.name?.toLowerCase().includes(q);
        const matchesCuisine = r.cuisineType?.toLowerCase().includes(q);
        const matchesAddress = r.address?.toLowerCase().includes(q);
        const matchesArea = r.area?.toLowerCase().includes(q);
        if (!matchesName && !matchesCuisine && !matchesAddress && !matchesArea) {
          return false;
        }
      }

      // Cuisine filter
      if (selectedCuisine !== 'ALL') {
        if (r.cuisineType !== selectedCuisine) return false;
      }

      // Crowd filter
      if (crowdFilter !== 'ALL') {
        if (r.crowdLevel !== crowdFilter) return false;
      }

      return true;
    });
  }, [restaurants, searchQuery, selectedCuisine, crowdFilter]);

  return (
    <div className="page-container py-6 space-y-8 animate-fade-in">
      {/* ── Top Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-brand/30 text-xs font-bold text-brand mb-2">
            <Radio size={13} className={`text-brand ${socketConnected ? 'animate-pulse' : ''}`} />
            <span>TablePulse Live Operations</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Discover <span className="text-brand">Registered Restaurants</span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time table availability, live crowd rush levels, contactless queuing, and digital pre-ordering across all TablePulse dining spots.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            id="btn-refresh-restaurants"
            onClick={fetchRestaurants}
            disabled={loading}
            className="btn-outline btn-sm inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand"
            title="Refresh live table & operational status"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────── */}
      <div className="card p-4 border border-surface-border bg-surface-card space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              id="search-restaurants-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by restaurant name, cuisine, or neighborhood..."
              className="input pl-10 pr-4 py-2 text-xs w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Crowd Level Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-text-muted shrink-0" />
            <select
              id="select-crowd-filter"
              value={crowdFilter}
              onChange={(e) => setCrowdFilter(e.target.value)}
              className="input py-2 text-xs w-full sm:w-40 font-medium"
            >
              <option value="ALL">All Crowd Levels</option>
              <option value="LOW">Low Rush (🟢)</option>
              <option value="MODERATE">Moderate (🟡)</option>
              <option value="HIGH">High Rush (🟠)</option>
              <option value="FULL">Full House (🔴)</option>
            </select>
          </div>
        </div>

        {/* Cuisine Filter Tabs */}
        {availableCuisines.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-surface-border/50">
            <button
              onClick={() => setSelectedCuisine('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCuisine === 'ALL'
                  ? 'bg-brand text-surface-bg font-bold shadow-sm'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-surface-border'
              }`}
            >
              All Cuisines ({restaurants.length})
            </button>
            {availableCuisines.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCuisine(c)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCuisine === c
                    ? 'bg-brand text-surface-bg font-bold shadow-sm'
                    : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-surface-border'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Registered Restaurants List / Grid ───────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-text-secondary px-1">
          <span className="font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
            <Sparkles size={14} className="text-brand" />
            Registered Dining Establishments
            <span className="ml-1 px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[11px] font-bold">
              {filteredRestaurants.length} active
            </span>
          </span>
          <span className="text-[11px] text-emerald-400 font-semibold hidden sm:inline">
            🟢 Live Seating & Operational Database
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card h-80 animate-pulse border border-surface-border flex flex-col justify-center items-center gap-3 bg-surface-card"
              >
                <RefreshCw size={24} className="animate-spin text-brand" />
                <span className="text-xs text-text-muted">Loading TablePulse restaurants...</span>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="card text-center p-8 border border-status-occupied/30 space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-status-occupied/10 text-status-occupied flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">Failed to Load Restaurants</h3>
              <p className="text-xs text-text-muted mt-1">{error}</p>
            </div>
            <button
              onClick={fetchRestaurants}
              className="btn-primary btn-sm inline-flex items-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredRestaurants.length === 0 && (
          <div className="card text-center p-12 border border-surface-border space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-surface-elevated text-text-muted flex items-center justify-center mx-auto">
              <Building2 size={28} />
            </div>
            <div>
              <h3 className="font-bold text-base text-text-primary">No Restaurants Found</h3>
              <p className="text-xs text-text-muted mt-1">
                {searchQuery || selectedCuisine !== 'ALL' || crowdFilter !== 'ALL'
                  ? 'No registered restaurants match your current filters. Try resetting search filters.'
                  : 'There are currently no registered restaurants active in the TablePulse system.'}
              </p>
            </div>
            {(searchQuery || selectedCuisine !== 'ALL' || crowdFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCuisine('ALL');
                  setCrowdFilter('ALL');
                }}
                className="btn-outline btn-sm text-xs"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Restaurant Cards Grid */}
        {!loading && !error && filteredRestaurants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </div>

      {/* ── Operational Features Highlights ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-surface-border/60">
        <div className="card p-4 border border-surface-border/50 bg-surface-card/60 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-text-primary">Instant Table Occupancy</h4>
            <p className="text-[11px] text-text-muted mt-0.5">
              Live database floor status updates for available, occupied, and cleaning tables.
            </p>
          </div>
        </div>

        <div className="card p-4 border border-surface-border/50 bg-surface-card/60 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-text-primary">Rule-Based Turnaround</h4>
            <p className="text-[11px] text-text-muted mt-0.5">
              Transparent, explainable wait estimates derived directly from current table dining turnover.
            </p>
          </div>
        </div>

        <div className="card p-4 border border-surface-border/50 bg-surface-card/60 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-text-primary">Pre-Order Food In Advance</h4>
            <p className="text-[11px] text-text-muted mt-0.5">
              Select dishes from the verified restaurant menu while waiting for a table.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
