/**
 * @file militaryPlotting.ts
 * @description 战术军事标绘算法（进攻箭头、集结区、拦截扇区等工作内容要素生成）
 */

import * as Cesium from 'cesium'

export interface TacticalPlottingItem {
  id: string
  type: 'attack_arrow' | 'defense_perimeter' | 'staging_area'
  name: string
  points: Array<[number, number]>
  color: string
  isHypothesis: boolean
}

/** 生成进攻战术箭头多边形插值点 */
export function generateAttackArrowPoints(
  startLonLat: [number, number],
  endLonLat: [number, number]
): Array<[number, number]> {
  const [x1, y1] = startLonLat
  const [x2, y2] = endLonLat
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return [startLonLat]

  const nx = -dy / len
  const ny = dx / len
  const width = len * 0.12
  const arrowWidth = len * 0.25
  const arrowLen = len * 0.35

  const p1: [number, number] = [x1 + nx * width, y1 + ny * width]
  const p2: [number, number] = [x2 - (dx / len) * arrowLen + nx * width, y2 - (dy / len) * arrowLen + ny * width]
  const p3: [number, number] = [x2 - (dx / len) * arrowLen + nx * arrowWidth, y2 - (dy / len) * arrowLen + ny * arrowWidth]
  const p4: [number, number] = [x2, y2]
  const p5: [number, number] = [x2 - (dx / len) * arrowLen - nx * arrowWidth, y2 - (dy / len) * arrowLen - ny * arrowWidth]
  const p6: [number, number] = [x2 - (dx / len) * arrowLen - nx * width, y2 - (dy / len) * arrowLen - ny * width]
  const p7: [number, number] = [x1 - nx * width, y1 - ny * width]

  return [p1, p2, p3, p4, p5, p6, p7]
}
