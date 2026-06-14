/**
 * agentChatParts - presentational sub-pieces for AgentChatPanel.
 *
 * Pure extraction: header bar, feedback (thumbs up/down) bar, thinking bubble,
 * and empty state. No behaviour change.
 */
import React from 'react'
import LoadingIndicator from '../LoadingIndicator'
import { getIcon } from '../../icons'
import { useTranslation } from '../../hooks/useTranslation'

const ThumbUpIcon = getIcon('thumbUp')
const ThumbDownIcon = getIcon('thumbDown')

interface ChatPanelFlags {
  showSaveAsDashboard: boolean
  showClear: boolean
  showFeedback: boolean
  lastScored: boolean
}

interface ChatPanelFlagInput {
  onDashboardSaved: boolean
  onScore: boolean
  isStreaming: boolean
  portletBlockCount: number
  messageCount: number
  lastTraceId: string | null
  scoredTraceIds: Set<string>
}

/** True only when every condition holds (keeps branch count low per helper). */
function all(...conditions: boolean[]): boolean {
  return conditions.every(Boolean)
}

/** Derive header/feedback visibility flags for the chat panel. */
export function getChatPanelFlags(i: ChatPanelFlagInput): ChatPanelFlags {
  const idleWithMessages = all(!i.isStreaming, i.messageCount > 0)
  const lastScored = i.lastTraceId ? i.scoredTraceIds.has(i.lastTraceId) : false
  return {
    showSaveAsDashboard: all(idleWithMessages, i.onDashboardSaved, i.portletBlockCount > 0),
    showClear: i.messageCount > 0,
    showFeedback: all(idleWithMessages, i.onScore, !!i.lastTraceId, !lastScored),
    lastScored,
  }
}

export function ChatHeader({
  showSaveAsDashboard,
  showClear,
  isStreaming,
  onSaveAsDashboard,
  onClear,
}: {
  showSaveAsDashboard: boolean
  showClear: boolean
  isStreaming: boolean
  onSaveAsDashboard: () => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="dc:flex dc:items-center dc:justify-between dc:px-4 dc:py-3 border-dc-border dc:border-b">
      <h3 className="dc:text-sm dc:font-semibold text-dc-text">{t('notebook.aiAssistant')}</h3>
      <div className="dc:flex dc:items-center dc:gap-1">
        {showSaveAsDashboard && (
          <button
            onClick={onSaveAsDashboard}
            className="dc:text-xs dc:px-2 dc:py-1 dc:rounded text-dc-accent dc:hover:opacity-80"
            title={t('notebook.saveAsDashboardTitle')}
          >
            {t('notebook.saveAsDashboard')}
          </button>
        )}
        {showClear && (
          <button
            onClick={onClear}
            disabled={isStreaming}
            className="dc:text-xs dc:px-2 dc:py-1 dc:rounded text-dc-text-secondary dc:hover:opacity-80 dc:disabled:opacity-40"
            title={t('notebook.clearTitle')}
          >
            {t('common.actions.clear')}
          </button>
        )}
      </div>
    </div>
  )
}

export function FeedbackBar({
  scored,
  onScore,
}: {
  scored: boolean
  onScore: (value: number) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="dc:flex dc:items-center dc:justify-center dc:gap-3 dc:py-4 dc:mt-2">
      {scored ? (
        <span className="dc:text-sm text-dc-text-secondary">{t('notebook.feedbackThanks')}</span>
      ) : (
        <>
          <span className="dc:text-sm text-dc-text-secondary">{t('notebook.feedbackQuestion')}</span>
          <div className="dc:flex dc:items-center dc:gap-2">
            <button
              onClick={() => onScore(1)}
              className="dc:flex dc:items-center dc:gap-1.5 dc:px-3 dc:py-1.5 dc:rounded-lg dc:text-sm dc:font-medium border-dc-border dc:border text-dc-success hover:bg-dc-success-bg dc:transition-colors bg-dc-surface dc:cursor-pointer"
            >
              <ThumbUpIcon className="dc:w-4 dc:h-4" />
              {t('notebook.feedbackYes')}
            </button>
            <button
              onClick={() => onScore(0)}
              className="dc:flex dc:items-center dc:gap-1.5 dc:px-3 dc:py-1.5 dc:rounded-lg dc:text-sm dc:font-medium border-dc-border dc:border text-dc-error hover:bg-dc-danger-bg dc:transition-colors bg-dc-surface dc:cursor-pointer"
            >
              <ThumbDownIcon className="dc:w-4 dc:h-4" />
              {t('notebook.feedbackNo')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function ThinkingBubble({ loadingComponent }: { loadingComponent?: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <div
      className="dc:flex dc:mb-3 dc:justify-start"
      style={{ animation: 'dc-msg-in 100ms ease-out' }}
    >
      <div className="dc:rounded-lg dc:px-3 dc:py-2 dc:text-sm bg-dc-surface-secondary text-dc-text-secondary dc:rounded-bl-sm dc:flex dc:items-center dc:gap-2">
        {loadingComponent
          ? <span className="dc:inline-flex dc:items-center dc:justify-center dc:h-4 dc:w-4">{loadingComponent}</span>
          : <LoadingIndicator size="xs" />}
        <span>{t('notebook.thinking')}</span>
      </div>
    </div>
  )
}

export function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="dc:flex dc:items-center dc:justify-center dc:h-full">
      <div className="dc:text-center dc:max-w-xs">
        <div className="dc:text-lg dc:font-semibold text-dc-text dc:mb-2">
          {t('notebook.emptyState.title')}
        </div>
        <p className="dc:text-sm text-dc-text-secondary dc:mb-4">
          {t('notebook.emptyState.description')}
        </p>
        <div className="dc:space-y-2 dc:text-xs text-dc-text-muted">
          <p>{t('notebook.emptyState.example1')}</p>
          <p>{t('notebook.emptyState.example2')}</p>
          <p>{t('notebook.emptyState.example3')}</p>
        </div>
      </div>
    </div>
  )
}
