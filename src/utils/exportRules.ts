/**
 * 导出密级对应的脱敏规则集：所见即所得。
 */

export type ExportSecurityLevel = 'internal' | 'public'

export interface ExportRuleSet {
  level: ExportSecurityLevel
  label: string
  description: string
  stripped: string[]
}

export const EXPORT_RULE_SETS: Record<ExportSecurityLevel, ExportRuleSet> = {
  internal: {
    level: 'internal',
    label: '内部研判级',
    description: '全量导出，包含高维特性、冲突记录、证据链与智能体对话',
    stripped: []
  },
  public: {
    level: 'public',
    label: '对外通报级',
    description: '剔除雷达/光电特性、冲突记录、证据链、智能体对话',
    stripped: ['雷达/光电特性', '冲突记录', '证据链', '智能体对话']
  }
}

export function sanitizeExportPayload(
  payload: Record<string, any>,
  level: ExportSecurityLevel,
  includeWorkContents: boolean,
  includeAgentConversations: boolean
) {
  const cloned = JSON.parse(JSON.stringify(payload))
  if (level === 'public') {
    const assets = cloned.situationAssets || {}
    if (Array.isArray(assets.targets)) {
      assets.targets = assets.targets.map((t: any) => {
        const next = { ...t }
        delete next.opticalFeatures
        delete next.radarFeatures
        delete next.opticalCharacteristic
        delete next.radarCharacteristic
        next.conflicts = []
        next.evidenceIds = []
        return next
      })
    }
    assets.evidences = []
    cloned.agentConversations = []
  } else if (!includeAgentConversations) {
    cloned.agentConversations = []
  }

  if (!includeWorkContents) {
    cloned.workContents = []
  }
  return cloned
}
