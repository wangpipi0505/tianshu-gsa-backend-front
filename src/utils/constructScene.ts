/**
 * 态势构建三段一体：假设性目标 + 工作内容记录 + 图层节点。
 */

import { useSituationStore } from '@/stores/situationStore'
import { useSceneStore } from '@/stores/sceneStore'
import type { AffiliationType, SituationTarget } from '@/types/situation'
import type { WorkContent } from '@/types/scene'
import { formatLocalDateTime } from '@/utils/timeRange'

export interface ConstructDraft {
  name: string
  objectType: 'aircraft' | 'warship' | 'facility'
  affiliation: AffiliationType
  longitude: number
  latitude: number
  altitude: number
  speedKnots: number
  remark?: string
  produceMode: 'manual' | 'agent'
  createdBy: string
}

export interface ConstructResult {
  targetId: string
  workContentId: string
}

export function createConstructId(): string {
  return `CONSTRUCT-${Date.now()}`
}

export function applyConstructDraft(draft: ConstructDraft, presetId?: string): ConstructResult {
  const situationStore = useSituationStore()
  const sceneStore = useSceneStore()
  const targetId = presetId || createConstructId()
  const workContentId = `WORK-${targetId}`
  const now = formatLocalDateTime(new Date())

  const target: SituationTarget = {
    id: targetId,
    codeName: draft.name,
    callsign: targetId,
    type: draft.objectType,
    affiliation: draft.affiliation,
    status: 'active',
    isHypothesis: true,
    constructSource: draft.produceMode,
    longitude: draft.longitude,
    latitude: draft.latitude,
    altitude: draft.altitude,
    speedKnots: draft.speedKnots,
    headingDeg: 0,
    tracks: [
      {
        longitude: draft.longitude,
        latitude: draft.latitude,
        altitude: draft.altitude,
        timestamp: now,
        speedKnots: draft.speedKnots
      }
    ],
    firstSeenTime: now,
    lastSeenTime: now,
    sourceDatasets: ['研判工作内容'],
    conflicts: [],
    evidenceIds: [],
    createdProductVersion: sceneStore.activeScene.productVersionId
  }

  const work: WorkContent = {
    id: workContentId,
    type: 'constructed_target',
    label: `【构建】${draft.name}`,
    isHypothesis: true,
    createdBy: draft.createdBy,
    basis: draft.remark || '态势场景构建',
    produceMode: draft.produceMode,
    relatedFactTargetId: targetId,
    payload: {
      produceMode: draft.produceMode,
      targetId,
      snapshot: {
        name: draft.name,
        objectType: draft.objectType,
        affiliation: draft.affiliation,
        longitude: draft.longitude,
        latitude: draft.latitude,
        altitude: draft.altitude,
        speedKnots: draft.speedKnots,
        remark: draft.remark || ''
      }
    },
    createdAt: now
  }

  situationStore.upsertTarget(target)
  sceneStore.addConstructedWorkItem(work, target)
  return { targetId, workContentId }
}

export function removeConstructedItem(targetId: string) {
  const situationStore = useSituationStore()
  const sceneStore = useSceneStore()
  situationStore.removeTarget(targetId)
  sceneStore.removeConstructedWorkItem(targetId)
  if (situationStore.selectedTargetId === targetId) {
    situationStore.selectedTargetId = null
  }
  const popupIdx = situationStore.openedPopupTargetIds.indexOf(targetId)
  if (popupIdx >= 0) situationStore.openedPopupTargetIds.splice(popupIdx, 1)
}
