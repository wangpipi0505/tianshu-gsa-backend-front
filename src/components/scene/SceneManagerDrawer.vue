<template>
  <el-drawer
    v-model="visible"
    title="态势场景工作空间管理"
    size="520px"
    direction="rtl"
  >
    <div class="scene-manager-body">
      <div class="scene-header-intro">
        态势场景是完整研判活动的工作容器，保存态势要素、工作内容与时空上下文：
      </div>

      <!-- 当前场景属性 -->
      <div class="active-scene-card tactical-panel">
        <div class="card-header">
          <span class="name">{{ sceneStore.activeScene.name }}</span>
          <el-tag size="small" type="success">当前激活</el-tag>
        </div>
        <div class="props-list">
          <div><span class="k">业务主题:</span> <span class="v">{{ sceneStore.activeScene.theme }}</span></div>
          <div><span class="k">关联数据产品:</span> <span class="v text-cyan">{{ sceneStore.activeScene.productVersionId }}</span></div>
          <div><span class="k">版本策略:</span> <span class="v">{{ sceneStore.activeScene.referenceMode === 'follow_latest' ? '跟随最新版本 (自动提醒刷新)' : '固定版本快照 (可复现)' }}</span></div>
        </div>

        <div class="card-actions">
          <el-button size="small" @click="sceneStore.toggleReferenceMode">
            切换为: {{ sceneStore.activeScene.referenceMode === 'follow_latest' ? '固定版本模式' : '跟随最新模式' }}
          </el-button>
        </div>
      </div>

      <!-- 场景列表 -->
      <div class="section-title" style="margin-top: 16px; display: flex; align-items: center; justify-content: space-between">
        <span>历史场景档案库</span>
        <el-button size="small" plain @click="fileInputRef?.click()">导入场景文件</el-button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json,application/json"
          style="display: none"
          @change="onImportFile"
        />
      </div>
      <div v-for="s in sceneStore.sceneList" :key="s.id" class="scene-item-card tactical-panel">
        <div class="s-head">
          <span class="s-name">{{ s.name }}</span>
          <span :class="['mode-tag', s.referenceMode]">
            {{ s.referenceMode === 'follow_latest' ? '跟随最新' : '固定快照' }}
          </span>
        </div>
        <div class="s-desc">{{ s.theme }}</div>
        <div class="s-meta">
          <span>空间: {{ s.spatialWindow }}</span>
          <span>时间: {{ s.timeWindow[0].split(' ')[1] }} ~ {{ s.timeWindow[1].split(' ')[1] }}</span>
        </div>
        <div class="s-actions">
          <el-button size="small" type="primary" plain @click="applyScene(s)">载入该场景</el-button>
          <el-button size="small" plain @click="openDuplicate(s)">复制派生</el-button>
        </div>
      </div>
      <!-- 复制派生弹窗 -->
      <el-dialog v-model="duplicateVisible" title="复制派生场景" width="440px" append-to-body>
        <el-form label-width="110px" size="small">
          <el-form-item label="新场景名称" required>
            <el-input v-model="duplicateName" maxlength="40" show-word-limit />
          </el-form-item>
          <el-form-item label="保留内容">
            <el-checkbox v-model="duplicateKeepWork">工作内容</el-checkbox>
            <el-checkbox v-model="duplicateKeepView">视角与图层状态</el-checkbox>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button size="small" @click="duplicateVisible = false">取消</el-button>
          <el-button size="small" type="primary" @click="confirmDuplicate">确认派生</el-button>
        </template>
      </el-dialog>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSceneStore } from '@/stores/sceneStore'
import { useFusionStore } from '@/stores/fusionStore'
import { useSituationStore } from '@/stores/situationStore'
import { cesiumController } from '@/utils/cesiumHelper'
import type { SituationalScene } from '@/types/scene'
import { ElMessage } from 'element-plus'

const visible = ref(false)
const sceneStore = useSceneStore()
const situationStore = useSituationStore()
const fusionStore = useFusionStore()

const fileInputRef = ref<HTMLInputElement | null>(null)
const duplicateVisible = ref(false)
const duplicateName = ref('')
const duplicateKeepWork = ref(true)
const duplicateKeepView = ref(true)
const duplicateSourceId = ref('')

