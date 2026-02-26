/**
 * ChatInput - Text input for sending messages to the agent
 */

import React, { useCallback, useRef, useEffect } from 'react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  onContinue?: () => void
  isStreaming?: boolean
  showContinue?: boolean
  disabled?: boolean
  placeholder?: string
}

const ChatInput = React.memo(function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  onContinue,
  isStreaming = false,
  showContinue = false,
  disabled = false,
  placeholder = 'Ask about your data...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }, [value])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (!disabled && value.trim()) {
          onSend()
        }
      }
    },
    [disabled, value, onSend]
  )

  return (
    <div className="dc:flex dc:gap-2 dc:items-end dc:p-3 border-dc-border dc:border-t">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="dc:flex-1 dc:resize-none dc:rounded-lg dc:px-3 dc:py-2 dc:text-sm bg-dc-surface-secondary text-dc-text border-dc-border dc:border dc:outline-none dc:focus:ring-1 focus:ring-dc-accent dc:disabled:opacity-50"
      />
      {isStreaming ? (
        <button
          onClick={onStop}
          className="dc:px-4 dc:py-2 dc:rounded-lg dc:text-sm dc:font-medium dc:transition-colors text-dc-error border-dc-border dc:border dc:hover:opacity-80 dc:shrink-0"
        >
          Stop
        </button>
      ) : (
        <>
          {showContinue && !value.trim() && (
            <button
              onClick={() => {
                onContinue?.()
                textareaRef.current?.focus()
              }}
              className="dc:px-4 dc:py-2 dc:rounded-lg dc:text-sm dc:font-medium dc:transition-colors border-dc-border dc:border text-dc-text-secondary dc:hover:opacity-80 dc:shrink-0"
            >
              Continue
            </button>
          )}
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="dc:px-4 dc:py-2 dc:rounded-lg dc:text-sm dc:font-medium dc:transition-colors bg-dc-accent text-dc-accent-text dc:hover:opacity-90 dc:disabled:opacity-40 dc:disabled:cursor-not-allowed dc:shrink-0"
          >
            Send
          </button>
        </>
      )}
    </div>
  )
})

export default ChatInput
