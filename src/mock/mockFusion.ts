import type { FusionJob, ProductRelease, SituationalAssetVersion } from '@/types/fusion'

export const MOCK_FUSION_JOBS: FusionJob[] = [
  {
    id: 'JOB-FUSION-20260825-01',
    name: '海峡重点空情与目标特性多源时空融合工作',
    topic: '空中重点目标光电+雷达多源关联与态势发布',
    datasetIds: ['DS-OPTICAL-01', 'DS-RADAR-02', 'DS-INTEL-03'],
    spatialRange: '东南海空域 (东经118°-124°, 北纬22°-27°)',
    timeRange: ['2026-08-25 00:00:00', '2026-08-25 15:00:00'],
    targetTypes: ['air', 'maritime'],
    status: 'completed',
    currentStep: 5,
    mappingRules: [
      { id: 'R1', sourceField: 'lon/lat/altM', ontologyEntity: 'Target', ontologyField: 'location', transformType: 'coordinate_wgs84', ruleDescription: '归一化至 WGS84 椭球高程' },
      { id: 'R2', sourceField: 'time', ontologyEntity: 'Target', ontologyField: 'timestamp', transformType: 'time_iso', ruleDescription: '统一转换为 ISO 8601 标准时区' },
      { id: 'R3', sourceField: 'targetClass', ontologyEntity: 'OpticalCharacteristic', ontologyField: 'predictedClass', transformType: 'direct', ruleDescription: '直接映射至目标特性本体' }
    ],
    candidates: [
      {
        id: 'CAND-001',
        candidateName: '海峡东侧空中高速目标候选关联 (Target-001 归并)',
        targetType: 'air',
        sourceRecords: [
          {
            datasetId: 'DS-OPTICAL-01',
            datasetName: '高分光学载荷观测集',
            recordId: 'OPT-REC-001',
            observedTime: '2026-08-25 14:22:15',
            location: [121.35, 24.88, 8500],
            attributes: { targetClass: 'Fighter-TypeA', confidence: 0.94, lengthM: 19.2 },
            confidence: 0.94
          },
          {
            datasetId: 'DS-RADAR-02',
            datasetName: '沿海预警雷达网连续航迹集',
            recordId: 'RAD-REC-101',
            observedTime: '2026-08-25 14:22:10',
            location: [121.36, 24.89, 8520],
            attributes: { speedKt: 520, headingDeg: 78, meanRcs: 2.8 },
            confidence: 0.92
          }
        ],
        matchBasis: {
          timeMatch: true,
          spatialDistanceKm: 1.45,
          attributeMatchScore: 0.94,
          semanticBasis: '时间差5秒内，空间距离<1.5km，双发外形与RCS散射特性一致'
        },
        decision: 'confirmed_same',
        unifiedTargetId: 'Target-001',
        reviewNotes: '经研判确认为同一实体在不同传感器下的多源观测'
      },
      {
        id: 'CAND-002',
        candidateName: '中立货轮与雷达弱信号候选',
        targetType: 'maritime',
        sourceRecords: [
          {
            datasetId: 'DS-SAR-04',
            datasetName: 'SAR遥感侦察产品',
            recordId: 'SAR-REC-001',
            observedTime: '2026-08-25 09:30:00',
            location: [121.80, 25.15, 0],
            attributes: { lengthM: 155.0 },
            confidence: 0.89
          }
        ],
        matchBasis: {
          timeMatch: false,
          spatialDistanceKm: 8.2,
          attributeMatchScore: 0.52,
          semanticBasis: '时间跨度较大，空间位置未对齐'
        },
        decision: 'keep_independent',
        reviewNotes: '保持独立事实，不强制归并'
      }
    ],
    publishedAssetVersion: 'ASSET-VER-20260825-v2.1',
    createdAt: '2026-08-25 14:00:00',
    updatedAt: '2026-08-25 15:10:00'
  }
]

export const MOCK_ASSET_VERSIONS: SituationalAssetVersion[] = [
  {
    versionId: 'ASSET-VER-20260825-v2.1',
    jobReferenceId: 'JOB-FUSION-20260825-01',
    assetCount: { targets: 10, events: 2, tracks: 16, relations: 10, regions: 6 },
    createdTime: '2026-08-25 15:10:00',
    changeLog: '完成 Target-001 光学与雷达多源关联确认，保留沿海哨所差异观测',
    isLocked: true
  }
]

export const MOCK_PRODUCT_RELEASES: ProductRelease[] = [
  {
    productId: 'PROD-SITUATION-EASTSEA-01',
    productName: '东南海空态势综合数据产品',
    assetVersionId: 'ASSET-VER-20260825-v2.1',
    releaseVersion: 'PROD-SITUATION-EASTSEA-v2.1',
    publishTime: '2026-08-25 15:15:00',
    refreshPolicy: 'follow_latest',
    status: 'published',
    statement: {
      sources: ['DS-OPTICAL-01 (v2.4.0)', 'DS-RADAR-02 (v3.1.2)', 'DS-INTEL-03 (v1.8.5)'],
      fusionScope: '海峡重点空域多源关联',
      spatialRange: '东经118°-124°, 北纬22°-27°',
      timeWindow: '2026-08-25 00:00:00 至 15:00:00',
      lastUpdated: '2026-08-25 15:15:00'
    }
  }
]
