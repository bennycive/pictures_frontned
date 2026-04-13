/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f4daa8',
          300: '#ecc066',
          400: '#e4a535',
          500: '#d4881e',
          600: '#b86a14',
          700: '#8f4d12',
          800: '#6f3c14',
          900: '#5c3213',
          950: '#3a1e0b',
        },
        earth: {
          50:  '#f9f5f0',
          100: '#ede3d4',
          200: '#d9c5a7',
          300: '#c19e73',
          400: '#aa7c4a',
          500: '#8b5e32',
          600: '#6e4826',
          700: '#533620',
          800: '#3c2718',
          900: '#2a1c12',
          950: '#140e09',
        },
        gold: {
          400: '#f5c842',
          500: '#e8b320',
          600: '#c99410',
        }
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif:   ['"Cormorant Garamond"', 'Georgia', 'serif'],
        script:  ['"Dancing Script"', 'cursive'],
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up':   'fadeUp 0.7s ease forwards',
        'fade-in':   'fadeIn 1s ease forwards',
        'ken-burns': 'kenBurns 20s ease infinite alternate',
      },
      keyframes: {
        fadeUp:   { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        kenBurns: { '0%': { transform: 'scale(1)' }, '100%': { transform: 'scale(1.08)' } },
      },
    },
  },
  plugins: [],
}
