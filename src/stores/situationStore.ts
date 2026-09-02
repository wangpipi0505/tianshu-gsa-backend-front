/**
 * @file situationStore.ts
 * @description 态势资产状态管理（4D时空动态插值播放引擎、伴飞/结队/打击关系、雷达扫描锥、战场气象环境与智能联动）
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  SituationTarget,
  SituationEvent,
  SpatialRelation,
  SituationRegion,
  BattlefieldEnvironment,
  ComprehensiveAssessment,
  EvidenceItem,
  TemporalMode,
  TemporalPhase,
  TemporalSlice
} from '@/types/situation'
import { fetchSituationSnapshot, resolveTargetConflict } from '@/api/situation'
import { USE_MOCK, cloneMock } from '@/config/dataSource'
import {
  MOCK_TARGETS,
  MOCK_EVENTS,
  MOCK_RELATIONS,
  MOCK_REGIONS,
  MOCK_ENVIRONMENT,
  MOCK_PRIMARY_ASSESSMENT
} from '@/mock/mockSituationAssets'
import { MOCK_EVIDENCE_ITEMS } from '@/mock/mockIntelligence'

export const useSituationStore = defineStore('situation', () => {
  // 核心态势资产列表 (唯一事实层，启动后从库加载)
  const targets = ref<SituationTarget[]>([])
  const events = ref<SituationEvent[]>([])
  const relations = ref<SpatialRelation[]>([])
  const regions = ref<SituationRegion[]>([])
  const evidences = ref<EvidenceItem[]>([])
  const environment = ref<BattlefieldEnvironment>({
    weatherType: 'clear',
    weatherName: '',
    cloudCoverPercent: 0,
    seaStateLevel: 0,
    seaStateDesc: '',
    visibilityKm: 0,
    waveHeightMeters: 0,
    windDirectionDeg: 0,
    windSpeedKnots: 0,
    temperatureCelsius: 0,
    electromagneticDucting: false,
    radarAttenuationDbKm: 0,
    opticalAttenuationPercent: 0
  })
  const activeAssessment = ref<ComprehensiveAssessment>({
    sceneId: '',
    timestamp: '',
    summaryText: '',
    threatLevel: 'medium',
    keyEntities: [],
    actionRecommendation: ''
  })
  const productVersionId = ref('')
  const assetVersionId = ref('')

  // 交互选中的目标与事件 (默认不打开任何弹框)
  const selectedTargetId = ref<string | null>(null)
  const openedPopupTargetIds = ref<string[]>([])
  const selectedEventId = ref<string | null>(null)
  const focusedTargetIds = ref<string[]>(['Target-001', 'Target-002'])

  // 特性展示控制
  const showRadarCones = ref<boolean>(true)
  const showWeatherEffect = ref<boolean>(true)

  // 4D 时空态势演变全时段引擎 (13:00 历史观测 ➔ 15:30 当前基准 ➔ 16:30 未来推演)
  const presentAnchorTime = '2026-08-25 15:30:00'
  const timelineRange = ref<[string, string]>(['2026-08-25 13:00:00', '2026-08-25 16:30:00'])
  const currentPlaybackTime = ref<string>('2026-08-25 15:30:00')
  const isPlaying = ref<boolean>(false)
  const playbackSpeed = ref<number>(1)
  let playbackTimer: any = null

  // 历史与未来态势联动交互模式
  const temporalMode = ref<TemporalMode>('playback') // 'playback' | 'slices' | 'branches' | 'realtime'
  const showFutureTracks = ref<boolean>(true)
  const showTemporalSlices = ref<boolean>(false)
  const showFutureBranches = ref<boolean>(false)
  const selectedFutureBranchId = ref<string>('BRANCH-VIPER-A')

  // 三态切片图层独立显隐 (历史/现在/未来三个时间切面可单独开关组合)
  const sliceLayers = ref<Record<TemporalPhase, boolean>>({
    history: true,
    present: true,
    future: true
  })
  // 三态对比面板当前聚焦的目标与高亮切片
  const activeSliceTargetId = ref<string>('')
  const activeSliceKey = ref<{ targetId: string; index: number } | null>(null)

  // 当前播放时间所处的时空阶段
  const currentTemporalPhase = computed<'history' | 'present' | 'future'>(() => {
    const curMs = new Date(currentPlaybackTime.value).getTime()
    const presentMs = new Date(presentAnchorTime).getTime()
    if (Math.abs(curMs - presentMs) < 60000) return 'present'
    return curMs < presentMs ? 'history' : 'future'
  })

  // 当前选中的目标详细对象
  const selectedTarget = computed(() => {
    if (!selectedTargetId.value) return null
    return targets.value.find((t) => t.id === selectedTargetId.value) || null
  })

  // 关联到当前选中目标的事件
  const selectedTargetEvents = computed(() => {
    if (!selectedTargetId.value) return []
    return events.value.filter((e) => e.affectedTargetIds.includes(selectedTargetId.value!))
  })

  // 关联到当前选中目标的空间与领域关系
  const selectedTargetRelations = computed(() => {
    if (!selectedTargetId.value) return []
    return relations.value.filter(
      (r) => r.sourceTargetId === selectedTargetId.value || r.targetTargetId === selectedTargetId.value
    )
  })

  // 关联到当前选中目标的证据项
  const selectedTargetEvidences = computed(() => {
    if (!selectedTarget.value) return []
    return evidences.value.filter((e) => selectedTarget.value?.evidenceIds.includes(e.id))
  })

  // 选中并打开目标标牌 (支持多开)
  function selectTarget(id: string | null) {
    selectedTargetId.value = id
    if (id && !openedPopupTargetIds.value.includes(id)) {
      openedPopupTargetIds.value.push(id)
    }
  }

  // 切换目标标牌打开/关闭
  function toggleTargetPopup(id: string) {
    selectedTargetId.value = id
    const idx = openedPopupTargetIds.value.indexOf(id)
    if (idx >= 0) {
      openedPopupTargetIds.value.splice(idx, 1)
      if (selectedTargetId.value === id) {
        selectedTargetId.value = openedPopupTargetIds.value[openedPopupTargetIds.value.length - 1] || null
      }
    } else {
      openedPopupTargetIds.value.push(id)
    }
  }

  // 打开指定目标标牌
  function openTargetPopup(id: string) {
    selectedTargetId.value = id
    if (!openedPopupTargetIds.value.includes(id)) {
      openedPopupTargetIds.value.push(id)
    }
  }

  // 关闭指定目标标牌
  function closeTargetPopup(id: string) {
    const idx = openedPopupTargetIds.value.indexOf(id)
    if (idx >= 0) {
      openedPopupTargetIds.value.splice(idx, 1)
    }
    if (selectedTargetId.value === id) {
      selectedTargetId.value = openedPopupTargetIds.value[openedPopupTargetIds.value.length - 1] || null
    }
  }

  // 批量添加/更新目标
  function upsertTarget(target: SituationTarget) {
    const idx = targets.value.findIndex((t) => t.id === target.id)
    if (idx >= 0) {
      targets.value[idx] = { ...target }
    } else {
      targets.value.push({ ...target })
    }
  }

  // 4D 时空插值核心算法：根据时间戳动态计算目标当前空间经纬度与高程（支持历史观测与未来推演全时段平滑贯通）
  function updateTargetsInterpolatedPosition(timeStr: string) {
    const currentMs = new Date(timeStr).getTime()
    const presentAnchorMs = new Date(presentAnchorTime).getTime()

    targets.value.forEach((target) => {
      // 决定当前使用的是历史观测轨迹还是未来预测轨迹
      let trackPoints = target.tracks
      if (currentMs > presentAnchorMs && target.predictedTracks && target.predictedTracks.length >= 2) {
        trackPoints = target.predictedTracks
      }

      if (!trackPoints || trackPoints.length < 2) return

      const firstMs = new Date(trackPoints[0].timestamp).getTime()
      const lastMs = new Date(trackPoints[trackPoints.length - 1].timestamp).getTime()

      if (currentMs <= firstMs) {
        target.longitude = trackPoints[0].longitude
        target.latitude = trackPoints[0].latitude
        target.altitude = trackPoints[0].altitude
        target.speedKnots = trackPoints[0].speedKnots || target.speedKnots
        return
      }

      if (currentMs >= lastMs) {
        const last = trackPoints[trackPoints.length - 1]
        target.longitude = last.longitude
        target.latitude = last.latitude
        target.altitude = last.altitude
        target.speedKnots = last.speedKnots || target.speedKnots
        return
      }

      // 找到时间区间进行线性插值
      for (let i = 0; i < trackPoints.length - 1; i++) {
        const t1 = new Date(trackPoints[i].timestamp).getTime()
        const t2 = new Date(trackPoints[i + 1].timestamp).getTime()
        if (currentMs >= t1 && currentMs <= t2) {
          const ratio = (currentMs - t1) / (t2 - t1)
          target.longitude = trackPoints[i].longitude + (trackPoints[i + 1].longitude - trackPoints[i].longitude) * ratio
          target.latitude = trackPoints[i].latitude + (trackPoints[i + 1].latitude - trackPoints[i].latitude) * ratio
          target.altitude = trackPoints[i].altitude + (trackPoints[i + 1].altitude - trackPoints[i].altitude) * ratio
          target.speedKnots = Math.round(
            (trackPoints[i].speedKnots || 500) +
              ((trackPoints[i + 1].speedKnots || 500) - (trackPoints[i].speedKnots || 500)) * ratio
          )
          break
        }
      }
    })
  }

  // 进度条手动拖拽或者跳转
  function seekTime(timeStr: string) {
    currentPlaybackTime.value = timeStr
    updateTargetsInterpolatedPosition(timeStr)
  }

  // 启动 4D 动态回放
  function startPlayback() {
    if (isPlaying.value) return
    isPlaying.value = true

    if (playbackTimer) clearInterval(playbackTimer)

    playbackTimer = setInterval(() => {
      const curMs = new Date(currentPlaybackTime.value).getTime()
      const endMs = new Date(timelineRange.value[1]).getTime()
      const startMs = new Date(timelineRange.value[0]).getTime()

      // 按倍速推进时间 (每秒推进 15秒 * 倍速)
      const nextMs = curMs + 15000 * playbackSpeed.value
      if (nextMs >= endMs) {
        currentPlaybackTime.value = timelineRange.value[0]
      } else {
        const nextDate = new Date(nextMs)
        const pad = (n: number) => (n < 10 ? `0${n}` : n)
        currentPlaybackTime.value = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDate.getDate())} ${pad(nextDate.getHours())}:${pad(nextDate.getMinutes())}:${pad(nextDate.getSeconds())}`
      }
      updateTargetsInterpolatedPosition(currentPlaybackTime.value)
    }, 400)
  }

  // 暂停 4D 动态回放
  function pausePlayback() {
    isPlaying.value = false
    if (playbackTimer) {
      clearInterval(playbackTimer)
      playbackTimer = null
    }
  }

  function togglePlay() {
    if (isPlaying.value) {
      pausePlayback()
    } else {
      startPlayback()
    }
  }

  function setSpeed(speed: number) {
    playbackSpeed.value = speed
    if (isPlaying.value) {
      pausePlayback()
      startPlayback()
    }
  }

  function applyMock() {
    targets.value = cloneMock(MOCK_TARGETS)
    events.value = cloneMock(MOCK_EVENTS)
    relations.value = cloneMock(MOCK_RELATIONS)
    regions.value = cloneMock(MOCK_REGIONS)
    evidences.value = cloneMock(MOCK_EVIDENCE_ITEMS)
    environment.value = cloneMock(MOCK_ENVIRONMENT)
    activeAssessment.value = cloneMock(MOCK_PRIMARY_ASSESSMENT)
    activeSliceKey.value = null
    activeSliceTargetId.value = ''
    ensureActiveSliceTarget()
  }

  async function loadSnapshot(productVersion?: string) {
    if (USE_MOCK) {
      applyMock()
      return
    }
    const snapshot = await fetchSituationSnapshot(productVersion)
    targets.value = snapshot.targets || []
    events.value = snapshot.events || []
    relations.value = snapshot.relations || []
    regions.value = snapshot.regions || []
    evidences.value = snapshot.evidences || []
    if (snapshot.environment) environment.value = snapshot.environment
    if (snapshot.assessment) activeAssessment.value = snapshot.assessment
    productVersionId.value = snapshot.productVersionId || ''
    assetVersionId.value = snapshot.assetVersionId || ''
    activeSliceKey.value = null
    ensureActiveSliceTarget()
  }

  // 联动交互 1：执行多源融合消除冲突并更新态势轨迹
  async function mergeTargetConflict(targetId: string) {
    if (USE_MOCK) {
      const t = targets.value.find((item) => item.id === targetId)
      if (t) {
        t.conflicts = t.conflicts?.map((c) => ({ ...c, resolutionStatus: 'resolved' as const })) || []
        t.altitude = 8500
        t.speedKnots = 530
      }
      return
    }
    const current = targets.value.find((item) => item.id === targetId)
    const conflictId = current?.conflicts?.find((c) => c.resolutionStatus !== 'resolved')?.id || 'CONF-001'
    const updated = await resolveTargetConflict(targetId, conflictId)
    const idx = targets.value.findIndex((item) => item.id === targetId)
    if (idx >= 0) {
      targets.value[idx] = updated
    }
  }

  // 联动交互 2：注入红蓝突防推演假设航线至三维地球 (紫色虚线)，高度/航速按推演参数生成
  function injectSimulationHypothesis(
    simId = 'SIM-HYPO-001',
    options?: { targetAltitudeM?: number; machSpeed?: number }
  ) {
    const existing = targets.value.find((t) => t.id === simId)
    if (!existing) {
      // 航线高度/航速按推演输入参数生成，保证"改参数 → 上图航线变化"
      const penetrationAlt = Math.max(80, Math.round(options?.targetAltitudeM ?? 300))
      const knots = Math.round((options?.machSpeed ?? 1.4) * 661.47)
      const hypoTarget: SituationTarget = {
        id: simId,
        codeName: '【推演假设】Target-001低空突防航线',
        callsign: 'HYPO-STRIKE-01',
        type: 'aircraft',
        affiliation: 'foe',
        status: 'active',
        isHypothesis: true,
        longitude: 121.85,
        latitude: 24.65,
        altitude: 8500,
        speedKnots: knots,
        headingDeg: 245,
        tracks: [
          { longitude: 121.85, latitude: 24.65, altitude: 8500, timestamp: '2026-08-25 15:20:00' },
          { longitude: 121.2, latitude: 24.2, altitude: Math.round((8500 + penetrationAlt) / 2), timestamp: '2026-08-25 15:25:00' },
          { longitude: 120.6, latitude: 23.7, altitude: penetrationAlt, timestamp: '2026-08-25 15:30:00' },
          { longitude: 119.8, latitude: 23.1, altitude: Math.max(penetrationAlt - 150, 80), timestamp: '2026-08-25 15:35:00' }
        ],
        opticalFeatures: { lengthMeters: 19.2, wingspanMeters: 14.1, hasDualTail: true, confidence: 0.95 },
        radarFeatures: { rcsMeanSqMeters: 2.8, dopplerShiftHz: 1250, frequencyBand: 'X波段', pulseWidthUs: 12 },
        conflicts: [],
        evidenceIds: ['E001', 'E002'],
        createdProductVersion: 'PROD-SIM-v1.0'
      }
      targets.value.push(hypoTarget)
    }
  }

  // 联动交互 3：撤销/移除推演假设航线
  function removeSimulationHypothesis(simId = 'SIM-HYPO-001') {
    const idx = targets.value.findIndex((t) => t.id === simId)
    if (idx >= 0) {
      targets.value.splice(idx, 1)
    }
  }

  // 联动交互 4：气象环境影响与传感器融合误差补偿
  function applyWeatherCompensation() {
    environment.value.radarAttenuationDbKm = 1.1
    environment.value.opticalAttenuationPercent = 15
    environment.value.visibilityKm = 18.0
    environment.value.seaStateDesc = '环境误差已由智能中台完成动态加权补偿'
  }

  /** 还原战场环境为基准值 (用于撤销气象补偿) */
  function resetEnvironment() {
    environment.value = cloneMock(MOCK_ENVIRONMENT)
  }

  // 联动交互 6：时空演化研判模式控制
  function setTemporalMode(mode: TemporalMode) {
    temporalMode.value = mode
    if (mode === 'slices') {
      showFutureBranches.value = false
      enterSlicesMode()
    } else if (mode === 'branches') {
      showFutureBranches.value = true
      showTemporalSlices.value = false
    } else {
      showTemporalSlices.value = false
      showFutureBranches.value = false
    }
  }

  function toggleFutureTracks(val?: boolean) {
    showFutureTracks.value = val !== undefined ? val : !showFutureTracks.value
  }

  // 进入三态切片模式：总开关打开、三个时间切面图层全开、聚焦目标兜底
  function enterSlicesMode() {
    temporalMode.value = 'slices'
    showTemporalSlices.value = true
    sliceLayers.value = { history: true, present: true, future: true }
    ensureActiveSliceTarget()
  }

  function ensureActiveSliceTarget() {
    const valid = targets.value.some((t) => t.id === activeSliceTargetId.value && t.temporalSlices?.length)
    if (!valid) {
      activeSliceTargetId.value = targets.value.find((t) => t.temporalSlices?.length)?.id || ''
    }
  }

  // 用当前基准锚点的日期补全切片时间 (切片数据仅带 HH:mm:ss)
  function getSliceFullTime(slice: Pick<TemporalSlice, 'time'>) {
    return `${presentAnchorTime.split(' ')[0]} ${slice.time}`
  }

  function setSliceLayer(phase: TemporalPhase, visible: boolean) {
    sliceLayers.value = { ...sliceLayers.value, [phase]: visible }
  }

  // 选中某目标的一个切片点：面板聚焦与目标选中态联动 (不自动弹起抽屉与标牌)
  function selectTemporalSlice(targetId: string, index: number) {
    const target = targets.value.find((t) => t.id === targetId)
    if (!target?.temporalSlices?.[index]) return
    activeSliceKey.value = { targetId, index }
    activeSliceTargetId.value = targetId
    selectedTargetId.value = targetId
    if (!showTemporalSlices.value) {
      enterSlicesMode()
    }
  }

  function toggleTemporalSlices(val?: boolean) {
    showTemporalSlices.value = val !== undefined ? val : !showTemporalSlices.value
    if (showTemporalSlices.value) {
      enterSlicesMode()
    } else {
      if (temporalMode.value === 'slices') {
        temporalMode.value = 'playback'
      }
      activeSliceKey.value = null
    }
  }

  function toggleFutureBranches(val?: boolean) {
    showFutureBranches.value = val !== undefined ? val : !showFutureBranches.value
    if (showFutureBranches.value) {
      temporalMode.value = 'branches'
    } else if (temporalMode.value === 'branches') {
      temporalMode.value = 'playback'
    }
  }

  function selectFutureBranch(branchId: string) {
    selectedFutureBranchId.value = branchId
  }

  function resetToPresent() {
    seekTime(presentAnchorTime)
    pausePlayback()
    temporalMode.value = 'realtime'
  }

  // 动态新增研判专题空间包络 (如沉淀的异常徘徊警戒区)
  function addThematicRegion(region: SituationRegion) {
    const idx = regions.value.findIndex((r) => r.id === region.id)
    if (idx >= 0) {
      regions.value[idx] = { ...region }
    } else {
      regions.value.push({ ...region })
    }
  }

  return {
    targets,
    events,
    relations,
    regions,
    evidences,
    environment,
    activeAssessment,
    productVersionId,
    assetVersionId,
    selectedTargetId,
    openedPopupTargetIds,
    selectedEventId,
    focusedTargetIds,
    showRadarCones,
    showWeatherEffect,
    presentAnchorTime,
    timelineRange,
    currentPlaybackTime,
    currentTemporalPhase,
    temporalMode,
    showFutureTracks,
    showTemporalSlices,
    showFutureBranches,
    selectedFutureBranchId,
    sliceLayers,
    activeSliceTargetId,
    activeSliceKey,
    isPlaying,
    playbackSpeed,
    selectedTarget,
    selectedTargetEvents,
    selectedTargetRelations,
    selectedTargetEvidences,
    selectTarget,
    toggleTargetPopup,
    openTargetPopup,
    closeTargetPopup,
    upsertTarget,
    seekTime,
    startPlayback,
    pausePlayback,
    togglePlay,
    setSpeed,
    setTemporalMode,
    toggleFutureTracks,
    toggleTemporalSlices,
    toggleFutureBranches,
    selectFutureBranch,
    setSliceLayer,
    selectTemporalSlice,
    getSliceFullTime,
    resetToPresent,
    applyMock,
    loadSnapshot,
    mergeTargetConflict,
    injectSimulationHypothesis,
    removeSimulationHypothesis,
    applyWeatherCompensation,
    resetEnvironment,
    addThematicRegion
  }
})
