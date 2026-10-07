import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BellRing,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Info,
} from 'lucide-react';
import { queueService } from '../../services/queueService';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

export default function QueuePage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchQueues = useCallback(async () => {
    setLoading(true);
    const { data, error } = await queueService.getCustomerQueue();
    setLoading(false);
    if (error) {
      toast.error(error.message || 'Failed to load queue status');
    } else {
      setQueues(data || []);
    }
  }, []);

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  // Real-time socket listeners for queue updates
  useEffect(() => {
    if (!socket) return;

    // Position or status updated
    const handleQueuePosition = () => {
      fetchQueues();
      toast('Live queue positions updated ⚡', {
        icon: '👥',
        style: { background: '#1A1E2E', color: '#00C2A8' },
      });
    };

    const handleQueueStatusChanged = (payload) => {
      setQueues((prev) =>
        prev.map((item) =>
          item.id === payload.id
            ? { ...item, status: payload.status, calledAt: payload.called_at }
            : item
        )
      );

      if (payload.status === 'called') {
        toast.success('Your table is ready! Please report to the host stand within 15 minutes.', {
          duration: 8000,
          icon: '📢',
        });
      } else {
        toast(`Queue status updated: ${payload.status.toUpperCase()}`);
      }
    };

    socket.on('queue:position_updated', handleQueuePosition);
    socket.on('queue:status_changed', handleQueueStatusChanged);

    return () => {
      socket.off('queue:position_updated', handleQueuePosition);
      socket.off('queue:status_changed', handleQueueStatusChanged);
    };
  }, [socket, fetchQueues]);

  const handleCancelQueue = async (id) => {
    if (!window.confirm('Are you sure you want to leave the walk-in queue?')) return;

    setCancellingId(id);
    const { data, error } = await queueService.cancelQueue(id);
    setCancellingId(null);

    if (error) {
      toast.error(error.message || 'Failed to cancel queue entry');
    } else {
      toast.success('You have left the walk-in queue');
      setQueues((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: 'cancelled' } : q))
      );
    }
  };

  // Find active queue (waiting or called)
  const activeQueue = queues.find((q) =>
    restaurantId
      ? Number(q.restaurantId) === Number(restaurantId) && ['waiting', 'called'].includes(q.status)
      : ['waiting', 'called'].includes(q.status)
  ) || queues.find((q) => ['waiting', 'called'].includes(q.status));

  const pastQueues = queues.filter((q) => q.id !== activeQueue?.id);

  return (
    <div className="page-container py-6 space-y-6 animate-fade-in max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Restaurants</span>
        </Link>
        <button
          onClick={fetchQueues}
          disabled={loading}
          className="btn-outline btn-sm text-xs inline-flex items-center gap-1"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="spinner w-8 h-8" />
          <p className="text-xs text-text-muted">Loading queue positions...</p>
        </div>
      ) : activeQueue ? (
        <div className="space-y-4">
          {/* CALLED ALERT BANNER */}
          {activeQueue.status === 'called' && (
            <div className="p-4 rounded-xl bg-status-available/15 border-2 border-status-available animate-pulse text-status-available space-y-2">
              <div className="flex items-center gap-2 font-bold text-base">
                <BellRing size={20} />
                <span>Your Table is Ready!</span>
              </div>
              <p className="text-xs text-text-primary">
                Please proceed to the host stand at <strong>{activeQueue.restaurantName}</strong>. Your hold expires in 15 minutes.
              </p>
            </div>
          )}

          {/* MAIN ACTIVE QUEUE CARD */}
          <div className="card border border-surface-border p-5 space-y-5 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand to-emerald-400" />

            <div>
              <span className="badge bg-brand/10 text-brand border border-brand/30 mb-2">
                Live Walk-In Queue
              </span>
              <h2 className="text-xl font-bold text-text-primary">{activeQueue.restaurantName}</h2>
              {activeQueue.address && (
                <p className="text-xs text-text-muted flex items-center justify-center gap-1 mt-1">
                  <MapPin size={12} />
                  <span>{activeQueue.address}</span>
                </p>
              )}
            </div>

            {/* Position Display */}
            <div className="py-6 px-4 rounded-2xl bg-surface-elevated/40 border border-surface-border/60 max-w-sm mx-auto space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Your Current Position
              </span>
              <div className="text-5xl font-black text-brand tracking-tight">
                #{activeQueue.queuePosition}
              </div>
              <p className="text-xs text-text-secondary">
                {activeQueue.queuePosition <= 1
                  ? 'You are next in line for seating!'
                  : `${activeQueue.queuePosition - 1} party ahead of you`}
              </p>
            </div>

            {/* Rule-based Wait Time Estimate */}
            <div className="grid grid-cols-2 gap-3 text-xs max-w-sm mx-auto text-left">
              <div className="p-3 rounded-lg bg-surface-card border border-surface-border">
                <span className="text-[10px] text-text-muted uppercase block">Estimated Wait</span>
                <span className="font-bold text-base text-text-primary flex items-center gap-1 mt-0.5">
                  <Clock size={14} className="text-brand shrink-0" />
                  <span>~{activeQueue.estimatedWaitMinutes} mins</span>
                </span>
                <span className="text-[10px] text-text-disabled block mt-0.5">Rule-based formula</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-card border border-surface-border">
                <span className="text-[10px] text-text-muted uppercase block">Party Size</span>
                <span className="font-bold text-base text-text-primary flex items-center gap-1 mt-0.5">
                  <Users size={14} className="text-brand shrink-0" />
                  <span>{activeQueue.partySize} Guests</span>
                </span>
                <span className="text-[10px] text-text-disabled block mt-0.5">Walk-in party</span>
              </div>
            </div>

            {/* Transparent Algorithm Disclaimer */}
            <div className="p-2.5 rounded-lg bg-surface-elevated/50 text-[11px] text-text-muted flex items-start gap-2 text-left">
              <Info size={14} className="text-brand shrink-0 mt-0.5" />
              <div>
                <strong>RULE_BASED: </strong>
                <span>
                  Wait times are calculated operationally based on queue position and table turnover duration. This is not an AI/ML prediction.
                </span>
              </div>
            </div>

            {/* Cancel Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={cancellingId === activeQueue.id}
                onClick={() => handleCancelQueue(activeQueue.id)}
                className="btn-danger btn-sm text-xs w-full max-w-sm mx-auto"
              >
                {cancellingId === activeQueue.id ? 'Leaving Queue...' : 'Leave Virtual Queue'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 space-y-4">
          <Users size={40} className="mx-auto text-text-disabled" />
          <div>
            <h3 className="text-base font-bold text-text-primary">Not In Any Queue</h3>
            <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
              You are not currently in any walk-in waitlist. Visit a restaurant to join their virtual queue.
            </p>
          </div>
          <Link to="/app" className="btn-primary btn-sm inline-flex items-center gap-1.5">
            <span>Find Restaurants</span>
          </Link>
        </div>
      )}

      {/* Recent / Past Queues */}
      {pastQueues.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-surface-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Past Queue History
          </h3>
          <div className="space-y-2">
            {pastQueues.map((q) => (
              <div
                key={q.id}
                className="card p-3 flex items-center justify-between text-xs border border-surface-border/50"
              >
                <div>
                  <h4 className="font-semibold text-text-primary">{q.restaurantName}</h4>
                  <p className="text-[11px] text-text-muted">
                    Party of {q.partySize} • Joined {new Date(q.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span
                    className={`badge ${
                      q.status === 'seated'
                        ? 'bg-status-available/15 text-status-available'
                        : 'bg-surface-elevated text-text-disabled'
                    }`}
                  >
                    {q.status}
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
