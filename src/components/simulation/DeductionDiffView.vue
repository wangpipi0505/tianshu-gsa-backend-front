<template>
  <div class="deduction-diff-card tactical-panel">
    <div class="tactical-panel-header">
      <span>真实态势事实 vs 推演假设结果同场比对</span>
      <span class="badge-hypothesis">推演工作内容</span>
    </div>

    <div class="diff-table-box">
      <el-table :data="simulationStore.comparisonData" size="small" stripe>
        <el-table-column prop="dimension" label="研判对比维度" width="140" />
        <el-table-column label="真实态势事实 (唯一事实)">
          <template #default="{ row }">
            <span class="text-cyan">{{ row.groundTruthFact }}</span>
          </template>
        </el-table-column>
        <el-table-column label="推演假设结果 (工作内容)">
          <template #default="{ row }">
            <span class="text-purple">{{ row.simulatedHypothesis }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="diffDescription" label="战术差异综合分析" min-width="180" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSimulationStore } from '@/stores/simulationStore'

const simulationStore = useSimulationStore()
</script>

<style scoped lang="scss">
.deduction-diff-card {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.text-cyan { color: #00d2ff !important; font-weight: 700; }
.text-purple { color: #d3adf7 !important; font-weight: 700; }
</style>
