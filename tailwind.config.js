/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // World Cup brand palette
        wc: {
          red:    '#C8102E',
          blue:   '#003DA5',
          gold:   '#FFD700',
          dark:   '#0A0A0A',
          surface: '#1A1A2E',
        },
      },
      screens: {
        // Mobile-first breakpoints
        xs: '375px',
      },
    },
  },
  plugins: [],
}
