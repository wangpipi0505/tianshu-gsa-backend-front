<template>
  <div class="action-card-item tactical-panel">
    <div class="action-header">
      <div class="header-title">
        <el-icon class="text-cyan"><Lightning /></el-icon>
        <span class="act-title">{{ action.title }}</span>
      </div>
      <el-tag size="small" :type="action.executed ? 'success' : 'warning'">
        {{ actionStatusLabel }}
      </el-tag>
    </div>

    <div class="act-desc">{{ action.description }}</div>
    <div class="act-basis">
      <span class="k">执行依据:</span>
      <span class="v">{{ action.basisExplanation }}</span>
    </div>

    <div class="act-btn-bar">
      <el-button
        v-if="!action.executed"
        size="small"
        type="primary"
        @click="execute"
      >
        <el-icon><Check /></el-icon>
        <span>{{ actionButtonLabel }}</span>
      </el-button>

      <el-button
        v-if="action.executed && action.reversible"
        size="small"
        type="danger"
        plain
        @click="rollback"
      >
        <el-icon><RefreshLeft /></el-icon>
        <span>一键撤销</span>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ActionCard } from '@/types/agent'
import type { SourceScope } from '@/types/analysis'
import type { SituationTheater, TemporalPhase } from '@/types/situation'
import { useAgentStore } from '@/stores/agentStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useSituationStore } from '@/stores/situationStore'
import { useSceneStore } from '@/stores/sceneStore'
import { cesiumController } from '@/utils/cesiumHelper'
import { applyConstructDraft, removeConstructedItem } from '@/utils/constructScene'
import { resolveTheaterSituation } from '@/utils/theaterSituation'
import router from '@/router'
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Lightning, Check, RefreshLeft } from '@element-plus/icons-vue'

const props = defineProps<{
  action: ActionCard
}>()

const agentStore = useAgentStore()
const analysisStore = useAnalysisStore()
const situationStore = useSituationStore()
const sceneStore = useSceneStore()

const actionButtonLabel = computed(() => {
  const labels: Partial<Record<ActionCard['actionType'], string>> = {
    construct_target: '构建并上图',
    focus_theater_situation: '加载当前区域全量态势',
    open_candidate_review: '打开候选关联人工研判',
    publish_fusion_asset: '打开资产版本发布确认',
    apply_analysis_scope: '应用统计口径并重新计算',
    open_analysis_publish: '打开专题成果发布'
  }
  return labels[props.action.actionType] || '态势上图'
})

const actionStatusLabel = computed(() => {
  if (props.action.executed) {
    const labels: Partial<Record<ActionCard['actionType'], string>> = {
      construct_target: '已构建并上图',
      focus_theater_situation: '已加载区域态势',
      open_candidate_review: '已打开人工研判',
      publish_fusion_asset: '已打开发布确认',
      apply_analysis_scope: '已重新计算',
      open_analysis_publish: '已打开成果发布'
    }
    return labels[props.action.actionType] || '已态势上图'
  }
  const labels: Partial<Record<ActionCard['actionType'], string>> = {
    construct_target: '待构建',
    focus_theater_situation: '待加载区域态势',
    open_candidate_review: '待打开人工研判',
    publish_fusion_asset: '待打开发布确认',
    apply_analysis_scope: '待重新计算',
    open_analysis_publish: '待打开成果发布'
  }
  return labels[props.action.actionType] || '待确认上图'
})

