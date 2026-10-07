/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ── Smart Table AI Design System ─────────────────────────
      // Based on approved Stage 3 UI/UX specification

      colors: {
        // Brand — Deep teal / electric teal
        brand: {
          DEFAULT: '#00C2A8',
          50:      '#E6FAF8',
          100:     '#CCFAF4',
          200:     '#99F1E9',
          300:     '#66E8DE',
          400:     '#33DFD3',
          500:     '#00C2A8', // Primary brand
          600:     '#00A891',
          700:     '#008E7A',
          800:     '#007463',
          900:     '#005A4C',
        },

        // Accent — Amber/gold for CTAs and highlights
        accent: {
          DEFAULT: '#F5A623',
          50:      '#FEF8EC',
          100:     '#FEF0D9',
          200:     '#FDE1B3',
          300:     '#FCD18D',
          400:     '#FAC267',
          500:     '#F5A623', // Primary accent
          600:     '#D48A13',
          700:     '#B36E0D',
          800:     '#925208',
          900:     '#713604',
        },

        // Status colours (table states)
        status: {
          available: '#22C55E',  // Green  — table is free
          reserved:  '#F59E0B',  // Amber  — table is reserved
          occupied:  '#EF4444',  // Red    — table is in use
          cleaning:  '#8B5CF6',  // Purple — table being cleaned
        },

        // Crowd level
        crowd: {
          low:      '#22C55E',
          moderate: '#F59E0B',
          high:     '#EF4444',
          full:     '#7F1D1D',
        },

        // Dark mode surfaces (approved: dark mode only in V1)
        surface: {
          bg:        '#0F1117', // Page background
          card:      '#1A1E2E', // Card background
          elevated:  '#222640', // Elevated card / modal
          border:    '#2D3250', // Border / divider
          input:     '#1E2235', // Input field background
          overlay:   'rgba(0,0,0,0.75)', // Overlay / modal backdrop
        },

        // Text colours
        text: {
          primary:   '#F1F5F9', // Main text
          secondary: '#94A3B8', // Muted / subtitle text
          disabled:  '#475569', // Disabled state
          inverse:   '#0F1117', // Text on bright backgrounds
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',     { lineHeight: '1.5rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
      },

      borderRadius: {
        'none':   '0',
        'sm':     '0.375rem',
        DEFAULT:  '0.5rem',
        'md':     '0.75rem',
        'lg':     '1rem',
        'xl':     '1.25rem',
        '2xl':    '1.5rem',
        'full':   '9999px',
      },

      boxShadow: {
        'card':    '0 4px 20px rgba(0,0,0,0.4)',
        'glow':    '0 0 20px rgba(0,194,168,0.3)',
        'glow-lg': '0 0 40px rgba(0,194,168,0.4)',
        'inset':   'inset 0 2px 4px rgba(0,0,0,0.3)',
      },

      // Bottom navigation height (mobile)
      spacing: {
        'nav-bottom': '4.5rem', // 72px — bottom nav height
        'header':     '4rem',   // 64px — top header height
        'sidebar':    '16rem',  // 256px — owner sidebar width
      },

      screens: {
        'xs':  '375px',
        'sm':  '640px',
        'md':  '768px',
        'lg':  '1024px',
        'xl':  '1280px',
        '2xl': '1536px',
      },

      // Animation tokens
      animation: {
        'fade-in':    'fadeIn 0.2s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