/** 真实载入：切换激活场景 + 应用相机视角 + 聚焦场景重点目标 */
function applyScene(s: SituationalScene) {
  sceneStore.activeScene = { ...s }

  const [lon, lat, alt] = s.cameraView.destination
  cesiumController.flyToLocation(lon, lat, alt, s.cameraView.orientation.heading, s.cameraView.orientation.pitch)

  if (s.focusedTargetIds?.length) {
    situationStore.focusedTargetIds = [...s.focusedTargetIds]
    situationStore.selectedTargetId = s.focusedTargetIds[0]
  }

  visible.value = false
  ElMessage.success(`已载入态势场景「${s.name}」，相机视角与重点目标已同步应用`)
}

/** 导入场景文件：结构完整性 + 密级标识 + 引用产品版本存在性校验，未通过逐项列出 */
function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  file.text()
    .then((text) => {
      let payload: any
      try {
        payload = JSON.parse(text)
      } catch {
        ElMessage.error('导入校验未通过：文件不是有效的 JSON')
        return
      }
      const missing: string[] = []
      if (!payload?.exportVersion) missing.push('导出版本标识')
      if (!payload?.securityLevel) missing.push('密级标识')
      const scene = payload?.scene
      if (!scene) {
        missing.push('场景定义')
      } else {
        for (const key of ['id', 'name', 'theme', 'productVersionId', 'cameraView', 'timeWindow']) {
          if (!scene[key]) missing.push(`场景字段 ${key}`)
        }
        if (
          scene.productVersionId &&
          !fusionStore.productReleases.some(
            (p) => p.releaseVersion === scene.productVersionId || p.productId === scene.productVersionId
          )
        ) {
          missing.push(`引用的产品版本 ${scene.productVersionId}（本系统中不存在）`)
        }
      }
      if (missing.length) {
        ElMessage.error(`导入校验未通过：${missing.join('；')}`)
        return
      }
      const archived = sceneStore.importScene({ ...scene, id: `${scene.id}-IMPORT-${Date.now()}` })
      applyScene(archived)
      ElMessage.success(`场景「${archived.name}」导入成功，已按固定版本模式载入`)
    })
    .catch(() => ElMessage.error('场景文件读取失败'))
}

function openDuplicate(s: SituationalScene) {
  duplicateSourceId.value = s.id
  duplicateName.value = `${s.name}-派生`
  duplicateKeepWork.value = true
  duplicateKeepView.value = true
  duplicateVisible.value = true
}

function confirmDuplicate() {
  if (!duplicateName.value.trim()) {
    ElMessage.warning('请输入新场景名称')
    return
  }
  const copy = sceneStore.duplicateScene(duplicateSourceId.value, {
    name: duplicateName.value.trim(),
    keepWorkContents: duplicateKeepWork.value,
    keepViewAndLayers: duplicateKeepView.value
  })
  if (!copy) {
    ElMessage.error('派生失败：原场景不存在')
    return
  }
  duplicateVisible.value = false
  ElMessage.success(`已复制派生场景「${copy.name}」，原场景保持不变`)
}

defineExpose({
  open: () => {
    visible.value = true
  }
})
</script>

<style scoped lang="scss">
.scene-manager-body {
  display: flex;
  flex-direction: column;
  gap: 14px;

  .scene-header-intro {
    font-size: 13px;
    color: #bad3f2;
  }

  .active-scene-card {
    padding: 12px;
    background: rgba(0, 210, 255, 0.08);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      .name { font-weight: 700; font-size: 14px; color: #00d2ff; }
    }

    .props-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      .k { color: #6e87ab; }
      .v { color: #f0f6fc; margin-left: 4px; }
    }

    .card-actions {
      margin-top: 10px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #00d2ff;
  }

  .scene-item-card {
    padding: 12px;

    .s-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .s-name { font-weight: 700; font-size: 13px; color: #f0f6fc; }

      .mode-tag {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 2px;
        &.follow_latest { background: rgba(82, 196, 26, 0.2); color: #52c41a; }
        &.fixed_version { background: rgba(250, 173, 20, 0.2); color: #faad14; }
      }
    }

    .s-desc {
      font-size: 12px;
      color: #a2b7d4;
      margin: 6px 0;
    }

    .s-meta {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #6e87ab;
      font-family: var(--font-family-mono);
    }

    .s-actions {
      margin-top: 8px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
