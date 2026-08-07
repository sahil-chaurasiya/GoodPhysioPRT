/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef1ff',
          100: '#e0e4ff',
          200: '#c6ccfe',
          300: '#a3aafc',
          400: '#7c7ff8',
          500: '#5b57f0',
          600: '#4a3fe0',
          700: '#4636c2',
          800: '#3a2f9c',
          900: '#332b7c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(30, 27, 75, 0.08), 0 1px 2px -1px rgba(30, 27, 75, 0.06)',
        pop: '0 10px 30px -5px rgba(30, 27, 75, 0.25)',
      },
    },
  },
  plugins: [],
};
