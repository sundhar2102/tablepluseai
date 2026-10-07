// client/src/pages/owner/OwnerCustomersPage.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  ShoppingBag,
  CalendarDays,
  IndianRupee,
  RefreshCw,
  Phone,
  UserCheck,
  Clock,
} from 'lucide-react';
import { ownerService } from '../../services/ownerService';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import toast from 'react-hot-toast';

export default function OwnerCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ownerService.getCustomers();
      setCustomers(res || []);
    } catch (err) {
      console.error('Failed to load customers', err);
      toast.error('Failed to load restaurant diners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      String(c.id).includes(q)
    );
  });

  const totalDiners = customers.length;
  const repeatDiners = customers.filter((c) => c.totalOrders > 1).length;
  const totalSpend = customers.reduce((acc, curr) => acc + (curr.totalSpend || 0), 0);

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Customer Dining History"
        subtitle="View diners who placed orders or made reservations at your restaurant."
        actions={
          <button
            type="button"
            onClick={fetchCustomers}
            disabled={loading}
            className="btn-outline text-xs py-2 px-3 inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="card p-4 border border-surface-border space-y-1 bg-gradient-to-br from-brand/10 to-transparent">
          <span className="text-xs text-text-muted">Total Unique Diners</span>
          <p className="text-2xl font-bold font-mono text-brand">{totalDiners}</p>
          <span className="text-[10px] text-text-secondary">Registered customer profiles</span>
        </div>

        <div className="card p-4 border border-surface-border space-y-1 bg-gradient-to-br from-purple-500/10 to-transparent">
          <span className="text-xs text-text-muted">Repeat Visitors</span>
          <p className="text-2xl font-bold font-mono text-purple-400">{repeatDiners}</p>
          <span className="text-[10px] text-purple-400 font-semibold">
            {totalDiners > 0 ? Math.round((repeatDiners / totalDiners) * 100) : 0}% repeat rate
          </span>
        </div>

        <div className="card p-4 border border-surface-border space-y-1 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <span className="text-xs text-text-muted">Total Diners Spend</span>
          <p className="text-2xl font-bold font-mono text-emerald-400">₹{Math.round(totalSpend).toLocaleString()}</p>
          <span className="text-[10px] text-text-secondary">Total revenue generated</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-4 border border-surface-border">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search diners by name, phone number or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-xs w-full"
          />
        </div>
      </div>

      {/* Customer List Table */}
      {loading ? (
        <LoadingState message="Loading dining customers..." />
      ) : filteredCustomers.length === 0 ? (
        <div className="card text-center py-16 px-4 space-y-3 border border-surface-border">
          <Users size={32} className="text-text-disabled mx-auto" />
          <h3 className="font-bold text-base text-text-primary">
            {customers.length === 0 ? 'No customers yet' : 'No customer records match your search'}
          </h3>
          <p className="text-xs text-text-muted">
            {customers.length === 0
              ? 'When customers place orders or make reservations at your restaurant, their dining profiles will appear here.'
              : 'Try searching with a different name or phone number.'}
          </p>
        </div>
      ) : (
        <div className="card border border-surface-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated border-b border-surface-border text-text-secondary font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5 text-center">Orders</th>
                  <th className="p-3.5 text-center">Reservations</th>
                  <th className="p-3.5 text-right">Lifetime Spend</th>
                  <th className="p-3.5 text-right">Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50 text-text-primary">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="p-3.5 font-medium flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand/15 text-brand flex items-center justify-center font-bold text-xs">
                        {c.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <p className="font-bold text-text-primary">{c.name}</p>
                        <p className="text-[10px] text-text-muted">User #{c.id}</p>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-text-secondary">
                      {c.phone || '—'}
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold">
                      <span className="px-2 py-0.5 rounded bg-surface-elevated text-text-primary">
                        {c.totalOrders}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">
                        {c.totalReservations}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                      ₹{c.totalSpend.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right text-text-muted font-mono text-[11px]">
                      {c.lastVisitDate ? new Date(c.lastVisitDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
