import React from 'react';

/**
 * SmartTableLogo — Official Vector Logo for Smart Table AI.
 * 
 * Communicates:
 * - Restaurant Dining Table (perspective surface)
 * - Digital Connectivity / Seating Nodes (interactive signal pips)
 * - AI Intelligence Pulse (central neural interconnect ring)
 * 
 * Props:
 * - variant: 'full' (icon + text + badge) | 'icon' (icon mark only) | 'horizontal'
 * - size: 'sm' | 'md' | 'lg' | 'xl'
 * - subtitle: string (e.g., 'Owner Portal', 'Super Admin', 'Dining Platform')
 * - className: custom styling string
 */
export default function SmartTableLogo({
  variant = 'full',
  size = 'md',
  subtitle = null,
  className = ''
}) {
  const sizeMap = {
    sm: { icon: 28, text: 'text-base',  badge: 'text-[9px] px-1 py-0.2', sub: 'text-[10px]' },
    md: { icon: 34, text: 'text-lg',    badge: 'text-[10px] px-1.5 py-0.5', sub: 'text-xs' },
    lg: { icon: 42, text: 'text-2xl',   badge: 'text-xs px-2 py-0.5',      sub: 'text-sm' },
    xl: { icon: 56, text: 'text-3xl',   badge: 'text-sm px-2.5 py-1',      sub: 'text-base' },
  };

  const dim = sizeMap[size] || sizeMap.md;

  const IconSvg = (
    <div
      style={{ width: dim.icon, height: dim.icon }}
      className="relative flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0F172A] to-[#020617] p-1.5 shadow-md border border-surface-border group-hover:border-brand/40 transition-all duration-300"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="logoTableGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5C0" />
            <stop offset="100%" stopColor="#00A389" />
          </linearGradient>
          <linearGradient id="logoPulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#00E5C0" />
          </linearGradient>
        </defs>

        {/* Outer subtle glow boundary */}
        <rect x="2" y="2" width="60" height="60" rx="14" stroke="#1E293B" strokeWidth="1" />

        {/* Dining Table Surface */}
        <rect x="18" y="20" width="28" height="24" rx="7" fill="url(#logoTableGrad)" />

        {/* 4 Seating & Connectivity Signal Pips */}
        <circle cx="32" cy="11" r="3.5" fill="#38BDF8" />
        <circle cx="32" cy="53" r="3.5" fill="#38BDF8" />
        <circle cx="9" cy="32" r="3.5" fill="#38BDF8" />
        <circle cx="55" cy="32" r="3.5" fill="#38BDF8" />

        {/* Signal Lines */}
        <path
          d="M32 15V20M32 44V49M13 32H18M46 32H51"
          stroke="#38BDF8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="1 2"
        />

        {/* Central AI Processor Core */}
        <circle cx="32" cy="32" r="6" fill="#0F172A" />
        <circle cx="32" cy="32" r="3" fill="url(#logoPulseGrad)" />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{IconSvg}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {IconSvg}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold tracking-tight text-text-primary ${dim.text} select-none`}>
            Smart Table
          </span>
          <span className={`font-black rounded bg-brand/15 text-brand border border-brand/30 tracking-wider ${dim.badge} select-none`}>
            AI
          </span>
        </div>
        {subtitle && (
          <span className={`text-text-muted font-medium mt-1 select-none ${dim.sub}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
