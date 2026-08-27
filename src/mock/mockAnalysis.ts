import type { AssociationResult, StatisticalResult, ThematicAsset, TrajectoryResult } from '@/types/analysis'

export const MOCK_STATISTICAL_RESULT: StatisticalResult = {
  totalCount: 6,
  categoryBreakdown: [
    { name: '空中目标 (Air)', count: 3, ratio: 50.0, color: '#ff4d4f' },
    { name: '水面舰艇 (Naval)', count: 2, ratio: 33.3, color: '#00d2ff' },
    { name: '地面设施 (Facility)', count: 1, ratio: 16.7, color: '#52c41a' }
  ],
  timeSeriesDensity: [
    { timestamp: '08:00', count: 1 },
    { timestamp: '10:00', count: 2 },
    { timestamp: '12:00', count: 3 },
    { timestamp: '13:30', count: 4 },
    { timestamp: '14:30', count: 6 },
    { timestamp: '15:20', count: 6 }
  ],
  spatialGrids: [
    { gridId: 'GRID-A1', center: [121.8, 24.6], count: 3, densityLevel: 'high' },
    { gridId: 'GRID-B2', center: [120.4, 23.5], count: 2, densityLevel: 'medium' },
    { gridId: 'GRID-C3', center: [118.8, 24.4], count: 1, densityLevel: 'low' }
  ],
  conflictRate: 4.8,
  coverageScore: 95.6
}

export const MOCK_TRAJECTORY_RESULT: TrajectoryResult = {
  targetId: 'Target-001',
  targetName: 'Blue-Strike-01 (重点隐身战机)',
  speedProfile: [
    { time: '13:30', speed: 480 },
    { time: '14:00', speed: 510 },
    { time: '14:30', speed: 515 },
    { time: '15:00', speed: 520 },
    { time: '15:20', speed: 520 }
  ],
  altitudeProfile: [
    { time: '13:30', altitude: 8200 },
    { time: '14:00', altitude: 8400 },
    { time: '14:30', altitude: 8500 },
    { time: '15:00', altitude: 8500 },
    { time: '15:20', altitude: 8500 }
  ],
  turningPoints: [
    { time: '14:00', location: [120.20, 24.10], angleChangeDeg: 18.5 },
    { time: '14:30', location: [120.90, 24.35], angleChangeDeg: 12.0 }
  ],
  loiteringZones: [{ center: [121.85, 24.65], radiusKm: 35, durationMinutes: 45 }]
}

export const MOCK_ASSOCIATION_RESULT: AssociationResult = {
  nodes: [
    { id: 'Target-001', name: 'Blue-Strike-01 (战机)', category: '外军空中兵力', symbolSize: 45, color: '#ff4d4f' },
    { id: 'Target-002', name: 'Blue-Sentry-02 (预警机)', category: '外军空中兵力', symbolSize: 45, color: '#ff4d4f' },
    { id: 'Target-003', name: 'Red-DDG-173 (驱逐舰)', category: '我方防御核心', symbolSize: 48, color: '#00d2ff' },
    { id: 'Target-004', name: 'Red-AirEye-500 (预警机)', category: '我方感知网络', symbolSize: 45, color: '#00d2ff' },
    { id: 'Target-005', name: 'Red-SAM-HQ9B (防空营)', category: '我方阵地设施', symbolSize: 40, color: '#52c41a' }
  ],
  links: [
    { source: 'Target-002', target: 'Target-001', relation: 'Link-16 预警指挥', strength: 'strong', evidenceCount: 3 },
    { source: 'Target-004', target: 'Target-003', relation: '海空战术协同', strength: 'strong', evidenceCount: 4 },
    { source: 'Target-001', target: 'Target-003', relation: '超视距威胁正切', strength: 'strong', evidenceCount: 2 },
    { source: 'Target-005', target: 'Target-003', relation: '岸海防空火力交织', strength: 'strong', evidenceCount: 2 }
  ],
  threatZones: [
    { center: [120.45, 23.50], radiusKm: 160, threatLevel: 'high', name: 'DDG-173 区域防空杀伤圈' },
    { center: [118.80, 24.45], radiusKm: 200, threatLevel: 'high', name: 'HQ-9B 地空远程防空圈' }
  ]
}

export const MOCK_THEMATIC_ASSETS: ThematicAsset[] = [
  {
    id: 'THEMATIC-20260825-01',
    title: '海峡重点空域多源目标态势与威胁分析专题',
    modelId: 'MODEL-STAT-01',
    sourceScope: 'fact_only',
    conclusion: '海峡空域外军空中活动呈双机编组伴随指挥态势，Target-001 具备重型五代机高机动特征，红方海空协同雷达已实现无缝锁链跟踪。',
    resultData: MOCK_STATISTICAL_RESULT,
    projectedToGlobe: true,
    createdAt: '2026-08-25 15:18:00',
    productVersionRef: 'PROD-SITUATION-EASTSEA-v2.1'
  }
]
