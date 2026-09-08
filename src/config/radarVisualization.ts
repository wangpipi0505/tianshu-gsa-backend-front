import type { JammingState, SituationTarget } from '@/types/situation'

type RadarVisualProfile = {
  radarRangeKm: number
  scanAngleDeg: number
  coneColor: string
  scanPeriodSec: number
  mountType: 'omni' | 'sector' | 'firecontrol'
  jamming?: JammingState
}

/**
 * 纯前端交付版的雷达扫描与电子对抗视觉参数。
 * 后端返回同名字段时优先采用后端数据；这里仅补齐尚未扩展的演示快照字段。
 */
const RADAR_VISUAL_PROFILES: Record<string, RadarVisualProfile> = {
  'Target-003': {
    radarRangeKm: 260,
    scanAngleDeg: 360,
    coneColor: '#00d2ff',
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
  'Target-ME-001': {
    radarRangeKm: 260,
    scanAngleDeg: 360,
    coneColor: '#00d2ff',
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
  'Target-SCS-06': {
    radarRangeKm: 180,
    scanAngleDeg: 120,
    coneColor: '#00d2ff',
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
  }
}

export function applyRadarVisualizationDefaults(targets: SituationTarget[]) {
  return targets.map((target) => {
    const profile = RADAR_VISUAL_PROFILES[target.id]
    if (!profile) return target
    const coverage = target.sensorCoverage
    return {
      ...target,
      sensorCoverage: {
        radarRangeKm: coverage?.radarRangeKm ?? profile.radarRangeKm,
        scanAngleDeg: coverage?.scanAngleDeg ?? profile.scanAngleDeg,
        coneColor: coverage?.coneColor ?? profile.coneColor,
        isScanning: coverage?.isScanning ?? true,
        elevationDeg: coverage?.elevationDeg,
        scanPeriodSec: coverage?.scanPeriodSec ?? profile.scanPeriodSec,
        mountType: coverage?.mountType ?? profile.mountType,
        jamming: coverage?.jamming ?? profile.jamming
      }
    }
  })
}
