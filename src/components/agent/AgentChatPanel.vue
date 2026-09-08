<template>
  <div :class="['agent-sidebar-container', { 'is-collapsed': !agentStore.isOpen }]">
    <!-- 折叠时呈现的右侧纤细战术浮动标签 -->
    <div
      v-if="!agentStore.isOpen"
      class="agent-floating-tab"
      @click="agentStore.openAgent()"
      title="展开智能业务助手"
    >
      <div class="tab-top-indicator">
        <div class="tab-pulse-dot"></div>
        <el-icon class="tab-icon"><ChatDotRound /></el-icon>
      </div>
      <div class="tab-divider"></div>
      <span class="tab-text">智能业务助手</span>
      <div class="tab-arrow-box">
        <el-icon class="tab-arrow"><DArrowLeft /></el-icon>
      </div>
    </div>

    <!-- 展开时呈现的纯悬浮研判工作面板 (绝对定位浮于三维地球之上) -->
    <div
      v-else
      class="agent-docked-panel tactical-panel"
    >
      <!-- 面板头部 -->
      <div class="tactical-panel-header">
        <div class="header-title-box">
          <el-icon class="text-cyan"><ChatDotRound /></el-icon>
          <span>智能业务助手</span>
        </div>
        <div class="header-actions-box">
          <el-button
            size="small"
            circle
            title="收起研判面板"
            @click="agentStore.closeAgent()"
          >
            <el-icon><DArrowRight /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 面板主体内容 -->
      <div class="agent-panel-container">
        <!-- 紧凑单行快捷研判栏 + 模板下拉菜单 (大幅释放垂直聊天空间) -->
        <div class="compact-quick-bar">
          <div class="featured-pills">
            <div
              v-for="(item, i) in pagePills"
              :key="i"
              class="quick-pill"
              @click="sendPrompt(item.prompt)"
              :title="item.prompt"
            >
              <span class="pill-icon">{{ item.icon }}</span>
              <span class="pill-label">{{ item.label }}</span>
            </div>
          </div>

          <!-- 研判指令模板下拉选择器 -->
          <el-dropdown trigger="click" @command="sendPrompt">
            <el-button size="small" type="primary" plain class="more-templates-btn">
              <span>指令模板</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu class="agent-template-dropdown">
                <template v-for="(cat, cIdx) in pageTemplates" :key="cat.category">
                  <el-dropdown-item disabled class="category-header-item">
                    {{ cat.category }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-for="(p, pIdx) in cat.items"
                    :key="pIdx"
                    :command="p"
                  >
                    {{ p }}
                  </el-dropdown-item>
                  <el-dropdown-item divided v-if="cIdx < pageTemplates.length - 1" />
                </template>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 消息流 (高度最大化，支持充裕滚动研判) -->
        <div ref="messagesStreamRef" class="chat-messages-stream">
          <div
            v-for="msg in agentStore.messages"
            :key="msg.id"
            :class="['message-bubble-wrapper', msg.sender]"
          >
            <div class="sender-tag">
              <span>{{ msg.sender === 'user' ? '指挥员' : '智能业务助手' }}</span>
              <span class="msg-time">{{ msg.timestamp }}</span>
            </div>

            <div class="bubble-content">
              <!-- 回答主体：支持完整 Markdown 渲染 (加粗、列表、标牌、换行) -->
              <div
                class="text-body markdown-rendered-body"
                v-html="renderMarkdown(msg.content)"
              ></div>

              <!-- 意图理解卡片 (保持现有框框与结构不变) -->
              <IntentPreviewCard
                v-if="msg.intentUnderstanding"
                :intent="msg.intentUnderstanding"
              />

              <!-- 知识检索与推理链条 (保持现有框框与结构不变) -->
              <RagReasoningTree
                v-if="msg.ragSteps && msg.ragSteps.length"
                :rag-steps="msg.ragSteps"
                :traces="msg.reasoningTraces"
              />

              <!-- 证据链溯源卡片 -->
              <div v-if="msg.evidenceChain && msg.evidenceChain.length" class="evidence-chain-box">
                <div class="ec-header">
                  <el-icon><CircleCheck /></el-icon>
                  <span>证据链溯源 ({{ msg.evidenceChain.length }} 条)</span>
                </div>
                <div v-for="evi in msg.evidenceChain" :key="evi.id" class="ec-item">
                  <span class="ec-code">【{{ evi.id }}】</span>
                  <span class="ec-title">{{ evi.title }}</span>
                  <span v-if="evi.confidenceScore !== undefined" class="ec-score">{{ (evi.confidenceScore * 100).toFixed(0) }}%</span>
                </div>
              </div>

              <!-- 联动操作卡片 (保持现有框框与结构不变) -->
              <div v-if="msg.actionCards && msg.actionCards.length" class="action-cards-box">
                <AgentActionCard
                  v-for="act in msg.actionCards"
                  :key="act.id"
                  :action="act"
                />
              </div>
            </div>
          </div>

          <!-- 思考状态 -->
          <div v-if="agentStore.isThinking" class="thinking-box">
            <el-icon class="is-loading text-cyan"><Loading /></el-icon>
            <span>正在检索知识图谱并进行逻辑推理...</span>
          </div>
        </div>

        <!-- 输入栏 -->
        <div class="chat-input-area tactical-panel">
          <el-input
            v-model="inputPrompt"
            type="textarea"
            :rows="2"
            placeholder="输入研判指令，如：'我想看一下我方舰艇的当前信息和状态'..."
            @keydown.enter="onEnterKey"
          />
          <div class="input-actions">
            <el-button
              v-if="speechSupported"
              size="small"
              circle
              :type="listening ? 'primary' : 'default'"
              title="语音输入"
              @click="toggleSpeech"
            >
              <el-icon><Microphone /></el-icon>
            </el-button>
            <el-button size="small" circle @click="agentStore.resetSession" title="重置对话">
              <el-icon><Refresh /></el-icon>
            </el-button>
            <el-dropdown trigger="click" @command="onSessionCommand">
              <el-button size="small" circle title="会话记录">
                <el-icon><FolderOpened /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="__save">命名保存当前会话</el-dropdown-item>
                  <el-dropdown-item v-if="!agentStore.savedSessions.length" disabled divided>暂无已保存会话</el-dropdown-item>
                  <template v-for="s in agentStore.savedSessions" :key="s.id">
                    <el-dropdown-item divided :command="`load:${s.id}`">
                      载入：{{ s.name }}（{{ s.messages.length }} 条）
                    </el-dropdown-item>
                    <el-dropdown-item :command="`del:${s.id}`" class="session-delete-item">
                      删除：{{ s.name }}
                    </el-dropdown-item>
                  </template>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button size="small" type="primary" :disabled="!inputPrompt.trim() || agentStore.isThinking" @click="onSubmit">
              <el-icon><Promotion /></el-icon>
              <span>发送研判指令</span>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import { ElMessage, ElMessageBox } from 'element-plus'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { useAgentStore } from '@/stores/agentStore'
import { FEATURED_PROMPTS, CATEGORIZED_PROMPT_TEMPLATES, PAGE_TEMPLATE_PRIORITY } from '@/mock/mockAgentScenarios'
import { useRoute } from 'vue-router'
import IntentPreviewCard from '@/components/agent/IntentPreviewCard.vue'
import RagReasoningTree from '@/components/agent/RagReasoningTree.vue'
import AgentActionCard from '@/components/agent/AgentActionCard.vue'
import {
  ChatDotRound,
  DArrowRight,
  DArrowLeft,
  Loading,
  Refresh,
  Promotion,
  ArrowDown,
  CircleCheck,
  FolderOpened,
  Microphone
} from '@element-plus/icons-vue'

const speechSupported =
  typeof window !== 'undefined' &&
  (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition)
const listening = ref(false)
let recognition: any = null

function toggleSpeech() {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!Ctor) return
  if (listening.value && recognition) {
    recognition.stop()
    listening.value = false
    return
  }
  recognition = new Ctor()
  recognition.lang = 'zh-CN'
  recognition.interimResults = false
  recognition.onresult = (ev: any) => {
    const text = ev.results?.[0]?.[0]?.transcript || ''
    if (text) inputPrompt.value = `${inputPrompt.value}${inputPrompt.value ? ' ' : ''}${text}`
  }
  recognition.onend = () => {
    listening.value = false
  }
  recognition.start()
  listening.value = true
}

