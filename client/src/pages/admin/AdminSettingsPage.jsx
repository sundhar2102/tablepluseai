import { useState } from 'react';
import {
  Settings,
  Shield,
  Server,
  Database,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    cacheTtlMinutes: 10,
    maxRadiusKm: 20,
    overpassTimeoutSeconds: 25,
    rateLimitPerWindow: 120,
    maintenanceMode: false,
    debugLogging: false,
    enforceStrictCors: true,
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Platform system configuration updated!');
    }, 600);
  };

  const handlePurgeCache = () => {
    toast.success('Overpass in-memory cache purged successfully!');
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <PageHeader
        title="Platform System Settings"
        subtitle="Configure backend caching policies, Overpass rate limit parameters, and platform security."
      />

      <form onSubmit={handleSave} className="space-y-5">
        {/* Geospatial & Overpass Cache Configuration */}
        <div className="card p-5 border border-surface-border space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border/50 pb-2.5">
            <div className="flex items-center gap-2">
              <Server className="text-accent" size={18} />
              <h2 className="font-bold text-sm text-text-primary">
                Geospatial & Overpass Proxy Engine
              </h2>
            </div>
            <button
              type="button"
              onClick={handlePurgeCache}
              className="text-xs text-text-muted hover:text-red-400 inline-flex items-center gap-1"
            >
              <RefreshCw size={11} />
              <span>Purge Cache</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-text-secondary">Cache TTL (Minutes)</label>
              <input
                type="number"
                name="cacheTtlMinutes"
                value={form.cacheTtlMinutes}
                onChange={handleChange}
                className="input text-xs w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-secondary">Default Max Radius (km)</label>
              <input
                type="number"
                name="maxRadiusKm"
                value={form.maxRadiusKm}
                onChange={handleChange}
                className="input text-xs w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-secondary">Overpass Timeout (s)</label>
              <input
                type="number"
                name="overpassTimeoutSeconds"
                value={form.overpassTimeoutSeconds}
                onChange={handleChange}
                className="input text-xs w-full"
              />
            </div>
          </div>
        </div>

        {/* Security & Maintenance */}
        <div className="card p-5 border border-surface-border space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-2.5">
            <Shield className="text-accent" size={18} />
            <h2 className="font-bold text-sm text-text-primary">Security & Access Safeguards</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-text-secondary">API Rate Limit (Reqs / 15 mins)</label>
              <input
                type="number"
                name="rateLimitPerWindow"
                value={form.rateLimitPerWindow}
                onChange={handleChange}
                className="input text-xs w-full max-w-xs"
              />
            </div>

            <div className="pt-2 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer text-text-secondary">
                <input
                  type="checkbox"
                  name="enforceStrictCors"
                  checked={form.enforceStrictCors}
                  onChange={handleChange}
                  className="rounded border-surface-border text-accent focus:ring-accent accent-accent"
                />
                <span>Enforce strict CORS origin filtering for API endpoints</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-text-secondary">
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={form.maintenanceMode}
                  onChange={handleChange}
                  className="rounded border-surface-border text-red-500 focus:ring-red-500 accent-red-500"
                />
                <span className="text-red-400 font-medium">
                  Enable Maintenance Mode (Restricts diner access to readonly discovery)
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs py-2.5 px-5 inline-flex items-center gap-2 font-bold bg-accent hover:bg-accent/80 text-surface-bg"
          >
            <Save size={14} />
            <span>{saving ? 'Saving System Rules...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
