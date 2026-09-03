/**
 * @file agent.ts
 * @description 地球智能体、RAG多路召回、受约束推理状态机与联动动作卡片定义
 */

import type { EvidenceItem } from '@/types/situation'

/** 智能体意图分类 (A1) */
export type IntentCategory =
  | 'query_data'
  | 'view_situation'
  | 'build_scene'
  | 'do_analysis'
  | 'do_simulation'
  | 'ask_knowledge'
  | 'thematic_analysis'
  | 'data_fusion'
  | 'simulation_deduction'

/** 可检查的问题理解预览卡片 (5.4.2) */
export interface IntentUnderstanding {
  rawPrompt: string
  intentCategory: IntentCategory
  intentTitle: string
  targetScope: string[]
  spatialScope: string
  timeScope: string
  actionSequence: string[]
  confidence: number
  isConfirmed: boolean
}

/** RAG检索类型 (12/15/16) */
export type RagSourceType =
  | 'structured_rag'
  | 'vector_rag'
  | 'graph_rag'
  | 'spatiotemporal_rag'
  | 'characteristic_rag'

/** RAG检索阶段明细 */
export interface RagStep {
  id: string
  ragType: RagSourceType
  ragTypeName: string
  query: string
  hitCount: number
  hits: Array<{
    title: string
    content: string
    score: number
    meta?: Record<string, any>
  }>
}

/** 受约束推理状态机轨迹 (23) */
export interface ReasoningTrace {
  stepNumber: number
  phaseName: string
  inference: string
  verifiedFact: string
  evidenceRefs: string[]
}

/** 智能联动动作卡片 (5.4.3) */
export interface ActionCard {
  id: string
  actionType:
    | 'fly_to_target'
    | 'highlight_layer'
    | 'render_heatmap'
    | 'run_simulation'
    | 'create_scene_draft'
    | 'generate_briefing'
    | 'focus_mideast_convoy'
    | 'focus_mideast_all'
    | 'clear_all_situations'
    | 'focus_warship'
    | 'focus_fighter'
    | 'highlight_relations'
    | 'toggle_radar_cones'
    | 'toggle_thematic_layer'
    | 'apply_weather_compensation'
    | 'start_temporal_playback'
    | 'inject_future_prediction_tracks'
    | 'start_temporal_evolution_playback'
    | 'compare_future_branches'
    | 'compare_temporal_slices'
    | 'construct_target'
  title: string
  description: string
  previewPayload: Record<string, any>
  executed: boolean
  reversible: boolean
  basisExplanation: string
}

/** 智能体会话消息 */
export interface ChatMessage {
  id: string
  sender: 'user' | 'agent' | 'system'
  content: string
  timestamp: string
  intentUnderstanding?: IntentUnderstanding
  ragSteps?: RagStep[]
  reasoningTraces?: ReasoningTrace[]
  evidenceChain?: EvidenceItem[]
  actionCards?: ActionCard[]
}
