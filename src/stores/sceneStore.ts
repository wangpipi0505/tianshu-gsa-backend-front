/**
 * @file sceneStore.ts
 * @description 态势场景、双视角图层组织（态势研判专题视图 vs 实体资产分类视图）与工作内容状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  SituationalScene,
  LayerTreeNode,
  WorkContent,
  CameraBookmark,
  ThematicPackage
} from '@/types/scene'
import type { SituationTarget } from '@/types/situation'
import { fetchSceneDetail, fetchScenes, saveSceneLayers, saveThematicPackages, updateScene } from '@/api/scene'
import { USE_MOCK, cloneMock } from '@/config/dataSource'
import { useSituationStore } from '@/stores/situationStore'
import {
  MOCK_BOOKMARKS,
  MOCK_CONTENT_LAYERS,
  MOCK_DEFAULT_SCENE,
  MOCK_SCENE_LIST,
  MOCK_THEMATIC_PACKAGES,
  MOCK_WORK_CONTENTS
} from '@/mock/mockScene'

export const useSceneStore = defineStore('scene', () => {
  // 当前视图模式 ('thematic' 态势研判专题 | 'entity' 实体资产分类)
  const activeTreeTab = ref<'thematic' | 'entity'>('thematic')

  // ===================== 【视角 A：态势研判专题（复合任务包）状态库】 =====================
  const thematicPackages = ref<ThematicPackage[]>([])

  // ===================== 【视角 B：实体资产分类（物理装备树）状态库】 =====================
  const contentLayers = ref<LayerTreeNode[]>([])

  // 当前工作内容列表
  const workContents = ref<WorkContent[]>([])

  // 当前激活的态势场景
  const activeScene = ref<SituationalScene>({
    id: 'SCENE-DEFAULT-01',
    name: '东南海峡与中东波斯湾重点方向全球态势场景',
    theme: '海空重点目标监视与多战区防空协同研判',
    productVersionId: 'PROD-SITUATION-GLOBAL-v2.1',
    referenceMode: 'follow_latest',
    spatialWindow: '全球重点海空域',
    timeWindow: ['2026-08-25 13:00:00', '2026-08-25 15:30:00'],
    cameraView: {
      destination: [116.0, 26.0, 14500000],
      orientation: { heading: 0, pitch: -89.9, roll: 0 }
    },
    focusedTargetIds: ['Target-001', 'Target-ME-001'],
    visibleLayerIds: ['LAYER-FACTS', 'LAYER-ENV', 'LAYER-WORK'],
    workContents: [],
    createdAt: '2026-08-25 14:00:00',
    updatedAt: '2026-08-25 15:20:00',
    isArchive: false
  })

  // 历史场景档案库
  const sceneList = ref<SituationalScene[]>([])

  function toggleReferenceMode() {
    activeScene.value.referenceMode =
      activeScene.value.referenceMode === 'follow_latest' ? 'fixed_version' : 'follow_latest'
    if (!USE_MOCK) void persistScene()
  }

  /** 数据产品当前最新版本（用于场景打开时的版本比对提示） */
  const latestProductVersion = ref('PROD-SITUATION-GLOBAL-v2.2')
  const dismissedVersionPrompt = ref(false)

  const hasProductVersionUpdate = computed(() => {
    if (dismissedVersionPrompt.value) return false
    if (!latestProductVersion.value) return false
    if (latestProductVersion.value === activeScene.value.productVersionId) return false
    // 同一版本的提示选择"保持现状"后持久化不再弹出（演示态即交付态，避免重复打扰）
    try {
      if (localStorage.getItem('gsa.versionPromptDismissed') === latestProductVersion.value) return false
    } catch {
      /* localStorage 不可用时退回内存判断 */
    }
    return true
  })

  function confirmProductVersionRefresh() {
    const previous = activeScene.value.productVersionId
    activeScene.value.productVersionId = latestProductVersion.value
    activeScene.value.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
    workContents.value.push({
      id: `WORK-VERSION-${Date.now()}`,
      type: 'simulated_track',
      label: `数据产品引用刷新：${previous} → ${latestProductVersion.value}`,
      isHypothesis: false,
      createdBy: '当前用户',
      basis: `数据产品已更新至 ${latestProductVersion.value}（原引用 ${previous}）`,
      payload: { previous, current: latestProductVersion.value },
      createdAt: activeScene.value.updatedAt
    })
    dismissedVersionPrompt.value = true
    if (!USE_MOCK) void persistScene()
  }

  function dismissProductVersionPrompt() {
    dismissedVersionPrompt.value = true
    try {
      localStorage.setItem('gsa.versionPromptDismissed', latestProductVersion.value)
    } catch {
      /* 忽略 */
    }
  }

  function addConstructedWorkItem(work: WorkContent, target: SituationTarget) {
    workContents.value.push(work)
    const workTier = contentLayers.value.find((l) => l.id === 'LAYER-WORK')
    if (workTier) {
      workTier.visible = true
      workTier.expanded = true
      if (!workTier.children) workTier.children = []
      const exists = workTier.children.some((c) => c.workItemId === target.id)
      if (!exists) {
        workTier.children.push({
          id: `WORK-NODE-${target.id}`,
          name: `【构建】${target.codeName}`,
          workItemId: target.id,
          nodeType: 'work_item',
          visible: true,
          color: '#b37feb'
        })
      }
    }

    const pkg = thematicPackages.value.find((p) => p.theater === 'taiwan') || thematicPackages.value[0]
    if (pkg) {
      pkg.visible = true
      if (!pkg.workItems) pkg.workItems = []
      if (!pkg.workItems.some((w) => w.id === target.id)) {
        pkg.workItems.push({
          id: target.id,
          name: `【构建】${target.codeName}`,
          color: '#b37feb',
          visible: true
        })
      }
      pkg.workItemsVisible = true
      pkg.workItemsExpanded = true
    }
    schedulePersistVisibility()
  }

  /** 标绘 / 标注等工作内容入库（含工作图层树节点），显隐由 workItemId 控制 */
  function addPlotWorkItem(work: WorkContent) {
    workContents.value.push(work)
    const workTier = contentLayers.value.find((l) => l.id === 'LAYER-WORK')
    if (workTier) {
      workTier.visible = true
      workTier.expanded = true
      if (!workTier.children) workTier.children = []
      workTier.children.push({
        id: `WORK-NODE-${work.id}`,
        name: work.label,
        workItemId: work.id,
        nodeType: 'work_item',
        visible: true,
        color: work.type === 'annotation' ? '#faad14' : '#ff4d4f'
      })
    }
    schedulePersistVisibility()
  }

  /** 移除标绘 / 标注工作内容（三段同删） */
  function removePlotWorkItem(id: string) {
    workContents.value = workContents.value.filter((w) => w.id !== id)
    const workTier = contentLayers.value.find((l) => l.id === 'LAYER-WORK')
    if (workTier?.children) {
      workTier.children = workTier.children.filter((c) => c.workItemId !== id)
    }
    schedulePersistVisibility()
  }

  function removeConstructedWorkItem(targetId: string) {
    workContents.value = workContents.value.filter(
      (w) => w.relatedFactTargetId !== targetId && w.id !== `WORK-${targetId}`
    )
    const workTier = contentLayers.value.find((l) => l.id === 'LAYER-WORK')
    if (workTier?.children) {
      workTier.children = workTier.children.filter((c) => c.workItemId !== targetId)
    }
    thematicPackages.value.forEach((pkg) => {
      if (pkg.workItems) {
        pkg.workItems = pkg.workItems.filter((w) => w.id !== targetId)
      }
    })
    schedulePersistVisibility()
  }

  // 视角书签
  const bookmarks = ref<CameraBookmark[]>([])

  // ===================== 【双向联动与状态同步核心方法】 =====================

  /** 切换态势研判专题包整体显隐 */
  function toggleThematicPackage(pkg: ThematicPackage) {
    const isVis = pkg.visible
    pkg.targetsVisible = isVis
    pkg.regionsVisible = isVis
    pkg.relationsVisible = isVis
    pkg.workItemsVisible = isVis

    pkg.targets.forEach((t) => {
      t.visible = isVis
      t.features.forEach((f) => (f.visible = isVis))
    })
    pkg.regions.forEach((r) => (r.visible = isVis))
    pkg.relations.forEach((rel) => (rel.visible = isVis))
    pkg.workItems?.forEach((w) => (w.visible = isVis))

    syncThematicToContentLayers(pkg)
    schedulePersistVisibility()
  }

  /** 切换专题内某个分支 (实体群/包络/战术网络/推演成果) 的显隐 */
  function toggleThematicBranch(pkg: ThematicPackage, branchType: 'targets' | 'regions' | 'relations' | 'workItems') {
    if (branchType === 'targets') {
      const isVis = !!pkg.targetsVisible
      pkg.targets.forEach((t) => {
        t.visible = isVis
        t.features.forEach((f) => (f.visible = isVis))
      })
      syncThematicToContentLayers(pkg)
    } else if (branchType === 'regions') {
      const isVis = !!pkg.regionsVisible
      pkg.regions.forEach((r) => (r.visible = isVis))
    } else if (branchType === 'relations') {
      const isVis = !!pkg.relationsVisible
      pkg.relations.forEach((rel) => (rel.visible = isVis))
    } else if (branchType === 'workItems') {
      const isVis = !!pkg.workItemsVisible
      pkg.workItems?.forEach((w) => (w.visible = isVis))
    }
    schedulePersistVisibility()
  }

  /** 将专题的显隐状态同频映射至实体资产分类树 */
  function syncThematicToContentLayers(pkg: ThematicPackage) {
    const factsTier = contentLayers.value.find((l) => l.id === 'LAYER-FACTS')
    if (factsTier && factsTier.children) {
      pkg.targets.forEach((pt) => {
        for (const cat of factsTier.children!) {
          const entity = cat.children?.find((e) => e.targetId === pt.id)
          if (entity) {
            entity.visible = pt.visible
            if (entity.children) {
              entity.children.forEach((ef) => {
                const matchedF = pt.features.find((pf) => pf.featureKey === ef.featureKey)
                if (matchedF) ef.visible = matchedF.visible
              })
            }
            cat.visible = cat.children?.some((c) => c.visible) ?? false
          }
        }
      })
      factsTier.visible = factsTier.children.some((c) => c.visible)
    }
  }

  /** 判断目标实体是否可见 */
  function isTargetVisible(targetId: string): boolean {
    const factsTier = contentLayers.value.find((l) => l.id === 'LAYER-FACTS')
    if (!factsTier || !factsTier.visible) return false

    let targetVisible = false
    const searchTarget = (nodes: LayerTreeNode[]) => {
      for (const n of nodes) {
        if (n.targetId === targetId && n.nodeType === 'entity') {
          targetVisible = n.visible
          return
        }
        if (n.children) searchTarget(n.children)
      }
    }
    searchTarget(factsTier.children || [])
    return targetVisible
  }

  /** 判断具体特性能否显示 (点位、轨迹、雷达扫描锥、战术关系连线) */
  function isFeatureVisible(targetId: string, featureKey: string): boolean {
    const factsTier = contentLayers.value.find((l) => l.id === 'LAYER-FACTS')
    if (!factsTier || !factsTier.visible) return false

    let featureVisible = false
    const searchFeature = (nodes: LayerTreeNode[]) => {
      for (const n of nodes) {
        if (n.targetId === targetId && n.featureKey === featureKey) {
          featureVisible = n.visible
          return
        }
        if (n.children) searchFeature(n.children)
      }
    }
    searchFeature(factsTier.children || [])
    return featureVisible
  }

  /** 判断战区多边形是否可见 */
  function isRegionVisible(regionId: string): boolean {
    for (const pkg of thematicPackages.value) {
      if (pkg.visible) {
        const reg = pkg.regions.find((r) => r.id === regionId)
        if (reg) return reg.visible
      }
    }
    return false
  }

  /** 判断战术关系链路是否可见 (专题树"战术对抗与协同网络"分支的开关) */
  function isRelationVisible(relationId: string): boolean {
    for (const pkg of thematicPackages.value) {
      const rel = pkg.relations.find((r) => r.id === relationId)
      if (rel) return !!pkg.visible && rel.visible
    }
    return true
  }

  /** 判断推演工作项是否可见 (实体树 LAYER-WORK 与专题树"推演成果"分支共同判定) */
  function isWorkItemVisible(workItemId: string): boolean {
    for (const pkg of thematicPackages.value) {
      const w = pkg.workItems?.find((item) => item.id === workItemId)
      if (w) return !!pkg.visible && w.visible
    }
    const workTier = contentLayers.value.find((l) => l.id === 'LAYER-WORK')
    if (!workTier || !workTier.visible) return false

    const workNode = workTier.children?.find((c) => c.workItemId === workItemId)
    return workNode ? workNode.visible : true
  }

  /** 判断气象环境是否可见 */
  function isEnvironmentVisible(envKey = 'rain_fog'): boolean {
    const envTier = contentLayers.value.find((l) => l.id === 'LAYER-ENV')
    if (!envTier || !envTier.visible) return false

    const envNode = envTier.children?.find((c) => c.envKey === envKey)
    return envNode ? envNode.visible : true
  }

  /** 显式开启某个目标的所有关联要素与父级图层 (用于智能研判联动和一键上图) */
  function showTargetAndFeatures(targetId: string) {
    const factsTier = contentLayers.value.find((l) => l.id === 'LAYER-FACTS')
    if (factsTier) {
      factsTier.visible = true
      const enableTarget = (nodes: LayerTreeNode[]) => {
        for (const n of nodes) {
          if (n.targetId === targetId) {
            n.visible = true
            if (n.children) n.children.forEach((c) => (c.visible = true))
          }
          if (n.children) {
            enableTarget(n.children)
            if (n.children.some((c) => c.visible)) n.visible = true
          }
        }
      }
      enableTarget(factsTier.children || [])
    }

    thematicPackages.value.forEach((pkg) => {
      const t = pkg.targets.find((item) => item.id === targetId)
      if (t) {
        pkg.visible = true
        pkg.targetsVisible = true
        t.visible = true
        t.features.forEach((f) => (f.visible = true))
      }
    })
  }

  /** 战区隔离精准上图：仅激活指定的目标实体列表与战区多边形列表，其余未涉及战区的实体和包络自动置为不可见 */
  function showOnlyTargetsAndFeatures(targetIds: string[], regionIds?: string[]) {
    const factsTier = contentLayers.value.find((l) => l.id === 'LAYER-FACTS')
    if (factsTier) {
      factsTier.visible = true
      const filterEntities = (nodes: LayerTreeNode[]) => {
        for (const n of nodes) {
          if (n.nodeType === 'entity' && n.targetId) {
            const isMatch = targetIds.includes(n.targetId)
            n.visible = isMatch
            if (n.children) n.children.forEach((c) => (c.visible = isMatch))
          }
          if (n.children) {
            filterEntities(n.children)
            if (n.nodeType === 'category') {
              n.visible = n.children.some((c) => c.visible)
            }
          }
        }
      }
      filterEntities(factsTier.children || [])
    }

    thematicPackages.value.forEach((pkg) => {
      let pkgHasActiveTarget = false
      pkg.targets.forEach((t) => {
        const isMatch = targetIds.includes(t.id)
        t.visible = isMatch
        t.features.forEach((f) => (f.visible = isMatch))
        if (isMatch) pkgHasActiveTarget = true
      })
      pkg.targetsVisible = pkgHasActiveTarget

      pkg.regions.forEach((r) => {
        r.visible = regionIds && regionIds.length > 0 ? regionIds.includes(r.id) : pkgHasActiveTarget
      })
      pkg.regionsVisible = pkg.regions.some((r) => r.visible)

      pkg.visible = pkgHasActiveTarget || pkg.regionsVisible
    })
  }

  /** 动态沉淀挂载新的态势研判专题成果包 (重复发布同一专题时更新而非跳过) */
  function addThematicAsset(asset: {
    id: string
    name: string
    regionId: string
    theme: string
    targetName: string
    targetId?: string
    conclusion: string
  }) {
    const pkgId = `THM-PKG-${asset.id}`
    const existing = thematicPackages.value.find((p) => p.id === pkgId)

    if (existing) {
      existing.name = `【分析成果】${asset.name}`
      existing.theme = asset.theme
      if (asset.regionId && !existing.regions.some((r) => r.id === asset.regionId)) {
        existing.regions.push({
          id: asset.regionId,
          name: `3D 异常机动徘徊管制包络体 (${asset.targetName})`,
          color: '#ff4d4f',
          visible: true
        })
        existing.regionsVisible = true
      }
      return
    }

    const targetId = asset.targetId || 'Target-001'
    const situation = useSituationStore()
    const situationTarget = situation.targets.find((t) => t.id === targetId)

    const newPkg: ThematicPackage = {
      id: pkgId,
      name: `【分析成果】${asset.name}`,
      theme: asset.theme,
      theater: 'custom',
      visible: true,
      expanded: true,
      opacity: 85,
      color: '#ff4d4f',
      centerCoords: situationTarget ? [situationTarget.longitude, situationTarget.latitude] : [123.1, 24.9],
      cameraAltitude: 550000,
      targetsExpanded: true,
      targetsVisible: true,
      regionsExpanded: true,
      regionsVisible: true,
      relationsExpanded: true,
      relationsVisible: true,
      workItemsExpanded: true,
      workItemsVisible: true,
      targets: [
        {
          id: targetId,
          name: asset.targetName,
          callsign: situationTarget?.callsign || '',
          color: '#ff4d4f',
          visible: true,
          expanded: false,
          features: [
            { id: `F-${targetId}-POS`, name: '目标实体点位', featureKey: 'position', visible: true },
            { id: `F-${targetId}-TRACK`, name: '异常机动轨迹航线', featureKey: 'track', visible: true },
            { id: `F-${targetId}-RADAR`, name: '相控阵雷达扫描锥', featureKey: 'radar', visible: true }
          ]
        }
      ],
      regions: [
        {
          id: asset.regionId,
          name: `3D 异常机动徘徊管制包络体 (${asset.targetName})`,
          color: '#ff4d4f',
          visible: true
        }
      ],
      relations: [],
      workItems: [
        {
          id: 'SIM-HYPO-001',
          name: '【推演假设】低空超音速突防航线假说',
          color: '#b37feb',
          visible: true
        }
      ]
    }
    thematicPackages.value.unshift(newPkg)
  }

  /** 导入场景文件：登记为固定版本归档场景（结构与引用校验由调用方完成） */
  function importScene(scene: SituationalScene) {
    const archived: SituationalScene = { ...scene, referenceMode: 'fixed_version', isArchive: true }
    sceneList.value.unshift(archived)
    return archived
  }

  /** 复制派生：按保留选项生成新场景，不改变原场景与被引用的融合资产（方案 3.3/5.3.1） */
  function duplicateScene(
    sourceId: string,
    options: { name: string; keepWorkContents: boolean; keepViewAndLayers: boolean }
  ): SituationalScene | null {
    const src =
      sceneList.value.find((s) => s.id === sourceId) ||
      (activeScene.value.id === sourceId ? activeScene.value : null)
    if (!src) return null
    const now = new Date().toLocaleString()
    const copy: SituationalScene = {
      ...src,
      id: `SCENE-COPY-${Date.now()}`,
      name: options.name,
      referenceMode: 'fixed_version',
      workContents: options.keepWorkContents ? JSON.parse(JSON.stringify(src.workContents || [])) : [],
      cameraView: options.keepViewAndLayers ? JSON.parse(JSON.stringify(src.cameraView)) : src.cameraView,
      visibleLayerIds: [...(src.visibleLayerIds || [])],
      focusedTargetIds: options.keepViewAndLayers ? [...(src.focusedTargetIds || [])] : [],
      createdAt: now,
      updatedAt: now,
      isArchive: false
    }
    sceneList.value.unshift(copy)
    return copy
  }

  /** 一键清空三维地球上的全部态势图层与要素 (除基础底图外) */
  function hideAllSituationLayers() {
    contentLayers.value.forEach((layer) => {
      if (layer.id !== 'LAYER-BASE') {
        layer.visible = false
        const setAllInvisible = (nodes: LayerTreeNode[]) => {
          nodes.forEach((n) => {
            n.visible = false
            if (n.children) setAllInvisible(n.children)
          })
        }
        if (layer.children) setAllInvisible(layer.children)
      }
    })

    thematicPackages.value.forEach((pkg) => {
      pkg.visible = false
      pkg.targetsVisible = false
      pkg.regionsVisible = false
      pkg.relationsVisible = false
      pkg.workItemsVisible = false
      pkg.targets.forEach((t) => {
        t.visible = false
        t.features.forEach((f) => (f.visible = false))
      })
      pkg.regions.forEach((r) => (r.visible = false))
      pkg.relations.forEach((rel) => (rel.visible = false))
      pkg.workItems?.forEach((w) => (w.visible = false))
    })
    schedulePersistVisibility()
  }

  /** 一键恢复所有态势图层与要素 */
  function showAllSituationLayers() {
    contentLayers.value.forEach((layer) => {
      layer.visible = true
      const setAllVisible = (nodes: LayerTreeNode[]) => {
        nodes.forEach((n) => {
          n.visible = true
          if (n.children) setAllVisible(n.children)
        })
      }
      if (layer.children) setAllVisible(layer.children)
    })

    thematicPackages.value.forEach((pkg) => {
      pkg.visible = true
      pkg.targetsVisible = true
      pkg.regionsVisible = true
      pkg.relationsVisible = true
      pkg.workItemsVisible = true
      pkg.targets.forEach((t) => {
        t.visible = true
        t.features.forEach((f) => (f.visible = true))
      })
      pkg.regions.forEach((r) => (r.visible = true))
      pkg.relations.forEach((rel) => (rel.visible = true))
      pkg.workItems?.forEach((w) => (w.visible = true))
    })
    schedulePersistVisibility()
  }

  function applyMock() {
    thematicPackages.value = cloneMock(MOCK_THEMATIC_PACKAGES)
    contentLayers.value = cloneMock(MOCK_CONTENT_LAYERS)
    workContents.value = cloneMock(MOCK_WORK_CONTENTS)
    bookmarks.value = cloneMock(MOCK_BOOKMARKS)
    activeScene.value = cloneMock(MOCK_DEFAULT_SCENE)
    sceneList.value = cloneMock(MOCK_SCENE_LIST)
  }

  let persistTimer: ReturnType<typeof setTimeout> | null = null
  function schedulePersistVisibility() {
    if (USE_MOCK) return
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      void persistLayers()
      void persistPackages()
    }, 400)
  }

  async function loadFromApi(sceneId = 'SCENE-DEFAULT-01') {
    if (USE_MOCK) {
      applyMock()
      return
    }
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

  return {
    activeTreeTab,
    thematicPackages,
    contentLayers,
    workContents,
    activeScene,
    sceneList,
    bookmarks,
    isTargetVisible,
    isFeatureVisible,
    isRegionVisible,
    isRelationVisible,
    isWorkItemVisible,
    isEnvironmentVisible,
    toggleThematicPackage,
    toggleThematicBranch,
    syncThematicToContentLayers,
    showTargetAndFeatures,
    showOnlyTargetsAndFeatures,
    addThematicAsset,
    addPlotWorkItem,
    removePlotWorkItem,
    importScene,
    duplicateScene,
    hideAllSituationLayers,
    showAllSituationLayers,
    toggleReferenceMode,
    loadFromApi,
    persistLayers,
    persistPackages,
    persistScene,
    persistVisibility: schedulePersistVisibility,
    applyMock,
    latestProductVersion,
    hasProductVersionUpdate,
    confirmProductVersionRefresh,
    dismissProductVersionPrompt,
    addConstructedWorkItem,
    removeConstructedWorkItem
  }
})
