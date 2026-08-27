<template>
  <el-drawer
    v-model="visible"
    title="态势场景工作空间管理"
    size="520px"
    direction="rtl"
  >
    <div class="scene-manager-body">
      <div class="scene-header-intro">
        态势场景是完整研判活动的工作容器，保存态势要素、工作内容与时空上下文：
      </div>

      <!-- 当前场景属性 -->
      <div class="active-scene-card tactical-panel">
        <div class="card-header">
          <span class="name">{{ sceneStore.activeScene.name }}</span>
          <el-tag size="small" type="success">当前激活</el-tag>
        </div>
        <div class="props-list">
          <div><span class="k">业务主题:</span> <span class="v">{{ sceneStore.activeScene.theme }}</span></div>
          <div><span class="k">关联数据产品:</span> <span class="v text-cyan">{{ sceneStore.activeScene.productVersionId }}</span></div>
          <div><span class="k">版本策略:</span> <span class="v">{{ sceneStore.activeScene.referenceMode === 'follow_latest' ? '跟随最新版本 (自动提醒刷新)' : '固定版本快照 (可复现)' }}</span></div>
        </div>

        <div class="card-actions">
          <el-button size="small" @click="sceneStore.toggleReferenceMode">
            切换为: {{ sceneStore.activeScene.referenceMode === 'follow_latest' ? '固定版本模式' : '跟随最新模式' }}
          </el-button>
        </div>
      </div>

      <!-- 场景列表 -->
      <div class="section-title" style="margin-top: 16px">历史场景档案库</div>
      <div v-for="s in sceneStore.sceneList" :key="s.id" class="scene-item-card tactical-panel">
        <div class="s-head">
          <span class="s-name">{{ s.name }}</span>
          <span :class="['mode-tag', s.referenceMode]">
            {{ s.referenceMode === 'follow_latest' ? '跟随最新' : '固定快照' }}
          </span>
        </div>
        <div class="s-desc">{{ s.theme }}</div>
        <div class="s-meta">
          <span>空间: {{ s.spatialWindow }}</span>
          <span>时间: {{ s.timeWindow[0].split(' ')[1] }} ~ {{ s.timeWindow[1].split(' ')[1] }}</span>
        </div>
        <div class="s-actions">
          <el-button size="small" type="primary" plain @click="applyScene(s)">载入该场景</el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSceneStore } from '@/stores/sceneStore'
import { ElMessage } from 'element-plus'

const visible = ref(false)
const sceneStore = useSceneStore()

function applyScene(s: any) {
  sceneStore.activeScene = { ...s }
  visible.value = false
  ElMessage.success(`已载入态势场景: ${s.name}`)
}

defineExpose({
  open: () => {
    visible.value = true
  }
})
</script>

<style scoped lang="scss">
.scene-manager-body {
  display: flex;
  flex-direction: column;
  gap: 14px;

  .scene-header-intro {
    font-size: 13px;
    color: #bad3f2;
  }

  .active-scene-card {
    padding: 12px;
    background: rgba(0, 210, 255, 0.08);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      .name { font-weight: 700; font-size: 14px; color: #00d2ff; }
    }

    .props-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      .k { color: #6e87ab; }
      .v { color: #f0f6fc; margin-left: 4px; }
    }

    .card-actions {
      margin-top: 10px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #00d2ff;
  }

  .scene-item-card {
    padding: 12px;

    .s-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .s-name { font-weight: 700; font-size: 13px; color: #f0f6fc; }

      .mode-tag {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 2px;
        &.follow_latest { background: rgba(82, 196, 26, 0.2); color: #52c41a; }
        &.fixed_version { background: rgba(250, 173, 20, 0.2); color: #faad14; }
      }
    }

    .s-desc {
      font-size: 12px;
      color: #a2b7d4;
      margin: 6px 0;
    }

    .s-meta {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #6e87ab;
      font-family: var(--font-family-mono);
    }

    .s-actions {
      margin-top: 8px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
