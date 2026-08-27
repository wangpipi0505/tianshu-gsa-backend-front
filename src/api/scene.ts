import { apiDelete, apiGet, apiPost, apiPut } from '@/api/http'
import type { CameraBookmark, LayerTreeNode, SituationalScene, ThematicPackage, WorkContent } from '@/types/scene'

export interface SceneDetail {
  scene: SituationalScene
  layers: LayerTreeNode[]
  thematicPackages: ThematicPackage[]
  workContents: WorkContent[]
  bookmarks: CameraBookmark[]
}

export function fetchScenes() {
  return apiGet<SituationalScene[]>('/scenes')
}

export function fetchSceneDetail(id: string) {
  return apiGet<SceneDetail>(`/scenes/${id}`)
}

export function saveScene(scene: SituationalScene) {
  return apiPost<SituationalScene>('/scenes', scene)
}

export function updateScene(id: string, scene: SituationalScene) {
  return apiPut<SituationalScene>(`/scenes/${id}`, scene)
}

export function duplicateScene(id: string) {
  return apiPost<SituationalScene>(`/scenes/${id}/duplicate`)
}

export function saveSceneLayers(id: string, layers: LayerTreeNode[]) {
  return apiPut<LayerTreeNode[]>(`/scenes/${id}/layers`, layers)
}

export function saveThematicPackages(id: string, packages: ThematicPackage[]) {
  return apiPut<ThematicPackage[]>(`/scenes/${id}/thematic-packages`, packages)
}

export function refreshScene(id: string) {
  return apiPost<{ refreshed: boolean; scene?: SituationalScene; stale?: boolean; reason?: string }>(`/scenes/${id}/refresh`)
}

export function fetchWorkContents(id: string) {
  return apiGet<WorkContent[]>(`/scenes/${id}/work-contents`)
}

export function saveWorkContent(id: string, content: WorkContent) {
  return apiPost<WorkContent>(`/scenes/${id}/work-contents`, content)
}

export function deleteWorkContent(id: string) {
  return apiDelete<void>(`/work-contents/${id}`)
}

export function saveBookmark(sceneId: string, bookmark: CameraBookmark) {
  return apiPost<CameraBookmark>(`/scenes/${sceneId}/bookmarks`, bookmark)
}

export function exportScene(id: string, securityLevel = 'internal') {
  return apiPost<Record<string, unknown>>(`/scenes/${id}/export`, {}, { params: { securityLevel } })
}
