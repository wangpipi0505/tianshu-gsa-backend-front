/**
 * @file fusion.ts
 * @description 时空数据融合、基准统一、要素映射、候选关联确认与资产治理数据模型
 */

/** 数据集产物实体 */
export interface DatasetProduct {
  id: string
  name: string
  topic: string
  timeCoverage: [string, string]
  spatialCoverage: string
  targetTypes: string[]
  source: string
  version: string
  receiveTime: string
  recordCount: number
  qualityScore: number
  status: 'active' | 'updating' | 'deprecated'
  referencedByJobs: string[]
  sampleRecords: Record<string, any>[]
}

/** 语义与属性映射规则 */
export interface MappingRule {
  id: string
  sourceField: string
  ontologyEntity: string
  ontologyField: string
  transformType: 'direct' | 'coordinate_wgs84' | 'time_iso' | 'enum_map' | 'custom_script'
  ruleDescription: string
}

/** 候选关联项（供人工确认/保持独立/暂缓） */
export interface AssociationCandidate {
  id: string
  candidateName: string
  targetType: string
  sourceRecords: Array<{
    datasetId: string
    datasetName: string
    recordId: string
    observedTime: string
    location: [number, number, number]
    attributes: Record<string, any>
    confidence: number
  }>
  matchBasis: {
    timeMatch: boolean
    spatialDistanceKm: number
    attributeMatchScore: number
    semanticBasis: string
  }
  decision: 'unconfirmed' | 'confirmed_same' | 'keep_independent' | 'deferred'
  unifiedTargetId?: string
  reviewNotes?: string
}

/** 融合工作过程实体 */
export interface FusionJob {
  id: string
  name: string
  topic: string
  datasetIds: string[]
  spatialRange: string
  timeRange: [string, string]
  targetTypes: string[]
  status: 'draft' | 'running' | 'completed' | 'archived'
  currentStep: number
  mappingRules: MappingRule[]
  candidates: AssociationCandidate[]
  publishedAssetVersion?: string
  createdAt: string
  updatedAt: string
}

/** 时空态势资产版本实体 (唯一事实层) */
export interface SituationalAssetVersion {
  versionId: string
  jobReferenceId: string
  assetCount: {
    targets: number
    events: number
    tracks: number
    relations: number
    regions: number
  }
  createdTime: string
  changeLog: string
  isLocked: boolean
}

/** 态势数据产品包装发布实体 */
export interface ProductRelease {
  productId: string
  productName: string
  assetVersionId: string
  releaseVersion: string
  publishTime: string
  refreshPolicy: 'manual' | 'follow_latest'
  status: 'draft' | 'published' | 'deprecated'
  statement: {
    sources: string[]
    fusionScope: string
    spatialRange: string
    timeWindow: string
    lastUpdated: string
  }
}
