<template>
  <div class="scene-info-chip">
    <!-- 当前场景（点击打开场景档案库） -->
    <div class="scene-chip" title="点击打开场景档案库" @click="emit('open-scene-modal')">
      <el-icon><FolderOpened /></el-icon>
      <span class="scene-name">{{ sceneStore.activeScene.name }}</span>
      <span :class="['mode-tag', sceneStore.activeScene.referenceMode]">
        {{ sceneStore.activeScene.referenceMode === 'follow_latest' ? '跟随最新' : '固定快照' }}
      </span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useSceneStore } from '@/stores/sceneStore'
import { FolderOpened } from '@element-plus/icons-vue'

const emit = defineEmits(['open-scene-modal'])
const sceneStore = useSceneStore()
</script>

<style scoped lang="scss">
.scene-info-chip {
  display: flex;
  align-items: center;
  gap: 10px;

  .scene-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 12px;
    color: #f0f6fc;
    background: rgba(14, 28, 48, 0.78);
    border: 1px solid rgba(0, 210, 255, 0.28);
    border-radius: 3px;
    backdrop-filter: blur(6px);
    max-width: 340px;

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

}
</style>
