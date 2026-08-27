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
        <span class="v text-cyan">{{ intent.targetScope.join(', ') }}</span>
      </div>
      <div class="field-item">
        <span class="k">空间范围:</span>
        <span class="v">{{ intent.spatialScope }}</span>
      </div>
      <div class="field-item">
        <span class="k">时间窗口:</span>
        <span class="v">{{ intent.timeScope }}</span>
      </div>
      <div class="field-item">
        <span class="k">研判动作序列:</span>
        <ol class="action-list">
          <li v-for="(act, idx) in intent.actionSequence" :key="idx">{{ act }}</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IntentUnderstanding } from '@/types/agent'
import { Operation } from '@element-plus/icons-vue'

defineProps<{
  intent?: IntentUnderstanding
}>()
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
      .k { color: #6e87ab; min-width: 75px; }
      .v { color: #f0f6fc; font-weight: 500; }
    }

    .action-list {
      margin-left: 18px;
      color: #d8e6f8;
      li { margin: 3px 0; }
    }
  }
}
</style>
