/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Fondos ──────────────────────────────────────────────────
        bg:          '#0B0F19',   // negro carbón (más profundo que antes)
        surface:     '#141B2D',   // gris azulado oscuro
        'surface-2': '#1A2340',
        'surface-3': '#1F2B4D',

        // ── Primarios ───────────────────────────────────────────────
        primary: {
          DEFAULT: '#3B82F6',    // azul eléctrico
          glow:    '#60A5FA',
          deep:    '#1D4ED8',
        },
        // ── Secundario ──────────────────────────────────────────────
        secondary: {
          DEFAULT: '#8B5CF6',    // morado neón
          glow:    '#A78BFA',
          deep:    '#6D28D9',
        },
        // ── Acento ──────────────────────────────────────────────────
        accent: {
          DEFAULT: '#22D3EE',    // cian brillante
          glow:    '#67E8F9',
        },
        gold: {
          DEFAULT: '#F59E0B',
          glow:    '#FCD34D',
        },

        // ── Semánticos ──────────────────────────────────────────────
        success: '#10B981',
        error:   '#EF4444',
        warn:    '#F59E0B',

        // ── Rarezas ─────────────────────────────────────────────────
        rarity: {
          core:       '#94A3B8',
          alloy:      '#22D3EE',
          prime:      '#3B82F6',
          elite:      '#8B5CF6',
          apex:       '#F59E0B',
          ascendant:  '#F8FAFC',
          eternal:    '#EC4899',
        },
      },

      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Oxanium', 'Plus Jakarta Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        // Aurora principal — azul → morado → cian
        'aurora':   'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #22D3EE 100%)',
        'aurora-2': 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 60%, #22D3EE 100%)',
        'cosmic':   'radial-gradient(ellipse at top, #1A2340 0%, #0B0F19 65%)',
        'card-shine': 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)',
        // Gradiente de marca para títulos
        'brand': 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #22D3EE 100%)',
      },

      boxShadow: {
        'glow-primary':   '0 0 20px rgba(59,130,246,0.5), 0 0 6px rgba(59,130,246,0.7)',
        'glow-secondary': '0 0 20px rgba(139,92,246,0.5), 0 0 6px rgba(139,92,246,0.7)',
        'glow-accent':    '0 0 20px rgba(34,211,238,0.5), 0 0 6px rgba(34,211,238,0.7)',
        'glow-gold':      '0 0 22px rgba(245,158,11,0.55), 0 0 10px rgba(245,158,11,0.7)',
        'glow-eternal':   '0 0 28px rgba(236,72,153,0.6), 0 0 10px rgba(236,72,153,0.8)',
        'inner-glow':     'inset 0 1px 0 rgba(255,255,255,0.07)',
        'card':           '0 12px 32px -12px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
        'nav':            '0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)',
      },

      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.25)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'border-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },

      animation: {
        'glow-pulse':  'glow-pulse 2.6s ease-in-out infinite',
        'shimmer':     'shimmer 2.4s linear infinite',
        'float':       'float 4.5s ease-in-out infinite',
        'fade-in-up':  'fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'border-flow': 'border-flow 3s ease infinite',
      },
    },
  },
  plugins: [],
};
