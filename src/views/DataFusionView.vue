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

    <!-- 融合主体工作流 -->
    <div class="fusion-content-grid">
      <!-- 左侧：数据集登记与管理 -->
      <DatasetRegistry />

      <!-- 右侧：当前融合工作流与数据产品包装 -->
      <div class="fusion-workflow-card tactical-panel">
        <div class="tactical-panel-header">
          <span>当前融合工作流程监控 (海峡空情多源时空融合)</span>
          <el-button size="small" type="primary" @click="onPublish">发布新资产版本</el-button>
        </div>

        <div class="workflow-steps-box">
          <el-steps :active="fusionStore.fusionJobs[0]?.currentStep ?? 5" finish-status="success" align-center size="small">
            <el-step title="1. 数据集选配" :description="`${fusionStore.datasets.length} 个数据集产物`" />
            <el-step title="2. 基准统一" description="空间与时间对齐" />
            <el-step title="3. 语义映射" description="本体实体对齐" />
            <el-step title="4. 候选关联确认" description="人工研判确认" />
            <el-step title="5. 资产发布包装" description="生成产品版本" />
          </el-steps>
        </div>

        <!-- 语义映射规则列表 -->
        <div class="rules-box">
          <div class="section-title">生效中的要素与关系映射规则</div>
          <el-table :data="fusionStore.fusionJobs[0]?.mappingRules" size="small">
            <el-table-column prop="sourceField" label="来源原始字段" width="140" />
            <el-table-column prop="ontologyEntity" label="本体实体类型" width="140" />
            <el-table-column prop="ontologyField" label="语义目标属性" width="140" />
            <el-table-column prop="transformType" label="转换策略" width="140" />
            <el-table-column prop="ruleDescription" label="规则描述与口径" min-width="180" />
          </el-table>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useFusionStore } from '@/stores/fusionStore'
import DatasetRegistry from '@/components/fusion/DatasetRegistry.vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const fusionStore = useFusionStore()

async function onPublish() {
  const jobId = fusionStore.fusionJobs[0]?.id
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
</style>
