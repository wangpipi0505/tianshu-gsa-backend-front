/**
 * @file simulationStore.ts
 * @description 场景推演状态管理（推演算法包选择、红蓝推演执行、假设性工作内容与事实同场比对）
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchAlgorithms, runSimulation as runSimulationApi } from '@/api/capability'
import { USE_MOCK, cloneMock } from '@/config/dataSource'
import { MOCK_ALGORITHM_PACKS } from '@/mock/mockSimulation'

export interface SimulationAlgorithm {
  id: string
  name: string
  version: string
  category: 'air_combat' | 'missile_penetration' | 'sensor_recon'
  description: string
  inputParams: Array<{ key: string; label: string; type: string; defaultVal: any }>
}

export const useSimulationStore = defineStore('simulation', () => {
  const algorithmPacks = ref<SimulationAlgorithm[]>([])
  const selectedAlgorithmId = ref<string>('ALG-AIR-PENETRATE-v2')
  const isRunning = ref<boolean>(false)
  const progressPercent = ref<number>(0)
  const simulatedTracks = ref<Array<{ time: string; lon: number; lat: number; alt: number; prob: number }>>([])
  // 推演调用历史（方案 5.5.8：算法包与版本、参数、时间与结果引用全程留痕）
  const runHistory = ref<Array<{
    id: string
    algorithmId: string
    algorithmName: string
    params: Record<string, unknown>
    executedAt: string
    status: 'completed'
    comparison: Array<{ dimension: string; groundTruthFact: string; simulatedHypothesis: string; diffDescription: string }>
  }>>([])
  // 最近一次推演实际使用的输入参数 (用于结果回显与比对表计算)
  const lastRunParams = ref<Record<string, unknown>>({})
  const comparisonData = ref([
    { dimension: '巡航速度', groundTruthFact: '520 节 (马赫数 0.85)', simulatedHypothesis: '尚未执行推演', diffDescription: '发起推演后将按输入参数生成假设结果' },
    { dimension: '飞行高度', groundTruthFact: '8500 米 (中高空战备巡逻)', simulatedHypothesis: '尚未执行推演', diffDescription: '发起推演后将按输入参数生成假设结果' },
    { dimension: '被发现距离', groundTruthFact: '超视距 280km 稳定跟踪', simulatedHypothesis: '尚未执行推演', diffDescription: '发起推演后将按输入参数生成假设结果' },
    { dimension: '拦截成功率', groundTruthFact: '防空圈内拦截率 92.4%', simulatedHypothesis: '尚未执行推演', diffDescription: '发起推演后将按输入参数生成假设结果' }
  ])

  function applyMock() {
    algorithmPacks.value = cloneMock(MOCK_ALGORITHM_PACKS)
    simulatedTracks.value = []
  }

  async function loadFromApi() {
    if (USE_MOCK) {
      applyMock()
      return
    }
    algorithmPacks.value = (await fetchAlgorithms()) || []
    if (algorithmPacks.value.length && !algorithmPacks.value.some((a) => a.id === selectedAlgorithmId.value)) {
      selectedAlgorithmId.value = algorithmPacks.value[0].id
    }
  }

  /** 复位推演运行状态 (重新打开推演弹窗时调用) */
  function resetRunState() {
    progressPercent.value = 0
    isRunning.value = false
  }

  /** 载入某次历史推演的差异比对与参数（供「查看差异比对」） */
  function showHistoryComparison(entry: { params: Record<string, unknown>; comparison: typeof comparisonData.value }) {
    comparisonData.value = JSON.parse(JSON.stringify(entry.comparison))
    lastRunParams.value = { ...entry.params }
    progressPercent.value = 100
  }

  async function runSimulation(inputParams?: Record<string, unknown>) {
    if (USE_MOCK) {
      isRunning.value = true
      progressPercent.value = 20
      await new Promise((resolve) => setTimeout(resolve, 400))

      // mock 推演同样按用户输入参数计算，保证"改参数 → 结果变化"的闭环
      const altitudeM = Math.max(80, Number(inputParams?.targetAltitudeM ?? 300))
      const mach = Math.max(0.6, Number(inputParams?.machSpeed ?? 1.4))
      const jamming = Boolean(inputParams?.jammingEnabled ?? true)
      lastRunParams.value = { targetAltitudeM: altitudeM, machSpeed: mach, jammingEnabled: jamming }

      const knots = Math.round(mach * 661.47)
      simulatedTracks.value = [
        { time: 'T+00:00', lon: 121.85, lat: 24.65, alt: 8500, prob: 0.12 },
        { time: 'T+05:00', lon: 121.30, lat: 24.20, alt: Math.round((8500 + altitudeM) / 2), prob: jamming ? 0.42 : 0.58 },
        { time: 'T+10:00', lon: 120.80, lat: 23.80, alt: Math.max(altitudeM, 120), prob: jamming ? 0.78 : 0.9 },
        { time: 'T+15:00', lon: 120.45, lat: 23.5, alt: Math.max(altitudeM - 150, 80), prob: jamming ? 0.94 : 0.98 }
      ]

      const detectKm = jamming ? 65 : 210
      const intercept = Math.max(20, Math.min(95, 92.4 - ((8500 - altitudeM) / 8500) * 38 - (jamming ? 18 : 0)))
      comparisonData.value = [
        {
          dimension: '巡航速度',
          groundTruthFact: '520 节 (马赫数 0.85)',
          simulatedHypothesis: `${knots} 节 (突防马赫 ${mach.toFixed(1)})`,
          diffDescription: '推演模型按设定马赫数做最大突防冲刺'
        },
        {
          dimension: '飞行高度',
          groundTruthFact: '8500 米 (中高空战备巡逻)',
          simulatedHypothesis: `下降至 ${altitudeM} 米超低空突防`,
          diffDescription: '推演利用雷达盲区开展突防'
        },
        {
          dimension: '被发现距离',
          groundTruthFact: '超视距 280km 稳定跟踪',
          simulatedHypothesis: `${jamming ? '伴随压制后缩短至' : '无干扰工况'} ${detectKm} km`,
          diffDescription: jamming ? '伴随电磁干扰压缩雷达探测包络' : '无干扰工况下保持常规探测包络'
        },
        {
          dimension: '拦截成功率',
          groundTruthFact: '防空圈内拦截率 92.4%',
          simulatedHypothesis: `该工况下拦截率约 ${intercept.toFixed(1)}%`,
          diffDescription: intercept < 75 ? '拦截率显著下降，需调派前沿战斗机拦截线' : '拦截窗口仍可覆盖该突防剖面'
        }
      ]

      runHistory.value.unshift({
        id: `RUN-${Date.now()}`,
        algorithmId: selectedAlgorithmId.value,
        algorithmName: algorithmPacks.value.find((a) => a.id === selectedAlgorithmId.value)?.name || selectedAlgorithmId.value,
        params: { ...lastRunParams.value },
        executedAt: new Date().toLocaleString(),
        status: 'completed',
        comparison: JSON.parse(JSON.stringify(comparisonData.value))
      })

      progressPercent.value = 100
      isRunning.value = false
      return
    }
    isRunning.value = true
    progressPercent.value = 20
    try {
      const result = await runSimulationApi({
        algorithmId: selectedAlgorithmId.value,
        sceneId: 'SCENE-DEFAULT-01',
        inputParams: inputParams || { targetAltitudeM: 300, jammingEnabled: true }
      })
      progressPercent.value = 100
      simulatedTracks.value = result.run?.simulatedTracks || []
      return result
    } finally {
      isRunning.value = false
    }
  }

  return {
    algorithmPacks,
    selectedAlgorithmId,
    isRunning,
    progressPercent,
    simulatedTracks,
    lastRunParams,
    runHistory,
    comparisonData,
    applyMock,
    loadFromApi,
    runSimulation,
    resetRunState,
    showHistoryComparison
  }
})
