/**
 * @file mockSituationAssets.ts
 * @description 真实业务态势资产全量模拟数据（包含东南海峡与中东波斯湾/霍尔木兹海峡双战区、高保真目标图片、战备状态、高维特性、4D航迹与战术关系）
 */

import type {
  SituationTarget,
  SituationEvent,
  SpatialRelation,
  SituationRegion,
  BattlefieldEnvironment,
  ComprehensiveAssessment
} from '@/types/situation'
import {
  SVG_WARSHIP_052D,
  SVG_FIGHTER_VIPER,
  SVG_AEW_SENTINEL,
  SVG_SAM_HQ9B
} from '@/mock/mockTargetImages'

export const MOCK_TARGETS: SituationTarget[] = [
  // ========================== 【战区一：东南海峡战区】 ==========================
  {
    id: 'Target-003',
    codeName: '我方052D型驱逐舰',
    callsign: 'PLAN-DDG-173 (长沙舰)',
    type: 'warship',
    affiliation: 'friend',
    status: 'active',
    isHypothesis: false,
    imageUrl: SVG_WARSHIP_052D,
    longitude: 119.55,
    latitude: 24.15,
    altitude: 0,
    speedKnots: 22,
    headingDeg: 45,
    tracks: [
      { longitude: 119.20, latitude: 23.60, altitude: 0, speedKnots: 20, headingDeg: 45, timestamp: '2026-08-25 13:00:00' },
      { longitude: 119.30, latitude: 23.75, altitude: 0, speedKnots: 22, headingDeg: 45, timestamp: '2026-08-25 13:30:00' },
      { longitude: 119.40, latitude: 23.90, altitude: 0, speedKnots: 22, headingDeg: 45, timestamp: '2026-08-25 14:00:00' },
      { longitude: 119.48, latitude: 24.02, altitude: 0, speedKnots: 22, headingDeg: 45, timestamp: '2026-08-25 14:30:00' },
      { longitude: 119.52, latitude: 24.10, altitude: 0, speedKnots: 22, headingDeg: 45, timestamp: '2026-08-25 15:00:00' },
      { longitude: 119.55, latitude: 24.15, altitude: 0, speedKnots: 22, headingDeg: 45, timestamp: '2026-08-25 15:20:00' },
      { longitude: 119.60, latitude: 24.25, altitude: 0, speedKnots: 24, headingDeg: 45, timestamp: '2026-08-25 15:30:00' }
    ],
    operationalStatus: {
      readinessLevel: '一级战备 (对空拦截警戒状态)',
      missionTask: '海峡重点水道战备巡弋与区域防空掩护',
      sensorMode: '346A相控阵雷达全功率对空搜索与火控待发',
      datalinkState: '全域宽带战术数据链在线互联 (信噪比 +28dB)',
      fuelOrHealthPercent: 92
    },
    radarFeatures: {
      rcsMeanSqMeters: 3500.0,
      dopplerShiftHz: 80,
      frequencyBand: 'S波段 346A型有源相控阵雷达',
      pulseWidthUs: 45
    },
    sensorCoverage: {
      radarRangeKm: 260,
      scanAngleDeg: 360,
      coneColor: '#00d2ff',
      isScanning: true,
      scanPeriodSec: 4,
      mountType: 'omni',
      jamming: {
        isJammed: true,
        jammerTargetIds: ['Target-005'],
        effectiveRangeKm: 120,
        notchSpanDeg: 24,
        flicker: true,
        startTime: '2026-08-25 15:00:00',
        endTime: '2026-08-25 16:00:00'
      }
    },
    predictedTracks: [
      { longitude: 119.60, latitude: 24.25, altitude: 0, speedKnots: 24, headingDeg: 45, timestamp: '2026-08-25 15:30:00' },
      { longitude: 119.70, latitude: 24.38, altitude: 0, speedKnots: 26, headingDeg: 42, timestamp: '2026-08-25 15:45:00' },
      { longitude: 119.82, latitude: 24.52, altitude: 0, speedKnots: 28, headingDeg: 40, timestamp: '2026-08-25 16:00:00' },
      { longitude: 119.95, latitude: 24.68, altitude: 0, speedKnots: 28, headingDeg: 38, timestamp: '2026-08-25 16:15:00' },
      { longitude: 120.10, latitude: 24.85, altitude: 0, speedKnots: 28, headingDeg: 35, timestamp: '2026-08-25 16:30:00' }
    ],
    temporalSlices: [
      { phase: 'history', time: '14:00:00', label: 'T-90m 巡航战位', longitude: 119.40, latitude: 23.90, altitude: 0, speedKnots: 22, headingDeg: 45, remark: '水道日常巡航与海空警戒' },
      { phase: 'present', time: '15:30:00', label: 'T0 当前阵位', longitude: 119.60, latitude: 24.25, altitude: 0, speedKnots: 24, headingDeg: 45, remark: '转入一级战备，346A相控阵雷达全功率开机' },
      { phase: 'future', time: '16:00:00', label: 'T+30m 截击阵位', longitude: 119.82, latitude: 24.52, altitude: 0, speedKnots: 28, headingDeg: 40, remark: '机动至海峡咽喉拦截有利阵位' },
      { phase: 'future', time: '16:30:00', label: 'T+60m 封控阵位', longitude: 120.10, latitude: 24.85, altitude: 0, speedKnots: 28, headingDeg: 35, remark: '与沿海地导阵地形成立体交织拦截火网' }
    ],
    conflicts: [],
    evidenceIds: ['E003'],
    createdProductVersion: 'PROD-SITUATION-EASTSEA-v2.1'
  },
  {
    id: 'Target-001',
    codeName: '敌方重点突防战机',
    callsign: 'VIPER-01',
    type: 'aircraft',
    affiliation: 'foe',
    status: 'active',
    isHypothesis: false,
    classification: 'secret',
    imageUrl: SVG_FIGHTER_VIPER,
    longitude: 122.85,
    latitude: 24.65,
    altitude: 8500,
    speedKnots: 520,
    headingDeg: 82,
    tracks: [
      { longitude: 124.50, latitude: 22.80, altitude: 9000, speedKnots: 480, headingDeg: 75, timestamp: '2026-08-25 13:00:00' },
      { longitude: 124.10, latitude: 23.30, altitude: 8800, speedKnots: 500, headingDeg: 78, timestamp: '2026-08-25 13:30:00' },
      { longitude: 123.70, latitude: 23.80, altitude: 8600, speedKnots: 510, headingDeg: 80, timestamp: '2026-08-25 14:00:00' },
      { longitude: 123.35, latitude: 24.20, altitude: 8500, speedKnots: 520, headingDeg: 82, timestamp: '2026-08-25 14:30:00' },
      { longitude: 123.05, latitude: 24.50, altitude: 8500, speedKnots: 520, headingDeg: 82, timestamp: '2026-08-25 15:00:00' },
      { longitude: 122.85, latitude: 24.65, altitude: 8500, speedKnots: 520, headingDeg: 82, timestamp: '2026-08-25 15:20:00' },
      { longitude: 122.60, latitude: 24.85, altitude: 8500, speedKnots: 530, headingDeg: 84, timestamp: '2026-08-25 15:30:00' }
    ],
    predictedTracks: [
      { longitude: 122.60, latitude: 24.85, altitude: 8500, speedKnots: 530, headingDeg: 84, timestamp: '2026-08-25 15:30:00' },
      { longitude: 122.25, latitude: 24.60, altitude: 4200, speedKnots: 580, headingDeg: 88, timestamp: '2026-08-25 15:40:00' },
      { longitude: 121.90, latitude: 24.35, altitude: 800, speedKnots: 640, headingDeg: 92, timestamp: '2026-08-25 15:50:00' },
      { longitude: 121.50, latitude: 24.15, altitude: 300, speedKnots: 680, headingDeg: 96, timestamp: '2026-08-25 16:00:00' },
      { longitude: 121.05, latitude: 23.90, altitude: 300, speedKnots: 660, headingDeg: 100, timestamp: '2026-08-25 16:15:00' },
      { longitude: 120.60, latitude: 23.65, altitude: 450, speedKnots: 620, headingDeg: 105, timestamp: '2026-08-25 16:30:00' }
    ],
    futureBranches: [
      {
        branchId: 'BRANCH-VIPER-A',
        name: '【分支A】低空超音速突防航线',
        tacticalIntent: '急剧俯冲至300米掠海突防，企图利用地球曲率规避沿海HQ-9B雷达并威慑我方水面舰艇',
        color: '#b37feb',
        probability: 78,
        predictedTracks: [
          { longitude: 122.60, latitude: 24.85, altitude: 8500, speedKnots: 530, headingDeg: 84, timestamp: '2026-08-25 15:30:00' },
          { longitude: 122.20, latitude: 24.55, altitude: 2500, speedKnots: 600, headingDeg: 90, timestamp: '2026-08-25 15:45:00' },
          { longitude: 121.50, latitude: 24.15, altitude: 300, speedKnots: 680, headingDeg: 96, timestamp: '2026-08-25 16:00:00' },
          { longitude: 120.60, latitude: 23.65, altitude: 450, speedKnots: 620, headingDeg: 105, timestamp: '2026-08-25 16:30:00' }
        ],
        futureArrivalPoint: [120.60, 23.65, 450],
        estimatedTime: '16:30:00',
        threatDescription: '进入我方052D驱逐舰海红旗-9B导弹65km杀伤界，拦截窗口持续4.2分钟'
      },
      {
        branchId: 'BRANCH-VIPER-B',
        name: '【分支B】爬升转向与电磁压制',
        tacticalIntent: '向东北方向转向爬升至11000米高空，配合SHADOW-02对我方雷达阵位实施大功率副瓣压制',
        color: '#faad14',
        probability: 22,
        predictedTracks: [
          { longitude: 122.60, latitude: 24.85, altitude: 8500, speedKnots: 530, headingDeg: 84, timestamp: '2026-08-25 15:30:00' },
          { longitude: 122.80, latitude: 25.30, altitude: 10200, speedKnots: 510, headingDeg: 35, timestamp: '2026-08-25 15:45:00' },
          { longitude: 123.10, latitude: 25.80, altitude: 11000, speedKnots: 490, headingDeg: 30, timestamp: '2026-08-25 16:00:00' },
          { longitude: 123.40, latitude: 26.30, altitude: 11000, speedKnots: 480, headingDeg: 25, timestamp: '2026-08-25 16:30:00' }
        ],
        futureArrivalPoint: [123.40, 26.30, 11000],
        estimatedTime: '16:30:00',
        threatDescription: '脱离防空内圈杀伤包络，但对我方预警指挥链条构成电磁压制威胁'
      }
    ],
    temporalSlices: [
      { phase: 'history', time: '14:00:00', label: 'T-90m 历史巡航', longitude: 123.70, latitude: 23.80, altitude: 8600, speedKnots: 510, headingDeg: 80, remark: '双机编队巡航集结，保持雷达静默' },
      { phase: 'history', time: '15:00:00', label: 'T-30m 历史徘徊', longitude: 123.05, latitude: 24.50, altitude: 8500, speedKnots: 520, headingDeg: 82, remark: '空域异常徘徊，疑似建立打击航线' },
      { phase: 'present', time: '15:30:00', label: 'T0 当前基准点', longitude: 122.60, latitude: 24.85, altitude: 8500, speedKnots: 530, headingDeg: 84, remark: '逼近我方防空外围识别区边缘' },
      { phase: 'future', time: '16:00:00', label: 'T+30m 预测交汇点', longitude: 121.50, latitude: 24.15, altitude: 300, speedKnots: 680, headingDeg: 96, remark: '进入我方驱逐舰346A相控阵雷达连续锁定界' },
      { phase: 'future', time: '16:30:00', label: 'T+60m 预测脱离点', longitude: 120.60, latitude: 23.65, altitude: 450, speedKnots: 620, headingDeg: 105, remark: '完成战术威慑动作，高速转向脱离' }
    ],
    operationalStatus: {
      readinessLevel: '高威胁突防攻击战位',
      missionTask: '向我水面编队与沿海阵地实施超视距逼近',
      sensorMode: '机载有源相控阵雷达前向静默/间歇扫描',
      datalinkState: '16号战术数据链接收预警机引导指令',
      fuelOrHealthPercent: 78
    },
    opticalFeatures: {
      lengthMeters: 19.2,
      wingspanMeters: 14.1,
      hasDualTail: true,
      infraredHotspotCount: 2,
      stealthCoatingDetected: true,
      confidence: 0.96
    },
    radarFeatures: {
      rcsMeanSqMeters: 2.8,
      dopplerShiftHz: 1250,
      frequencyBand: 'X波段 (8-12 GHz)',
      pulseWidthUs: 12.5,
      priUs: 85,
      modulationType: '线性调频脉冲压缩'
    },
    sensorCoverage: {
      radarRangeKm: 180,
      scanAngleDeg: 120,
      coneColor: '#ff4d4f',
      isScanning: true,
      scanPeriodSec: 3,
      mountType: 'firecontrol'
    },
    conflicts: [
      {
        id: 'CONF-001',
        field: '高度观测值偏差 (1200米)',
        observations: [
          { source: '高分光学遥感载荷', value: '9700 米', timestamp: '2026-08-25 15:15:00', confidence: 0.88 },
          { source: '沿海对空预警雷达', value: '8500 米', timestamp: '2026-08-25 15:15:00', confidence: 0.98 }
        ],
        resolutionStatus: 'unresolved'
      }
    ],
    evidenceIds: ['E001', 'E002', 'E003'],
    createdProductVersion: 'PROD-SITUATION-EASTSEA-v2.1'
  },
  {
    id: 'Target-005',
    codeName: '敌方伴飞电子战机',
    callsign: 'SHADOW-02',
    type: 'aircraft',
    affiliation: 'foe',
    status: 'active',
    isHypothesis: false,
    imageUrl: SVG_FIGHTER_VIPER,
    longitude: 122.68,
    latitude: 24.48,
    altitude: 8300,
    speedKnots: 515,
    headingDeg: 82,
    tracks: [
      { longitude: 124.35, latitude: 22.65, altitude: 8800, speedKnots: 475, headingDeg: 75, timestamp: '2026-08-25 13:00:00' },
      { longitude: 123.95, latitude: 23.15, altitude: 8600, speedKnots: 495, headingDeg: 78, timestamp: '2026-08-25 13:30:00' },
      { longitude: 123.55, latitude: 23.65, altitude: 8400, speedKnots: 505, headingDeg: 80, timestamp: '2026-08-25 14:00:00' },
      { longitude: 123.20, latitude: 24.05, altitude: 8300, speedKnots: 515, headingDeg: 82, timestamp: '2026-08-25 14:30:00' },
      { longitude: 122.90, latitude: 24.35, altitude: 8300, speedKnots: 515, headingDeg: 82, timestamp: '2026-08-25 15:00:00' },
      { longitude: 122.68, latitude: 24.48, altitude: 8300, speedKnots: 515, headingDeg: 82, timestamp: '2026-08-25 15:20:00' },
      { longitude: 122.45, latitude: 24.70, altitude: 8300, speedKnots: 525, headingDeg: 84, timestamp: '2026-08-25 15:30:00' }
    ],
    operationalStatus: {
      readinessLevel: '伴随电磁干扰压制中',
      missionTask: '为 Target-001 提供防空雷达杂波压制掩护',
      sensorMode: 'Ku/X波段全频段宽带杂波压制机载吊舱',
      datalinkState: '机间近程高速编队协同链路',
      fuelOrHealthPercent: 82
    },
    opticalFeatures: {
      lengthMeters: 18.5,
      wingspanMeters: 13.8,
      hasDualTail: true,
      infraredHotspotCount: 2,
      confidence: 0.92
    },
    radarFeatures: {
      rcsMeanSqMeters: 4.5,
      dopplerShiftHz: 1180,
      frequencyBand: 'Ku/X复合干扰频段',
      pulseWidthUs: 15,
      modulationType: '噪声调频压制干扰'
    },
    sensorCoverage: {
      radarRangeKm: 140,
      scanAngleDeg: 140,
      coneColor: '#faad14',
      isScanning: true,
      scanPeriodSec: 4,
      mountType: 'sector'
    },
    conflicts: [],
    evidenceIds: ['E001', 'E004'],
    createdProductVersion: 'PROD-SITUATION-EASTSEA-v2.1'
  },
  {
    id: 'Target-002',
    codeName: '敌方预警指挥机',
    callsign: 'SENTINEL-09',
    type: 'aircraft',
    affiliation: 'foe',
    status: 'active',
    isHypothesis: false,
    imageUrl: SVG_AEW_SENTINEL,
    longitude: 124.60,
    latitude: 25.80,
    altitude: 10500,
    speedKnots: 360,
    headingDeg: 195,
    tracks: [
      { longitude: 125.20, latitude: 26.50, altitude: 10500, speedKnots: 360, headingDeg: 195, timestamp: '2026-08-25 13:00:00' },
      { longitude: 125.00, latitude: 26.30, altitude: 10500, speedKnots: 360, headingDeg: 195, timestamp: '2026-08-25 13:30:00' },
      { longitude: 124.85, latitude: 26.10, altitude: 10500, speedKnots: 360, headingDeg: 195, timestamp: '2026-08-25 14:00:00' },
      { longitude: 124.70, latitude: 25.95, altitude: 10500, speedKnots: 360, headingDeg: 195, timestamp: '2026-08-25 14:30:00' },
      { longitude: 124.65, latitude: 25.85, altitude: 10500, speedKnots: 360, headingDeg: 195, timestamp: '2026-08-25 15:00:00' },
      { longitude: 124.60, latitude: 25.80, altitude: 10500, speedKnots: 360, headingDeg: 195, timestamp: '2026-08-25 15:20:00' },
      { longitude: 124.50, latitude: 25.60, altitude: 10500, speedKnots: 360, headingDeg: 195, timestamp: '2026-08-25 15:30:00' }
    ],
    operationalStatus: {
      readinessLevel: '高空预警指挥巡航',
      missionTask: '全域空情态势监视与超视距引导编队突击',
      sensorMode: '有源相控阵背负式圆盘雷达 360° 全向扫描',
      datalinkState: '多通道联合战术分发网络持续广播',
      fuelOrHealthPercent: 86
    },
    opticalFeatures: {
      lengthMeters: 44.5,
      wingspanMeters: 40.2,
      hasDualTail: false,
      confidence: 0.98
    },
    radarFeatures: {
      rcsMeanSqMeters: 48.0,
      dopplerShiftHz: 650,
      frequencyBand: 'S/L双波段有源相控阵',
      pulseWidthUs: 60,
      modulationType: '相参捷变频脉冲'
    },
    sensorCoverage: {
      radarRangeKm: 450,
      scanAngleDeg: 360,
      coneColor: '#faad14',
      isScanning: true,
      scanPeriodSec: 5,
      mountType: 'omni'
    },
    conflicts: [],
    evidenceIds: ['E002', 'E004'],
    createdProductVersion: 'PROD-SITUATION-EASTSEA-v2.1'
  },
  {
    id: 'Target-004',
    codeName: '我方沿海防空导弹阵地',
    callsign: 'HQ9B-BATTERY-04',
    type: 'ground_facility',
    affiliation: 'friend',
    status: 'active',
    isHypothesis: false,
    imageUrl: SVG_SAM_HQ9B,
    longitude: 119.65,
    latitude: 25.45,
    altitude: 120,
    speedKnots: 0,
    headingDeg: 120,
    tracks: [
      { longitude: 119.65, latitude: 25.45, altitude: 120, speedKnots: 0, headingDeg: 120, timestamp: '2026-08-25 13:00:00' },
      { longitude: 119.65, latitude: 25.45, altitude: 120, speedKnots: 0, headingDeg: 120, timestamp: '2026-08-25 15:30:00' }
    ],
    operationalStatus: {
      readinessLevel: '一级截击待发状态',
      missionTask: '海峡空域远程防空超视距火力截击',
      sensorMode: 'HT-233相控阵制导照射雷达锁定敌机扇面',
      datalinkState: '陆海联合防空指挥专网实时互通',
      fuelOrHealthPercent: 100
    },
    sensorCoverage: {
      radarRangeKm: 280,
      scanAngleDeg: 120,
      coneColor: '#52c41a',
      isScanning: true,
      scanPeriodSec: 3,
      mountType: 'firecontrol'
    },
    conflicts: [],
    evidenceIds: ['E003'],
    createdProductVersion: 'PROD-SITUATION-EASTSEA-v2.1'
  },

  // ========================== 【战区二：中东波斯湾与霍尔木兹海峡战区】 ==========================
  {
    id: 'Target-ME-001',
    codeName: '我方052D型护航驱逐舰',
    callsign: 'PLAN-DDG-163 (焦作舰)',
    type: 'warship',
    affiliation: 'friend',
    status: 'active',
    isHypothesis: false,
    imageUrl: SVG_WARSHIP_052D,
    // 阿曼湾开阔深水区 (霍尔木兹海峡东南外海)
    longitude: 57.85,
    latitude: 24.85,
    altitude: 0,
    speedKnots: 20,
    headingDeg: 315,
    tracks: [
      { longitude: 58.50, latitude: 24.20, altitude: 0, speedKnots: 18, headingDeg: 315, timestamp: '2026-08-25 13:00:00' },
      { longitude: 58.35, latitude: 24.35, altitude: 0, speedKnots: 19, headingDeg: 315, timestamp: '2026-08-25 13:30:00' },
      { longitude: 58.20, latitude: 24.50, altitude: 0, speedKnots: 20, headingDeg: 315, timestamp: '2026-08-25 14:00:00' },
      { longitude: 58.05, latitude: 24.65, altitude: 0, speedKnots: 20, headingDeg: 315, timestamp: '2026-08-25 14:30:00' },
      { longitude: 57.92, latitude: 24.78, altitude: 0, speedKnots: 20, headingDeg: 315, timestamp: '2026-08-25 15:00:00' },
      { longitude: 57.85, latitude: 24.85, altitude: 0, speedKnots: 20, headingDeg: 315, timestamp: '2026-08-25 15:20:00' },
      { longitude: 57.70, latitude: 25.00, altitude: 0, speedKnots: 22, headingDeg: 315, timestamp: '2026-08-25 15:30:00' }
    ],
    operationalStatus: {
      readinessLevel: '一级战备 (远海护航与对空防御)',
      missionTask: '第46批远海护航编队组织国际商船编队过峡与区域对空防御',
      sensorMode: '346A相控阵雷达全功率对空警戒与防空火控待发',
      datalinkState: '全域卫通宽带战术数据链在线互联 (信噪比 +26dB)',
      fuelOrHealthPercent: 95
    },
    radarFeatures: {
      rcsMeanSqMeters: 3500.0,
      dopplerShiftHz: 75,
      frequencyBand: 'S波段 346A型海之星有源相控阵雷达',
      pulseWidthUs: 45
    },
    sensorCoverage: {
      radarRangeKm: 260,
      scanAngleDeg: 360,
      coneColor: '#00d2ff',
      isScanning: true,
      scanPeriodSec: 4,
      mountType: 'omni',
      jamming: {
        isJammed: true,
        jammerTargetIds: ['Target-ME-004'],
        effectiveRangeKm: 140,
        notchSpanDeg: 24,
        flicker: true,
        startTime: '2026-08-25 15:00:00',
        endTime: '2026-08-25 16:00:00'
      }
    },
    conflicts: [],
    evidenceIds: ['E-ME-001'],
    createdProductVersion: 'PROD-SITUATION-MIDEAST-v2.1'
  },
  {
    id: 'Target-ME-002',
    codeName: '外军重点突防战机',
    callsign: 'FALCON-01',
    type: 'aircraft',
    affiliation: 'foe',
    status: 'active',
    isHypothesis: false,
    imageUrl: SVG_FIGHTER_VIPER,
    // 波斯湾中北部空域
    longitude: 52.45,
    latitude: 26.85,
    altitude: 9200,
    speedKnots: 540,
    headingDeg: 135,
    tracks: [
      { longitude: 50.80, latitude: 28.10, altitude: 9500, speedKnots: 500, headingDeg: 130, timestamp: '2026-08-25 13:00:00' },
      { longitude: 51.20, latitude: 27.80, altitude: 9400, speedKnots: 520, headingDeg: 132, timestamp: '2026-08-25 13:30:00' },
      { longitude: 51.60, latitude: 27.50, altitude: 9300, speedKnots: 530, headingDeg: 135, timestamp: '2026-08-25 14:00:00' },
      { longitude: 52.00, latitude: 27.20, altitude: 9200, speedKnots: 540, headingDeg: 135, timestamp: '2026-08-25 14:30:00' },
      { longitude: 52.30, latitude: 26.95, altitude: 9200, speedKnots: 540, headingDeg: 135, timestamp: '2026-08-25 15:00:00' },
      { longitude: 52.45, latitude: 26.85, altitude: 9200, speedKnots: 540, headingDeg: 135, timestamp: '2026-08-25 15:20:00' },
      { longitude: 52.75, latitude: 26.60, altitude: 9200, speedKnots: 550, headingDeg: 135, timestamp: '2026-08-25 15:30:00' }
    ],
    operationalStatus: {
      readinessLevel: '高威胁突防攻击战位',
      missionTask: '波斯湾空域对海反舰打击战位逼近',
      sensorMode: '机载 APG-83 AESA 相控阵雷达前向空对海搜索',
      datalinkState: '16号战术数据链接收预警机连续引导指令',
      fuelOrHealthPercent: 80
    },
    opticalFeatures: {
      lengthMeters: 19.2,
      wingspanMeters: 14.1,
      hasDualTail: true,
      infraredHotspotCount: 2,
      stealthCoatingDetected: true,
      confidence: 0.96
    },
    radarFeatures: {
      rcsMeanSqMeters: 2.5,
      dopplerShiftHz: 1320,
      frequencyBand: 'X波段 AESA火控雷达',
      pulseWidthUs: 12.5,
      priUs: 85,
      modulationType: '线性调频脉冲压缩'
    },
    sensorCoverage: {
      radarRangeKm: 180,
      scanAngleDeg: 120,
      coneColor: '#ff4d4f',
      isScanning: true,
      scanPeriodSec: 3,
      mountType: 'firecontrol'
    },
    conflicts: [],
    evidenceIds: ['E-ME-002'],
    createdProductVersion: 'PROD-SITUATION-MIDEAST-v2.1'
  },
  {
    id: 'Target-ME-003',
    codeName: '外军空中预警指挥机',
    callsign: 'HAWKEYE-07',
    type: 'aircraft',
    affiliation: 'foe',
    status: 'active',
    isHypothesis: false,
    imageUrl: SVG_AEW_SENTINEL,
    // 波斯湾南部中高空
    longitude: 54.10,
    latitude: 25.50,
    altitude: 9800,
    speedKnots: 330,
    headingDeg: 280,
    tracks: [
      { longitude: 54.80, latitude: 25.30, altitude: 9800, speedKnots: 330, headingDeg: 280, timestamp: '2026-08-25 13:00:00' },
      { longitude: 54.60, latitude: 25.35, altitude: 9800, speedKnots: 330, headingDeg: 280, timestamp: '2026-08-25 13:30:00' },
      { longitude: 54.40, latitude: 25.40, altitude: 9800, speedKnots: 330, headingDeg: 280, timestamp: '2026-08-25 14:00:00' },
      { longitude: 54.25, latitude: 25.45, altitude: 9800, speedKnots: 330, headingDeg: 280, timestamp: '2026-08-25 14:30:00' },
      { longitude: 54.15, latitude: 25.48, altitude: 9800, speedKnots: 330, headingDeg: 280, timestamp: '2026-08-25 15:00:00' },
      { longitude: 54.10, latitude: 25.50, altitude: 9800, speedKnots: 330, headingDeg: 280, timestamp: '2026-08-25 15:20:00' },
      { longitude: 53.90, latitude: 25.55, altitude: 9800, speedKnots: 330, headingDeg: 280, timestamp: '2026-08-25 15:30:00' }
    ],
    operationalStatus: {
      readinessLevel: '高空空情预警与战术管制',
      missionTask: '波斯湾全域空情态势掌握与战术数据链分发',
      sensorMode: '有源相控阵圆盘雷达 360° 全向立体扫描',
      datalinkState: '联合战术信息分发系统 (JTIDS) 持续广播',
      fuelOrHealthPercent: 88
    },
    opticalFeatures: {
      lengthMeters: 44.5,
      wingspanMeters: 40.2,
      hasDualTail: false,
      confidence: 0.98
    },
    radarFeatures: {
      rcsMeanSqMeters: 45.0,
      dopplerShiftHz: 620,
      frequencyBand: 'S/L双波段有源相控阵',
      pulseWidthUs: 60,
      modulationType: '相参捷变频脉冲'
    },
    sensorCoverage: {
      radarRangeKm: 420,
      scanAngleDeg: 360,
      coneColor: '#faad14',
      isScanning: true,
      scanPeriodSec: 5,
      mountType: 'omni'
    },
    conflicts: [],
    evidenceIds: ['E-ME-002'],
    createdProductVersion: 'PROD-SITUATION-MIDEAST-v2.1'
  },
  {
    id: 'Target-ME-004',
    codeName: '外军伴随电子战侦察机',
    callsign: 'RAVEN-03',
    type: 'aircraft',
    affiliation: 'foe',
    status: 'active',
    isHypothesis: false,
    imageUrl: SVG_FIGHTER_VIPER,
    // 与 FALCON-01 保持 28.5km 伴飞
    longitude: 52.75,
    latitude: 26.65,
    altitude: 9000,
    speedKnots: 535,
    headingDeg: 135,
    tracks: [
      { longitude: 51.10, latitude: 27.90, altitude: 9300, speedKnots: 495, headingDeg: 130, timestamp: '2026-08-25 13:00:00' },
      { longitude: 51.50, latitude: 27.60, altitude: 9200, speedKnots: 515, headingDeg: 132, timestamp: '2026-08-25 13:30:00' },
      { longitude: 51.90, latitude: 27.30, altitude: 9100, speedKnots: 525, headingDeg: 135, timestamp: '2026-08-25 14:00:00' },
      { longitude: 52.30, latitude: 27.00, altitude: 9000, speedKnots: 535, headingDeg: 135, timestamp: '2026-08-25 14:30:00' },
      { longitude: 52.60, latitude: 26.75, altitude: 9000, speedKnots: 535, headingDeg: 135, timestamp: '2026-08-25 15:00:00' },
      { longitude: 52.75, latitude: 26.65, altitude: 9000, speedKnots: 535, headingDeg: 135, timestamp: '2026-08-25 15:20:00' },
      { longitude: 53.05, latitude: 26.40, altitude: 9000, speedKnots: 545, headingDeg: 135, timestamp: '2026-08-25 15:30:00' }
    ],
    operationalStatus: {
      readinessLevel: '伴随电磁压制干扰中',
      missionTask: '为 FALCON-01 突防机群提供防空雷达压制与信道阻塞',
      sensorMode: 'Ku/X复合全向宽带电磁干扰吊舱',
      datalinkState: '机间近程高速协同数据链',
      fuelOrHealthPercent: 84
    },
    opticalFeatures: {
      lengthMeters: 18.5,
      wingspanMeters: 13.8,
      hasDualTail: true,
      infraredHotspotCount: 2,
      confidence: 0.92
    },
    radarFeatures: {
      rcsMeanSqMeters: 4.2,
      dopplerShiftHz: 1220,
      frequencyBand: 'Ku/X波段复合电子压制',
      pulseWidthUs: 15,
      modulationType: '多频点噪声调频干扰'
    },
    sensorCoverage: {
      radarRangeKm: 150,
      scanAngleDeg: 140,
      coneColor: '#faad14',
      isScanning: true,
      scanPeriodSec: 4,
      mountType: 'sector'
    },
    conflicts: [],
    evidenceIds: ['E-ME-002'],
    createdProductVersion: 'PROD-SITUATION-MIDEAST-v2.1'
  },
  {
    id: 'Target-ME-005',
    codeName: '沿岸重型防空导弹阵地',
    callsign: 'SAM-BATTERY-ME01',
    type: 'ground_facility',
    affiliation: 'foe',
    status: 'active',
    isHypothesis: false,
    imageUrl: SVG_SAM_HQ9B,
    // 霍尔木兹海峡北岸伊朗沿海山地阵位
    longitude: 56.25,
    latitude: 27.15,
    altitude: 180,
    speedKnots: 0,
    headingDeg: 180,
    tracks: [
      { longitude: 56.25, latitude: 27.15, altitude: 180, speedKnots: 0, headingDeg: 180, timestamp: '2026-08-25 13:00:00' },
      { longitude: 56.25, latitude: 27.15, altitude: 180, speedKnots: 0, headingDeg: 180, timestamp: '2026-08-25 15:30:00' }
    ],
    operationalStatus: {
      readinessLevel: '一级战备封锁状态',
      missionTask: '霍尔木兹海峡咽喉水道防空与反舰火力封锁',
      sensorMode: '多功能相控阵制导照射雷达封锁海峡扇面',
      datalinkState: '区域防空指挥控制专网实时互通',
      fuelOrHealthPercent: 100
    },
    sensorCoverage: {
      radarRangeKm: 280,
      scanAngleDeg: 120,
      coneColor: '#52c41a',
      isScanning: true,
      scanPeriodSec: 3,
      mountType: 'firecontrol'
    },
    conflicts: [],
    evidenceIds: ['E-ME-003'],
    createdProductVersion: 'PROD-SITUATION-MIDEAST-v2.1'
  },

  // ========================== 【战区三：南海与菲律宾方向】 ==========================
  {
    id: 'Target-SCS-01',
    codeName: '我方南海维权巡逻编队',
    callsign: 'PLAN-SCS-058 (编队)',
    type: 'warship',
    affiliation: 'friend',
    status: 'active',
    longitude: 116.2,
    latitude: 14.8,
    altitude: 0,
    speedKnots: 18,
    headingDeg: 160,
    tracks: [
      { longitude: 115.6, latitude: 13.9, altitude: 0, speedKnots: 16, headingDeg: 155, timestamp: '2026-08-25 13:00:00' },
      { longitude: 115.9, latitude: 14.4, altitude: 0, speedKnots: 18, headingDeg: 158, timestamp: '2026-08-25 14:00:00' },
      { longitude: 116.2, latitude: 14.8, altitude: 0, speedKnots: 18, headingDeg: 160, timestamp: '2026-08-25 15:20:00' }
    ],
    operationalStatus: {
      readinessLevel: '一级战备 (南海维权巡航)',
      missionTask: '南海常态化维权巡逻与重点岛礁周边警戒',
      sensorMode: '对海/对空搜索雷达开机',
      datalinkState: '卫通数据链在线',
      fuelOrHealthPercent: 88
    },
    sensorCoverage: {
      radarRangeKm: 260,
      scanAngleDeg: 360,
      coneColor: '#00d2ff',
      isScanning: true,
      scanPeriodSec: 4,
      mountType: 'omni'
    },
    conflicts: [],
    evidenceIds: [],
    createdProductVersion: 'PROD-SITUATION-SCS-v1.0'
  },
  {
    id: 'Target-SCS-02',
    codeName: '外军导弹驱逐舰',
    callsign: 'DDG-91 (菲西海域)',
    type: 'warship',
    affiliation: 'foe',
    status: 'active',
    longitude: 118.6,
    latitude: 13.5,
    altitude: 0,
    speedKnots: 22,
    headingDeg: 265,
    tracks: [
      { longitude: 119.4, latitude: 13.1, altitude: 0, speedKnots: 20, headingDeg: 270, timestamp: '2026-08-25 13:00:00' },
      { longitude: 119.0, latitude: 13.3, altitude: 0, speedKnots: 21, headingDeg: 268, timestamp: '2026-08-25 14:00:00' },
      { longitude: 118.6, latitude: 13.5, altitude: 0, speedKnots: 22, headingDeg: 265, timestamp: '2026-08-25 15:20:00' }
    ],
    radarFeatures: {
      rcsMeanSqMeters: 3200,
      dopplerShiftHz: 90,
      frequencyBand: 'S波段对海搜索雷达',
      pulseWidthUs: 40
    },
    conflicts: [],
    evidenceIds: [],
    createdProductVersion: 'PROD-SITUATION-SCS-v1.0'
  },
  {
    id: 'Target-SCS-03',
    codeName: '菲律宾海警巡逻船',
    callsign: 'PCG-4401',
    type: 'warship',
    affiliation: 'neutral',
    status: 'active',
    longitude: 119.6,
    latitude: 12.6,
    altitude: 0,
    speedKnots: 14,
    headingDeg: 230,
    tracks: [
      { longitude: 119.9, latitude: 12.9, altitude: 0, speedKnots: 12, headingDeg: 235, timestamp: '2026-08-25 13:00:00' },
      { longitude: 119.6, latitude: 12.6, altitude: 0, speedKnots: 14, headingDeg: 230, timestamp: '2026-08-25 15:20:00' }
    ],
    conflicts: [],
    evidenceIds: [],
    createdProductVersion: 'PROD-SITUATION-SCS-v1.0'
  },
  {
    id: 'Target-SCS-04',
    codeName: '我方南海岛礁雷达站',
    callsign: 'SCS-RADAR-07',
    type: 'ground_facility',
    affiliation: 'friend',
    status: 'active',
    longitude: 113.5,
    latitude: 9.8,
    altitude: 45,
    speedKnots: 0,
    headingDeg: 0,
    tracks: [],
    operationalStatus: {
      readinessLevel: '常态化战备 (全天候值守)',
      missionTask: '南海重点岛礁周边海空情监视与预警',
      sensorMode: '对海/对空远程搜索雷达24小时值守',
      datalinkState: '卫星通信链路在线',
      fuelOrHealthPercent: 96
    },
    sensorCoverage: {
      radarRangeKm: 420,
      scanAngleDeg: 360,
      coneColor: '#00d2ff',
      isScanning: true,
      scanPeriodSec: 5,
      mountType: 'omni'
    },
    conflicts: [],
    evidenceIds: [],
    createdProductVersion: 'PROD-SITUATION-SCS-v1.0'
  },
  {
    id: 'Target-SCS-05',
    codeName: '外军P-8A反潜巡逻机',
    callsign: 'P8A-552',
    type: 'aircraft',
    affiliation: 'foe',
    status: 'active',
    longitude: 117.5,
    latitude: 12.2,
    altitude: 8500,
    speedKnots: 380,
    headingDeg: 195,
    tracks: [
      { longitude: 118.2, latitude: 11.5, altitude: 8500, speedKnots: 370, headingDeg: 200, timestamp: '2026-08-25 13:00:00' },
      { longitude: 117.8, latitude: 11.9, altitude: 8500, speedKnots: 375, headingDeg: 198, timestamp: '2026-08-25 14:00:00' },
      { longitude: 117.5, latitude: 12.2, altitude: 8500, speedKnots: 380, headingDeg: 195, timestamp: '2026-08-25 15:20:00' }
    ],
    conflicts: [],
    evidenceIds: [],
    createdProductVersion: 'PROD-SITUATION-SCS-v1.0'
  },
  {
    id: 'Target-SCS-06',
    codeName: '我方南海巡航护卫舰',
    callsign: 'PLAN-FFG-570',
    type: 'warship',
    affiliation: 'friend',
    status: 'active',
    longitude: 114.2,
    latitude: 11.5,
    altitude: 0,
    speedKnots: 16,
    headingDeg: 145,
    tracks: [
      { longitude: 113.8, latitude: 10.8, altitude: 0, speedKnots: 14, headingDeg: 140, timestamp: '2026-08-25 13:00:00' },
      { longitude: 114.0, latitude: 11.2, altitude: 0, speedKnots: 15, headingDeg: 142, timestamp: '2026-08-25 14:00:00' },
      { longitude: 114.2, latitude: 11.5, altitude: 0, speedKnots: 16, headingDeg: 145, timestamp: '2026-08-25 15:20:00' }
    ],
    operationalStatus: {
      readinessLevel: '二级战备 (南海巡航)',
      missionTask: '南海南部海域巡航与岛礁补给护航',
      sensorMode: '对海/对空搜索雷达值班',
      datalinkState: '卫通数据链在线',
      fuelOrHealthPercent: 91
    },
    sensorCoverage: {
      radarRangeKm: 180,
      scanAngleDeg: 120,
      coneColor: '#00d2ff',
      isScanning: true,
      scanPeriodSec: 4,
      mountType: 'sector',
      jamming: {
        isJammed: true,
        jammerTargetIds: ['Target-SCS-05'],
        effectiveRangeKm: 80,
        notchSpanDeg: 24,
        flicker: true,
        startTime: '2026-08-25 14:30:00',
        endTime: '2026-08-25 15:50:00'
      }
    },
    conflicts: [],
    evidenceIds: [],
    createdProductVersion: 'PROD-SITUATION-SCS-v1.0'
  },
  {
    id: 'Target-SCS-07',
    codeName: '菲律宾武装渔船编队',
    callsign: 'PCG-AF-03',
    type: 'warship',
    affiliation: 'neutral',
    status: 'active',
    longitude: 118.2,
    latitude: 11.2,
    altitude: 0,
    speedKnots: 10,
    headingDeg: 285,
    tracks: [
      { longitude: 118.8, latitude: 11.5, altitude: 0, speedKnots: 10, headingDeg: 280, timestamp: '2026-08-25 13:00:00' },
      { longitude: 118.5, latitude: 11.3, altitude: 0, speedKnots: 10, headingDeg: 283, timestamp: '2026-08-25 14:30:00' },
      { longitude: 118.2, latitude: 11.2, altitude: 0, speedKnots: 10, headingDeg: 285, timestamp: '2026-08-25 15:20:00' }
    ],
    conflicts: [],
    evidenceIds: [],
    createdProductVersion: 'PROD-SITUATION-SCS-v1.0'
  },
  {
    id: 'Target-SCS-08',
    codeName: '我方海警巡逻船',
    callsign: 'SCS-CG-01',
    type: 'warship',
    affiliation: 'friend',
    status: 'active',
    longitude: 115.1,
    latitude: 13.2,
    altitude: 0,
    speedKnots: 17,
    headingDeg: 118,
    tracks: [
      { longitude: 114.5, latitude: 12.8, altitude: 0, speedKnots: 15, headingDeg: 110, timestamp: '2026-08-25 13:00:00' },
      { longitude: 114.8, latitude: 13.0, altitude: 0, speedKnots: 16, headingDeg: 114, timestamp: '2026-08-25 14:00:00' },
      { longitude: 115.1, latitude: 13.2, altitude: 0, speedKnots: 17, headingDeg: 118, timestamp: '2026-08-25 15:20:00' }
    ],
    operationalStatus: {
      readinessLevel: '常态巡逻值守',
      missionTask: '重点岛礁周边海上巡逻与识别查证',
      sensorMode: '对海搜索雷达与光电设备值守',
      datalinkState: '海上执法通信链路在线',
      fuelOrHealthPercent: 93
    },
    sensorCoverage: {
      radarRangeKm: 120,
      scanAngleDeg: 180,
      coneColor: '#00d2ff',
      isScanning: true,
      scanPeriodSec: 4,
      mountType: 'sector'
    },
    conflicts: [],
    evidenceIds: [],
    createdProductVersion: 'PROD-SITUATION-SCS-v1.0'
  },
  {
    id: 'Target-SCS-09',
    codeName: '我方补给保障船',
    callsign: 'SCS-SUPPLY-01',
    type: 'warship',
    affiliation: 'friend',
    status: 'active',
    longitude: 113.9,
    latitude: 12.5,
    altitude: 0,
    speedKnots: 13,
    headingDeg: 72,
    tracks: [
      { longitude: 113.2, latitude: 12.1, altitude: 0, speedKnots: 12, headingDeg: 68, timestamp: '2026-08-25 13:00:00' },
      { longitude: 113.6, latitude: 12.3, altitude: 0, speedKnots: 13, headingDeg: 70, timestamp: '2026-08-25 14:00:00' },
      { longitude: 113.9, latitude: 12.5, altitude: 0, speedKnots: 13, headingDeg: 72, timestamp: '2026-08-25 15:20:00' }
    ],
    operationalStatus: {
      readinessLevel: '保障任务执行中',
      missionTask: '为南海巡逻编队提供补给保障',
      sensorMode: '航行警戒雷达值守',
      datalinkState: '编队保障通信链路在线',
      fuelOrHealthPercent: 95
    },
    conflicts: [],
    evidenceIds: [],
    createdProductVersion: 'PROD-SITUATION-SCS-v1.0'
  },
  {
    id: 'Target-SCS-10',
    codeName: '外军无人侦察机',
    callsign: 'UAV-RECON-01',
    type: 'aircraft',
    affiliation: 'foe',
    status: 'active',
    longitude: 118.9,
    latitude: 14.1,
    altitude: 7200,
    speedKnots: 240,
    headingDeg: 208,
    tracks: [
      { longitude: 119.7, latitude: 14.8, altitude: 7000, speedKnots: 230, headingDeg: 212, timestamp: '2026-08-25 13:00:00' },
      { longitude: 119.3, latitude: 14.4, altitude: 7100, speedKnots: 235, headingDeg: 210, timestamp: '2026-08-25 14:00:00' },
      { longitude: 118.9, latitude: 14.1, altitude: 7200, speedKnots: 240, headingDeg: 208, timestamp: '2026-08-25 15:20:00' }
    ],
    radarFeatures: {
      rcsMeanSqMeters: 1.8,
      dopplerShiftHz: 135,
      frequencyBand: 'C波段数据链路',
      pulseWidthUs: 18
    },
    conflicts: [],
    evidenceIds: [],
    createdProductVersion: 'PROD-SITUATION-SCS-v1.0'
  },
  {
    id: 'Target-SCS-11',
    codeName: '过往商船',
    callsign: 'MV-OCEAN-07',
    type: 'warship',
    affiliation: 'neutral',
    status: 'active',
    longitude: 115.4,
    latitude: 10.8,
    altitude: 0,
    speedKnots: 14,
    headingDeg: 42,
    tracks: [
      { longitude: 114.8, latitude: 10.2, altitude: 0, speedKnots: 13, headingDeg: 40, timestamp: '2026-08-25 13:00:00' },
      { longitude: 115.1, latitude: 10.5, altitude: 0, speedKnots: 14, headingDeg: 41, timestamp: '2026-08-25 14:00:00' },
      { longitude: 115.4, latitude: 10.8, altitude: 0, speedKnots: 14, headingDeg: 42, timestamp: '2026-08-25 15:20:00' }
    ],
    conflicts: [],
    evidenceIds: [],
    createdProductVersion: 'PROD-SITUATION-SCS-v1.0'
  }
]

