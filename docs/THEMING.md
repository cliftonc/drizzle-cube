# Theming Guide for drizzle-cube

drizzle-cube provides a flexible CSS variable-based theming system that allows you to customize the appearance of all components and support light/dark themes seamlessly.

## Quick Start

### Default Themes

drizzle-cube includes **light** and **dark** themes out of the box. No configuration needed - the themes adapt automatically based on your app's theme class or attribute:

```tsx
import { CubeProvider, AnalyticsDashboard } from 'drizzle-cube/client'
import 'drizzle-cube/client/styles.css' // Includes theme CSS

function App() {
  return (
    <CubeProvider apiOptions={{ apiUrl: '/api/cubejs-api/v1' }}>
      <AnalyticsDashboard config={dashboardConfig} />
    </CubeProvider>
  )
}
```

### Switching Themes

**Method 1: CSS Class (Recommended)**
```tsx
// Toggle dark mode by adding class to html element
document.documentElement.classList.toggle('dark')
```

**Method 2: Data Attribute**
```tsx
// Set theme via data-theme attribute
document.documentElement.setAttribute('data-theme', 'dark')
```

Both approaches work automatically with drizzle-cube components!

## Theme Architecture

### CSS Custom Properties

drizzle-cube uses semantic CSS variables prefixed with `--dc-` (drizzle-cube) for all colors and styles:

| Variable | Purpose | Light Default | Dark Default |
|----------|---------|---------------|--------------|
| `--dc-surface` | Primary background | `#ffffff` | `#1e293b` |
| `--dc-surface-secondary` | Secondary background | `#f9fafb` | `#334155` |
| `--dc-text` | Primary text | `#111827` | `#f1f5f9` |
| `--dc-text-secondary` | Secondary text | `#374151` | `#e2e8f0` |
| `--dc-text-muted` | Muted text | `#6b7280` | `#cbd5e1` |
| `--dc-border` | Border color | `#e5e7eb` | `#475569` |
| `--dc-primary` | Primary action color | `#3b82f6` | `#60a5fa` |
| `--dc-primary-hover` | Primary hover state | `#2563eb` | `#3b82f6` |
| `--dc-success` | Success state | `#10b981` | `#34d399` |
| `--dc-warning` | Warning state | `#f59e0b` | `#fbbf24` |
| `--dc-error` | Error state | `#ef4444` | `#f87171` |
| `--dc-danger` | Destructive actions | `#dc2626` | `#ef4444` |

See [variables.css](../src/client/theme/variables.css) for the complete list.

## Customization

### Option 1: Override CSS Variables (Recommended)

Create a custom theme by overriding CSS variables in your app's CSS:

```css
/* my-app-theme.css */
:root {
  /* Customize light theme */
  --dc-surface: #fafafa;
  --dc-primary: #10b981;
  --dc-primary-hover: #059669;
}

[data-theme="dark"],
.dark {
  /* Customize dark theme */
  --dc-surface: #18181b;
  --dc-primary: #22d3ee;
  --dc-primary-hover: #06b6d4;
}
```

Import after drizzle-cube styles:
```tsx
import 'drizzle-cube/client/styles.css'
import './my-app-theme.css' // Your overrides
```

### Option 2: Runtime Theme Configuration

Use the theme utilities API for dynamic theming:

```tsx
import { applyTheme, THEME_PRESETS } from 'drizzle-cube/client'

// Apply a preset
applyTheme(THEME_PRESETS.dark)

// Apply custom colors
applyTheme({
  name: 'custom',
  colors: {
    surface: '#ffffff',
    primary: '#10b981',
    text: '#111827'
  }
})
```

### Option 3: DaisyUI Integration

If your app uses DaisyUI, you can map DaisyUI theme variables to drizzle-cube:

```css
/* In your app's CSS */
:root {
  --dc-surface: var(--color-base-100);
  --dc-surface-secondary: var(--color-base-200);
  --dc-text: var(--color-base-content);
  --dc-border: var(--color-base-300);
  --dc-primary: var(--color-primary);
  --dc-primary-hover: var(--color-primary-focus);
  --dc-success: var(--color-success);
  --dc-warning: var(--color-warning);
  --dc-error: var(--color-error);
}
```

drizzle-cube will automatically inherit your DaisyUI theme colors!

## Examples

### Complete Tailwind + DaisyUI Integration

```css
/* app/index.css */
@import "tailwindcss";
@import 'drizzle-cube/client/styles.css';
@plugin "daisyui";

/* Define your DaisyUI themes */
@plugin "daisyui/theme" {
  name: "myapp-light";
  default: true;
  --color-primary: #0891b2;
  --color-base-100: #ffffff;
  --color-base-content: #0f172a;
}

@plugin "daisyui/theme" {
  name: "myapp-dark";
  color-scheme: dark;
  --color-primary: #22d3ee;
  --color-base-100: #1e293b;
  --color-base-content: #e2e8f0;
}

/* Map DaisyUI to drizzle-cube */
:root {
  --dc-surface: var(--color-base-100);
  --dc-surface-secondary: var(--color-base-200);
  --dc-text: var(--color-base-content);
  --dc-border: var(--color-base-300);
  --dc-primary: var(--color-primary);
}
```

### Custom Brand Colors

