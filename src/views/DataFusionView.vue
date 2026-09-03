<template>
  <div class="data-fusion-view">
    <div class="view-header">
      <div class="header-title">
        <h2>多源时空数据融合与资产发布工作站</h2>
        <p>基准统一 ➔ 语义与关系映射 ➔ 候选关联人工确认 ➔ 态势资产发布 ➔ 数据产品包装</p>
      </div>
      <div class="header-stats">
        <el-button size="small" plain @click="router.push('/analytics')">
          前往多维统计研判 ➔
        </el-button>
        <div class="stat-card">
          <span class="num">{{ fusionStore.datasets.length }}</span>
          <span class="txt">已接入数据集</span>
        </div>
        <div class="stat-card">
          <span class="num text-cyan">{{ fusionStore.assetVersions.length }}</span>
          <span class="txt">已发布资产版本</span>
        </div>
        <div class="stat-card">
          <span class="num text-green">{{ fusionStore.productReleases.length }}</span>
          <span class="txt">已发布数据产品</span>
        </div>
      </div>
    </div>

    <div class="job-switcher tactical-panel">
      <span class="scope-label">融合工作:</span>
      <el-select v-model="fusionStore.activeJobId" size="small" style="width: 360px" @change="onSwitchJob">
        <el-option
          v-for="job in fusionStore.fusionJobs"
          :key="job.id"
          :value="job.id"
          :label="`${job.name}${job.status === 'archived' ? '（已归档）' : ''}`"
        />
      </el-select>
      <el-button size="small" type="primary" plain @click="wizardVisible = true">新建融合工作</el-button>
      <el-button size="small" :disabled="!activeJob || activeJob.status === 'archived'" @click="onArchive">归档当前工作</el-button>
    </div>

    <!-- 融合主体工作流 -->
    <div class="fusion-content-grid">
      <!-- 左侧：数据集登记与管理 -->
      <DatasetRegistry />

      <!-- 右侧：当前融合工作流与数据产品包装 -->
      <div class="fusion-workflow-card tactical-panel">
        <div class="tactical-panel-header">
          <span>当前融合工作：{{ activeJob?.name || '未选择' }}</span>
          <el-button v-if="identityStore.canDo('publish')" size="small" type="primary" @click="onPublish">发布新资产版本</el-button>
        </div>

        <div class="workflow-steps-box">
          <el-steps :active="activeJob?.currentStep ?? 1" finish-status="success" align-center size="small">
            <el-step title="1. 数据集选配" :description="`${activeJob?.datasetIds.length || 0} 个数据集`" />
            <el-step title="2. 基准统一" description="空间与时间对齐" />
            <el-step title="3. 语义映射" description="本体实体对齐" />
            <el-step title="4. 候选关联确认" :description="`${activeJob?.candidates.length || 0} 个候选`" />
            <el-step title="5. 资产发布包装" description="生成产品版本" />
          </el-steps>
        </div>

        <!-- 语义映射规则列表 -->
        <div class="rules-box">
          <div class="section-title">
            生效中的要素与关系映射规则
            <el-button size="small" @click="openRuleEditor()">新增规则</el-button>
          </div>
          <el-table :data="activeJob?.mappingRules || []" size="small">
            <el-table-column prop="sourceField" label="来源原始字段" width="140" />
            <el-table-column prop="ontologyEntity" label="本体实体类型" width="140" />
            <el-table-column prop="ontologyField" label="语义目标属性" width="140" />
            <el-table-column prop="transformType" label="转换策略" width="140" />
            <el-table-column prop="ruleDescription" label="规则描述与口径" min-width="160" />
            <el-table-column label="操作" width="140">
              <template #default="{ row }">
                <el-button size="small" text @click="openRuleEditor(row)">编辑</el-button>
                <el-button size="small" text type="danger" @click="removeRule(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="rules-box">
          <div class="section-title">映射演示</div>
          <el-select v-model="sampleKey" size="small" placeholder="选择一条来源记录" style="width: 100%" @change="runSample">
            <el-option v-for="opt in sampleOptions" :key="opt.key" :label="opt.label" :value="opt.key" />
          </el-select>
          <div v-if="sampleResult" class="sample-result">
            <div>对象类型：{{ sampleResult.objectType }}</div>
            <div>时空字段：{{ sampleResult.spatiotemporal }}</div>
            <div>关系语义：{{ sampleResult.relationHint }}</div>
            <div v-for="(v, k) in sampleResult.fields" :key="k">{{ k }} = {{ v }}</div>
          </div>
        </div>

        <div class="rules-box">
          <div class="section-title">异常处置策略（按数据源）</div>
          <div v-for="dsId in activeJob?.datasetIds || []" :key="dsId" class="policy-row">
            <span>{{ datasetName(dsId) }}</span>
            <el-select
              size="small"
              :model-value="policyOf(dsId)"
              style="width: 160px"
              @change="(v: any) => fusionStore.setExceptionStrategy(activeJob!.id, dsId, v)"
            >
              <el-option value="mark" label="标记" />
              <el-option value="drop" label="剔除" />
              <el-option value="downgrade" label="降权" />
              <el-option value="manual_fill" label="人工补录" />
            </el-select>
          </div>
        </div>

        <div class="rules-box" v-if="fusionStore.ruleChangeLogs.length">
          <div class="section-title">规则变更留痕</div>
          <div v-for="log in fusionStore.ruleChangeLogs.filter((l) => l.jobId === activeJob?.id).slice(0, 6)" :key="log.id" class="log-row">
            {{ log.createdAt }} · {{ log.summary }}
          </div>
        </div>

        <!-- 资产治理与数据产品包装 -->
        <div class="product-release-box">
          <div class="section-title">发布的态势数据产品包装</div>
          <div v-for="prod in fusionStore.productReleases" :key="prod.releaseVersion || prod.productId" class="prod-item tactical-panel">
            <div class="p-head">
              <span class="p-name">{{ prod.productName }}</span>
              <span class="p-ver">{{ prod.releaseVersion }}</span>
              <el-tag size="small" type="success">已发布至场景</el-tag>
            </div>
            <div class="p-statement">
              <div><strong>数据来源:</strong> {{ prod.statement?.sources?.join(', ') }}</div>
              <div><strong>融合口径:</strong> {{ prod.statement?.fusionScope }}</div>
              <div><strong>时空范围:</strong> {{ prod.statement?.spatialRange }} ({{ prod.statement?.timeWindow }})</div>
              <div><strong>指向资产版本:</strong> <span class="text-cyan">{{ prod.assetVersionId }}</span> (唯一事实层)</div>
              <div><strong>直连发布确认:</strong> {{ prod.statement?.confirmMode || fusionStore.confirmMode }}</div>
              <div><strong>接入通道:</strong> 已预留，接入前不开放直连入口</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="wizardVisible" title="新建融合工作" width="520px" append-to-body>
      <el-form label-width="96px" size="small">
        <el-form-item label="工作名称"><el-input v-model="wizard.name" /></el-form-item>
        <el-form-item label="业务主题"><el-input v-model="wizard.topic" /></el-form-item>
        <el-form-item label="数据集">
          <el-select v-model="wizard.datasetIds" multiple style="width: 100%">
            <el-option v-for="ds in fusionStore.datasets" :key="ds.id" :label="ds.name" :value="ds.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="空间范围"><el-input v-model="wizard.spatialRange" /></el-form-item>
        <el-form-item label="时间范围"><el-input v-model="wizard.timeText" placeholder="起始,结束" /></el-form-item>
        <el-form-item label="对象类型">
          <el-select v-model="wizard.targetTypes" multiple style="width: 100%">
            <el-option value="air" label="空中" />
            <el-option value="maritime" label="水面" />
            <el-option value="facility" label="设施" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="wizardVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="createJob">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="ruleVisible" title="映射规则" width="480px" append-to-body>
      <el-form label-width="96px" size="small">
        <el-form-item label="来源字段"><el-input v-model="ruleForm.sourceField" /></el-form-item>
        <el-form-item label="本体实体"><el-input v-model="ruleForm.ontologyEntity" /></el-form-item>
        <el-form-item label="目标属性"><el-input v-model="ruleForm.ontologyField" /></el-form-item>
        <el-form-item label="转换方式">
          <el-select v-model="ruleForm.transformType" style="width: 100%">
            <el-option value="direct" label="直接映射" />
            <el-option value="coordinate_wgs84" label="坐标 WGS84" />
            <el-option value="time_iso" label="时间 ISO" />
            <el-option value="enum_map" label="枚举映射" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明"><el-input v-model="ruleForm.ruleDescription" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="ruleVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveRule">保存并留痕</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFusionStore } from '@/stores/fusionStore'
