/**
 * NotebookCanvas - Left panel displaying notebook blocks
 */

import React, { useCallback, useRef, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useNotebookStore, selectBlocks, selectBlockActions } from '../../stores/notebookStore'
import NotebookPortletBlock from './NotebookPortletBlock'
import NotebookMarkdownBlock from './NotebookMarkdownBlock'

const NotebookCanvas = React.memo(function NotebookCanvas() {
  const blocks = useNotebookStore(selectBlocks)
  const { removeBlock, moveBlock } = useNotebookStore(useShallow(selectBlockActions))
  const endRef = useRef<HTMLDivElement>(null)

  // Auto-scroll only when NEW blocks are added (not on initial load)
  const prevCountRef = useRef(blocks.length)
  useEffect(() => {
    if (blocks.length > prevCountRef.current) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevCountRef.current = blocks.length
  }, [blocks.length])

  const handleRemove = useCallback((id: string) => removeBlock(id), [removeBlock])
  const handleMoveUp = useCallback((id: string) => moveBlock(id, 'up'), [moveBlock])
  const handleMoveDown = useCallback((id: string) => moveBlock(id, 'down'), [moveBlock])

  if (blocks.length === 0) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:h-full">
        <div className="dc:text-center dc:max-w-sm dc:px-6">
          <div className="dc:text-4xl dc:mb-4 dc:opacity-30">&#x1F4CA;</div>
          <h3 className="dc:text-base dc:font-semibold text-dc-text dc:mb-2">
            Your notebook is empty
          </h3>
          <p className="dc:text-sm text-dc-text-secondary">
            Ask the AI assistant a question about your data.
            Charts and insights will appear here as the assistant analyzes your data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="dc:h-full dc:overflow-y-auto dc:p-4">
      {blocks.map((block, index) => {
        const isFirst = index === 0
        const isLast = index === blocks.length - 1

        if (block.type === 'portlet') {
          return (
            <NotebookPortletBlock
              key={block.id}
              block={block}
              onRemove={handleRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={isFirst}
              isLast={isLast}
            />
          )
        }

        if (block.type === 'markdown') {
          return (
            <NotebookMarkdownBlock
              key={block.id}
              block={block}
              onRemove={handleRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={isFirst}
              isLast={isLast}
            />
          )
        }

        return null
      })}
      <div ref={endRef} />
    </div>
  )
})

export default NotebookCanvas
