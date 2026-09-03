<template>
  <div class="cesium-viewer-wrapper">
    <!-- Cesium DOM 容器 -->
    <div id="cesiumContainer" class="cesium-container"></div>

    <!-- 实体目标三维紧贴悬浮标牌图层 (支持多目标同时打开，100%独立开闭与跟随) -->
    <TargetFloatingPopup
      v-for="targetId in situationStore.openedPopupTargetIds"
      :key="targetId"
      :target="getTargetById(targetId)"
      @close="situationStore.closeTargetPopup(targetId)"
      @open-drawer="onOpenDrawer(targetId)"
    />

    <EventDetailCard
      :event-id="situationStore.selectedEventId"
      @close="situationStore.selectedEventId = null"
      @focus-target="onFocusFromEvent"
    />

    <!-- 浮动底图切换器 (响应智能助手展开/收起平滑动态靠边避让) -->
    <div
      class="basemap-switcher tactical-panel"
      :class="{ 'agent-open': agentStore.isOpen }"
    >
      <div
        v-for="b in basemaps"
        :key="b.type"
        :class="['basemap-item', { active: currentBasemap === b.type }]"
        @click="changeBasemap(b.type)"
      >
        <span class="basemap-icon">{{ b.icon }}</span>
        <span class="basemap-label">{{ b.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as Cesium from 'cesium'
import { cesiumController, parseSliceEntityId, type BasemapType } from '@/utils/cesiumHelper'
import { useSituationStore } from '@/stores/situationStore'
import { useSceneStore } from '@/stores/sceneStore'
import { useAgentStore } from '@/stores/agentStore'
import type { SituationTarget } from '@/types/situation'
import TargetFloatingPopup from '@/components/cesium/TargetFloatingPopup.vue'
import EventDetailCard from '@/components/cesium/EventDetailCard.vue'

const emit = defineEmits(['select-target', 'open-drawer'])
const situationStore = useSituationStore()
const sceneStore = useSceneStore()
const agentStore = useAgentStore()

function getTargetById(id: string): SituationTarget | null {
  return situationStore.targets.find((t) => t.id === id) || null
}

// 默认使用遥感卫星高清影像
const currentBasemap = ref<BasemapType>('satellite')

const basemaps: Array<{ type: BasemapType; label: string; icon: string }> = [
  { type: 'satellite', label: '遥感卫星影像 (默认)', icon: '🛰️' },
  { type: 'dark', label: '深色战术底图', icon: '🌌' },
  { type: 'street', label: '电子矢量地图', icon: '🗺️' }
]

function changeBasemap(type: BasemapType) {
  currentBasemap.value = type
  cesiumController.setBasemap(type)
}

function onOpenDrawer(targetId: string) {
  emit('open-drawer', targetId)
}

/**
 * 严格精准拾取：仅当鼠标精准命中目标本体图标 (Point/Billboard) 或实体文字标牌 (Label) 时才返回 ID
 * 雷达探测球 (RADAR_CONE_*)、战术关系连线 (REL_*)、航迹线 (TRACK_*) 与战区多边形 (REG_*) 100% 穿透不触发点击
 */
/** drillPick 穿透透明层（如雷达覆盖球），返回射线下第一个实体的原始 ID */
function pickRawEntityId(position: Cesium.Cartesian2, scene: Cesium.Scene): string | null {
  if (!position || !scene) return null
  const pickedObjects = scene.drillPick(position, 10)
  for (const picked of pickedObjects || []) {
    if (!picked || !picked.id) continue
    if (typeof picked.id === 'string') return picked.id
    if (picked.id.id && typeof picked.id.id === 'string') return picked.id.id
  }
  return null
}

/**
 * 严格精准拾取：仅当鼠标精准命中目标本体图标 (Point/Billboard) 或实体文字标牌 (Label) 时才返回 ID
 * 雷达探测球 (RADAR_CONE_*)、战术关系连线 (REL_*)、航迹线 (TRACK_*) 与战区多边形 (REG_*) 100% 穿透不触发点击
 * 三态切片点位 (SLICE_*) 由单击处理中通过 parseSliceEntityId 优先解析
 */
function extractTargetIdFromPosition(position: Cesium.Cartesian2, scene: Cesium.Scene): string | null {
  const rawId = pickRawEntityId(position, scene)
  if (!rawId) return null

  const eventId = cesiumController.extractEventId(rawId)
  if (eventId) return `EVENT:${eventId}`
  const clusterId = cesiumController.extractClusterId(rawId)
  if (clusterId) return `CLUSTER:${clusterId}`

  // 严格白名单：仅当命中目标本体实体 ID (Target-001, Target-ME-001 等) 时才判定为点击目标
  if (situationStore.targets.some((t) => t.id === rawId)) {
    return rawId
  }

  return null
}

function updateCesiumScene(mode: 'full' | 'positions' = 'full') {
  if (mode === 'positions') {
    cesiumController.updateTargetPositions(situationStore.targets)
    return
  }
  cesiumController.applyTargetClustering(situationStore.targets)
  cesiumController.renderTargets(
    situationStore.targets,
    situationStore.selectedTargetId || undefined
  )
  cesiumController.renderRelations(
    situationStore.relations,
    situationStore.targets
  )
  cesiumController.renderRegions(
    situationStore.regions
  )
  cesiumController.renderEnvironment(
    situationStore.environment
  )
  cesiumController.renderEvents(
    situationStore.events,
    situationStore.targets,
    situationStore.selectedEventId
  )
  // 已入库的标绘与标注工作内容
  cesiumController.renderPlots(sceneStore.workContents)
  // 三态切片图层：三个时间切面独立显隐，时间轴当前相位切片点亮
  cesiumController.renderTemporalSlices(situationStore.targets, {
    visible: situationStore.showTemporalSlices,
    layers: { ...situationStore.sliceLayers },
    activeSliceKey: situationStore.activeSliceKey,
    activePhase: situationStore.currentTemporalPhase
  })
  // 三态模式下隐藏未来光轨与未来分支，避免三种"未来"语义叠画
  cesiumController.renderFutureTracks(
    situationStore.targets,
    situationStore.showFutureTracks && !situationStore.showTemporalSlices
  )
  cesiumController.renderFutureBranches(
    situationStore.targets,
    situationStore.showFutureBranches && !situationStore.showTemporalSlices,
    situationStore.selectedFutureBranchId
  )
}

onMounted(() => {
  const viewer = cesiumController.init('cesiumContainer')

  // 彻底移除 Cesium 原生双击追踪倾斜下沉行为 (杜绝双击导致地球视角沉底)
  if (viewer.cesiumWidget && viewer.cesiumWidget.screenSpaceEventHandler) {
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
  }

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

  // 单击：优先命中三态切片点 (选中切片+时间轴联动+斜视飞行)，其次命中目标本体图标时切换悬浮标牌
  // (点击空白海面/雷达阴影区域完全穿透，零误弹)
  handler.setInputAction((movement: any) => {
    if (situationStore.pickBlocked || cesiumController.interactionMode !== 'idle') return
    const rawId = pickRawEntityId(movement.position, viewer.scene)
    if (!rawId) return

    const eventId = cesiumController.extractEventId(rawId)
    if (eventId) {
      situationStore.selectedEventId = eventId
      return
    }
    const clusterId = cesiumController.extractClusterId(rawId)
    if (clusterId) {
      cesiumController.zoomIntoCluster(clusterId, situationStore.targets)
      return
    }

    const sliceInfo = parseSliceEntityId(rawId)
    if (sliceInfo) {
      const target = situationStore.targets.find((t) => t.id === sliceInfo.targetId)
      const slice = target?.temporalSlices?.[sliceInfo.index]
      if (target && slice) {
        situationStore.selectTemporalSlice(sliceInfo.targetId, sliceInfo.index)
        situationStore.seekTime(situationStore.getSliceFullTime(slice))
        cesiumController.flyToLocation(slice.longitude, slice.latitude, 450000, 0, -45)
      }
      return
    }

    if (situationStore.targets.some((t) => t.id === rawId)) {
      situationStore.toggleTargetPopup(rawId)
      emit('select-target', rawId)
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  // 双击：仅在鼠标精准双击目标实体图标时，以严格正俯瞰垂直视角 (Pitch: -89.9°, Heading: 0) 平滑聚焦目标
  handler.setInputAction((movement: any) => {
    if (situationStore.pickBlocked || cesiumController.interactionMode !== 'idle') return
    const targetId = extractTargetIdFromPosition(movement.position, viewer.scene)
    if (targetId && !targetId.includes(':')) {
      const t = situationStore.targets.find((item) => item.id === targetId)
      if (t) {
        situationStore.openTargetPopup(targetId)
        cesiumController.focusTarget(t, 650000)
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

  updateCesiumScene()
  let cameraTimer: number | null = null
  viewer.camera.changed.addEventListener(() => {
    if (cameraTimer) window.clearTimeout(cameraTimer)
    cameraTimer = window.setTimeout(() => updateCesiumScene('full'), 180)
  })
})

function onFocusFromEvent(targetId: string) {
  const target = situationStore.targets.find((t) => t.id === targetId)
  if (!target) return
  sceneStore.showTargetAndFeatures(targetId)
  situationStore.openTargetPopup(targetId)
  cesiumController.focusTarget(target, 650000)
}

watch(
  () => situationStore.currentPlaybackTime,
  () => updateCesiumScene('positions')
)

watch(
  () => [
    situationStore.targets,
    situationStore.selectedTargetId,
    situationStore.openedPopupTargetIds,
    situationStore.selectedEventId,
    situationStore.relations,
    situationStore.regions,
    situationStore.environment,
    situationStore.showWeatherEffect,
    situationStore.showTemporalSlices,
    situationStore.showFutureBranches,
    situationStore.showFutureTracks,
    situationStore.sliceLayers,
    situationStore.activeSliceKey,
    situationStore.selectedFutureBranchId,
    situationStore.highlightedTargetIds,
    situationStore.dimNonHighlighted,
    sceneStore.contentLayers,
    sceneStore.workContents,
    sceneStore.thematicPackages
  ],
  () => {
    updateCesiumScene('full')
  },
  { deep: true }
)

onUnmounted(() => {
  cesiumController.destroy()
})
</script>

<style scoped lang="scss">
.cesium-viewer-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .cesium-container {
    width: 100%;
    height: 100%;
  }

  .basemap-switcher {
    position: absolute;
    bottom: 96px;
    right: 16px;
    display: flex;
    gap: 6px;
    padding: 6px 10px;
    z-index: 10;
    transition: right 0.3s cubic-bezier(0.25, 1, 0.5, 1);

    &.agent-open {
      right: calc(clamp(340px, 25vw, 440px) + 26px);
    }

    .basemap-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      font-size: 12px;
      color: #bad3f2;
      cursor: pointer;
      border-radius: 3px;
      border: 1px solid transparent;
      transition: all 0.2s;

      &:hover {
        background: rgba(0, 210, 255, 0.15);
        color: #00d2ff;
      }

      &.active {
        background: rgba(0, 210, 255, 0.25);
        color: #00d2ff;
        border-color: rgba(0, 210, 255, 0.6);
        font-weight: 600;
      }
    }
  }
}
</style>
