// client/src/pages/owner/OwnerSettingsPage.jsx
import { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Clock,
  Phone,
  MapPin,
  Save,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Power,
  Layers,
} from 'lucide-react';
import { ownerService } from '../../services/ownerService';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import toast from 'react-hot-toast';

export default function OwnerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    cuisine_type: '',
    phone: '',
    address: '',
    cover_photo_url: '',
    is_active: true,
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await ownerService.getRestaurant();
      setRestaurant(data);
      setForm({
        name: data.name || '',
        description: data.description || '',
        cuisine_type: data.cuisine_type || '',
        phone: data.phone || '',
        address: data.address || '',
        cover_photo_url: data.cover_photo_url || '',
        is_active: Boolean(data.is_active),
      });
    } catch (err) {
      toast.error('Failed to load restaurant profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await ownerService.updateRestaurant(form);
      toast.success('Restaurant profile updated successfully!');
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update restaurant settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading restaurant profile..." />;
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Restaurant Profile & Operational Settings"
        subtitle="Manage your public restaurant details, cuisine styles, contact phone, and operating status."
        actions={
          <button
            type="button"
            onClick={fetchProfile}
            disabled={loading}
            className="btn-outline text-xs py-2 px-3 inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Reload</span>
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Card */}
        <div className="card p-5 border border-surface-border space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Store className="text-brand" size={18} />
              <h2 className="font-bold text-sm text-text-primary">Establishment Profile</h2>
            </div>
            <span className="text-xs text-text-muted font-mono">
              Restaurant ID #{restaurant?.id}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-text-secondary">Restaurant Public Name</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="input text-xs w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-text-secondary">Cuisine Specialties</label>
                <input
                  type="text"
                  name="cuisine_type"
                  placeholder="e.g. North Indian, Biryani, Mughlai"
                  value={form.cuisine_type}
                  onChange={handleChange}
                  className="input text-xs w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-secondary">Contact Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="input text-xs w-full font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-secondary">Physical Address</label>
              <textarea
                name="address"
                rows="2"
                value={form.address}
                onChange={handleChange}
                className="input text-xs w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-secondary">Description</label>
              <textarea
                name="description"
                rows="3"
                value={form.description}
                onChange={handleChange}
                placeholder="A warm and inviting dining destination specializing in..."
                className="input text-xs w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-secondary">Cover Photo URL</label>
              <input
                type="text"
                name="cover_photo_url"
                value={form.cover_photo_url}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/..."
                className="input text-xs w-full font-mono"
              />
            </div>
          </div>
        </div>

        {/* Operational Status */}
        <div className="card p-5 border border-surface-border space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-3">
            <Power className="text-amber-400" size={18} />
            <h2 className="font-bold text-sm text-text-primary">Dining Status & Availability</h2>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated border border-surface-border">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-text-primary">Open for Dine-In</p>
              <p className="text-[11px] text-text-secondary">
                When switched off, customers will see your restaurant as currently closed for walk-ins and pre-orders.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Read-Only Turnaround Parameters */}
        <div className="card p-5 border border-surface-border space-y-3">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-3">
            <Clock className="text-blue-400" size={18} />
            <h2 className="font-bold text-sm text-text-primary">Operational Defaults</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-surface-elevated space-y-1">
              <span className="text-text-muted text-[11px]">Avg Dining Duration</span>
              <p className="font-bold font-mono text-text-primary">
                {restaurant?.avg_dining_duration_mins || 45} mins
              </p>
            </div>
            <div className="p-3 rounded-lg bg-surface-elevated space-y-1">
              <span className="text-text-muted text-[11px]">Avg Cleaning Turnover</span>
              <p className="font-bold font-mono text-text-primary">
                {restaurant?.avg_cleaning_duration_mins || 10} mins
              </p>
            </div>
            <div className="p-3 rounded-lg bg-surface-elevated space-y-1">
              <span className="text-text-muted text-[11px]">Owner User Account</span>
              <p className="font-bold text-text-primary truncate">
                {restaurant?.owner_name || 'Owner'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs py-2.5 px-6 inline-flex items-center gap-2"
          >
            <Save size={15} />
            <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
