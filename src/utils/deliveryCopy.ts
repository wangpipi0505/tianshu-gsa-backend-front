/**
 * 交付态话术与未实现控件开关。
 * 被隐藏控件的渲染逻辑保留，后续接入时将 SHOW_* 置回 true。
 */

export const SERVICE_INTERRUPT_MESSAGE =
  '态势服务连接中断，已自动切换至本地态势数据源，服务恢复后自动同步'

export const DATA_SERVICE_PUBLISH_PREFIX = '数据服务发布：'

export const CHARACTERISTIC_BASELINE_HINT =
  '以下为目标特性知识库中的历史基线记录，供与当前目标特性进行人工比对参考：'

export const SHOW_LAYER_OPACITY_CONTROLS = false

export const PLANNED_LAYER_NODE_IDS = ['BASE-NODE-MAP', 'BASE-NODE-BORDER', 'ENV-NODE-SEA', 'ENV-NODE-GEO']
