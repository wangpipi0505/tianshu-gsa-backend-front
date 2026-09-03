<template>
  <div class="main-workbench-view">
    <!-- 100% 满屏填满的三维数字地球主视窗 (绝对定位，不随任何侧边栏挤压形变) -->
    <div class="workbench-center-globe">
      <CesiumViewer
        @select-target="onTargetSelected"
        @open-drawer="onOpenDrawer"
      />

      <!-- 顶部快捷工具条与推演按钮 (响应助手展开/折叠动态靠边) -->
      <div
        class="workbench-top-bar"
        :class="{ 'agent-open': agentStore.isOpen }"
      >
        <div class="quick-action-group">
          <el-button v-if="identityStore.canDo('simulation')" type="warning" size="small" @click="onOpenSimulation">
            <el-icon><VideoPlay /></el-icon>
            <span>发起红蓝推演</span>
          </el-button>
          <el-button v-if="identityStore.canDo('fusion')" type="info" size="small" @click="candidateReviewModalRef?.open()">
            <el-icon><Connection /></el-icon>
            <span>多源关联确认 ({{ fusionStore.activeJob()?.candidates.length || 0 }})</span>
          </el-button>
        </div>

        <TacticalToolbar
          @open-layer-drawer="layerDrawerRef?.open()"
          @open-target-drawer="inspectorRef?.open(situationStore.selectedTargetId || undefined)"
          @open-export-modal="exportModalRef?.open()"
          @open-search-drawer="searchDrawerRef?.open()"
          @open-construct-form="onOpenConstruct"
          @open-watch-list="watchListRef?.open()"
        />
      </div>

      <!-- 4D 时空演变三态切片对比全景透视面板 (当开启三态对比时动态滑入) -->
      <TemporalComparisonHUD />

      <!-- 底部左侧：当前场景信息（与右下底图切换器同一行，左右分布） -->
      <div class="scene-info-anchor" :class="{ 'agent-open': agentStore.isOpen }">
        <SceneStatusStrip @open-scene-modal="sceneDrawerRef?.open()" />
      </div>

      <!-- 底部时间轴控制器 (响应助手展开/折叠动态靠边) -->
      <div
        class="workbench-bottom-timeline"
        :class="{ 'agent-open': agentStore.isOpen }"
      >
        <SituationalTimeline />
      </div>
    </div>


    <!-- 左侧：态势图层控制抽屉 (浮动抽屉形式) -->
    <ContentLayerTree ref="layerDrawerRef" />

    <!-- 右侧：目标全维特性与多tab综合研判抽屉 (仅在点击按钮时显式打开，点击目标绝不自动弹起) -->
    <TargetInspectorDrawer
      ref="inspectorRef"
      @ask-agent="onAskAgent"
    />

    <!-- 场景推演算法配置弹窗 -->
    <SimulationModal ref="simulationModalRef" />

    <!-- 场景成果导出弹窗 -->
    <ExportPackageModal ref="exportModalRef" />

    <!-- 场景档案库抽屉 -->
    <SceneManagerDrawer ref="sceneDrawerRef" />

    <!-- 多源候选关联确认弹窗 -->
    <CandidateReviewModal ref="candidateReviewModalRef" />

    <ConstructFormModal ref="constructFormRef" />
    <SpatialSearchDrawer ref="searchDrawerRef" />
    <VersionUpdateBanner />

    <!-- 关注对象集面板（浮层，由工具条/快捷入口唤起） -->
    <WatchListPanel ref="watchListRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CesiumViewer from '@/components/cesium/CesiumViewer.vue'