import { useIdentityStore } from '@/stores/identityStore'
import DatasetRegistry from '@/components/fusion/DatasetRegistry.vue'
import { ElMessage } from 'element-plus'
import type { MappingRule } from '@/types/fusion'

const router = useRouter()
const fusionStore = useFusionStore()
const identityStore = useIdentityStore()
const activeJob = computed(() => fusionStore.activeJob())
const wizardVisible = ref(false)
const ruleVisible = ref(false)
const sampleKey = ref('')
const sampleResult = ref<ReturnType<typeof fusionStore.interpretSample> | null>(null)
const wizard = reactive({
  name: '',
  topic: '',
  datasetIds: [] as string[],
  spatialRange: '东南海空域',
  timeText: '2026-08-25 00:00:00,2026-08-25 15:00:00',
  targetTypes: ['air'] as string[]
})
const ruleForm = reactive<MappingRule>({
  id: '',
  sourceField: '',
  ontologyEntity: 'Target',
  ontologyField: '',
  transformType: 'direct',
  ruleDescription: ''
})

const sampleOptions = computed(() => {
  const job = activeJob.value
  if (!job) return []
  return job.datasetIds.flatMap((id) => {
    const ds = fusionStore.datasets.find((d) => d.id === id)
    return (ds?.sampleRecords || []).map((rec, idx) => ({
      key: `${id}:${idx}`,
      label: `${ds?.name} / ${rec.recordId || rec.reportId || `记录${idx + 1}`}`,
      record: rec
    }))
  })
})

