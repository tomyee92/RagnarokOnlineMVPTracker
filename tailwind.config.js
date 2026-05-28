/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'ro-dark': '#0d0e13',
        'ro-card': '#13151c',
        'ro-input': '#1a1d26',
        'ro-border': '#2a2d3a',
        'ro-gold': '#c9a94b',
        'ro-muted': '#6b7280',
      },
    },
  },
  plugins: [],
}
