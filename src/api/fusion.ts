import { apiGet, apiPatch, apiPost } from '@/api/http'
import type { AssociationCandidate, DatasetProduct, FusionJob, ProductRelease, SituationalAssetVersion } from '@/types/fusion'

export function fetchDatasets() {
  return apiGet<DatasetProduct[]>('/fusion/datasets')
}

export function registerDataset(dataset: DatasetProduct) {
  return apiPost<DatasetProduct>('/fusion/datasets', dataset)
}

export function fetchFusionJobs() {
  return apiGet<FusionJob[]>('/fusion/jobs')
}

export function createFusionJob(job: Partial<FusionJob>) {
  return apiPost<FusionJob>('/fusion/jobs', job)
}

export function patchFusionJob(id: string, body: Partial<FusionJob>) {
  return apiPatch<FusionJob>(`/fusion/jobs/${id}`, body)
}

export function decideCandidate(
  jobId: string,
  candidateId: string,
  decision: AssociationCandidate['decision'],
  notes?: string
) {
  return apiPost<FusionJob>(`/fusion/jobs/${jobId}/candidates/${candidateId}/decision`, { decision, notes })
}

export function publishFusionJob(jobId: string) {
  return apiPost<{ assetVersion: SituationalAssetVersion; productVersion: ProductRelease }>(`/fusion/jobs/${jobId}/publish`)
}

export function fetchProducts() {
  return apiGet<ProductRelease[]>('/fusion/products')
}

export function fetchAssetVersions() {
  return apiGet<SituationalAssetVersion[]>('/fusion/asset-versions')
}
