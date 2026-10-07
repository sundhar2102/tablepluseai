import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  CalendarDays,
  Users,
  LogOut,
  ShieldCheck,
  Save,
  KeyRound,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function CustomerProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Edit personal info form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const { data, error } = await authService.getMe();
      setLoading(false);
      if (error) {
        toast.error(error.message || 'Failed to load profile');
      } else if (data) {
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
      }
    }
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setSavingProfile(true);
    const { data, error } = await authService.updateMe({
      name: name.trim(),
      phone: phone.trim() || undefined,
    });
    setSavingProfile(false);

    if (error) {
      toast.error(error.message || 'Failed to update profile');
    } else {
      toast.success('Profile updated successfully!');
      setProfile(data);
      if (refreshUser) refreshUser();
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    const { error } = await authService.changePassword({
      currentPassword,
      newPassword,
    });
    setChangingPassword(false);

    if (error) {
      toast.error(error.message || 'Failed to change password');
    } else {
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="page-container py-12 flex flex-col items-center justify-center space-y-3">
        <div className="spinner w-8 h-8" />
        <p className="text-xs text-text-muted">Loading your profile...</p>
      </div>
    );
  }

  const initial = (profile?.name || user?.name || 'C').charAt(0).toUpperCase();

  return (
    <div className="page-container py-6 space-y-6 animate-fade-in max-w-xl mx-auto">
      {/* Header Profile Card */}
      <div className="card p-5 border border-surface-border space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand to-emerald-400 flex items-center justify-center text-surface-bg text-2xl font-black shadow-lg shadow-brand/20">
            {initial}
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <h1 className="text-lg font-bold text-text-primary truncate">
              {profile?.name || user?.name || 'Customer'}
            </h1>
            <p className="text-xs text-text-muted flex items-center gap-1.5 truncate">
              <Mail size={13} className="shrink-0 text-brand" />
              <span>{profile?.email || user?.email}</span>
            </p>
            {profile?.phone && (
              <p className="text-xs text-text-muted flex items-center gap-1.5 truncate">
                <Phone size={13} className="shrink-0 text-brand" />
                <span>{profile.phone}</span>
              </p>
            )}
          </div>
          <span className="badge bg-brand/15 text-brand border border-brand/30 self-start text-[11px] uppercase tracking-wider font-semibold">
            {profile?.role || 'Customer'}
          </span>
        </div>

        {profile?.created_at && (
          <div className="pt-2 border-t border-surface-border/50 text-[11px] text-text-disabled flex items-center gap-1">
            <Clock size={12} />
            <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/app/bookings"
          className="card p-3 border border-surface-border hover:border-brand/50 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center text-brand">
              <CalendarDays size={18} />
            </div>
            <div>
              <span className="font-bold text-xs text-text-primary block group-hover:text-brand transition-colors">
                My Bookings
              </span>
              <span className="text-[10px] text-text-muted">Table reservations</span>
            </div>
          </div>
          <ChevronRight size={14} className="text-text-muted group-hover:text-brand transition-colors" />
        </Link>

        <Link
          to="/app/queue"
          className="card p-3 border border-surface-border hover:border-brand/50 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center text-brand">
              <Users size={18} />
            </div>
            <div>
              <span className="font-bold text-xs text-text-primary block group-hover:text-brand transition-colors">
                Live Queue
              </span>
              <span className="text-[10px] text-text-muted">Virtual waitlist</span>
            </div>
          </div>
          <ChevronRight size={14} className="text-text-muted group-hover:text-brand transition-colors" />
        </Link>
      </div>

      {/* Edit Personal Information */}
      <div className="card p-5 border border-surface-border space-y-4">
        <div className="flex items-center gap-2 border-b border-surface-border/50 pb-2.5">
          <User className="text-brand" size={18} />
          <h2 className="font-bold text-sm text-text-primary">Personal Information</h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-text-secondary">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input text-xs w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-secondary">Email Address</label>
            <input
              type="email"
              disabled
              value={profile?.email || ''}
              className="input text-xs w-full bg-surface-elevated/40 text-text-disabled cursor-not-allowed"
            />
            <span className="text-[10px] text-text-muted">Email address cannot be changed.</span>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-secondary">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="input text-xs w-full"
            />
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary btn-sm text-xs inline-flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="card p-5 border border-surface-border space-y-4">
        <div className="flex items-center gap-2 border-b border-surface-border/50 pb-2.5">
          <Lock className="text-brand" size={18} />
          <h2 className="font-bold text-sm text-text-primary">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-text-secondary">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input text-xs w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-text-secondary">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input text-xs w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-secondary">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input text-xs w-full"
              />
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
            >
              <KeyRound size={14} />
              <span>{changingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="btn-danger w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          <span>Log Out of TablePulse</span>
        </button>
      </div>
    </div>
  );
}
