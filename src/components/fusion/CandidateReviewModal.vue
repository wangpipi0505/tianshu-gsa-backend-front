<template>
  <el-dialog
    v-model="visible"
    title="多源候选关联人工研判与确认"
    width="920px"
    append-to-body
  >
    <div class="candidate-review-box">
      <div class="review-intro">
        系统根据时空接近度与高维特性提出候选关联。已决策项只读折叠；暂缓项单独分组。当前工作：{{ activeJob?.name || '未选择' }}
      </div>

      <div class="group-title pending">待处理</div>
      <div v-if="!pending.length" class="empty">当前工作无待处理候选</div>
      <div v-for="cand in pending" :key="cand.id" :class="['candidate-card tactical-panel', { deferred: cand.decision === 'deferred' }]">
        <div class="cand-header">
          <div class="cand-name-box">
            <span class="cand-name">{{ cand.candidateName }}</span>
            <el-tag size="small" type="info">{{ cand.targetType === 'air' ? '空中目标' : '水面目标' }}</el-tag>
          </div>
          <el-tag v-if="cand.decision === 'deferred'" type="warning">暂缓确认</el-tag>
          <el-tag v-else type="danger">待人工确认</el-tag>
        </div>
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
        <div class="match-basis-box">
          <span class="k">关联依据:</span>
          <span class="v">{{ cand.matchBasis.semanticBasis }}</span>
          <span class="score">匹配分: {{ (cand.matchBasis.attributeMatchScore * 100).toFixed(0) }} 分</span>
        </div>
        <el-input v-model="notes[cand.id]" size="small" placeholder="研判备注（可选，将写入留痕）" class="note-input" />
        <div class="decision-action-bar">
          <el-button size="small" type="success" plain @click="decide(cand.id, 'confirmed_same')">确认同一目标</el-button>
          <el-button size="small" type="warning" plain @click="decide(cand.id, 'keep_independent')">保持独立实体</el-button>
          <el-button size="small" type="info" plain @click="decide(cand.id, 'deferred')">暂缓确认</el-button>
        </div>
      </div>

      <div class="group-title decided">已决策（只读）</div>
      <div v-if="!decided.length" class="empty">尚无已决策候选</div>
      <div v-for="cand in decided" :key="cand.id" class="candidate-card tactical-panel decided-card">
        <div class="cand-header" @click="toggleFold(cand.id)">
          <div class="cand-name-box">
            <span class="cand-name">{{ cand.candidateName }}</span>
            <el-tag v-if="cand.decision === 'confirmed_same'" type="success">已确认同一目标</el-tag>
            <el-tag v-else-if="cand.decision === 'keep_independent'" type="warning">保持独立实体</el-tag>
          </div>
          <span class="fold">{{ folded[cand.id] === false ? '收起' : '展开' }}</span>
        </div>
        <div v-if="folded[cand.id] === false" class="decided-body">
          <div>决策时间: {{ cand.decidedAt || '—' }}</div>
          <div>研判备注: {{ cand.reviewNotes || '无' }}</div>
          <el-button size="small" type="danger" plain @click="reopen(cand.id)">重新研判</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useFusionStore } from '@/stores/fusionStore'
import { useSituationStore } from '@/stores/situationStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { AssociationCandidate } from '@/types/fusion'

const visible = ref(false)
const fusionStore = useFusionStore()
const situationStore = useSituationStore()
const notes = reactive<Record<string, string>>({})
const folded = reactive<Record<string, boolean>>({})

const activeJob = computed(() => fusionStore.activeJob())
const pending = computed(() =>
  (activeJob.value?.candidates || []).filter((c) => c.decision === 'unconfirmed' || c.decision === 'deferred')
)
const decided = computed(() =>
  (activeJob.value?.candidates || []).filter((c) => c.decision === 'confirmed_same' || c.decision === 'keep_independent')
)

function toggleFold(id: string) {
  folded[id] = folded[id] === false
}

async function decide(candId: string, decision: AssociationCandidate['decision']) {
  const jobId = activeJob.value?.id
  if (!jobId) return
  const cand = activeJob.value?.candidates.find((c) => c.id === candId)
  if (cand && cand.decision !== 'unconfirmed' && cand.decision !== 'deferred') {
    ElMessage.warning('该候选已决策，不可重复操作')
    return
  }
  await fusionStore.confirmCandidateDecision(jobId, candId, decision, notes[candId])
  if (decision === 'confirmed_same') {
    await situationStore.mergeTargetConflict('Target-001')
    ElMessage.success('已确认同一目标，决策与备注已留痕')
  } else if (decision === 'keep_independent') {
    ElMessage.info('已保持独立实体，决策已留痕')
  } else {
    ElMessage.info('已暂缓确认，进入待处理分组')
  }
}

async function reopen(candId: string) {
  const jobId = activeJob.value?.id
  if (!jobId) return
  try {
    await ElMessageBox.confirm('重新研判将清除当前决策并重新进入待处理。是否继续？', '重新研判', {
      confirmButtonText: '确认重新研判',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  await fusionStore.reopenCandidate(jobId, candId)
  ElMessage.success('已重新打开研判，原决策已留痕可追溯')
}

defineExpose({
  open: () => {
    visible.value = true
  }
})
</script>

<style scoped lang="scss">
.candidate-review-box { display: flex; flex-direction: column; gap: 12px; }
.review-intro { font-size: 13px; color: #bad3f2; }
.group-title { font-size: 13px; font-weight: 700; color: #00d2ff; }
.group-title.pending { color: #faad14; }
.empty { font-size: 12px; color: #6e87ab; }
.candidate-card { padding: 12px; background: rgba(10, 19, 34, 0.75); }
.candidate-card.deferred { border: 1px solid rgba(250, 173, 20, 0.55); }
.cand-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.cand-name { font-weight: 700; color: #f0f6fc; margin-right: 8px; }
.records-compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0; }
.rec-item { padding: 8px; background: rgba(0, 210, 255, 0.06); font-size: 12px; color: #d8e6f8; }
.ds-badge { color: #00d2ff; }
.match-basis-box { font-size: 12px; color: #bad3f2; margin-bottom: 8px; }
.note-input { margin-bottom: 8px; }
.decision-action-bar { display: flex; gap: 8px; flex-wrap: wrap; }
.decided-body { margin-top: 8px; font-size: 12px; color: #d8e6f8; display: flex; flex-direction: column; gap: 6px; }
.fold { font-size: 12px; color: #00d2ff; }
</style>