function datasetName(id: string) {
  return fusionStore.datasets.find((d) => d.id === id)?.name || id
}

function policyOf(datasetId: string) {
  return activeJob.value?.exceptionPolicies?.find((p) => p.datasetId === datasetId)?.strategy || 'mark'
}

function onSwitchJob() {
  sampleKey.value = ''
  sampleResult.value = null
  ElMessage.success(`已切换至融合工作「${activeJob.value?.name || ''}」`)
}

function createJob() {
  const [start, end] = wizard.timeText.split(',').map((s) => s.trim())
  const job = fusionStore.createFusionJob({
    name: wizard.name || '新建融合工作',
    topic: wizard.topic || '多源关联',
    datasetIds: [...wizard.datasetIds],
    spatialRange: wizard.spatialRange,
    timeRange: [start || '2026-08-25 00:00:00', end || '2026-08-25 15:00:00'],
    targetTypes: [...wizard.targetTypes]
  })
  wizardVisible.value = false
  ElMessage.success(`融合工作「${job.name}」已创建，规则与候选按工作隔离`)
}

function onArchive() {
  if (!activeJob.value) return
  fusionStore.archiveJob(activeJob.value.id)
  ElMessage.success('当前融合工作已归档')
}

function openRuleEditor(row?: MappingRule) {
  Object.assign(ruleForm, row || {
    id: `R-${Date.now()}`,
    sourceField: '',
    ontologyEntity: 'Target',
    ontologyField: '',
    transformType: 'direct',
    ruleDescription: ''
  })
  if (!row) ruleForm.id = `R-${Date.now()}`
  ruleVisible.value = true
}

function saveRule() {
  if (!activeJob.value) return
  fusionStore.upsertMappingRule(activeJob.value.id, { ...ruleForm })
  ruleVisible.value = false
  ElMessage.success('规则已保存并留痕')
}

function removeRule(id: string) {
  if (!activeJob.value) return
  fusionStore.deleteMappingRule(activeJob.value.id, id)
  ElMessage.success('规则已删除并留痕')
}

function runSample(key: string) {
  const job = activeJob.value
  const opt = sampleOptions.value.find((o) => o.key === key)
  if (!job || !opt) return
  sampleResult.value = fusionStore.interpretSample(job, opt.record)
}

async function onPublish() {
  const jobId = activeJob.value?.id
  if (!jobId) {
    ElMessage.warning('没有可发布的融合工作')
    return
  }
  try {
    const result = await fusionStore.publishJob(jobId)
    ElMessage.success(`已发布资产版本 ${result.assetVersion.versionId}，数据产品 ${result.productVersion.releaseVersion}（含 ${result.assetVersion.assetCount.targets} 个作战实体快照）`)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    ElMessage.error(`发布失败：${message}`)
  }
}
</script>

<style scoped lang="scss">
.data-fusion-view {
  height: calc(100vh - 56px);
  overflow-y: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--bg-primary);
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 210, 255, 0.25);
  padding-bottom: 14px;

  .header-title {
    h2 { font-size: 20px; font-weight: 700; color: #00d2ff; }
    p { font-size: 13px; color: #6e87ab; margin-top: 4px; }
  }

  .header-stats {
    display: flex;
    gap: 14px;

    .stat-card {
      background: rgba(14, 25, 43, 0.75);
      border: 1px solid rgba(0, 210, 255, 0.25);
      padding: 8px 16px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;

      .num { font-size: 20px; font-weight: 700; font-family: var(--font-family-mono); color: #f0f6fc; }
      .txt { font-size: 11px; color: #6e87ab; }
    }
  }
}

.fusion-content-grid {
  display: grid;
  /* minmax(0,1fr) 防止表格等内容把网格列撑到视口之外（发布按钮横向不可达） */
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;

  > * {
    min-width: 0;
  }

  @media (max-width: 1280px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.fusion-workflow-card {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .workflow-steps-box {
    padding: 12px 0;
    background: rgba(10, 18, 32, 0.5);
    border-radius: 4px;
  }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #00d2ff;
    margin-bottom: 8px;
  }

  .prod-item {
    padding: 12px;
    background: rgba(10, 19, 34, 0.7);

    .p-head {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      .p-name { font-weight: 700; font-size: 14px; color: #00d2ff; }
      .p-ver { font-family: var(--font-family-mono); font-size: 12px; color: #52c41a; }
    }

    .p-statement {
      font-size: 12px;
      color: #d8e6f8;
      line-height: 1.7;
    }
  }
}

.text-cyan { color: #00d2ff !important; }
.text-green { color: #52c41a !important; }

.job-switcher {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  .scope-label { color: #00d2ff; font-size: 13px; font-weight: 700; }
}
.sample-result, .log-row, .policy-row {
  margin-top: 8px;
  font-size: 12px;
  color: #d8e6f8;
}
.policy-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
</style>
