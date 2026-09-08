import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readSource = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

const [intentCard, actionCard, chatPanel, scenarios, situationAssets, constructScene] = await Promise.all([
  readSource('src/components/agent/IntentPreviewCard.vue'),
  readSource('src/components/agent/AgentActionCard.vue'),
  readSource('src/components/agent/AgentChatPanel.vue'),
  readSource('src/mock/mockAgentScenarios.ts'),
  readSource('src/mock/mockSituationAssets.ts'),
  readSource('src/utils/constructScene.ts')
])

assert.doesNotMatch(intentCard, /按修正意图重新执行/, '意图卡不能再使用含义不明的统一重执行文案')
assert.match(intentCard, /intentActionLabel/, '意图卡应按当前业务显示明确的执行动作')
assert.match(chatPanel, /智能业务助手/, '全局助手名称应改为“智能业务助手”')
assert.match(scenarios, /scenario_fusion_candidate_review/, '候选关联研判必须使用独立的融合业务场景')
assert.doesNotMatch(scenarios, /候选关联确认队列已全部完成研判/, 'Mock 场景不能静态宣称候选关联已全部完成')
assert.match(actionCard, /open_candidate_review/, '候选关联研判应提供可直达的页面操作')
assert.match(actionCard, /flyToCoordinates\(targetList/, '多目标构建后应按所有构建坐标计算相机范围')
assert.doesNotMatch(actionCard, /flyToLocation\(lastTarget\.longitude, lastTarget\.latitude, targetList\.length === 1 \? 260000 : 1200000, 0, -45\)/, '南海场景不得使用斜视角和最后一个目标定位')
assert.match(situationAssets, /Target-SCS-08/, '南海样例应补充业务目标')
assert.match(situationAssets, /REL-SCS-03/, '南海样例应补充目标关系')
assert.match(situationAssets, /EVT-SCS-03/, '南海样例应补充业务事件')
assert.match(constructScene, /situationStore\.currentPlaybackTime \|\| formatLocalDateTime\(new Date\(\)\)/, '构建目标应使用当前态势时钟，不能拉长既有时间轴')

console.log('助手业务动作、南海定位与样例数据校验通过')
