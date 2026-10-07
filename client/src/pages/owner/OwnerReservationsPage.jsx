import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { reservationService } from '../../services/reservationService';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

export default function OwnerReservationsPage() {
  const { socket } = useSocket();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedResId, setSelectedResId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (dateFilter) params.date = dateFilter;

    const { data, error } = await reservationService.getOwnerReservations(params);
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to load reservations');
    } else {
      setReservations(data?.reservations || []);
    }
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Real-time socket updates for owner
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (payload) => {
      toast.success(`New reservation received from ${payload.customerName || 'Customer'}!`, {
        icon: '📅',
      });
      fetchReservations();
    };

    const handleStatusChanged = (payload) => {
      setReservations((prev) =>
        prev.map((r) => (r.id === payload.id ? { ...r, status: payload.status } : r))
      );
    };

    socket.on('reservation:created', handleCreated);
    socket.on('reservation:status_changed', handleStatusChanged);

    return () => {
      socket.off('reservation:created', handleCreated);
      socket.off('reservation:status_changed', handleStatusChanged);
    };
  }, [socket, fetchReservations]);

  const handleUpdateStatus = async (id, status, extra = {}) => {
    setActionInProgress(id);
    const { data, error } = await reservationService.updateOwnerReservationStatus(id, {
      status,
      ...extra,
    });
    setActionInProgress(null);

    if (error) {
      toast.error(error.message || 'Failed to update reservation');
    } else {
      toast.success(`Reservation marked as ${status.toUpperCase()}`);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    await handleUpdateStatus(selectedResId, 'rejected', { rejectionReason: rejectionReason.trim() });
    setRejectModalOpen(false);
    setSelectedResId(null);
    setRejectionReason('');
  };

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === 'pending').length,
    confirmed: reservations.filter((r) => r.status === 'confirmed').length,
    completed: reservations.filter((r) => r.status === 'completed').length,
  };

  return (
    <div className="page-container py-6 space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <CalendarDays className="text-brand" size={24} />
            <span>Table Reservations</span>
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Review incoming bookings, confirm tables, and manage guest seatings
          </p>
        </div>
        <button
          onClick={fetchReservations}
          disabled={loading}
          className="btn-outline btn-sm text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3 text-center border border-surface-border">
          <span className="text-[11px] text-text-muted uppercase">Total Listed</span>
          <span className="text-xl font-bold text-text-primary block mt-0.5">{stats.total}</span>
        </div>
        <div className="card p-3 text-center border border-surface-border bg-status-reserved/5">
          <span className="text-[11px] text-status-reserved uppercase font-semibold">Needs Action</span>
          <span className="text-xl font-bold text-status-reserved block mt-0.5">{stats.pending}</span>
        </div>
        <div className="card p-3 text-center border border-surface-border bg-status-available/5">
          <span className="text-[11px] text-status-available uppercase font-semibold">Confirmed</span>
          <span className="text-xl font-bold text-status-available block mt-0.5">{stats.confirmed}</span>
        </div>
        <div className="card p-3 text-center border border-surface-border">
          <span className="text-[11px] text-brand uppercase font-semibold">Completed</span>
          <span className="text-xl font-bold text-brand block mt-0.5">{stats.completed}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3 text-xs border border-surface-border">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-text-muted flex items-center gap-1">
            <Filter size={13} />
            <span>Filter Status:</span>
          </span>
          {['ALL', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-brand text-surface-bg font-bold'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-text-muted">Date:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input text-xs py-1 px-2"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-[11px] text-text-muted hover:text-text-primary underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Reservations Table / Cards */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="spinner w-8 h-8" />
          <p className="text-xs text-text-muted">Loading bookings...</p>
        </div>
      ) : reservations.length === 0 ? (
        <div className="card text-center py-16 px-4 space-y-3 border border-surface-border">
          <CalendarDays size={36} className="mx-auto text-text-disabled" />
          <h3 className="font-bold text-base text-text-primary">
            {statusFilter === 'ALL' && !dateFilter ? 'No reservations yet' : 'No reservations match your filter'}
          </h3>
          <p className="text-xs text-text-muted">
            {statusFilter === 'ALL' && !dateFilter
              ? 'When customers book a table through Smart Table AI, their reservations will appear here in real time.'
              : 'Try clearing your status or date filters to view all bookings.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((res) => {
            const isPending = res.status === 'pending';
            const isConfirmed = res.status === 'confirmed';

            return (
              <div
                key={res.id}
                className="card p-4 border border-surface-border space-y-3 hover:border-brand/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-surface-border/50 pb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-text-primary text-sm">
                      {res.customerName}
                    </span>
                    <span className="text-xs text-text-muted">{res.customerPhone}</span>
                    <span className="text-xs text-text-disabled">#{res.id}</span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`badge text-xs font-semibold ${
                        res.status === 'confirmed'
                          ? 'bg-status-available/15 text-status-available border border-status-available/30'
                          : res.status === 'pending'
                          ? 'bg-status-reserved/15 text-status-reserved border border-status-reserved/30'
                          : res.status === 'completed'
                          ? 'bg-brand/15 text-brand border border-brand/30'
                          : 'bg-status-occupied/15 text-status-occupied border border-status-occupied/30'
                      }`}
                    >
                      {res.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase">Reservation Date</span>
                    <span className="font-semibold text-text-primary flex items-center gap-1 mt-0.5">
                      <CalendarDays size={13} className="text-brand" />
                      <span>{res.reservationDate}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-text-muted block text-[10px] uppercase">Time</span>
                    <span className="font-semibold text-text-primary flex items-center gap-1 mt-0.5">
                      <Clock size={13} className="text-brand" />
                      <span>{res.reservationTime}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-text-muted block text-[10px] uppercase">Guests</span>
                    <span className="font-semibold text-text-primary flex items-center gap-1 mt-0.5">
                      <Users size={13} className="text-brand" />
                      <span>{res.partySize} People</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-text-muted block text-[10px] uppercase">Table</span>
                    <span className="font-semibold text-text-primary block mt-0.5">
                      {res.tableNumber ? `Table ${res.tableNumber}` : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {res.specialNote && (
                  <div className="p-2 rounded bg-surface-elevated/40 text-xs text-text-secondary border border-surface-border/40">
                    <strong className="text-text-muted">Note:</strong> &ldquo;{res.specialNote}&rdquo;
                  </div>
                )}

                {/* Management Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-surface-border/40">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        disabled={actionInProgress === res.id}
                        onClick={() => handleUpdateStatus(res.id, 'confirmed')}
                        className="btn-primary btn-sm text-xs inline-flex items-center gap-1"
                      >
                        <Check size={14} />
                        <span>Confirm Booking</span>
                      </button>
                      <button
                        type="button"
                        disabled={actionInProgress === res.id}
                        onClick={() => {
                          setSelectedResId(res.id);
                          setRejectModalOpen(true);
                        }}
                        className="btn-danger btn-sm text-xs inline-flex items-center gap-1"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {isConfirmed && (
                    <>
                      <button
                        type="button"
                        disabled={actionInProgress === res.id}
                        onClick={() => handleUpdateStatus(res.id, 'completed')}
                        className="btn-primary btn-sm text-xs inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500"
                      >
                        <CheckCircle size={14} />
                        <span>Mark Completed / Seated</span>
                      </button>
                      <button
                        type="button"
                        disabled={actionInProgress === res.id}
                        onClick={() => handleUpdateStatus(res.id, 'cancelled', { cancellationReason: 'Owner cancelled' })}
                        className="btn-ghost btn-sm text-xs text-status-occupied hover:bg-status-occupied/10"
                      >
                        <span>Cancel Booking</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in">
          <div className="card max-w-sm w-full space-y-4 border border-surface-border shadow-2xl">
            <div className="flex items-center gap-2 text-status-occupied">
              <AlertCircle size={20} />
              <h3 className="font-bold text-base">Reject Reservation</h3>
            </div>
            <p className="text-xs text-text-secondary">
              Please provide a brief reason why this booking cannot be accommodated:
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Fully booked during this time slot, private event"
              rows={3}
              className="input text-xs w-full resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalOpen(false);
                  setSelectedResId(null);
                  setRejectionReason('');
                }}
                className="btn-ghost btn-sm text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="btn-danger btn-sm text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
