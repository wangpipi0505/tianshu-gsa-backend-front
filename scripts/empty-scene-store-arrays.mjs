import { readFileSync, writeFileSync } from 'node:fs'

const path = new URL('../src/stores/sceneStore.ts', import.meta.url)
let src = readFileSync(path, 'utf8')

function replaceDataArray(source, varName, typeName) {
  const marker = `const ${varName} = ref<${typeName}>`
  const idx = source.indexOf(marker)
  if (idx < 0) throw new Error(`marker not found: ${marker}`)
  const afterGeneric = source.indexOf('>(', idx)
  const start = source.indexOf('[', afterGeneric)
  let depth = 0
  let inSingle = false
  let inDouble = false
  let escaped = false
  for (let i = start; i < source.length; i++) {
    const ch = source[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\' && (inSingle || inDouble)) {
      escaped = true
      continue
    }
    if (!inDouble && ch === "'") {
      inSingle = !inSingle
      continue
    }
    if (!inSingle && ch === '"') {
      inDouble = !inDouble
      continue
    }
    if (inSingle || inDouble) continue
    if (ch === '[') depth += 1
    if (ch === ']') {
      depth -= 1
      if (depth === 0) {
        const close = source.indexOf(')', i)
        return source.slice(0, idx) + `const ${varName} = ref<${typeName}>([])` + source.slice(close + 1)
      }
    }
  }
  throw new Error(`unclosed ${varName}`)
}

src = replaceDataArray(src, 'thematicPackages', 'ThematicPackage[]')
src = replaceDataArray(src, 'contentLayers', 'LayerTreeNode[]')
src = replaceDataArray(src, 'workContents', 'WorkContent[]')
src = replaceDataArray(src, 'sceneList', 'SituationalScene[]')
src = replaceDataArray(src, 'bookmarks', 'CameraBookmark[]')

if (!src.includes("from '@/api/scene'")) {
  src = src.replace(
    "from '@/types/scene'",
    "from '@/types/scene'\nimport { fetchSceneDetail, fetchScenes, saveSceneLayers, saveThematicPackages, updateScene } from '@/api/scene'"
  )
}

if (!src.includes('async function loadFromApi')) {
  src = src.replace(
    '  return {',
    `  async function loadFromApi(sceneId = 'SCENE-DEFAULT-01') {
    const [list, detail] = await Promise.all([fetchScenes(), fetchSceneDetail(sceneId)])
    sceneList.value = list || []
    if (detail.scene) activeScene.value = detail.scene
    thematicPackages.value = detail.thematicPackages || []
    contentLayers.value = Array.isArray(detail.layers) ? detail.layers : []
    workContents.value = detail.workContents || []
    bookmarks.value = detail.bookmarks || []
  }

  async function persistLayers() {
    if (!activeScene.value?.id) return
    await saveSceneLayers(activeScene.value.id, contentLayers.value)
  }

  async function persistPackages() {
    if (!activeScene.value?.id) return
    await saveThematicPackages(activeScene.value.id, thematicPackages.value)
  }

  async function persistScene() {
    if (!activeScene.value?.id) return
    await updateScene(activeScene.value.id, activeScene.value)
  }

  return {`
  )
  src = src.replace(
    '    toggleReferenceMode\n  }',
    `    toggleReferenceMode,
    loadFromApi,
    persistLayers,
    persistPackages,
    persistScene
  }`
  )
}

writeFileSync(path, src)
console.log('sceneStore emptied and API loaders added')
