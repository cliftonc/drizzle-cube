/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../../dist/**/*.js', // Include the built drizzle-cube components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}