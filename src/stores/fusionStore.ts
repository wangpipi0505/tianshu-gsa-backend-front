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
  ProductRelease,
  MappingRule,
  RuleChangeLog,
  ExceptionStrategy
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
  const activeJobId = ref('')
  const ruleChangeLogs = ref<RuleChangeLog[]>([])
  const refreshStatus = ref<'latest' | 'updating' | 'failed'>('latest')
  const confirmMode = ref<'人工确认' | '自动发布'>('人工确认')
  const reservedChannels = ['AIS直连', '雷达网直连']

  function nowStamp() {
    const now = new Date()
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n))
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  }

  function applyMock() {
    datasets.value = cloneMock(MOCK_DATASETS)
    fusionJobs.value = cloneMock(MOCK_FUSION_JOBS)
    assetVersions.value = cloneMock(MOCK_ASSET_VERSIONS)
    productReleases.value = cloneMock(MOCK_PRODUCT_RELEASES)
    activeJobId.value = fusionJobs.value[0]?.id || ''
    ruleChangeLogs.value = []
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
    if (!activeJobId.value || !fusionJobs.value.some((j) => j.id === activeJobId.value)) {
      activeJobId.value = fusionJobs.value.find((j) => j.status !== 'archived')?.id || fusionJobs.value[0]?.id || ''
    }
  }

  function activeJob(): FusionJob | undefined {
    return fusionJobs.value.find((j) => j.id === activeJobId.value)
  }

  function setActiveJob(id: string) {
    activeJobId.value = id
  }

  function createFusionJob(draft: {
    name: string
    topic: string
    datasetIds: string[]
    spatialRange: string
    timeRange: [string, string]
    targetTypes: string[]
  }) {
    const job: FusionJob = {
      id: `JOB-FUSION-${Date.now()}`,
      name: draft.name,
      topic: draft.topic,
      datasetIds: [...draft.datasetIds],
      spatialRange: draft.spatialRange,
      timeRange: [...draft.timeRange],
      targetTypes: [...draft.targetTypes],
      status: 'draft',
      currentStep: 1,
      mappingRules: [],
      candidates: [],
      exceptionPolicies: draft.datasetIds.map((datasetId) => ({ datasetId, strategy: 'mark' as ExceptionStrategy })),
      createdAt: nowStamp(),
      updatedAt: nowStamp()
    }
    fusionJobs.value.unshift(job)
    activeJobId.value = job.id
    return job
  }

  function archiveJob(jobId: string) {
    const job = fusionJobs.value.find((j) => j.id === jobId)
    if (!job) return
    job.status = 'archived'
    job.updatedAt = nowStamp()
    if (activeJobId.value === jobId) {
      activeJobId.value = fusionJobs.value.find((j) => j.status !== 'archived')?.id || jobId
    }
  }

  function upsertMappingRule(jobId: string, rule: MappingRule) {
    const job = fusionJobs.value.find((j) => j.id === jobId)
    if (!job) return
    const idx = job.mappingRules.findIndex((r) => r.id === rule.id)
    const action = idx >= 0 ? 'update' : 'create'
    if (idx >= 0) job.mappingRules[idx] = { ...rule }
    else job.mappingRules.push({ ...rule })
    job.updatedAt = nowStamp()
    ruleChangeLogs.value.unshift({
      id: `RULELOG-${Date.now()}`,
      jobId,
      ruleId: rule.id,
      action,
      summary: `${action === 'create' ? '新增' : '更新'}规则 ${rule.sourceField} → ${rule.ontologyEntity}.${rule.ontologyField}`,
      createdAt: nowStamp()
    })
  }

  function deleteMappingRule(jobId: string, ruleId: string) {
    const job = fusionJobs.value.find((j) => j.id === jobId)
    if (!job) return
    const rule = job.mappingRules.find((r) => r.id === ruleId)
    job.mappingRules = job.mappingRules.filter((r) => r.id !== ruleId)
    job.updatedAt = nowStamp()
    ruleChangeLogs.value.unshift({
      id: `RULELOG-${Date.now()}`,
      jobId,
      ruleId,
      action: 'delete',
      summary: `删除规则 ${rule?.sourceField || ruleId}`,
      createdAt: nowStamp()
    })
  }

  function setExceptionStrategy(jobId: string, datasetId: string, strategy: ExceptionStrategy) {
    const job = fusionJobs.value.find((j) => j.id === jobId)
    if (!job) return
    if (!job.exceptionPolicies) job.exceptionPolicies = []
    const existing = job.exceptionPolicies.find((p) => p.datasetId === datasetId)
    if (existing) existing.strategy = strategy
    else job.exceptionPolicies.push({ datasetId, strategy })
    job.updatedAt = nowStamp()
    ruleChangeLogs.value.unshift({
      id: `RULELOG-${Date.now()}`,
      jobId,
      ruleId: datasetId,
      action: 'update',
      summary: `数据源 ${datasetId} 异常处置策略调整为 ${strategy}`,
      createdAt: nowStamp()
    })
  }

  function interpretSample(job: FusionJob, record: Record<string, any>) {
    const interpreted: Record<string, string> = {}
    job.mappingRules.forEach((rule) => {
      const raw = record[rule.sourceField] ?? record[rule.sourceField.split('/')[0]]
      let value = raw == null ? '（无对应字段）' : String(raw)
      if (rule.transformType === 'coordinate_wgs84') {
        value = record.lon != null ? `WGS84 ${record.lon}, ${record.lat}` : value
      } else if (rule.transformType === 'time_iso') {
        value = record.time || record.observedTime || value
      }
      interpreted[`${rule.ontologyEntity}.${rule.ontologyField}`] = `${value}（${rule.transformType}）`
    })
    return {
      objectType: record.targetClass || record.entityCode || job.targetTypes[0] || '未知',
      spatiotemporal: record.time
        ? `${record.time} / ${record.lon ?? '-'}, ${record.lat ?? '-'}`
        : '未提取时空字段',
      relationHint: job.mappingRules.find((r) => r.ontologyEntity.toLowerCase().includes('rel'))?.ruleDescription || '按当前规则未识别关系语义',
      fields: interpreted
    }
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
        if (cand.decision === 'confirmed_same' || cand.decision === 'keep_independent') return
        cand.decision = decision
        cand.reviewNotes = notes || cand.reviewNotes
        cand.decidedAt = nowStamp()
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
        changeLog: `数据服务发布：${decided.length ? `${decided.length} 项候选关联已完成人工研判` : '无新增人工研判'}，快照含 ${situation.targets.length} 个作战实体`,
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
          lastUpdated: ts,
          confirmMode: confirmMode.value
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
      datasets.value.unshift({ ...dataset })
      return
    }
    const saved = await registerDatasetApi(dataset)
    const idx = datasets.value.findIndex((d) => d.id === saved.id)
    if (idx >= 0) datasets.value[idx] = saved
    else datasets.value.push(saved)
  }

  async function refreshLatest() {
    refreshStatus.value = 'updating'
    await new Promise((resolve) => setTimeout(resolve, 600))
    refreshStatus.value = 'latest'
    const ts = nowStamp()
    if (productReleases.value[0]?.statement) {
      productReleases.value[0].statement.lastUpdated = ts
    }
    const situation = useSituationStore()
    situation.seekTime(situation.timelineRange[1] || situation.currentPlaybackTime)
  }

  async function reopenCandidate(jobId: string, candidateId: string) {
    const job = fusionJobs.value.find((j) => j.id === jobId)
    const cand = job?.candidates.find((c) => c.id === candidateId)
    if (!cand) return
    cand.decision = 'unconfirmed'
    cand.decidedAt = undefined
    if (job) job.updatedAt = nowStamp()
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
    registerDataset,
    activeJobId,
    ruleChangeLogs,
    activeJob,
    setActiveJob,
    createFusionJob,
    archiveJob,
    upsertMappingRule,
    deleteMappingRule,
    setExceptionStrategy,
    interpretSample,
    reopenCandidate,
    refreshStatus,
    confirmMode,
    reservedChannels,
    refreshLatest
  }
})