export const MOCK_RELATIONS: SpatialRelation[] = [
  // ========================== 【东南海峡战区关系】 ==========================
  {
    id: 'REL-001',
    relationType: 'escort',
    relationName: '【战术伴飞护航】伴飞电子战掩护链路',
    sourceTargetId: 'Target-005',
    targetTargetId: 'Target-001',
    spatialDistanceKm: 24.5,
    confidence: 0.98,
    description: 'Target-005 与 Target-001 保持 24.5 公里近距离战术编队，提供防空压制与伴随掩护',
    isActive: true
  },
  {
    id: 'REL-002',
    relationType: 'command',
    relationName: '【预警指挥引导】远程战术数据链协同',
    sourceTargetId: 'Target-002',
    targetTargetId: 'Target-001',
    spatialDistanceKm: 235.0,
    confidence: 0.95,
    description: '预警机通过 16号战术数据链向突防战机持续回传我方雷达部署与空情',
    isActive: true
  },
  {
    id: 'REL-003',
    relationType: 'threat',
    relationName: '【超视距打击威胁】潜在超视距反舰威胁线',
    sourceTargetId: 'Target-001',
    targetTargetId: 'Target-003',
    spatialDistanceKm: 185.0,
    confidence: 0.89,
    description: '突防战机正处于向我水面驱逐舰阵位发起防区外反舰巡航弹攻击的发射包络内',
    isActive: true
  },
  {
    id: 'REL-004',
    relationType: 'coordination',
    relationName: '【陆海防空互联】驱逐舰与地导协同网络',
    sourceTargetId: 'Target-003',
    targetTargetId: 'Target-004',
    spatialDistanceKm: 148.0,
    confidence: 0.99,
    description: '我驱逐舰相控阵雷达空情实时融合并推流至沿海红旗-9B阵地，构成梯次截击网络',
    isActive: true
  },
  {
    id: 'REL-005',
    relationType: 'strike',
    relationName: '【地导超视距截击】地空导弹火力拦截线',
    sourceTargetId: 'Target-004',
    targetTargetId: 'Target-001',
    spatialDistanceKm: 242.0,
    confidence: 0.94,
    description: '沿海红旗-9B阵地雷达已锁定突防机方位，已具备发射超视距防空拦截弹条件',
    isActive: true
  },

  // ========================== 【中东波斯湾与霍尔木兹海峡战区关系】 ==========================
  {
    id: 'REL-ME-001',
    relationType: 'escort',
    relationName: '【战术伴飞护航】波斯湾伴随电子压制链路',
    sourceTargetId: 'Target-ME-004',
    targetTargetId: 'Target-ME-002',
    spatialDistanceKm: 28.5,
    confidence: 0.97,
    description: 'RAVEN-03 电子战机与 FALCON-01 突防战机保持 28.5 公里近距编队，实施伴随电磁干扰掩护',
    isActive: true
  },
  {
    id: 'REL-ME-002',
    relationType: 'command',
    relationName: '【预警指挥引导】JTIDS战术空情推流',
    sourceTargetId: 'Target-ME-003',
    targetTargetId: 'Target-ME-002',
    spatialDistanceKm: 210.0,
    confidence: 0.96,
    description: 'HAWKEYE-07 预警机通过 JTIDS 数据链向 FALCON-01 突防机群分发阿曼湾空情与雷达视距参数',
    isActive: true
  },
  {
    id: 'REL-ME-003',
    relationType: 'threat',
    relationName: '【超视距对海威胁】波斯湾对海反舰威胁线',
    sourceTargetId: 'Target-ME-002',
    targetTargetId: 'Target-ME-001',
    spatialDistanceKm: 195.0,
    confidence: 0.91,
    description: 'FALCON-01 战机向东南机动逼近，对我方阿曼湾护航编队焦作舰构成潜在防区外空对海打击威胁',
    isActive: true
  },
  {
    id: 'REL-ME-004',
    relationType: 'coordination',
    relationName: '【海空防空拦截监视】焦作舰防空锁定线',
    sourceTargetId: 'Target-ME-001',
    targetTargetId: 'Target-ME-002',
    spatialDistanceKm: 195.0,
    confidence: 0.98,
    description: '我方 052D型焦作舰 346A相控阵雷达已在 260km 防空穹顶内连续捕获突防机信号并建立追踪档案',
    isActive: true
  },
  {
    id: 'REL-ME-005',
    relationType: 'strike',
    relationName: '【沿岸海峡封锁截击】海峡咽喉立体火力包络',
    sourceTargetId: 'Target-ME-005',
    targetTargetId: 'Target-ME-001',
    spatialDistanceKm: 240.0,
    confidence: 0.93,
    description: '霍尔木兹海峡北岸沿海防空阵地雷达对海峡水道保持超视距立体警戒封锁',
    isActive: true
  },
  {
    id: 'REL-SCS-01',
    relationType: 'threat',
    relationName: '【海上跟踪监视】外军驱逐舰对我编队威胁线',
    sourceTargetId: 'Target-SCS-02',
    targetTargetId: 'Target-SCS-01',
    spatialDistanceKm: 180.0,
    confidence: 0.88,
    description: '外军导弹驱逐舰在南海菲律宾以西海域向西机动逼近，对我方巡逻编队构成跟踪监视威胁',
    isActive: true
  },
  {
    id: 'REL-SCS-02',
    relationType: 'coordination',
    relationName: '【海空协同警戒】雷达站与巡逻编队协同线',
    sourceTargetId: 'Target-SCS-04',
    targetTargetId: 'Target-SCS-01',
    spatialDistanceKm: 320.0,
    confidence: 0.92,
    description: '南海岛礁雷达站为巡逻编队提供远程对空对海警戒信息支援',
    isActive: true
  },
  {
    id: 'REL-SCS-03',
    relationType: 'coordination',
    relationName: '【海上协同巡逻】海警巡逻船与维权编队协同线',
    sourceTargetId: 'Target-SCS-08',
    targetTargetId: 'Target-SCS-01',
    spatialDistanceKm: 202.0,
    confidence: 0.91,
    description: '我方海警巡逻船与南海维权巡逻编队保持协同巡逻，通过海上执法通信链路共享识别信息。',
    isActive: true
  },
  {
    id: 'REL-SCS-04',
    relationType: 'escort',
    relationName: '【补给保障】补给船对巡航护卫舰保障航线',
    sourceTargetId: 'Target-SCS-09',
    targetTargetId: 'Target-SCS-06',
    spatialDistanceKm: 135.0,
    confidence: 0.89,
    description: '我方补给保障船向南海巡航护卫舰航行方向机动，为持续巡逻任务提供补给保障。',
    isActive: true
  },
  {
    id: 'REL-SCS-05',
    relationType: 'scan',
    relationName: '【空中侦察】外军无人机对岛礁周边扫描线',
    sourceTargetId: 'Target-SCS-10',
    targetTargetId: 'Target-SCS-04',
    spatialDistanceKm: 750.0,
    confidence: 0.86,
    description: '外军无人侦察机沿岛礁以东空域活动，对我方南海岛礁雷达站及周边海上目标保持侦察航线。',
    isActive: true
  }
]

