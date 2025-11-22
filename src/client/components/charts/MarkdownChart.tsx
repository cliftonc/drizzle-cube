import React from 'react'
import type { ChartProps } from '../../types'

interface MarkdownNode {
  type: 'text' | 'bold' | 'italic' | 'link' | 'header' | 'list' | 'listItem' | 'paragraph' | 'break'
  content?: string
  url?: string
  level?: number
  ordered?: boolean
  children?: MarkdownNode[]
  parentOrdered?: boolean // For list items to know if parent list is ordered
}

export default function MarkdownChart({ 
  displayConfig = {},
  height = "100%",
  colorPalette
}: ChartProps) {
  const content = displayConfig.content || ''
  const accentColorIndex = displayConfig.accentColorIndex ?? 0
  const fontSize = displayConfig.fontSize || 'medium'
  const alignment = displayConfig.alignment || 'left'

  // Get accent color from palette
  const getAccentColor = (): string => {
    if (colorPalette?.colors && accentColorIndex < colorPalette.colors.length) {
      return colorPalette.colors[accentColorIndex]
    }
    return '#8884d8' // Default color
  }

  const accentColor = getAccentColor()

  // Font size mapping
  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-lg', 
    large: 'text-xl'
  }

  // Alignment mapping
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  // Simple markdown parser
  const parseMarkdown = (text: string): MarkdownNode[] => {
    const lines = text.split('\n')
    const nodes: MarkdownNode[] = []
    let currentList: MarkdownNode | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (!line) {
        // Empty line - end current list and add line break
        if (currentList) {
          nodes.push(currentList)
          currentList = null
        }
        nodes.push({ type: 'break' })
        continue
      }

      // Headers
      const headerMatch = line.match(/^(#{1,3})\s+(.*)$/)
      if (headerMatch) {
        if (currentList) {
          nodes.push(currentList)
          currentList = null
        }
        nodes.push({
          type: 'header',
          level: headerMatch[1].length,
          content: headerMatch[2]
        })
        continue
      }

      // Unordered list
      const unorderedMatch = line.match(/^[-*+]\s+(.*)$/)
      if (unorderedMatch) {
        if (!currentList || currentList.ordered) {
          if (currentList) nodes.push(currentList)
          currentList = { type: 'list', ordered: false, children: [] }
        }
        currentList.children!.push({
          type: 'listItem',
          children: parseInline(unorderedMatch[1]),
          parentOrdered: false
        })
        continue
      }

      // Ordered list
      const orderedMatch = line.match(/^\d+\.\s+(.*)$/)
      if (orderedMatch) {
        if (!currentList || !currentList.ordered) {
          if (currentList) nodes.push(currentList)
          currentList = { type: 'list', ordered: true, children: [] }
        }
        currentList.children!.push({
          type: 'listItem',
          children: parseInline(orderedMatch[1]),
          parentOrdered: true
        })
        continue
      }

      // Regular paragraph
      if (currentList) {
        nodes.push(currentList)
        currentList = null
      }
      
      nodes.push({
        type: 'paragraph',
        children: parseInline(line)
      })
    }

    // Add any remaining list
    if (currentList) {
      nodes.push(currentList)
    }

    return nodes
  }

  // Parse inline elements (bold, italic, links)
  const parseInline = (text: string): MarkdownNode[] => {
    const nodes: MarkdownNode[] = []
    let remaining = text
    
    while (remaining) {
      // Try to match link first [text](url)
      const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)$/)
      if (linkMatch) {
        const [, before, linkText, url, after] = linkMatch
        if (before) {
          nodes.push(...parseSimpleInline(before))
        }
        nodes.push({
          type: 'link',
          content: linkText,
          url: url
        })
        remaining = after
        continue
      }

      // No more special formatting, parse remaining as simple inline
      nodes.push(...parseSimpleInline(remaining))
      break
    }

    return nodes
  }

  // Parse bold and italic
  const parseSimpleInline = (text: string): MarkdownNode[] => {
    const nodes: MarkdownNode[] = []
    let remaining = text

    while (remaining) {
      // Try bold first **text**
      const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/)
      if (boldMatch) {
        const [, before, boldText, after] = boldMatch
        if (before) nodes.push({ type: 'text', content: before })
        nodes.push({ type: 'bold', content: boldText })
        remaining = after
        continue
      }

      // Try italic *text*
      const italicMatch = remaining.match(/^(.*?)\*([^*]+)\*(.*)$/)
      if (italicMatch) {
        const [, before, italicText, after] = italicMatch
        if (before) nodes.push({ type: 'text', content: before })
        nodes.push({ type: 'italic', content: italicText })
        remaining = after
        continue
      }

      // No more formatting, add as text
      nodes.push({ type: 'text', content: remaining })
      break
    }

    return nodes
  }

  // Render markdown nodes to React elements
  const renderNode = (node: MarkdownNode, key: number, listNumber?: number): React.ReactNode => {
    switch (node.type) {
      case 'text':
        return <span key={key} className="text-dc-text">{node.content}</span>

      case 'bold':
        return <strong key={key} className="font-bold text-dc-text">{node.content}</strong>

      case 'italic':
        return <em key={key} className="italic text-dc-text">{node.content}</em>

      case 'link':
        return (
          <a 
            key={key}
            href={node.url}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="hover:underline transition-colors"
            style={{ color: accentColor }}
          >
            {node.content}
          </a>
        )

      case 'header':
        // Header classes that scale with fontSize setting
        const getHeaderClasses = (level: number, fontSize: string) => {
          const baseClasses = 'font-bold'
          const marginClasses = {
            1: 'mb-4',
            2: 'mb-3', 
            3: 'mb-2'
          }
          
          let sizeClasses = ''
          if (fontSize === 'small') {
            sizeClasses = { 1: 'text-lg', 2: 'text-base', 3: 'text-sm' }[level] || 'text-sm'
          } else if (fontSize === 'large') {
            sizeClasses = { 1: 'text-5xl', 2: 'text-4xl', 3: 'text-3xl' }[level] || 'text-3xl'
          } else { // medium (default)
            sizeClasses = { 1: 'text-3xl', 2: 'text-2xl', 3: 'text-xl' }[level] || 'text-xl'
          }
          
          return `${baseClasses} ${sizeClasses} ${marginClasses[level as keyof typeof marginClasses]}`
        }
        
        const HeaderTag = `h${node.level}` as keyof JSX.IntrinsicElements
        return (
          <HeaderTag 
            key={key} 
            className={getHeaderClasses(node.level as number, fontSize)}
            style={{ color: accentColor }}
          >
            {node.content}
          </HeaderTag>
        )

      case 'paragraph':
        return (
          <p key={key} className="mb-3 leading-relaxed">
            {node.children?.map((child, i) => renderNode(child, i))}
          </p>
        )

      case 'list':
        const ListTag = node.ordered ? 'ol' : 'ul'
        let listClasses = 'mb-3'
        
        if (alignment === 'center') {
          listClasses += ' list-none flex flex-col items-center'
        } else if (alignment === 'right') {
          listClasses += ' list-none ml-auto max-w-max'
        } else {
          listClasses += ' list-none ml-6'
        }
        
        return (
          <ListTag key={key} className={listClasses}>
            {node.children?.map((child, i) => renderNode(child, i, node.ordered ? i + 1 : undefined))}
          </ListTag>
        )

      case 'listItem':
        if (node.children) {
          // For ordered lists, use custom colored numbers
          if (node.parentOrdered && listNumber !== undefined) {
            const numberSizeClass = fontSizeClasses[fontSize as keyof typeof fontSizeClasses]
            
            if (alignment === 'center') {
              return (
                <li key={key} className="mb-1 flex items-center justify-center">
                  <span 
                    className={`inline-block mr-2 shrink-0 ${numberSizeClass} font-medium`}
                    style={{ color: accentColor }}
                  >
                    {listNumber}.
                  </span>
                  <span className="text-center">
                    {node.children.map((child, i) => renderNode(child, i))}
                  </span>
                </li>
              )
            } else if (alignment === 'right') {
              return (
                <li key={key} className="mb-1 flex items-start justify-end">
                  <span className="text-right">
                    {node.children.map((child, i) => renderNode(child, i))}
                  </span>
                  <span 
                    className={`inline-block ml-2 shrink-0 ${numberSizeClass} font-medium`}
                    style={{ color: accentColor }}
                  >
                    {listNumber}.
                  </span>
                </li>
              )
            } else {
              return (
                <li key={key} className="mb-1 flex items-start">
                  <span 
                    className={`inline-block mr-3 shrink-0 ${numberSizeClass} font-medium`}
                    style={{ color: accentColor }}
                  >
                    {listNumber}.
                  </span>
                  <span className="flex-1">
                    {node.children.map((child, i) => renderNode(child, i))}
                  </span>
                </li>
              )
            }
          }
          
          // For unordered lists, use custom bullets with alignment
          if (alignment === 'center') {
            return (
              <li key={key} className="mb-1 flex items-center justify-center">
                <span 
                  className="inline-block w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-center">
                  {node.children.map((child, i) => renderNode(child, i))}
                </span>
              </li>
            )
          } else if (alignment === 'right') {
            return (
              <li key={key} className="mb-1 flex items-start justify-end">
                <span className="text-right">
                  {node.children.map((child, i) => renderNode(child, i))}
                </span>
                <span 
                  className="inline-block w-2 h-2 rounded-full ml-2 mt-2 shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
              </li>
            )
          } else {
            return (
              <li key={key} className="mb-1 flex items-start">
                <span 
                  className="inline-block w-2 h-2 rounded-full mr-3 mt-2 shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="flex-1">
                  {node.children.map((child, i) => renderNode(child, i))}
                </span>
              </li>
            )
          }
        }
        return null

      case 'break':
        return <br key={key} />

      default:
        return null
    }
  }

  if (!content.trim()) {
    return (
      <div
        className="flex items-center justify-center w-full h-full"
        style={{
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? '200px' : undefined
        }}
      >
        <div className="text-center text-dc-text-muted">
          <div className="text-sm font-semibold mb-1">No content</div>
          <div className="text-xs text-dc-text-secondary">Add markdown content in the chart configuration</div>
        </div>
      </div>
    )
  }

  const parsedNodes = parseMarkdown(content)

  return (
    <div 
      className={`p-4 w-full h-full overflow-auto ${fontSizeClasses[fontSize as keyof typeof fontSizeClasses]} ${alignmentClasses[alignment as keyof typeof alignmentClasses]}`}
      style={{ 
        height: height === "100%" ? "100%" : height,
        minHeight: height === "100%" ? '200px' : undefined
      }}
    >
      {parsedNodes.map((node, index) => renderNode(node, index))}
    </div>
  )
}