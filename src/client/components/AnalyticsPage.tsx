import { useTranslation } from '../hooks/useTranslation'

// Placeholder component - will be implemented in Phase 4
export function AnalyticsPage() {
  const { t } = useTranslation()
  return <div>{t('analyticsPage.title')}</div>
}
