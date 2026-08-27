<template>
  <el-dialog
    v-model="visible"
    title="多源候选关联人工研判与确认"
    width="860px"
    append-to-body
  >
    <div class="candidate-review-box">
      <div class="review-intro">
        系统根据时空接近度与高维特性提出候选关联并呈现研判依据，请研判员人工确认决策：
      </div>

      <div v-for="job in fusionStore.fusionJobs" :key="job.id" class="job-candidates">
        <div class="job-title">{{ job.name }}</div>

        <div v-for="cand in job.candidates" :key="cand.id" class="candidate-card tactical-panel">
          <div class="cand-header">
            <div class="cand-name-box">
              <span class="cand-name">{{ cand.candidateName }}</span>
              <el-tag size="small" type="info">{{ cand.targetType === 'air' ? '空中目标' : '水面目标' }}</el-tag>
            </div>
            <div class="cand-decision-tag">
              <el-tag v-if="cand.decision === 'confirmed_same'" type="success">已确认同一目标 (已同步态势)</el-tag>
              <el-tag v-else-if="cand.decision === 'keep_independent'" type="warning">保持独立实体</el-tag>
              <el-tag v-else-if="cand.decision === 'deferred'" type="info">暂缓研判</el-tag>
              <el-tag v-else type="danger">待人工确认</el-tag>
            </div>
          </div>

          <!-- 依据与多源记录左右对比 -->
          <div class="records-compare-grid">
            <div v-for="rec in cand.sourceRecords" :key="rec.recordId" class="rec-item">
              <div class="rec-header">
                <span class="ds-badge">{{ rec.datasetName }}</span>
                <span class="conf">置信度: {{ (rec.confidence * 100).toFixed(0) }}%</span>
              </div>
              <div class="rec-props">
                <div>观测时间: {{ rec.observedTime }}</div>
                <div>时空坐标: {{ rec.location.join(', ') }}</div>
                <div>属性提取: {{ JSON.stringify(rec.attributes) }}</div>
              </div>
            </div>
          </div>

          <!-- 关联依据描述 -->
          <div class="match-basis-box">
            <span class="k">关联依据:</span>
            <span class="v">{{ cand.matchBasis.semanticBasis }}</span>
            <span class="score">匹配分: {{ (cand.matchBasis.attributeMatchScore * 100).toFixed(0) }} 分</span>
          </div>

          <!-- 人工决策操作按钮 -->
          <div class="decision-action-bar">
            <el-button
              size="small"
              type="success"
              plain
              @click="onConfirmDecision(job.id, cand.id, 'confirmed_same')"
            >
              确认同一目标 (消除冲突并同步上图)
            </el-button>
            <el-button
              size="small"
              type="warning"
              plain
              @click="onConfirmDecision(job.id, cand.id, 'keep_independent')"
            >
              保持独立实体
            </el-button>
            <el-button
              size="small"
              type="info"
              plain
              @click="onConfirmDecision(job.id, cand.id, 'deferred')"
            >
              暂缓确认
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFusionStore } from '@/stores/fusionStore'
import { useSituationStore } from '@/stores/situationStore'
import { ElMessage } from 'element-plus'

const visible = ref(false)
const fusionStore = useFusionStore()
const situationStore = useSituationStore()

async function onConfirmDecision(jobId: string, candId: string, decision: any) {
  await fusionStore.confirmCandidateDecision(jobId, candId, decision)
  if (decision === 'confirmed_same') {
    await situationStore.mergeTargetConflict('Target-001')
    ElMessage.success('多源关联决策成功：已消除观测冲突，融合平滑航迹已同步至三维数字地球！')
  } else if (decision === 'keep_independent') {
    ElMessage.info('已保持多源实体独立记录')
  } else {
    ElMessage.info('已暂缓该候选关联')
  }
}

defineExpose({
  open: () => {
    visible.value = true
  }
})
</script>

<style scoped lang="scss">
.candidate-review-box {
  display: flex;
  flex-direction: column;
  gap: 14px;

  .review-intro {
    font-size: 13px;
    color: #bad3f2;
  }

  .job-title {
    font-size: 14px;
    font-weight: 700;
    color: #00d2ff;
    margin-bottom: 10px;
  }

  .candidate-card {
    padding: 14px;
    margin-bottom: 14px;

    .cand-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      .cand-name {
        font-weight: 700;
        font-size: 14px;
        color: #f0f6fc;
        margin-right: 8px;
      }
    }

    .records-compare-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 10px 0;

      .rec-item {
        background: rgba(10, 18, 32, 0.7);
        border: 1px solid rgba(0, 210, 255, 0.2);
        padding: 10px;
        border-radius: 4px;

        .rec-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 6px;
          .ds-badge { color: #00d2ff; font-weight: 700; }
          .conf { color: #52c41a; font-weight: 600; }
        }

        .rec-props {
          font-size: 12px;
          color: #d8e6f8;
          line-height: 1.5;
        }
      }
    }

    .match-basis-box {
      font-size: 12px;
      padding: 8px 10px;
      background: rgba(0, 210, 255, 0.08);
      border-radius: 3px;
      display: flex;
      gap: 8px;
      align-items: center;

      .k { color: #6e87ab; }
      .v { color: #00d2ff; flex: 1; }
      .score { color: #52c41a; font-weight: 700; font-family: var(--font-family-mono); }
    }

    .decision-action-bar {
      display: flex;
      gap: 10px;
      margin-top: 12px;
      justify-content: flex-end;
    }
  }
}
</style>
