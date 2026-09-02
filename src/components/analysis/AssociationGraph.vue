<template>
  <div class="association-graph-card tactical-panel">
    <div class="tactical-panel-header">
      <span>领域本体关联与态势影响网络</span>
      <el-tag size="small" type="info">强弱关联分级</el-tag>
    </div>

    <div class="graph-body">
      <!-- 关系力导向图 -->
      <div ref="graphRef" class="graph-chart-dom"></div>

      <!-- 威胁与防空杀伤圈清单 -->
      <div class="threat-zones-list">
        <div class="section-title">防空与武器威胁覆盖圈 (点击定位)</div>
        <div
          v-for="(tz, idx) in analysisStore.associationResult.threatZones"
          :key="idx"
          class="tz-card"
          @click="locateThreatZone(tz)"
        >
          <div class="tz-name text-red">{{ tz.name }}</div>
          <div class="tz-props">
            <span>中心坐标: (东经{{ tz.center[0] }}°, 北纬{{ tz.center[1] }}°)</span>
            <span>覆盖半径: {{ tz.radiusKm }} 公里</span>
            <el-tag size="small" :type="tz.threatLevel === 'high' ? 'danger' : 'warning'">
              {{ tz.threatLevel === 'high' ? '高度威胁区' : '防御覆盖区' }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useSituationStore } from '@/stores/situationStore'
import { useSceneStore } from '@/stores/sceneStore'
import { cesiumController } from '@/utils/cesiumHelper'
import { ElMessage } from 'element-plus'

const router = useRouter()
const analysisStore = useAnalysisStore()
const situationStore = useSituationStore()
const sceneStore = useSceneStore()
const graphRef = ref<HTMLDivElement | null>(null)
let graphChart: echarts.ECharts | null = null

function graphOption(): echarts.EChartsOption {
  const result = analysisStore.associationResult
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    toolbox: {
      right: 8,
      feature: { saveAsImage: { title: '保存图片', name: '关联图谱' } },
      iconStyle: { borderColor: '#6e87ab' }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        force: {
          repulsion: 340,
          edgeLength: 130
        },
        roam: true,
        label: { show: true, color: '#f0f6fc', fontSize: 12 },
        edgeSymbol: ['circle', 'arrow'],
        edgeSymbolSize: [4, 8],
        edgeLabel: {
          show: true,
          fontSize: 11,
          color: '#bad3f2',
          formatter: (params: any) => params.data.relation
        },
        data: result.nodes.map((n) => ({
          id: n.id,
          name: n.name,
          symbolSize: n.symbolSize,
          itemStyle: { color: n.color, borderColor: '#ffffff', borderWidth: 1 }
        })),
        links: result.links.map((l) => ({
          source: l.source,
          target: l.target,
          relation: l.relation,
          lineStyle:
            l.strength === 'strong'
              ? { color: '#00d2ff', width: 3 }
              : { color: '#6e87ab', width: 1.5, type: 'dashed' as const }
        }))
      }
    ]
  }
}

function renderGraph() {
  graphChart?.setOption(graphOption(), true)
}

function initGraph() {
  if (!graphRef.value) return
  graphChart = echarts.init(graphRef.value)
  graphChart.setOption(graphOption())

  // 下钻：点击节点 → 跳转三维工作台并聚焦该目标
  graphChart.on('click', (params) => {
    if (params.dataType !== 'node') return
    const targetId = String((params.data as { id?: string })?.id || '')
    const target = situationStore.targets.find((t) => t.id === targetId)
    if (!target) return
    sceneStore.showTargetAndFeatures(target.id)
    situationStore.selectedTargetId = target.id
    router.push('/workbench')
    setTimeout(() => cesiumController.focusTarget(target, 650000), 200)
    ElMessage.success(`已下钻聚焦【${target.codeName}】(${target.callsign})`)
  })
}

/** 威胁/覆盖圈一键定位：跳转三维地球并飞至该圈中心 */
function locateThreatZone(tz: { center: [number, number]; name: string }) {
  router.push('/workbench')
  setTimeout(() => cesiumController.flyToCoordinates([tz.center], 900000), 200)
  ElMessage.success(`已定位【${tz.name}】中心空域`)
}

watch(() => analysisStore.associationResult, renderGraph, { deep: true })

function handleResize() {
  graphChart?.resize()
}

onMounted(() => {
  initGraph()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  graphChart?.dispose()
})
</script>

<style scoped lang="scss">
.association-graph-card {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .graph-body {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 14px;

    .graph-chart-dom {
      height: 250px;
    }

    .threat-zones-list {
      background: rgba(10, 18, 32, 0.6);
      border: 1px solid rgba(0, 210, 255, 0.18);
      border-radius: 4px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .section-title {
        font-size: 12px;
        font-weight: 700;
        color: #00d2ff;
      }

      .tz-card {
        padding: 8px;
        background: rgba(255, 77, 79, 0.1);
        border: 1px solid rgba(255, 77, 79, 0.3);
        border-radius: 3px;

        .tz-name { font-size: 12px; font-weight: 700; }
        .tz-props {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 11px;
          color: #bad3f2;
          margin-top: 6px;
        }
      }
    }
  }
}
</style>
