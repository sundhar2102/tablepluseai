import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import SmartTableLogo from '../../components/common/SmartTableLogo';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your account email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate password reset verification instructions
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Password reset instructions sent!');
    }, 900);
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center px-4 py-8">
      {/* Brand Header */}
      <div className="mb-6 text-center animate-fade-in flex flex-col items-center">
        <SmartTableLogo variant="full" size="md" />
        <h1 className="text-xl font-bold text-text-primary mt-2">Reset Password</h1>
        <p className="text-text-secondary text-xs mt-0.5">
          Recover your Smart Table AI account access
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm card p-6 border border-surface-border animate-slide-up space-y-4">
        {submitted ? (
          <div className="text-center space-y-4 py-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-text-primary">Check Your Email</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                We've sent password reset instructions and a verification link to <strong className="text-text-primary">{email}</strong>.
              </p>
            </div>

            <div className="pt-2 border-t border-surface-border">
              <Link
                to="/login"
                className="btn-primary w-full py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-text-secondary">
                Enter the email address associated with your account, and we'll send you instructions to reset your password.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="reset-email" className="input-label text-xs">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="you@example.com"
                  className={`input pl-10 text-xs w-full ${error ? 'border-status-occupied' : ''}`}
                />
              </div>
              {error && <p className="input-error text-[11px]">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Sending Instructions...</span>
                </>
              ) : (
                <>
                  <KeyRound size={14} />
                  <span>Send Reset Instructions</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center border-t border-surface-border">
              <Link
                to="/login"
                className="text-xs text-text-secondary hover:text-brand inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft size={12} />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