export const MOCK_REGIONS: SituationRegion[] = [
  // ========================== 【东南海峡战区包络】 ==========================
  {
    id: 'REG-001',
    name: '【红区】沿海地空导弹拦截与威胁杀伤包络区',
    category: 'threat_zone',
    coordinates: [
      [119.00, 26.50],
      [123.50, 26.50],
      [123.50, 23.00],
      [119.00, 23.00]
    ],
    minAltitude: 0,
    maxAltitude: 25000,
    color: '#ff4d4f',
    opacity: 0.28,
    description: '【红色区域含义】：红方（我方）红旗-9B地空导弹与海红旗-9B对空拦截火力有效覆盖空域，敌机进入即遭拦截锁定。'
  },
  {
    id: 'REG-002',
    name: '【黄区】海峡中线以东海空管制定界与巡逻走廊',
    category: 'patrol_area',
    coordinates: [
      [121.80, 26.80],
      [124.50, 26.80],
      [124.80, 22.80],
      [122.00, 22.80]
    ],
    minAltitude: 5000,
    maxAltitude: 15000,
    color: '#faad14',
    opacity: 0.22,
    description: '【黄色区域含义】：敌方预警机战术指挥与中高空战备巡逻走廊，负责空中监视与战术空域管制。'
  },
  {
    id: 'REG-003',
    name: '【蓝区】我方水面驱逐舰防空协同与海峡扫描区',
    category: 'coordination_area',
    coordinates: [
      [118.80, 24.80],
      [120.10, 24.80],
      [120.10, 23.20],
      [118.80, 23.20]
    ],
    minAltitude: 0,
    maxAltitude: 12000,
    color: '#00d2ff',
    opacity: 0.25,
    description: '【蓝色区域含义】：我方052D驱逐舰在海峡海域的相控阵雷达重点空海监视与水面编队防空警戒区。'
  },

  // ========================== 【中东波斯湾与霍尔木兹海峡战区包络】 ==========================
  {
    id: 'REG-ME-001',
    name: '【红区】霍尔木兹海峡重型防空与反舰火力威胁杀伤区',
    category: 'threat_zone',
    coordinates: [
      [55.00, 27.80],
      [57.50, 27.80],
      [57.50, 25.80],
      [55.00, 25.80]
    ],
    minAltitude: 0,
    maxAltitude: 25000,
    color: '#ff4d4f',
    opacity: 0.28,
    description: '【中东红区含义】：霍尔木兹海峡沿岸重型防空导弹与远程岸导立体封锁杀伤区，覆盖海峡咽喉水道全部海空域。'
  },
  {
    id: 'REG-ME-002',
    name: '【黄区】波斯湾中南部空域多边战术巡逻管制定界区',
    category: 'patrol_area',
    coordinates: [
      [51.50, 27.50],
      [55.00, 27.50],
      [55.00, 24.50],
      [51.50, 24.50]
    ],
    minAltitude: 5000,
    maxAltitude: 15000,
    color: '#faad14',
    opacity: 0.22,
    description: '【中东黄区含义】：波斯湾外军预警机战术指挥空域与战备巡逻走廊，负责全湾空中监视与战术空域管制。'
  },
  {
    id: 'REG-ME-003',
    name: '【蓝区】阿曼湾国际商船护航与水面协同防空安全走廊',
    category: 'coordination_area',
    coordinates: [
      [56.80, 25.50],
      [59.50, 25.50],
      [59.50, 23.50],
      [56.80, 23.50]
    ],
    minAltitude: 0,
    maxAltitude: 12000,
    color: '#00d2ff',
    opacity: 0.25,
    description: '【中东蓝区含义】：我方052D型焦作舰护航编队在阿曼湾海域的相控阵雷达重点空海防空监视与商船安全护航走廊。'
  },
  {
    id: 'REG-SCS-01',
    name: '【南海管控区】南海维权巡逻与对峙警戒海域',
    category: 'patrol_area',
    coordinates: [
      [112.0, 8.0],
      [120.0, 8.0],
      [120.0, 18.0],
      [112.0, 18.0]
    ],
    minAltitude: 0,
    maxAltitude: 15000,
    color: '#00d2ff',
    opacity: 0.12,
    description: '南海维权巡逻与对峙警戒海域，覆盖我方巡逻编队活动区域与外军舰机抵近侦察区域'
  },
  {
    id: 'REG-SCS-02',
    name: '【南海保障协同区】巡逻编队补给与商船通航海域',
    category: 'coordination_area',
    coordinates: [
      [112.8, 9.8],
      [116.8, 9.8],
      [116.8, 13.4],
      [112.8, 13.4]
    ],
    minAltitude: 0,
    maxAltitude: 5000,
    color: '#52c41a',
    opacity: 0.12,
    description: '南海巡逻编队补给保障船航线与过往商船通航的协同关注海域。'
  }
]

