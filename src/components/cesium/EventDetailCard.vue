<template>
  <div v-if="event" class="event-detail-card tactical-panel">
    <div class="card-head">
      <span class="name">{{ event.eventName }}</span>
      <el-tag size="small" :type="tagType">{{ severityLabel }}</el-tag>
      <el-button size="small" circle text @click="emit('close')">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
    <div class="row"><span class="k">类别</span><span class="v">{{ event.category }}</span></div>
    <div class="row"><span class="k">时间</span><span class="v">{{ event.timestamp }}</span></div>
    <div class="desc">{{ event.description }}</div>
    <div class="section">参与对象</div>
    <div class="participants">
      <el-button
        v-for="id in event.affectedTargetIds"
        :key="id"
        size="small"
        plain
        @click="emit('focus-target', id)"
      >
        {{ targetName(id) }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSituationStore } from '@/stores/situationStore'
import { Close } from '@element-plus/icons-vue'

const props = defineProps<{ eventId: string | null }>()
const emit = defineEmits(['close', 'focus-target'])
const situationStore = useSituationStore()

const event = computed(() => situationStore.events.find((e) => e.id === props.eventId) || null)
const severityLabel = computed(() => {
  if (!event.value) return ''
  return event.value.severity === 'critical' ? '重大' : event.value.severity === 'warning' ? '警告' : '一般'
})
const tagType = computed(() => {
  if (!event.value) return 'info'
  return event.value.severity === 'critical' ? 'danger' : event.value.severity === 'warning' ? 'warning' : 'success'
})

function targetName(id: string) {
  return situationStore.targets.find((t) => t.id === id)?.codeName || id
}
</script>

<style scoped lang="scss">
.event-detail-card {
  position: absolute;
  top: 86px;
  left: 18px;
  width: 320px;
  z-index: 18;
  padding: 12px;
  background: rgba(8, 16, 28, 0.94);
  border: 1px solid rgba(0, 210, 255, 0.4);

  .card-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    .name { flex: 1; font-weight: 700; color: #00d2ff; font-size: 13px; }
  }
  .row, .desc { font-size: 12px; color: #bad3f2; margin-bottom: 6px; }
  .k { color: #6e87ab; margin-right: 8px; }
  .section { font-size: 12px; color: #00d2ff; margin: 8px 0 6px; }
  .participants { display: flex; flex-wrap: wrap; gap: 6px; }
}
</style>
