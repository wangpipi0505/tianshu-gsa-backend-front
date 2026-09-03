<template>
  <div class="scene-status-strip">
    <!-- 当前场景（点击打开场景档案库） -->
    <div class="scene-chip" title="点击打开场景档案库" @click="emit('open-scene-modal')">
      <el-icon><FolderOpened /></el-icon>
      <span class="scene-name">{{ sceneStore.activeScene.name }}</span>
      <span :class="['mode-tag', sceneStore.activeScene.referenceMode]">
        {{ sceneStore.activeScene.referenceMode === 'follow_latest' ? '跟随最新' : '固定快照' }}
      </span>
    </div>

    <!-- 当前身份与密级 -->
    <el-tag size="small">{{ clearanceLabel }}</el-tag>
    <el-select
      size="small"
      :model-value="identityStore.userName"
      class="identity-select"
      @change="(v: any) => identityStore.switchProfile(v)"
    >
      <el-option v-for="p in identityStore.profiles" :key="p.name" :label="`${p.name} / ${clearanceText(p.clearance)}`" :value="p.name" />
    </el-select>

    <!-- 数据产品刷新状态（点击刷新） -->
    <el-tag size="small" :type="freshnessTag" style="cursor: pointer" @click="onRefresh">{{ freshnessText }}</el-tag>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSceneStore } from '@/stores/sceneStore'
import { useSituationStore } from '@/stores/situationStore'
import { useIdentityStore } from '@/stores/identityStore'
import { useFusionStore } from '@/stores/fusionStore'
import { FolderOpened } from '@element-plus/icons-vue'

const emit = defineEmits(['open-scene-modal'])
const sceneStore = useSceneStore()
const situationStore = useSituationStore()
const identityStore = useIdentityStore()
const fusionStore = useFusionStore()

const CLEARANCE_LABEL: Record<string, string> = {
  internal: '内部',
  confidential: '秘密',
  secret: '机密',
  top_secret: '绝密'
}
function clearanceText(level: string) {
  return CLEARANCE_LABEL[level] || level
}
const clearanceLabel = computed(() => `${identityStore.userName} · ${clearanceText(identityStore.clearance)}`)

const freshnessText = computed(() => {
  const prod = fusionStore.productReleases[0]
  const tp = prod?.statement?.lastUpdated || situationStore.currentPlaybackTime
  const status = fusionStore.refreshStatus === 'updating' ? '更新中' : fusionStore.refreshStatus === 'failed' ? '失败' : '最新'
  return `${status} · 数据时点 ${tp} · ${fusionStore.confirmMode}`
})
const freshnessTag = computed(() =>
  fusionStore.refreshStatus === 'updating' ? 'warning' : fusionStore.refreshStatus === 'failed' ? 'danger' : 'success'
)
function onRefresh() {
  void fusionStore.refreshLatest()
}
</script>

<style scoped lang="scss">
.scene-status-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 3px 10px;
  background: rgba(14, 28, 48, 0.78);
  border: 1px solid rgba(0, 210, 255, 0.28);
  border-radius: 3px;
  backdrop-filter: blur(6px);

  .scene-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 12px;
    color: #f0f6fc;
    max-width: 300px;

    .el-icon { color: #00d2ff; flex-shrink: 0; }

    .scene-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mode-tag {
      flex-shrink: 0;
      font-size: 11px;
      padding: 0 5px;
      border-radius: 2px;

      &.follow_latest {
        background: rgba(82, 196, 26, 0.18);
        color: #52c41a;
      }

      &.fixed_version {
        background: rgba(250, 173, 20, 0.18);
        color: #faad14;
      }
    }

    &:hover {
      border-color: rgba(0, 210, 255, 0.6);
      background: rgba(0, 210, 255, 0.08);
    }
  }

  .identity-select {
    width: 150px;
  }
}
</style>
