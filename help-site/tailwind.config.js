/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        drizzle: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.help-prose': {
          'max-width': 'none',
          '& h1': {
            '@apply text-4xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-drizzle-500': {},
          },
          '& h2': {
            '@apply text-3xl font-semibold text-gray-800 mt-8 mb-4': {},
          },
          '& h3': {
            '@apply text-2xl font-medium text-gray-700 mt-6 mb-3': {},
          },
          '& a[data-help-link]': {
            '@apply text-drizzle-600 hover:text-drizzle-700 cursor-pointer': {},
          },
        },
        '.help-search-highlight': {
          '@apply bg-yellow-200 font-medium rounded-sm px-1': {},
        },
        '.relevance-very-high': {
          '@apply bg-green-100 border-green-300 text-green-800': {},
        },
        '.relevance-high': {
          '@apply bg-blue-100 border-blue-300 text-blue-800': {},
        },
        '.relevance-medium': {
          '@apply bg-yellow-100 border-yellow-300 text-yellow-800': {},
        },
        '.relevance-low': {
          '@apply bg-orange-100 border-orange-300 text-orange-800': {},
        },
        '.relevance-very-low': {
          '@apply bg-red-100 border-red-300 text-red-800': {},
        },
      })
    }
  ],
}