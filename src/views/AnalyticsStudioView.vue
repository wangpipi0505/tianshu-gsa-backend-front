<template>
  <div class="analytics-studio-view">
    <div class="view-header">
      <div class="header-title">
        <h2>多维情报数据分析与综合研判工作区</h2>
        <p>统计分布对比 ➔ 机动轨迹剖面 ➔ 领域本体关联 ➔ 真实态势 vs 推演比对 ➔ 专题研判成果沉淀</p>
      </div>
      <div class="header-actions">
        <el-button type="info" size="small" plain @click="goToWorkbenchWithFocus">
          <el-icon><Aim /></el-icon>
          <span>在三维地球中聚焦联动</span>
        </el-button>
        <el-button type="primary" size="small" @click="openPublishModal">
          <el-icon><DocumentAdd /></el-icon>
          <span>沉淀为专题研判成果</span>
        </el-button>
      </div>
    </div>

    <!-- 统计对比分析区 -->
    <StatisticalCharts />

    <!-- 轨迹过程分析与关联分析并排 -->
    <div class="analysis-middle-grid">
      <TrajectoryProfile />
      <AssociationGraph />
    </div>

    <!-- 真实态势事实 vs 推演假设结果同场比对 -->
    <DeductionDiffView />

    <!-- 专题研判成果发布与三维图层挂载弹窗 -->
    <ThematicAssetPublishModal
      ref="publishModalRef"
      @publish="onPublishThematicAsset"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import StatisticalCharts from '@/components/analysis/StatisticalCharts.vue'
import TrajectoryProfile from '@/components/analysis/TrajectoryProfile.vue'
import AssociationGraph from '@/components/analysis/AssociationGraph.vue'
import DeductionDiffView from '@/components/simulation/DeductionDiffView.vue'
import ThematicAssetPublishModal from '@/components/analysis/ThematicAssetPublishModal.vue'
import { useSituationStore } from '@/stores/situationStore'
import { useSceneStore } from '@/stores/sceneStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import { cesiumController } from '@/utils/cesiumHelper'
import type { SituationRegion } from '@/types/situation'
import { ElMessage } from 'element-plus'
import { DocumentAdd, Aim } from '@element-plus/icons-vue'

const router = useRouter()
const situationStore = useSituationStore()
const sceneStore = useSceneStore()
const analysisStore = useAnalysisStore()

const publishModalRef = ref<InstanceType<typeof ThematicAssetPublishModal> | null>(null)

function goToWorkbenchWithFocus() {
  const targetName = analysisStore.trajectoryResult.targetName
  const target = situationStore.targets.find(
    (t) => t.codeName.includes(targetName) || targetName.includes(t.codeName) || t.callsign.includes(targetName)
  ) || situationStore.targets[0]

  if (target) {
    sceneStore.showTargetAndFeatures(target.id)
    situationStore.openedPopupTargetIds = [target.id]
    situationStore.selectedTargetId = target.id

    router.push('/')
    setTimeout(() => {
      cesiumController.focusTarget(target, 650000)
    }, 100)
    ElMessage.success(`已联动切换至三维地球主工作台，并聚焦【${target.codeName}】(${target.callsign}) 态势与机动轨迹！`)
  } else {
    router.push('/')
  }
}

function openPublishModal() {
  publishModalRef.value?.open()
}

/**
 * 确认发布并同步上图：
 * 1. 先清空当前地图上的无关态势要素；
 * 2. 将提炼出的 3D 异常徘徊空域与研判结论动态挂载至图层树与态势存储；
 * 3. 仅聚焦显示该新增研判专题与关联核心目标；
 * 4. 平滑跳转三维地球并居中特写该研判空域。
 */
function onPublishThematicAsset(form: any) {
  const regionId = 'REG-LOITER-01'

  // 1. 构造 3D 异常徘徊警戒区多边形 (以东经123.10°, 北纬24.90° 为中心，半径 35km 的八边形包络)
  const centerLon = 123.10
  const centerLat = 24.90
  const rDeg = 0.32 // 约 35 公里地面距离

  const loiteringRegion: SituationRegion = {
    id: regionId,
    name: `【异常徘徊警戒区】${form.targetName} 机动特征研判空域`,
    color: '#ff4d4f',
    opacity: 0.55,
    minAltitude: 0,
    maxAltitude: 12000,
    coordinates: [
      [centerLon + rDeg, centerLat],
      [centerLon + rDeg * 0.7, centerLat + rDeg * 0.7],
      [centerLon, centerLat + rDeg],
      [centerLon - rDeg * 0.7, centerLat + rDeg * 0.7],
      [centerLon - rDeg, centerLat],
      [centerLon - rDeg * 0.7, centerLat - rDeg * 0.7],
      [centerLon, centerLat - rDeg],
      [centerLon + rDeg * 0.7, centerLat - rDeg * 0.7]
    ],
    thematicAttributes: {
      threatLevel: 'high',
      riskLevel: 'high',
      coverageRadiusKm: 35,
      analystNotes: form.conclusion
    }
  }

  // 2. 注入态势数据存储
  situationStore.addThematicRegion(loiteringRegion)

  // 3. 动态挂载至图层树【态势研判专题合集】
  sceneStore.addThematicAsset({
    id: 'VIPER-LOITER-2026',
    name: form.name,
    regionId: regionId,
    theme: form.theme,
    targetName: form.targetName,
    conclusion: form.conclusion
  })

  // 4. 【核心规范】：先清空当前地图上的无关要素，严格只点亮该研判专题与对应作战实体
  sceneStore.hideAllSituationLayers()
  sceneStore.showOnlyTargetsAndFeatures(['Target-001'], [regionId])

  situationStore.openedPopupTargetIds = ['Target-001']
  situationStore.selectedTargetId = 'Target-001'

  // 5. 跳转回三维地球主工作台，相机精准飞往该研判空域
  router.push('/')

  setTimeout(() => {
    cesiumController.flyToCoordinates([[centerLon, centerLat]], 550000)
  }, 100)

  ElMessage.success(`【${form.name}】已成功沉淀并发布至图层树！已清空其他无关要素，三维地球已高亮呈现该研判成果！`)
}
</script>

<style scoped lang="scss">
.analytics-studio-view {
  height: calc(100vh - 56px);
  overflow-y: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
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

  .header-actions {
    display: flex;
    gap: 10px;
  }
}

.analysis-middle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
  }
}
</style>
