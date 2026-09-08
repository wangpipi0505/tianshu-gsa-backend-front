import type {
  SituationEvent,
  SituationRegion,
  SituationTarget,
  SituationTheater,
  SpatialRelation
} from '@/types/situation'
import type { SituationDisplayScope } from '@/types/scene'

export interface TheaterSituationSource {
  targets: SituationTarget[]
  relations: SpatialRelation[]
  regions: SituationRegion[]
  events: SituationEvent[]
}

export interface ResolvedTheaterSituation extends SituationDisplayScope {
  theater: SituationTheater
  name: string
  targets: SituationTarget[]
  relations: SpatialRelation[]
  regions: SituationRegion[]
  events: SituationEvent[]
  focusCoordinates: Array<[number, number]>
}

const THEATER_NAMES: Record<SituationTheater, string> = {
  taiwan: '台海方向',
  south_china: '南海与菲律宾方向',
  mideast: '中东波斯湾与霍尔木兹海峡方向'
}

function inferTheater(target: SituationTarget): SituationTheater | null {
  if (target.theater) return target.theater
  const productVersion = target.createdProductVersion.toUpperCase()
  if (productVersion.includes('MIDEAST') || target.id.startsWith('Target-ME-')) return 'mideast'
  if (productVersion.includes('SCS') || target.id.startsWith('Target-SCS-')) return 'south_china'
  if (productVersion.includes('EASTSEA')) return 'taiwan'
  return null
}

function isRelatedRegion(region: SituationRegion, theater: SituationTheater) {
  if (region.theater) return region.theater === theater
  const id = region.id.toUpperCase()
  if (theater === 'mideast') return id.includes('ME')
  if (theater === 'south_china') return id.includes('SCS')
  return !id.includes('ME') && !id.includes('SCS')
}

/**
 * 从当前数据源的目标、关系、区域和事件实时求取区域全量态势。
 * 仅对构建动作传入额外目标，避免把工作内容重复写入事实层。
 */
export function resolveTheaterSituation(
  source: TheaterSituationSource,
  theater: SituationTheater,
  additionalTargetIds: string[] = []
): ResolvedTheaterSituation {
  const additionalIds = new Set(additionalTargetIds)
  const targets = source.targets.filter((target) => inferTheater(target) === theater || additionalIds.has(target.id))
  const targetIds = new Set(targets.map((target) => target.id))
  const relations = source.relations.filter((relation) =>
    targetIds.has(relation.sourceTargetId) && targetIds.has(relation.targetTargetId)
  )
  const events = source.events.filter((event) =>
    event.affectedTargetIds.some((targetId) => targetIds.has(targetId))
  )
  const regions = source.regions.filter((region) => isRelatedRegion(region, theater))
  const focusCoordinates: Array<[number, number]> = [
    ...targets.map((target) => [target.longitude, target.latitude] as [number, number]),
    ...regions.flatMap((region) => region.coordinates)
  ]

  return {
    theater,
    name: THEATER_NAMES[theater],
    targetIds: targets.map((target) => target.id),
    relationIds: relations.map((relation) => relation.id),
    regionIds: regions.map((region) => region.id),
    eventIds: events.map((event) => event.id),
    targets,
    relations,
    regions,
    events,
    focusCoordinates
  }
}
