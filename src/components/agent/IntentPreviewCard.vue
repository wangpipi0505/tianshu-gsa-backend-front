<template>
  <div v-if="intent" class="intent-preview-card tactical-panel">
    <div class="intent-header">
      <div class="header-left">
        <el-icon class="text-cyan"><Operation /></el-icon>
        <span class="intent-title">意图理解与任务分解</span>
      </div>
      <el-tag size="small" type="success">{{ (intent.confidence * 100).toFixed(0) }}% 意图置信度</el-tag>
    </div>

    <div class="intent-fields">
      <div class="field-item">
        <span class="k">目标对象:</span>
        <el-input v-model="draft.targetScope" size="small" />
      </div>
      <div class="field-item">
        <span class="k">空间范围:</span>
        <el-input v-model="draft.spatialScope" size="small" />
      </div>
      <div class="field-item">
        <span class="k">时间窗口:</span>
        <el-input v-model="draft.timeScope" size="small" />
      </div>
      <div class="field-item">
        <span class="k">研判动作序列:</span>
        <ol class="action-list">
          <li v-for="(act, idx) in intent.actionSequence" :key="idx">{{ act }}</li>
        </ol>
      </div>
      <el-button size="small" type="primary" plain @click="reexecute">{{ intentActionLabel }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { IntentUnderstanding } from '@/types/agent'
import { useAgentStore } from '@/stores/agentStore'
import { Operation } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  intent?: IntentUnderstanding
}>()

const agentStore = useAgentStore()
const draft = reactive({
  targetScope: '',
  spatialScope: '',
  timeScope: ''
})

const intentActionLabel = computed(() => {
  switch (props.intent?.intentCategory) {
    case 'data_fusion':
      return props.intent.rawPrompt.includes('候选') ? '按修正条件查看候选关联' : '按修正条件核验发布事项'
    case 'do_analysis':
      return '按修正统计条件重新计算'
    case 'build_scene':
      return '按修正构建条件生成草稿'
    case 'thematic_analysis':
      return '按修正区域态势条件重新加载'
    case 'do_simulation':
    case 'simulation_deduction':
      return '按修正推演条件重新计算'
    default:
      return '按修正条件重新处理'
  }
})

const intentPromptPrefix = computed(() => {
  switch (props.intent?.intentCategory) {
    case 'data_fusion': return '数据融合处理'
    case 'do_analysis': return '统计分析'
    case 'build_scene': return '态势场景构建'
    case 'thematic_analysis': return '区域态势加载'
    case 'do_simulation':
    case 'simulation_deduction': return '态势推演'
    default: return '业务处理'
  }
})

watch(
  () => props.intent,
  (intent) => {
    if (!intent) return
    draft.targetScope = intent.targetScope.join(', ')
    draft.spatialScope = intent.spatialScope
    draft.timeScope = intent.timeScope
  },
  { immediate: true }
)

function reexecute() {
  if (!props.intent) return
  props.intent.targetScope = draft.targetScope.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
  props.intent.spatialScope = draft.spatialScope
  props.intent.timeScope = draft.timeScope
  const prompt = `${intentPromptPrefix.value}：${intentActionLabel.value}。对象=${draft.targetScope}；空间=${draft.spatialScope}；时间=${draft.timeScope}`
  agentStore.sendMessage(prompt)
  ElMessage.success(`${intentActionLabel.value}指令已提交，修正内容已随会话留痕`)
}
</script>

<style scoped lang="scss">
.intent-preview-card {
  padding: 12px;
  background: rgba(0, 210, 255, 0.06);
  border: 1px solid rgba(0, 210, 255, 0.35);
  border-radius: 4px;
  margin: 8px 0;

  .intent-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #00d2ff;
    }
  }

  .intent-fields {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;

    .field-item {
      display: flex;
      gap: 8px;
      align-items: center;
      .k { color: #6e87ab; min-width: 75px; }
    }

    .action-list {
      margin-left: 18px;
      color: #d8e6f8;
      li { margin: 3px 0; }
    }
  }
}
</style>
