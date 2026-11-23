/**
 * Finds `<details>`/`<summary>` sections before markdown-to-jsx runs, because
 * the chart parses Markdown with raw HTML disabled. Everything else stays text.
 */

export type MarkdownSegment =
  | { kind: 'markdown'; text: string }
  | { kind: 'disclosure'; key: string; summary: string; body: MarkdownSegment[] }

interface Section {
  source: string
  summary: string
  after: string
  body: MarkdownSegment[]
}

const DETAILS_OPEN = /^ {0,3}<details(?:\s[^>]*)?>[ \t]*/i
const SUMMARY = /^ {0,3}<summary(?:\s[^>]*)?>(.*?)<\/summary>[ \t]*/i
const DETAILS_CLOSE = /^ {0,3}<\/details>[ \t]*$/i
const TRAILING_CLOSE = /<\/details>[ \t]*$/i
const FENCE = /^ {0,3}(`{3,}|~{3,})/

function appendText(segments: MarkdownSegment[], text: string) {
  const last = segments[segments.length - 1]
  if (last?.kind === 'markdown') last.text += `\n${text}`
  else segments.push({ kind: 'markdown', text })
}

function appendSegments(target: MarkdownSegment[], segments: MarkdownSegment[]) {
  for (const segment of segments) {
    if (segment.kind === 'markdown') appendText(target, segment.text)
    else target.push(segment)
  }
}

function disclosure(summary: string, leading: string, body: MarkdownSegment[]): MarkdownSegment {
  const segments: MarkdownSegment[] = []
  if (leading.trim()) appendText(segments, leading)
  appendSegments(segments, body)
  return { kind: 'disclosure', key: '', summary, body: segments }
}

function assignKeys(segments: MarkdownSegment[], seen = new Map<string, number>()) {
  for (const segment of segments) {
    if (segment.kind !== 'disclosure') continue
    const occurrence = seen.get(segment.summary) ?? 0
    seen.set(segment.summary, occurrence + 1)
    segment.key = `${segment.summary}#${occurrence}`
    assignKeys(segment.body, seen)
  }
}

export function parseMarkdownDisclosures(source: string): MarkdownSegment[] {
  const lines = source.split(/\r?\n/)
  const root: MarkdownSegment[] = []
  const stack: Section[] = []
  const target = () => stack.length > 0 ? stack[stack.length - 1].body : root
  let fence: string | null = null

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const fenceMatch = FENCE.exec(line)
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length && line.trim() === fenceMatch[1]) fence = null
      appendText(target(), line)
      continue
    }
    if (fenceMatch) {
      fence = fenceMatch[1]
      appendText(target(), line)
      continue
    }

    const open = DETAILS_OPEN.exec(line)
    if (open) {
      let summaryIndex = index
      let rest = line.slice(open[0].length)
      if (!rest) {
        summaryIndex = index + 1
        while (summaryIndex < lines.length && !lines[summaryIndex].trim()) summaryIndex++
        rest = lines[summaryIndex] ?? ''
      }
      const summary = SUMMARY.exec(rest)
      if (summary) {
        const after = rest.slice(summary[0].length)
        if (TRAILING_CLOSE.test(after)) {
          target().push(disclosure(summary[1].trim(), after.replace(TRAILING_CLOSE, ''), []))
        } else {
          stack.push({ source: lines.slice(index, summaryIndex + 1).join('\n'), summary: summary[1].trim(), after, body: [] })
        }
        index = summaryIndex
        continue
      }
    }

    const section = stack[stack.length - 1]
    if (section && DETAILS_CLOSE.test(line)) {
      stack.pop()
      target().push(disclosure(section.summary, section.after, section.body))
      continue
    }

    appendText(target(), line)
  }

  for (let section = stack.pop(); section; section = stack.pop()) {
    appendText(target(), section.source)
    appendSegments(target(), section.body)
  }

  assignKeys(root)
  return root
}