export const MOCK_ENVIRONMENT: BattlefieldEnvironment = {
  weatherType: 'rain_fog',
  weatherName: '中度降雨伴低空海雾',
  cloudCoverPercent: 68,
  seaStateLevel: 4,
  seaStateDesc: '4级海况 (波浪中度破碎，浪高2.2-2.8米)',
  visibilityKm: 8.5,
  waveHeightMeters: 2.5,
  windDirectionDeg: 45,
  windSpeedKnots: 26,
  temperatureCelsius: 24.5,
  electromagneticDucting: true,
  radarAttenuationDbKm: 3.2,
  opticalAttenuationPercent: 46
}

export const MOCK_EVENTS: SituationEvent[] = [
  {
    id: 'EVT-001',
    eventName: '重点战机编队超视距突防机动',
    category: 'tactical_maneuver',
    timestamp: '2026-08-25 15:15:00',
    location: [122.85, 24.65, 8500],
    affectedTargetIds: ['Target-001', 'Target-005'],
    severity: 'critical',
    description: 'Target-001 在 Target-005 伴随电磁掩护下沿航向 82° 高速切入海峡中线东侧海空域。',
    evidenceIds: ['E001', 'E002']
  },
  {
    id: 'EVT-002',
    eventName: '预警指挥机多源航迹数据链推流',
    category: 'c2_broadcast',
    timestamp: '2026-08-25 15:10:00',
    location: [124.60, 25.80, 10500],
    affectedTargetIds: ['Target-002', 'Target-001'],
    severity: 'warning',
    description: '预警机相控阵雷达对空探测扇面全开，与突防机保持高速数据链路互联。',
    evidenceIds: ['E002']
  },
  {
    id: 'EVT-ME-001',
    eventName: '霍尔木兹海峡海空防空警戒升级与伴随电磁干扰',
    category: 'tactical_maneuver',
    timestamp: '2026-08-25 15:18:00',
    location: [52.45, 26.85, 9200],
    affectedTargetIds: ['Target-ME-002', 'Target-ME-004'],
    severity: 'critical',
    description: '波斯湾突防战机 FALCON-01 与伴随电子战机 RAVEN-03 沿 135° 航向逼近海峡咽喉。',
    evidenceIds: ['E-ME-002']
  },
  {
    id: 'EVT-ME-002',
    eventName: '阿曼湾我方护航编队组织商船编队安全过峡',
    category: 'c2_broadcast',
    timestamp: '2026-08-25 15:05:00',
    location: [57.85, 24.85, 0],
    affectedTargetIds: ['Target-ME-001'],
    severity: 'warning',
    description: '我方 052D型焦作舰组织 6 艘国际商船编队安全过峡，346A相控阵雷达全向警戒。',
    evidenceIds: ['E-ME-001']
  },
  {
    id: 'EVT-SCS-01',
    eventName: '外军舰机南海抵近侦察',
    category: 'air_reconnaissance',
    timestamp: '2026-08-25 14:00:00',
    location: [117.5, 12.2, 8500],
    affectedTargetIds: ['Target-SCS-01', 'Target-SCS-04'],
    severity: 'warning',
    description: '外军P-8A反潜巡逻机在南海海域对我方岛礁驻守设施和巡逻编队实施抵近侦察，最近距离约45公里。',
    evidenceIds: []
  },
  {
    id: 'EVT-SCS-02',
    eventName: '南海岛礁周边异常航行',
    category: 'abnormal_navigation',
    timestamp: '2026-08-25 14:30:00',
    location: [118.2, 11.2, 0],
    affectedTargetIds: ['Target-SCS-07'],
    severity: 'normal',
    description: '菲律宾武装渔船编队在南海岛礁周边海域异常航行，航迹呈环绕状态，疑似实施情报收集活动。',
    evidenceIds: []
  },
  {
    id: 'EVT-SCS-03',
    eventName: '南海巡逻编队海警协同巡逻',
    category: 'joint_patrol',
    timestamp: '2026-08-25 14:45:00',
    location: [115.1, 13.2, 0],
    affectedTargetIds: ['Target-SCS-01', 'Target-SCS-08'],
    severity: 'normal',
    description: '我方南海维权巡逻编队与海警巡逻船在重点岛礁周边海域建立协同巡逻与识别查证任务。',
    evidenceIds: []
  },
  {
    id: 'EVT-SCS-04',
    eventName: '外军无人机南海抵近侦察',
    category: 'air_reconnaissance',
    timestamp: '2026-08-25 15:05:00',
    location: [118.9, 14.1, 7200],
    affectedTargetIds: ['Target-SCS-10', 'Target-SCS-04'],
    severity: 'warning',
    description: '外军无人侦察机沿岛礁以东空域向西南方向活动，纳入当前海空态势持续跟踪。',
    evidenceIds: []
  },
  {
    id: 'EVT-SCS-05',
    eventName: '南海商船通航保障监视',
    category: 'maritime_traffic',
    timestamp: '2026-08-25 15:10:00',
    location: [115.4, 10.8, 0],
    affectedTargetIds: ['Target-SCS-09', 'Target-SCS-11'],
    severity: 'normal',
    description: '我方补给保障船与过往商船在南海保障协同区内通航，纳入巡逻任务的海上交通态势监视。',
    evidenceIds: []
  }
]

export const MOCK_PRIMARY_ASSESSMENT: ComprehensiveAssessment = {
  sceneId: 'SCENE-DEFAULT-01',
  timestamp: '2026-08-25 15:20:00',
  summaryText: '当前全球重点海空态势处于高等级防空预警状态。东南海峡与中东波斯湾/霍尔木兹海峡方向均呈现隐身突防与伴随电磁压制对抗特征；我方水面驱逐舰与沿海防空阵地已构建多层梯次防空协同网络。',
  threatLevel: 'high',
  keyEntities: ['Target-001 (突防战机)', 'Target-ME-001 (焦作舰)', 'Target-ME-002 (波斯湾战机)'],
  actionRecommendation: '建议保持两大海区驱逐舰火控雷达照射，启动防空拦截航线推演，并融合多源气象补偿修正光学测高偏差。'
}
