/**
 * 智能助手富文本安全净化：剔除可执行脚本与危险协议，保留研判所需的基础标记。
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre', 'span',
  'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'a'
])

export function sanitizeHtml(input: string): string {
  if (!input) return ''

  const withoutScripts = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')

  return withoutScripts.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (full, tag: string, attrs: string) => {
    const name = tag.toLowerCase()
    if (!ALLOWED_TAGS.has(name)) return ''
    if (name === 'a') {
      const hrefMatch = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)')/i)
      const href = hrefMatch ? (hrefMatch[2] || hrefMatch[3] || '') : ''
      if (!href || /^(https?:|mailto:|#)/i.test(href)) {
        return href ? `<a href="${href}" rel="noopener noreferrer" target="_blank">` : '<a>'
      }
      return '<a>'
    }
    return full.startsWith('</') ? `</${name}>` : `<${name}>`
  })
}
