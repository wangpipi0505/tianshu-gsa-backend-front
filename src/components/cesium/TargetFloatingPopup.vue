<template>
  <div
    v-if="target && isVisibleOnScreen"
    :class="['target-floating-popup', 'tactical-panel', `arrow-${arrowSide}`]"
    :style="{
      left: `${popupPos.x}px`,
      top: `${popupPos.y}px`,
      '--arrow-top': `${arrowTop}px`
    }"
    @mousedown.stop
    @mouseup.stop
    @click.stop
    @dblclick.stop
  >
    <!-- 头部：阵营与呼号与关闭按钮 -->
    <div class="popup-header">
      <div class="title-left">
        <el-tag
          size="small"
          :type="target.affiliation === 'friend' ? 'success' : target.affiliation === 'foe' ? 'danger' : 'warning'"
        >
          {{ target.affiliation === 'friend' ? '我方' : target.affiliation === 'foe' ? '敌方' : '中立' }}
        </el-tag>
        <span class="target-name">{{ target.codeName }}</span>
        <span class="callsign">({{ target.callsign }})</span>
        <el-tag size="small" type="info">{{ classificationLabel }}</el-tag>
      </div>
      <el-button size="small" circle text class="close-btn" @click.stop="close" title="关闭信息框">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>

    <!-- 装备高精度矢量蓝图图片与激光扫描特效 -->
    <div v-if="target.imageUrl" class="popup-image-box">
      <img :src="target.imageUrl" alt="装备形貌示意图" class="target-img" />
      <div class="scan-line"></div>
      <div class="img-badge">
        <span>装备形貌示意 (静态图)</span>
      </div>
    </div>

    <!-- 双Tab切换：无icon，纯文本【基本信息】与【当前状态】 -->
    <div class="tab-header-bar">
      <button
        type="button"
        :class="['tab-btn', { active: activeTab === 'basic' }]"
        @click.stop="activeTab = 'basic'"
      >
        基本信息
      </button>
      <button
        type="button"
        :class="['tab-btn', { active: activeTab === 'status' }]"
        @click.stop="activeTab = 'status'"
      >
        当前状态
      </button>
    </div>

    <!-- Tab 1: 基本信息 (当前装备的基本信息) -->
    <div v-if="activeTab === 'basic'" class="tab-body basic-tab">
      <div class="info-row">
        <span class="k">装备全称:</span>
        <span class="v highlight">{{ target.codeName }}</span>
      </div>
      <div class="info-row">
        <span class="k">装备类型:</span>
        <span class="v">{{ getTargetTypeMeta(target.type).label }}</span>
      </div>
      <div class="info-row">
        <span class="k">物理尺度:</span>
        <span class="v" v-if="target.opticalFeatures">长 {{ target.opticalFeatures.lengthMeters }}米 × 翼展 {{ target.opticalFeatures.wingspanMeters }}米</span>
        <span class="v" v-else>暂无尺度观测数据</span>
      </div>
      <div class="info-row" v-if="target.radarFeatures">
        <span class="k">雷达载荷:</span>
        <span class="v text-cyan font-mono">{{ target.radarFeatures.frequencyBand }}</span>
      </div>
      <div class="info-row" v-if="target.sensorCoverage">
        <span class="k">探测视距:</span>
        <span class="v font-mono text-cyan">最大 {{ target.sensorCoverage.radarRangeKm }} 公里 ({{ target.sensorCoverage.scanAngleDeg }}° 覆盖)</span>
      </div>
    </div>

    <!-- Tab 2: 当前状态 (基于数据的当前状态) -->
    <div v-if="activeTab === 'status'" class="tab-body status-tab">
      <!-- 实时时空遥测数据网格 -->
      <div class="telemetry-grid">
        <div class="tele-item">
          <span class="k">实时高度</span>
          <span class="v font-mono text-cyan">{{ target.altitude >= 1000 ? `${(target.altitude/1000).toFixed(1)} km` : `${target.altitude} m` }}</span>
        </div>
        <div class="tele-item">
          <span class="k">实时航速</span>
          <span class="v font-mono text-cyan">{{ target.speedKnots }} 节</span>
        </div>
        <div class="tele-item">
          <span class="k">机动航向</span>
          <span class="v font-mono">{{ target.headingDeg }}°</span>
        </div>
        <div class="tele-item">
          <span class="k">时空经纬</span>
          <span class="v font-mono">{{ target.longitude.toFixed(2) }}°E, {{ target.latitude.toFixed(2) }}°N</span>
        </div>
      </div>

      <!-- 实时战备与数据链状态 -->
      <div v-if="target.operationalStatus" class="status-fields">
        <div class="field-item">
          <span class="k">战备等级:</span>
          <span class="v text-orange font-bold">{{ target.operationalStatus.readinessLevel }}</span>
        </div>
        <div class="field-item">
          <span class="k">当前任务:</span>
          <span class="v">{{ target.operationalStatus.missionTask }}</span>
        </div>
        <div class="field-item">
          <span class="k">雷达模式:</span>
          <span class="v text-cyan">{{ target.operationalStatus.sensorMode }}</span>
        </div>
        <div class="field-item">
          <span class="k">数据链路:</span>
          <span class="v text-green font-mono">{{ target.operationalStatus.datalinkState }}</span>
        </div>
        <div class="field-item">
          <span class="k">战备健康:</span>
          <span class="v font-mono text-green">装备健康度 {{ target.operationalStatus.fuelOrHealthPercent }}%</span>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="popup-footer">
      <el-button size="small" type="primary" plain @click.stop="openDrawer">
        <el-icon><DataAnalysis /></el-icon>
        <span>查看全维研判抽屉</span>
      </el-button>
      <el-button
        v-if="target"
        size="small"
        :type="isWatched ? 'warning' : 'default'"
        @click.stop="toggleWatch"
      >
        {{ isWatched ? '已关注' : '加入关注' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as Cesium from 'cesium'
import type { SituationTarget } from '@/types/situation'
import { cesiumController } from '@/utils/cesiumHelper'
import { getTargetTypeMeta } from '@/utils/formatters'
import { useAgentStore } from '@/stores/agentStore'
import { useSituationStore } from '@/stores/situationStore'
import { Close, DataAnalysis } from '@element-plus/icons-vue'

// Cesium 运行时存在 EllipsoidalOccluder，但官方类型声明缺失，这里做最小类型化
interface EllipsoidalOccluderLike {
  isPointVisible(point: Cesium.Cartesian3): boolean
}
const EllipsoidalOccluderImpl = (Cesium as unknown as {
  EllipsoidalOccluder: new (ellipsoid: Cesium.Ellipsoid, position: Cesium.Cartesian3) => EllipsoidalOccluderLike
}).EllipsoidalOccluder

const props = defineProps<{
  target: SituationTarget | null
}>()

const emit = defineEmits(['close', 'open-drawer'])

const agentStore = useAgentStore()
const situationStore = useSituationStore()
const CLASSIFICATION_LABEL: Record<string, string> = {
  internal: '内部',
  confidential: '秘密',
  secret: '机密',
  top_secret: '绝密'
}
const classificationLabel = computed(() => CLASSIFICATION_LABEL[props.target?.classification || 'internal'] || '内部')
const isWatched = computed(() => !!props.target && situationStore.watchedTargetIds.includes(props.target.id))

function toggleWatch() {
  if (props.target) situationStore.toggleWatchTarget(props.target.id)
}

const activeTab = ref<'basic' | 'status'>('basic')
const screenPos = ref<{ x: number; y: number }>({ x: 500, y: 350 })
const isVisibleOnScreen = ref<boolean>(true)

let animFrameId: number | null = null

// 紧密附着在目标点旁边（随地球平移、旋转、缩放实时无延迟吸附）
const popupPos = computed(() => {
  const popupWidth = 330
  const popupHeight = 320
  const agentPanelWidth = Math.min(440, Math.max(340, window.innerWidth * 0.25))
  // 助手收起时标牌可利用全屏宽度
  const rightLimit = agentStore.isOpen ? window.innerWidth - agentPanelWidth - 20 : window.innerWidth - 20

  let x = screenPos.value.x + 18
  if (x + popupWidth > rightLimit) {
    x = screenPos.value.x - popupWidth - 18
  }
  x = Math.max(10, Math.min(rightLimit - popupWidth - 5, x))

  let y = screenPos.value.y - 85
  y = Math.max(65, Math.min(window.innerHeight - popupHeight - 75, y))

  return { x, y }
})

// 判断指示小箭头应该在信息框的左侧还是右侧 (若目标在信息框右侧，箭头位于信息框右边框指向目标；反之亦然)
const arrowSide = computed<'left' | 'right'>(() => {
  return screenPos.value.x >= popupPos.value.x + 165 ? 'right' : 'left'
})

// 动态计算小箭头的垂直吸附位置 (使其精准对准目标实体点位)
const arrowTop = computed(() => {
  const relY = screenPos.value.y - popupPos.value.y
  return Math.max(25, Math.min(270, relY))
})

function updateScreenPosition() {
  if (!props.target || !cesiumController.viewer || cesiumController.viewer.isDestroyed()) {
    return
  }

  const viewer = cesiumController.viewer
  const cartesian = Cesium.Cartesian3.fromDegrees(
    props.target.longitude,
    props.target.latitude,
    props.target.altitude
  )

  // 严格使用 Cesium 标准 API: worldToWindowCoordinates
  const canvasPos = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, cartesian)
  if (canvasPos && typeof canvasPos.x === 'number' && !isNaN(canvasPos.x)) {
    screenPos.value = { x: canvasPos.x, y: canvasPos.y }

    // 检查是否被地球背面遮挡
    if (viewer.scene.globe && viewer.scene.globe.ellipsoid) {
      const occluder = new EllipsoidalOccluderImpl(viewer.scene.globe.ellipsoid, viewer.camera.positionWC)
      isVisibleOnScreen.value = occluder.isPointVisible(cartesian)
    } else {
      isVisibleOnScreen.value = true
    }
  }
}

/** rAF 自持跟踪循环：路由切回工作台时本组件先于 Cesium 视窗初始化挂载，
 *  必须在视窗就绪后仍持续逐帧吸附目标，否则标牌会停留在初始屏幕位置不漂移 */
function trackingLoop() {
  updateScreenPosition()
  animFrameId = requestAnimationFrame(trackingLoop)
}

onMounted(() => {
  updateScreenPosition()
  trackingLoop()
})

watch(
  () => [props.target?.id, props.target?.longitude, props.target?.latitude],
  () => {
    updateScreenPosition()
  }
)

onUnmounted(() => {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
})

function close() {
  emit('close')
}

function openDrawer() {
  emit('open-drawer')
}
</script>

<style scoped lang="scss">
.target-floating-popup {
  position: absolute;
  width: 330px;
  background: rgba(8, 16, 30, 0.96);
  border: 1px solid rgba(0, 210, 255, 0.65);
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.85), 0 0 24px rgba(0, 210, 255, 0.35);
  border-radius: 6px;
  z-index: 50;
  pointer-events: auto !important;
  user-select: none;
  backdrop-filter: blur(12px);

  &.arrow-left::before {
    content: '';
    position: absolute;
    top: var(--arrow-top, 90px);
    left: -8px;
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 8px solid rgba(0, 210, 255, 0.95);
    filter: drop-shadow(-2px 0 4px rgba(0, 210, 255, 0.6));
  }

  &.arrow-right::before {
    content: '';
    position: absolute;
    top: var(--arrow-top, 90px);
    right: -8px;
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 8px solid rgba(0, 210, 255, 0.95);
    filter: drop-shadow(2px 0 4px rgba(0, 210, 255, 0.6));
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 210, 255, 0.35);
  background: rgba(14, 25, 43, 0.95);

  .title-left {
    display: flex;
    align-items: center;
    gap: 6px;
    .target-name {
      font-size: 13px;
      font-weight: 700;
      color: #00d2ff;
    }
    .callsign {
      font-size: 11px;
      color: #8cadd4;
      font-family: var(--font-family-mono);
    }
  }

  .close-btn {
    color: #8cadd4;
    cursor: pointer;
    &:hover { color: #ff4d4f; }
  }
}

.popup-image-box {
  position: relative;
  width: 100%;
  height: 125px;
  overflow: hidden;
  background: #040811;

  .target-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .scan-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00d2ff, transparent);
    box-shadow: 0 0 10px #00d2ff;
    animation: scanAnimation 2.4s linear infinite;
  }

  .img-badge {
    position: absolute;
    bottom: 6px;
    right: 8px;
    background: rgba(0, 0, 0, 0.85);
    border: 1px solid rgba(82, 196, 26, 0.7);
    color: #52c41a;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: var(--font-family-mono);
  }
}

