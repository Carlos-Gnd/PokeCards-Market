/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0B1020',
        surface: '#141B34',
        'surface-2': '#1B2547',
        'surface-3': '#252F5C',
        primary: {
          DEFAULT: '#6D5EF8',
          glow: '#8B7CFF',
          deep: '#4F40E0',
        },
        accent: {
          DEFAULT: '#35C8FF',
          glow: '#6DDBFF',
        },
        gold: {
          DEFAULT: '#F6C453',
          glow: '#FFD876',
        },
        success: '#22C55E',
        error: '#EF4444',
        // Rarezas ARCADIUM
        rarity: {
          core: '#94A3B8',
          alloy: '#67E8F9',
          prime: '#35C8FF',
          elite: '#A78BFA',
          apex: '#6D5EF8',
          ascendant: '#F6C453',
          eternal: '#FF6FB5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'aurora': 'linear-gradient(135deg, #6D5EF8 0%, #35C8FF 50%, #F6C453 100%)',
        'cosmic': 'radial-gradient(ellipse at top, #1B2547 0%, #0B1020 60%)',
        'card-shine': 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)',
      },
      boxShadow: {
        'glow-primary': '0 0 24px rgba(109, 94, 248, 0.45), 0 0 8px rgba(109, 94, 248, 0.6)',
        'glow-accent': '0 0 24px rgba(53, 200, 255, 0.45), 0 0 8px rgba(53, 200, 255, 0.6)',
        'glow-gold': '0 0 24px rgba(246, 196, 83, 0.55), 0 0 12px rgba(246, 196, 83, 0.7)',
        'glow-eternal': '0 0 32px rgba(255, 111, 181, 0.6), 0 0 12px rgba(255, 111, 181, 0.8)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08)',
        'card': '0 12px 32px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.85', filter: 'brightness(1.2)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2.4s ease-in-out infinite',
        'shimmer': 'shimmer 2.2s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
