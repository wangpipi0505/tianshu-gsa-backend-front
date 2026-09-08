<template>
  <div class="tactical-toolbar tactical-panel">
    <!-- 图层控制抽屉开关 -->
    <el-tooltip content="展开态势图层控制抽屉" placement="bottom">
      <el-button size="small" type="primary" plain @click="emit('open-layer-drawer')">
        <el-icon><Menu /></el-icon>
        <span>图层控制</span>
      </el-button>
    </el-tooltip>

    <!-- 清空地图上的所有态势 -->
    <el-tooltip content="一键清空地图上的所有态势要素、包络区与信息标牌" placement="bottom">
      <el-button size="small" type="danger" plain @click="clearAllMapSituations">
        <el-icon><DeleteFilled /></el-icon>
        <span>清空地图态势</span>
      </el-button>
    </el-tooltip>

    <div class="divider"></div>

    <!-- 空间直线测距 -->
    <el-tooltip content="空间直线测距 (点击两点量测)" placement="bottom">
      <el-button
        size="small"
        circle
        :type="activeTool === 'distance' ? 'primary' : 'default'"
        @click="toggleTool('distance')"
      >
        <el-icon><Compass /></el-icon>
      </el-button>
    </el-tooltip>

    <!-- 多边形面积量测 -->
    <el-tooltip content="多边形面积量测 (连续左键点选，右键结束)" placement="bottom">
      <el-button
        size="small"
        circle
        :type="activeTool === 'area' ? 'primary' : 'default'"
        @click="toggleTool('area')"
      >
        <el-icon><Crop /></el-icon>
      </el-button>
    </el-tooltip>

    <!-- 战术标绘 -->
    <el-tooltip content="战术进攻箭头标绘 (左键点击两点生成)" placement="bottom">
      <el-button
        size="small"
        circle
        :type="activeTool === 'plot' ? 'primary' : 'default'"
        @click="toggleTool('plot')"
      >
        <el-icon><EditPen /></el-icon>
      </el-button>
    </el-tooltip>

    <el-tooltip v-if="identityStore.canDo('fusion')" content="态势构建：在地球上点击放置位置" placement="bottom">
      <el-button
        size="small"
        :type="activeTool === 'construct' ? 'primary' : 'default'"
        @click="startConstruct"
      >
        <el-icon><Plus /></el-icon>
        <span>态势构建</span>
      </el-button>
    </el-tooltip>

    <el-tooltip content="按空间、时间与属性组合检索" placement="bottom">
      <el-button size="small" @click="emit('open-search-drawer')">
        <el-icon><Search /></el-icon>
        <span>时空检索</span>
      </el-button>
    </el-tooltip>

    <!-- 清除量测与标绘 -->
    <el-tooltip content="清除地图上的临时量测与战术标绘" placement="bottom">
      <el-button size="small" circle @click="clearMeasurements">
        <el-icon><Delete /></el-icon>
      </el-button>
    </el-tooltip>

    <el-tooltip content="显示或关闭雷达受扰收缩、方位缺口及施扰射线" placement="bottom">
      <el-button
        size="small"
        :type="situationStore.showJammingEffect ? 'danger' : 'default'"
        plain
        @click="toggleJammingEffect"
      >
        <el-icon><Connection /></el-icon>
        <span>对抗干扰</span>
      </el-button>
    </el-tooltip>

    <div class="divider"></div>

    <!-- 视角书签 -->
    <el-dropdown trigger="click" @command="onBookmarkSelect">
      <el-button size="small">
        <el-icon><CollectionTag /></el-icon>
        <span>视角书签</span>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="bm in sceneStore.bookmarks" :key="bm.id" :command="bm">
            {{ bm.title }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 地球全貌居中复位 -->
    <el-tooltip content="复位至数字地球全局居中全貌" placement="bottom">
      <el-button size="small" circle @click="resetGlobalView">
        <el-icon><RefreshRight /></el-icon>
      </el-button>
    </el-tooltip>

    <!-- 坐标快速跳转 -->
    <el-tooltip content="经纬度坐标跳转与聚焦" placement="bottom">
      <el-button size="small" circle @click="showCoordModal = true">
        <el-icon><Aim /></el-icon>
      </el-button>
    </el-tooltip>

    <!-- 目标详情全维研判抽屉开关 (显式按钮点击打开) -->
    <el-tooltip content="点击打开目标全维特性与研判抽屉" placement="bottom">
      <el-button size="small" plain @click="emit('open-target-drawer')">
        <el-icon><Document /></el-icon>
        <span>目标研判详情</span>
      </el-button>
    </el-tooltip>

    <!-- 场景快照导出 -->
    <el-tooltip v-if="identityStore.canDo('export')" content="导出场景定义包 / 研判简报" placement="bottom">
      <el-button size="small" circle @click="onExport">
        <el-icon><Download /></el-icon>
      </el-button>
    </el-tooltip>

    <div class="divider"></div>

    <!-- 关注对象集 -->
    <el-badge
      :value="situationStore.watchedTargetIds.length"
      :hidden="!situationStore.watchedTargetIds.length"
      class="watch-badge"
    >
      <el-tooltip content="查看与管理关注对象集" placement="bottom">
        <el-button size="small" plain @click="emit('open-watch-list')">
          <el-icon><Star /></el-icon>
          <span>关注对象集</span>
        </el-button>
      </el-tooltip>
    </el-badge>

    <!-- 坐标定位弹窗 -->
    <el-dialog v-model="showCoordModal" title="坐标定位与视角跳转" width="420px" append-to-body>
      <el-form label-width="90px" size="small">
        <el-form-item label="经度 (东经)">
          <el-input-number v-model="targetLon" :min="-180" :max="180" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="纬度 (北纬)">
          <el-input-number v-model="targetLat" :min="-90" :max="90" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="视点高度(米)">
          <el-input-number v-model="targetAlt" :min="1000" :max="3000000" :step="10000" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="showCoordModal = false">取消</el-button>
        <el-button size="small" type="primary" @click="jumpToCoord">跳转定位</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSceneStore } from '@/stores/sceneStore'
