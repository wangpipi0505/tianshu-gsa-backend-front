/**
 * @file situation.ts
 * @description 态势事实层核心领域数据类型（纯中文规范：目标、高维特性、航迹、关联关系、空间区域、环境气象、冲突记录）
 */

export type AffiliationType = 'friend' | 'foe' | 'neutral' | 'unknown'
export type TargetDomainType = 'air' | 'sea' | 'ground' | 'space' | 'subsurface'
export type RelationSemanticType = 'command' | 'threat' | 'coordination' | 'escort' | 'formation' | 'strike' | 'scan'

/** 时空航迹采样点 */
export interface TrackPoint {
  longitude: number
  latitude: number
  altitude: number
  timestamp: string
  speedKnots?: number
  headingDeg?: number
  isInterpolated?: boolean
}

/** 观测冲突记录 */
export interface ObservationConflict {
  id: string
  field: string
  observations: Array<{
    source: string
    value: string | number
    timestamp: string
    confidence: number
  }>
  resolutionStatus: 'unresolved' | 'resolved' | 'discarded'
}

/** 目标高维物理与电磁特性 */
export interface OpticalFeatures {
  lengthMeters: number
  wingspanMeters: number
  hasDualTail: boolean
  infraredHotspotCount?: number
  stealthCoatingDetected?: boolean
  confidence: number
}

export interface RadarFeatures {
  rcsMeanSqMeters: number
  dopplerShiftHz: number
  frequencyBand: string
  pulseWidthUs: number
  priUs?: number
  modulationType?: string
}

/** 态势目标实体 (唯一事实) */
export interface SituationTarget {
  id: string
  codeName: string
  callsign: string
  type: string
  affiliation: AffiliationType
  status: 'active' | 'lost' | 'archived'
  isHypothesis?: boolean
  imageUrl?: string // 目标高保真实体图像/外观图

  // 动态时空位置
  longitude: number
  latitude: number
  altitude: number
  speedKnots: number
  headingDeg: number
  tracks: TrackPoint[]

  // 战备与任务状态描述
  operationalStatus?: {
    readinessLevel: string
    missionTask: string
    sensorMode: string
    datalinkState: string
    fuelOrHealthPercent: number
  }

  // 高维特性
  opticalFeatures?: OpticalFeatures
  radarFeatures?: RadarFeatures

  // 传感器与雷达照射参数
  sensorCoverage?: {
    radarRangeKm: number
    scanAngleDeg: number
    coneColor: string
    isScanning?: boolean
  }

  // 未来预测外推与时空切片联动扩展
  predictedTracks?: TrackPoint[]
  futureBranches?: FutureBranch[]
  temporalSlices?: TemporalSlice[]

  // 冲突保留与证据溯源
  conflicts: ObservationConflict[]
  evidenceIds: string[]
  createdProductVersion: string
}

/** 未来多分支战术推演假说 */
export interface FutureBranch {
  branchId: string
  name: string
  tacticalIntent: string
  color: string
  probability: number
  predictedTracks: TrackPoint[]
  futureArrivalPoint: [number, number, number] // [lon, lat, alt]
  estimatedTime: string
  threatDescription: string
}

/** 三态切片的时相：历史观测 / 当前基准 / 未来预测 */
export type TemporalPhase = 'history' | 'present' | 'future'

/** 历史-当前-未来三态时空切片点位 */
export interface TemporalSlice {
  phase: TemporalPhase
  time: string
  label: string
  longitude: number
  latitude: number
  altitude: number
  speedKnots: number
  headingDeg: number
  remark: string
}

/** 4D时空研判与演化呈现模式 */
export type TemporalMode = 'playback' | 'slices' | 'branches' | 'realtime'

/** 空间与领域语义关系 (伴飞、结队、打击、指挥、协同等) */
export interface SpatialRelation {
  id: string
  relationType: RelationSemanticType
  relationName: string
  sourceTargetId: string
  targetTargetId: string
  spatialDistanceKm: number
  confidence: number
  description: string
  isActive: boolean
}

/** 态势区域 (防空威胁包络、管制责任区、水面协同区等) */
export interface SituationRegion {
  id: string
  name: string
  category: 'threat_zone' | 'patrol_area' | 'coordination_area' | 'restricted'
  coordinates: Array<[number, number]>
  minAltitude: number
  maxAltitude: number
  color: string
  opacity: number
  description: string
  /** 专题研判成果扩展属性 (威胁等级、研判结论等) */
  thematicAttributes?: Record<string, unknown>
}

/** 战场气象与海洋水文环境状态 */
export interface BattlefieldEnvironment {
  weatherType: 'rain_fog' | 'heavy_cloud' | 'clear' | 'thunderstorm'
  weatherName: string
  cloudCoverPercent: number
  seaStateLevel: number
  seaStateDesc: string
  visibilityKm: number
  waveHeightMeters: number
  windDirectionDeg: number
  windSpeedKnots: number
  temperatureCelsius: number
  electromagneticDucting: boolean
  radarAttenuationDbKm: number
  opticalAttenuationPercent: number
}

/** 态势事件 */
export interface SituationEvent {
  id: string
  eventName: string
  category: string
  timestamp: string
  location: [number, number, number]
  affectedTargetIds: string[]
  severity: 'critical' | 'warning' | 'normal'
  description: string
  evidenceIds: string[]
}

/** 证据链溯源项 */
export interface EvidenceItem {
  id: string
  code?: string
  title: string
  sourceType: string
  datasetVersion: string
  recordedTime: string
  confidenceScore: number
  payloadSummary: string
  /** 以下为可选扩展：证据溯源与数据集关联 */
  category?: string
  sourceDatasetId?: string
  sourceDatasetName?: string
  rawRecordId?: string
  rawPayloadSnippet?: Record<string, unknown>
}

/** 态势综合研判结论 */
export interface ComprehensiveAssessment {
  sceneId: string
  timestamp: string
  summaryText: string
  threatLevel: 'high' | 'medium' | 'low'
  keyEntities: string[]
  actionRecommendation: string
}
