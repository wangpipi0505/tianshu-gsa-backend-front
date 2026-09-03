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

    <!-- 数据集登记表单 -->
    <el-dialog v-model="showRegisterDialog" title="接收新数据集登记" width="560px" append-to-body>
      <el-form label-width="110px" size="small">
        <el-form-item label="数据集名称" required>
          <el-input v-model="registerForm.name" placeholder="请输入数据集名称" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="业务主题" required>
          <el-input v-model="registerForm.topic" placeholder="请输入业务主题" maxlength="40" />
        </el-form-item>
        <el-form-item label="来源 / 载荷">
          <el-input v-model="registerForm.source" placeholder="如：机载光电侦察吊舱 / 联合情报中心" />
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="registerForm.version" placeholder="如 v1.0" style="width: 160px" />
        </el-form-item>
        <el-form-item label="覆盖时间">
          <el-date-picker
            v-model="registerForm.coverageStart"
            type="datetime"
            placeholder="覆盖起始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
          <el-date-picker
            v-model="registerForm.coverageEnd"
            type="datetime"
            placeholder="覆盖结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%; margin-top: 4px"
          />
        </el-form-item>
        <el-form-item label="覆盖空间">
          <el-input v-model="registerForm.spatialCoverage" placeholder="如：东经118°-124°, 北纬22°-27°" />
        </el-form-item>
        <el-form-item label="主要对象类型">
          <el-select v-model="registerForm.targetTypes" multiple placeholder="请选择" style="width: 100%">
            <el-option value="空中目标" label="空中目标" />
            <el-option value="水面舰艇" label="水面舰艇" />
            <el-option value="地面设施" label="地面设施" />
            <el-option value="情报报告" label="情报报告" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容说明">
          <el-input v-model="registerForm.description" type="textarea" :rows="2" placeholder="数据内容与用途说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="showRegisterDialog = false">取消</el-button>
        <el-button size="small" type="primary" @click="confirmRegister">确认登记</el-button>
      </template>
    </el-dialog>
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

const registerForm = ref({
  name: '',
  topic: '',
  source: '',
  version: 'v1.0',
  coverageStart: '',
  coverageEnd: '',
  spatialCoverage: '',
  targetTypes: [] as string[],
  description: ''
})

function confirmRegister() {
  const f = registerForm.value
  if (!f.name.trim() || !f.topic.trim()) {
    ElMessage.warning('请填写数据集名称与业务主题后再登记')
    return
  }
  const now = new Date()
  const pad = (n: number) => (n < 10 ? `0${n}` : n)
  const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  fusionStore.registerDataset({
    id: `DS-LOCAL-${now.getTime()}`,
    name: f.name.trim(),
    topic: f.topic.trim(),
    timeCoverage: [f.coverageStart || ts, f.coverageEnd || ts],
    spatialCoverage: f.spatialCoverage || '未指定',
    targetTypes: f.targetTypes,
    source: f.source || '本地登记',
    version: f.version || 'v1.0',
    receiveTime: ts,
    recordCount: 0,
    qualityScore: 100,
    status: 'active',
    referencedByJobs: [],
    sampleRecords: f.description ? [{ description: f.description }] : []
  })
  showRegisterDialog.value = false
  registerForm.value = {
    name: '', topic: '', source: '', version: 'v1.0',
    coverageStart: '', coverageEnd: '', spatialCoverage: '',
    targetTypes: [], description: ''
  }
  ElMessage.success(`数据集「${f.name.trim()}」登记成功，可纳入融合工作`)
}

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
