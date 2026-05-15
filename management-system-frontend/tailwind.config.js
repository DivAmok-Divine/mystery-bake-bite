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
        brand: {
          chocolate: '#3D1F16',
          dough: '#D4A373',
          cream: '#F5EBE0',
          surface: 'var(--brand-surface)',
          espresso: '#1A0F0A',
        },
        feature: {
          orders: '#D4A373', // Dough/Amber
          customers: '#4A6670', // Slate Blue
          recipes: '#7D8C69', // Sage Green
          reporting: '#9A7E6F', // Cocoa/Taupe
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
