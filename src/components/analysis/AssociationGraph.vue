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
        <div class="section-title">防空与武器威胁覆盖圈</div>
        <div v-for="(tz, idx) in analysisStore.associationResult.threatZones" :key="idx" class="tz-card">
          <div class="tz-name text-red">{{ tz.name }}</div>
          <div class="tz-props">
            <span>中心坐标: (东经{{ tz.center[0] }}°, 北纬{{ tz.center[1] }}°)</span>
            <span>杀伤半径: {{ tz.radiusKm }} 公里</span>
            <el-tag size="small" type="danger">高度威胁区</el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useAnalysisStore } from '@/stores/analysisStore'

const analysisStore = useAnalysisStore()
const graphRef = ref<HTMLDivElement | null>(null)
let graphChart: echarts.ECharts | null = null

function initGraph() {
  if (!graphRef.value) return
  graphChart = echarts.init(graphRef.value)

  graphChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
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
        data: [
          { id: 'Target-001', name: '敌重点战机', symbolSize: 45, itemStyle: { color: '#ff4d4f', borderColor: '#ffffff', borderWidth: 1 } },
          { id: 'Target-002', name: '敌预警指挥机', symbolSize: 45, itemStyle: { color: '#ff4d4f', borderColor: '#ffffff', borderWidth: 1 } },
          { id: 'Target-003', name: '我驱逐舰173舰', symbolSize: 48, itemStyle: { color: '#00d2ff', borderColor: '#ffffff', borderWidth: 1 } },
          { id: 'Target-004', name: '我空警预警机', symbolSize: 45, itemStyle: { color: '#00d2ff', borderColor: '#ffffff', borderWidth: 1 } },
          { id: 'Target-005', name: '我地空导弹营', symbolSize: 40, itemStyle: { color: '#52c41a', borderColor: '#ffffff', borderWidth: 1 } }
        ],
        links: [
          { source: 'Target-002', target: 'Target-001', relation: '战术预警指挥', lineStyle: { color: '#00d2ff', width: 2 } },
          { source: 'Target-004', target: 'Target-003', relation: '海空联合协同', lineStyle: { color: '#00d2ff', width: 2 } },
          { source: 'Target-001', target: 'Target-003', relation: '超视距威胁对峙', lineStyle: { color: '#ff4d4f', width: 2, type: 'dashed' } },
          { source: 'Target-005', target: 'Target-003', relation: '岸海防空交织网', lineStyle: { color: '#52c41a', width: 2 } }
        ]
      }
    ]
  })
}

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
