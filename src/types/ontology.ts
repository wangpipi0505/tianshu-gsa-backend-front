/**
 * @file ontology.ts
 * @description 7大核心领域本体与知识图谱类型定义（目标、特性、事件、情报、环境、时空、证据分析）
 */

export type OntologyDomain =
  | 'Target'
  | 'TargetCharacteristic'
  | 'Event'
  | 'Intelligence'
  | 'Environment'
  | 'Spatiotemporal'
  | 'Evidence'

export interface OntologyClass {
  id: string
  name: string
  domain: OntologyDomain
  description: string
  parentClass?: string
  properties: string[]
}

export interface OntologyRelation {
  id: string
  sourceClass: string
  relationName: string
  targetClass: string
  description: string
}

export interface OntologyGraphNode {
  id: string
  name: string
  category: number
  domain: OntologyDomain
  symbolSize: number
  value: string
}

export interface OntologyGraphLink {
  source: string
  target: string
  label: string
}
