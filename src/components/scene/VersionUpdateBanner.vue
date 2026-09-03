<template>
  <div v-if="sceneStore.hasProductVersionUpdate" class="version-banner">
    <span>
      数据产品已更新至 {{ sceneStore.latestProductVersion }}（原引用 {{ sceneStore.activeScene.productVersionId }}），是否刷新场景引用？
    </span>
    <div class="actions">
      <el-button size="small" type="primary" @click="confirm">刷新引用</el-button>
      <el-button size="small" @click="sceneStore.dismissProductVersionPrompt()">保持现状</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSceneStore } from '@/stores/sceneStore'
import { ElMessage } from 'element-plus'

const sceneStore = useSceneStore()

function confirm() {
  const next = sceneStore.latestProductVersion
  sceneStore.confirmProductVersionRefresh()
  ElMessage.success(`已刷新场景引用至 ${next}`)
}
</script>

<style scoped lang="scss">
.version-banner {
  position: absolute;
  top: 58px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 14px;
  background: rgba(8, 16, 28, 0.94);
  border: 1px solid rgba(250, 173, 20, 0.65);
  color: #ffe58f;
  font-size: 12px;
  border-radius: 4px;
  max-width: min(920px, 80vw);
}
</style>
