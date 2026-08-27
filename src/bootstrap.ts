import { ElMessage } from 'element-plus'
import { USE_MOCK } from '@/config/dataSource'
import { useSituationStore } from '@/stores/situationStore'
import { useFusionStore } from '@/stores/fusionStore'
import { useSceneStore } from '@/stores/sceneStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useAgentStore } from '@/stores/agentStore'
import { useOntologyStore } from '@/stores/ontologyStore'

function applyAllMocks() {
  useSituationStore().applyMock()
  useFusionStore().applyMock()
  useSceneStore().applyMock()
  useAnalysisStore().applyMock()
  useSimulationStore().applyMock()
  useOntologyStore().applyMock()
  useAgentStore().applyMock()
}

export async function bootstrapWorkspace() {
  if (USE_MOCK) {
    applyAllMocks()
    return
  }

  try {
    await Promise.all([
      useSituationStore().loadSnapshot(),
      useFusionStore().loadFromApi(),
      useSceneStore().loadFromApi(),
      useOntologyStore().loadFromApi(),
      useSimulationStore().loadFromApi()
    ])
    await useAnalysisStore().loadFromApi()
    await useAgentStore().loadFromApi()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    applyAllMocks()
    ElMessage.warning(`后端不可用，已回退到本地原型数据：${message}`)
  }
}