async function execute() {
  if (props.action.actionType === 'focus_theater_situation') {
    const theater = props.action.previewPayload.theater as SituationTheater | undefined
    if (!theater) {
      ElMessage.warning('区域态势参数不完整，无法加载')
      return
    }
    const scope = resolveTheaterSituation(situationStore, theater)
    if (!scope.targetIds.length) {
      ElMessage.warning(`当前数据源未提供${scope.name}态势要素`)
      return
    }
    await agentStore.executeAction(props.action)
    sceneStore.showOnlySituationScope(scope)
    situationStore.openedPopupTargetIds = []
    situationStore.selectedTargetId = null
    cesiumController.flyToCoordinates(scope.focusCoordinates, 650000)
    ElMessage.success(`已加载${scope.name}全量态势：${scope.targetIds.length} 个目标、${scope.relationIds.length} 条关系、${scope.regionIds.length} 个区域、${scope.eventIds.length} 起事件`)
    return
  }

  if (props.action.actionType === 'open_candidate_review') {
    await agentStore.executeAction(props.action)
    await router.push({ path: '/fusion', query: { assistantAction: 'candidate-review' } })
    ElMessage.success('已打开候选关联人工研判，请在弹窗中逐条作出处理决定')
    return
  }

  if (props.action.actionType === 'publish_fusion_asset') {
    await agentStore.executeAction(props.action)
    await router.push({ path: '/fusion', query: { assistantAction: 'publish-asset' } })
    ElMessage.success('已打开资产版本发布确认，请在确认框中决定是否发布')
    return
  }

  if (props.action.actionType === 'apply_analysis_scope') {
    const sourceScope = props.action.previewPayload.sourceScope as SourceScope | undefined
    if (!sourceScope) {
      ElMessage.warning('统计口径参数不完整，无法重新计算')
      return
    }
    await analysisStore.setSourceScope(sourceScope)
    await agentStore.executeAction(props.action)
    await router.push('/analytics')
    ElMessage.success('已应用统计口径并完成重新计算')
    return
  }

  if (props.action.actionType === 'open_analysis_publish') {
    await agentStore.executeAction(props.action)
    await router.push({ path: '/analytics', query: { assistantAction: 'publish-thematic' } })
    ElMessage.success('已打开专题研判成果发布')
    return
  }

  await agentStore.executeAction(props.action)

  if (props.action.actionType === 'construct_target') {
    const payload = props.action.previewPayload || {}
    // 支持批量构建（targets 数组）与单目标构建
    const targetList = (Array.isArray(payload.targets) ? payload.targets : [payload]) as Array<{
      name: string; objectType: string; affiliation: string; longitude: number; latitude: number; altitude: number; speedKnots: number; remark?: string
    }>
    const constructResults = targetList.map((t) =>
      applyConstructDraft({
        name: t.name || '构建目标',
        objectType: (t.objectType as 'warship' | 'aircraft' | 'facility') || 'aircraft',
        affiliation: (t.affiliation as 'friend' | 'foe' | 'neutral') || 'friend',
        longitude: t.longitude ?? 122.4,
        latitude: t.latitude ?? 24.8,
        altitude: t.altitude ?? 0,
        speedKnots: t.speedKnots ?? 0,
        remark: t.remark || props.action.basisExplanation,
        theater: payload.theater as SituationTheater | undefined,
        produceMode: 'agent',
        createdBy: '智能业务助手'
      })
    )
    props.action.previewPayload = {
      ...payload,
      executedCount: targetList.length,
      targetIds: constructResults.map((result) => result.targetId)
    }
    const theater = payload.theater as SituationTheater | undefined
    if (theater) {
      const scope = resolveTheaterSituation(
        situationStore,
        theater,
        constructResults.map((result) => result.targetId)
      )
      sceneStore.showOnlySituationScope(scope)
      situationStore.openedPopupTargetIds = []
      situationStore.selectedTargetId = null
      cesiumController.flyToCoordinates(scope.focusCoordinates, 650000)
      ElMessage.success(`已构建 ${targetList.length} 个目标，并加载${scope.name}全量态势：${scope.targetIds.length} 个目标、${scope.relationIds.length} 条关系、${scope.regionIds.length} 个区域、${scope.eventIds.length} 起事件`)
    } else if (targetList.length) {
      cesiumController.flyToCoordinates(targetList, 650000)
      ElMessage.success(`已构建 ${targetList.length} 个目标，并按构建坐标聚焦当前态势区域`)
    }
    return
  }

  // 1. 一键清空全量态势指令
  if (props.action.actionType === 'clear_all_situations') {
    sceneStore.hideAllSituationLayers()
    situationStore.openedPopupTargetIds = []
    situationStore.selectedTargetId = null
    cesiumController.clearMeasurements()
    cesiumController.flyToLocation(116.0, 26.0, 14500000, 0, -89.9)
    ElMessage.success('态势上图成功：已清空三维数字地球上的全部态势要素、包络区与信息标牌！')
    return
  }

  // 2. 战区精准隔离判断：区分中东战区 vs 东南海峡战区 vs 未来新增战区 (严格杜绝跨战区数据混杂)
  //    战区路由仅对"聚焦类"动作生效；功能型动作 (三态切片/未来分支/回放/推演等) 必须优先走下方专属处理器
  const FOCUS_ACTION_TYPES = ['fly_to_target', 'focus_mideast_convoy', 'focus_mideast_all', 'focus_warship', 'focus_fighter']
  const isFocusAction = FOCUS_ACTION_TYPES.includes(props.action.actionType)

  const isMideastAction =
    isFocusAction &&
    (props.action.previewPayload?.theater === 'mideast' ||
      props.action.actionType.includes('mideast') ||
      (props.action.previewPayload?.targetId && props.action.previewPayload.targetId.startsWith('Target-ME')))

  const isTaiwanAction =
    isFocusAction &&
    (props.action.previewPayload?.theater === 'taiwan' ||
      props.action.actionType === 'focus_warship' ||
      props.action.actionType === 'focus_fighter' ||
      (props.action.previewPayload?.targetId && props.action.previewPayload.targetId.startsWith('Target-00')))

  if (isMideastAction) {
    // 【中东战区精准上图】：严格只激活中东作战实体与中东红黄蓝战区包络，关闭其他区域实体
    const mideastTargetIds = situationStore.targets
      .filter((t) => t.id.startsWith('Target-ME'))
      .map((t) => t.id)
    const mideastRegionIds = situationStore.regions
      .filter((r) => r.id.includes('ME'))
      .map((r) => r.id)

    sceneStore.showOnlyTargetsAndFeatures(mideastTargetIds, mideastRegionIds)

    // 单目标特写 (如焦作舰)
    if (props.action.previewPayload?.targetId) {
      const target = situationStore.targets.find((t) => t.id === props.action.previewPayload.targetId)
      if (target) {
        situationStore.openTargetPopup(target.id)
        cesiumController.focusTarget(target, 650000)
        ElMessage.success(`态势上图成功：已精准聚焦中东【${target.codeName}】(${target.callsign})，并展开战备标牌！`)
        return
      }
    }

    // 中东全战区全景上图
    const mideastTargets = situationStore.targets.filter((t) => t.id.startsWith('Target-ME'))
    cesiumController.flyToTargets(mideastTargets)
    ElMessage.success(`态势上图成功：已精准呈现中东波斯湾与霍尔木兹海峡全域 ${mideastTargets.length} 个作战实体与战区包络！`)
    return
  }

  if (isTaiwanAction) {
    // 【东南海峡战区精准上图】：严格只激活海峡作战实体与海峡战区包络，关闭中东等其他区域实体
    const taiwanTargetIds = situationStore.targets
      .filter((t) => !t.id.startsWith('Target-ME') && !t.isHypothesis)
      .map((t) => t.id)
    const taiwanRegionIds = situationStore.regions
      .filter((r) => !r.id.includes('ME'))
      .map((r) => r.id)

    sceneStore.showOnlyTargetsAndFeatures(taiwanTargetIds, taiwanRegionIds)

    // 单目标特写 (如长沙舰 / 突防战机)
    if (props.action.previewPayload?.targetId) {
      const target = situationStore.targets.find((t) => t.id === props.action.previewPayload.targetId)
      if (target) {
        situationStore.openTargetPopup(target.id)
        cesiumController.focusTarget(target, 650000)
        ElMessage.success(`态势上图成功：已精准聚焦东南海峡【${target.codeName}】(${target.callsign})，并展开态势标牌！`)
        return
      }
    }

    const taiwanTargets = situationStore.targets.filter((t) => !t.id.startsWith('Target-ME'))
    cesiumController.flyToTargets(taiwanTargets)
    ElMessage.success(`态势上图成功：已精准呈现东南海峡战区全域 ${taiwanTargets.length} 个作战实体与防空包络！`)
    return
  }

  // 3. 通用功能型上图：战术关系、雷达扫描锥、战区包络、气象补偿、4D回放与推演
  sceneStore.showAllSituationLayers()

  if (props.action.actionType === 'highlight_relations') {
    const relTargetIds = new Set<string>()
    situationStore.relations.forEach((r) => {
      relTargetIds.add(r.sourceTargetId)
      relTargetIds.add(r.targetTargetId)
    })
    const relTargets = situationStore.targets.filter((t) => relTargetIds.has(t.id))
    cesiumController.flyToTargets(relTargets.length > 0 ? relTargets : situationStore.targets)
    ElMessage.success('态势上图成功：已在三维地球点亮全部【伴飞护航】、【预警指挥】、【反舰打击】与【地导拦截】战术关系！')
    return
  }

  if (props.action.actionType === 'toggle_radar_cones') {
    situationStore.showRadarCones = true
    const radarTargets = situationStore.targets.filter((t) => t.sensorCoverage && t.sensorCoverage.radarRangeKm > 0)
    cesiumController.flyToTargets(radarTargets.length > 0 ? radarTargets : situationStore.targets)
    ElMessage.success('态势上图成功：已在三维地球投射全部实体雷达扫描立体锥与探测穹顶！')
    return
  }

  if (props.action.actionType === 'simulate_jamming') {
    situationStore.setJammingEffect(true)
    const involvedIds = new Set(
      situationStore.jammingPairs.flatMap((pair) => [pair.jammerTargetId, pair.jammedTargetId])
    )
    const involvedTargets = situationStore.targets.filter((target) => involvedIds.has(target.id))
    cesiumController.flyToTargets(involvedTargets.length ? involvedTargets : situationStore.targets)
    ElMessage.success('态势上图成功：已开启电磁对抗推演，受扰雷达覆盖将收缩并显示方位缺口与有源干扰射线！')
    return
  }

  if (props.action.actionType === 'stop_jamming') {
    situationStore.setJammingEffect(false)
    ElMessage.success('已停止电磁对抗推演，雷达覆盖恢复基准状态！')
    return
  }

  if (props.action.actionType === 'toggle_thematic_layer') {
    const allCoords = situationStore.regions.flatMap((r) => r.coordinates)
    if (allCoords.length > 0) {
      cesiumController.flyToCoordinates(allCoords, 750000)
    }
    ElMessage.success('态势上图成功：已在三维地球加载全部战区三维包络与标牌！')
    return
  }

  if (props.action.actionType === 'apply_weather_compensation') {
    situationStore.showWeatherEffect = true
    situationStore.applyWeatherCompensation()
    situationStore.mergeTargetConflict('Target-001')
    const affected = situationStore.targets.filter((t) => t.id === 'Target-001')
    cesiumController.flyToTargets(affected.length > 0 ? affected : situationStore.targets)
    ElMessage.success('态势上图成功：已开启气象仿真并完成多源融合误差补偿！')
    return
  }

  if (props.action.actionType === 'start_temporal_playback') {
    situationStore.playbackSpeed = props.action.previewPayload?.speed || 2
    situationStore.seekTime('2026-08-25 13:00:00')
    situationStore.startPlayback()
    cesiumController.flyToTargets(situationStore.targets)
    ElMessage.success('态势上图成功：4D时空动态插值回放引擎已启动！')
    return
  }

  // 4. 未来预测光轨与威胁交汇点上图
  if (props.action.actionType === 'inject_future_prediction_tracks') {
    situationStore.showFutureTracks = true
    situationStore.setTemporalMode('playback')
    const target = situationStore.targets.find((t) => t.id === 'Target-001')
    if (target) {
      situationStore.openTargetPopup(target.id)
      cesiumController.focusTarget(target, 550000)
    }
    ElMessage.success('态势上图成功：已在三维地球点亮未来 30~60 分钟预测光轨与交汇到达幽灵标牌！')
    return
  }

  // 5. 启动全过程时空演化推流回放 (13:00 ~ 16:30)
  if (props.action.actionType === 'start_temporal_evolution_playback') {
    situationStore.showFutureTracks = true
    situationStore.seekTime('2026-08-25 13:00:00')
    situationStore.playbackSpeed = props.action.previewPayload?.speed || 2
    situationStore.startPlayback()
    cesiumController.flyToTargets(situationStore.targets)
    ElMessage.success('态势上图成功：已启动【历史 ➔ 当前 ➔ 未来】4D 时空全域演化动态推流！')
    return
  }

  // 6. 未来多分支推演假说比对上图
  if (props.action.actionType === 'compare_future_branches') {
    situationStore.setTemporalMode('branches')
    situationStore.showFutureBranches = true
    const target = situationStore.targets.find((t) => t.id === 'Target-001')
    if (target) {
      cesiumController.focusTarget(target, 550000)
    }
    ElMessage.success('态势上图成功：已同屏呈现【分支A·掠海突防 (78%)】与【分支B·电磁压制 (22%)】未来推演假说！')
    return
  }

  // 7. 三态/单态时空切片上图：按 previewPayload.slicePhases 决定点亮哪几个时间切面 (缺省全开)
  if (props.action.actionType === 'compare_temporal_slices') {
    situationStore.setTemporalMode('slices')
    const phases = props.action.previewPayload?.slicePhases as TemporalPhase[] | undefined
    if (phases && phases.length > 0) {
      (['history', 'present', 'future'] as TemporalPhase[]).forEach((p) => {
        situationStore.setSliceLayer(p, phases.includes(p))
      })
    }
    const targetId = props.action.previewPayload?.targetId || situationStore.activeSliceTargetId
    const target = situationStore.targets.find((t) => t.id === targetId)
    if (target) {
      situationStore.activeSliceTargetId = target.id
      cesiumController.focusTarget(target, 600000)
    }
    const phaseNames: Record<TemporalPhase, string> = { history: '历史观测', present: '当前基准', future: '未来预测' }
    const modeText = phases && phases.length > 0
      ? phases.length === 1
        ? `单态时空切片 (仅${phaseNames[phases[0]]}切面)`
        : `${phases.length} 态时空切片 (${phases.map((p) => phaseNames[p]).join('/')})`
      : '历史、当前基准与未来预测三态时空切片'
    ElMessage.success(`态势上图成功：已在三维地球投影${modeText}，可在对比面板中切换切面图层！`)
    return
  }

  // 8. 推演假设航线上图 (与回滚中的 removeSimulationHypothesis 对称)
  if (props.action.actionType === 'run_simulation') {
    situationStore.removeSimulationHypothesis('SIM-HYPO-001')
    situationStore.injectSimulationHypothesis('SIM-HYPO-001')
    const hypo = situationStore.targets.find((t) => t.id === 'SIM-HYPO-001')
    if (hypo) {
      cesiumController.flyToTargets([hypo])
    }
    ElMessage.success('态势上图成功：低空突防推演假设航线已注入三维视窗并标记为推演工作内容！')
    return
  }

  // 默认通配
  cesiumController.flyToTargets(situationStore.targets)
}

