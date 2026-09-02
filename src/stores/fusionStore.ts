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
import { useSituationStore } from '@/stores/situationStore'
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
      // 本地原型也要产生真实的版本留痕：新增资产版本与数据产品，而不是返回旧数据
      const job = fusionJobs.value.find((j) => j.id === jobId)
      const situation = useSituationStore()
      const seq = assetVersions.value.length + 1
      const now = new Date()
      const pad = (n: number) => (n < 10 ? `0${n}` : n)
      const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      const decided = job?.candidates.filter((c) => c.decision && c.decision !== 'unconfirmed') ?? []

      const assetVersion: SituationalAssetVersion = {
        versionId: `ASSET-VER-20260825-v2.${seq + 1}`,
        jobReferenceId: jobId,
        assetCount: {
          targets: situation.targets.length,
          events: situation.events.length,
          tracks: situation.targets.reduce((n, t) => n + (t.tracks?.length || 0), 0),
          relations: situation.relations.length,
          regions: situation.regions.length
        },
        createdTime: ts,
        changeLog: `本地原型发布：${decided.length ? `${decided.length} 项候选关联已完成人工研判` : '无新增人工研判'}，快照含 ${situation.targets.length} 个作战实体`,
        isLocked: false
      }
      const base = productReleases.value[0]
      const release: ProductRelease = {
        productId: `PROD-SITUATION-EASTSEA-${String(seq + 1).padStart(2, '0')}`,
        productName: base?.productName || '态势综合数据产品',
        assetVersionId: assetVersion.versionId,
        releaseVersion: `PROD-SITUATION-EASTSEA-v2.${seq + 1}`,
        publishTime: ts,
        refreshPolicy: 'manual',
        status: 'published',
        statement: {
          sources: base?.statement.sources || [],
          fusionScope: job?.topic || '多源关联融合',
          spatialRange: base?.statement.spatialRange || '东南海空域',
          timeWindow: `截至 ${ts}`,
          lastUpdated: ts
        }
      }
      assetVersions.value.unshift(assetVersion)
      productReleases.value.unshift(release)
      return { assetVersion, productVersion: release }
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
