/**
 * Application-wide constants.
 * Do NOT put secrets or environment-specific values here.
 */

const ROLES = {
  CUSTOMER: 'customer',
  OWNER:    'owner',
  ADMIN:    'admin',
};

const TABLE_STATUS = {
  AVAILABLE: 'available',
  RESERVED:  'reserved',
  OCCUPIED:  'occupied',
  CLEANING:  'cleaning',
};

const RESERVATION_STATUS = {
  PENDING:   'pending',
  CONFIRMED: 'confirmed',
  REJECTED:  'rejected',
  CANCELLED: 'cancelled',
  NO_SHOW:   'no_show',
  COMPLETED: 'completed',
};

const ORDER_STATUS = {
  RECEIVED:   'received',
  PREPARING:  'preparing',
  SERVED:     'served',
  COMPLETED:  'completed',
  CANCELLED:  'cancelled',
};

const PAYMENT_STATUS = {
  PENDING:  'pending',
  PAID:     'paid',
  REFUNDED: 'refunded',
};

const QUEUE_STATUS = {
  WAITING:   'waiting',
  CALLED:    'called',
  SEATED:    'seated',
  CANCELLED: 'cancelled',
  EXPIRED:   'expired',
};

const APPROVAL_STATUS = {
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const CROWD_LEVELS = {
  LOW:      'LOW',
  MODERATE: 'MODERATE',
  HIGH:     'HIGH',
  FULL:     'FULL',
};

module.exports = {
  ROLES,
  TABLE_STATUS,
  RESERVATION_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  QUEUE_STATUS,
  APPROVAL_STATUS,
  CROWD_LEVELS,
};
