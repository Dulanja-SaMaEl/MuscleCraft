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
        crimson: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#DC2626',
          600: '#BA1A1A', // MuscleCraft logo primary crimson #AA1616 / #BA1A1A
          700: '#991212',
          800: '#7F1010',
          900: '#450A0A',
          DEFAULT: '#BA1A1A',
        },
        gold: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#DC2626',
          600: '#BA1A1A', // Luxury Crimson map
          700: '#991212',
          800: '#7F1010',
          900: '#450A0A',
          DEFAULT: '#BA1A1A',
        },
        platinum: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E8E5DC', // MuscleCraft satin titanium platinum #E8E5DC
          300: '#D4D4D8',
          DEFAULT: '#E8E5DC',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        'border-gold': 'rgba(186, 26, 26, 0.35)',
        'border-crimson': 'rgba(186, 26, 26, 0.35)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', '"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['var(--font-sans)', '"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-sans)', '"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px rgba(186, 26, 26, 0.35)',
        'gold-glow-lg': '0 0 50px rgba(186, 26, 26, 0.55)',
        'crimson-glow': '0 0 25px rgba(186, 26, 26, 0.35)',
        'crimson-glow-lg': '0 0 50px rgba(186, 26, 26, 0.55)',
        'card-dark': '0 15px 35px -10px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(255, 255, 255, 0.08)',
        'card-3d': '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 30px rgba(186, 26, 26, 0.2)',
        'card-featured-3d': '0 30px 70px -15px rgba(0, 0, 0, 0.95), 0 0 45px rgba(186, 26, 26, 0.4)',
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
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 15px rgba(186,26,26,0.35))' },
          '50%': { opacity: '0.9', filter: 'drop-shadow(0 0 35px rgba(186,26,26,0.65))' },
        },
      },
    },
  },
  plugins: [],
}
