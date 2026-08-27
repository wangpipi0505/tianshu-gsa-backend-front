/**
 * @file scene.ts
 * @description 态势场景、分级实体图层控制树、态势研判专题任务包与工作内容类型定义
 */

export interface CameraBookmark {
  id: string
  title: string
  destination: [number, number, number]
  headingDeg: number
  pitchDeg: number
  rollDeg: number
}

export interface WorkContent {
  id: string
  type: 'tactical_arrow' | 'defense_zone' | 'simulated_track'
  label: string
  isHypothesis: boolean
  createdBy: string
  basis: string
  relatedFactTargetId?: string
  payload: any
  createdAt: string
}

export type LayerNodeType = 'tier' | 'category' | 'entity' | 'feature' | 'region' | 'env' | 'work_item'

/** 实体与要素分级图层控制树节点 */
export interface LayerTreeNode {
  id: string
  name: string
  nodeType: LayerNodeType
  visible: boolean
  opacity?: number
  color?: string
  targetId?: string
  featureKey?: 'position' | 'track' | 'radar' | 'relation'
  regionId?: string
  envKey?: string
  workItemId?: string
  expanded?: boolean
  children?: LayerTreeNode[]
}

/** 兼容旧版顶层 ContentLayer 接口 */
export interface ContentLayer extends LayerTreeNode {
  tier?: string
  isFact?: boolean
  count?: number
}

// ===================== 【态势研判专题（复合任务包）类型定义】 =====================

export interface ThematicTargetFeatureItem {
  id: string
  name: string
  featureKey: 'position' | 'track' | 'radar' | 'relation'
  visible: boolean
}

export interface ThematicTargetItem {
  id: string
  name: string
  callsign: string
  color: string
  visible: boolean
  expanded?: boolean
  features: ThematicTargetFeatureItem[]
}

export interface ThematicRegionItem {
  id: string
  name: string
  color: string
  visible: boolean
}

export interface ThematicRelationItem {
  id: string
  name: string
  color: string
  visible: boolean
}

export interface ThematicWorkItem {
  id: string
  name: string
  color: string
  visible: boolean
}

export interface ThematicPackage {
  id: string
  name: string
  theme: string
  theater: 'taiwan' | 'mideast' | 'custom'
  visible: boolean
  expanded: boolean
  opacity: number
  color: string
  centerCoords: [number, number]
  cameraAltitude: number

  // 四大标准树形分支的折叠与显隐状态
  targetsExpanded?: boolean
  targetsVisible?: boolean
  regionsExpanded?: boolean
  regionsVisible?: boolean
  relationsExpanded?: boolean
  relationsVisible?: boolean
  workItemsExpanded?: boolean
  workItemsVisible?: boolean

  targets: ThematicTargetItem[]
  regions: ThematicRegionItem[]
  relations: ThematicRelationItem[]
  workItems?: ThematicWorkItem[]
}

export interface SituationalScene {
  id: string
  name: string
  theme: string
  productVersionId: string
  referenceMode: 'follow_latest' | 'fixed_version'
  spatialWindow: string
  timeWindow: [string, string]
  cameraView: {
    destination: [number, number, number]
    orientation: { heading: number; pitch: number; roll: number }
  }
  focusedTargetIds: string[]
  visibleLayerIds: string[]
  workContents: WorkContent[]
  createdAt: string
  updatedAt: string
  isArchive: boolean
}
