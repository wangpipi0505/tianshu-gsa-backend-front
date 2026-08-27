/**
 * @file mockDatasets.ts
 * @description 模拟外部数据集产物（涵盖东南海峡与中东波斯湾/霍尔木兹海峡双战区，光学、雷达、情报报告、遥感SAR、卫通AIS等）
 */

import type { DatasetProduct } from '@/types/fusion'

export const MOCK_DATASETS: DatasetProduct[] = [
  // ========================== 【战区一：东南海峡数据集】 ==========================
  {
    id: 'DS-OPTICAL-01',
    name: '海峡重点空域高分光学载荷观测集',
    topic: '空中重点目标光电识别与特性提取',
    timeCoverage: ['2026-08-25 00:00:00', '2026-08-25 15:00:00'],
    spatialCoverage: '东南海空域 (东经118.5°-123.5°, 北纬23.0°-27.0°)',
    targetTypes: ['air', 'maritime'],
    source: '高分光电侦察卫星网络/机载光电吊舱',
    version: 'v2.4.0',
    receiveTime: '2026-08-25 15:10:00',
    recordCount: 1420,
    qualityScore: 96.8,
    status: 'active',
    referencedByJobs: ['JOB-FUSION-20260825-01'],
    sampleRecords: [
      { recordId: 'OPT-REC-001', time: '2026-08-25 14:22:15', lon: 122.85, lat: 24.65, altM: 8500, targetClass: 'Fighter-VIPER-01', confidence: 0.96, lengthM: 19.2, wingspanM: 14.1, engineCount: 2 },
      { recordId: 'OPT-REC-002', time: '2026-08-25 14:35:10', lon: 124.60, lat: 25.80, altM: 10500, targetClass: 'AWACS-SENTINEL', confidence: 0.98, lengthM: 44.5, wingspanM: 40.2, engineCount: 4 }
    ]
  },
  {
    id: 'DS-RADAR-02',
    name: '沿海对空预警雷达网连续航迹集',
    topic: '超视距空情雷达航迹与RCS电磁特征',
    timeCoverage: ['2026-08-25 00:00:00', '2026-08-25 15:15:00'],
    spatialCoverage: '东南沿海与海峡空域 (东经117.0°-125.0°, 北纬22.0°-28.5°)',
    targetTypes: ['air', 'space'],
    source: '远程三坐标对空监视雷达阵地集群',
    version: 'v3.1.2',
    receiveTime: '2026-08-25 15:18:22',
    recordCount: 5890,
    qualityScore: 98.2,
    status: 'active',
    referencedByJobs: ['JOB-FUSION-20260825-01'],
    sampleRecords: [
      { recordId: 'RAD-REC-101', time: '2026-08-25 14:22:10', lon: 122.85, lat: 24.65, altM: 8500, speedKt: 520, headingDeg: 82, meanRcs: 2.8, freqBand: 'X-band', dopplerShift: 1250 },
      { recordId: 'RAD-REC-102', time: '2026-08-25 14:40:00', lon: 119.55, lat: 24.15, altM: 0, speedKt: 22, headingDeg: 45, meanRcs: 3500.0, freqBand: 'S-band 346A', dopplerShift: 80 }
    ]
  },
  {
    id: 'DS-INTEL-03',
    name: '联合情报中心态势通报与外军编成库',
    topic: '重点目标历史活动与战备部署研判',
    timeCoverage: ['2026-08-01 00:00:00', '2026-08-25 12:00:00'],
    spatialCoverage: '海峡中线东侧及邻近海空域',
    targetTypes: ['air', 'maritime', 'facility'],
    source: '联合情报研判数据库 (JIDC)',
    version: 'v1.8.5',
    receiveTime: '2026-08-25 12:30:00',
    recordCount: 380,
    qualityScore: 92.5,
    status: 'active',
    referencedByJobs: ['JOB-FUSION-20260825-01'],
    sampleRecords: [
      { reportId: 'INTEL-2026-088', time: '2026-08-24 16:00:00', entityCode: 'VIPER-01', summary: '重点突防战机在伴随电子战机掩护下向海峡逼近', threatLevel: 'high' },
      { reportId: 'INTEL-2026-092', time: '2026-08-25 10:15:00', entityCode: 'PLAN-DDG-173', summary: '052D型长沙舰在海峡重点水道战备巡弋', threatLevel: 'low' }
    ]
  },
  {
    id: 'DS-SAR-04',
    name: '合成孔径雷达(SAR)重点港口基地侦察产品',
    topic: '地面大型设施与大型水面舰艇成像判读',
    timeCoverage: ['2026-08-25 06:00:00', '2026-08-25 14:00:00'],
    spatialCoverage: '海峡沿岸及防空导弹阵位',
    targetTypes: ['maritime', 'facility', 'ground'],
    source: '空间SAR遥感侦察星座',
    version: 'v1.2.0',
    receiveTime: '2026-08-25 14:45:00',
    recordCount: 260,
    qualityScore: 95.0,
    status: 'active',
    referencedByJobs: [],
    sampleRecords: [
      { recordId: 'SAR-REC-001', time: '2026-08-25 09:30:00', lon: 119.65, lat: 25.45, targetType: 'SAM-HQ9B', lengthM: 14.5, confidence: 0.98 }
    ]
  },

  // ========================== 【战区二：中东波斯湾与霍尔木兹海峡数据集】 ==========================
  {
    id: 'DS-ME-NAVAL-01',
    name: '第46批远海护航编队战备日志与北斗报文集',
    topic: '中东阿曼湾国际商船护航与驱逐舰防空警戒',
    timeCoverage: ['2026-08-25 00:00:00', '2026-08-25 15:30:00'],
    spatialCoverage: '中东阿曼湾/霍尔木兹海峡外海 (东经56.5°-59.5°, 北纬23.5°-25.5°)',
    targetTypes: ['maritime'],
    source: '第46批远海护航编队卫通数据链/北斗三号专网',
    version: 'v1.0.0',
    receiveTime: '2026-08-25 15:20:00',
    recordCount: 850,
    qualityScore: 99.1,
    status: 'active',
    referencedByJobs: [],
    sampleRecords: [
      { recordId: 'ME-NAV-REC-163', time: '2026-08-25 15:20:00', lon: 57.85, lat: 24.85, altM: 0, targetClass: 'PLAN-DDG-163 焦作舰', speedKt: 20, headingDeg: 315, readiness: 'DEFCON 1' }
    ]
  },
  {
    id: 'DS-ME-RADAR-02',
    name: '中东海空重点空域多源雷达网时序航迹集',
    topic: '波斯湾空情态势监视与突防编队跟踪',
    timeCoverage: ['2026-08-25 00:00:00', '2026-08-25 15:30:00'],
    spatialCoverage: '波斯湾中北部空域 (东经50.0°-56.0°, 北纬24.0°-28.5°)',
    targetTypes: ['air'],
    source: '中东海空多源雷达网/预警机数据分发链',
    version: 'v1.1.0',
    receiveTime: '2026-08-25 15:22:00',
    recordCount: 3200,
    qualityScore: 97.5,
    status: 'active',
    referencedByJobs: [],
    sampleRecords: [
      { recordId: 'ME-RAD-REC-201', time: '2026-08-25 15:18:30', lon: 52.45, lat: 26.85, altM: 9200, targetClass: 'Fighter-FALCON-01', speedKt: 540, headingDeg: 135 },
      { recordId: 'ME-RAD-REC-202', time: '2026-08-25 15:15:00', lon: 54.10, lat: 25.50, altM: 9800, targetClass: 'AWACS-HAWKEYE-07', speedKt: 330, headingDeg: 280 }
    ]
  },
  {
    id: 'DS-ME-ELINT-03',
    name: '霍尔木兹海峡重点辐射源信号特征库',
    topic: '海峡咽喉水道防空导弹与岸导雷达电磁特征',
    timeCoverage: ['2026-08-25 00:00:00', '2026-08-25 15:30:00'],
    spatialCoverage: '霍尔木兹海峡北岸沿海山区 (东经55.0°-57.5°, 北纬25.8°-27.8°)',
    targetTypes: ['ground', 'facility'],
    source: '空间电子侦察卫星/沿海固定电磁监测站',
    version: 'v1.0.5',
    receiveTime: '2026-08-25 15:10:00',
    recordCount: 420,
    qualityScore: 98.0,
    status: 'active',
    referencedByJobs: [],
    sampleRecords: [
      { recordId: 'ME-ELINT-REC-01', time: '2026-08-25 15:10:00', lon: 56.25, lat: 27.15, altM: 180, targetClass: 'SAM-BATTERY-ME01', coverageRadiusKm: 280 }
    ]
  }
]
