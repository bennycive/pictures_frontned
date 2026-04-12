/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
        },
        gold: {
          400: '#f5c842',
          500: '#e8b320',
          600: '#c99410',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
