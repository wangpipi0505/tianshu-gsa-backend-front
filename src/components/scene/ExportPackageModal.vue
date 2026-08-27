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
              <el-option value="internal" label="内部研判级 (包含完整高维特性与证据链条)" />
              <el-option value="public" label="对外通报级 (去除敏感雷达参数与原始载荷)" />
            </el-select>
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
          <div>包含态势要素: 6 目标, 2 态势事件, 4 协同关系, 3 空间区域</div>
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
import { ref } from 'vue'
import { useSceneStore } from '@/stores/sceneStore'
import { useSituationStore } from '@/stores/situationStore'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'

const visible = ref(false)
const sceneStore = useSceneStore()
const situationStore = useSituationStore()

const exportType = ref('scene_package')
const securityLevel = ref('internal')
const includeWorkContents = ref(true)
const includeAgentConversations = ref(true)

function doExport() {
  const exportPayload = {
    exportVersion: '1.0.0',
    exportTime: new Date().toISOString(),
    securityLevel: securityLevel.value,
    scene: sceneStore.activeScene,
    situationAssets: {
      targets: situationStore.targets,
      events: situationStore.events,
      relations: situationStore.relations,
      regions: situationStore.regions,
      evidences: situationStore.evidences
    },
    workContents: includeWorkContents.value ? sceneStore.workContents : []
  }

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Situation_Scene_Export_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  visible.value = false
  ElMessage.success('成果文件导出成功！已留存审计记录')
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
  }
}
</style>
