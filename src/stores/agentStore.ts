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
import { useIdentityStore } from '@/stores/identityStore'
import { useSituationStore } from '@/stores/situationStore'
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
  // 已保存的历史会话（方案 5.4.2：会话历史支持回看、重开和命名保存）
  const savedSessions = ref<Array<{ id: string; name: string; savedAt: string; messages: ChatMessage[] }>>([])
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

    if (promptText.includes('构建') || promptText.includes('假设目标') || promptText.includes('态势场景')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_construct_patrol
    } else if (promptText.includes('清空') || promptText.includes('清屏') || promptText.includes('清除态势')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_clear_situations
    } else if (promptText.includes('分支') || promptText.includes('多分支') || promptText.includes('规避') || promptText.includes('压制')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_future_branches_viper
    } else if (
      // 历史单态意图优先于多态切片判断 (如"复盘历史航迹，只看历史切片")
      promptText.includes('复盘') ||
      promptText.includes('轨迹回顾') ||
      (promptText.includes('历史') && !promptText.includes('当前') && !promptText.includes('未来')) ||
      (promptText.includes('历史') && (promptText.includes('单态') || promptText.includes('只看') || promptText.includes('只需')))
    ) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_history_review
    } else if (promptText.includes('切片') || promptText.includes('三态') || promptText.includes('T-30') || promptText.includes('T+30')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_temporal_slices
    } else if (promptText.includes('回放') || promptText.includes('推流')) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_temporal_playback
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
    } else if (isMideastQuery) {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_mideast_situation
    } else {
      scenarioMsgs = MOCK_AGENT_SCENARIOS.scenario_fallback
    }

    if (scenarioMsgs && scenarioMsgs.length > 1) {
      const agentMsg = JSON.parse(JSON.stringify(scenarioMsgs[1]))
      agentMsg.id = `MSG-AGENT-${Date.now()}`
      agentMsg.timestamp = new Date().toLocaleTimeString()
      const redacted = redactByClearance(promptText, agentMsg.content)
      if (redacted !== agentMsg.content) {
        agentMsg.content = redacted
        agentMsg.actionCards = []
        agentMsg.intentUnderstanding = undefined
      }
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

  function redactByClearance(promptText: string, content: string) {
    const identity = useIdentityStore()
    const situation = useSituationStore()
    const visibleIds = new Set(situation.visibleTargets.map((t) => t.id))
    const mentionsRestricted =
      /VIPER|Target-001|突防战机|敌方重点/.test(promptText) || /VIPER|Target-001|突防战机/.test(content)
    if (mentionsRestricted && !visibleIds.has('Target-001')) {
      identity.writeAudit('问答过滤', '按身份密级隐藏不可见对象')
      return '按当前身份密级，相关对象不可见。已按可见范围作答，未返回越权内容。'
    }
    return content
  }

  // mock 思考定时器：可取消，避免"重置对话后旧回复仍插入"与 isThinking 卡死
  let replyTimer: ReturnType<typeof setTimeout> | null = null

  async function sendMessage(promptText: string) {
    if (!promptText.trim() || isThinking.value) return
    if (USE_MOCK) {
      isThinking.value = true
      if (replyTimer) clearTimeout(replyTimer)
      replyTimer = setTimeout(() => {
        replyTimer = null
        try {
          pushMockReply(promptText)
        } finally {
          isThinking.value = false
        }
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
    } catch (error) {
      // 错误态显式呈现，不静默失败
      const message = error instanceof Error ? error.message : String(error)
      messages.value.push({
        id: `MSG-ERR-${Date.now()}`,
        sender: 'system',
        content: `研判服务调用失败：${message}。请稍后重试，或点击【重置对话】恢复本地会话。`,
        timestamp: new Date().toLocaleTimeString()
      })
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
    if (replyTimer) {
      clearTimeout(replyTimer)
      replyTimer = null
    }
    isThinking.value = false
    if (USE_MOCK) {
      applyMock()
      return
    }
    await loadFromApi()
    activeIntent.value = null
    executedActions.value = []
  }

  /** 命名保存当前会话 */
  function saveCurrentSession(name: string) {
    savedSessions.value.unshift({
      id: `SESS-SAVE-${Date.now()}`,
      name: name || `会话 ${new Date().toLocaleString()}`,
      savedAt: new Date().toLocaleString(),
      messages: JSON.parse(JSON.stringify(messages.value))
    })
  }

  /** 载入历史会话（完整还原消息与动作卡状态） */
  function loadSavedSession(id: string) {
    const s = savedSessions.value.find((x) => x.id === id)
    if (!s) return
    if (replyTimer) {
      clearTimeout(replyTimer)
      replyTimer = null
    }
    isThinking.value = false
    messages.value = JSON.parse(JSON.stringify(s.messages))
    activeIntent.value = null
    executedActions.value = []
  }

  /** 删除历史会话 */
  function deleteSavedSession(id: string) {
    savedSessions.value = savedSessions.value.filter((x) => x.id !== id)
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
    savedSessions,
    featuredPrompts,
    applyMock,
    loadFromApi,
    sendMessage,
    executeAction,
    rollbackAction,
    resetSession,
    saveCurrentSession,
    loadSavedSession,
    deleteSavedSession,
    openAgent,
    closeAgent,
    toggleAgent
  }
})
