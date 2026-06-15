/**
 * ChatMessage - Renders individual user and assistant messages
 */

import React from 'react'
import type { ChatMessage as ChatMessageType } from '../../stores/notebookStore'
import { getMessageFlags, getBubbleClass, ChatBubbleBody } from './chatMessageParts'

interface ChatMessageProps {
  message: ChatMessageType
  /** Custom loading indicator for tool call spinners */
  loadingComponent?: React.ReactNode
}

const MSG_FADE_IN: React.CSSProperties = {
  animation: 'dc-msg-in 100ms ease-out',
}

const ChatMessage = React.memo(function ChatMessage({ message, loadingComponent }: ChatMessageProps) {
  const flags = getMessageFlags(message)

  // Don't render empty assistant messages
  if (!flags.shouldRender) return null

  const { isUser, hasContent, hasError } = flags

  return (
    <div
      className={`dc:flex dc:mb-3 ${isUser ? 'dc:justify-end' : 'dc:justify-start'}`}
      style={MSG_FADE_IN}
    >
      <div className={`dc:max-w-[85%] dc:rounded-lg dc:px-3 dc:py-2 dc:text-sm ${getBubbleClass(isUser, hasError, hasContent)}`}>
        <ChatBubbleBody message={message} flags={flags} loadingComponent={loadingComponent} />
      </div>
    </div>
  )
})

export default ChatMessage
