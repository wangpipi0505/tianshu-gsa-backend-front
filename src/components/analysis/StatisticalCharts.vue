<template>
  <div class="statistical-charts-container">
    <!-- 分析口径选择栏 -->
    <div class="scope-selector-bar tactical-panel">
      <span class="scope-label">分析内容来源口径:</span>
      <el-radio-group
        v-model="analysisStore.currentSourceScope"
        size="small"
        @change="onScopeChange"
      >
        <el-radio-button value="fact_only">仅真实态势 (默认)</el-radio-button>
        <el-radio-button value="fact_and_work">真实态势 + 标绘推演</el-radio-button>
        <el-radio-button value="work_only">仅标绘推演内容</el-radio-button>
        <el-radio-button value="source_compare">按来源分类对比</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 图表网格 -->
    <div class="charts-grid">
      <!-- 图表 1: 目标类型构成占比 (饼图) -->
      <div class="chart-card tactical-panel">
        <div class="tactical-panel-header">
          <span>目标类型构成分布</span>
          <span class="total-tag">共 {{ analysisStore.statisticalResult.totalCount }} 目标</span>
        </div>
        <div ref="pieChartRef" class="chart-dom"></div>
      </div>

      <!-- 图表 2: 态势时序活动频度 (折线柱状图) -->
      <div class="chart-card tactical-panel">
        <div class="tactical-panel-header">
          <span>态势时序活动密度分布</span>
          <span class="conf-tag">数据覆盖度: {{ analysisStore.statisticalResult.coverageScore }}%</span>
        </div>
        <div ref="lineChartRef" class="chart-dom"></div>
      </div>

      <!-- 图表 3: 多源数据冲突保留率与质检指标 (仪表盘) -->
      <div class="chart-card tactical-panel">
        <div class="tactical-panel-header">
          <span>多源观测冲突保留率</span>
          <el-tag size="small" type="warning">保留多源观测</el-tag>
        </div>
        <div ref="gaugeChartRef" class="chart-dom"></div>
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

const pieChartRef = ref<HTMLDivElement | null>(null)
const lineChartRef = ref<HTMLDivElement | null>(null)
const gaugeChartRef = ref<HTMLDivElement | null>(null)

let pieChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null
let gaugeChart: echarts.ECharts | null = null

const TOOLBOX = {
  right: 8,
  top: 0,
  feature: { saveAsImage: { title: '保存图片', name: '态势统计图' } },
  iconStyle: { borderColor: '#6e87ab' }
}

function pieOption(): echarts.EChartsOption {
  const breakdown = analysisStore.statisticalResult.categoryBreakdown
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: '5%', textStyle: { color: '#bad3f2', fontSize: 12 } },
    toolbox: TOOLBOX,
    series: [
      {
        name: '目标类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#0b111e', borderWidth: 2 },
        label: { show: false },
        data: breakdown.map((c) => ({ value: c.count, name: c.name, itemStyle: { color: c.color } }))
      }
    ]
  }
}

function lineOption(): echarts.EChartsOption {
  const density = analysisStore.statisticalResult.timeSeriesDensity
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    toolbox: TOOLBOX,
    grid: { left: '8%', right: '6%', top: '15%', bottom: '15%' },
    xAxis: {
      type: 'category',
      data: density.map((t) => t.timestamp),
      axisLine: { lineStyle: { color: 'rgba(0, 210, 255, 0.35)' } },
      axisLabel: { color: '#bad3f2', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(0, 210, 255, 0.15)' } },
      axisLabel: { color: '#bad3f2', fontSize: 11 }
    },
    series: [
      {
        data: density.map((t) => t.count),
        type: 'line',
        smooth: true,
        lineStyle: { color: '#00d2ff', width: 2.5 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 210, 255, 0.45)' },
            { offset: 1, color: 'rgba(0, 210, 255, 0.02)' }
          ])
        }
      }
    ]
  }
}

function gaugeOption(): echarts.EChartsOption {
  return {
    backgroundColor: 'transparent',
    toolbox: TOOLBOX,
    series: [
      {
        type: 'gauge',
        center: ['50%', '55%'],
        radius: '85%',
        min: 0,
        max: 100,
        progress: { show: true, width: 8, itemStyle: { color: '#faad14' } },
        pointer: { show: true, length: '60%', width: 3 },
        axisLine: { lineStyle: { width: 8, color: [[1, 'rgba(0, 210, 255, 0.18)']] } },
        axisTick: { show: false },
        splitLine: { length: 6, lineStyle: { width: 1.5, color: '#6e87ab' } },
        axisLabel: { distance: 14, color: '#bad3f2', fontSize: 10 },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: '#faad14',
          fontSize: 18,
          fontWeight: 'bold',
          offsetCenter: [0, '70%']
        },
        data: [{ value: analysisStore.statisticalResult.conflictRate, name: '冲突保留率' }]
      }
    ]
  }
}

function renderCharts() {
  pieChart?.setOption(pieOption(), true)
  lineChart?.setOption(lineOption(), true)
  gaugeChart?.setOption(gaugeOption(), true)
}

function initCharts() {
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption(pieOption())
    // 下钻：点击类型扇区 → 跳转三维工作台并聚焦该类型首个目标
    pieChart.on('click', (params) => {
      const name = String(params.name || '')
      const typeSet: Record<string, string[]> = {
        空中目标: ['aircraft', 'air'],
        水面舰艇: ['warship', 'maritime'],
        地面设施: ['ground_facility', 'ground', 'facility']
      }
      const types = typeSet[name]
      const target = types
        ? situationStore.targets.find((t) => types.includes(t.type))
        : undefined
      if (!target) {
        ElMessage.info(`暂无可下钻的「${name}」目标`)
        return
      }
      sceneStore.showTargetAndFeatures(target.id)
      situationStore.selectedTargetId = target.id
      router.push('/workbench')
      setTimeout(() => cesiumController.focusTarget(target, 650000), 200)
      ElMessage.success(`已下钻聚焦【${target.codeName}】(${target.callsign})`)
    })
  }

  if (lineChartRef.value) {
    lineChart = echarts.init(lineChartRef.value)
    lineChart.setOption(lineOption())
  }

  if (gaugeChartRef.value) {
    gaugeChart = echarts.init(gaugeChartRef.value)
    gaugeChart.setOption(gaugeOption())
  }
}

// 口径切换/数据重算后图表实时重绘
watch(() => analysisStore.statisticalResult, renderCharts, { deep: true })

function onScopeChange(val: any) {
  analysisStore.setSourceScope(val)
  ElMessage.success('分析口径已切换，统计结果已按新口径重算')
}

function handleResize() {
  pieChart?.resize()
  lineChart?.resize()
  gaugeChart?.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  pieChart?.dispose()
  lineChart?.dispose()
  gaugeChart?.dispose()
})
</script>

<style scoped lang="scss">
.statistical-charts-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.scope-selector-bar {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 14px;

  .scope-label {
    font-size: 13px;
    font-weight: 700;
    color: #00d2ff;
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;

  .chart-card {
    display: flex;
    flex-direction: column;

    .total-tag, .conf-tag {
      font-size: 12px;
      color: #52c41a;
      font-family: var(--font-family-mono);
      font-weight: 600;
    }

    .chart-dom {
      height: 240px;
      width: 100%;
    }
  }
}
</style>
