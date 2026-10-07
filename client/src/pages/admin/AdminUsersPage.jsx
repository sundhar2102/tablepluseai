import { useState } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Shield,
  MoreVertical,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const INITIAL_USERS = [
  {
    id: 1,
    name: 'Verification Customer',
    email: 'testuser_stage5@smarttable.ai',
    phone: '+91 98400 11223',
    role: 'customer',
    bookingsCount: 4,
    status: 'ACTIVE',
    joinedAt: 'Oct 04, 2026',
  },
  {
    id: 2,
    name: 'Priya Sundaram',
    email: 'priya.sundaram@gmail.com',
    phone: '+91 97909 44556',
    role: 'customer',
    bookingsCount: 7,
    status: 'ACTIVE',
    joinedAt: 'Sep 28, 2026',
  },
  {
    id: 3,
    name: 'Karthik Raja',
    email: 'karthik.raja@yahoo.co.in',
    phone: '+91 94441 78901',
    role: 'customer',
    bookingsCount: 1,
    status: 'ACTIVE',
    joinedAt: 'Sep 15, 2026',
  },
  {
    id: 4,
    name: 'Ananya Deshmukh',
    email: 'ananya.deshmukh@outlook.com',
    phone: '+91 98202 33445',
    role: 'customer',
    bookingsCount: 3,
    status: 'SUSPENDED',
    joinedAt: 'Aug 10, 2026',
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState('');

  const toggleUserStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const next = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          toast.success(`Account for ${u.name} set to ${next}`);
          return { ...u, status: next };
        }
        return u;
      })
    );
  };

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Customer User Management"
        subtitle="View registered dining accounts, reservation history, and active status controls."
      />

      <div className="card p-4 border border-surface-border flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diners by name or email..."
            className="input pl-9 text-xs w-full"
          />
        </div>
        <span className="text-xs text-text-muted">Total: {filtered.length} customers</span>
      </div>

      <div className="card p-0 border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated/70 text-text-muted uppercase text-[10px] font-bold border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Bookings</th>
                <th className="py-3 px-4">Member Since</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50 text-text-secondary">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-surface-elevated/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-text-primary">
                    {u.name}
                  </td>
                  <td className="py-3 px-4 space-y-0.5">
                    <p className="text-[11px] text-text-primary flex items-center gap-1">
                      <Mail size={11} className="text-brand" />
                      <span>{u.email}</span>
                    </p>
                    <p className="text-[10px] text-text-muted flex items-center gap-1">
                      <Phone size={10} />
                      <span>{u.phone}</span>
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-brand">
                    {u.bookingsCount}
                  </td>
                  <td className="py-3 px-4 text-text-muted text-[11px]">
                    {u.joinedAt}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`badge text-[10px] font-bold ${
                        u.status === 'ACTIVE'
                          ? 'bg-status-available/15 text-status-available border-status-available/30'
                          : 'bg-status-occupied/15 text-status-occupied border-status-occupied/30'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleUserStatus(u.id)}
                      className={`text-[11px] py-1 px-2.5 rounded-md font-semibold border transition-all ${
                        u.status === 'ACTIVE'
                          ? 'border-status-occupied/30 text-status-occupied hover:bg-status-occupied/10'
                          : 'border-status-available/30 text-status-available hover:bg-status-available/10'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
