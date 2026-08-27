<template>
  <div class="trajectory-profile-card tactical-panel">
    <div class="tactical-panel-header">
      <span>重点目标机动过程与高度速度剖面分析</span>
      <span class="target-name">{{ analysisStore.trajectoryResult.targetName }}</span>
    </div>

    <div class="trajectory-body">
      <!-- 剖面曲线图 -->
      <div ref="profileChartRef" class="profile-chart-dom"></div>

      <!-- 关键转折点与徘徊区数据 -->
      <div class="turning-points-box">
        <div class="section-title">识别出的机动关键拐点与异常徘徊空域</div>
        <div class="turning-list">
          <div
            v-for="(tp, idx) in analysisStore.trajectoryResult.turningPoints"
            :key="idx"
            class="tp-item"
          >
            <span class="time">{{ tp.time }}</span>
            <span class="loc">东经 {{ tp.location[0] }}°, 北纬 {{ tp.location[1] }}°</span>
            <span class="angle">航向突变: {{ tp.angleChangeDeg }}°</span>
          </div>
        </div>

        <div
          v-for="(lz, idx) in analysisStore.trajectoryResult.loiteringZones"
          :key="idx"
          class="loiter-item"
        >
          <span class="k">异常徘徊空域:</span>
          <span class="v">圆心(东经{{ lz.center[0] }}°, 北纬{{ lz.center[1] }}°), 半径 {{ lz.radiusKm }} 公里, 滞留持续 {{ lz.durationMinutes }} 分钟</span>
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
const profileChartRef = ref<HTMLDivElement | null>(null)
let profileChart: echarts.ECharts | null = null

function initChart() {
  if (!profileChartRef.value) return
  profileChart = echarts.init(profileChartRef.value)

  const times = analysisStore.trajectoryResult.speedProfile.map((s) => s.time)
  const speeds = analysisStore.trajectoryResult.speedProfile.map((s) => s.speed)
  const alts = analysisStore.trajectoryResult.altitudeProfile.map((a) => a.altitude)

  profileChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['飞行速度 (节)', '飞行高度 (米)'], textStyle: { color: '#bad3f2', fontSize: 12 } },
    grid: { left: '8%', right: '8%', top: '18%', bottom: '15%' },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: { lineStyle: { color: 'rgba(0, 210, 255, 0.35)' } },
      axisLabel: { color: '#bad3f2', fontSize: 11 }
    },
    yAxis: [
      {
        type: 'value',
        name: '速度 (节)',
        nameTextStyle: { color: '#00d2ff', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(0, 210, 255, 0.12)' } },
        axisLabel: { color: '#00d2ff', fontSize: 11 }
      },
      {
        type: 'value',
        name: '高度 (米)',
        nameTextStyle: { color: '#faad14', fontSize: 11 },
        splitLine: { show: false },
        axisLabel: { color: '#faad14', fontSize: 11 }
      }
    ],
    series: [
      {
        name: '飞行速度 (节)',
        type: 'line',
        smooth: true,
        data: speeds,
        lineStyle: { color: '#00d2ff', width: 2.5 },
        itemStyle: { color: '#00d2ff' }
      },
      {
        name: '飞行高度 (米)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: alts,
        lineStyle: { color: '#faad14', width: 2.5 },
        itemStyle: { color: '#faad14' }
      }
    ]
  })
}

function handleResize() {
  profileChart?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  profileChart?.dispose()
})
</script>

<style scoped lang="scss">
.trajectory-profile-card {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .target-name {
    font-size: 13px;
    font-weight: 700;
    color: #00d2ff;
  }

  .trajectory-body {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 14px;

    .profile-chart-dom {
      height: 240px;
    }

    .turning-points-box {
      background: rgba(10, 18, 32, 0.6);
      border: 1px solid rgba(0, 210, 255, 0.18);
      border-radius: 4px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 12px;

      .section-title {
        font-size: 12px;
        font-weight: 700;
        color: #00d2ff;
      }

      .turning-list {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .tp-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 8px;
          background: rgba(0, 210, 255, 0.08);
          border-radius: 3px;
          .time { color: #6e87ab; font-family: var(--font-family-mono); }
          .loc { color: #bad3f2; }
          .angle { color: #faad14; font-weight: 700; }
        }
      }

      .loiter-item {
        margin-top: 4px;
        padding: 6px 8px;
        background: rgba(255, 77, 79, 0.12);
        border: 1px solid rgba(255, 77, 79, 0.35);
        border-radius: 3px;
        .k { color: #ff4d4f; font-weight: 700; }
        .v { color: #f0f6fc; margin-left: 4px; line-height: 1.4; }
      }
    }
  }
}
</style>
