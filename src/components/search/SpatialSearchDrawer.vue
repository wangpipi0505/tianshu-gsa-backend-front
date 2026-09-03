<template>
  <el-drawer
    v-model="visible"
    title="时空数据检索"
    :size="380"
    direction="ltr"
    class="spatial-search-drawer"
  >
    <div class="search-body">
      <div v-if="highlightedCount" class="highlight-bar">
        已按检索条件高亮 {{ highlightedCount }} 个目标 ·
        <el-button size="small" text type="primary" @click="clearHighlight">清除高亮</el-button>
      </div>

      <div class="section">空间条件</div>
      <div class="rect-row">
        <el-button size="small" :type="drawing ? 'primary' : 'default'" @click="startRect">圈选</el-button>
        <span class="hint">左键两点定义矩形，右键取消</span>
      </div>
      <el-form label-width="56px" size="small">
        <el-form-item label="西">
          <el-input-number v-model="west" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="东">
          <el-input-number v-model="east" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="南">
          <el-input-number v-model="south" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="北">
          <el-input-number v-model="north" :step="0.1" style="width: 100%" />
        </el-form-item>
      </el-form>

      <div class="section">时间条件</div>
      <el-form label-width="56px" size="small">
        <el-form-item label="起始">
          <el-input v-model="timeStart" />
        </el-form-item>
        <el-form-item label="结束">
          <el-input v-model="timeEnd" />
        </el-form-item>
      </el-form>

      <div class="section">属性条件</div>
      <el-checkbox-group v-model="types" class="attr-group">
        <el-checkbox value="aircraft">空中目标</el-checkbox>
        <el-checkbox value="warship">水面舰艇</el-checkbox>
        <el-checkbox value="facility">地面设施</el-checkbox>
      </el-checkbox-group>
      <el-checkbox-group v-model="affiliations" class="attr-group">
        <el-checkbox value="friend">我方</el-checkbox>
        <el-checkbox value="foe">敌方</el-checkbox>
        <el-checkbox value="neutral">中立</el-checkbox>
      </el-checkbox-group>

      <div class="section">检索方案</div>
      <div class="scheme-row">
        <el-select v-model="selectedSchemeId" placeholder="套用已保存方案" clearable size="small" @change="applyScheme">
          <el-option v-for="s in schemes" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-button size="small" @click="saveScheme">保存检索方案</el-button>
      </div>

      <el-button type="primary" class="run-btn" @click="runSearch">检索</el-button>

      <div v-if="hits" class="result-box">
        <div class="summary">命中 {{ hits.length }} 个目标</div>
        <div class="bars">
          <div v-for="bar in typeBars" :key="bar.name" class="bar-row">
            <span>{{ bar.name }}</span>
            <div class="bar"><i :style="{ width: bar.ratio + '%', background: bar.color }"></i></div>
            <span>{{ bar.count }}</span>
          </div>
        </div>
        <div v-for="hit in hits" :key="hit.target.id" class="hit-row">
          <span class="n">{{ hit.target.codeName }}</span>
          <span class="t">{{ typeLabel(hit.target.type) }}</span>
          <span class="d">{{ hit.distanceKm.toFixed(1) }} km</span>
        </div>
        <div class="result-actions">
          <el-button size="small" type="primary" @click="highlightHits">上图高亮</el-button>
          <el-button size="small" @click="sendToAnalysis">送统计分析</el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSituationStore } from '@/stores/situationStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import { cesiumController } from '@/utils/cesiumHelper'
import { normalizeTargetType, runSpatialSearch, type SearchHit } from '@/utils/spatialSearch'
import { getTargetTypeMeta } from '@/utils/formatters'

interface SavedScheme {
  id: string
  name: string
  west: number
  east: number
  south: number
  north: number
  timeStart: string
  timeEnd: string
  types: string[]
  affiliations: string[]
}

const STORAGE_KEY = 'gsa-search-schemes'
const visible = ref(false)
const drawing = ref(false)
const situationStore = useSituationStore()
const analysisStore = useAnalysisStore()
const router = useRouter()

const west = ref(118)
const east = ref(124)
const south = ref(22)
const north = ref(27)
const timeStart = ref(situationStore.timelineRange[0])
const timeEnd = ref(situationStore.timelineRange[1])
const types = ref<string[]>([])
const affiliations = ref<string[]>([])
const hits = ref<SearchHit[] | null>(null)
const schemes = ref<SavedScheme[]>(loadSchemes())
const selectedSchemeId = ref('')

const highlightedCount = computed(() => situationStore.highlightedTargetIds.length)

