---
paths: src/client/**/*.tsx
---

# Theming Rules

**NEVER use raw Tailwind color classes** in client components. Always use `dc-` prefixed semantic theme variables.

## Why

The client is embeddable - raw Tailwind colors break theming and prevent customization.

## Color Mapping

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
| `bg-white`, `bg-gray-50` | `bg-dc-bg`, `bg-dc-bg-secondary` |
| `text-gray-900/700` | `text-dc-text`, `text-dc-text-secondary` |
| `border-gray-200/300` | `border-dc-border` |

## Theme Variables

Defined in `src/client/styles/themes.css` and `src/client/tailwind.config.ts`.
