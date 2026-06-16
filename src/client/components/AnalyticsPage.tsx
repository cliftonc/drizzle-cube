import { useTranslation } from '../hooks/useTranslation.js'

// Placeholder component - will be implemented in Phase 4
export function AnalyticsPage() {
  const { t } = useTranslation()
  return <div>{t('analyticsPage.title')}</div>
}
