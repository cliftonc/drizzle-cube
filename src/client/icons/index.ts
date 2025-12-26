/**
 * Drizzle Cube Icon System
 *
 * Centralized, configurable icon registry following the theme pattern.
 * All icons can be overridden by users with their own implementations.
 *
 * @example
 * ```typescript
 * // Get an icon component
 * import { getIcon } from 'drizzle-cube/client/icons'
 * const CloseIcon = getIcon('close')
 * <CloseIcon className="w-4 h-4" />
 *
 * // Override icons at app initialization
 * import { registerIcons } from 'drizzle-cube/client/icons'
 * import myCloseIcon from '@iconify-icons/mdi/close'
 * registerIcons({ close: myCloseIcon })
 * ```
 */

// Types
export type {
  IconCategory,
  IconProps,
  IconComponent,
  IconDefinition,
  IconRegistry,
  IconName,
  PartialIconRegistry
} from './types'

// Registry functions
export {
  getIconRegistry,
  getIcon,
  getIconData,
  setIcon,
  registerIcons,
  resetIcons,
  getIconsByCategory,
  getMeasureTypeIcon,
  getChartTypeIcon,
  getFieldTypeIcon
} from './registry'

// Default icons (for reference/extension)
export { DEFAULT_ICONS } from './defaultIcons'
