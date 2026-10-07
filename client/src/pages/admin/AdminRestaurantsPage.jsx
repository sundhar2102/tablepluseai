import { useState } from 'react';
import {
  Store,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  Phone,
  Grid2X2,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const INITIAL_RESTAURANTS = [
  {
    id: 1,
    name: 'The Spice Pavilion',
    cuisine: 'Multi-Cuisine & Contemporary',
    city: 'Chennai',
    area: 'T. Nagar',
    phone: '+91 44 2434 5678',
    status: 'ACTIVE',
    tablesCount: 12,
    rating: 4.8,
  },
];

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState(INITIAL_RESTAURANTS);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('ALL');
  const [selectedRest, setSelectedRest] = useState(null);

  const toggleStatus = (id) => {
    setRestaurants((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const next = r.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          toast.success(`${r.name} status updated to ${next}`);
          return { ...r, status: next };
        }
        return r;
      })
    );
  };

  const filtered = restaurants.filter((r) => {
    if (filterCity !== 'ALL' && r.city !== filterCity) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Restaurant Directory"
        subtitle="Manage verified partner establishments, live table capacities, and active operational status."
      />

      {/* Filter and Search Bar */}
      <div className="card p-4 border border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurant or cuisine..."
            className="input pl-9 text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-text-muted">City:</span>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="input text-xs py-1.5 px-3"
          >
            <option value="ALL">All Cities</option>
            <option value="Chennai">Chennai</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Hyderabad">Hyderabad</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated/70 text-text-muted uppercase text-[10px] font-bold border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Restaurant</th>
                <th className="py-3 px-4">Area / City</th>
                <th className="py-3 px-4">Cuisine</th>
                <th className="py-3 px-4 text-center">Tables</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50 text-text-secondary">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-surface-elevated/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-text-primary">
                    {r.name}
                  </td>
                  <td className="py-3 px-4 flex items-center gap-1">
                    <MapPin size={12} className="text-brand shrink-0" />
                    <span>{r.area}, {r.city}</span>
                  </td>
                  <td className="py-3 px-4 truncate max-w-[200px]">
                    {r.cuisine}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-text-primary">
                    {r.tablesCount}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`badge text-[10px] font-bold ${
                        r.status === 'ACTIVE'
                          ? 'bg-status-available/15 text-status-available border-status-available/30'
                          : 'bg-status-occupied/15 text-status-occupied border-status-occupied/30'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRest(r)}
                      className="btn-outline text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                    >
                      <Eye size={12} />
                      <span>Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(r.id)}
                      className={`text-[11px] py-1 px-2.5 rounded-md font-semibold border transition-all ${
                        r.status === 'ACTIVE'
                          ? 'border-status-occupied/30 text-status-occupied hover:bg-status-occupied/10'
                          : 'border-status-available/30 text-status-available hover:bg-status-available/10'
                      }`}
                    >
                      {r.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedRest}
        onClose={() => setSelectedRest(null)}
        title={selectedRest?.name}
        subtitle={`${selectedRest?.area}, ${selectedRest?.city}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-3.5 text-xs">
          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Cuisine</span>
              <span className="font-semibold text-text-primary">{selectedRest?.cuisine}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Contact Phone</span>
              <span className="font-mono text-text-primary">{selectedRest?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Live Tables Provisioned</span>
              <span className="font-mono font-bold text-brand">{selectedRest?.tablesCount} tables</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Operational State</span>
              <span className="font-bold text-status-available">{selectedRest?.status}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setSelectedRest(null)}
              className="btn-primary text-xs py-2 px-4"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
