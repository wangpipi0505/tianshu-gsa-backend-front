/**
 * 时空检索：矩形范围 × 时间窗 × 类型/敌我属性组合过滤。
 */

import type { AffiliationType, SituationTarget } from '@/types/situation'
import { parseTime } from '@/utils/timeRange'

export interface SearchRect {
  west: number
  east: number
  south: number
  north: number
}

export interface SearchCriteria {
  rect?: SearchRect | null
  timeStart?: string
  timeEnd?: string
  types: string[]
  affiliations: AffiliationType[]
}

export interface SearchHit {
  target: SituationTarget
  distanceKm: number
}

const TYPE_ALIASES: Record<string, string[]> = {
  aircraft: ['aircraft', 'air'],
  warship: ['warship', 'maritime', 'sea'],
  facility: ['facility', 'ground']
}

export function normalizeTargetType(type: string): 'aircraft' | 'warship' | 'facility' | 'other' {
  if (TYPE_ALIASES.aircraft.includes(type)) return 'aircraft'
  if (TYPE_ALIASES.warship.includes(type)) return 'warship'
  if (TYPE_ALIASES.facility.includes(type)) return 'facility'
  return 'other'
}

export function haversineKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const r = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function inRect(lon: number, lat: number, rect: SearchRect): boolean {
  const west = Math.min(rect.west, rect.east)
  const east = Math.max(rect.west, rect.east)
  const south = Math.min(rect.south, rect.north)
  const north = Math.max(rect.south, rect.north)
  return lon >= west && lon <= east && lat >= south && lat <= north
}

export function targetMatchesTime(target: SituationTarget, start?: string, end?: string): boolean {
  if (!start && !end) return true
  const startMs = start ? parseTime(start) : 0
  const endMs = end ? parseTime(end) : Number.POSITIVE_INFINITY
  const samples = [
    ...(target.tracks || []).map((p) => parseTime(p.timestamp)),
    parseTime(target.firstSeenTime || ''),
    parseTime(target.lastSeenTime || '')
  ].filter((ms) => ms > 0)
  if (!samples.length) return true
  return samples.some((ms) => ms >= startMs && ms <= endMs)
}

export function runSpatialSearch(targets: SituationTarget[], criteria: SearchCriteria): SearchHit[] {
  const rect = criteria.rect
  const centerLon = rect ? (rect.west + rect.east) / 2 : 0
  const centerLat = rect ? (rect.south + rect.north) / 2 : 0

  return targets
    .filter((t) => {
      if (rect && !inRect(t.longitude, t.latitude, rect)) return false
      if (criteria.types.length) {
        const norm = normalizeTargetType(t.type)
        if (!criteria.types.includes(norm) && !criteria.types.includes(t.type)) return false
      }
      if (criteria.affiliations.length && !criteria.affiliations.includes(t.affiliation)) return false
      return targetMatchesTime(t, criteria.timeStart, criteria.timeEnd)
    })
    .map((target) => ({
      target,
      distanceKm: rect ? haversineKm(centerLon, centerLat, target.longitude, target.latitude) : 0
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
}
