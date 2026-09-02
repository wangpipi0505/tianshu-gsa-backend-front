<template>
  <el-drawer
    v-model="visible"
    title="态势图层与要素控制管理"
    :size="drawerSize"
    direction="ltr"
    class="tactical-layer-drawer"
  >
    <div class="layer-tree-container">
      <!-- 顶级双视角分段切换器 -->
      <div class="view-tab-switcher">
        <el-radio-group v-model="sceneStore.activeTreeTab" size="small" class="custom-radio-tabs">
          <el-radio-button value="thematic">
            <span class="tab-label">🎯 态势研判专题</span>
          </el-radio-button>
          <el-radio-button value="entity">
            <span class="tab-label">🌐 实体资产分类</span>
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- ================= 视角 1：态势研判专题（复合任务包树形结构） ================= -->
      <div v-if="sceneStore.activeTreeTab === 'thematic'" class="thematic-view-panel">
        <div class="tree-header-tips">
          <el-icon class="text-cyan"><InfoFilled /></el-icon>
          <span>按战区与作战课题组织，多层级树状展开作战实体群、3D管制包络、雷达探测锥与战术关系网络。</span>
        </div>

        <div
          v-for="pkg in sceneStore.thematicPackages"
          :key="pkg.id"
          class="thematic-pkg-card tactical-panel"
        >
          <!-- 专题一级标题行 -->
          <div class="node-row pkg-header-row">
            <div class="node-left">
              <span class="expand-icon" @click="pkg.expanded = !pkg.expanded">
                <el-icon :class="{ rotated: pkg.expanded }"><ArrowRight /></el-icon>
              </span>
              <el-checkbox
                v-model="pkg.visible"
                @change="onThematicPkgCheck(pkg)"
              />
              <span class="node-title pkg-title-text" :style="{ color: pkg.color }">{{ pkg.name }}</span>
            </div>

            <div class="pkg-actions-right">
              <el-button
                size="small"
                type="primary"
                plain
                class="focus-btn"
                @click="focusThematicPkg(pkg)"
                title="三维地球平滑飞往该战区最佳俯瞰视窗"
              >
                <el-icon><Aim /></el-icon>
                <span>战区聚焦</span>
              </el-button>
            </div>
          </div>

          <!-- 专题透明度调节 (透明度渲染管线规划中，暂为占位) -->
          <div v-if="pkg.visible" class="tier-opacity-slider">
            <span class="label">专题透明度</span>
            <el-slider
              v-model="pkg.opacity"
              :min="10"
              :max="100"
              :show-tooltip="false"
              size="small"
              disabled
            />
            <span class="val">{{ pkg.opacity }}%</span>
            <el-tag size="small" type="info" class="planned-tag">规划中</el-tag>
          </div>

          <!-- 专题二级全要素树形分支 -->
          <div v-if="pkg.visible && pkg.expanded" class="tree-children-container">
            <!-- 分支 1：🎯 作战实体群 -->
            <div class="tree-branch-node">
              <div class="node-row branch-header-row">
                <div class="node-left">
                  <span class="expand-icon" @click="pkg.targetsExpanded = !pkg.targetsExpanded">
                    <el-icon :class="{ rotated: pkg.targetsExpanded }"><ArrowRight /></el-icon>
                  </span>
                  <el-checkbox
                    v-model="pkg.targetsVisible"
                    @change="sceneStore.toggleThematicBranch(pkg, 'targets')"
                  />
                  <span class="node-title branch-title-text text-cyan">
                    🎯 作战实体群
                  </span>
                </div>
                <div class="node-right">
                  <el-tag size="small" type="info" class="entity-count-badge">
                    {{ pkg.targets.length }} 目标
                  </el-tag>
                </div>
              </div>

              <!-- 三级实体节点列表 -->
              <div v-if="pkg.targetsVisible && pkg.targetsExpanded" class="tree-sub-children">
                <div
                  v-for="target in pkg.targets"
                  :key="target.id"
                  class="entity-sub-node"
                >
                  <div class="node-row entity-item-row">
                    <div class="node-left">
                      <span
                        class="expand-icon"
                        @click="target.expanded = !target.expanded"
                      >
                        <el-icon :class="{ rotated: target.expanded }"><ArrowRight /></el-icon>
                      </span>
                      <el-checkbox
                        v-model="target.visible"
                        @change="onThematicTargetCheck(pkg, target)"
                      />
                      <span class="node-title target-name" :style="{ color: target.color }">
                        {{ target.name }}
                      </span>
                    </div>
                  </div>

                  <!-- 四级特性要素 (点位、轨迹、雷达锥、关系) -->
                  <div v-if="target.visible && target.expanded" class="tree-sub-children feature-sub-tree">
                    <div
                      v-for="feat in target.features"
                      :key="feat.id"
                      class="node-row feature-item-row"
                    >
                      <div class="node-left">
                        <el-checkbox
                          v-model="feat.visible"
                          size="small"
                          @change="onThematicFeatureCheck(pkg, target)"
                        />
                        <span class="feat-icon">{{ getFeatureIcon(feat.featureKey) }}</span>
                        <span class="node-title feat-name">{{ feat.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分支 2：🛡️ 战区管制与防空包络 -->
            <div class="tree-branch-node">
              <div class="node-row branch-header-row">
                <div class="node-left">
                  <span class="expand-icon" @click="pkg.regionsExpanded = !pkg.regionsExpanded">
                    <el-icon :class="{ rotated: pkg.regionsExpanded }"><ArrowRight /></el-icon>
                  </span>
                  <el-checkbox
                    v-model="pkg.regionsVisible"
                    @change="sceneStore.toggleThematicBranch(pkg, 'regions')"
                  />
                  <span class="node-title branch-title-text text-amber">
                    🛡️ 战区管制与防空包络
                  </span>
                </div>
                <div class="node-right">
                  <el-tag size="small" type="info" class="entity-count-badge">
                    {{ pkg.regions.length }} 包络
                  </el-tag>
                </div>
              </div>

              <!-- 三级包络要素节点列表 -->
              <div v-if="pkg.regionsVisible && pkg.regionsExpanded" class="tree-sub-children">
                <div
                  v-for="reg in pkg.regions"
                  :key="reg.id"
                  class="node-row leaf-item-row"
                >
                  <div class="node-left">
                    <el-checkbox
                      v-model="reg.visible"
                      @change="onThematicItemCheck(pkg)"
                    />
                    <span class="region-color-indicator" :style="{ background: reg.color }"></span>
                    <span class="node-title region-name" :style="{ color: reg.color }">{{ reg.name }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分支 3：🔗 战术对抗与协同网络 -->
            <div class="tree-branch-node" v-if="pkg.relations.length > 0">
              <div class="node-row branch-header-row">
                <div class="node-left">
                  <span class="expand-icon" @click="pkg.relationsExpanded = !pkg.relationsExpanded">
                    <el-icon :class="{ rotated: pkg.relationsExpanded }"><ArrowRight /></el-icon>
                  </span>
                  <el-checkbox
                    v-model="pkg.relationsVisible"
                    @change="sceneStore.toggleThematicBranch(pkg, 'relations')"
                  />
                  <span class="node-title branch-title-text text-purple">
                    🔗 战术对抗与协同网络
                  </span>
                </div>
                <div class="node-right">
                  <el-tag size="small" type="info" class="entity-count-badge">
                    {{ pkg.relations.length }} 链路
                  </el-tag>
                </div>
              </div>

              <!-- 三级战术链路节点列表 -->
              <div v-if="pkg.relationsVisible && pkg.relationsExpanded" class="tree-sub-children">
                <div
                  v-for="rel in pkg.relations"
                  :key="rel.id"
                  class="node-row leaf-item-row"
                >
                  <div class="node-left">
                    <el-checkbox
                      v-model="rel.visible"
                      @change="onThematicItemCheck(pkg)"
                    />
                    <span class="relation-dot" :style="{ background: rel.color || '#faad14' }"></span>
                    <span class="node-title relation-name">{{ rel.name }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分支 4：🔮 专题推演与分析成果 -->
            <div class="tree-branch-node" v-if="pkg.workItems && pkg.workItems.length > 0">
              <div class="node-row branch-header-row">
                <div class="node-left">
                  <span class="expand-icon" @click="pkg.workItemsExpanded = !pkg.workItemsExpanded">
                    <el-icon :class="{ rotated: pkg.workItemsExpanded }"><ArrowRight /></el-icon>
                  </span>
                  <el-checkbox
                    v-model="pkg.workItemsVisible"
                    @change="sceneStore.toggleThematicBranch(pkg, 'workItems')"
                  />
                  <span class="node-title branch-title-text text-magenta">
                    🔮 专题推演与分析成果
                  </span>
                </div>
                <div class="node-right">
                  <el-tag size="small" type="info" class="entity-count-badge">
                    {{ pkg.workItems.length }} 项
                  </el-tag>
                </div>
              </div>

              <!-- 三级推演成果节点列表 -->
              <div v-if="pkg.workItemsVisible && pkg.workItemsExpanded" class="tree-sub-children">
                <div
                  v-for="w in pkg.workItems"
                  :key="w.id"
                  class="node-row leaf-item-row"
                >
                  <div class="node-left">
                    <el-checkbox
                      v-model="w.visible"
                      @change="onThematicItemCheck(pkg)"
                    />
                    <span class="work-icon">📐</span>
                    <span class="node-title work-name" :style="{ color: w.color }">{{ w.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= 视角 2：实体资产分类（物理装备树） ================= -->
      <div v-else class="entity-view-panel">
        <div class="tree-header-tips">
          <el-icon class="text-cyan"><InfoFilled /></el-icon>
          <span>按空中域、水面域、地面防空域与环境底图分类，支持微观细粒度点对点控制。</span>
        </div>

        <div v-for="tier in sceneStore.contentLayers" :key="tier.id" class="tier-card tactical-panel">
          <!-- 顶级图层组标题行 -->
          <div class="node-row tier-row">
            <div class="node-left">
              <span
                v-if="tier.children && tier.children.length > 0"
                class="expand-icon"
                @click="tier.expanded = !tier.expanded"
              >
                <el-icon :class="{ rotated: tier.expanded }"><ArrowRight /></el-icon>
              </span>
              <el-checkbox
                v-model="tier.visible"
                @change="onNodeCheckChange(tier)"
              />
              <span class="node-title tier-title" :style="{ color: tier.color }">{{ tier.name }}</span>
            </div>

            <div class="node-right">
              <el-tag size="small" type="info" class="entity-count-badge">
                {{ countLeaves(tier) }} 要素
              </el-tag>
            </div>
          </div>

          <!-- 顶级图层组透明度调节 (透明度渲染管线规划中，暂为占位) -->
          <div v-if="tier.visible && tier.opacity !== undefined" class="tier-opacity-slider">
            <span class="label">图层透明度</span>
            <el-slider
              v-model="tier.opacity"
              :min="10"
              :max="100"
              :show-tooltip="false"
              size="small"
              disabled
            />
            <span class="val">{{ tier.opacity }}%</span>
            <el-tag size="small" type="info" class="planned-tag">规划中</el-tag>
          </div>

          <!-- 二级分类列表 -->
          <div v-if="tier.visible && tier.expanded && tier.children" class="tree-children-container">
            <div
              v-for="cat in tier.children"
              :key="cat.id"
              class="tree-branch-node"
            >
              <div class="node-row category-row">
                <div class="node-left">
                  <span
                    v-if="cat.children && cat.children.length > 0"
                    class="expand-icon"
                    @click="cat.expanded = !cat.expanded"
                  >
                    <el-icon :class="{ rotated: cat.expanded }"><ArrowRight /></el-icon>
                  </span>
                  <el-checkbox
                    v-model="cat.visible"
                    :disabled="isPlannedNode(cat)"
                    :title="isPlannedNode(cat) ? '该图层要素的渲染管线尚未接入' : undefined"
                    @change="onNodeCheckChange(cat)"
                  />
                  <span class="node-title category-title" :style="{ color: cat.color || '#a2b7d4' }">
                    {{ cat.name }}
                  </span>
                  <el-tag v-if="isPlannedNode(cat)" size="small" type="info" class="planned-tag">规划中</el-tag>
                </div>
              </div>

              <!-- 三级作战实体列表 -->
              <div v-if="cat.visible && cat.expanded && cat.children" class="tree-sub-children">
                <div
                  v-for="entity in cat.children"
                  :key="entity.id"
                  class="entity-sub-node"
                >
                  <div class="node-row entity-row">
                    <div class="node-left">
                      <span
                        v-if="entity.children && entity.children.length > 0"
                        class="expand-icon"
                        @click="entity.expanded = !entity.expanded"
                      >
                        <el-icon :class="{ rotated: entity.expanded }"><ArrowRight /></el-icon>
                      </span>
                      <el-checkbox
                        v-model="entity.visible"
                        @change="onNodeCheckChange(entity)"
                      />
                      <span class="node-title entity-title" :style="{ color: entity.color || '#f0f6fc' }">
                        {{ entity.name }}
                      </span>
                    </div>
                  </div>

                  <!-- 四级具体特性要素列表 -->
                  <div v-if="entity.visible && entity.expanded && entity.children" class="tree-sub-children feature-sub-tree">
                    <div
                      v-for="feat in entity.children"
                      :key="feat.id"
                      class="node-row feature-row"
                    >
                      <div class="node-left">
                        <el-checkbox
                          v-model="feat.visible"
                          size="small"
                          @change="onFeatureCheckChange(entity)"
                        />
                        <span class="feat-icon">{{ getFeatureIcon(feat.featureKey) }}</span>
                        <span class="node-title feat-name">{{ feat.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSceneStore } from '@/stores/sceneStore'
import { cesiumController } from '@/utils/cesiumHelper'
import type { LayerTreeNode, ThematicPackage, ThematicTargetItem } from '@/types/scene'
import { ArrowRight, InfoFilled, Aim } from '@element-plus/icons-vue'

const visible = ref(false)
const sceneStore = useSceneStore()

const drawerSize = computed(() => {
  if (typeof window !== 'undefined' && window.innerWidth < 1440) {
    return '360px'
  }
  return '440px'
})

function getFeatureIcon(key?: string) {
  if (key === 'position') return '📍'
  if (key === 'track') return '〰️'
  if (key === 'radar') return '📡'
  if (key === 'relation') return '🔗'
  return '🔹'
}

function focusThematicPkg(pkg: ThematicPackage) {
  cesiumController.flyToCoordinates([pkg.centerCoords], pkg.cameraAltitude)
}

function onThematicPkgCheck(pkg: ThematicPackage) {
  sceneStore.toggleThematicPackage(pkg)
}

function onThematicTargetCheck(pkg: ThematicPackage, target: ThematicTargetItem) {
  target.features.forEach((f) => (f.visible = target.visible))
  pkg.targetsVisible = pkg.targets.some((t) => t.visible)
  pkg.visible =
    !!pkg.targetsVisible || !!pkg.regionsVisible || !!pkg.relationsVisible || !!pkg.workItemsVisible
  sceneStore.syncThematicToContentLayers(pkg)
  sceneStore.persistVisibility()
}

function onThematicFeatureCheck(pkg: ThematicPackage, target: ThematicTargetItem) {
  target.visible = target.features.some((f) => f.visible)
  pkg.targetsVisible = pkg.targets.some((t) => t.visible)
  pkg.visible =
    !!pkg.targetsVisible || !!pkg.regionsVisible || !!pkg.relationsVisible || !!pkg.workItemsVisible
  sceneStore.syncThematicToContentLayers(pkg)
  sceneStore.persistVisibility()
}

function onThematicItemCheck(pkg: ThematicPackage) {
  pkg.regionsVisible = pkg.regions.some((r) => r.visible)
  pkg.relationsVisible = pkg.relations.some((rel) => rel.visible)
  pkg.workItemsVisible = pkg.workItems ? pkg.workItems.some((w) => w.visible) : false
  pkg.visible =
    !!pkg.targetsVisible || !!pkg.regionsVisible || !!pkg.relationsVisible || !!pkg.workItemsVisible
  sceneStore.persistVisibility()
}

// 渲染管线尚未接入的占位图层节点（底图/海岸线/海况/潮汐），暂禁用勾选避免"假开关"
function isPlannedNode(node: LayerTreeNode): boolean {
  return ['BASE-NODE-MAP', 'BASE-NODE-BORDER', 'ENV-NODE-SEA', 'ENV-NODE-GEO'].includes(node.id)
}

function onNodeCheckChange(node: LayerTreeNode) {
  if (node.children) {
    const updateDescendants = (children: LayerTreeNode[], isVis: boolean) => {
      children.forEach((c) => {
        c.visible = isVis
        if (c.children) updateDescendants(c.children, isVis)
      })
    }
    updateDescendants(node.children, node.visible)
  }
  sceneStore.persistVisibility()
}

function onFeatureCheckChange(entityNode: LayerTreeNode) {
  if (entityNode.children) {
    entityNode.visible = entityNode.children.some((c) => c.visible)
  }
  sceneStore.persistVisibility()
}

function countLeaves(node: LayerTreeNode): number {
  if (!node.children || node.children.length === 0) return 1
  let count = 0
  const traverse = (children: LayerTreeNode[]) => {
    children.forEach((c) => {
      if (!c.children || c.children.length === 0) count++
      else traverse(c.children)
    })
  }
  traverse(node.children)
  return count
}

defineExpose({
  open: () => (visible.value = true),
  close: () => (visible.value = false),
  toggle: () => (visible.value = !visible.value)
})
</script>

<style scoped lang="scss">
.layer-tree-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 20px;
}

.view-tab-switcher {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;

  .custom-radio-tabs {
    background: rgba(14, 25, 43, 0.9);
    border: 1px solid rgba(0, 210, 255, 0.4);
    border-radius: 4px;
    padding: 2px;

    :deep(.el-radio-button__inner) {
      background: transparent;
      border: none;
      color: #bad3f2;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 16px;
      transition: all 0.25s;
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      background: rgba(0, 210, 255, 0.25);
      color: #00ffff;
      box-shadow: 0 0 10px rgba(0, 210, 255, 0.4);
      border-radius: 3px;
    }
  }
}

.tree-header-tips {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(0, 210, 255, 0.08);
  border: 1px solid rgba(0, 210, 255, 0.2);
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 11px;
  color: #bad3f2;
  line-height: 1.5;
}

/* ================= 专题与实体通用卡片样式 ================= */
.thematic-pkg-card, .tier-card {
  background: rgba(10, 18, 32, 0.85);
  border: 1px solid rgba(0, 210, 255, 0.28);
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
  transition: all 0.25s;

  &:hover {
    border-color: rgba(0, 210, 255, 0.55);
    box-shadow: 0 4px 16px rgba(0, 210, 255, 0.12);
  }
}

.tier-opacity-slider {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 6px;
  background: rgba(0, 210, 255, 0.05);
  border-radius: 4px;

  .label { font-size: 11px; color: #6e87ab; white-space: nowrap; }
  :deep(.el-slider) { flex: 1; }
  .val { font-size: 11px; color: #00d2ff; font-family: var(--font-family-mono); width: 32px; text-align: right; }
}

.planned-tag {
  flex-shrink: 0;
  opacity: 0.75;
}

.expand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  cursor: pointer;
  color: #6e87ab;
  transition: all 0.2s;

  &:hover { color: #00d2ff; }
  .rotated { transform: rotate(90deg); }
}

.node-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;

  .node-left {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    overflow: hidden;
  }

  .node-title {
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &.pkg-title-text, &.tier-title { font-weight: 700; font-size: 13px; }
    &.branch-title-text, &.category-title { font-weight: 700; font-size: 12px; }
    &.target-name, &.entity-title { font-weight: 600; font-size: 12px; }
    &.feat-name, &.leaf-item-row { font-size: 11px; color: #bad3f2; }
  }
}

.pkg-actions-right {
  .focus-btn {
    font-size: 11px;
    height: 24px;
    padding: 0 8px;
    border-radius: 12px;
  }
}

/* ================= 严格标准的树形缩进与虚线引导结构 ================= */
.tree-children-container {
  padding-left: 14px;
  border-left: 1px dashed rgba(0, 210, 255, 0.25);
  margin-left: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tree-branch-node {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 2px 0;
}

.tree-sub-children {
  padding-left: 16px;
  border-left: 1px dashed rgba(0, 210, 255, 0.2);
  margin-left: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;

  &.feature-sub-tree {
    padding-left: 16px;
    border-left: 1px dashed rgba(0, 210, 255, 0.15);
    margin-left: 8px;
  }
}

.entity-sub-node {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.region-color-indicator {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.relation-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.work-icon, .feat-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.text-cyan { color: #00d2ff !important; }
.text-amber { color: #faad14 !important; }
.text-purple { color: #b37feb !important; }
.text-magenta { color: #f759ab !important; }
</style>