marked.setOptions({
  breaks: true,
  gfm: true
})

function renderMarkdown(content: string): string {
  if (!content) return ''
  try {
    return sanitizeHtml(marked.parse(content) as string)
  } catch (e) {
    return content
  }
}

const agentStore = useAgentStore()
const route = useRoute()

/** 按当前路由返回页面专属快捷按钮 */
const pagePills = computed(() => {
  const path = route.path
  if (path === '/fusion') {
    return [
      { icon: '📦', label: '数据集登记', prompt: '接收新数据集：南海海域高分光学与雷达观测数据集。' },
      { icon: '🔗', label: '候选确认', prompt: '打开候选关联确认列表，逐条研判融合结果。' },
      { icon: '📤', label: '资产发布', prompt: '发布新资产版本，生成数据产品包装。' }
    ]
  }
  if (path === '/analytics') {
    return [
      { icon: '📊', label: '统计分析', prompt: '切换到"仅真实态势"口径进行统计分析。' },
      { icon: '🔀', label: '事件影响对比', prompt: '对重点目标发起事件前后影响对比分析。' },
      { icon: '💾', label: '专题沉淀', prompt: '将当前分析结果沉淀为专题研判成果。' }
    ]
  }
  if (path === '/ontology') {
    return [
      { icon: '🧠', label: '本体检索', prompt: '在知识图谱中搜索目标本体相关概念。' },
      { icon: '🕸️', label: '图谱浏览', prompt: '查看南海方向态势场景的领域本体定义。' }
    ]
  }
  // 工作台默认
  return FEATURED_PROMPTS
})

