export type SummaryBlock = { kind: 'heading' | 'paragraph'; text: string }

/** Display-only. The stored Gemini text is not rewritten. */
export function summaryBlocks(raw: string): SummaryBlock[] {
  const blocks: SummaryBlock[] = []
  let paragraph: string[] = []

  function flush() {
    const text = cleanInline(paragraph.join(' '))
    if (text) blocks.push({ kind: 'paragraph', text })
    paragraph = []
  }

  for (const line of raw.replace(/\r\n/g, '\n').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || /^([-*_])\1{2,}$/.test(trimmed) || /^```/.test(trimmed)) {
      flush()
      continue
    }

    const heading = headingText(trimmed)
    if (heading) {
      flush()
      const text = cleanInline(heading)
      if (text) blocks.push({ kind: 'heading', text })
      continue
    }

    const bullet = trimmed.match(/^[-*+]\s+(.*)$/)
    if (bullet || /^\d+[.)]\s+/.test(trimmed)) {
      flush()
      const text = cleanInline(bullet ? bullet[1] : trimmed)
      if (text) blocks.push({ kind: 'paragraph', text })
      continue
    }

    paragraph.push(trimmed)
  }

  flush()
  return blocks
}

function headingText(line: string): string | null {
  const hashed = line.match(/^#{1,6}\s+(.*?)\s*#*$/)
  if (hashed) return hashed[1]
  const bold = line.match(/^(?:\*\*|__)(.+?)(?:\*\*|__)$/)
  if (bold) return bold[1]
  return null
}

function cleanInline(value: string): string {
  return value
    .replace(/```/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s*/, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
}
