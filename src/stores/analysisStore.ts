/**
 * @file analysisStore.ts
 * @description 数据分析状态管理（4类来源范围口径、统计对比、轨迹过程、关联图谱与专题成果）
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  AnalysisModel,
  StatisticalResult,
  TrajectoryResult,
  AssociationResult,
  ThematicAsset,
  SourceScope
} from '@/types/analysis'
import { fetchAnalysisModels, fetchThematicAssets, publishThematicAsset, runAnalysis } from '@/api/analysis'
import { USE_MOCK, cloneMock } from '@/config/dataSource'
import {
  MOCK_ASSOCIATION_RESULT,
  MOCK_STATISTICAL_RESULT,
  MOCK_THEMATIC_ASSETS,
  MOCK_TRAJECTORY_RESULT
} from '@/mock/mockAnalysis'

const emptyStatistical: StatisticalResult = {
  totalCount: 0,
  categoryBreakdown: [],
  timeSeriesDensity: [],
  spatialGrids: [],
  conflictRate: 0,
  coverageScore: 0
}

const emptyTrajectory: TrajectoryResult = {
  targetId: '',
  targetName: '',
  speedProfile: [],
  altitudeProfile: [],
  turningPoints: [],
  loiteringZones: []
}

const emptyAssociation: AssociationResult = {
  nodes: [],
  links: [],
  threatZones: []
}

export const useAnalysisStore = defineStore('analysis', () => {
  const currentSourceScope = ref<SourceScope>('fact_only')
  const currentModel = ref<AnalysisModel>({
    id: 'MODEL-STAT-01',
    name: '东南海空域多源目标分布与活动频度分析',
    category: 'statistical',
    sourceScope: 'fact_only',
    timeWindow: ['2026-08-25 00:00:00', '2026-08-25 15:00:00'],
    spatialFilter: '东南海空重点研判区',
    targetTypes: ['air', 'maritime', 'facility'],
    metrics: ['目标数量', '类型占比', '时序频度', '冲突率']
  })
  const statisticalResult = ref<StatisticalResult>({ ...emptyStatistical })
  const trajectoryResult = ref<TrajectoryResult>({ ...emptyTrajectory })
  const associationResult = ref<AssociationResult>({ ...emptyAssociation })
  const thematicAssets = ref<ThematicAsset[]>([])

  function applyMock() {
    statisticalResult.value = cloneMock(MOCK_STATISTICAL_RESULT)
    trajectoryResult.value = cloneMock(MOCK_TRAJECTORY_RESULT)
    associationResult.value = cloneMock(MOCK_ASSOCIATION_RESULT)
    thematicAssets.value = cloneMock(MOCK_THEMATIC_ASSETS)
  }

  async function loadFromApi() {
    if (USE_MOCK) {
      applyMock()
      return
    }
    const models = await fetchAnalysisModels()
    if (models?.length) {
      currentModel.value = { ...models[0], sourceScope: currentSourceScope.value }
    }
    thematicAssets.value = (await fetchThematicAssets()) || []
    await compute()
  }

  async function compute() {
    if (USE_MOCK) {
      applyMock()
      return
    }
    const result = await runAnalysis({ ...currentModel.value, sourceScope: currentSourceScope.value })
    if (result.statisticalResult) statisticalResult.value = result.statisticalResult
    if (result.trajectoryResult) trajectoryResult.value = result.trajectoryResult
    if (result.associationResult) associationResult.value = result.associationResult
  }

  async function setSourceScope(scope: SourceScope) {
    currentSourceScope.value = scope
    currentModel.value.sourceScope = scope
    await compute()
  }

  async function publishCurrentThematic(title: string, conclusion: string) {
    const saved = await publishThematicAsset({
      id: `THEMATIC-${Date.now()}`,
      title,
      modelId: currentModel.value.id,
      sourceScope: currentSourceScope.value,
      conclusion,
      resultData: statisticalResult.value,
      projectedToGlobe: true,
      createdAt: new Date().toISOString(),
      productVersionRef: currentModel.value.id
    })
    thematicAssets.value.unshift(saved)
    return saved
  }

  return {
    currentSourceScope,
    currentModel,
    statisticalResult,
    trajectoryResult,
    associationResult,
    thematicAssets,
    applyMock,
    loadFromApi,
    compute,
    setSourceScope,
    publishCurrentThematic
  }
})
