/**
 * @file agentStore.ts
 * @description 地球智能体与 Ontology-RAG 状态管理（会话历史、问题理解、多路召回、受约束推理、全量态势联动执行与回退）
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessage, ActionCard, IntentUnderstanding } from '@/types/agent'
import { FEATURED_PROMPTS, MOCK_AGENT_SCENARIOS } from '@/mock/mockAgentScenarios'
import { MOCK_EVIDENCE_ITEMS } from '@/mock/mockIntelligence'
import { USE_MOCK } from '@/config/dataSource'
import {
  createAgentSession,
  executeAgentAction,
  fetchAgentSession,
  rollbackAgentAction,
  sendAgentMessage
} from '@/api/agent'

export const useAgentStore = defineStore('agent', () => {
  const isOpen = ref<boolean>(true)
  const isThinking = ref<boolean>(false)
  const messages = ref<ChatMessage[]>([])
  const activeIntent = ref<IntentUnderstanding | null>(null)
  const executedActions = ref<ActionCard[]>([])
  const sessionId = ref<string>('')
  const featuredPrompts = FEATURED_PROMPTS

  function applyMock() {
    messages.value = JSON.parse(JSON.stringify(MOCK_AGENT_SCENARIOS.default))
    activeIntent.value = null
    executedActions.value = []
    sessionId.value = 'SESS-MOCK'
  }

  async function loadFromApi(sceneId = 'SCENE-DEFAULT-01') {
    if (USE_MOCK) {
      applyMock()
      return
    }
    const session = await createAgentSession(sceneId)
    sessionId.value = session.id
    const detail = await fetchAgentSession(session.id)
    messages.value = detail.messages || []
  }

  function pushMockReply(promptText: string) {
    const userMsg: ChatMessage = {
      id: `MSG-USER-${Date.now()}`,
      sender: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString()
    }
    messages.value.push(userMsg)

    let scenarioMsgs: ChatMessage[] | undefined
    const isMideastQuery =
      promptText.includes('中东') ||
      promptText.includes('波斯湾') ||
      promptText.includes('霍尔木兹') ||
      promptText.includes('阿曼湾') ||
      promptText.includes('焦作')

    if (promptText.includes('清空') || promptText.includes('清屏') || promptText.includes('清除态势')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_clear_situations
    } else if (promptText.includes('分支') || promptText.includes('多分支') || promptText.includes('规避') || promptText.includes('压制')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_future_branches_viper
    } else if (promptText.includes('切片') || promptText.includes('三态') || promptText.includes('T-30') || promptText.includes('T+30')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_temporal_slices
    } else if (promptText.includes('未来') || promptText.includes('走向') || promptText.includes('预测') || (promptText.includes('演变') && promptText.includes('推演'))) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_future_evolution_viper
    } else if (promptText.includes('焦作') || (isMideastQuery && (promptText.includes('舰') || promptText.includes('护航') || promptText.includes('我方')))) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_inspect_mideast_convoy
    } else if (isMideastQuery) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_mideast_situation
    } else if (promptText.includes('舰艇') || promptText.includes('我方') || promptText.includes('052D') || promptText.includes('驱逐舰') || promptText.includes('长沙')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_inspect_warship
    } else if (promptText.includes('战机') || promptText.includes('突防机') || promptText.includes('VIPER') || promptText.includes('敌方')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_inspect_fighter
    } else if (promptText.includes('伴飞') || promptText.includes('结队') || promptText.includes('打击') || promptText.includes('关系')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_target_relations
    } else if (promptText.includes('雷达') || promptText.includes('照射') || promptText.includes('扫描') || promptText.includes('覆盖锥')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_radar_coverage
    } else if (promptText.includes('红黄蓝') || promptText.includes('战区') || promptText.includes('包络') || promptText.includes('杀伤区')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_thematic_regions
    } else if (promptText.includes('海况') || promptText.includes('气象') || promptText.includes('雨雾') || promptText.includes('环境') || promptText.includes('补偿')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_environment_compensation
    } else if (promptText.includes('时间轴') || promptText.includes('复盘') || promptText.includes('回放') || promptText.includes('动态') || promptText.includes('演变')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_future_evolution_viper
    } else if (promptText.includes('推演') || promptText.includes('突防') || promptText.includes('假设') || promptText.includes('比对')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_simulation_deduction
    } else {
      scenarioMsgs = isMideastQuery
        ? MOCK_AGENT_SCENARIOS.scenario_mideast_situation
        : MOCK_AGENT_SCENARIOS.scenario_future_evolution_viper
    }

    if (scenarioMsgs && scenarioMsgs.length > 1) {
      const agentMsg = JSON.parse(JSON.stringify(scenarioMsgs[1]))
      agentMsg.id = `MSG-AGENT-${Date.now()}`
      agentMsg.timestamp = new Date().toLocaleTimeString()
      messages.value.push(agentMsg)
      if (agentMsg.intentUnderstanding) {
        activeIntent.value = agentMsg.intentUnderstanding
      }
      return
    }

    messages.value.push({
      id: `MSG-AGENT-${Date.now()}`,
      sender: 'agent',
      content: `已结合当前场景上下文完成检索。针对您的指令："${promptText}"，系统已匹配到相关态势事实与领域本体关系，您可以点击下方操作卡片执行态势上图与研判。`,
      timestamp: new Date().toLocaleTimeString(),
      evidenceChain: MOCK_EVIDENCE_ITEMS.slice(0, 2),
      actionCards: [
        {
          id: `ACT-${Date.now()}`,
          actionType: 'highlight_relations',
          title: '高亮显示战术关联关系',
          description: '在三维视窗中点亮当前讨论的目标关系',
          previewPayload: { targetId: 'Target-001' },
          executed: false,
          reversible: true,
          basisExplanation: '基于当前场景事实层检索结论'
        }
      ]
    })
  }

  async function sendMessage(promptText: string) {
    if (!promptText.trim()) return
    if (USE_MOCK) {
      isThinking.value = true
      setTimeout(() => {
        isThinking.value = false
        pushMockReply(promptText)
      }, 400)
      return
    }
    if (!sessionId.value) {
      await loadFromApi()
    }
    isThinking.value = true
    try {
      const result = await sendAgentMessage(sessionId.value, promptText)
      if (result.userMessage) messages.value.push(result.userMessage)
      if (result.agentMessage) {
        messages.value.push(result.agentMessage)
        if (result.agentMessage.intentUnderstanding) {
          activeIntent.value = result.agentMessage.intentUnderstanding
        }
      }
    } finally {
      isThinking.value = false
    }
  }

  async function executeAction(action: ActionCard) {
    if (!USE_MOCK) {
      await executeAgentAction(action.id)
    }
    action.executed = true
    executedActions.value.push(action)
  }

  async function rollbackAction(action: ActionCard) {
    if (!USE_MOCK) {
      await rollbackAgentAction(action.id)
    }
    action.executed = false
    const idx = executedActions.value.findIndex((a) => a.id === action.id)
    if (idx >= 0) {
      executedActions.value.splice(idx, 1)
    }
  }

  async function resetSession() {
    if (USE_MOCK) {
      applyMock()
      return
    }
    await loadFromApi()
    activeIntent.value = null
    executedActions.value = []
  }

  function openAgent() {
    isOpen.value = true
  }

  function closeAgent() {
    isOpen.value = false
  }

  function toggleAgent() {
    isOpen.value = !isOpen.value
  }

  return {
    isOpen,
    isThinking,
    messages,
    activeIntent,
    executedActions,
    sessionId,
    featuredPrompts,
    applyMock,
    loadFromApi,
    sendMessage,
    executeAction,
    rollbackAction,
    resetSession,
    openAgent,
    closeAgent,
    toggleAgent
  }
})
