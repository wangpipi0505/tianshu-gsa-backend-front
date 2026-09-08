import type { ActionCard, ChatMessage, IntentUnderstanding } from '@/types/agent'
import type { FusionJob } from '@/types/fusion'

function nowTime() {
  return new Date().toLocaleTimeString()
}

function pendingCandidates(job: FusionJob) {
  return job.candidates.filter((candidate) => candidate.decision === 'unconfirmed' || candidate.decision === 'deferred')
}

function candidateIntent(job: FusionJob, pendingCount: number): IntentUnderstanding {
  return {
    rawPrompt: '打开候选关联确认列表，逐条研判融合结果。',
    intentCategory: 'data_fusion',
    intentTitle: '候选关联人工研判',
    targetScope: [job.name],
    spatialScope: job.spatialRange,
    timeScope: job.timeRange.join(' 至 '),
    actionSequence: pendingCount
      ? ['读取当前融合工作候选关联', '打开待处理候选人工研判', '记录确认、保持独立或暂缓的处置结果']
      : ['读取当前融合工作候选关联', '查看已决策候选及其研判留痕'],
    confidence: 0.97,
    isConfirmed: true
  }
}

export function createFusionCandidateReviewReply(job?: FusionJob): ChatMessage {
  if (!job) {
    return {
      id: 'MSG-AGENT-FUSION-CANDIDATE',
      sender: 'agent',
      content: '当前没有可供研判的融合工作。请先在数据融合工作台选择或新建融合工作。',
      timestamp: nowTime()
    }
  }

  const pending = pendingCandidates(job)
  const decidedCount = job.candidates.length - pending.length
  const action: ActionCard = {
    id: `ACT-FUSION-CANDIDATE-${job.id}`,
    actionType: 'open_candidate_review',
    title: '打开候选关联人工研判',
    description: pending.length
      ? `当前工作有 ${pending.length} 条候选待处理，可逐条选择“确认同一目标”“保持独立实体”或“暂缓确认”。`
      : '当前工作没有待处理候选，可查看已决策候选及其研判留痕。',
    previewPayload: { jobId: job.id, pendingCount: pending.length },
    executed: false,
    reversible: false,
    basisExplanation: `当前融合工作“${job.name}”的候选关联状态`,
    executionScope: 'frontend'
  }

  return {
    id: 'MSG-AGENT-FUSION-CANDIDATE',
    sender: 'agent',
    content: `当前融合工作为**${job.name}**，共 ${job.candidates.length} 条候选关联：已决策 ${decidedCount} 条，待人工研判 ${pending.length} 条。\n\n点击下方【打开候选关联人工研判】后，可在数据融合页面直接处理待办候选；每次处置都会写入对应候选的研判留痕。`,
    timestamp: nowTime(),
    intentUnderstanding: candidateIntent(job, pending.length),
    actionCards: [action]
  }
}

export function createFusionPublishReply(job?: FusionJob): ChatMessage {
  if (!job) {
    return {
      id: 'MSG-AGENT-FUSION-PUBLISH',
      sender: 'agent',
      content: '当前没有可发布的融合工作。请先在数据融合工作台选择或新建融合工作。',
      timestamp: nowTime()
    }
  }

  const pending = pendingCandidates(job)
  if (pending.length) {
    const reply = createFusionCandidateReviewReply(job)
    return {
      ...reply,
      id: 'MSG-AGENT-FUSION-PUBLISH-BLOCKED',
      content: `当前融合工作**${job.name}**尚有 ${pending.length} 条候选关联未完成研判，暂不执行资产版本发布。\n\n请先点击下方【打开候选关联人工研判】完成处置；候选全部决策后，系统才会提供资产版本发布确认。`,
      intentUnderstanding: {
        ...candidateIntent(job, pending.length),
        intentTitle: '完成候选关联处置后发布资产版本'
      }
    }
  }

  const action: ActionCard = {
    id: `ACT-FUSION-PUBLISH-${job.id}`,
    actionType: 'publish_fusion_asset',
    title: '打开资产版本发布确认',
    description: '打开明确的发布确认框；确认后生成资产版本、数据产品包装和版本历史记录。',
    previewPayload: { jobId: job.id },
    executed: false,
    reversible: false,
    basisExplanation: `当前融合工作“${job.name}”的候选关联均已完成处置`,
    executionScope: 'frontend'
  }

  return {
    id: 'MSG-AGENT-FUSION-PUBLISH',
    sender: 'agent',
    content: `当前融合工作**${job.name}**的候选关联均已完成处置，可以发起资产版本发布。\n\n点击下方【打开资产版本发布确认】后，系统会显示本次发布的工作名称和写入内容；在确认框中选择【确认发布】才会生成资产版本、数据产品包装和版本历史记录。`,
    timestamp: nowTime(),
    intentUnderstanding: {
      rawPrompt: '发布新资产版本，生成数据产品包装。',
      intentCategory: 'data_fusion',
      intentTitle: '融合任务资产版本发布',
      targetScope: [job.name],
      spatialScope: job.spatialRange,
      timeScope: job.timeRange.join(' 至 '),
      actionSequence: ['打开资产版本发布确认', '确认后生成资产版本与数据产品包装', '写入版本历史记录'],
      confidence: 0.97,
      isConfirmed: true
    },
    actionCards: [action]
  }
}