function rollback() {
  agentStore.rollbackAction(props.action)

  if (props.action.actionType === 'construct_target') {
    const targetIds = props.action.previewPayload?.targetIds || [props.action.previewPayload?.targetId]
    targetIds.filter(Boolean).forEach((targetId: string) => removeConstructedItem(targetId))
    const theater = props.action.previewPayload?.theater as SituationTheater | undefined
    if (theater) {
      const scope = resolveTheaterSituation(situationStore, theater)
      sceneStore.showOnlySituationScope(scope)
      cesiumController.flyToCoordinates(scope.focusCoordinates, 650000)
      ElMessage.success(`已移除 ${targetIds.filter(Boolean).length} 个构建目标，保留${scope.name}全量态势`)
    } else {
      ElMessage.success(`已移除 ${targetIds.filter(Boolean).length} 个构建目标`)
    }
    return
  }

  if (props.action.actionType === 'clear_all_situations') {
    sceneStore.showAllSituationLayers()
    ElMessage.info('已恢复全域态势要素图层')
  } else if (props.action.actionType === 'inject_future_prediction_tracks') {
    situationStore.showFutureTracks = false
    ElMessage.info('已撤销未来预测光轨')
  } else if (props.action.actionType === 'start_temporal_evolution_playback') {
    situationStore.pausePlayback()
    situationStore.resetToPresent()
    ElMessage.info('已暂停时空推流并复位至当前事实基准点 15:30')
  } else if (props.action.actionType === 'compare_future_branches') {
    situationStore.showFutureBranches = false
    situationStore.setTemporalMode('playback')
    ElMessage.info('已退出多分支推演比对模式')
  } else if (props.action.actionType === 'compare_temporal_slices') {
    situationStore.toggleTemporalSlices(false)
    ElMessage.info('已退出三态时空切片对比模式')
  } else if (props.action.actionType === 'run_simulation') {
    situationStore.removeSimulationHypothesis('SIM-HYPO-001')
    ElMessage.info('已撤销推演假设航线，三维地球已恢复原始态势事实')
  } else if (props.action.actionType === 'toggle_thematic_layer') {
    sceneStore.showAllSituationLayers()
    ElMessage.info('已恢复全域图层，可勾选战区包络调整显示')
  } else if (props.action.actionType === 'start_temporal_playback') {
    situationStore.pausePlayback()
    situationStore.seekTime('2026-08-25 15:30:00')
    ElMessage.info('已暂停 4D 动态回放并复位时间轴')
  } else if (props.action.actionType === 'toggle_radar_cones') {
    ElMessage.info('雷达扫描锥图层受图层树控制，可在【图层控制】中按需显隐')
  } else if (props.action.actionType === 'simulate_jamming') {
    situationStore.setJammingEffect(false)
    ElMessage.info('已撤销电磁对抗推演，受扰雷达覆盖恢复基准状态')
  } else if (props.action.actionType === 'stop_jamming') {
    situationStore.setJammingEffect(true)
    ElMessage.info('已撤销停止操作，恢复电磁对抗推演效果')
  } else if (
    props.action.actionType === 'focus_warship' ||
    props.action.actionType === 'focus_fighter' ||
    props.action.actionType === 'focus_mideast_convoy' ||
    props.action.actionType === 'focus_mideast_all' ||
    props.action.actionType === 'focus_theater_situation' ||
    props.action.actionType === 'apply_weather_compensation'
  ) {
    // 撤销战区隔离与气象补偿：恢复被隐藏的全域图层，并还原环境基准值
    sceneStore.showAllSituationLayers()
    if (props.action.actionType === 'apply_weather_compensation') {
      situationStore.showWeatherEffect = false
      situationStore.resetEnvironment()
    }
    situationStore.openedPopupTargetIds = []
    situationStore.selectedTargetId = null
    ElMessage.info(`已撤销上图: ${props.action.title}`)
  } else {
    // 撤销上图：清空当前选中的标牌并复位视角
    situationStore.openedPopupTargetIds = []
    situationStore.selectedTargetId = null
    cesiumController.flyToLocation(116.0, 26.0, 14500000, 0, -89.9)
    ElMessage.info(`已撤销上图: ${props.action.title}`)
  }
}
</script>

<style scoped lang="scss">
.action-card-item {
  padding: 12px;
  background: rgba(14, 25, 43, 0.85);
  border: 1px solid rgba(0, 210, 255, 0.35);
  border-radius: 4px;
  margin-top: 8px;

  .action-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-title {
      display: flex;
      align-items: center;
      gap: 6px;
      .act-title { font-weight: 700; font-size: 13px; color: #00d2ff; }
    }
  }

  .act-desc {
    font-size: 12px;
    color: #f0f6fc;
    margin: 6px 0;
    line-height: 1.5;
  }

  .act-basis {
    font-size: 11px;
    color: #6e87ab;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
    .k { color: #6e87ab; }
    .v { color: #a2b7d4; margin-left: 4px; }
  }

  .act-btn-bar {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
  }
}
</style>