import ContentLayerTree from '@/components/common/ContentLayerTree.vue'
import SituationalTimeline from '@/components/common/SituationalTimeline.vue'
import TacticalToolbar from '@/components/common/TacticalToolbar.vue'
import TargetInspectorDrawer from '@/components/cesium/TargetInspectorDrawer.vue'
import TemporalComparisonHUD from '@/components/cesium/TemporalComparisonHUD.vue'
import SimulationModal from '@/components/simulation/SimulationModal.vue'
import ExportPackageModal from '@/components/scene/ExportPackageModal.vue'
import SceneManagerDrawer from '@/components/scene/SceneManagerDrawer.vue'
import CandidateReviewModal from '@/components/fusion/CandidateReviewModal.vue'
import ConstructFormModal from '@/components/scene/ConstructFormModal.vue'
import SceneStatusStrip from '@/components/workbench/SceneStatusStrip.vue'
import WatchListPanel from '@/components/common/WatchListPanel.vue'
import SpatialSearchDrawer from '@/components/search/SpatialSearchDrawer.vue'
import VersionUpdateBanner from '@/components/scene/VersionUpdateBanner.vue'
import { useSituationStore } from '@/stores/situationStore'
import { useAgentStore } from '@/stores/agentStore'
import { useFusionStore } from '@/stores/fusionStore'
import { useIdentityStore } from '@/stores/identityStore'
import { VideoPlay, Connection } from '@element-plus/icons-vue'

const situationStore = useSituationStore()
const agentStore = useAgentStore()
const fusionStore = useFusionStore()
const identityStore = useIdentityStore()

const layerDrawerRef = ref<any>(null)
const inspectorRef = ref<any>(null)
const simulationModalRef = ref<any>(null)
const exportModalRef = ref<any>(null)
const sceneDrawerRef = ref<any>(null)
const candidateReviewModalRef = ref<any>(null)
const agentPanelRef = ref<any>(null)
const constructFormRef = ref<any>(null)
const searchDrawerRef = ref<any>(null)
const watchListRef = ref<any>(null)

// 点击三维目标点时：仅更新选中态与吸附标牌，严禁自动弹起全维研判大抽屉！
function onTargetSelected(targetId: string) {
  situationStore.selectedTargetId = targetId
}

// 仅在用户显式点击【查看全维研判抽屉】或工具栏【目标研判详情】按钮时，才弹出抽屉
function onOpenDrawer(targetId?: string) {
  inspectorRef.value?.open(targetId || situationStore.selectedTargetId || undefined)
}

function onAskAgent(prompt: string) {
  agentStore.openAgent()
  agentStore.sendMessage(prompt)
}

function onOpenConstruct(payload: { lon: number; lat: number }) {
  constructFormRef.value?.open(payload.lon, payload.lat)
}

function onOpenSimulation() {
  identityStore.writeAudit('推演', '打开推演入口')
  simulationModalRef.value?.open()
}

defineExpose({
  openSceneModal: () => sceneDrawerRef.value?.open(),
  toggleAgent: () => agentStore.toggleAgent()
})
</script>

<style scoped lang="scss">
.main-workbench-view {
  position: relative;
  width: 100vw;
  height: calc(100vh - 56px);
  overflow: hidden;
  background: var(--bg-primary);

  .workbench-center-globe {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;

    .workbench-top-bar {
      position: absolute;
      top: 14px;
      left: 16px;
      right: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 15;
      pointer-events: none;
      transition: right 0.3s cubic-bezier(0.25, 1, 0.5, 1);

      &.agent-open {
        right: calc(clamp(340px, 25vw, 440px) + 26px);
      }

      .quick-action-group, .tactical-toolbar {
        pointer-events: auto;
      }

      .quick-action-group {
        display: flex;
        gap: 10px;
      }

      @media (max-width: 1440px) {
        top: 10px;
        left: 10px;
        .quick-action-group {
          gap: 6px;
        }
      }
    }

    .scene-info-anchor {
      position: absolute;
      left: 16px;
      bottom: 106px;
      z-index: 15;
    }

    .workbench-bottom-timeline {
      position: absolute;
      bottom: 14px;
      left: 16px;
      right: 16px;
      z-index: 15;
      transition: right 0.3s cubic-bezier(0.25, 1, 0.5, 1);

      &.agent-open {
        right: calc(clamp(340px, 25vw, 440px) + 26px);
      }

      @media (max-width: 1440px) {
        bottom: 10px;
        left: 10px;
      }
    }
  }
}
</style>
