<template>
  <el-dialog
    v-model="visible"
    title="态势场景与专题研判成果导出"
    width="720px"
    append-to-body
  >
    <div class="export-modal-body">
      <div class="export-type-selector">
        <el-radio-group v-model="exportType" size="small">
          <el-radio-button value="scene_package">场景定义数据包 (支持离线完整复原)</el-radio-button>
          <el-radio-button value="thematic_briefing">态势研判简报文件 (图文与指标汇报)</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 导出选项配置 -->
      <div class="options-box tactical-panel">
        <div class="section-title">导出内容与脱敏密级配置</div>
        <el-form label-width="140px" size="small">
          <el-form-item label="密级与脱敏策略:">
            <el-select v-model="securityLevel" style="width: 100%">
              <el-option value="internal" :label="EXPORT_RULE_SETS.internal.label + '（全量）'" />
              <el-option value="public" :label="EXPORT_RULE_SETS.public.label + '（剔除敏感项）'" />
            </el-select>
            <div class="rule-detail">
              {{ currentRule.description }}
              <span v-if="currentRule.stripped.length">将剔除：{{ currentRule.stripped.join('、') }}</span>
              <span v-else>将剔除：无</span>
            </div>
          </el-form-item>
          <el-form-item label="包含工作内容:">
            <el-checkbox v-model="includeWorkContents">包含推演假设航线与战术标绘</el-checkbox>
          </el-form-item>
          <el-form-item label="包含智能体结论:">
            <el-checkbox v-model="includeAgentConversations">包含智能研判推导结论与证据溯源</el-checkbox>
          </el-form-item>
        </el-form>
      </div>

      <!-- 导出的快照内容预览 -->
      <div class="preview-box">
        <div class="section-title">快照元数据预览</div>
        <div class="meta-preview">
          <div>场景名称: {{ sceneStore.activeScene.name }}</div>
          <div>关联产品版本: {{ sceneStore.activeScene.productVersionId }}</div>
          <div>
            包含态势要素: {{ situationStore.targets.length }} 目标, {{ situationStore.events.length }} 态势事件,
            {{ situationStore.relations.length }} 协同关系, {{ situationStore.regions.length }} 空间区域
          </div>
          <div v-if="securityLevel === 'public'" class="text-amber">
            {{ DATA_SERVICE_PUBLISH_PREFIX }}{{ currentRule.description }}；将剔除：{{ currentRule.stripped.join('、') }}
          </div>
          <div>生成时间: {{ new Date().toLocaleString() }}</div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button size="small" @click="visible = false">取消</el-button>
      <el-button size="small" type="primary" @click="doExport">
        <el-icon><Download /></el-icon>
        <span>生成并下载成果包</span>
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSceneStore } from '@/stores/sceneStore'
import { useSituationStore } from '@/stores/situationStore'
import { useAgentStore } from '@/stores/agentStore'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { DATA_SERVICE_PUBLISH_PREFIX } from '@/utils/deliveryCopy'
import { EXPORT_RULE_SETS, sanitizeExportPayload, type ExportSecurityLevel } from '@/utils/exportRules'

const visible = ref(false)
const sceneStore = useSceneStore()
const situationStore = useSituationStore()
const agentStore = useAgentStore()

const exportType = ref('scene_package')
const securityLevel = ref<ExportSecurityLevel>('internal')
const includeWorkContents = ref(true)
const includeAgentConversations = ref(true)
const currentRule = computed(() => EXPORT_RULE_SETS[securityLevel.value])

function downloadBlob(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function doExport() {
  const stamp = Date.now()

  if (exportType.value === 'thematic_briefing') {
    // 研判简报：生成 Markdown 文本汇报
    const lines: string[] = [
      `# 态势研判简报`,
      ``,
      `- 场景: ${sceneStore.activeScene.name}`,
      `- 关联产品版本: ${sceneStore.activeScene.productVersionId}`,
      `- 生成时间: ${new Date().toLocaleString()}`,
      ``,
      `## 态势要素概览`,
      `- 作战实体: ${situationStore.targets.length} 个`,
      `- 态势事件: ${situationStore.events.length} 起`,
      `- 协同/威胁关系: ${situationStore.relations.length} 条`,
      `- 空间包络区域: ${situationStore.regions.length} 个`,
      ``,
      `## 综合研判结论`,
      situationStore.activeAssessment.summaryText || '(暂无)',
      ``,
      `- 威胁等级: ${situationStore.activeAssessment.threatLevel}`,
      `- 行动建议: ${situationStore.activeAssessment.actionRecommendation || '(暂无)'}`
    ]
    if (includeAgentConversations.value) {
      lines.push('', `## 智能研判对话摘录`)
      agentStore.messages
        .filter((m) => m.sender === 'agent')
        .slice(-5)
        .forEach((m) => {
          lines.push(`> ${m.content.replace(/\n+/g, ' ').slice(0, 160)}...`)
        })
    }
    downloadBlob(lines.join('\n'), 'text/markdown', `Situation_Briefing_${stamp}.md`)
    visible.value = false
    ElMessage.success('研判简报导出成功 (Markdown 格式)')
    return
  }

  // 场景定义数据包：按密级脱敏后导出 JSON
  const exportPayload = sanitizeExportPayload(
    {
      exportVersion: '1.0.0',
      exportTime: new Date().toISOString(),
      securityLevel: securityLevel.value,
      publishPrefix: DATA_SERVICE_PUBLISH_PREFIX,
      scene: sceneStore.activeScene,
      situationAssets: {
        targets: situationStore.targets,
        events: situationStore.events,
        relations: situationStore.relations,
        regions: situationStore.regions,
        evidences: situationStore.evidences
      },
      agentConversations: includeAgentConversations.value
        ? agentStore.messages.map((m) => ({ sender: m.sender, content: m.content, timestamp: m.timestamp }))
        : [],
      workContents: includeWorkContents.value ? sceneStore.workContents : []
    },
    securityLevel.value,
    includeWorkContents.value,
    includeAgentConversations.value
  )

  downloadBlob(JSON.stringify(exportPayload, null, 2), 'application/json', `Situation_Scene_Export_${stamp}.json`)
  visible.value = false
  ElMessage.success(
    securityLevel.value === 'public'
      ? '场景数据包导出成功 (已按对外通报级脱敏)'
      : '场景数据包导出成功 (内部研判级完整数据)'
  )
}

defineExpose({
  open: () => {
    visible.value = true
  }
})
</script>

<style scoped lang="scss">
.export-modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;

  .options-box, .preview-box {
    padding: 12px;
    background: rgba(10, 18, 32, 0.6);
    border: 1px solid rgba(0, 210, 255, 0.2);
    border-radius: 4px;

    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #00d2ff;
      margin-bottom: 10px;
    }
  }

  .meta-preview {
    font-size: 12px;
    color: #bad3f2;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-family: var(--font-family-mono);

    .text-amber { color: #faad14; }
  }

  .rule-detail {
    margin-top: 6px;
    font-size: 12px;
    color: #8aa4c8;
    line-height: 1.5;
  }
}
</style>
