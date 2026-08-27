import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { OntologyClass, OntologyGraphLink, OntologyGraphNode, OntologyRelation } from '@/types/ontology'
import { fetchOntologyGraph } from '@/api/capability'
import { USE_MOCK, cloneMock } from '@/config/dataSource'
import { DOMAIN_CATEGORIES, ONTOLOGY_CLASSES, ONTOLOGY_RELATIONS, getOntologyGraphData } from '@/mock/mockOntology'

export const useOntologyStore = defineStore('ontology', () => {
  const classes = ref<OntologyClass[]>([])
  const relations = ref<OntologyRelation[]>([])
  const nodes = ref<OntologyGraphNode[]>([])
  const links = ref<OntologyGraphLink[]>([])
  const categories = ref<Array<{ name: string; domain: string; color: string }>>([])

  function applyMock() {
    classes.value = cloneMock(ONTOLOGY_CLASSES)
    relations.value = cloneMock(ONTOLOGY_RELATIONS)
    const graph = getOntologyGraphData()
    nodes.value = cloneMock(graph.nodes)
    links.value = cloneMock(graph.links)
    categories.value = cloneMock(DOMAIN_CATEGORIES)
  }

  async function loadFromApi() {
    if (USE_MOCK) {
      applyMock()
      return
    }
    const graph = await fetchOntologyGraph()
    classes.value = graph.classes || []
    relations.value = graph.relations || []
    nodes.value = graph.nodes || []
    links.value = graph.links || []
    categories.value = graph.categories || []
  }

  return { classes, relations, nodes, links, categories, applyMock, loadFromApi }
})
