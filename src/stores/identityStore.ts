/**
 * 身份密级与操作分级。默认最高密级，保证现有交付数据全量可见。
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type Clearance = 'internal' | 'confidential' | 'secret' | 'top_secret'
export type OpKey = 'view' | 'fusion' | 'publish' | 'simulation' | 'export'

const RANK: Record<Clearance, number> = {
  internal: 1,
  confidential: 2,
  secret: 3,
  top_secret: 4
}

export const useIdentityStore = defineStore('identity', () => {
  const userName = ref('研判员-甲')
  const clearance = ref<Clearance>('top_secret')
  const allowedOps = ref<OpKey[]>(['view', 'fusion', 'publish', 'simulation', 'export'])
  const auditLogs = ref<Array<{ id: string; action: string; result: string; at: string }>>([])

  const profiles: Array<{ name: string; clearance: Clearance; ops: OpKey[] }> = [
    { name: '研判员-甲', clearance: 'top_secret', ops: ['view', 'fusion', 'publish', 'simulation', 'export'] },
    { name: '融合员-乙', clearance: 'secret', ops: ['view', 'fusion'] },
    { name: '浏览员-丙', clearance: 'internal', ops: ['view'] }
  ]

  function canSee(classification: Clearance = 'internal') {
    return RANK[clearance.value] >= RANK[classification]
  }

  function canDo(op: OpKey) {
    return allowedOps.value.includes(op)
  }

  function switchProfile(name: string) {
    const p = profiles.find((item) => item.name === name)
    if (!p) return
    userName.value = p.name
    clearance.value = p.clearance
    allowedOps.value = [...p.ops]
    writeAudit('切换身份', `密级 ${p.clearance}`)
  }

  function writeAudit(action: string, result: string) {
    auditLogs.value.unshift({
      id: `AUD-${Date.now()}`,
      action,
      result,
      at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    })
  }

  const visibleAudit = computed(() => auditLogs.value.slice(0, 20))

  return {
    userName,
    clearance,
    allowedOps,
    profiles,
    auditLogs,
    visibleAudit,
    canSee,
    canDo,
    switchProfile,
    writeAudit
  }
})
