/**
 * NotebookCanvas - Left panel displaying notebook blocks
 */

import React, { useCallback, useRef, useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useNotebookStore, selectBlocks, selectBlockActions } from '../../stores/notebookStore'
import type { PortletBlock } from '../../stores/notebookStore'
import type { PortletConfig } from '../../types'
import type { ColorPalette } from '../../utils/colorPalettes'
import { getColorPalette } from '../../utils/colorPalettes'
import { ensureAnalysisConfig } from '../../utils/configMigration'
import NotebookPortletBlock from './NotebookPortletBlock'
import NotebookMarkdownBlock from './NotebookMarkdownBlock'
import PortletAnalysisModal from '../PortletAnalysisModal'
import { t } from '../../../i18n/runtime'

const NotebookCanvas = React.memo(function NotebookCanvas({ colorPalette }: { colorPalette?: ColorPalette }) {
  const resolvedPalette = colorPalette ?? getColorPalette()
  const blocks = useNotebookStore(selectBlocks)
  const { removeBlock, moveBlock, updateBlock } = useNotebookStore(useShallow(selectBlockActions))
  const endRef = useRef<HTMLDivElement>(null)

  // Edit modal state
  const [editingBlock, setEditingBlock] = useState<PortletBlock | null>(null)

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
  const handleEdit = useCallback((block: PortletBlock) => setEditingBlock(block), [])

  const handleEditSave = useCallback((portletData: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => {
    if (!editingBlock) return

    // Normalize to ensure analysisConfig exists
    const normalized = ensureAnalysisConfig(portletData as PortletConfig)
    const { analysisConfig } = normalized

    if (analysisConfig) {
      const chartModeConfig = analysisConfig.charts[analysisConfig.analysisType]
      updateBlock(editingBlock.id, {
        title: portletData.title,
        query: JSON.stringify(analysisConfig.query),
        chartType: chartModeConfig?.chartType || 'bar',
        chartConfig: chartModeConfig?.chartConfig,
        displayConfig: chartModeConfig?.displayConfig,
      })
    }

    setEditingBlock(null)
  }, [editingBlock, updateBlock])

  if (blocks.length === 0) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:h-full">
        <div className="dc:text-center dc:max-w-sm dc:px-6">
          <h3 className="dc:text-base dc:font-semibold text-dc-text dc:mb-2">
            {t('notebook.canvas.emptyTitle')}
          </h3>
          <p className="dc:text-sm text-dc-text-secondary">
            {t('notebook.canvas.emptyDescription')}
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
              colorPalette={resolvedPalette}
              onRemove={handleRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onEdit={handleEdit}
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

      {/* Edit modal */}
      <PortletAnalysisModal
        isOpen={!!editingBlock}
        onClose={() => setEditingBlock(null)}
        onSave={handleEditSave}
        colorPalette={resolvedPalette}
        portlet={editingBlock ? {
          id: editingBlock.id,
          title: editingBlock.title,
          query: editingBlock.query,
          chartType: editingBlock.chartType,
          chartConfig: editingBlock.chartConfig,
          displayConfig: editingBlock.displayConfig,
          w: 5, h: 4, x: 0, y: 0,
        } : null}
        title={t('notebook.canvas.editVisualization')}
        submitText={t('notebook.canvas.update')}
      />
    </div>
  )
})

export default NotebookCanvas
