/**
 * @file analysis.ts
 * @description 数据分析、统计对比、轨迹过程、关联图谱与专题成果定义
 */

/** 4类内容来源范围口径 (5.5.1) */
export type SourceScope =
  | 'fact_only'
  | 'fact_and_work'
  | 'work_only'
  | 'source_compare'

export type CountMode = 'unified_object' | 'source_record'
export type SpatialAggMode = 'grid' | 'admin' | 'user_rect'

/** 分析问题模型定义 (5.5.2) */
export interface AnalysisModel {
  id: string
  name: string
  category: 'statistical' | 'trajectory' | 'association'
  sourceScope: SourceScope
  timeWindow: [string, string]
  spatialFilter: string
  targetTypes: string[]
  metrics: string[]
}

/** 统计分析计算结果 (5.5.3) */
export interface StatisticalResult {
  totalCount: number
  categoryBreakdown: Array<{ name: string; count: number; ratio: number; color?: string }>
  timeSeriesDensity: Array<{ timestamp: string; count: number }>
  spatialGrids: Array<{ gridId: string; center: [number, number]; count: number; densityLevel: string; label?: string }>
  conflictRate: number
  coverageScore: number
  countMode?: CountMode
  sourceRecordCount?: number
}

export interface AnalysisTemplate {
  id: string
  name: string
  sourceScope: SourceScope
  countMode: CountMode
  spatialAgg: SpatialAggMode
  timeWindow: [string, string]
  spatialFilter: string
  targetTypes: string[]
  metrics: string[]
  createdAt: string
}

export interface EventImpactResult {
  eventId: string
  eventName: string
  beforeWindow: [string, string]
  afterWindow: [string, string]
  statusChanges: Array<{ targetId: string; name: string; before: string; after: string }>
  relationDelta: { added: number; removed: number }
  spatialDeltaKm: number
  conclusion: string
}

/** 过程与轨迹分析结果 (5.5.4) */
export interface TrajectoryResult {
  targetId: string
  targetName: string
  speedProfile: Array<{ time: string; speed: number }>
  altitudeProfile: Array<{ time: string; altitude: number }>
  turningPoints: Array<{ time: string; location: [number, number]; angleChangeDeg: number }>
  loiteringZones: Array<{ center: [number, number]; radiusKm: number; durationMinutes: number }>
}

/** 关联与影响分析结果 (5.5.5) */
export interface AssociationResult {
  nodes: Array<{ id: string; name: string; category: string; symbolSize: number; color?: string }>
  links: Array<{ source: string; target: string; relation: string; strength: 'strong' | 'weak'; evidenceCount: number }>
  threatZones: Array<{ center: [number, number]; radiusKm: number; threatLevel: 'high' | 'medium' | 'low'; name: string }>
}

/** 专题分析成果 (5.5.7) */
export interface ThematicAsset {
  id: string
  title: string
  modelId: string
  sourceScope: SourceScope
  conclusion: string
  resultData: StatisticalResult | TrajectoryResult | AssociationResult
  projectedToGlobe: boolean
  createdAt: string
  productVersionRef: string
  /** 重新上图所需的场景引用信息 */
  regionId?: string
  center?: [number, number]
  targetId?: string
}
