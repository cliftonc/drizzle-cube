/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Include source client components so Tailwind finds their classes
    "../../src/client/**/*.{js,ts,jsx,tsx}",
    // Also include the source server components for any utility classes used there
    "../../src/server/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}