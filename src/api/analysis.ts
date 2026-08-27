import { apiGet, apiPost } from '@/api/http'
import type {
  AnalysisModel,
  AssociationResult,
  StatisticalResult,
  ThematicAsset,
  TrajectoryResult
} from '@/types/analysis'

export interface AnalysisRunResult {
  model: AnalysisModel
  statisticalResult: StatisticalResult
  trajectoryResult: TrajectoryResult
  associationResult: AssociationResult
  computedAt: string
  category: string
}

export function fetchAnalysisModels() {
  return apiGet<AnalysisModel[]>('/analysis/models')
}

export function runAnalysis(model: AnalysisModel) {
  return apiPost<AnalysisRunResult>('/analysis/run', model)
}

export function fetchThematicAssets() {
  return apiGet<ThematicAsset[]>('/analysis/thematic-assets')
}

export function publishThematicAsset(asset: ThematicAsset) {
  return apiPost<ThematicAsset>('/analysis/thematic-assets', asset)
}
