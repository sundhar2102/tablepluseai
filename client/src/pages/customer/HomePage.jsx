import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  Clock,
  Compass,
  X,
} from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { restaurantService } from '../../services/restaurantService';
import RestaurantCard from '../../components/customer/RestaurantCard';

const POPULAR_AREAS = [
  { name: 'T. Nagar', lat: 13.0418, lng: 80.2341 },
  { name: 'Nungambakkam', lat: 13.0569, lng: 80.2425 },
  { name: 'Anna Nagar', lat: 13.085, lng: 80.21 },
  { name: 'Alwarpet', lat: 13.0336, lng: 80.252 },
  { name: 'Adyar', lat: 13.0012, lng: 80.2565 },
];

const CUISINES = ['All', 'North Indian', 'South Indian', 'Seafood', 'Continental', 'Japanese'];

export default function CustomerHomePage() {
  const {
    coordinates,
    loading: geoLoading,
    permissionDenied,
    requestLocation,
    setManualCoordinates,
  } = useGeolocation(true);

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cuisine, setCuisine] = useState('All');
  const [radius, setRadius] = useState(10);
  const [openNow, setOpenNow] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch restaurants
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = {};
    if (coordinates) {
      params.lat = coordinates.latitude;
      params.lng = coordinates.longitude;
      params.radius = radius;
    }
    if (debouncedSearch) params.search = debouncedSearch;
    if (cuisine !== 'All') params.cuisine = cuisine;
    if (openNow) params.openNow = true;

    const { data, error: apiErr } = await restaurantService.getRestaurants(params);
    setLoading(false);

    if (apiErr) {
      setError(apiErr.message || 'Failed to load restaurants');
    } else {
      setRestaurants(data.restaurants || []);
    }
  }, [coordinates, radius, debouncedSearch, cuisine, openNow]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Quick area selection
  const handleSelectArea = (area) => {
    setSelectedArea(area.name);
    setManualCoordinates(area.lat, area.lng);
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCuisine('All');
    setOpenNow(false);
    setRadius(10);
  };

  return (
    <div className="page-container py-6 space-y-6 animate-fade-in">
      {/* ── Hero Greeting & Header ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Find Your Table <span className="text-brand">Now</span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time availability, crowd levels, and transparent wait estimates.
          </p>
        </div>

        {/* Location Status Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {coordinates ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/30 text-xs font-medium text-brand">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <span>
                {selectedArea ? `Area: ${selectedArea}` : 'Using Device Location'}
              </span>
            </div>
          ) : (
            <button
              onClick={requestLocation}
              disabled={geoLoading}
              className="btn-outline btn-sm inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand"
            >
              <Compass size={14} className={geoLoading ? 'animate-spin' : ''} />
              {geoLoading ? 'Detecting GPS...' : 'Enable Location'}
            </button>
          )}
        </div>
      </div>

      {/* ── Location Permission Fallback Banner ─────────────────── */}
      {permissionDenied && (
        <div className="p-4 rounded-xl bg-surface-elevated/90 border border-amber-500/30 text-xs text-text-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-primary">
                Location access is disabled or unavailable
              </p>
              <p className="mt-0.5">
                Pick a popular dining hub below or search manually.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
            {POPULAR_AREAS.map((area) => (
              <button
                key={area.name}
                onClick={() => handleSelectArea(area)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedArea === area.name
                    ? 'bg-brand text-surface-bg font-semibold'
                    : 'bg-surface-card hover:bg-surface-border text-text-primary border border-surface-border'
                }`}
              >
                {area.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Search & Filter Controls ───────────────────────────── */}
      <div className="card space-y-4 p-4 border border-surface-border">
        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by restaurant name, cuisine, or area..."
            className="input pl-10 pr-10 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Cuisine Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CUISINES.map((c) => (
            <button
              key={c}
              onClick={() => setCuisine(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                cuisine === c
                  ? 'bg-brand text-surface-bg shadow-glow'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-surface-border'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Radius & Open Now Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-border/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-text-muted">Radius:</span>
            {[5, 10, 20].map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  radius === r
                    ? 'bg-surface-elevated text-brand font-bold border border-brand/40'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-text-secondary hover:text-text-primary">
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
              className="w-4 h-4 rounded border-surface-border text-brand focus:ring-brand/40 bg-surface-elevated"
            />
            <span>Open Now Only</span>
          </label>
        </div>
      </div>

      {/* ── Results Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-text-secondary px-1">
        <span>
          Showing <strong className="text-text-primary">{restaurants.length}</strong> restaurants
          {coordinates ? ` within ${radius} km` : ''}
        </span>
        <button
          onClick={fetchRestaurants}
          className="inline-flex items-center gap-1 text-text-muted hover:text-brand transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Restaurant Grid / Empty / Error States ─────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card h-72 animate-pulse flex flex-col">
              <div className="h-44 bg-surface-elevated rounded-lg mb-3" />
              <div className="h-4 bg-surface-elevated rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface-elevated rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-12 space-y-3">
          <AlertCircle size={32} className="text-status-occupied mx-auto" />
          <h3 className="font-semibold text-text-primary">Unable to load restaurants</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">{error}</p>
          <button onClick={fetchRestaurants} className="btn-primary btn-sm mt-2">
            Try Again
          </button>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="card text-center py-16 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center mx-auto text-text-disabled">
            <Search size={26} />
          </div>
          <h3 className="font-semibold text-lg text-text-primary">No Restaurants Found</h3>
          <p className="text-sm text-text-secondary max-w-sm mx-auto">
            We couldn't find any restaurants matching your current location or filter criteria.
          </p>
          <button onClick={resetFilters} className="btn-outline btn-sm mt-2">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {restaurants.map((rest) => (
            <RestaurantCard key={rest.id} restaurant={rest} />
          ))}
        </div>
      )}
    </div>
  );
}
