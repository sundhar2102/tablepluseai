import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, Utensils, ChevronRight } from 'lucide-react';
import { CROWD_LEVELS } from '../../constants/tableStatus';

export default function RestaurantCard({ restaurant }) {
  const {
    id,
    name,
    cuisineType,
    address,
    coverPhotoUrl,
    distanceKm,
    isOpen,
    todayHours,
    tableAvailability = {},
    crowdLevel = 'LOW',
    estimatedWaitMinutes = 0,
  } = restaurant;

  const crowdConfig = CROWD_LEVELS[crowdLevel] || CROWD_LEVELS.LOW;
  const availableCount = tableAvailability.availableTables ?? 0;
  const totalCount = tableAvailability.totalTables ?? 0;

  return (
    <Link
      to={`/app/restaurants/${id}`}
      className="card card-hover flex flex-col overflow-hidden group transition-all duration-300 border border-surface-border hover:border-brand/40"
    >
      {/* Cover Image + Overlay Badges */}
      <div className="relative h-44 w-full overflow-hidden bg-surface-elevated">
        <img
          src={
            coverPhotoUrl ||
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'
          }
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-card/90 via-surface-card/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Open / Closed Status */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm ${
              isOpen
                ? 'bg-status-available/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOpen ? 'bg-white animate-pulse' : 'bg-white/60'
              }`}
            />
            {isOpen ? 'Open Now' : 'Closed'}
          </span>

          {/* Distance Badge */}
          {distanceKm !== null && distanceKm !== undefined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-bg/80 text-text-primary backdrop-blur-md border border-white/10">
              <MapPin size={12} className="text-brand" />
              {distanceKm} km away
            </span>
          )}
        </div>

        {/* Bottom Inside Image: Cuisine & Today Hours */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1 bg-surface-bg/80 px-2 py-0.5 rounded backdrop-blur-sm">
            <Utensils size={12} className="text-brand" />
            {cuisineType || 'Multi-Cuisine'}
          </span>
          <span className="inline-flex items-center gap-1 bg-surface-bg/80 px-2 py-0.5 rounded backdrop-blur-sm">
            <Clock size={12} />
            {todayHours}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-base text-text-primary group-hover:text-brand transition-colors line-clamp-1">
              {name}
            </h3>
            <ChevronRight
              size={18}
              className="text-text-disabled group-hover:text-brand group-hover:translate-x-1 transition-all shrink-0 mt-0.5"
            />
          </div>

          <p className="text-xs text-text-muted line-clamp-1 mb-3">
            {address}
          </p>
        </div>

        {/* Operational Availability Indicators */}
        <div className="pt-3 border-t border-surface-border/60 grid grid-cols-3 gap-2 text-center">
          {/* Table Count */}
          <div className="bg-surface-elevated/70 p-2 rounded-lg border border-surface-border/40">
            <span className="text-[10px] uppercase tracking-wider text-text-muted block">
              Tables
            </span>
            <span
              className={`text-xs font-bold ${
                availableCount > 0
                  ? 'text-status-available'
                  : 'text-status-occupied'
              }`}
            >
              {availableCount} / {totalCount} free
            </span>
          </div>

          {/* Crowd Level */}
          <div className="bg-surface-elevated/70 p-2 rounded-lg border border-surface-border/40">
            <span className="text-[10px] uppercase tracking-wider text-text-muted block">
              Crowd
            </span>
            <span
              className={`text-xs font-bold flex items-center justify-center gap-1 ${crowdConfig.textClass}`}
            >
              <span>{crowdConfig.icon}</span>
              {crowdConfig.label}
            </span>
          </div>

          {/* Wait Time */}
          <div className="bg-surface-elevated/70 p-2 rounded-lg border border-surface-border/40">
            <span className="text-[10px] uppercase tracking-wider text-text-muted block">
              Wait Time
            </span>
            <span
              className={`text-xs font-bold ${
                estimatedWaitMinutes === 0
                  ? 'text-brand'
                  : 'text-status-reserved'
              }`}
            >
              {estimatedWaitMinutes === 0 ? '0 mins' : `~${estimatedWaitMinutes}m`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
