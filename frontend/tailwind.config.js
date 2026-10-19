/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#080809',
        foreground: '#F9FAFB',
        surface: {
          50: '#1c1c22',
          100: '#18181d',
          200: '#141418',
          300: '#111114',
          400: '#0d0d0f',
          DEFAULT: '#121215',
        },
        gold: {
          50: '#FDF8EC',
          100: '#FAEDCC',
          200: '#F5DC99',
          300: '#EFC766',
          400: '#E2B46E',
          500: '#D4A359', // Reference warm gold/amber #D4A359
          600: '#C2934B',
          700: '#A87A36',
          800: '#7A5722',
          900: '#4F3812',
          DEFAULT: '#D4A359',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        'border-gold': 'rgba(212, 163, 89, 0.35)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px rgba(229, 169, 60, 0.25)',
        'gold-glow-lg': '0 0 50px rgba(229, 169, 60, 0.45)',
        'card-dark': '0 15px 35px -10px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(255, 255, 255, 0.08)',
        'card-3d': '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 30px rgba(229, 169, 60, 0.15)',
        'card-featured-3d': '0 30px 70px -15px rgba(0, 0, 0, 0.95), 0 0 45px rgba(229, 169, 60, 0.35)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 2s infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'shimmer-spin': 'spin 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 15px rgba(229,169,60,0.3))' },
          '50%': { opacity: '0.9', filter: 'drop-shadow(0 0 35px rgba(229,169,60,0.6))' },
        },
      },
    },
  },
  plugins: [],
}
