import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Users,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Utensils,
  Share2,
} from 'lucide-react';
import { reservationService } from '../../services/reservationService';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    const { data, error } = await reservationService.getReservationById(id);
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to load booking details');
    } else {
      setBooking(data);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Real-time status update via Socket.IO
  useEffect(() => {
    if (!socket || !booking?.id) return;

    const handleStatusChanged = (payload) => {
      if (Number(payload.id) === Number(booking.id)) {
        toast(`Reservation status updated to: ${payload.status.toUpperCase()}`, {
          icon: '🔔',
          style: { background: '#1A1E2E', color: '#00C2A8' },
        });
        setBooking((prev) => ({
          ...prev,
          status: payload.status,
          tableId: payload.tableId || prev.tableId,
          rejectionReason: payload.rejectionReason || prev.rejectionReason,
        }));
      }
    };

    socket.on('reservation:status_changed', handleStatusChanged);
    return () => {
      socket.off('reservation:status_changed', handleStatusChanged);
    };
  }, [socket, booking?.id]);

  const handleCancelConfirm = async () => {
    setCancelling(true);
    const { data, error } = await reservationService.cancelReservation(
      id,
      cancelReason.trim() || 'Customer requested cancellation'
    );
    setCancelling(false);
    setCancelModalOpen(false);

    if (error) {
      toast.error(error.message || 'Failed to cancel reservation');
    } else {
      toast.success('Reservation successfully cancelled');
      setBooking((prev) => ({ ...prev, status: 'cancelled' }));
    }
  };

  if (loading) {
    return (
      <div className="page-container py-12 flex flex-col items-center justify-center space-y-3">
        <div className="spinner w-8 h-8" />
        <p className="text-xs text-text-muted">Loading reservation details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="page-container py-12 text-center space-y-4">
        <AlertCircle size={36} className="text-status-occupied mx-auto" />
        <h2 className="text-lg font-bold text-text-primary">Reservation Not Found</h2>
        <p className="text-xs text-text-muted">This booking does not exist or you are not authorized to view it.</p>
        <Link to="/app/bookings" className="btn-primary btn-sm inline-flex items-center gap-1.5 mt-2">
          <ArrowLeft size={16} />
          <span>Back to My Bookings</span>
        </Link>
      </div>
    );
  }

  const isCancellable = ['pending', 'confirmed'].includes(booking.status);

  return (
    <div className="page-container py-6 space-y-6 animate-fade-in max-w-xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand transition-colors"
        >
          <ArrowLeft size={16} />
          <span>All Bookings</span>
        </Link>
        <span className="text-xs text-text-muted">Booking #{booking.id}</span>
      </div>

      {/* Main Reservation Card */}
      <div className="card space-y-5 border border-surface-border">
        {/* Restaurant Header */}
        <div className="border-b border-surface-border/60 pb-4 space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-text-primary">{booking.restaurantName}</h1>
              {booking.address && (
                <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                  <MapPin size={13} className="shrink-0" />
                  <span>{booking.address}</span>
                </p>
              )}
              {booking.phone && (
                <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                  <Phone size={13} className="shrink-0" />
                  <span>{booking.phone}</span>
                </p>
              )}
            </div>

            {/* Status Badge */}
            <div>
              {booking.status === 'confirmed' && (
                <span className="badge bg-status-available/15 text-status-available border border-status-available/30 flex items-center gap-1">
                  <CheckCircle size={13} />
                  <span>Confirmed</span>
                </span>
              )}
              {booking.status === 'pending' && (
                <span className="badge bg-status-reserved/15 text-status-reserved border border-status-reserved/30 flex items-center gap-1">
                  <Clock size={13} />
                  <span>Pending Confirmation</span>
                </span>
              )}
              {booking.status === 'completed' && (
                <span className="badge bg-brand/15 text-brand border border-brand/30">
                  Completed
                </span>
              )}
              {booking.status === 'cancelled' && (
                <span className="badge bg-status-occupied/15 text-status-occupied border border-status-occupied/30 flex items-center gap-1">
                  <XCircle size={13} />
                  <span>Cancelled</span>
                </span>
              )}
              {booking.status === 'rejected' && (
                <span className="badge bg-status-occupied/15 text-status-occupied border border-status-occupied/30">
                  Rejected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Schedule & Guest Details */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-elevated/40 border border-surface-border/50 text-center">
          <div>
            <span className="text-[10px] text-text-muted uppercase tracking-wider block">Date</span>
            <div className="flex items-center justify-center gap-1 mt-1 font-bold text-sm text-text-primary">
              <CalendarDays size={14} className="text-brand shrink-0" />
              <span>{booking.reservationDate}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-text-muted uppercase tracking-wider block">Time</span>
            <div className="flex items-center justify-center gap-1 mt-1 font-bold text-sm text-text-primary">
              <Clock size={14} className="text-brand shrink-0" />
              <span>{booking.reservationTime}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-text-muted uppercase tracking-wider block">Party</span>
            <div className="flex items-center justify-center gap-1 mt-1 font-bold text-sm text-text-primary">
              <Users size={14} className="text-brand shrink-0" />
              <span>{booking.partySize} Guests</span>
            </div>
          </div>
        </div>

        {/* Table & Notes Details */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-surface-border/50">
            <span className="text-text-muted">Table Assignment</span>
            <span className="font-semibold text-text-primary">
              {booking.tableNumber ? `Table ${booking.tableNumber}` : 'Assigned upon arrival'}
            </span>
          </div>

          {booking.specialNote && (
            <div className="py-2 border-b border-surface-border/50 space-y-1">
              <span className="text-text-muted block">Special Request / Note:</span>
              <p className="text-text-primary bg-surface-elevated/30 p-2 rounded border border-surface-border/40">
                &ldquo;{booking.specialNote}&rdquo;
              </p>
            </div>
          )}

          {booking.rejectionReason && (
            <div className="p-3 rounded-lg bg-status-occupied/10 border border-status-occupied/30 text-status-occupied space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertCircle size={14} />
                <span>Rejection Reason:</span>
              </span>
              <p>{booking.rejectionReason}</p>
            </div>
          )}

          <div className="flex items-center justify-between py-1 text-[11px] text-text-disabled">
            <span>Booked on</span>
            <span>{new Date(booking.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        {isCancellable && (
          <div className="pt-2">
            <button
              onClick={() => setCancelModalOpen(true)}
              className="btn-danger w-full py-2.5 text-xs font-semibold"
            >
              Cancel Reservation
            </button>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in">
          <div className="card max-w-sm w-full space-y-4 border border-surface-border shadow-2xl">
            <div className="flex items-center gap-2 text-status-occupied">
              <AlertCircle size={20} />
              <h3 className="font-bold text-base">Cancel Reservation?</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to cancel your table booking for{' '}
              <strong>{booking.reservationDate} at {booking.reservationTime}</strong>?
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="text-text-muted">Reason for cancellation (optional):</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Change of plans, found alternate venue"
                rows={2}
                className="input text-xs w-full resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="btn-ghost btn-sm text-xs"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelConfirm}
                className="btn-danger btn-sm text-xs"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
