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
export const MOCK_DEFAULT_SCENE = sceneSeed as SituationalScene
export const MOCK_SCENE_LIST: SituationalScene[] = [MOCK_DEFAULT_SCENE]
