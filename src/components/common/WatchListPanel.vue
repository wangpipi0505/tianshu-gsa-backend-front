<template>
  <el-drawer v-model="visible" title="关注对象集" :size="360" direction="rtl">
    <div class="watch-panel">
      <div class="toolbar">
        <span>已关注 {{ situationStore.watchedTargetIds.length }} 个对象</span>
        <el-button size="small" type="danger" plain :disabled="!situationStore.watchedTargetIds.length" @click="clear">
          一键清空
        </el-button>
      </div>
      <div v-if="!items.length" class="empty">尚未加入关注对象</div>
      <div v-for="item in items" :key="item.id" class="watch-row">
        <div class="meta">
          <div class="name">{{ item.codeName }}</div>
          <div class="sub">{{ typeLabel(item.type) }}</div>
        </div>
        <div class="ops">
          <el-button size="small" @click="locate(item.id)">定位</el-button>
          <el-button size="small" type="danger" plain @click="situationStore.toggleWatchTarget(item.id)">移除</el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSituationStore } from '@/stores/situationStore'
import { useSceneStore } from '@/stores/sceneStore'
import { cesiumController } from '@/utils/cesiumHelper'
import { getTargetTypeMeta } from '@/utils/formatters'

const visible = ref(false)
const situationStore = useSituationStore()
const sceneStore = useSceneStore()

const items = computed(() =>
  situationStore.watchedTargetIds
    .map((id) => situationStore.targets.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => !!t)
)

function typeLabel(type: string) {
  return getTargetTypeMeta(type).label
}

function locate(id: string) {
  const target = situationStore.targets.find((t) => t.id === id)
  if (!target) return
  sceneStore.showTargetAndFeatures(id)
  situationStore.openTargetPopup(id)
  cesiumController.focusTarget(target, 650000)
}

function clear() {
  situationStore.clearWatchList()
}

defineExpose({
  open: () => (visible.value = true),
  toggle: () => (visible.value = !visible.value)
})
</script>

<style scoped lang="scss">
.watch-panel { display: flex; flex-direction: column; gap: 10px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; color: #bad3f2; font-size: 12px; }
.empty { color: #6e87ab; font-size: 12px; padding: 20px 0; text-align: center; }
.watch-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px;
  border: 1px solid rgba(0, 210, 255, 0.2);
  border-radius: 4px;
  .name { color: #f0f6fc; font-weight: 700; font-size: 13px; }
  .sub { color: #6e87ab; font-size: 11px; }
  .ops { display: flex; gap: 6px; }
}
</style>