/** 按当前路由过滤模板分组：仅展示当前页面业务相关的分组，按页面声明顺序排列 */
const pageTemplates = computed(() => {
  const allowed = PAGE_TEMPLATE_PRIORITY[route.path] || []
  if (!allowed.length) return CATEGORIZED_PROMPT_TEMPLATES
  return allowed
    .map((name) => CATEGORIZED_PROMPT_TEMPLATES.find((c) => c.category.includes(name)))
    .filter((c): c is (typeof CATEGORIZED_PROMPT_TEMPLATES)[number] => Boolean(c))
})

// 页面切换时同步助手上下文（开场白随页面业务口径刷新）
watch(
  () => route.path,
  () => agentStore.syncPageContext()
)
const inputPrompt = ref('')
const messagesStreamRef = ref<HTMLElement | null>(null)

// 新消息/思考态变化时自动滚到最新内容
watch(
  () => [agentStore.messages.length, agentStore.isThinking],
  () => {
    nextTick(() => {
      const el = messagesStreamRef.value
      if (el) el.scrollTop = el.scrollHeight
    })
  }
)

function sendPrompt(prompt: string) {
  if (agentStore.isThinking) {
    ElMessage.warning('助手正在研判中，请稍候再发送新指令')
    return
  }
  inputPrompt.value = prompt
  onSubmit()
}

/** Enter 发送 / Shift+Enter 换行 */
function onEnterKey(e: KeyboardEvent) {
  if (e.shiftKey) return
  e.preventDefault()
  onSubmit()
}

function onSubmit() {
  if (!inputPrompt.value.trim() || agentStore.isThinking) return
  agentStore.sendMessage(inputPrompt.value)
  inputPrompt.value = ''
}

/** 会话记录命令：命名保存 / 载入 / 删除 */
function onSessionCommand(command: string) {
  if (command === '__save') {
    ElMessageBox.prompt('请输入会话名称', '命名保存当前会话', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValue: `研判会话 ${new Date().toLocaleString()}`
    })
      .then(({ value }) => {
        agentStore.saveCurrentSession((value || '').trim())
        ElMessage.success('当前会话已命名保存，可在「会话记录」中载入')
      })
      .catch(() => undefined)
    return
  }
  if (command.startsWith('load:')) {
    agentStore.loadSavedSession(command.slice(5))
    ElMessage.success('历史会话已载入')
    return
  }
  if (command.startsWith('del:')) {
    agentStore.deleteSavedSession(command.slice(4))
    ElMessage.info('已删除该历史会话')
  }
}

