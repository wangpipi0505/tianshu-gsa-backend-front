/**
 * @file mockOntology.ts
 * @description 7大核心领域本体定义与图谱拓扑数据（纯中文落地）
 */

import type { OntologyClass, OntologyRelation, OntologyGraphNode, OntologyGraphLink } from '@/types/ontology'

export const DOMAIN_CATEGORIES = [
  { name: '目标本体', domain: 'Target', color: '#00d2ff' },
  { name: '目标特性本体', domain: 'TargetCharacteristic', color: '#ffaa00' },
  { name: '态势事件本体', domain: 'Event', color: '#ff4d4f' },
  { name: '情报本体', domain: 'Intelligence', color: '#a066ff' },
  { name: '环境本体', domain: 'Environment', color: '#52c41a' },
  { name: '时空本体', domain: 'Spatiotemporal', color: '#13c2c2' },
  { name: '证据分析本体', domain: 'Evidence', color: '#fadb14' }
]

export const ONTOLOGY_CLASSES: OntologyClass[] = [
  // 1. 目标本体
  { id: 'Class_Target', name: '目标实体', domain: 'Target', description: '人员、装备、设施、平台等各类作战实体', properties: ['目标编号', '目标类型', '运行状态', '无线电呼号', '敌我属性'] },
  { id: 'Class_Sensor', name: '传感器载荷', domain: 'Target', description: '光学、雷达、红外等多源探测载荷设备', properties: ['载荷编号', '传感器类型', '探测工作频段', '空间分辨率'] },
  { id: 'Class_Platform', name: '搭载平台', domain: 'Target', description: '战斗机、水面舰艇、指挥车辆、遥感卫星等载具', properties: ['平台编号', '装备型号', '最大机动航速', '挂载能力'] },

  // 2. 目标特性本体
  { id: 'Class_OpticalChar', name: '光学物理特性', domain: 'TargetCharacteristic', description: '外形几何、几何尺寸、结构部件、红外热斑及涂装伪装特征', properties: ['外形尺寸', '红外热斑温度', '光谱反射特征'] },
  { id: 'Class_RadarChar', name: '雷达电磁特性', domain: 'TargetCharacteristic', description: '散射截面、极化模式、多普勒频移、时频重频与脉宽特征', properties: ['散射截面均值', '多普勒频移', '脉冲重频', '脉冲宽度'] },
  { id: 'Class_RecogResult', name: '型号识别结论', domain: 'TargetCharacteristic', description: '基于多维特征的机型识别结果与置信度', properties: ['预测机型', '置信度', '数据源载荷'] },

  // 3. 事件本体
  { id: 'Class_RecognitionEvent', name: '特征识别事件', domain: 'Event', description: '传感器数据提取特征至完成机型分类判定的过程', properties: ['原始记录编号', '识别结论', '置信度', '发生时点'] },
  { id: 'Class_MovementEvent', name: '机动变高事件', domain: 'Event', description: '航向突变、机动加速、变高爬升等活动', properties: ['起始坐标', '终止坐标', '机动加速度'] },
  { id: 'Class_AnomalyEvent', name: '异常态势事件', domain: 'Event', description: '异常徘徊滞留、静默超低空入侵、雷达信号突发等', properties: ['异常评分', '威胁等级', '波及空域'] },

  // 4. 情报本体
  { id: 'Class_IntelReport', name: '综合情报报告', domain: 'Intelligence', description: '多源结构化与非结构化情报通报文档', properties: ['报告编号', '来源单位', '可靠度等级', '研判摘要'] },
  { id: 'Class_IntelObservation', name: '单次情报观测', domain: 'Intelligence', description: '特定时间与地点的单次情报线索观测记录', properties: ['观测时点', '经纬高坐标', '观测状态描述'] },

  // 5. 环境本体
  { id: 'Class_Terrain', name: '地形地貌环境', domain: 'Environment', description: '数字高程模型、地表覆被、海岸线形态', properties: ['高程数据', '地表粗糙度', '地物类型'] },
  { id: 'Class_Weather', name: '气象水文环境', domain: 'Environment', description: '云层遮挡、海况等级、大气能见度、电磁折射率', properties: ['云量覆盖', '海况等级', '能见度距离'] },

  // 6. 时空本体
  { id: 'Class_Track', name: '时空航迹序列', domain: 'Spatiotemporal', description: '随时间演化的三维空间位置与速度状态序列', properties: ['轨迹采样点集', '持续时长', '平均飞行速度'] },
  { id: 'Class_Region', name: '战术空间区域', domain: 'Spatiotemporal', description: '防空作战区、战备巡逻区、禁飞区等地理空间网格', properties: ['多边形坐标集', '最低高度', '最高高度', '区域战术属性'] },

  // 7. 证据/分析本体
  { id: 'Class_Evidence', name: '可信证据链条', domain: 'Evidence', description: '支撑研判结论的原始传感器数据引用与置信度', properties: ['证据编号', '原始记录引用', '证据置信权重'] },
  { id: 'Class_Assessment', name: '综合研判结论', domain: 'Evidence', description: '受约束逻辑推导生成的态势综合判断结论', properties: ['结论文本', '综合置信度', '逻辑推导链条'] }
]

