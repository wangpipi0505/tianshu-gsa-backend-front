import { apiGet, apiPost } from '@/api/http'
import type {
  BattlefieldEnvironment,
  ComprehensiveAssessment,
  EvidenceItem,
  SituationEvent,
  SituationRegion,
  SituationTarget,
  SpatialRelation
} from '@/types/situation'

export interface SituationSnapshot {
  productVersionId: string
  assetVersionId: string
  targets: SituationTarget[]
  events: SituationEvent[]
  relations: SpatialRelation[]
  regions: SituationRegion[]
  evidences: EvidenceItem[]
  environment: BattlefieldEnvironment
  assessment: ComprehensiveAssessment
}

export function fetchSituationSnapshot(productVersionId?: string) {
  return apiGet<SituationSnapshot>('/situation/snapshot', productVersionId ? { productVersionId } : undefined)
}

export function fetchTargetContext(id: string) {
  return apiGet<{
    target: SituationTarget
    events: SituationEvent[]
    relations: SpatialRelation[]
    evidences: EvidenceItem[]
  }>(`/situation/targets/${id}`)
}

export function searchTargets(params: Record<string, unknown>) {
  return apiGet<{ hitCount: number; targets: SituationTarget[] }>('/situation/search', params)
}

export function resolveTargetConflict(targetId: string, conflictId: string) {
  return apiPost<SituationTarget>(`/situation/targets/${targetId}/conflicts/${conflictId}/resolve`)
}

export function fetchRefreshStatus() {
  return apiGet<{ status: string; productVersionId: string; assetVersionId: string }>('/situation/refresh-status')
}