import { useSituationStore } from '@/stores/situationStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useIdentityStore } from '@/stores/identityStore'
import { cesiumController } from '@/utils/cesiumHelper'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Menu,
  DeleteFilled,
  Star,
  Compass,
  Crop,
  EditPen,
  Delete,
  CollectionTag,
  RefreshRight,
  Aim,
  Document,
  Download,
  Plus,
  Search,
  Connection
} from '@element-plus/icons-vue'

const emit = defineEmits([
  'open-export-modal',
  'open-layer-drawer',
  'open-target-drawer',
  'open-search-drawer',
  'open-construct-form',
  'open-watch-list'
])

const sceneStore = useSceneStore()
const situationStore = useSituationStore()
const analysisStore = useAnalysisStore()
const identityStore = useIdentityStore()

function onExport() {
  identityStore.writeAudit('导出', '打开导出入口')
  emit('open-export-modal')
}

const activeTool = ref<string | null>(null)
const showCoordModal = ref(false)
const targetLon = ref(121.85)
const targetLat = ref(24.65)
const targetAlt = ref(120000)

/** 一键清空地图上的所有态势要素 (二次确认，避免误清后无快捷恢复) */
function clearAllMapSituations() {
  ElMessageBox.confirm(
    '将清空三维地球上的全部态势要素、包络区、信息标牌与量测标绘，可通过图层树"一键恢复"还原。是否继续？',
    '清空地图态势',
    { confirmButtonText: '确认清空', cancelButtonText: '取消', type: 'warning' }
  )
    .then(() => {
      // 1. 关闭所有态势事实、研判专题、气象环境、推演标绘图层与所有专题包 (保留基础底图)
      sceneStore.hideAllSituationLayers()

      // 2. 清空所有打开的信息标牌与当前选中目标
      situationStore.openedPopupTargetIds = []
      situationStore.selectedTargetId = null

      // 3. 退出三态/分支/光轨等时空研判模式，复位时间轴
      situationStore.toggleTemporalSlices(false)
      situationStore.showFutureBranches = false
      situationStore.showFutureTracks = false
      situationStore.setJammingEffect(false)

      // 4. 清空空间量测、战术标绘与分析上图覆盖层
      cesiumController.clearMeasurements()
      cesiumController.clearAnalysisOverlay()
      analysisStore.clearEventImpact()

      // 5. 复位至三维地球全局全貌视角
      cesiumController.flyToLocation(116.0, 26.0, 14500000, 0, -89.9)

      ElMessage.success('已清空三维数字地球上的全部态势要素、包络区与信息标牌！')
    })
    .catch(() => undefined)
}

