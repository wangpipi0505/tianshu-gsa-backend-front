<template>
  <el-dialog
    v-model="visible"
    title="态势场景推演与算法配置"
    width="760px"
    append-to-body
  >
    <div class="simulation-modal-body">
      <div class="sim-intro">
        推演围绕当前场景中已有的目标实体、态势事件与战术约束展开。推演计算生成的航线将以【推演工作内容】呈现：
      </div>

      <!-- 算法包选择 -->
      <div class="form-section">
        <div class="section-title">选择推演算法模型</div>
        <el-select
          v-model="simulationStore.selectedAlgorithmId"
          style="width: 100%"
          size="small"
        >
          <el-option
            v-for="alg in simulationStore.algorithmPacks"
            :key="alg.id"
            :value="alg.id"
            :label="`${alg.name} (${alg.version})`"
          />
        </el-select>
      </div>

      <!-- 动态推演输入参数表单 -->
      <div v-if="currentAlg" class="form-section">
        <div class="section-title">算法约束与环境参数配置</div>
        <el-form label-width="170px" size="small">
          <el-form-item
            v-for="param in currentAlg.inputParams"
            :key="param.key"
            :label="param.label"
          >
            <el-input-number
              v-if="param.type === 'number'"
              v-model="param.defaultVal"
              style="width: 100%"
            />
            <el-switch
              v-else-if="param.type === 'boolean'"
              v-model="param.defaultVal"
            />
            <el-input v-else v-model="param.defaultVal" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 推演调用历史（方案 5.5.8 全程留痕） -->
      <div v-if="simulationStore.runHistory.length" class="form-section">
        <div class="section-title">推演历史记录</div>
        <div v-for="h in simulationStore.runHistory" :key="h.id" class="history-item">
          <div class="h-main">
            <span class="h-name">{{ h.algorithmName }}</span>
            <span class="h-time">{{ h.executedAt }}</span>
          </div>
          <div class="h-params">参数：{{ formatParams(h.params) }}</div>
          <div class="h-actions">
            <el-button size="small" text type="primary" @click="reapplyParams(h)">同参数回填</el-button>
            <el-button size="small" text @click="showComparison(h)">查看差异比对</el-button>
          </div>
        </div>
      </div>

      <!-- 推演计算进度 -->
      <div v-if="simulationStore.isRunning" class="sim-progress-box">
        <div class="progress-title">
          <el-icon class="is-loading text-cyan"><Loading /></el-icon>
          <span>正在执行多机动弹道与拦截概率推演计算...</span>
        </div>
        <el-progress :percentage="simulationStore.progressPercent" :stroke-width="12" />
      </div>

      <!-- 推演结果与真实态势对比 -->
      <div v-if="!simulationStore.isRunning && simulationStore.progressPercent === 100" class="sim-result-box">
        <el-alert
          :title="`推演计算完成：已按输入参数 (突防高度 ${simulationStore.lastRunParams.targetAltitudeM ?? '-'} 米 / 马赫 ${simulationStore.lastRunParams.machSpeed ?? '-'}${simulationStore.lastRunParams.jammingEnabled ? ' / 伴随电磁压制' : ''}) 生成假设航线`"
          type="success"
          description="假设航线已注入当前三维视窗，标记为【推演工作内容】；详细参数对比见分析工作台「真实态势 vs 推演比对」。"
          show-icon
          :closable="false"
        />
      </div>
    </div>

    <template #footer>
      <el-button size="small" @click="visible = false">关闭</el-button>
      <el-button
        size="small"
        type="primary"
        :loading="simulationStore.isRunning"
        @click="onRun"
      >
        <el-icon><VideoPlay /></el-icon>
        <span>发起场景推演计算</span>
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSimulationStore } from '@/stores/simulationStore'
import { useSituationStore } from '@/stores/situationStore'
import { cesiumController } from '@/utils/cesiumHelper'
import { ElMessage } from 'element-plus'
import { Loading, VideoPlay } from '@element-plus/icons-vue'

const visible = ref(false)
const simulationStore = useSimulationStore()
const situationStore = useSituationStore()

const currentAlg = computed(() =>
  simulationStore.algorithmPacks.find((a) => a.id === simulationStore.selectedAlgorithmId)
)

function formatParams(p: Record<string, unknown>) {
  return Object.entries(p)
    .map(([k, v]) => `${k}=${v}`)
    .join(' / ')
}

/** 将历史参数回填到当前表单 */
function reapplyParams(h: { algorithmId: string; params: Record<string, unknown> }) {
  simulationStore.selectedAlgorithmId = h.algorithmId
  const alg = simulationStore.algorithmPacks.find((a) => a.id === h.algorithmId)
  alg?.inputParams.forEach((p) => {
    if (h.params[p.key] !== undefined) p.defaultVal = h.params[p.key]
  })
  ElMessage.success('历史参数已回填，点击「发起场景推演计算」执行')
}

/** 载入历史差异比对结果 */
function showComparison(h: Parameters<typeof simulationStore.showHistoryComparison>[0]) {
  simulationStore.showHistoryComparison(h)
  ElMessage.success('已载入该次推演的差异比对结果（分析工作台同步可见）')
}

async function onRun() {
  // 收集表单实际填写的参数参与推演计算
  const params: Record<string, unknown> = {}
  currentAlg.value?.inputParams.forEach((p) => {
    params[p.key] = p.defaultVal
  })
  await simulationStore.runSimulation(params)

  if (simulationStore.progressPercent === 100) {
    // 将推演假设航线上图 (按本次参数生成，替换旧假设)
    situationStore.removeSimulationHypothesis('SIM-HYPO-001')
    situationStore.injectSimulationHypothesis('SIM-HYPO-001', {
      targetAltitudeM: Number(params.targetAltitudeM ?? 300),
      machSpeed: Number(params.machSpeed ?? 1.4)
    })
    const hypo = situationStore.targets.find((t) => t.id === 'SIM-HYPO-001')
    if (hypo) {
      cesiumController.flyToTargets([hypo])
    }
    ElMessage.success('推演假设航线已按当前参数上图！')
  }
}

defineExpose({
  open: () => {
    // 重置上次运行状态，避免一打开就显示"已完成"
    simulationStore.resetRunState()
    visible.value = true
  }
})
</script>

<style scoped lang="scss">
.simulation-modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;

  .sim-intro {
    font-size: 13px;
    color: #bad3f2;
  }

  .form-section {
    background: rgba(10, 18, 32, 0.6);
    border: 1px solid rgba(0, 210, 255, 0.2);
    padding: 12px;
    border-radius: 4px;

    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #00d2ff;
      margin-bottom: 10px;
    }
  }

  .history-item {
    padding: 6px 8px;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 3px;

    .h-main {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      .h-name { color: #f0f6fc; font-weight: 600; }
      .h-time { color: #6e87ab; font-family: var(--font-family-mono); font-size: 11px; }
    }
    .h-params { font-size: 11px; color: #6e87ab; margin-top: 2px; font-family: var(--font-family-mono); }
    .h-actions { margin-top: 4px; display: flex; gap: 4px; }
  }

  .sim-progress-box {
    padding: 12px;
    background: rgba(0, 210, 255, 0.08);
    border-radius: 4px;

    .progress-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #00d2ff;
      margin-bottom: 10px;
    }
  }
}
</style>
