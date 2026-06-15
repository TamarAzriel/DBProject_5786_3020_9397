/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0f1a',
          900: '#0e1525',
          800: '#16203a',
          700: '#1f2d4d',
          600: '#2b3c63',
        },
        champagne: {
          50: '#fdfaf3',
          100: '#f8f0dd',
          200: '#eedfba',
          300: '#e0c98e',
          400: '#d4b572',
          500: '#c6a35a',
          600: '#a98443',
          700: '#876736',
        },
        pearl: '#f6f5f1',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Jost"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(5, 10, 25, 0.35)',
        'glass-lg': '0 16px 48px 0 rgba(5, 10, 25, 0.45)',
        'gold-glow': '0 0 24px 0 rgba(212, 181, 114, 0.18)',
        'card-3d': '0 1px 2px rgba(5,10,25,0.4), 0 12px 24px -8px rgba(5,10,25,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        'card-3d-hover': '0 2px 4px rgba(5,10,25,0.4), 0 24px 48px -12px rgba(5,10,25,0.65), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 32px rgba(212,181,114,0.12)',
      },
      backgroundImage: {
        'radial-fade': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,181,114,0.10), transparent)',
        'gold-line': 'linear-gradient(90deg, transparent, rgba(212,181,114,0.6), transparent)',
      },
      letterSpacing: {
        widest2: '0.25em',
      },
      animation: {
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fadeIn 0.9s ease both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
