<template>
  <el-dialog
    v-model="visible"
    title="态势场景构建"
    width="460px"
    append-to-body
    :close-on-click-modal="false"
    @closed="onClosed"
  >
    <el-form label-width="96px" size="small">
      <el-form-item label="放置坐标">
        <span class="coord-readonly">东经 {{ lon.toFixed(4) }}°，北纬 {{ lat.toFixed(4) }}°</span>
      </el-form-item>
      <el-form-item label="目标名称" required>
        <el-input v-model="name" maxlength="30" show-word-limit placeholder="请输入目标名称" />
      </el-form-item>
      <el-form-item label="对象类型" required>
        <el-select v-model="objectType" style="width: 100%">
          <el-option value="aircraft" label="空中目标" />
          <el-option value="warship" label="水面舰艇" />
          <el-option value="facility" label="地面设施" />
        </el-select>
      </el-form-item>
      <el-form-item label="敌我属性" required>
        <el-radio-group v-model="affiliation">
          <el-radio value="friend">我方</el-radio>
          <el-radio value="foe">敌方</el-radio>
          <el-radio value="neutral">中立</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="高度（米）" required>
        <el-input-number v-model="altitude" :min="0" :max="30000" style="width: 100%" />
      </el-form-item>
      <el-form-item label="航速（节）">
        <el-input-number v-model="speedKnots" :min="0" :max="2000" style="width: 100%" />
      </el-form-item>
      <el-form-item label="构建说明">
        <el-input v-model="remark" type="textarea" :rows="2" maxlength="100" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button size="small" @click="cancel">取消</el-button>
      <el-button size="small" type="primary" @click="confirm">确认构建</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { applyConstructDraft } from '@/utils/constructScene'
import { cesiumController } from '@/utils/cesiumHelper'

const visible = ref(false)
const lon = ref(122.4)
const lat = ref(24.8)
const name = ref('')
const objectType = ref<'aircraft' | 'warship' | 'facility'>('aircraft')
const affiliation = ref<'friend' | 'foe' | 'neutral'>('friend')
const altitude = ref(0)
const speedKnots = ref(0)
const remark = ref('')

function resetForm() {
  name.value = ''
  objectType.value = 'aircraft'
  affiliation.value = 'friend'
  altitude.value = 0
  speedKnots.value = 0
  remark.value = ''
}

function open(nextLon: number, nextLat: number) {
  lon.value = nextLon
  lat.value = nextLat
  resetForm()
  visible.value = true
}

function cancel() {
  visible.value = false
}

function onClosed() {
  resetForm()
}

function confirm() {
  const trimmed = name.value.trim()
  if (!trimmed) {
    ElMessage.warning('请填写目标名称')
    return
  }
  const result = applyConstructDraft({
    name: trimmed,
    objectType: objectType.value,
    affiliation: affiliation.value,
    longitude: lon.value,
    latitude: lat.value,
    altitude: altitude.value,
    speedKnots: speedKnots.value,
    remark: remark.value.trim(),
    produceMode: 'manual',
    createdBy: '当前用户'
  })
  visible.value = false
  ElMessage.success(`已构建目标：${trimmed}`)
  cesiumController.flyToLocation(lon.value, lat.value, Math.max(altitude.value + 180000, 220000), 0, -89.9)
  return result
}

defineExpose({ open, cancel })
</script>

<style scoped lang="scss">
.coord-readonly {
  font-family: var(--font-family-mono);
  color: #00d2ff;
  font-size: 12px;
}
</style>
