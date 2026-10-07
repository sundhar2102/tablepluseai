import React, { useState, useEffect } from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';

/**
 * OfflineBanner — Displays non-intrusive status notification when network connectivity is lost.
 * Conforms to Requirement 7:
 * "When internet/network is unavailable:
 *  Show: 'You're offline. Some live features are temporarily unavailable.'
 *  The application should not crash."
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-[#1E293B] border border-amber-500/40 text-amber-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in"
    >
      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
        <WifiOff size={18} />
      </div>
      <div className="flex-1 text-xs">
        <p className="font-semibold text-amber-300">Offline Mode</p>
        <p className="text-amber-200/80 mt-0.5">
          You're offline. Some live features are temporarily unavailable.
        </p>
      </div>
    </div>
  );
}
