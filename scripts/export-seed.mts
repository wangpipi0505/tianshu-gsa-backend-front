import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  MOCK_TARGETS,
  MOCK_EVENTS,
  MOCK_RELATIONS,
  MOCK_REGIONS,
  MOCK_ENVIRONMENT,
  MOCK_PRIMARY_ASSESSMENT
} from '../src/mock/mockSituationAssets.ts'
import { MOCK_DATASETS } from '../src/mock/mockDatasets.ts'
import { MOCK_EVIDENCE_ITEMS } from '../src/mock/mockIntelligence.ts'
import { ONTOLOGY_CLASSES, ONTOLOGY_RELATIONS, getOntologyGraphData } from '../src/mock/mockOntology.ts'

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../tianshu-gsa-backend/server/src/main/resources/seed')
mkdirSync(outDir, { recursive: true })

function dump(name: string, data: unknown) {
  writeFileSync(resolve(outDir, name), JSON.stringify(data, null, 2), 'utf8')
}

function extractRefArray(source: string, marker: string): unknown {
  const idx = source.indexOf(marker)
  if (idx < 0) {
    throw new Error(`marker not found: ${marker}`)
  }
  const afterGeneric = source.indexOf('>(', idx)
  const start = source.indexOf('[', afterGeneric < 0 ? idx : afterGeneric)
  let depth = 0
  let inSingle = false
  let inDouble = false
  let escaped = false
  for (let i = start; i < source.length; i++) {
    const ch = source[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\' && (inSingle || inDouble)) {
      escaped = true
      continue
    }
    if (!inDouble && ch === "'") {
      inSingle = !inSingle
      continue
    }
    if (!inSingle && ch === '"') {
      inDouble = !inDouble
      continue
    }
    if (inSingle || inDouble) {
      continue
    }
    if (ch === '[') depth += 1
    if (ch === ']') {
      depth -= 1
      if (depth === 0) {
        return new Function(`return (${source.slice(start, i + 1)})`)()
      }
    }
  }
  throw new Error(`unclosed array for ${marker}`)
}

dump('targets.json', MOCK_TARGETS)
dump('events.json', MOCK_EVENTS)
dump('relations.json', MOCK_RELATIONS)
dump('regions.json', MOCK_REGIONS)
dump('environment.json', MOCK_ENVIRONMENT)
dump('assessment.json', MOCK_PRIMARY_ASSESSMENT)
dump('datasets.json', MOCK_DATASETS)
dump('evidences.json', MOCK_EVIDENCE_ITEMS)
dump('ontology-classes.json', ONTOLOGY_CLASSES)
dump('ontology-relations.json', ONTOLOGY_RELATIONS)
const graph = getOntologyGraphData()
dump('ontology-nodes.json', graph.nodes)
dump('ontology-links.json', graph.links)

const sceneSrc = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../src/stores/sceneStore.ts'), 'utf8')
dump('thematic-packages.json', extractRefArray(sceneSrc, 'const thematicPackages = ref<ThematicPackage[]>'))
dump('layers.json', extractRefArray(sceneSrc, 'const contentLayers = ref<LayerTreeNode[]>'))

console.log('seed exported to', outDir)
