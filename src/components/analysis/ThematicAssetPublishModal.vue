<template>
  <el-dialog
    v-model="visible"
    title="专题研判成果发布与三维图层挂载"
    width="680px"
    append-to-body
    class="thematic-publish-dialog"
  >
    <div class="publish-dialog-body">
      <div class="intro-tip">
        <el-icon class="text-cyan"><InfoFilled /></el-icon>
        <span>确认发布后，系统将自动清空地图上无关态势要素，并将提炼出的空间警戒包络与分析结论生成为标准态势研判专题挂载至图层树。</span>
      </div>

      <el-form label-position="top" size="small" class="publish-form">
        <!-- 专题成果名称 (支持自定义编辑，拒绝随机命名) -->
        <el-form-item label="专题研判成果名称">
          <el-input
            v-model="form.name"
            placeholder="请输入规范的专题研判成果名称"
            maxlength="60"
            show-word-limit
          />
        </el-form-item>

        <div class="grid-2-col">
          <el-form-item label="所属战区业务主题">
            <el-input v-model="form.theme" readonly />
          </el-form-item>
          <el-form-item label="关联核心作战实体">
            <el-input v-model="form.targetName" readonly />
          </el-form-item>
        </div>

        <!-- 提炼出的三维空间要素与包络参数 -->
        <div class="spatial-preview-card tactical-panel">
          <div class="card-title">
            <el-icon class="text-amber"><Warning /></el-icon>
            <span>提炼沉淀的三维空间警戒要素</span>
          </div>
          <div class="spatial-params-grid">
            <div class="param-item">
              <span class="k">空间要素类型:</span>
              <span class="v text-cyan">3D 异常机动徘徊管制包络体 (圆柱体)</span>
            </div>
            <div class="param-item">
              <span class="k">中心经纬度:</span>
              <span class="v">东经 {{ form.centerLon }}°, 北纬 {{ form.centerLat }}°</span>
            </div>
            <div class="param-item">
              <span class="k">警戒半径与高程:</span>
              <span class="v">半径 {{ form.radiusKm }} 公里 / 0 ~ 12,000 米</span>
            </div>
            <div class="param-item">
              <span class="k">异常持续时长:</span>
              <span class="v text-amber font-mono">{{ form.durationMinutes ? `${form.durationMinutes} 分钟` : '暂无徘徊检测结果' }}</span>
            </div>
          </div>
        </div>

        <!-- 综合研判结论与战术建议 -->
        <el-form-item label="综合研判结论与战术处置建议" style="margin-top: 12px">
          <el-input
            v-model="form.conclusion"
            type="textarea"
            :rows="3"
            placeholder="请输入研判结论与战术处置建议..."
          />
        </el-form-item>

        <div class="grid-2-col">
          <el-form-item label="所属态势场景档案">
            <el-tag size="small" type="info">{{ form.sceneName }}</el-tag>
          </el-form-item>
          <el-form-item label="挂载图层树分支">
            <el-tag size="small" type="success">【态势研判专题合集】➔ 复合分析成果</el-tag>
          </el-form-item>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button size="small" @click="visible = false">取消</el-button>
        <el-button size="small" type="primary" @click="onConfirm">
          <el-icon><Check /></el-icon>
          <span>确认发布并同步上图 (清空无关要素)</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useSceneStore } from '@/stores/sceneStore'
import { ElMessage } from 'element-plus'
import { InfoFilled, Warning, Check } from '@element-plus/icons-vue'

const emit = defineEmits(['publish'])
const visible = ref(false)
const analysisStore = useAnalysisStore()
const sceneStore = useSceneStore()

const form = reactive({
  name: '',
  theme: '',
  targetName: '',
  conclusion: '',
  sceneName: '',
  centerLon: 0,
  centerLat: 0,
  radiusKm: 0,
  durationMinutes: 0
})

function open(customData?: Partial<typeof form>) {
  // 默认值从分析结果实时注入 (轨迹剖面输出的徘徊区/目标)，而非写死剧本
  const traj = analysisStore.trajectoryResult
  const zone = traj.loiteringZones?.[0]
  const base: Partial<typeof form> = {
    name: traj.targetName ? `${traj.targetName} 异常徘徊空域与机动特征研判专题` : '',
    theme: analysisStore.currentModel.name,
    targetName: traj.targetName || '未指定目标',
    conclusion: '经轨迹剖面与关联分析，该区域机动特征异常，建议纳入重点战术警戒空域并持续跟踪。',
    sceneName: sceneStore.activeScene.name,
    centerLon: zone?.center[0] ?? 0,
    centerLat: zone?.center[1] ?? 0,
    radiusKm: zone?.radiusKm ?? 0,
    durationMinutes: zone?.durationMinutes ?? 0
  }
  Object.assign(form, base, customData || {})
  visible.value = true
}

function onConfirm() {
  if (!form.name.trim() || !form.conclusion.trim()) {
    ElMessage.warning('请填写专题成果名称与综合研判结论后再发布')
    return
  }
  emit('publish', { ...form })
  visible.value = false
}

defineExpose({
  open
})
</script>

<style scoped lang="scss">
.publish-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .intro-tip {
    font-size: 12px;
    color: #bad3f2;
    background: rgba(0, 210, 255, 0.08);
    border: 1px solid rgba(0, 210, 255, 0.2);
    padding: 8px 12px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .publish-form {
    margin-top: 4px;
  }

  .grid-2-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .spatial-preview-card {
    padding: 10px 12px;
    background: rgba(14, 25, 43, 0.7);
    border: 1px solid rgba(250, 173, 20, 0.35);
    border-radius: 4px;
    margin-bottom: 8px;

    .card-title {
      font-size: 13px;
      font-weight: 700;
      color: #faad14;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }

    .spatial-params-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 12px;

      .param-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
        .k { color: #6e87ab; font-size: 11px; }
        .v { color: #f0f6fc; font-weight: 600; }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
