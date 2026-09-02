<template>
  <div class="ontology-explorer-view">
    <!-- 顶部标题与全屏模式切换栏 -->
    <div class="view-header">
      <div class="header-title">
        <h2>核心领域本体与知识图谱浏览器</h2>
        <p>目标本体 ➔ 目标特性本体 ➔ 态势事件本体 ➔ 情报本体 ➔ 环境本体 ➔ 时空本体 ➔ 证据链本体</p>
      </div>

      <div class="header-mode-tabs">
        <el-radio-group v-model="activeViewMode" size="small" @change="onViewModeChange">
          <el-radio-button value="graph_fullscreen">
            <el-icon><Share /></el-icon>
            <span>图谱全屏视窗</span>
          </el-radio-button>
          <el-radio-button value="split_view">
            <el-icon><Grid /></el-icon>
            <span>图谱与字典分屏</span>
          </el-radio-button>
          <el-radio-button value="dict_fullscreen">
            <el-icon><Document /></el-icon>
            <span>概念字典全屏</span>
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 领域分类图例栏 -->
    <div class="domains-legend tactical-panel">
      <div class="legend-title">本体领域分类:</div>
      <div
        v-for="dom in DOMAIN_CATEGORIES"
        :key="dom.domain"
        class="legend-item"
        :class="{ active: selectedDomain === dom.domain }"
        @click="filterByDomain(dom.domain)"
      >
        <span class="dot" :style="{ backgroundColor: dom.color }"></span>
        <span>{{ dom.name }}</span>
      </div>
      <div v-if="selectedDomain" class="clear-filter" @click="selectedDomain = null">
        <el-button size="small" text type="warning">重置筛选</el-button>
      </div>
    </div>

    <!-- 主展示区 (自适应填满剩余全部屏幕空间) -->
    <div :class="['ontology-main-container', activeViewMode]">
      <!-- 1. 知识图谱画布卡片 (分屏时占 72%) -->
      <div
        v-show="activeViewMode === 'graph_fullscreen' || activeViewMode === 'split_view'"
        class="graph-card tactical-panel"
      >
        <div class="card-action-bar">
          <div class="left-tip">
            <el-icon class="text-cyan"><InfoFilled /></el-icon>
            <span>可滚轮自由缩放、鼠标拖拽探索，点击任意节点可查看该本体概念全维详情</span>
          </div>
          <div class="right-btns">
            <el-button size="small" plain @click="resetGraphZoom">
              <el-icon><Refresh /></el-icon>
              <span>重置布局</span>
            </el-button>
          </div>
        </div>
        <div ref="graphDomRef" class="graph-canvas"></div>
      </div>

      <!-- 2. 领域本体概念字典卡片 (分屏时占比最多 28% ~ 30%) -->
      <div
        v-show="activeViewMode === 'dict_fullscreen' || activeViewMode === 'split_view'"
        class="ontology-dictionary-card tactical-panel"
      >
        <div class="tactical-panel-header">
          <div class="dict-title">
            <span>本体概念字典</span>
            <el-tag size="small" type="info">{{ filteredClasses.length }} 类</el-tag>
          </div>
          <el-input
            v-model="searchKeyword"
            size="small"
            placeholder="搜索概念、属性..."
            style="width: 150px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="class-list-scroll">
          <div
            v-for="cls in filteredClasses"
            :key="cls.id"
            class="class-item"
            @click="openConceptDetail(cls)"
            title="点击查看概念实体全维详情"
          >
            <div class="cls-name">
              <div class="title-with-dot">
                <span class="dot" :style="{ backgroundColor: getDomainColor(cls.domain) }"></span>
                <span class="name">{{ cls.name }}</span>
              </div>
              <el-tag size="small" type="primary">{{ getDomainName(cls.domain) }}</el-tag>
            </div>
            <div class="cls-desc">{{ cls.description }}</div>
            <div class="cls-props">
              <span class="k">属性:</span>
              <span class="v">{{ cls.properties.join('、') }}</span>
            </div>
            <div class="view-detail-hint">
              <span>点击查看详细属性与关系定义 ➔</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 概念实体全维详情弹窗 -->
    <el-dialog
      v-model="showDetailModal"
      :title="`领域本体概念详情 | ${selectedConcept?.name || ''}`"
      width="780px"
      append-to-body
    >
      <div v-if="selectedConcept" class="concept-detail-modal-body">
        <!-- 基础元数据 -->
        <div class="detail-header-card tactical-panel">
          <div class="c-head">
            <div class="name-block">
              <span class="c-name">{{ selectedConcept.name }}</span>
              <span class="c-id">({{ selectedConcept.id }})</span>
            </div>
            <el-tag size="small" :style="{ backgroundColor: getDomainColor(selectedConcept.domain), color: '#000', fontWeight: 'bold' }">
              {{ getDomainName(selectedConcept.domain) }}
            </el-tag>
          </div>
          <div class="c-desc">{{ selectedConcept.description }}</div>
        </div>

        <!-- 核心实体属性列表 -->
        <div class="section-block tactical-panel">
          <div class="section-title">核心属性定义与语义映射</div>
          <div class="props-grid">
            <div v-for="(p, idx) in selectedConcept.properties" :key="idx" class="prop-card">
              <div class="p-name">{{ p }}</div>
            </div>
          </div>
        </div>

        <!-- 拓扑关联关系定义 -->
        <div class="section-block tactical-panel">
          <div class="section-title">领域本体拓扑关系连线</div>
          <div class="relations-list">
            <div v-for="rel in conceptRelations" :key="rel.id" class="rel-item">
              <span class="rel-source text-cyan">{{ rel.sourceName }}</span>
              <span class="rel-arrow">──【 {{ rel.relationName }} 】──▶</span>
              <span class="rel-target text-green">{{ rel.targetName }}</span>
              <div class="rel-desc">{{ rel.description }}</div>
            </div>
            <div v-if="!conceptRelations.length" class="no-rel-tip">暂无直接关联连线</div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button size="small" @click="showDetailModal = false">关闭</el-button>
        <el-button size="small" type="primary" @click="focusNodeInGraph">
          <el-icon><Aim /></el-icon>
          <span>在图谱中聚焦定位</span>
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { storeToRefs } from 'pinia'
import { useOntologyStore } from '@/stores/ontologyStore'
import type { OntologyClass } from '@/types/ontology'
import { ElMessage } from 'element-plus'
import {
  Share,
  Grid,
  Document,
  InfoFilled,
  Refresh,
  Search,
  Aim
} from '@element-plus/icons-vue'

