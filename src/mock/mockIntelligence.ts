/**
 * @file mockIntelligence.ts
 * @description 证据链定义 (E001-E004, E-ME-001~E-ME-003)、历史情报研判报告与历史目标特征库
 */

import type { EvidenceItem } from '@/types/situation'

/** 核心证据项（支持从综合研判结论一路溯源到原始传感器记录） */
export const MOCK_EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: 'E001',
    code: 'E001',
    title: '当前高分光学载荷外形与红外特征参数',
    category: 'optical_data',
    summary: '由机载光电侦察吊舱在14:22提取，目标长19.2m、双发后掠翼，尾喷口红外热斑温度达540℃，置信度0.94',
    confidence: 0.94,
    sourceDatasetId: 'DS-OPTICAL-01',
    sourceDatasetName: '海峡重点空域高分光学载荷观测集',
    rawRecordId: 'OPT-REC-001',
    timestamp: '2026-08-25 14:22:15',
    rawPayloadSnippet: {
      sensorType: 'EO/IR Pod Model-X9',
      imageResM: 0.15,
      wingspan: 14.1,
      fuselageLength: 19.2,
      aspectRatio: 1.36,
      infraredTempCelsius: 540,
      dominantColorHex: '#4A5568'
    }
  },
  {
    id: 'E002',
    code: 'E002',
    title: '历史重型隐身战机Alpha机型电磁与RCS特征基线',
    category: 'radar_data',
    summary: '雷达特征库中历史机型Alpha在X波段正向RCS均值为0.025m²，当前侧向机动探测RCS为2.8m²，符合该机动特征谱',
    confidence: 0.91,
    sourceDatasetId: 'DS-RADAR-02',
    sourceDatasetName: '沿海对空预警雷达网连续航迹集',
    rawRecordId: 'RAD-REC-101',
    timestamp: '2026-08-25 14:22:10',
    rawPayloadSnippet: {
      radarStationId: 'RADAR-SITE-03',
      freqBand: 'X-band',
      prfHz: 1200,
      pulseWidthUs: 2.5,
      measuredRcsDbsm: 4.47,
      polarization: 'VV',
      dopplerHz: 1420
    }
  },
  {
    id: 'E003',
    code: 'E003',
    title: '联合情报报告 INTEL-2026-088: 某前沿基地重点机型转场通报',
    category: 'intelligence_report',
    summary: '情报通报显示该联队于24日进驻前沿基地，出动批次常包含两机编队伴随加油机开展超视距远海战备巡逻',
    confidence: 0.88,
    sourceDatasetId: 'DS-INTEL-03',
    sourceDatasetName: '联合情报中心态势通报与外军编成库',
    rawRecordId: 'INTEL-DOC-088',
    timestamp: '2026-08-25 10:15:00',
    rawPayloadSnippet: {
      classification: 'SECRET',
      authoringAgency: 'Joint Recon Office',
      deploymentAirbase: 'Okinawa Base',
      aircraftCount: 6,
      typicalFlightRegime: 'High Altitude Escort Sweep'
    }
  },
  {
    id: 'E004',
    code: 'E004',
    title: '电子侦察支援载荷拦截的电磁辐射源特征谱',
    category: 'elint_data',
    summary: '捕获到该机火控雷达在14:21进行短时截获脉冲，频点与历史战役记录中的APG-81型雷达高度重合',
    confidence: 0.96,
    sourceDatasetId: 'DS-ELINT-04',
    sourceDatasetName: '全域电磁辐射源监测专网',
    rawRecordId: 'ELINT-PULSE-442',
    timestamp: '2026-08-25 14:21:48',
    rawPayloadSnippet: {
      detectedFrequencyGhz: 9.35,
      pulseRepetitionIntervalUs: 125,
      scanPeriodSec: 2.4,
      emitterIdentityPrediction: 'APG-81-AESA',
      emitterConfidence: 0.97
    }
  },
  {
    id: 'E-ME-001',
    code: 'E-ME-001',
    title: '中东阿曼湾我方护航编队卫通数据链与海事AIS双重校验记录',
    category: 'c2_data',
    summary: 'PLAN-DDG-163 焦作舰通过北斗/卫通专网持续回传阿曼湾商船编队安全护航坐标与 346A相控阵雷达空海监视状态',
    confidence: 0.99,
    sourceDatasetId: 'DS-ME-NAVAL-01',
    sourceDatasetName: '第46批远海护航编队战备日志与北斗报文集',
    rawRecordId: 'ME-NAV-REC-163',
    timestamp: '2026-08-25 15:20:00',
    rawPayloadSnippet: {
      shipName: 'PLAN-DDG-163 焦作舰',
      escortCount: 6,
      seaArea: 'Gulf of Oman / Strait of Hormuz East Approach',
      datalinkQuality: 'EXCELLENT',
      airDefenseStatus: 'DEFCON 1'
    }
  },
  {
    id: 'E-ME-002',
    code: 'E-ME-002',
    title: '波斯湾战术空情预警网络实时多源雷达截获参数',
    category: 'radar_data',
    summary: '波斯湾外军预警机与突防战机编队（FALCON-01 + RAVEN-03）时空航迹与 X波段火控信号被多站点连续测向锁定',
    confidence: 0.95,
    sourceDatasetId: 'DS-ME-RADAR-02',
    sourceDatasetName: '中东海空重点空域多源雷达网时序航迹集',
    rawRecordId: 'ME-RAD-REC-202',
    timestamp: '2026-08-25 15:18:30',
    rawPayloadSnippet: {
      formationType: 'Fighter + Escort EW',
      targetHeadingDeg: 135,
      speedKnots: 540,
      altitudeM: 9200
    }
  },
  {
    id: 'E-ME-003',
    code: 'E-ME-003',
    title: '霍尔木兹海峡北岸重型防空制导雷达电磁辐射源特征',
    category: 'elint_data',
    summary: '拦截到海峡北岸山地阵位防空多功能相控阵制导雷达常态化开机信号，覆盖海峡咽喉水道全部海空空域',
    confidence: 0.97,
    sourceDatasetId: 'DS-ME-ELINT-03',
    sourceDatasetName: '霍尔木兹海峡重点辐射源信号特征库',
    rawRecordId: 'ME-ELINT-SIG-08',
    timestamp: '2026-08-25 15:10:00',
    rawPayloadSnippet: {
      siteLocation: 'Strait of Hormuz North Ridge',
      systemType: 'Heavy SAM Phased Array',
      coverageRadiusKm: 280
    }
  }
]

