<template>
  <div class="app-layout">
    <!-- 顶部战术导航与状态栏 -->
    <TacticalHeader
      @toggle-agent="onToggleAgent"
      @open-scene-modal="onOpenSceneModal"
    />

    <!-- 主视窗路由容器 -->
    <main class="main-content">
      <router-view ref="viewRef" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TacticalHeader from '@/components/common/TacticalHeader.vue'
import { useAgentStore } from '@/stores/agentStore'

const router = useRouter()
const agentStore = useAgentStore()
const viewRef = ref<any>(null)

function onToggleAgent() {
  agentStore.isOpen = !agentStore.isOpen
}

function onOpenSceneModal() {
  if (viewRef.value && viewRef.value.openSceneModal) {
    viewRef.value.openSceneModal()
  } else {
    // 场景档案能力挂在三维工作台；其他路由点击时先切回工作台
    router.push('/workbench')
  }
}
</script>

<style scoped lang="scss">
.app-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-primary);
}

.main-content {
  flex: 1;
  width: 100%;
  height: calc(100vh - 56px);
  position: relative;
  overflow: hidden;
}
</style>
