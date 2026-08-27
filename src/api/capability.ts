import { apiGet, apiPost } from '@/api/http'
import type { OntologyClass, OntologyGraphLink, OntologyGraphNode, OntologyRelation } from '@/types/ontology'
import type { SimulationAlgorithm } from '@/stores/simulationStore'
import type { WorkContent } from '@/types/scene'

export interface OntologyGraphPayload {
  classes: OntologyClass[]
  relations: OntologyRelation[]
  nodes: OntologyGraphNode[]
  links: OntologyGraphLink[]
  categories: Array<{ name: string; domain: string; color: string }>
}

export function fetchAlgorithms() {
  return apiGet<SimulationAlgorithm[]>('/capability/algorithms')
}

export function runSimulation(body: Record<string, unknown>) {
  return apiPost<{
    run: { id: string; simulatedTracks: Array<{ time: string; lon: number; lat: number; alt: number; prob: number }> }
    workContent: WorkContent
    progressPercent: number
  }>('/simulations', body)
}

export function fetchOntologyGraph() {
  return apiGet<OntologyGraphPayload>('/ontology/graph')
}
