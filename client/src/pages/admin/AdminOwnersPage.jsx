import { useState } from 'react';
import {
  UserCog,
  Store,
  Search,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const INITIAL_OWNERS = [
  {
    id: 1,
    name: 'Rahul Sharma',
    email: 'owner@demo.com',
    phone: '+91 98401 99887',
    restaurantName: 'The Spice Pavilion',
    restaurantId: 1,
    city: 'Chennai',
    status: 'ACTIVE',
    verified: true,
  },
];

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState(INITIAL_OWNERS);
  const [search, setSearch] = useState('');

  const toggleOwnerStatus = (id) => {
    setOwners((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const next = o.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          toast.success(`Owner ${o.name} account set to ${next}`);
          return { ...o, status: next };
        }
        return o;
      })
    );
  };

  const filtered = owners.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      o.restaurantName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Restaurant Owner Management"
        subtitle="Manage verified restaurant merchants, assigned establishment venues, and partner access."
      />

      <div className="card p-4 border border-surface-border flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search owners or establishments..."
            className="input pl-9 text-xs w-full"
          />
        </div>
        <span className="text-xs text-text-muted">Total: {filtered.length} merchants</span>
      </div>

      <div className="card p-0 border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated/70 text-text-muted uppercase text-[10px] font-bold border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Merchant Owner</th>
                <th className="py-3 px-4">Assigned Establishment</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Verification</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50 text-text-secondary">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-surface-elevated/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-text-primary">
                    {o.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-text-primary flex items-center gap-1.5">
                      <Store size={13} className="text-accent" />
                      <span>{o.restaurantName}</span>
                    </span>
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      {o.city} (ID: #{o.restaurantId})
                    </span>
                  </td>
                  <td className="py-3 px-4 space-y-0.5">
                    <p className="text-[11px] text-text-primary flex items-center gap-1">
                      <Mail size={11} className="text-brand" />
                      <span>{o.email}</span>
                    </p>
                    <p className="text-[10px] text-text-muted flex items-center gap-1">
                      <Phone size={10} />
                      <span>{o.phone}</span>
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold inline-flex items-center gap-1">
                      <ShieldCheck size={11} />
                      <span>Verified</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`badge text-[10px] font-bold ${
                        o.status === 'ACTIVE'
                          ? 'bg-status-available/15 text-status-available border-status-available/30'
                          : 'bg-status-occupied/15 text-status-occupied border-status-occupied/30'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleOwnerStatus(o.id)}
                      className={`text-[11px] py-1 px-2.5 rounded-md font-semibold border transition-all ${
                        o.status === 'ACTIVE'
                          ? 'border-status-occupied/30 text-status-occupied hover:bg-status-occupied/10'
                          : 'border-status-available/30 text-status-available hover:bg-status-available/10'
                      }`}
                    >
                      {o.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
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
