/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#12172b',
        parchment: '#faf6ef',
        mint: '#2fae79',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Manrope', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'card-lg': '0 10px 30px rgba(18,23,43,0.06)',
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
}
