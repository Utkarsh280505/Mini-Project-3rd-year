/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#06b6d4',
        secondary: '#8b5cf6',
        dark: '#030712',
        panel: '#0f172a',
      },
      boxShadow: {
        glow: '0 0 30px rgba(6, 182, 212, 0.3)',
      },
    },
  },
  plugins: [],
};