defineExpose({
  expand: () => { agentStore.openAgent() },
  collapse: () => { agentStore.closeAgent() },
  toggle: () => { agentStore.toggleAgent() }
})
</script>

<style scoped lang="scss">
/* 绝对定位悬浮容器：直接浮动在 Cesium 三维地球上方，绝不占用文档流挤压地球 */
.agent-sidebar-container {
  position: absolute;
  top: 70px;
  right: 16px;
  bottom: 14px;
  width: clamp(340px, 25vw, 440px);
  max-width: calc(100vw - 32px);
  z-index: 25;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);

  &.is-collapsed {
    width: auto;
    top: 50%;
    bottom: auto;
    right: 0;
    transform: translateY(-50%);
  }
}

/* 折叠浮动唤出标签：靠屏幕右侧居中的纤细条状战术胶囊 */
.agent-floating-tab {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 6px;
  width: 34px;
  background: rgba(10, 20, 36, 0.95);
  border: 1px solid rgba(0, 210, 255, 0.45);
  border-right: none;
  border-radius: 6px 0 0 6px;
  cursor: pointer;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.6), -2px 0 10px rgba(0, 210, 255, 0.25);
  backdrop-filter: blur(10px);
  transition: all 0.25s ease;

  &:hover {
    background: rgba(14, 28, 48, 0.98);
    border-color: #00d2ff;
    transform: translateX(-4px);
    box-shadow: -6px 0 24px rgba(0, 210, 255, 0.45);

    .tab-text {
      color: #00d2ff;
    }
  }

  .tab-top-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .tab-pulse-dot {
    width: 6px;
    height: 6px;
    background: #00d2ff;
    border-radius: 50%;
    box-shadow: 0 0 8px #00d2ff;
    animation: pulse 2s infinite;
  }

  .tab-icon {
    font-size: 15px;
    color: #00d2ff;
  }

  .tab-divider {
    width: 14px;
    height: 1px;
    background: rgba(0, 210, 255, 0.35);
  }

  .tab-text {
    font-size: 12px;
    font-weight: 700;
    color: #f0f6fc;
    writing-mode: vertical-lr;
    letter-spacing: 3px;
    line-height: 1.2;
    transition: color 0.2s;
  }

  .tab-arrow-box {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;
  }

  .tab-arrow {
    font-size: 12px;
    color: #00d2ff;
    animation: arrowPulse 1.8s ease-in-out infinite;
  }
}

@keyframes arrowPulse {
  0%, 100% {
    transform: translateX(0);
    opacity: 0.7;
  }
  50% {
    transform: translateX(-3px);
    opacity: 1;
  }
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 14px #00ffff; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

/* 展开后的研判工作面板 */
.agent-docked-panel {
  pointer-events: auto;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(10, 18, 32, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 210, 255, 0.35);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 210, 255, 0.15);
  overflow: hidden;
}

.tactical-panel-header {
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 210, 255, 0.2);
  background: rgba(14, 25, 43, 0.6);

  .header-title-box {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 14px;
    color: #00d2ff;
  }
}

.agent-panel-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  gap: 8px;
  overflow: hidden;
}

/* 紧凑单行快捷栏 */
.compact-quick-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 6px;
  background: rgba(14, 25, 43, 0.6);
  border: 1px solid rgba(0, 210, 255, 0.18);
  border-radius: 4px;
  flex-shrink: 0;

  .featured-pills {
    display: flex;
    gap: 6px;
    overflow: hidden;

    .quick-pill {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      background: rgba(0, 210, 255, 0.08);
      border: 1px solid rgba(0, 210, 255, 0.22);
      border-radius: 12px;
      font-size: 11px;
      color: #bad3f2;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;

      &:hover {
        background: rgba(0, 210, 255, 0.2);
        border-color: #00d2ff;
        color: #00ffff;
      }

      .pill-icon { font-size: 12px; }
      .pill-label { max-width: 105px; overflow: hidden; text-overflow: ellipsis; }
    }
  }

  .more-templates-btn {
    font-size: 11px;
    height: 24px;
    padding: 0 8px;
    border-radius: 12px;
  }
}

