import { ElMessage } from 'element-plus'
import { SERVICE_INTERRUPT_MESSAGE } from '@/utils/deliveryCopy'
import { fetchDemoToken } from '@/api/auth'
import { setAccessToken } from '@/api/http'
import { USE_MOCK, enableMockFallback } from '@/config/dataSource'
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
    if (!import.meta.env.VITE_PORTAL_TOKEN) {
      const issued = await fetchDemoToken()
      setAccessToken(issued.token)
    }
    await Promise.all([
      useSituationStore().loadSnapshot(),
      useFusionStore().loadFromApi(),
      useSceneStore().loadFromApi(),
      useOntologyStore().loadFromApi(),
      useSimulationStore().loadFromApi()
    ])
    await useAnalysisStore().loadFromApi()
    await useAgentStore().loadFromApi()
  } catch {
    enableMockFallback()
    applyAllMocks()
    ElMessage.warning(SERVICE_INTERRUPT_MESSAGE)
  }
}
