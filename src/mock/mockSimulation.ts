import type { SimulationAlgorithm } from '@/stores/simulationStore'

export const MOCK_ALGORITHM_PACKS: SimulationAlgorithm[] = [
  {
    id: 'ALG-AIR-PENETRATE-v2',
    name: '隐身战机低空突防与制空拦截推演算法',
    version: 'v2.4.0',
    category: 'missile_penetration',
    description: '模拟多机编队低空突防航线规划及被雷达探测发现概率与拦截窗口',
    inputParams: [
      { key: 'targetAltitudeM', label: '突防突击高度 (米)', type: 'number', defaultVal: 300 },
      { key: 'machSpeed', label: '突防马赫数 (Mach)', type: 'number', defaultVal: 1.4 },
      { key: 'jammingEnabled', label: '伴随电磁压制', type: 'boolean', defaultVal: true }
    ]
  },
  {
    id: 'ALG-SAM-INTERCEPT-v1',
    name: '舰载区域防空导弹多目标拦截杀伤概率推演',
    version: 'v1.6.2',
    category: 'air_combat',
    description: '计算052D驱逐舰HHQ-9B对来袭目标发射包络线与杀伤概率',
    inputParams: [
      { key: 'salvoCount', label: '发射弹数 (枚/批)', type: 'number', defaultVal: 2 },
      { key: 'interceptionDistanceKm', label: '开火拦截距离 (km)', type: 'number', defaultVal: 120 }
    ]
  }
]

export const MOCK_SIMULATED_TRACKS = [
  { time: 'T+00:00', lon: 121.85, lat: 24.65, alt: 8500, prob: 0.12 },
  { time: 'T+05:00', lon: 121.30, lat: 24.20, alt: 2500, prob: 0.45 },
  { time: 'T+10:00', lon: 120.80, lat: 23.80, alt: 500, prob: 0.78 },
  { time: 'T+15:00', lon: 120.45, lat: 23.50, alt: 150, prob: 0.94 }
]