.chat-messages-stream {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;

  .evidence-chain-box {
  margin-top: 8px;
  border: 1px solid rgba(82, 196, 26, 0.35);
  background: rgba(82, 196, 26, 0.06);
  border-radius: 4px;
  padding: 8px 10px;

  .ec-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    color: #52c41a;
    margin-bottom: 6px;
  }

  .ec-item {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 11px;
    padding: 3px 0;
    border-bottom: 1px dashed rgba(82, 196, 26, 0.15);

    &:last-child { border-bottom: none; }
    .ec-code { color: #52c41a; font-weight: 700; font-family: var(--font-family-mono); flex-shrink: 0; }
    .ec-title { color: #bad3f2; flex: 1; }
    .ec-score { color: #52c41a; font-family: var(--font-family-mono); flex-shrink: 0; }
  }
}

.message-bubble-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .sender-tag {
      font-size: 12px;
      font-weight: 700;
      color: #00d2ff;
      display: flex;
      justify-content: space-between;

      .msg-time {
        font-size: 11px;
        color: #6e87ab;
        font-weight: normal;
        font-family: var(--font-family-mono);
      }
    }

    &.user {
      .sender-tag { color: #52c41a; }
      .bubble-content {
        background: rgba(82, 196, 26, 0.1);
        border: 1px solid rgba(82, 196, 26, 0.35);
      }
    }

    .bubble-content {
      background: rgba(14, 25, 43, 0.85);
      border: 1px solid rgba(0, 210, 255, 0.25);
      border-radius: 4px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .text-body {
        font-size: 13px;
        line-height: 1.6;
        color: #f0f6fc;
      }
    }
  }

  .thinking-box {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #00d2ff;
    padding: 8px 12px;
    background: rgba(0, 210, 255, 0.08);
    border-radius: 4px;
  }
}

/* Markdown 渲染深度样式适配 (纯科技深色战术风格) */
:deep(.markdown-rendered-body) {
  p {
    margin: 0 0 6px 0;
    &:last-child { margin-bottom: 0; }
  }

  strong {
    color: #00d2ff;
    font-weight: 700;
  }

  ul, ol {
    margin: 4px 0 6px 0;
    padding-left: 18px;
  }

  li {
    margin-bottom: 4px;
    line-height: 1.5;
    &::marker {
      color: #00d2ff;
    }
  }

  code {
    background: rgba(0, 210, 255, 0.12);
    border: 1px solid rgba(0, 210, 255, 0.25);
    padding: 1px 5px;
    border-radius: 3px;
    color: #00ffff;
    font-family: var(--font-family-mono);
    font-size: 12px;
  }

  h1, h2, h3, h4 {
    color: #00d2ff;
    margin: 6px 0 4px 0;
    font-size: 13px;
  }
}

.chat-input-area {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>

<style lang="scss">
/* 指令模板全局下拉菜单样式适配 */
.agent-template-dropdown {
  background: rgba(10, 18, 32, 0.96) !important;
  border: 1px solid rgba(0, 210, 255, 0.4) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8) !important;
  max-height: 420px;
  overflow-y: auto;

  .category-header-item {
    font-size: 11px !important;
    font-weight: 700 !important;
    color: #00d2ff !important;
    background: rgba(0, 210, 255, 0.1) !important;
    padding: 4px 12px !important;
    cursor: default !important;
  }

  .el-dropdown-menu__item {
    color: #bad3f2 !important;
    font-size: 12px !important;
    padding: 6px 14px !important;

    &:hover {
      background: rgba(0, 210, 255, 0.2) !important;
      color: #00ffff !important;
    }
  }

  .el-dropdown-menu__item--divided {
    border-top: 1px solid rgba(0, 210, 255, 0.15) !important;
  }
}
</style>