```css
/* Override specific brand colors */
:root {
  /* Use your brand's primary color */
  --dc-primary: #7c3aed; /* Purple */
  --dc-primary-hover: #6d28d9;
  --dc-primary-content: #ffffff;

  /* Keep other defaults */
}

.dark {
  --dc-primary: #a78bfa;
  --dc-primary-hover: #8b5cf6;
}
```

### Theme Detection and Switching

```tsx
import { isDarkMode, watchThemeChanges } from 'drizzle-cube/client'
import { useEffect, useState } from 'react'

function ThemeToggle() {
  const [isDark, setIsDark] = useState(isDarkMode())

  useEffect(() => {
    // Watch for theme changes from other sources
    const unwatch = watchThemeChanges((isDarkMode) => {
      setIsDark(isDarkMode)
    })
    return unwatch
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(!isDark)
  }

  return (
    <button onClick={toggleTheme}>
      {isDark ? '🌙 Dark' : '☀️ Light'}
    </button>
  )
}
```

## Tailwind Configuration

If using Tailwind CSS v4, ensure drizzle-cube's client build is included in your content paths:

```ts
// tailwind.config.ts
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/drizzle-cube/dist/client/**/*.{js,jsx}', // Include drizzle-cube
  ],
  // ... other config
}
```

### Safelist Classes (If Needed)

If you encounter missing styles, add drizzle-cube theme classes to your safelist:

```ts
// tailwind.config.ts
export default {
  safelist: [
    'bg-dc-surface',
    'bg-dc-surface-secondary',
    'text-dc-text',
    'text-dc-text-secondary',
    'border-dc-border',
    // ... other theme classes you're using
  ],
}
```

## Theme Utilities API

### `applyTheme(theme: ThemeConfig)`

Apply a complete theme configuration:

```tsx
import { applyTheme } from 'drizzle-cube/client'

applyTheme({
  name: 'ocean',
  colors: {
    surface: '#f0f9ff',
    primary: '#0284c7',
    text: '#0c4a6e'
  }
})
```

### `getThemeVariable(name: string): string`

Get the current value of a theme variable:

```tsx
import { getThemeVariable } from 'drizzle-cube/client'

const primaryColor = getThemeVariable('primary')
// Returns: '#3b82f6' (or current theme's primary color)
```

### `setThemeVariable(name: string, value: string)`

Set a single theme variable:

```tsx
import { setThemeVariable } from 'drizzle-cube/client'

setThemeVariable('primary', '#7c3aed')
```

### `isDarkMode(): boolean`

Detect if dark mode is currently active:

```tsx
import { isDarkMode } from 'drizzle-cube/client'

if (isDarkMode()) {
  console.log('Dark theme is active')
}
```

### `watchThemeChanges(callback: (isDark: boolean) => void): () => void`

Watch for theme changes:

```tsx
import { watchThemeChanges } from 'drizzle-cube/client'

const unwatch = watchThemeChanges((isDark) => {
  console.log('Theme changed:', isDark ? 'dark' : 'light')
})

// Clean up when done
unwatch()
```

### `resetTheme()`

Reset all theme variables to defaults:

```tsx
import { resetTheme } from 'drizzle-cube/client'

resetTheme()
```

## TypeScript Support

Full TypeScript support is included:

```tsx
import type { ThemeConfig, ThemeColorTokens } from 'drizzle-cube/client'

const myTheme: ThemeConfig = {
  name: 'custom',
  colors: {
    surface: '#ffffff',
    text: '#000000',
    primary: '#3b82f6'
  }
}
```

## Troubleshooting

### Styles not applying

1. **Check CSS import order**: Ensure `drizzle-cube/client/styles.css` is imported before your custom styles
2. **Check Tailwind content paths**: Include `node_modules/drizzle-cube/dist/client/**/*.{js,jsx}` in your Tailwind config
3. **Use safelist if needed**: Add theme classes to Tailwind safelist if purging removes them

### Dark mode not working

1. **Check theme class**: Ensure `.dark` class or `[data-theme="dark"]` attribute is on `<html>` or `<body>`
2. **Check CSS specificity**: Your CSS overrides might need `!important` if other styles have higher specificity
3. **Test manually**: Try `document.documentElement.classList.add('dark')` in browser console

### Colors look wrong

1. **Check variable names**: Use `--dc-` prefix for all theme variables
2. **Check inheritance**: CSS variables inherit from parent elements - ensure they're set on `:root` or `html`
3. **Use browser DevTools**: Inspect elements and check computed CSS variable values

## Best Practices

1. **Use semantic variables**: Use `--dc-surface` instead of hardcoding `#ffffff`
2. **Test both themes**: Always test your app in both light and dark modes
3. **Override at root level**: Set theme variables on `:root` to ensure proper inheritance
4. **Namespace your vars**: Keep `--dc-` prefix for drizzle-cube variables, use your own prefix for app-specific vars
5. **Document your theme**: Keep a reference of your customized variables

## Migration from Older Versions

If you're upgrading from a pre-theming version of drizzle-cube, your existing code will continue to work with the default light theme. To enable dark mode support, simply add the dark theme class to your app's theme switcher.

No breaking changes were introduced - the theming system is fully backward compatible.

## Support

For issues or questions about theming:
- [GitHub Issues](https://github.com/cliftonc/drizzle-cube/issues)
- [Documentation](https://docs.drizzle-cube.dev)
