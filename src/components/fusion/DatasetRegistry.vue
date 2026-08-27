<template>
  <div class="dataset-registry-panel tactical-panel">
    <div class="tactical-panel-header">
      <span>已接入时空数据集列表</span>
      <el-button size="small" type="primary" @click="showRegisterDialog = true">
        <el-icon><Plus /></el-icon>
        <span>接收新数据集</span>
      </el-button>
    </div>

    <div class="dataset-table-box">
      <el-table :data="fusionStore.datasets" size="small" stripe>
        <el-table-column prop="id" label="数据集编号" width="140" />
        <el-table-column prop="name" label="数据集名称" min-width="180" />
        <el-table-column prop="topic" label="业务主题" min-width="180" />
        <el-table-column prop="source" label="传感器载荷" min-width="160" />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="recordCount" label="记录数" width="90">
          <template #default="{ row }">{{ row.recordCount }} 条</template>
        </el-table-column>
        <el-table-column prop="qualityScore" label="质检评分" width="90">
          <template #default="{ row }">
            <el-tag size="small" type="success">{{ row.qualityScore }} 分</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时空覆盖范围" min-width="220">
          <template #default="{ row }">
            <div class="coverage-cell">
              <div>{{ row.spatialCoverage }}</div>
              <div class="time-sub">{{ row.timeCoverage[0] }} ~ {{ row.timeCoverage[1] }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="previewDataset(row)">样例数据</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 样例数据抽屉 -->
    <el-drawer v-model="showPreviewDrawer" title="数据集原始记录预览" size="560px">
      <div v-if="selectedDataset" class="sample-preview-container">
        <div class="ds-meta">
          <div class="title">{{ selectedDataset.name }} ({{ selectedDataset.id }})</div>
          <div class="desc">{{ selectedDataset.topic }}</div>
          <div class="action-row">
            <el-button size="small" type="primary" plain @click="locateOnGlobe">
              <el-icon><Aim /></el-icon>
              <span>在三维地球中定位时空覆盖区与态势要素</span>
            </el-button>
          </div>
        </div>

        <div class="section-title">原始字段与属性解析</div>
        <div v-for="(rec, i) in selectedDataset.sampleRecords" :key="i" class="sample-card tactical-panel">
          <pre class="json-pre">{{ JSON.stringify(rec, null, 2) }}</pre>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFusionStore } from '@/stores/fusionStore'
import { useSituationStore } from '@/stores/situationStore'
import { useSceneStore } from '@/stores/sceneStore'
import { cesiumController } from '@/utils/cesiumHelper'
import { ElMessage } from 'element-plus'
import { Plus, Aim } from '@element-plus/icons-vue'

const router = useRouter()
const fusionStore = useFusionStore()
const situationStore = useSituationStore()
const sceneStore = useSceneStore()

const showRegisterDialog = ref(false)
const showPreviewDrawer = ref(false)
const selectedDataset = ref<any>(null)

function previewDataset(row: any) {
  selectedDataset.value = row
  showPreviewDrawer.value = true
}

/**
 * 数据驱动定位：根据选中的数据集，提取经纬度样本与关联实体，精准上图并飞往覆盖区域
 */
function locateOnGlobe() {
  if (!selectedDataset.value) return
  showPreviewDrawer.value = false

  const ds = selectedDataset.value

  // 1. 从样例记录中提取有效经纬度坐标
  const sampleCoords: Array<[number, number]> = []
  if (ds.sampleRecords && Array.isArray(ds.sampleRecords)) {
    ds.sampleRecords.forEach((r: any) => {
      if (typeof r.lon === 'number' && typeof r.lat === 'number') {
        sampleCoords.push([r.lon, r.lat])
      }
    })
  }

  // 2. 匹配与该数据集相关的作战目标实体
  const matchedTargets = situationStore.targets.filter((t) => {
    // 依据一：证据链中引用的数据集 ID
    const hasEvidenceMatch = t.evidenceIds.some((eId) => {
      const ev = situationStore.evidences.find((e) => e.id === eId)
      return ev && ev.sourceDatasetId === ds.id
    })
    if (hasEvidenceMatch) return true

    // 依据二：空间坐标邻近度匹配 (< 2.0 度)
    const hasSpatialMatch = sampleCoords.some(([sLon, sLat]) => {
      return Math.abs(sLon - t.longitude) < 2.0 && Math.abs(sLat - t.latitude) < 2.0
    })
    if (hasSpatialMatch) return true

    // 依据三：呼号或名称关键字匹配
    return ds.sampleRecords?.some((r: any) => {
      const targetClass = r.targetClass || r.entityCode || r.targetType || ''
      return targetClass && (t.callsign.includes(targetClass) || targetClass.includes(t.callsign))
    })
  })

  // 3. 匹配相关的战区多边形
  const matchedRegions = situationStore.regions.filter((r) => {
    if (sampleCoords.length === 0) return true
    return r.coordinates.some(([rLon, rLat]) => {
      return sampleCoords.some(([sLon, sLat]) => Math.abs(sLon - rLon) < 4.0 && Math.abs(sLat - rLat) < 4.0)
    })
  })

  // 4. 清理旧的弹窗标牌，严格只激活与当前数据集关联的目标实体与战区
  situationStore.openedPopupTargetIds = []
  situationStore.selectedTargetId = null

  if (matchedTargets.length > 0) {
    const targetIds = matchedTargets.map((t) => t.id)
    const regionIds = matchedRegions.map((r) => r.id)
    sceneStore.showOnlyTargetsAndFeatures(targetIds, regionIds)

    // 若恰好匹配 1 个核心目标，则特写聚焦并展开其标牌
    if (matchedTargets.length === 1) {
      situationStore.selectTarget(matchedTargets[0].id)
      situationStore.openTargetPopup(matchedTargets[0].id)
    }
  } else {
    sceneStore.showAllSituationLayers()
  }

  // 5. 跳转回三维地球工作台并飞往覆盖区域
  router.push('/')

  setTimeout(() => {
    if (sampleCoords.length > 0) {
      cesiumController.flyToCoordinates(sampleCoords, 650000)
    } else if (matchedTargets.length > 0) {
      cesiumController.flyToTargets(matchedTargets)
    }
  }, 100)

  ElMessage.success(`已联动切换至三维地球，并精准聚焦【${ds.name}】覆盖空域与关联态势要素！`)
}
</script>

<style scoped lang="scss">
.dataset-registry-panel {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dataset-table-box {
  background: rgba(10, 18, 32, 0.5);
  border-radius: 4px;
}

.coverage-cell {
  font-size: 12px;
  line-height: 1.4;
  .time-sub {
    color: #6e87ab;
    font-size: 11px;
    font-family: var(--font-family-mono);
  }
}

.sample-preview-container {
  display: flex;
  flex-direction: column;
  gap: 14px;

  .ds-meta {
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(0, 210, 255, 0.2);

    .title { font-size: 16px; font-weight: 700; color: #00d2ff; }
    .desc { font-size: 13px; color: #a2b7d4; margin-top: 4px; }
    .action-row { margin-top: 10px; }
  }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #00d2ff;
  }

  .sample-card {
    padding: 10px;
    background: rgba(10, 18, 32, 0.85);
    .json-pre {
      font-family: var(--font-family-mono);
      font-size: 12px;
      color: #73d13d;
      margin: 0;
      white-space: pre-wrap;
    }
  }
}
</style>
