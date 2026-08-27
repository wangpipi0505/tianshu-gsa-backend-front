/**
 * @file fusionStore.ts
 * @description 时空数据融合状态管理（数据集登记、融合工作向导、映射配置、候选关联确认、资产发布）
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  DatasetProduct,
  FusionJob,
  AssociationCandidate,
  SituationalAssetVersion,
  ProductRelease
} from '@/types/fusion'
import {
  decideCandidate,
  fetchAssetVersions,
  fetchDatasets,
  fetchFusionJobs,
  fetchProducts,
  publishFusionJob,
  registerDataset as registerDatasetApi
} from '@/api/fusion'
import { USE_MOCK, cloneMock } from '@/config/dataSource'
import { MOCK_DATASETS } from '@/mock/mockDatasets'
import { MOCK_ASSET_VERSIONS, MOCK_FUSION_JOBS, MOCK_PRODUCT_RELEASES } from '@/mock/mockFusion'

export const useFusionStore = defineStore('fusion', () => {
  const datasets = ref<DatasetProduct[]>([])
  const fusionJobs = ref<FusionJob[]>([])
  const assetVersions = ref<SituationalAssetVersion[]>([])
  const productReleases = ref<ProductRelease[]>([])

  function applyMock() {
    datasets.value = cloneMock(MOCK_DATASETS)
    fusionJobs.value = cloneMock(MOCK_FUSION_JOBS)
    assetVersions.value = cloneMock(MOCK_ASSET_VERSIONS)
    productReleases.value = cloneMock(MOCK_PRODUCT_RELEASES)
  }

  async function loadFromApi() {
    if (USE_MOCK) {
      applyMock()
      return
    }
    const [ds, jobs, assets, products] = await Promise.all([
      fetchDatasets(),
      fetchFusionJobs(),
      fetchAssetVersions(),
      fetchProducts()
    ])
    datasets.value = ds || []
    fusionJobs.value = jobs || []
    assetVersions.value = assets || []
    productReleases.value = products || []
  }

  async function confirmCandidateDecision(
    jobId: string,
    candidateId: string,
    decision: AssociationCandidate['decision'],
    notes?: string
  ) {
    if (USE_MOCK) {
      const job = fusionJobs.value.find((j) => j.id === jobId)
      const cand = job?.candidates.find((c) => c.id === candidateId)
      if (cand) {
        cand.decision = decision
        if (notes) cand.reviewNotes = notes
      }
      return
    }
    const updated = await decideCandidate(jobId, candidateId, decision, notes)
    const idx = fusionJobs.value.findIndex((j) => j.id === jobId)
    if (idx >= 0) {
      fusionJobs.value[idx] = updated
    }
  }

  async function publishJob(jobId: string) {
    if (USE_MOCK) {
      return { assetVersion: assetVersions.value[0], productVersion: productReleases.value[0] }
    }
    const result = await publishFusionJob(jobId)
    await loadFromApi()
    return result
  }

  async function registerDataset(dataset: DatasetProduct) {
    if (USE_MOCK) {
      datasets.value.push({ ...dataset })
      return
    }
    const saved = await registerDatasetApi(dataset)
    const idx = datasets.value.findIndex((d) => d.id === saved.id)
    if (idx >= 0) datasets.value[idx] = saved
    else datasets.value.push(saved)
  }

  return {
    datasets,
    fusionJobs,
    assetVersions,
    productReleases,
    applyMock,
    loadFromApi,
    confirmCandidateDecision,
    publishJob,
    registerDataset
  }
})
