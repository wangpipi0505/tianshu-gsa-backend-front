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
import type { SituationTarget } from '@/types/situation'
import { fetchAnalysisModels, fetchThematicAssets, publishThematicAsset, runAnalysis } from '@/api/analysis'
import { USE_MOCK, cloneMock } from '@/config/dataSource'
import { useSituationStore } from '@/stores/situationStore'
import { MOCK_THEMATIC_ASSETS } from '@/mock/mockAnalysis'

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
  const objectRangeTargetIds = ref<string[]>([])
  const objectRangeLabel = ref('')

  function applyMock() {
    thematicAssets.value = cloneMock(MOCK_THEMATIC_ASSETS)
    computeFromSituation()
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

  /**
   * mock 口径下从态势事实层 (situationStore) 实时聚合分析结果，
   * 保证"工作台 10 个目标 → 分析页统计一致"，且分析口径切换产生差异化数据。
   */
  function computeFromSituation() {
    const situation = useSituationStore()
    const scope = currentSourceScope.value
    const scopeExcludesHypothesis = scope === 'fact_only' || scope === 'source_compare'
    const isWorkContentTarget = (t: SituationTarget) =>
      t.isHypothesis === true || t.id.startsWith('CONSTRUCT-') || t.id.startsWith('SIM-HYPO')
    const rangeIds = objectRangeTargetIds.value
    const pool = rangeIds.length
      ? situation.targets.filter((t) => rangeIds.includes(t.id))
      : situation.targets
    const targets = pool.filter((t) => (scopeExcludesHypothesis ? !isWorkContentTarget(t) : true))
    if (scope === 'work_only') {
      // 仅标绘推演口径：只统计推演假设与构建目标
      const workTargets = pool.filter(isWorkContentTarget)
      buildStatistical(workTargets, situation)
      buildTrajectory(workTargets[0] || null)
    } else {
      buildStatistical(targets, situation)
      buildTrajectory(targets.find((t) => t.affiliation === 'foe' && t.type === 'aircraft') || targets[0] || null)
    }
    buildAssociation(situation, scopeExcludesHypothesis)
  }

  function buildStatistical(targets: SituationTarget[], situation: ReturnType<typeof useSituationStore>) {
    const typeMeta: Array<{ match: (t: SituationTarget) => boolean; name: string; color: string }> = [
      { match: (t) => t.type === 'aircraft' || t.type === 'air', name: '空中目标', color: '#ff4d4f' },
      { match: (t) => t.type === 'warship' || t.type === 'maritime', name: '水面舰艇', color: '#00d2ff' },
      { match: (t) => t.type === 'ground_facility' || t.type === 'ground' || t.type === 'facility', name: '地面设施', color: '#52c41a' }
    ]
    const groups = typeMeta
      .map((meta) => {
        const count = targets.filter(meta.match).length
        return { name: meta.name, count, color: meta.color }
      })
      .filter((g) => g.count > 0)
    const otherCount = targets.length - groups.reduce((s, g) => s + g.count, 0)
    if (otherCount > 0) groups.push({ name: '其他要素', count: otherCount, color: '#b37feb' })

    // 活动时序密度：按航迹采样点的小时桶统计
    const hourBuckets = new Map<string, number>()
    targets.forEach((t) => {
      t.tracks?.forEach((p) => {
        const hour = p.timestamp?.slice(11, 13)
        if (hour) hourBuckets.set(`${hour}:00`, (hourBuckets.get(`${hour}:00`) || 0) + 1)
      })
    })
    const timeSeriesDensity = Array.from(hourBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timestamp, count]) => ({ timestamp, count }))

    // 冲突保留率：未决冲突占全部冲突记录比例
    const allConflicts = targets.flatMap((t) => t.conflicts || [])
    const unresolved = allConflicts.filter((c) => c.resolutionStatus !== 'resolved').length

    statisticalResult.value = {
      totalCount: targets.length,
      categoryBreakdown: groups.map((g) => ({
        name: g.name,
        count: g.count,
        ratio: targets.length ? Math.round((g.count / targets.length) * 1000) / 10 : 0,
        color: g.color
      })),
      timeSeriesDensity,
      spatialGrids: statisticalResult.value.spatialGrids,
      conflictRate: allConflicts.length ? Math.round((unresolved / allConflicts.length) * 1000) / 10 : 0,
      coverageScore: 95.6
    }
    void situation
  }

  function buildTrajectory(target: SituationTarget | null) {
    if (!target || !target.tracks?.length) {
      trajectoryResult.value = { ...emptyTrajectory }
      return
    }
    const fmt = (ts: string) => ts?.slice(11, 16) || ''
    const speedProfile = target.tracks.map((p) => ({ time: fmt(p.timestamp), speed: p.speedKnots ?? target.speedKnots }))
    const altitudeProfile = target.tracks.map((p) => ({ time: fmt(p.timestamp), altitude: p.altitude }))
    const turningPoints = [] as TrajectoryResult['turningPoints']
    for (let i = 1; i < target.tracks.length; i++) {
      const delta = Math.abs((target.tracks[i].headingDeg ?? target.headingDeg) - (target.tracks[i - 1].headingDeg ?? target.headingDeg))
      if (delta >= 8) {
        turningPoints.push({
          time: fmt(target.tracks[i].timestamp),
          location: [target.tracks[i].longitude, target.tracks[i].latitude],
          angleChangeDeg: Math.round(delta * 10) / 10
        })
      }
    }
    // 徘徊检测：连续 3 个及以上采样点聚在 0.35° 邻域内视为徘徊区
    const loiteringZones = [] as TrajectoryResult['loiteringZones']
    const tracks = target.tracks
    for (let i = 0; i + 2 < tracks.length; i++) {
      const [a, b, c] = [tracks[i], tracks[i + 1], tracks[i + 2]]
      const spread = Math.max(Math.abs(a.longitude - b.longitude), Math.abs(a.latitude - b.latitude), Math.abs(b.longitude - c.longitude), Math.abs(b.latitude - c.latitude))
      if (spread <= 0.35) {
        loiteringZones.push({
          center: [Number(((a.longitude + b.longitude + c.longitude) / 3).toFixed(2)), Number(((a.latitude + b.latitude + c.latitude) / 3).toFixed(2))],
          radiusKm: 35,
          durationMinutes: 60
        })
        break
      }
    }
    trajectoryResult.value = {
      targetId: target.id,
      targetName: `${target.codeName} (${target.callsign})`,
      speedProfile,
      altitudeProfile,
      turningPoints,
      loiteringZones
    }
  }

  function buildAssociation(situation: ReturnType<typeof useSituationStore>, excludeHypothesis: boolean) {
    const targets = situation.targets.filter((t) => (excludeHypothesis ? !t.isHypothesis : true))
    const involved = new Set<string>()
    situation.relations.forEach((r) => {
      involved.add(r.sourceTargetId)
      involved.add(r.targetTargetId)
    })
    const nodes = targets
      .filter((t) => involved.has(t.id))
      .map((t) => ({
        id: t.id,
        name: `${t.codeName} (${t.callsign})`,
        category: t.affiliation === 'foe' ? '外军空中兵力' : t.affiliation === 'friend' ? '我方兵力' : '中立实体',
        symbolSize: 42,
        color: t.affiliation === 'foe' ? '#ff4d4f' : t.affiliation === 'friend' ? '#00d2ff' : '#faad14'
      }))
    const links = situation.relations.map((r) => ({
      source: r.sourceTargetId,
      target: r.targetTargetId,
      relation: r.relationName,
      strength: r.confidence >= 0.9 ? ('strong' as const) : ('weak' as const),
      evidenceCount: r.description.length > 0 ? 2 : 1
    }))
    // 威胁/防御圈直接由实体传感器覆盖参数生成 (真实数据)
    const threatZones = targets
      .filter((t) => t.sensorCoverage && t.sensorCoverage.radarRangeKm > 0)
      .map((t) => ({
        center: [t.longitude, t.latitude] as [number, number],
        radiusKm: t.sensorCoverage!.radarRangeKm,
        threatLevel: (t.affiliation === 'foe' ? 'high' : 'medium') as 'high' | 'medium',
        name: `${t.codeName} ${t.affiliation === 'foe' ? '威胁投射圈' : '探测覆盖圈'}`
      }))
    associationResult.value = { nodes, links, threatZones }
  }

  async function compute() {
    if (USE_MOCK) {
      computeFromSituation()
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

  /** 时间窗预置（来自回放时刻快捷转化） */
  function applyTimePreset(range: [string, string]) {
    currentModel.value.timeWindow = [...range]
  }

  function setObjectRange(ids: string[], label = '') {
    objectRangeTargetIds.value = [...ids]
    objectRangeLabel.value = label
    if (USE_MOCK) computeFromSituation()
  }

  function removeThematicAsset(id: string) {
    thematicAssets.value = thematicAssets.value.filter((t) => t.id !== id)
  }

  async function publishCurrentThematic(
    title: string,
    conclusion: string,
    extra?: { regionId?: string; center?: [number, number]; targetId?: string }
  ) {
    const asset: ThematicAsset = {
      id: `THEMATIC-${Date.now()}`,
      title,
      modelId: currentModel.value.id,
      sourceScope: currentSourceScope.value,
      conclusion,
      resultData: statisticalResult.value,
      projectedToGlobe: true,
      createdAt: new Date().toISOString(),
      productVersionRef: currentModel.value.id,
      ...extra
    }
    if (USE_MOCK) {
      thematicAssets.value.unshift(asset)
      return asset
    }
    const saved = await publishThematicAsset(asset)
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
    setObjectRange,
    applyTimePreset,
    objectRangeTargetIds,
    objectRangeLabel,
    publishCurrentThematic,
    removeThematicAsset
  }
})
