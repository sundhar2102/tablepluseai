import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  ClipboardCheck,
  Users,
  UserCog,
  BarChart3,
  Shield,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Server,
  RefreshCw,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success('Admin platform statistics synchronized!');
    }, 600);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="TablePulse AI platform oversight, merchant partner approvals, user management, and system telemetry."
        badge={
          <span className="badge bg-accent/15 text-accent border border-accent/30 text-[11px] font-bold">
            SUPER ADMIN
          </span>
        }
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-outline text-xs py-2 px-3 inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Sync Stats</span>
          </button>
        }
      />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="card p-4 border border-surface-border space-y-1.5 bg-gradient-to-br from-accent/10 to-transparent">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Main Restaurant</span>
            <Store size={16} className="text-accent" />
          </div>
          <p className="text-lg font-bold text-accent truncate">TablePulse</p>
          <span className="text-[10px] text-emerald-400 font-semibold">100% active operational</span>
        </div>

        <div className="card p-4 border border-surface-border space-y-1.5 bg-gradient-to-br from-amber-500/10 to-transparent">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Restaurant Owner</span>
            <ClipboardCheck size={16} className="text-amber-400" />
          </div>
          <p className="text-lg font-bold text-amber-400 truncate">Rahul Sharma</p>
          <span className="text-[10px] text-amber-400 font-semibold">Verified Merchant</span>
        </div>

        <div className="card p-4 border border-surface-border space-y-1.5 bg-gradient-to-br from-blue-500/10 to-transparent">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Registered Diners</span>
            <Users size={16} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-blue-400">1,240</p>
          <span className="text-[10px] text-emerald-400 font-semibold">Live customer accounts</span>
        </div>

        <div className="card p-4 border border-surface-border space-y-1.5 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Active Dining Tables</span>
            <Activity size={16} className="text-status-available" />
          </div>
          <p className="text-2xl font-bold font-mono text-status-available">12</p>
          <span className="text-[10px] text-text-muted">Live IoT table mesh enabled</span>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Platform Administration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            to="/admin/approvals"
            className="card p-4 border border-surface-border hover:border-accent/40 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ClipboardCheck size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text-primary group-hover:text-amber-400 transition-colors">
                  Merchant Approvals
                </h3>
                <p className="text-[11px] text-text-muted">Review new restaurant partners</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-text-muted group-hover:text-amber-400 transition-colors" />
          </Link>

          <Link
            to="/admin/restaurants"
            className="card p-4 border border-surface-border hover:border-accent/40 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <Store size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors">
                  Restaurant Directory
                </h3>
                <p className="text-[11px] text-text-muted">Manage active partner listings</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-text-muted group-hover:text-accent transition-colors" />
          </Link>

          <Link
            to="/admin/users"
            className="card p-4 border border-surface-border hover:border-accent/40 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text-primary group-hover:text-blue-400 transition-colors">
                  User Accounts
                </h3>
                <p className="text-[11px] text-text-muted">Customer & owner profiles</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-text-muted group-hover:text-blue-400 transition-colors" />
          </Link>
        </div>
      </div>

      {/* System Health & Architecture Status */}
      <div className="card p-5 border border-surface-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Server size={16} className="text-accent" />
              <span>Platform Microservices & Services Health</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Real-time connectivity and status across TablePulse AI infrastructure
            </p>
          </div>
          <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
            ALL SYSTEMS NORMAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border space-y-1">
            <span className="text-text-muted block text-[10px] uppercase font-bold">MySQL Relational DB</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 size={13} />
              <span>Connected (Port 3306)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border space-y-1">
            <span className="text-text-muted block text-[10px] uppercase font-bold">Socket.IO Event Mesh</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 size={13} />
              <span>Active WebSocket Pool</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border space-y-1">
            <span className="text-text-muted block text-[10px] uppercase font-bold">Overpass API Engine</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 size={13} />
              <span>4 Redundant Mirrors OK</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border space-y-1">
            <span className="text-text-muted block text-[10px] uppercase font-bold">Haversine Distance Unit</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 size={13} />
              <span>Backend Authoritative</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
