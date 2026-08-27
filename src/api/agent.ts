import { apiGet, apiPost } from '@/api/http'
import type { ChatMessage } from '@/types/agent'

export interface AgentSession {
  id: string
  sceneId?: string
}

export function fetchAgentSessions() {
  return apiGet<AgentSession[]>('/agent/sessions')
}

export function createAgentSession(sceneId?: string) {
  return apiPost<AgentSession>('/agent/sessions', {}, { params: sceneId ? { sceneId } : undefined })
}

export function fetchAgentSession(id: string) {
  return apiGet<{ session: AgentSession; messages: ChatMessage[] }>(`/agent/sessions/${id}`)
}

export function sendAgentMessage(sessionId: string, prompt: string) {
  return apiPost<{ userMessage: ChatMessage; agentMessage: ChatMessage }>(`/agent/sessions/${sessionId}/messages`, {
    prompt
  })
}

export function executeAgentAction(actionId: string) {
  return apiPost<Record<string, unknown>>(`/agent/actions/${actionId}/execute`)
}

export function rollbackAgentAction(actionId: string) {
  return apiPost<Record<string, unknown>>(`/agent/actions/${actionId}/rollback`)
}
