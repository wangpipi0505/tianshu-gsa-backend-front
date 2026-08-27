<template>
  <el-dialog
    v-model="visible"
    title="核心领域本体与知识图谱浏览器"
    width="920px"
    append-to-body
  >
    <div class="ontology-modal-body">
      <!-- 领域分类图例栏 -->
      <div class="domains-legend">
        <div
          v-for="dom in DOMAIN_CATEGORIES"
          :key="dom.domain"
          class="legend-item"
        >
          <span class="dot" :style="{ backgroundColor: dom.color }"></span>
          <span>{{ dom.name }}</span>
        </div>
      </div>

      <!-- 知识图谱画布 -->
      <div ref="ontoGraphRef" class="onto-graph-dom"></div>

      <!-- 实体与属性说明 -->
      <div class="onto-detail-box tactical-panel">
        <div class="detail-title">数据语义转换与知识增强原理</div>
        <div class="detail-desc">
          <strong>数据中台原始字段</strong> (目标标识、传感器、散射截面、轨迹序列) ➔
          <strong>领域本体概念映射</strong> (目标实体、目标特性、态势事件) ➔
          <strong>知识增强检索</strong> ➔
          <strong>受约束逻辑推导</strong> ➔
          <strong>三维数字地球态势呈现</strong>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useOntologyStore } from '@/stores/ontologyStore'

const ontologyStore = useOntologyStore()
const DOMAIN_CATEGORIES = ontologyStore.categories

const visible = ref(false)
const ontoGraphRef = ref<HTMLDivElement | null>(null)
let ontoGraph: echarts.ECharts | null = null

function initGraph() {
  if (!ontoGraphRef.value) return
  ontoGraph = echarts.init(ontoGraphRef.value)

  const graphData = { nodes: ontologyStore.nodes, links: ontologyStore.links }

  ontoGraph.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          return `<strong>${params.data.name}</strong><br/>${params.data.value}`
        }
        return `关系: ${params.data.label}`
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        force: {
          repulsion: 420,
          edgeLength: 140
        },
        roam: true,
        label: {
          show: true,
          position: 'bottom',
          color: '#f0f6fc',
          fontSize: 12
        },
        edgeSymbol: ['circle', 'arrow'],
        edgeSymbolSize: [4, 8],
        edgeLabel: {
          show: true,
          fontSize: 11,
          color: '#bad3f2',
          formatter: (params: any) => params.data.label
        },
        data: graphData.nodes.map((n) => {
          const dom = DOMAIN_CATEGORIES[n.category]
          return {
            ...n,
            itemStyle: {
              color: dom ? dom.color : '#00d2ff',
              borderColor: '#ffffff',
              borderWidth: 1.5,
              shadowBlur: 10,
              shadowColor: dom ? dom.color : '#00d2ff'
            }
          }
        }),
        links: graphData.links.map((l) => ({
          ...l,
          lineStyle: { color: 'rgba(0, 210, 255, 0.45)', width: 1.5 }
        }))
      }
    ]
  })
}

function open() {
  visible.value = true
  nextTick(() => {
    initGraph()
  })
}

onUnmounted(() => {
  ontoGraph?.dispose()
})

defineExpose({ open })
</script>

<style scoped lang="scss">
.ontology-modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .domains-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #bad3f2;
      background: rgba(14, 25, 43, 0.7);
      padding: 4px 10px;
      border-radius: 3px;

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
    }
  }

  .onto-graph-dom {
    height: 440px;
    background: rgba(7, 12, 22, 0.7);
    border: 1px solid rgba(0, 210, 255, 0.22);
    border-radius: 4px;
  }

  .onto-detail-box {
    padding: 12px;
    background: rgba(10, 18, 32, 0.75);

    .detail-title {
      font-size: 13px;
      font-weight: 700;
      color: #00d2ff;
      margin-bottom: 6px;
    }
    .detail-desc {
      font-size: 12px;
      color: #d8e6f8;
      line-height: 1.6;
    }
  }
}
</style>