@keyframes scanAnimation {
  0% { top: 0%; }
  50% { top: 100%; }
  100% { top: 0%; }
}

/* 纯文本无图标 Tab 切换栏 */
.tab-header-bar {
  display: flex;
  border-bottom: 1px solid rgba(0, 210, 255, 0.25);
  background: rgba(10, 18, 32, 0.95);

  .tab-btn {
    flex: 1;
    text-align: center;
    padding: 8px 0;
    font-size: 13px;
    color: #8cadd4;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    outline: none;

    &:hover {
      color: #00d2ff;
      background: rgba(0, 210, 255, 0.08);
    }

    &.active {
      color: #00d2ff;
      font-weight: 700;
      border-bottom-color: #00d2ff;
      background: rgba(0, 210, 255, 0.15);
    }
  }
}

.tab-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  min-height: 130px;

  .info-row {
    display: flex;
    gap: 6px;
    line-height: 1.4;
    .k { color: #6e87ab; width: 62px; flex-shrink: 0; }
    .v { color: #bad3f2; flex: 1; }
    .highlight { color: #00d2ff; font-weight: 600; }
  }

  .telemetry-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    background: rgba(14, 25, 43, 0.85);
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid rgba(0, 210, 255, 0.2);

    .tele-item {
      display: flex;
      flex-direction: column;
      .k { font-size: 10px; color: #6e87ab; }
      .v { font-size: 12px; font-weight: 700; }
    }
  }

  .status-fields {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 4px;

    .field-item {
      display: flex;
      gap: 6px;
      line-height: 1.35;
      font-size: 11px;
      .k { color: #6e87ab; width: 56px; flex-shrink: 0; }
      .v { color: #d8e6f8; }
      .text-orange { color: #faad14; }
      .text-green { color: #52c41a; }
      .font-bold { font-weight: 700; }
    }
  }
}

.popup-footer {
  padding: 6px 12px 8px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid rgba(0, 210, 255, 0.25);
}
</style>
