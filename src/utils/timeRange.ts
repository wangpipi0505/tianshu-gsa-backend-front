/**
 * 由场景数据推导时间轴起止、相位与密度桶。
 */

export interface TimelineExtent {
  start: string
  end: string
  presentAnchor: string
  startMs: number
  endMs: number
  presentMs: number
  totalMs: number
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

export function formatLocalDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

export function parseTime(value: string): number {
  const ms = new Date(value.replace(/-/g, '/')).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

export function ceilToHour(ms: number): number {
  const d = new Date(ms)
  if (d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0) {
    return ms
  }
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return d.getTime()
}

export function floorToHour(ms: number): number {
  const d = new Date(ms)
  d.setMinutes(0, 0, 0)
  return d.getTime()
}

export function deriveTimelineExtent(times: string[], presentAnchor: string): TimelineExtent {
  const valid = times.map(parseTime).filter((ms) => ms > 0)
  const presentMs = parseTime(presentAnchor)
  const minMs = valid.length ? Math.min(...valid, presentMs) : presentMs
  const maxMs = valid.length ? Math.max(...valid, presentMs) : presentMs
  const startMs = floorToHour(minMs)
  const endMs = ceilToHour(maxMs)
  return {
    start: formatLocalDateTime(new Date(startMs)),
    end: formatLocalDateTime(new Date(endMs)),
    presentAnchor,
    startMs,
    endMs,
    presentMs,
    totalMs: Math.max(endMs - startMs, 60 * 60 * 1000)
  }
}

export function formatHourLabel(ms: number): string {
  const d = new Date(ms)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export interface DensityBucket {
  startMs: number
  endMs: number
  label: string
  eventCount: number
  sampleCount: number
  total: number
  leftPercent: number
  heightPercent: number
  phase: 'history' | 'present' | 'future'
}

export function buildDensityBuckets(
  extent: TimelineExtent,
  eventTimes: string[],
  sampleTimes: string[]
): DensityBucket[] {
  const hourMs = 60 * 60 * 1000
  const buckets: DensityBucket[] = []
  for (let t = extent.startMs; t < extent.endMs; t += hourMs) {
    const end = Math.min(t + hourMs, extent.endMs)
    const mid = (t + end) / 2
    let phase: DensityBucket['phase'] = 'present'
    if (Math.abs(mid - extent.presentMs) <= hourMs / 2) phase = 'present'
    else if (mid < extent.presentMs) phase = 'history'
    else phase = 'future'
    buckets.push({
      startMs: t,
      endMs: end,
      label: `${formatHourLabel(t)}~${formatHourLabel(end)}`,
      eventCount: 0,
      sampleCount: 0,
      total: 0,
      leftPercent: ((t - extent.startMs) / extent.totalMs) * 100,
      heightPercent: 0,
      phase
    })
  }

  const countIn = (list: string[], bucket: DensityBucket) =>
    list.reduce((n, raw) => {
      const ms = parseTime(raw)
      return ms >= bucket.startMs && ms < bucket.endMs ? n + 1 : n
    }, 0)

  let maxTotal = 1
  buckets.forEach((b) => {
    b.eventCount = countIn(eventTimes, b)
    b.sampleCount = countIn(sampleTimes, b)
    b.total = b.eventCount + b.sampleCount
    maxTotal = Math.max(maxTotal, b.total)
  })
  buckets.forEach((b) => {
    b.heightPercent = b.total === 0 ? 8 : Math.max(18, Math.round((b.total / maxTotal) * 100))
  })
  return buckets
}

export function stepMsFromExtent(totalMs: number): number {
  return Math.max(5 * 60 * 1000, Math.round(totalMs / 21))
}