export const ONTOLOGY_RELATIONS: OntologyRelation[] = [
  { id: 'Rel_1', sourceClass: 'Class_Target', relationName: '拥有时空轨迹', targetClass: 'Class_Track', description: '目标拥有时空轨迹航线' },
  { id: 'Rel_2', sourceClass: 'Class_Target', relationName: '具备光学特性', targetClass: 'Class_OpticalChar', description: '目标具备光学物理特征' },
  { id: 'Rel_3', sourceClass: 'Class_Target', relationName: '具备雷达特性', targetClass: 'Class_RadarChar', description: '目标具备雷达电磁散射特征' },
  { id: 'Rel_4', sourceClass: 'Class_Target', relationName: '位于空间区域', targetClass: 'Class_Region', description: '目标位于特定战术空间区域内' },
  { id: 'Rel_5', sourceClass: 'Class_Target', relationName: '参与机动事件', targetClass: 'Class_MovementEvent', description: '目标参与特定机动事件' },
  { id: 'Rel_6', sourceClass: 'Class_Sensor', relationName: '产生探测事件', targetClass: 'Class_RecognitionEvent', description: '传感器产生识别事件' },
  { id: 'Rel_7', sourceClass: 'Class_RecognitionEvent', relationName: '提取识别结论', targetClass: 'Class_RecogResult', description: '识别事件提取出型号结果' },
  { id: 'Rel_8', sourceClass: 'Class_RecogResult', relationName: '指向目标实体', targetClass: 'Class_Target', description: '识别结果指向目标实体' },
  { id: 'Rel_9', sourceClass: 'Class_IntelReport', relationName: '情报提及目标', targetClass: 'Class_Target', description: '情报报告提及特定目标' },
  { id: 'Rel_10', sourceClass: 'Class_Assessment', relationName: '证据链支撑', targetClass: 'Class_Evidence', description: '综合研判结论由证据链支撑' },
  { id: 'Rel_11', sourceClass: 'Class_Evidence', relationName: '派生自原始观测', targetClass: 'Class_IntelObservation', description: '证据派生自原始观测记录' }
]

export function getOntologyGraphData(): { nodes: OntologyGraphNode[]; links: OntologyGraphLink[] } {
  const nodes: OntologyGraphNode[] = ONTOLOGY_CLASSES.map((cls, idx) => ({
    id: cls.id,
    name: cls.name,
    category: DOMAIN_CATEGORIES.findIndex((c) => c.domain === cls.domain),
    domain: cls.domain,
    symbolSize: cls.id === 'Class_Target' || cls.id === 'Class_Assessment' ? 56 : 44,
    value: cls.description
  }))

  const links: OntologyGraphLink[] = ONTOLOGY_RELATIONS.map((rel) => ({
    source: rel.sourceClass,
    target: rel.targetClass,
    label: rel.relationName
  }))

  return { nodes, links }
}
