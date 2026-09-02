<template>
  <div v-if="ragSteps && ragSteps.length" class="rag-reasoning-tree">
    <!-- 折叠摘要头：默认收起，避免长推理链占据聊天流纵向空间 -->
    <div class="collapse-header" @click="expanded = !expanded">
      <el-icon class="text-cyan"><Share /></el-icon>
      <span class="summary-text">
        多路知识检索与语义匹配 · {{ ragSteps.length }} 路检索 · 命中 {{ totalHits }} 条<template v-if="traces && traces.length"> · {{ traces.length }} 步推理</template>
      </span>
      <el-icon :class="['expand-arrow', { rotated: expanded }]"><ArrowRight /></el-icon>
    </div>

    <div v-if="expanded" class="rag-steps-list">
      <div v-for="step in ragSteps" :key="step.id" class="rag-step-card tactical-panel">
        <div class="step-header">
          <span class="step-type-badge">{{ step.ragTypeName }}</span>
          <span class="hit-count">命中 {{ step.hitCount }} 条知识</span>
        </div>
        <div class="step-query">检索条件: {{ step.query }}</div>
        <div class="step-hits">
          <div v-for="(hit, idx) in step.hits" :key="idx" class="hit-item">
            <div class="hit-title">
              {{ hit.title }}
              <span v-if="hit.score !== undefined" class="hit-score">{{ (hit.score * 100).toFixed(0) }}%</span>
            </div>
            <div class="hit-content">{{ hit.content }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 受约束推理状态机轨迹 -->
    <div v-if="expanded && traces && traces.length" class="reasoning-traces-box">
      <div class="tree-section-header" style="margin-top: 12px">
        <el-icon class="text-amber"><CircleCheck /></el-icon>
        <span>严密推导与逻辑链条</span>
      </div>

      <div class="trace-steps">
        <div v-for="t in traces" :key="t.stepNumber" class="trace-item">
          <div class="trace-step-num">{{ t.stepNumber }}</div>
          <div class="trace-body">
            <div class="trace-phase">{{ t.phaseName }}</div>
            <div class="trace-inf">{{ t.inference }}</div>
            <div class="trace-fact">事实依据: {{ t.verifiedFact }} ({{ t.evidenceRefs.join(', ') }})</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RagStep, ReasoningTrace } from '@/types/agent'
import { Share, CircleCheck, ArrowRight } from '@element-plus/icons-vue'

const props = defineProps<{
  ragSteps?: RagStep[]
  traces?: ReasoningTrace[]
}>()

const expanded = ref(false)
const totalHits = computed(() => (props.ragSteps || []).reduce((n, s) => n + (s.hits?.length || 0), 0))
</script>

<style scoped lang="scss">
.rag-reasoning-tree {
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.collapse-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(0, 210, 255, 0.08);
  border: 1px solid rgba(0, 210, 255, 0.25);
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 210, 255, 0.15);
  }

  .summary-text {
    flex: 1;
    font-size: 12px;
    font-weight: 600;
    color: #00d2ff;
  }

  .expand-arrow {
    color: #6e87ab;
    transition: transform 0.2s;
    &.rotated { transform: rotate(90deg); }
  }
}

.tree-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #00d2ff;
}

.rag-steps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .rag-step-card {
    padding: 10px 12px;
    background: rgba(10, 19, 34, 0.7);
    border: 1px solid rgba(0, 210, 255, 0.22);

    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;

      .step-type-badge {
        color: #00d2ff;
        font-weight: 700;
      }
      .hit-count {
        color: #52c41a;
        font-family: var(--font-family-mono);
      }
    }

    .step-query {
      font-size: 11px;
      color: #6e87ab;
      margin: 4px 0;
      font-family: var(--font-family-mono);
    }

    .step-hits {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 6px;

      .hit-item {
        font-size: 12px;
        background: rgba(0, 0, 0, 0.3);
        padding: 5px 8px;
        border-radius: 3px;
        .hit-title {
          color: #f0f6fc;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;

          .hit-score {
            font-size: 10px;
            color: #52c41a;
            font-family: var(--font-family-mono);
            background: rgba(82, 196, 26, 0.12);
            padding: 0 4px;
            border-radius: 2px;
          }
        }
        .hit-content { color: #a2b7d4; margin-top: 2px; }
      }
    }
  }
}

.reasoning-traces-box {
  .trace-steps {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;

    .trace-item {
      display: flex;
      gap: 10px;
      background: rgba(250, 173, 20, 0.08);
      border: 1px solid rgba(250, 173, 20, 0.3);
      padding: 8px 10px;
      border-radius: 4px;

      .trace-step-num {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #faad14;
        color: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
      }

      .trace-body {
        flex: 1;
        font-size: 12px;
        .trace-phase { color: #faad14; font-weight: 700; }
        .trace-inf { color: #f0f6fc; margin: 3px 0; }
        .trace-fact { font-size: 11px; color: #52c41a; }
      }
    }
  }
}
</style>