function startConstruct() {
  if (activeTool.value === 'construct') {
    activeTool.value = null
    situationStore.pickBlocked = false
    cesiumController.clearMeasurements()
    ElMessage.info('已退出态势构建')
    return
  }
  activeTool.value = 'construct'
  situationStore.pickBlocked = true
  ElMessage.success('在地球上点击放置位置，右键取消')
  cesiumController.startPickPlacement(
    (lon, lat) => {
      activeTool.value = null
      situationStore.pickBlocked = false
      emit('open-construct-form', { lon, lat })
    },
    () => {
      activeTool.value = null
      situationStore.pickBlocked = false
      ElMessage.info('已取消态势构建')
    }
  )
}

function toggleTool(tool: string) {
  if (activeTool.value === tool) {
    activeTool.value = null
    cesiumController.clearMeasurements()
    ElMessage.info('已退出量测/标绘工具')
  } else {
    activeTool.value = tool
    if (tool === 'distance') {
      ElMessage.success('已开启空间直线测距：请在三维地球上点击起点和终点')
      cesiumController.startMeasureDistance((km) => {
        activeTool.value = null
        ElMessage.success(`测距完成：空间直线距离 ${km.toFixed(2)} 公里`)
      })
    } else if (tool === 'area') {
      ElMessage.success('已开启多边形面积量测：请左键连续点击多边形顶点，右键完成量测')
      cesiumController.startMeasureArea((sqKm) => {
        activeTool.value = null
        ElMessage.success(`测面完成：多边形面积 ${sqKm.toFixed(1)} 平方公里`)
      })
    } else if (tool === 'plot') {
      ElMessage.success('已开启战术进攻箭头标绘：请在地球上点击起点和方向终点，完成后自动保存至场景工作内容')
      cesiumController.startTacticalPlot((geometry) => {
        activeTool.value = null
        sceneStore.addPlotWorkItem({
          id: `PLOT-${Date.now()}`,
          type: 'tactical_arrow',
          label: '战术进攻箭头',
          isHypothesis: true,
          createdBy: '当前用户（手动标绘）',
          basis: '战术标绘',
          payload: {
            geometry: geometry.polygon,
            origin: geometry.origin
          },
          createdAt: new Date().toLocaleString()
        })
        ElMessage.success('标绘已生成并保存至场景工作内容，可在图层树中显隐或删除')
      })
    }
  }
}

function clearMeasurements() {
  activeTool.value = null
  cesiumController.clearMeasurements()
  ElMessage.info('已清除地图上的所有量测与临时标绘')
}

function toggleJammingEffect() {
  const next = !situationStore.showJammingEffect
  situationStore.setJammingEffect(next)
  if (!next) {
    ElMessage.info('已关闭电磁对抗干扰效果，雷达覆盖恢复基准状态')
    return
  }

  const involvedIds = Array.from(
    new Set(situationStore.jammingPairs.flatMap((pair) => [pair.jammerTargetId, pair.jammedTargetId]))
  )
  const involvedTargets = situationStore.targets.filter((target) => involvedIds.includes(target.id))
  if (involvedTargets.length > 0) {
    cesiumController.flyToTargets(involvedTargets)
  }
  ElMessage.success('已开启电磁对抗推演：受扰雷达将按时间轴显示覆盖收缩、方位缺口与施扰射线')
}

function resetGlobalView() {
  cesiumController.flyToLocation(116.0, 26.0, 14500000, 0, -89.9)
  ElMessage.success('已复位至三维数字地球全局居中全貌视角')
}

function onBookmarkSelect(bm: any) {
  cesiumController.flyToLocation(bm.destination[0], bm.destination[1], bm.destination[2], bm.headingDeg, bm.pitchDeg)
  ElMessage.success(`已切换至视角书签: ${bm.title}`)
}

function jumpToCoord() {
  cesiumController.flyToLocation(targetLon.value, targetLat.value, targetAlt.value, 0, -89.9)
  showCoordModal.value = false
  ElMessage.success(`视角已跳转至东经 ${targetLon.value}°, 北纬 ${targetLat.value}°`)
}
</script>

<style scoped lang="scss">
.tactical-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  z-index: 15;

  .divider {
    width: 1px;
    height: 18px;
    background: rgba(0, 210, 255, 0.25);
    margin: 0 4px;
  }

  @media (max-width: 1440px) {
    gap: 4px;
    padding: 4px 8px;

    .divider {
      margin: 0 2px;
    }

    :deep(.el-button--small) {
      padding: 4px 8px;
      font-size: 11px;
    }
  }
}
</style>
