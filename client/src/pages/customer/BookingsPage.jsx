import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  RefreshCw,
  Utensils,
} from 'lucide-react';
import { reservationService } from '../../services/reservationService';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

export default function BookingsPage() {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, PAST

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await reservationService.getCustomerReservations();
    setLoading(false);
    if (error) {
      toast.error(error.message || 'Failed to load reservations');
    } else {
      setReservations(data || []);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Socket.IO real-time listener for reservation status changes
  useEffect(() => {
    if (!socket) return;

    const handleStatusChanged = (payload) => {
      setReservations((prev) =>
        prev.map((item) =>
          item.id === payload.id
            ? { ...item, status: payload.status, tableId: payload.tableId || item.tableId }
            : item
        )
      );
      toast(`Reservation #${payload.id} status updated to: ${payload.status.toUpperCase()}`, {
        icon: '🔔',
        style: { background: '#1A1E2E', color: '#00C2A8' },
      });
    };

    socket.on('reservation:status_changed', handleStatusChanged);
    return () => {
      socket.off('reservation:status_changed', handleStatusChanged);
    };
  }, [socket]);

  const handleCancel = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

    setCancellingId(id);
    const { data, error } = await reservationService.cancelReservation(id, 'Customer requested cancellation');
    setCancellingId(null);

    if (error) {
      toast.error(error.message || 'Failed to cancel reservation');
    } else {
      toast.success('Reservation cancelled successfully');
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
      );
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (filter === 'ACTIVE') return ['pending', 'confirmed'].includes(r.status);
    if (filter === 'PAST') return ['completed', 'cancelled', 'rejected', 'no_show'].includes(r.status);
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="badge bg-status-available/15 text-status-available border border-status-available/30 flex items-center gap-1">
            <CheckCircle size={12} />
            <span>Confirmed</span>
          </span>
        );
      case 'pending':
        return (
          <span className="badge bg-status-reserved/15 text-status-reserved border border-status-reserved/30 flex items-center gap-1">
            <Clock size={12} />
            <span>Pending</span>
          </span>
        );
      case 'completed':
        return (
          <span className="badge bg-brand/15 text-brand border border-brand/30">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge bg-status-occupied/15 text-status-occupied border border-status-occupied/30 flex items-center gap-1">
            <XCircle size={12} />
            <span>Cancelled</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="badge bg-status-occupied/15 text-status-occupied border border-status-occupied/30">
            Rejected
          </span>
        );
      default:
        return <span className="badge bg-surface-elevated text-text-secondary">{status}</span>;
    }
  };

  return (
    <div className="page-container py-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <CalendarDays className="text-brand" size={24} />
            <span>My Table Reservations</span>
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage your booked dining tables and reservations
          </p>
        </div>
        <button
          onClick={fetchReservations}
          disabled={loading}
          className="btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
          title="Refresh reservations"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-surface-border gap-2 text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 ${
            filter === 'ALL'
              ? 'border-brand text-brand'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          All ({reservations.length})
        </button>
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 ${
            filter === 'ACTIVE'
              ? 'border-brand text-brand'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          Upcoming / Active (
          {reservations.filter((r) => ['pending', 'confirmed'].includes(r.status)).length}
          )
        </button>
        <button
          onClick={() => setFilter('PAST')}
          className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 ${
            filter === 'PAST'
              ? 'border-brand text-brand'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          Past / History (
          {
            reservations.filter((r) =>
              ['completed', 'cancelled', 'rejected', 'no_show'].includes(r.status)
            ).length
          }
          )
        </button>
      </div>

      {/* Reservation List */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="spinner w-8 h-8" />
          <p className="text-xs text-text-muted">Loading reservations...</p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="card text-center py-12 space-y-4">
          <Utensils size={40} className="mx-auto text-text-disabled" />
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              {reservations.length === 0 ? 'No bookings yet' : 'No Reservations Found'}
            </h3>
            <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
              {reservations.length === 0
                ? 'Book a table at a restaurant to see your reservations here.'
                : 'You haven’t booked any dining tables in this category yet.'}
            </p>
          </div>
          <Link to="/app" className="btn-primary btn-sm inline-flex items-center gap-1.5">
            <span>Explore Restaurants</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map((res) => {
            const isCancellable = ['pending', 'confirmed'].includes(res.status);
            return (
              <div
                key={res.id}
                onClick={() => navigate(`/app/bookings/${res.id}`)}
                className="card p-4 hover:border-brand/50 transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary group-hover:text-brand transition-colors">
                      {res.restaurantName || 'Restaurant'}
                    </h3>
                    {res.address && (
                      <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{res.address}</span>
                      </p>
                    )}
                  </div>
                  <div>{getStatusBadge(res.status)}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-surface-elevated/40 text-xs">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <CalendarDays size={14} className="text-brand shrink-0" />
                    <span>{res.reservationDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Clock size={14} className="text-brand shrink-0" />
                    <span>{res.reservationTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Users size={14} className="text-brand shrink-0" />
                    <span>{res.partySize} Guests</span>
                  </div>
                </div>

                {res.tableNumber && (
                  <div className="text-xs text-text-muted flex items-center justify-between">
                    <span>
                      Assigned Table: <strong className="text-text-primary">{res.tableNumber}</strong>
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-surface-border/50 text-xs">
                  <span className="text-[11px] text-brand flex items-center gap-1">
                    <span>View Details</span>
                    <ChevronRight size={13} />
                  </span>

                  {isCancellable && (
                    <button
                      type="button"
                      disabled={cancellingId === res.id}
                      onClick={(e) => handleCancel(res.id, e)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-status-occupied/10 text-status-occupied hover:bg-status-occupied/20 transition-colors"
                    >
                      {cancellingId === res.id ? 'Cancelling...' : 'Cancel Reservation'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
