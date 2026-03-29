export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function esc(s: unknown): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function linkify(text: string): string {
  const parts = String(text).split(/(https?:\/\/[^\s]+)/)
  return parts
    .map((part, i) => {
      if (i % 2 === 1) {
        const escaped = esc(part)
        return `<a href="${escaped}" target="_blank" rel="noopener noreferrer">${escaped}</a>`
      }
      return esc(part)
    })
    .join('')
}

export function fmtTime(d: Date): string {
  return (
    String(d.getHours()).padStart(2, '0') +
    ':' +
    String(d.getMinutes()).padStart(2, '0')
  )
}

export function fmtTimeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'たった今'
  if (m < 60) return m + '分前'
  const h = Math.floor(m / 60)
  if (h < 24) return h + '時間前'
  return Math.floor(h / 24) + '日前'
}

export function todayStr(): string {
  const d = new Date()
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}
