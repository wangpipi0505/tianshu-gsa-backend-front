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
  persistDismissed(next)
  ElMessage.success(`已刷新场景引用至 ${next}`)
}

/** 演示/交付阶段：同一版本的刷新提示只出现一次，选择后持久化不再重复弹出 */
function persistDismissed(version: string) {
  try {
    localStorage.setItem('gsa.versionPromptDismissed', version)
  } catch {
    /* 隐私模式等场景忽略 */
  }
}

function isDismissed(version: string): boolean {
  try {
    return localStorage.getItem('gsa.versionPromptDismissed') === version
  } catch {
    return false
  }
}

defineExpose({ isDismissed })
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
