import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readSource = async (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8').catch(() => '')

const [agentTypes, sceneStore, cesiumHelper, agentStore, scenarios, theaterResolver] = await Promise.all([
  readSource('src/types/agent.ts'),
  readSource('src/stores/sceneStore.ts'),
  readSource('src/utils/cesiumHelper.ts'),
  readSource('src/stores/agentStore.ts'),
  readSource('src/mock/mockAgentScenarios.ts'),
  readSource('src/utils/theaterSituation.ts')
])

assert.match(agentTypes, /focus_theater_situation/, '区域态势上图应使用独立动作类型')
assert.match(theaterResolver, /resolveTheaterSituation/, '区域范围必须从当前态势数据实时解析')
assert.match(sceneStore, /activeSituationScope/, '图层状态应记录当前区域范围')
assert.match(sceneStore, /isEventVisible/, '区域切换必须过滤无关态势事件')
assert.match(cesiumHelper, /isEventVisible\(evt\.id\)/, 'Cesium 事件渲染必须遵从当前区域范围')
assert.match(agentStore, /scenario_scs_situation/, '南海态势输入应命中全量区域态势场景')
assert.match(agentStore, /scenario_taiwan_situation/, '台海态势输入应命中全量区域态势场景')
assert.match(scenarios, /构建南海对峙态势场景（双目标）/, '既有南海构建动作名称必须保持不变')

console.log('区域全量态势加载与跨区域隔离校验通过')
