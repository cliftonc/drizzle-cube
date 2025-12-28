/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/client/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Map semantic color names to drizzle-cube CSS variables
        // These automatically update when data-theme attribute changes
        'dc-surface': 'var(--dc-surface)',
        'dc-surface-secondary': 'var(--dc-surface-secondary)',
        'dc-surface-tertiary': 'var(--dc-surface-tertiary)',
        'dc-surface-hover': 'var(--dc-surface-hover)',

        'dc-text': 'var(--dc-text)',
        'dc-text-secondary': 'var(--dc-text-secondary)',
        'dc-text-muted': 'var(--dc-text-muted)',
        'dc-text-disabled': 'var(--dc-text-disabled)',

        'dc-border': 'var(--dc-border)',
        'dc-border-secondary': 'var(--dc-border-secondary)',
        'dc-border-hover': 'var(--dc-border-hover)',

        'dc-primary': 'var(--dc-primary)',
        'dc-primary-hover': 'var(--dc-primary-hover)',
        'dc-primary-content': 'var(--dc-primary-content)',

        'dc-success': 'var(--dc-success)',
        'dc-success-bg': 'var(--dc-success-bg)',
        'dc-success-border': 'var(--dc-success-border)',

        'dc-warning': 'var(--dc-warning)',
        'dc-warning-bg': 'var(--dc-warning-bg)',
        'dc-warning-border': 'var(--dc-warning-border)',

        'dc-error': 'var(--dc-error)',
        'dc-error-bg': 'var(--dc-error-bg)',
        'dc-error-border': 'var(--dc-error-border)',

        'dc-info': 'var(--dc-info)',
        'dc-info-bg': 'var(--dc-info-bg)',
        'dc-info-border': 'var(--dc-info-border)',

        'dc-danger': 'var(--dc-danger)',
        'dc-danger-hover': 'var(--dc-danger-hover)',
        'dc-danger-bg': 'var(--dc-danger-bg)',

        // Card/Component colors
        'dc-card-bg': 'var(--dc-card-bg)',
        'dc-card-bg-hover': 'var(--dc-card-bg-hover)',
        'dc-card-border': 'var(--dc-card-border)',
        'dc-card-border-hover': 'var(--dc-card-border-hover)',

        // Semantic accent colors
        'dc-accent': 'var(--dc-accent)',
        'dc-accent-hover': 'var(--dc-accent-hover)',
        'dc-accent-bg': 'var(--dc-accent-bg)',
        'dc-accent-border': 'var(--dc-accent-border)',

        // Muted/subtle colors
        'dc-muted': 'var(--dc-muted)',
        'dc-muted-bg': 'var(--dc-muted-bg)',
        'dc-muted-border': 'var(--dc-muted-border)',

        // Field type colors - for semantic field type badges
        'dc-dimension': 'var(--dc-dimension-bg)',
        'dc-dimension-text': 'var(--dc-dimension-text)',
        'dc-dimension-border': 'var(--dc-dimension-border)',

        'dc-time-dimension': 'var(--dc-time-dimension-bg)',
        'dc-time-dimension-text': 'var(--dc-time-dimension-text)',
        'dc-time-dimension-border': 'var(--dc-time-dimension-border)',

        'dc-measure': 'var(--dc-measure-bg)',
        'dc-measure-text': 'var(--dc-measure-text)',
        'dc-measure-border': 'var(--dc-measure-border)',
      },
    },
  },
  plugins: [],
}