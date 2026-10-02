// Table status display config — colour classes + labels
export const TABLE_STATUS = {
  available: {
    label:      'Available',
    bgClass:    'bg-status-available',
    textClass:  'text-status-available',
    badgeClass: 'badge-available',
    dotColor:   '#22C55E',
  },
  reserved: {
    label:      'Reserved',
    bgClass:    'bg-status-reserved',
    textClass:  'text-status-reserved',
    badgeClass: 'badge-reserved',
    dotColor:   '#F59E0B',
  },
  occupied: {
    label:      'Occupied',
    bgClass:    'bg-status-occupied',
    textClass:  'text-status-occupied',
    badgeClass: 'badge-occupied',
    dotColor:   '#EF4444',
  },
  cleaning: {
    label:      'Cleaning',
    bgClass:    'bg-status-cleaning',
    textClass:  'text-status-cleaning',
    badgeClass: 'badge-cleaning',
    dotColor:   '#8B5CF6',
  },
};

export const CROWD_LEVELS = {
  LOW: {
    label:     'Not Busy',
    color:     '#22C55E',
    textClass: 'text-crowd-low',
    icon:      '🟢',
  },
  MODERATE: {
    label:     'Moderate',
    color:     '#F59E0B',
    textClass: 'text-crowd-moderate',
    icon:      '🟡',
  },
  HIGH: {
    label:     'Busy',
    color:     '#EF4444',
    textClass: 'text-crowd-high',
    icon:      '🔴',
  },
  FULL: {
    label:     'Full',
    color:     '#7F1D1D',
    textClass: 'text-red-900',
    icon:      '⛔',
  },
};

export const USER_ROLES = {
  CUSTOMER: 'customer',
  OWNER:    'owner',
  ADMIN:    'admin',
};
