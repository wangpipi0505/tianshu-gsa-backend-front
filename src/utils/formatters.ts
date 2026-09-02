/**
 * @file formatters.ts
 * @description 坐标格式化、时间范围格式化与战术指标计算辅助函数（纯中文输出）
 */

import dayjs from 'dayjs'

/** 格式化经纬度坐标 (例: 东经 121.85°, 北纬 24.65°, 高度 8.5公里) */
export function formatCoordinates(lon: number, lat: number, alt?: number): string {
  const lonStr = `东经 ${Math.abs(lon).toFixed(2)}°`
  const latStr = `北纬 ${Math.abs(lat).toFixed(2)}°`
  if (alt !== undefined) {
    const altStr = alt >= 1000 ? `高度 ${(alt / 1000).toFixed(1)} 公里` : `高度 ${alt} 米`
    return `${lonStr}, ${latStr}, ${altStr}`
  }
  return `${lonStr}, ${latStr}`
}

/** 格式化速度 (节 -> 公里/小时 与 马赫数) */
export function formatSpeed(knots: number): { knots: string; kmh: string; mach: string } {
  const kmh = (knots * 1.852).toFixed(0)
  const mach = (knots / 661.47).toFixed(2)
  return {
    knots: `${knots} 节`,
    kmh: `${kmh} 公里/小时`,
    mach: `马赫数 ${mach}`
  }
}

/** 格式化日期时间 */
export function formatDateTime(isoOrStr: string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!isoOrStr) return '--'
  return dayjs(isoOrStr).format(format)
}

/** 获取目标敌我属性对应的中文与色值 */
export function getAffiliationBadge(affiliation: string): { label: string; color: string; bg: string } {
  switch (affiliation) {
    case 'friend':
      return { label: '我方兵力', color: '#52c41a', bg: 'rgba(82, 196, 26, 0.15)' }
    case 'foe':
      return { label: '敌方目标', color: '#ff4d4f', bg: 'rgba(255, 77, 79, 0.2)' }
    case 'neutral':
      return { label: '中立实体', color: '#faad14', bg: 'rgba(250, 173, 20, 0.15)' }
    default:
      return { label: '待识别目标', color: '#b37feb', bg: 'rgba(179, 127, 235, 0.15)' }
  }
}

/** 获取目标类型对应的中文名 */
export function getTargetTypeMeta(type: string): { label: string; tag: string } {
  switch (type) {
    // 态势库实际使用的具体型号分类
    case 'aircraft':
      return { label: '空中目标', tag: '空中' }
    case 'warship':
      return { label: '水面舰艇', tag: '水面' }
    case 'ground_facility':
      return { label: '地面设施', tag: '设施' }
    // 领域域分类 (接口模式兼容)
    case 'air':
      return { label: '空中目标', tag: '空中' }
    case 'maritime':
      return { label: '水面舰艇', tag: '水面' }
    case 'ground':
      return { label: '地面目标', tag: '地面' }
    case 'space':
      return { label: '空间载荷', tag: '空间' }
    case 'sensor':
      return { label: '传感器站', tag: '探测' }
    case 'facility':
      return { label: '阵地设施', tag: '设施' }
    default:
      return { label: '其他要素', tag: '其他' }
  }
}
