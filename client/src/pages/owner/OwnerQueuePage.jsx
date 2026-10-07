import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Clock,
  CheckCircle,
  BellRing,
  XCircle,
  RefreshCw,
  Phone,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { queueService } from '../../services/queueService';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

export default function OwnerQueuePage() {
  const { socket } = useSocket();

  const [queueData, setQueueData] = useState({ totalWaiting: 0, totalCalled: 0, queue: [] });
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    const { data, error } = await queueService.getOwnerQueue();
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to load walk-in queue');
    } else {
      setQueueData(data || { totalWaiting: 0, totalCalled: 0, queue: [] });
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Real-time Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    const handleQueueJoined = (payload) => {
      toast(`Party of ${payload.partySize} joined the walk-in waitlist! 👥`, {
        icon: '🔔',
      });
      fetchQueue();
    };

    const handleQueuePosition = () => {
      fetchQueue();
    };

    const handleStatusChanged = (payload) => {
      setQueueData((prev) => ({
        ...prev,
        queue: prev.queue.map((q) => (q.id === payload.id ? { ...q, status: payload.status } : q)),
      }));
    };

    socket.on('queue:joined', handleQueueJoined);
    socket.on('queue:position_updated', handleQueuePosition);
    socket.on('queue:status_changed', handleStatusChanged);

    return () => {
      socket.off('queue:joined', handleQueueJoined);
      socket.off('queue:position_updated', handleQueuePosition);
      socket.off('queue:status_changed', handleStatusChanged);
    };
  }, [socket, fetchQueue]);

  const handleUpdateStatus = async (id, status) => {
    setActionInProgress(id);
    const { data, error } = await queueService.updateOwnerQueueStatus(id, { status });
    setActionInProgress(null);

    if (error) {
      toast.error(error.message || 'Failed to update queue entry');
    } else {
      toast.success(`Customer updated to: ${status.toUpperCase()}`);
      fetchQueue();
    }
  };

  const activeEntries = queueData.queue.filter((q) => ['waiting', 'called'].includes(q.status));
  const pastEntries = queueData.queue.filter((q) => !['waiting', 'called'].includes(q.status));

  return (
    <div className="page-container py-6 space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Users className="text-brand" size={24} />
            <span>Virtual Walk-In Queue</span>
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage live waitlist, notify called parties, and seat arriving walk-in guests
          </p>
        </div>
        <button
          onClick={fetchQueue}
          disabled={loading}
          className="btn-outline btn-sm text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4 text-center border border-surface-border">
          <span className="text-[11px] text-text-muted uppercase">Waiting in Line</span>
          <span className="text-3xl font-black text-brand block mt-1">
            {queueData.totalWaiting}
          </span>
          <span className="text-[10px] text-text-disabled">Active waitlist count</span>
        </div>

        <div className="card p-4 text-center border border-surface-border bg-status-available/5">
          <span className="text-[11px] text-status-available uppercase font-semibold">
            Called / Ready
          </span>
          <span className="text-3xl font-black text-status-available block mt-1">
            {queueData.totalCalled}
          </span>
          <span className="text-[10px] text-text-disabled">Awaiting host seating</span>
        </div>

        <div className="card p-4 text-center border border-surface-border col-span-2 sm:col-span-1">
          <span className="text-[11px] text-text-muted uppercase">Turnover Pace</span>
          <span className="text-sm font-semibold text-text-primary block mt-2">
            Rule-Based Turnover
          </span>
          <span className="text-[10px] text-text-muted">Calculated per operational metrics</span>
        </div>
      </div>

      {/* Live Queue Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <span>Active Waitlist</span>
          <span className="badge bg-brand/10 text-brand border border-brand/30">
            {activeEntries.length} Active
          </span>
        </h2>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="spinner w-8 h-8" />
            <p className="text-xs text-text-muted">Loading live queue...</p>
          </div>
        ) : activeEntries.length === 0 ? (
          <div className="card text-center py-12 space-y-2 border border-surface-border">
            <Users size={36} className="mx-auto text-text-disabled" />
            <h3 className="font-semibold text-text-primary">Waitlist is Clear</h3>
            <p className="text-xs text-text-muted">
              No walk-in customers are currently waiting in the virtual queue.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeEntries.map((item) => {
              const isCalled = item.status === 'called';

              return (
                <div
                  key={item.id}
                  className={`card p-4 border transition-all space-y-3 ${
                    isCalled
                      ? 'border-status-available bg-status-available/5 shadow-md shadow-status-available/10'
                      : 'border-surface-border hover:border-brand/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center font-black text-lg text-brand">
                        #{item.queuePosition}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-text-primary">
                            {item.customerName}
                          </h3>
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Phone size={11} />
                            <span>{item.customerPhone}</span>
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                          Party of <strong>{item.partySize} guests</strong> • Joined at{' '}
                          {new Date(item.joinedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="self-start sm:self-auto">
                      {isCalled ? (
                        <span className="badge bg-status-available/20 text-status-available border border-status-available font-bold flex items-center gap-1.5 animate-pulse">
                          <BellRing size={13} />
                          <span>CALLED (Awaiting Seating)</span>
                        </span>
                      ) : (
                        <span className="badge bg-status-reserved/15 text-status-reserved border border-status-reserved/30 flex items-center gap-1">
                          <Clock size={13} />
                          <span>WAITING IN QUEUE</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-surface-border/50 text-xs">
                    {!isCalled && (
                      <button
                        type="button"
                        disabled={actionInProgress === item.id}
                        onClick={() => handleUpdateStatus(item.id, 'called')}
                        className="btn-primary btn-sm text-xs inline-flex items-center gap-1.5"
                      >
                        <BellRing size={13} />
                        <span>Call Customer (Notify)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={actionInProgress === item.id}
                      onClick={() => handleUpdateStatus(item.id, 'seated')}
                      className="btn-primary btn-sm text-xs inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500"
                    >
                      <UserCheck size={13} />
                      <span>Seat Customer</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionInProgress === item.id}
                      onClick={() => handleUpdateStatus(item.id, 'cancelled')}
                      className="btn-ghost btn-sm text-xs text-status-occupied hover:bg-status-occupied/10"
                    >
                      <span>Cancel / No Show</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History / Completed Seated */}
      {pastEntries.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-surface-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Recent Completed Walk-ins ({pastEntries.length})
          </h3>
          <div className="space-y-2">
            {pastEntries.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="card p-3 flex items-center justify-between text-xs border border-surface-border/40"
              >
                <div>
                  <span className="font-semibold text-text-primary">{p.customerName}</span>
                  <span className="text-text-muted ml-2">Party of {p.partySize}</span>
                </div>
                <div>
                  <span
                    className={`badge text-[11px] ${
                      p.status === 'seated'
                        ? 'bg-status-available/15 text-status-available'
                        : 'bg-surface-elevated text-text-disabled'
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
