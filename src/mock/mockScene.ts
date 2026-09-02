import type { CameraBookmark, LayerTreeNode, SituationalScene, ThematicPackage, WorkContent } from '@/types/scene'
import packages from '@/mock/sceneThematicPackages.json'
import layers from '@/mock/sceneLayers.json'
import bookmarkSeed from '@/mock/sceneBookmarks.json'
import workSeed from '@/mock/sceneWorkContents.json'
import sceneSeed from '@/mock/sceneDefault.json'

export const MOCK_THEMATIC_PACKAGES = packages as ThematicPackage[]
export const MOCK_CONTENT_LAYERS = layers as LayerTreeNode[]
export const MOCK_BOOKMARKS = bookmarkSeed as CameraBookmark[]
export const MOCK_WORK_CONTENTS = workSeed as WorkContent[]
export const MOCK_DEFAULT_SCENE = sceneSeed as unknown as SituationalScene

/** 补充两个可切换的研判场景档案，使"载入场景"具备真实的视角/重点目标差异 */
const MIDEAST_SCENE: SituationalScene = {
  ...MOCK_DEFAULT_SCENE,
  id: 'SCENE-MIDEAST-01',
  name: '中东波斯湾护航与海峡封控研判场景',
  theme: '远海护航编队防御与霍尔木兹海峡要地封锁态势研判',
  spatialWindow: '阿拉伯海东北 / 霍尔木兹海峡全域',
  cameraView: {
    destination: [57.6, 25.2, 2600000],
    orientation: { heading: 0, pitch: -89.9, roll: 0 }
  },
  focusedTargetIds: ['Target-ME-001', 'Target-ME-002'],
  updatedAt: '2026-08-25 15:05:00'
}

const STRAIT_SCENE: SituationalScene = {
  ...MOCK_DEFAULT_SCENE,
  id: 'SCENE-STRAIT-01',
  name: '东南海峡重点空情近景研判场景',
  theme: '海峡重点突防目标突防航线与防空拦截协同近景复盘',
  spatialWindow: '台湾海峡及东南沿海空域',
  cameraView: {
    destination: [121.6, 24.3, 1800000],
    orientation: { heading: 0, pitch: -89.9, roll: 0 }
  },
  focusedTargetIds: ['Target-001', 'Target-003'],
  updatedAt: '2026-08-25 15:12:00'
}

export const MOCK_SCENE_LIST: SituationalScene[] = [MOCK_DEFAULT_SCENE, MIDEAST_SCENE, STRAIT_SCENE]