const typeBars = computed(() => {
  if (!hits.value) return []
  const counts = { aircraft: 0, warship: 0, facility: 0, other: 0 }
  hits.value.forEach((h) => {
    counts[normalizeTargetType(h.target.type)] += 1
  })
  const total = hits.value.length || 1
  return [
    { name: '空中', count: counts.aircraft, ratio: (counts.aircraft / total) * 100, color: '#ff4d4f' },
    { name: '水面', count: counts.warship, ratio: (counts.warship / total) * 100, color: '#00d2ff' },
    { name: '地面', count: counts.facility, ratio: (counts.facility / total) * 100, color: '#52c41a' }
  ]
})

function loadSchemes(): SavedScheme[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function typeLabel(type: string) {
  return getTargetTypeMeta(type).label
}

function open() {
  timeStart.value = situationStore.timelineRange[0]
  timeEnd.value = situationStore.timelineRange[1]
  visible.value = true
}

function startRect() {
  drawing.value = true
  situationStore.pickBlocked = true
  ElMessage.info('在地球上点击两点定义矩形，右键取消')
  cesiumController.startDrawRect(
    (rect) => {
      west.value = Number(rect.west.toFixed(4))
      east.value = Number(rect.east.toFixed(4))
      south.value = Number(rect.south.toFixed(4))
      north.value = Number(rect.north.toFixed(4))
      analysisStore.setUserRect({
        west: west.value,
        east: east.value,
        south: south.value,
        north: north.value
      })
      drawing.value = false
      situationStore.pickBlocked = false
    },
    () => {
      drawing.value = false
      situationStore.pickBlocked = false
      ElMessage.info('已取消圈选')
    }
  )
}

function currentCriteria() {
  return {
    rect: { west: west.value, east: east.value, south: south.value, north: north.value },
    timeStart: timeStart.value,
    timeEnd: timeEnd.value,
    types: [...types.value],
    affiliations: [...affiliations.value] as any
  }
}

function runSearch() {
  analysisStore.setUserRect({
    west: west.value,
    east: east.value,
    south: south.value,
    north: north.value
  })
  hits.value = runSpatialSearch(situationStore.visibleTargets.filter((t) => !t.isHypothesis), currentCriteria())
  ElMessage.success(`检索完成，命中 ${hits.value.length} 个目标`)
}

function highlightHits() {
  if (!hits.value) return
  situationStore.setSearchHighlight(hits.value.map((h) => h.target.id))
}

function clearHighlight() {
  situationStore.clearSearchHighlight()
}

function sendToAnalysis() {
  if (!hits.value) return
  analysisStore.setObjectRange(hits.value.map((h) => h.target.id), '时空检索命中')
  analysisStore.setSourceScope('fact_only')
  router.push('/analytics')
}

async function saveScheme() {
  const { value } = await ElMessageBox.prompt('请输入检索方案名称', '保存检索方案', {
    confirmButtonText: '保存',
    cancelButtonText: '取消'
  })
  const name = (value || '').trim()
  if (!name) return
  const scheme: SavedScheme = {
    id: `SCHEME-${Date.now()}`,
    name,
    west: west.value,
    east: east.value,
    south: south.value,
    north: north.value,
    timeStart: timeStart.value,
    timeEnd: timeEnd.value,
    types: [...types.value],
    affiliations: [...affiliations.value]
  }
  schemes.value.push(scheme)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schemes.value))
  ElMessage.success('检索方案已保存')
}

function applyScheme(id: string) {
  const scheme = schemes.value.find((s) => s.id === id)
  if (!scheme) return
  west.value = scheme.west
  east.value = scheme.east
  south.value = scheme.south
  north.value = scheme.north
  timeStart.value = scheme.timeStart
  timeEnd.value = scheme.timeEnd
  types.value = [...scheme.types]
  affiliations.value = [...scheme.affiliations]
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.search-body { display: flex; flex-direction: column; gap: 10px; padding-bottom: 16px; }
.section { font-size: 13px; font-weight: 700; color: #00d2ff; }
.hint { font-size: 11px; color: #6e87ab; margin-left: 8px; }
.attr-group { display: flex; flex-wrap: wrap; gap: 4px 10px; }
.run-btn { width: 100%; }
.highlight-bar { font-size: 12px; color: #ffe58f; }
.result-box { border-top: 1px solid rgba(0,210,255,0.2); padding-top: 8px; }
.summary { color: #00d2ff; font-weight: 700; margin-bottom: 8px; }
.bar-row { display: grid; grid-template-columns: 36px 1fr 24px; gap: 6px; align-items: center; font-size: 11px; color: #bad3f2; }
.bar { height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; i { display: block; height: 100%; border-radius: 3px; } }
.hit-row { display: grid; grid-template-columns: 1fr 72px 64px; gap: 6px; font-size: 12px; color: #f0f6fc; padding: 4px 0; }
.d { font-family: var(--font-family-mono); color: #00d2ff; }
.result-actions, .scheme-row, .rect-row { display: flex; gap: 8px; align-items: center; }
</style>