const ontologyStore = useOntologyStore()
const { classes: ONTOLOGY_CLASSES, relations: ONTOLOGY_RELATIONS, categories: DOMAIN_CATEGORIES } = storeToRefs(ontologyStore)

function getOntologyGraphData() {
  return { nodes: ontologyStore.nodes, links: ontologyStore.links }
}

type ViewMode = 'graph_fullscreen' | 'split_view' | 'dict_fullscreen'
const activeViewMode = ref<ViewMode>('split_view')

const selectedDomain = ref<string | null>(null)
const searchKeyword = ref('')

const graphDomRef = ref<HTMLDivElement | null>(null)
let ontoChart: echarts.ECharts | null = null

const showDetailModal = ref(false)
const selectedConcept = ref<OntologyClass | null>(null)

const filteredClasses = computed(() => {
  return ONTOLOGY_CLASSES.value.filter((cls) => {
    const matchDomain = selectedDomain.value ? cls.domain === selectedDomain.value : true
    const matchKw = searchKeyword.value
      ? cls.name.includes(searchKeyword.value) ||
        cls.description.includes(searchKeyword.value) ||
        cls.properties.some((p) => p.includes(searchKeyword.value))
      : true
    return matchDomain && matchKw
  })
})

const conceptRelations = computed(() => {
  if (!selectedConcept.value) return []
  const cid = selectedConcept.value.id
  return ONTOLOGY_RELATIONS.value.filter((r) => r.sourceClass === cid || r.targetClass === cid).map((r) => {
    const src = ONTOLOGY_CLASSES.value.find((c) => c.id === r.sourceClass)
    const dst = ONTOLOGY_CLASSES.value.find((c) => c.id === r.targetClass)
    return {
      id: r.id,
      relationName: r.relationName,
      description: r.description,
      sourceName: src ? src.name : r.sourceClass,
      targetName: dst ? dst.name : r.targetClass
    }
  })
})

function getDomainColor(domain: string): string {
  const found = DOMAIN_CATEGORIES.value.find((d) => d.domain === domain)
  return found ? found.color : '#00d2ff'
}

function getDomainName(domain: string): string {
  const found = DOMAIN_CATEGORIES.value.find((d) => d.domain === domain)
  return found ? found.name : domain
}

function filterByDomain(domain: string) {
  if (selectedDomain.value === domain) {
    selectedDomain.value = null
  } else {
    selectedDomain.value = domain
  }
}

function openConceptDetail(cls: OntologyClass) {
  selectedConcept.value = cls
  showDetailModal.value = true
}

