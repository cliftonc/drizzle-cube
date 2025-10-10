# Theming Guide for drizzle-cube

drizzle-cube provides a **scalable semantic theming system** using CSS variables. Add unlimited custom themes without changing a single line of component code!

## Quick Start

### Built-in Themes

drizzle-cube includes three themes out of the box:

🌞 **Light** - Clean white backgrounds with blue accents
🌙 **Dark** - Slate grays with lighter blue highlights
⚡ **Neon** - Bold fluorescent colors with deep purple backgrounds

No configuration needed - the themes adapt automatically based on your app's theme attribute:

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

**Method 1: Theme Utilities (Recommended)**
```tsx
import { setTheme, getTheme, watchThemeChanges } from 'drizzle-cube/client'

// Set a theme programmatically
setTheme('neon')  // 'light' | 'dark' | 'neon'

// Get current theme
const current = getTheme()  // Returns: 'light' | 'dark' | 'neon'

// Watch for changes
watchThemeChanges((theme) => {
  console.log('Theme changed to:', theme)
})
```

**Method 2: Data Attribute (Manual)**
```tsx
// Set theme via data-theme attribute
document.documentElement.setAttribute('data-theme', 'neon')
```

**Method 3: CSS Class (Legacy)**
```tsx
// Toggle dark mode by adding class to html element
document.documentElement.classList.add('dark')
```

All three approaches work automatically with drizzle-cube components!

## Theme Architecture

### Semantic CSS Variables

drizzle-cube uses **semantic CSS variables** prefixed with `--dc-` (drizzle-cube). These variables change automatically when you switch themes:

| Variable | Purpose | Light | Dark | Neon |
|----------|---------|-------|------|------|
| `--dc-surface` | Primary background | `#ffffff` | `#1e293b` | `#0a0118` |
| `--dc-surface-secondary` | Secondary background | `#f9fafb` | `#334155` | `#1a0f2e` |
| `--dc-text` | Primary text | `#111827` | `#f1f5f9` | `#ffffff` |
| `--dc-text-secondary` | Secondary text | `#374151` | `#e2e8f0` | `#e0e0ff` |
| `--dc-text-muted` | Muted text | `#6b7280` | `#cbd5e1` | `#b0b0d0` |
| `--dc-border` | Border color | `#e5e7eb` | `#475569` | `#ff00ff` |
| `--dc-card-bg` | Card background | `#ffffff` | `#1e293b` | `#1a0f2e` |
| `--dc-card-border` | Card border | `#e5e7eb` | `#475569` | `#ff00ff` |
| `--dc-primary` | Primary action color | `#3b82f6` | `#60a5fa` | `#00ffff` |
| `--dc-primary-hover` | Primary hover state | `#2563eb` | `#3b82f6` | `#00cccc` |
| `--dc-accent` | Accent color | `#3b82f6` | `#60a5fa` | `#00ffff` |
| `--dc-success` | Success state | `#10b981` | `#34d399` | `#00ff00` |
| `--dc-warning` | Warning state | `#f59e0b` | `#fbbf24` | `#ffff00` |
| `--dc-error` | Error state | `#ef4444` | `#f87171` | `#ff0066` |
| `--dc-danger` | Destructive actions | `#dc2626` | `#ef4444` | `#ff1493` |

See [variables.css](../src/client/theme/variables.css) for the complete list of 40+ semantic variables.

## Creating Custom Themes

### The Scalable Approach

The beauty of semantic CSS variables is that adding a new theme requires **zero component changes**. Just define your color palette!

**Example: Ocean Theme**

```css
/* my-themes.css */
[data-theme="ocean"] {
  /* Surface colors */
  --dc-surface: #001f3f;
  --dc-surface-secondary: #002b5c;
  --dc-surface-tertiary: #003d7a;
  --dc-surface-hover: #004d99;

  /* Text colors */
  --dc-text: #e6f7ff;
  --dc-text-secondary: #b3d9ff;
  --dc-text-muted: #80b3ff;

  /* Card colors */
  --dc-card-bg: #003366;
  --dc-card-bg-hover: #004080;
  --dc-card-border: #0059b3;

  /* Primary/accent colors */
  --dc-primary: #39cccc;
  --dc-primary-hover: #2eb8b8;
  --dc-accent: #66d9d9;
  --dc-border: #004d66;

  /* Semantic states */
  --dc-success: #00e676;
  --dc-warning: #ffab00;
  --dc-error: #ff5252;
  --dc-danger: #ff1744;
  /* ... other variables */
}
```

Then use it in your app:
```tsx
import { setTheme } from 'drizzle-cube/client'

setTheme('ocean')  // All components update automatically! ✨
```

### Option 1: Full Custom Theme

Create a complete custom theme by defining all semantic variables:

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

### Multi-Theme Switcher

```tsx
import { getTheme, setTheme, watchThemeChanges, type Theme } from 'drizzle-cube/client'
import { useEffect, useState } from 'react'

function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(getTheme())

  useEffect(() => {
    // Watch for theme changes from other sources
    const unwatch = watchThemeChanges((theme) => {
      setCurrentTheme(theme)
    })
    return unwatch
  }, [])

  const cycleTheme = () => {
    // Cycle through: light → dark → neon → light
    const nextTheme =
      currentTheme === 'light' ? 'dark' :
      currentTheme === 'dark' ? 'neon' : 'light'

    setTheme(nextTheme)
  }

  const getIcon = () => {
    switch (currentTheme) {
      case 'light': return '☀️'
      case 'dark': return '🌙'
      case 'neon': return '⚡'
      default: return '☀️'
    }
  }

  return (
    <button onClick={cycleTheme} title={`Switch to next theme`}>
      {getIcon()} {currentTheme}
    </button>
  )
}
```

### Two-State Toggle (Legacy)

For a simple light/dark toggle:

```tsx
import { isDarkMode, watchThemeChanges } from 'drizzle-cube/client'
import { useEffect, useState } from 'react'

function SimpleThemeToggle() {
  const [isDark, setIsDark] = useState(isDarkMode())

  useEffect(() => {
    const unwatch = watchThemeChanges((theme) => {
      setIsDark(theme === 'dark' || theme === 'neon')
    })
    return unwatch
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
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

### `getTheme(): Theme`

Get the current active theme:

```tsx
import { getTheme, type Theme } from 'drizzle-cube/client'

const currentTheme: Theme = getTheme()
// Returns: 'light' | 'dark' | 'neon'
```

### `setTheme(theme: Theme): void`

Set the active theme programmatically:

```tsx
import { setTheme } from 'drizzle-cube/client'

setTheme('neon')  // 'light' | 'dark' | 'neon'
```

This function:
- Sets the `data-theme` attribute on `<html>`
- Adds the appropriate CSS class for backwards compatibility
- Persists the theme to localStorage
- Updates all components automatically

### `isDarkMode(): boolean` (Deprecated)

Detect if a dark theme (dark or neon) is currently active:

```tsx
import { isDarkMode } from 'drizzle-cube/client'

if (isDarkMode()) {
  console.log('Dark or Neon theme is active')
}
```

**Note**: Use `getTheme()` for more precise theme detection.

### `watchThemeChanges(callback: (theme: Theme) => void): () => void`

Watch for theme changes:

```tsx
import { watchThemeChanges } from 'drizzle-cube/client'

const unwatch = watchThemeChanges((theme) => {
  console.log('Theme changed to:', theme)
  // theme is 'light' | 'dark' | 'neon'
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
