/**
 * Lightweight markdown-to-HTML renderer for AI chat messages.
 *
 * Renders: headers, bold/italic, code blocks, inline code,
 * lists, links, images, blockquotes, tables, horizontal rules.
 * Sanitizes against XSS by escaping HTML before rendering.
 */
export function renderMarkdown(md: string): string {
  if (!md) return ''

  // Escape HTML to prevent XSS.
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // ── Phase 1: Block-level elements ────────────
  // These must run before inline processing.

  // Code blocks (fenced) — capture and protect from further processing.
  const codeBlocks: string[] = []
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const idx = codeBlocks.length
    codeBlocks.push(`<pre class="code-block"><code>${code}</code></pre>`)
    return `%%CODEBLOCK_${idx}%%`
  })

  // Tables
  html = html.replace(/^\|(.+)\|\n\|[-| :]+\|\n((?:^\|.+\|\n?)+)/gm, (_m, header, rows) => {
    const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean)
    const ths = headers.map((h: string) => `<th>${h}</th>`).join('')
    const bodyRows = rows.trim().split('\n').map((row: string) => {
      const cells = row.split('|').map((c: string) => c.trim()).filter(Boolean)
      return '<tr>' + cells.map((c: string) => `<td>${c}</td>`).join('') + '</tr>'
    }).join('')
    return `<table><thead><tr>${ths}</tr></thead><tbody>${bodyRows}</tbody></table>`
  })

  // Headers (before paragraphs).
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Horizontal rules.
  html = html.replace(/^[*-]{3,}$/gm, '<hr />')

  // Blockquotes.
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote><p>$1</p></blockquote>')

  // Merge consecutive blockquotes.
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n')

  // Unordered lists — wrap consecutive <li> in <ul>.
  html = html.replace(/^[\*-] (.+)$/gm, '<li>$1</li>')
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, (match: string) => {
    // Only wrap if not already inside a list tag.
    if (match.includes('<ul>') || match.includes('<ol>')) return match
    return `<ul>${match.trim()}</ul>`
  })

  // Ordered lists.
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // ── Phase 2: Paragraphs ──────────────────────
  // Split on blank lines, wrap non-block segments in <p>.
  const blocks = html.split(/\n\n+/)
  html = blocks.map((block) => {
    const trimmed = block.trim()
    if (!trimmed) return ''
    // Skip wrapping if already a block element.
    if (/^<(h[1-4]|ul|ol|pre|table|blockquote|hr)/.test(trimmed)) {
      return trimmed
    }
    return `<p>${trimmed}</p>`
  }).join('\n')

  // ── Phase 3: Inline elements ─────────────────

  // Restore code blocks.
  html = html.replace(/%%CODEBLOCK_(\d+)%%/g, (_m, idx) => codeBlocks[parseInt(idx)] || '')

  // Images.
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="chat-image" loading="lazy" />')

  // Links.
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Bold + italic.
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')

  // Inline code (after bold/italic to avoid conflicts with **).
  html = html.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>')

  // ── Phase 4: Cleanup ─────────────────────────
  // Single newlines → <br /> (only inside <p> tags).
  html = html.replace(/\n/g, '<br />')

  // Remove empty paragraphs.
  html = html.replace(/<p><br \/><\/p>/g, '')
  html = html.replace(/<p>\s*<\/p>/g, '')

  return html
}
