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
import { cesiumController, type BasemapType } from '@/utils/cesiumHelper'
import { useSituationStore } from '@/stores/situationStore'
import { useSceneStore } from '@/stores/sceneStore'
import { useAgentStore } from '@/stores/agentStore'
import type { SituationTarget } from '@/types/situation'
import TargetFloatingPopup from '@/components/cesium/TargetFloatingPopup.vue'

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
function extractTargetIdFromPosition(position: Cesium.Cartesian2, scene: Cesium.Scene): string | null {
  if (!position || !scene) return null

  // 使用 drillPick 穿透透明层（如雷达覆盖球），检查射线下方是否存在目标核心实体
  const pickedObjects = scene.drillPick(position, 10)
  if (pickedObjects && pickedObjects.length > 0) {
    for (const picked of pickedObjects) {
      if (!picked || !picked.id) continue

      let rawId = ''
      if (typeof picked.id === 'string') {
        rawId = picked.id
      } else if (picked.id.id && typeof picked.id.id === 'string') {
        rawId = picked.id.id
      }

      if (!rawId) continue

      // 严格白名单：仅当命中目标本体实体 ID (Target-001, Target-ME-001 等) 时才判定为点击目标
      if (situationStore.targets.some((t) => t.id === rawId)) {
        return rawId
      }
    }
  }

  return null
}

function updateCesiumScene() {
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
  cesiumController.renderFutureTracks(
    situationStore.targets,
    situationStore.showFutureTracks
  )
  cesiumController.renderFutureBranches(
    situationStore.targets,
    situationStore.showFutureBranches,
    situationStore.selectedFutureBranchId
  )
  cesiumController.renderTemporalSlices(
    situationStore.targets,
    situationStore.showTemporalSlices
  )
}

onMounted(() => {
  const viewer = cesiumController.init('cesiumContainer')

  // 彻底移除 Cesium 原生双击追踪倾斜下沉行为 (杜绝双击导致地球视角沉底)
  if (viewer.cesiumWidget && viewer.cesiumWidget.screenSpaceEventHandler) {
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
  }

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

  // 单击：仅在鼠标精准点击到目标实体图标时切换打开/关闭悬浮标牌 (点击空白海面/雷达阴影区域完全穿透，零误弹)
  handler.setInputAction((movement: any) => {
    const targetId = extractTargetIdFromPosition(movement.position, viewer.scene)
    if (targetId) {
      situationStore.toggleTargetPopup(targetId)
      emit('select-target', targetId)
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  // 双击：仅在鼠标精准双击目标实体图标时，以严格正俯瞰垂直视角 (Pitch: -89.9°, Heading: 0) 平滑聚焦目标
  handler.setInputAction((movement: any) => {
    const targetId = extractTargetIdFromPosition(movement.position, viewer.scene)
    if (targetId) {
      const t = situationStore.targets.find((item) => item.id === targetId)
      if (t) {
        situationStore.openTargetPopup(targetId)
        cesiumController.focusTarget(t, 650000)
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

  updateCesiumScene()
})

watch(
  () => [
    situationStore.targets,
    situationStore.selectedTargetId,
    situationStore.openedPopupTargetIds,
    situationStore.relations,
    situationStore.regions,
    situationStore.environment,
    situationStore.showWeatherEffect,
    situationStore.showFutureTracks,
    situationStore.showFutureBranches,
    situationStore.showTemporalSlices,
    situationStore.selectedFutureBranchId,
    situationStore.currentPlaybackTime,
    sceneStore.contentLayers,
    sceneStore.thematicPackages
  ],
  () => {
    updateCesiumScene()
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