/** 历史相似目标匹配知识库（用于基于特性的余弦相似度匹配） */
export const HISTORICAL_SIMILAR_TARGETS = [
  {
    targetCode: 'HIST-TARGET-2024-09',
    targetName: '2024年某联合演训 Alpha型战机',
    similarityScore: 0.948,
    description: '在相同海空域执行低空突防演练，其红外热斑分布与当前雷达RCS波形吻合度达95%',
    keyMatches: ['翼展与机长匹配 (98%)', '双发红外热斑温度 (95%)', 'X波段侧向RCS特征谱 (94%)']
  },
  {
    targetCode: 'HIST-TARGET-2025-03',
    targetName: '2025年南部海空突防 Beta机型',
    similarityScore: 0.882,
    description: '采用相似的伴随干扰机电磁压制战法，编队间距与当前24.5km配置基本一致',
    keyMatches: ['伴随电子战协同阵位 (92%)', '雷达杂波压制频段 (89%)']
  },
  {
    targetCode: 'HIST-TARGET-2026-01',
    targetName: '中东波斯湾突防战术巡航编队',
    similarityScore: 0.915,
    description: '霍尔木兹海峡外海预警引导超视距战术航线，与当前中东方向空情态势特征吻合',
    keyMatches: ['JTIDS预警数据链分发模式 (96%)', '航向135°对海逼近 (91%)']
  }
]
