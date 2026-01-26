---
paths: src/client/**/*.tsx
---

# Theming Rules

## CSS Isolation

All Tailwind utility classes in drizzle-cube are prefixed with `dc:` to prevent CSS conflicts when embedding in applications with their own Tailwind setup.

### Two Types of Classes

| Type | Pattern | Example | Purpose |
|------|---------|---------|---------|
| Layout utilities | `dc:*` | `dc:flex`, `dc:p-4`, `dc:text-sm` | Internal layout (not themeable) |
| Theme utilities | `*-dc-*` | `bg-dc-surface`, `text-dc-text` | Themeable by consumers |

### Writing Classes

```tsx
// ✅ CORRECT - All utilities prefixed with dc:
<div className="dc:flex dc:items-center dc:gap-2 dc:p-4 bg-dc-surface text-dc-text">

// ❌ WRONG - Unprefixed utilities
<div className="flex items-center gap-2 p-4 bg-dc-surface text-dc-text">
```

### Variants with dc: Prefix (Tailwind v4)

In Tailwind v4, the `dc:` prefix comes FIRST, then the variant:

```tsx
// ✅ CORRECT (Tailwind v4) - prefix FIRST, then variant
<button className="dc:p-2 dc:hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent">

// ❌ WRONG (Tailwind v3 style) - variant first, then prefix
<button className="dc:p-2 hover:dc:bg-dc-surface-hover focus:dc:ring-2">
```

**Note:** Theme classes (like `focus:ring-dc-accent`) don't need the `dc:` prefix for variants.

## Theme Colors

**NEVER use raw Tailwind color classes** - always use `dc-` prefixed semantic theme variables.

### Status Colors
| Instead of | Use |
|------------|-----|
| `text-red-500/600` | `text-dc-error` |
| `text-green-500/600` | `text-dc-success` |
| `text-yellow-500/600` | `text-dc-warning` |
| `text-blue-500/600` | `text-dc-accent` |

### Backgrounds
| Instead of | Use |
|------------|-----|
| `bg-red-50/100` | `bg-dc-danger-bg` |
| `bg-green-50/100` | `bg-dc-success-bg` |
| `bg-yellow-50/100` | `bg-dc-warning-bg` |
| `bg-blue-50/100` | `bg-dc-accent-bg` |

### Interactive States
| Instead of | Use |
|------------|-----|
| `hover:text-red-600` | `hover:text-dc-danger` |
| `hover:bg-red-50` | `hover:bg-dc-danger-bg` |
| `focus:ring-blue-500` | `focus:ring-dc-accent` |

### Surfaces
| Instead of | Use |
|------------|-----|
| `bg-white`, `bg-gray-50` | `bg-dc-surface`, `bg-dc-surface-secondary` |
| `text-gray-900/700` | `text-dc-text`, `text-dc-text-secondary` |
| `border-gray-200/300` | `border-dc-border` |

## Theme Variables

Defined in `src/client/theme/variables.css`. Consumer apps can override:

```css
:root {
  --dc-primary: #your-brand-color;
  --dc-surface: #your-background;
}
```
