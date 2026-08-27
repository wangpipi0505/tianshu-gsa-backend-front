/**
 * @file simulationStore.ts
 * @description 场景推演状态管理（推演算法包选择、红蓝推演执行、假设性工作内容与事实同场比对）
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchAlgorithms, runSimulation as runSimulationApi } from '@/api/capability'
import { USE_MOCK, cloneMock } from '@/config/dataSource'
import { MOCK_ALGORITHM_PACKS, MOCK_SIMULATED_TRACKS } from '@/mock/mockSimulation'

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
  const comparisonData = ref([
    { dimension: '巡航速度', groundTruthFact: '520 节 (马赫数 0.85)', simulatedHypothesis: '920 节 (超音速突防 M 1.4)', diffDescription: '推演模型设定为最大突防冲刺工况' },
    { dimension: '飞行高度', groundTruthFact: '8500 米 (中高空战备巡逻)', simulatedHypothesis: '150 - 500 米 (超低空掠海突防)', diffDescription: '推演利用雷达盲区开展突防' },
    { dimension: '被发现距离', groundTruthFact: '超视距 280km 稳定跟踪', simulatedHypothesis: '压制后缩短至 65km 发现', diffDescription: '伴随电磁干扰降低雷达探测包络' },
    { dimension: '拦截成功率', groundTruthFact: '防空圈内拦截率 92.4%', simulatedHypothesis: '低空突防拦截率降至 68.5%', diffDescription: '需调派前沿战斗机拦截线' }
  ])

  function applyMock() {
    algorithmPacks.value = cloneMock(MOCK_ALGORITHM_PACKS)
    simulatedTracks.value = cloneMock(MOCK_SIMULATED_TRACKS)
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

  async function runSimulation(inputParams?: Record<string, unknown>) {
    if (USE_MOCK) {
      isRunning.value = true
      progressPercent.value = 20
      await new Promise((resolve) => setTimeout(resolve, 400))
      simulatedTracks.value = cloneMock(MOCK_SIMULATED_TRACKS)
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
    comparisonData,
    applyMock,
    loadFromApi,
    runSimulation
  }
})
