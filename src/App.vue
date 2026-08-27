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
import TacticalHeader from '@/components/common/TacticalHeader.vue'
import { useAgentStore } from '@/stores/agentStore'

const agentStore = useAgentStore()
const viewRef = ref<any>(null)

function onToggleAgent() {
  agentStore.isOpen = !agentStore.isOpen
}

function onOpenSceneModal() {
  if (viewRef.value && viewRef.value.openSceneModal) {
    viewRef.value.openSceneModal()
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
  height: calc(100vh - 52px);
  position: relative;
  overflow: hidden;
}
</style>
