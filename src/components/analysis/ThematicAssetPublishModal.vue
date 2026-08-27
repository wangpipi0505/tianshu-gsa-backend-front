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
              <span class="v">东经 123.10°, 北纬 24.90°</span>
            </div>
            <div class="param-item">
              <span class="k">警戒半径与高程:</span>
              <span class="v">半径 35 公里 / 0 ~ 12,000 米</span>
            </div>
            <div class="param-item">
              <span class="k">异常持续时长:</span>
              <span class="v text-amber font-mono">18 分钟 (识别出超视距照射意图)</span>
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
import { InfoFilled, Warning, Check } from '@element-plus/icons-vue'

const emit = defineEmits(['publish'])
const visible = ref(false)

const form = reactive({
  name: '海峡重点突防战机 (VIPER-01) 异常徘徊空域与机动特征研判专题',
  theme: '重点空中突防目标高维特征与异常空域行为分析',
  targetName: '【敌方重点突防战机】VIPER-01',
  conclusion: '经轨迹剖面与高维特征比对，该机型具备倾斜双垂尾与吸波涂层，在徘徊空域内疑似进行雷达照射与战术压制，建议将该徘徊区升级为重点战术警戒空域。',
  sceneName: '海峡空情与中东远海重点态势场景 (v2.1)'
})

function open(customData?: Partial<typeof form>) {
  if (customData) {
    Object.assign(form, customData)
  }
  visible.value = true
}

function onConfirm() {
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
