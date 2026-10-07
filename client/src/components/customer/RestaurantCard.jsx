import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, Utensils, ChevronRight, Sparkles } from 'lucide-react';
import { CROWD_LEVELS } from '../../constants/tableStatus';

export default function RestaurantCard({ restaurant }) {
  const {
    id,
    name = 'Smart Table Restaurant',
    cuisineType = 'Multi-Cuisine & Contemporary',
    address = '42 Usman Road, T. Nagar, Chennai 600017',
    coverPhotoUrl,
    isOpen = true,
    todayHours = '11:00 - 23:00',
    tableAvailability = {},
    crowdLevel = 'LOW',
    estimatedWaitMinutes = 0,
  } = restaurant || {};

  const crowdConfig = CROWD_LEVELS[crowdLevel] || CROWD_LEVELS.LOW;
  const availableCount = tableAvailability?.availableTables ?? 0;
  const totalCount = tableAvailability?.totalTables ?? 0;

  return (
    <Link
      to={`/app/restaurants/${id}`}
      className="card card-hover flex flex-col overflow-hidden group transition-all duration-300 border border-surface-border hover:border-brand/50 shadow-lg"
    >
      {/* Cover Image + Overlay Badges */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-surface-elevated">
        <img
          src={
            coverPhotoUrl ||
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'
          }
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-card/95 via-surface-card/30 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Open Status */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm bg-emerald-600/90 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>{isOpen ? 'Open Now' : 'Closed'}</span>
          </span>

          {/* Smart Table Verified Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-brand text-surface-bg backdrop-blur-md shadow-sm">
            <Sparkles size={11} />
            Verified Dining
          </span>
        </div>

        {/* Bottom Inside Image: Cuisine & Today Hours */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1 bg-surface-bg/85 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/5 font-medium text-text-primary">
            <Utensils size={12} className="text-brand" />
            {cuisineType}
          </span>
          <span className="inline-flex items-center gap-1 bg-surface-bg/85 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/5 text-text-muted">
            <Clock size={12} className="text-brand" />
            {todayHours}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-extrabold text-lg text-text-primary group-hover:text-brand transition-colors line-clamp-1">
              {name}
            </h3>
            <ChevronRight
              size={18}
              className="text-text-disabled group-hover:text-brand group-hover:translate-x-1 transition-all shrink-0 mt-1"
            />
          </div>

          <p className="text-xs text-text-muted flex items-center gap-1 line-clamp-1">
            <MapPin size={13} className="text-brand shrink-0" />
            {address}
          </p>
        </div>

        {/* Operational Availability Indicators */}
        <div className="pt-3 border-t border-surface-border/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Smart Table Metrics
            </span>
            <span className="text-[11px] text-text-muted">Real-time sync</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Table Count */}
            <div className="bg-surface-elevated/80 p-2.5 rounded-xl border border-surface-border/50">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block mb-0.5">
                Available Tables
              </span>
              <span
                className={`text-xs font-black ${
                  availableCount > 0
                    ? 'text-status-available'
                    : 'text-status-occupied'
                }`}
              >
                {availableCount} / {totalCount} free
              </span>
            </div>

            {/* Crowd Level */}
            <div className="bg-surface-elevated/80 p-2.5 rounded-xl border border-surface-border/50">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block mb-0.5">
                Current Crowd
              </span>
              <span
                className={`text-xs font-black flex items-center justify-center gap-1 ${crowdConfig.textClass}`}
              >
                <span>{crowdConfig.icon}</span>
                {crowdConfig.label}
              </span>
            </div>

            {/* Wait Time */}
            <div className="bg-surface-elevated/80 p-2.5 rounded-xl border border-surface-border/50">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block mb-0.5">
                <span>Estimated Wait</span>
              </span>
              <span
                className={`text-xs font-black ${
                  estimatedWaitMinutes === 0
                    ? 'text-brand'
                    : 'text-status-reserved'
                }`}
              >
                <span>{estimatedWaitMinutes === 0 ? '0-5 mins' : `${estimatedWaitMinutes} mins`}</span>
              </span>
            </div>
          </div>
        </div>

        {/* View Details Action Link */}
        <div className="pt-2 flex items-center justify-end">
          <span className="text-xs font-bold text-brand flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Open Restaurant <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