function focusNodeInGraph() {
  const concept = selectedConcept.value
  showDetailModal.value = false
  if (activeViewMode.value === 'dict_fullscreen') {
    activeViewMode.value = 'split_view'
  }
  nextTick(() => {
    if (!ontoChart || !concept) return
    handleResize()
    const nodeIndex = ontologyStore.nodes.findIndex((n) => n.id === concept.id)
    if (nodeIndex < 0) return
    // 高亮该概念节点并聚焦其邻接子图 (真实图谱定位，而非仅提示)
    ontoChart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: nodeIndex })
    ontoChart.dispatchAction({ type: 'focusNodeAdjacency', seriesIndex: 0, dataIndex: nodeIndex })
    ElMessage.success(`已在知识图谱中聚焦【${concept.name}】并高亮其邻接关系`)
  })
}

/** 图例筛选与关键词检索联动图谱：未命中概念降透明度 */
function applyGraphFilter() {
  if (!ontoChart) return
  const kw = searchKeyword.value.trim()
  const graphData = getOntologyGraphData()
  ontoChart.setOption({
    series: [
      {
        data: graphData.nodes.map((n) => {
          const cls = ONTOLOGY_CLASSES.value.find((c) => c.id === n.id)
          const dom = DOMAIN_CATEGORIES.value[n.category]
          const matchDomain = selectedDomain.value ? cls?.domain === selectedDomain.value : true
          const matchKw = kw
            ? !!cls && (cls.name.includes(kw) || cls.description.includes(kw) || cls.properties.some((p) => p.includes(kw)))
            : true
          const dimmed = !matchDomain || !matchKw
          return {
            ...n,
            itemStyle: {
              color: dom ? dom.color : '#00d2ff',
              borderColor: '#ffffff',
              borderWidth: 2,
              shadowBlur: dimmed ? 0 : 16,
              shadowColor: dom ? dom.color : '#00d2ff',
              opacity: dimmed ? 0.18 : 1
            }
          }
        })
      }
    ]
  })
}

watch([selectedDomain, searchKeyword], () => {
  applyGraphFilter()
})

function initChart() {
  if (!graphDomRef.value) return
  if (!ontoChart) {
    ontoChart = echarts.init(graphDomRef.value)
    ontoChart.on('click', (params: any) => {
      if (params.dataType === 'node') {
        const cls = ONTOLOGY_CLASSES.value.find((c) => c.id === params.data.id)
        if (cls) openConceptDetail(cls)
      }
    })
  }

  const graphData = getOntologyGraphData()

  ontoChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          return `<div style="font-weight:bold;color:#00d2ff;font-size:14px">${params.data.name}</div><div style="font-size:12px;margin-top:4px;color:#d8e6f8">${params.data.value}</div><div style="color:#faad14;font-size:11px;margin-top:4px">点击查看全维详情 ➔</div>`
        }
        return `<div style="color:#faad14;font-size:13px">语义关系: ${params.data.label}</div>`
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        force: {
          repulsion: 620,
          edgeLength: 190,
          gravity: 0.08
        },
        roam: true,
        label: {
          show: true,
          position: 'bottom',
          color: '#f0f6fc',
          fontSize: 13,
          fontWeight: 'bold',
          distance: 8
        },
        edgeSymbol: ['circle', 'arrow'],
        edgeSymbolSize: [5, 10],
        edgeLabel: {
          show: true,
          fontSize: 12,
          color: '#bad3f2',
          formatter: (params: any) => params.data.label
        },
        data: graphData.nodes.map((n) => {
          const dom = DOMAIN_CATEGORIES.value[n.category]
          return {
            ...n,
            itemStyle: {
              color: dom ? dom.color : '#00d2ff',
              borderColor: '#ffffff',
              borderWidth: 2,
              shadowBlur: 16,
              shadowColor: dom ? dom.color : '#00d2ff'
            }
          }
        }),
        links: graphData.links.map((l) => ({
          ...l,
          lineStyle: { color: 'rgba(0, 210, 255, 0.5)', width: 2 }
        }))
      }
    ]
  })
}

/** 复位图谱缩放至默认视图 (保留当前力导向布局，不重新洗牌) */
function resetGraphZoom() {
  if (!ontoChart) return
  ontoChart.setOption({ series: [{ zoom: 1 }] })
  applyGraphFilter()
  ElMessage.info('已复位图谱缩放')
}

function onViewModeChange() {
  nextTick(() => {
    handleResize()
  })
}

function handleResize() {
  ontoChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initChart()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  ontoChart?.dispose()
})
</script>

<style scoped lang="scss">
.ontology-explorer-view {
  height: calc(100vh - 56px);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--bg-primary);
  overflow: hidden;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 210, 255, 0.25);
  padding-bottom: 12px;

  .header-title {
    h2 { font-size: 20px; font-weight: 700; color: #00d2ff; }
    p { font-size: 13px; color: #6e87ab; margin-top: 3px; }
  }
}

.domains-legend {
  padding: 8px 14px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  .legend-title {
    font-size: 13px;
    font-weight: 700;
    color: #00d2ff;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #d8e6f8;
    cursor: pointer;
    padding: 3px 8px;
    border-radius: 3px;
    border: 1px solid transparent;
    transition: all 0.2s;

    &:hover {
      background: rgba(0, 210, 255, 0.15);
      color: #00d2ff;
    }

    &.active {
      background: rgba(0, 210, 255, 0.25);
      border-color: rgba(0, 210, 255, 0.6);
      color: #00d2ff;
      font-weight: 700;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
  }
}

.ontology-main-container {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
  height: 100%;

  /* 全屏知识图谱模式 */
  &.graph_fullscreen {
    .graph-card {
      flex: 1;
      width: 100%;
      height: 100%;
    }
  }

  /* 全屏概念字典模式 */
  &.dict_fullscreen {
    .ontology-dictionary-card {
      flex: 1;
      width: 100%;
      height: 100%;
    }
  }

  /* 左右分屏模式：字典占比最多 28% ~ 30%，图谱占 70% 以上 */
  &.split_view {
    .graph-card {
      flex: 1;
      height: 100%;
    }
    .ontology-dictionary-card {
      width: 28%;
      max-width: 30%;
      height: 100%;
      flex-shrink: 0;
    }
  }

  .graph-card {
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;

    .card-action-bar {
      height: 38px;
      padding: 0 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 210, 255, 0.08);
      border-bottom: 1px solid rgba(0, 210, 255, 0.2);

      .left-tip {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #bad3f2;
      }
    }

    .graph-canvas {
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 400px;
    }
  }

  .ontology-dictionary-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .dict-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }

    .class-list-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .class-item {
        background: rgba(10, 18, 32, 0.75);
        border: 1px solid rgba(0, 210, 255, 0.22);
        padding: 10px 12px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #00d2ff;
          background: rgba(0, 210, 255, 0.12);
          box-shadow: 0 0 12px rgba(0, 210, 255, 0.25);
          transform: translateY(-1px);
        }

        .cls-name {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .title-with-dot {
            display: flex;
            align-items: center;
            gap: 6px;

            .dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
            }

            .name {
              font-weight: 700;
              font-size: 14px;
              color: #00d2ff;
            }
          }
        }

        .cls-desc {
          font-size: 12px;
          color: #bad3f2;
          margin: 6px 0;
          line-height: 1.4;
        }

        .cls-props {
          font-size: 11px;
          color: #6e87ab;
          .k { color: #6e87ab; }
          .v { color: #52c41a; margin-left: 4px; }
        }

        .view-detail-hint {
          font-size: 11px;
          color: #00d2ff;
          margin-top: 6px;
          text-align: right;
          opacity: 0.8;
        }
      }
    }
  }
}

.concept-detail-modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;

  .detail-header-card {
    padding: 14px;
    background: rgba(0, 210, 255, 0.08);

    .c-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .name-block {
        display: flex;
        align-items: baseline;
        gap: 8px;

        .c-name {
          font-size: 18px;
          font-weight: 700;
          color: #00d2ff;
        }
        .c-id {
          font-size: 13px;
          color: #6e87ab;
          font-family: var(--font-family-mono);
        }
      }
    }

    .c-desc {
      font-size: 13px;
      color: #bad3f2;
      line-height: 1.5;
    }
  }

  .section-block {
    padding: 12px 14px;
    background: rgba(10, 18, 32, 0.7);

    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #00d2ff;
      margin-bottom: 10px;
      border-left: 3px solid #00d2ff;
      padding-left: 8px;
    }

    .props-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;

      .prop-card {
        padding: 8px 10px;
        background: rgba(14, 25, 43, 0.7);
        border: 1px solid rgba(0, 210, 255, 0.18);
        border-radius: 3px;

        .p-name { font-weight: 700; font-size: 13px; color: #f0f6fc; }
        .p-type { font-size: 11px; color: #52c41a; font-family: var(--font-family-mono); margin: 2px 0; }
        .p-desc { font-size: 11px; color: #6e87ab; }
      }
    }

    .relations-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .rel-item {
        padding: 8px 12px;
        background: rgba(14, 25, 43, 0.6);
        border: 1px solid rgba(0, 210, 255, 0.15);
        border-radius: 3px;
        font-size: 13px;

        .rel-arrow {
          color: #faad14;
          font-weight: 600;
          margin: 0 8px;
        }

        .rel-desc {
          font-size: 11px;
          color: #6e87ab;
          margin-top: 4px;
        }
      }

      .no-rel-tip {
        font-size: 12px;
        color: #6e87ab;
        padding: 8px 0;
      }
    }
  }
}
</style>
