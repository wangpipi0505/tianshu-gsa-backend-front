<template>
  <transition name="slide-fade">
    <div v-if="situationStore.showTemporalSlices" class="temporal-comparison-hud tactical-panel">
      <!-- 头部控制条 -->
      <div class="hud-header">
        <div class="title-box">
          <span class="hud-badge">4D TEMPORAL SLICE</span>
          <h3 class="hud-title">📐 4D时空演变三态切片对比透视面板</h3>
        </div>

        <div class="header-right-tools">
          <!-- 目标实体切换选择器 -->
          <el-select
            v-model="activeTargetId"
            size="small"
            class="target-selector"
            @change="onTargetChange"
          >
            <el-option
              v-for="t in targetsWithSlices"
              :key="t.id"
              :value="t.id"
              :label="`${t.codeName} (${t.callsign})`"
            />
          </el-select>

          <el-button
            size="small"
            circle
            title="关闭三态对比面板"
            @click="closeHUD"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 核心演变趋势关键指标摘要卡片 -->
      <div class="metrics-summary-bar">
        <div class="metric-item">
          <span class="m-label">机动航速演变</span>
          <div class="m-val-group">
            <span class="m-val from">510 节</span>
            <span class="m-arrow">➔</span>
            <span class="m-val current">530 节</span>
            <span class="m-arrow">➔</span>
            <span class="m-val to">680 节</span>
          </div>
          <span class="m-delta positive">加速 +28.3% (超音速)</span>
        </div>

        <div class="metric-item">
          <span class="m-label">飞行高度突变</span>
          <div class="m-val-group">
            <span class="m-val from">8600 m</span>
            <span class="m-arrow">➔</span>
            <span class="m-val current">8500 m</span>
            <span class="m-arrow">➔</span>
            <span class="m-val to danger">300 m</span>
          </div>
          <span class="m-delta negative">俯冲 -8200 m (掠海规避)</span>
        </div>

        <div class="metric-item">
          <span class="m-label">防空威胁等级</span>
          <div class="m-val-group">
            <span class="m-val from">中度预警</span>
            <span class="m-arrow">➔</span>
            <span class="m-val current">边界逼近</span>
            <span class="m-arrow">➔</span>
            <span class="m-val to critical">高危突防 (火控界)</span>
          </div>
          <span class="m-delta critical">拦截窗口: 4.2分钟</span>
        </div>
      </div>

      <!-- 三态切片全景属性对比矩阵表格 -->
      <div class="matrix-table-container">
        <table class="matrix-table">
          <thead>
            <tr>
              <th style="width: 14%">对比维度</th>
              <th style="width: 28%" class="col-history">
                <span class="badge-phase hist">⏱️ 历史观测阶段 (T-N)</span>
                <span class="time-stamp">14:00:00 ~ 15:00:00</span>
              </th>
              <th style="width: 28%" class="col-present">
                <span class="badge-phase pres">🟢 当前实时基准 (T0)</span>
                <span class="time-stamp">15:30:00 (实时事实)</span>
              </th>
              <th style="width: 30%" class="col-future">
                <span class="badge-phase fut">🔮 未来预测推演 (T+N)</span>
                <span class="time-stamp">16:00:00 ~ 16:30:00</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="dim-title">空间经纬坐标</td>
              <td>东经 123.70° ~ 123.05°<br/>北纬 23.80° ~ 24.50°</td>
              <td class="highlight-present">东经 122.60°<br/>北纬 24.85°</td>
              <td class="highlight-future">东经 121.50° ~ 120.60°<br/>北纬 24.15° ~ 23.65°</td>
            </tr>
            <tr>
              <td class="dim-title">战术机动意图</td>
              <td>双机编队巡航集结，随后在空域异常盘旋，意图建立突击走廊</td>
              <td class="highlight-present">转入向我水面编队与沿海防空阵地高速逼近战位</td>
              <td class="highlight-future">急剧俯冲至 300 米掠海超音速突防，规避雷达实施威慑</td>
            </tr>
            <tr>
              <td class="dim-title">雷达与火控态势</td>
              <td>机载雷达保持静默/间歇扫描，接收预警机战术引导</td>
              <td class="highlight-present">进入我方 052D 驱逐舰 346A 相控阵雷达搜索捕获视线</td>
              <td class="highlight-future">进入海红旗-9B防空导弹 65km 杀伤圈，持续锁定火控待发</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 底部时空联动操作栏 -->
      <div class="hud-action-footer">
        <div class="slice-jump-buttons">
          <span class="jump-label">📍 时空切片视角直达:</span>
          <el-button size="small" plain @click="focusSlice('history')">
            <span>历史集结点 (14:00)</span>
          </el-button>
          <el-button size="small" type="success" plain @click="focusSlice('present')">
            <span>当前基准点 (15:30)</span>
          </el-button>
          <el-button size="small" type="primary" plain @click="focusSlice('future')">
            <span>未来预测交汇点 (16:00)</span>
          </el-button>
        </div>

        <div class="playback-controls">
          <el-button
            size="small"
            type="primary"
            @click="startEvolutionPlayback"
          >
            <el-icon><VideoPlay /></el-icon>
            <span>▶ 启动全时空动态演变推流</span>
          </el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSituationStore } from '@/stores/situationStore'
import { cesiumController } from '@/utils/cesiumHelper'
import { ElMessage } from 'element-plus'
import { Close, VideoPlay } from '@element-plus/icons-vue'

const situationStore = useSituationStore()
const activeTargetId = ref('Target-001')

const targetsWithSlices = computed(() => {
  return situationStore.targets.filter((t) => t.temporalSlices && t.temporalSlices.length > 0)
})

function onTargetChange(id: string) {
  activeTargetId.value = id
  const target = situationStore.targets.find((t) => t.id === id)
  if (target) {
    cesiumController.focusTarget(target, 600000)
    ElMessage.info(`已切换至【${target.codeName}】时空切片对比视窗`)
  }
}

function focusSlice(phase: 'history' | 'present' | 'future') {
  const target = situationStore.targets.find((t) => t.id === activeTargetId.value)
  if (!target || !target.temporalSlices) return

  const slice = target.temporalSlices.find((s) => s.phase === phase)
  if (slice) {
    situationStore.seekTime(`2026-08-25 ${slice.time}`)
    cesiumController.flyToLocation(slice.longitude, slice.latitude, 450000, 0, -89.9)
    ElMessage.success(`视角已精准定位至 ${slice.label} (${slice.time})`)
  }
}

function startEvolutionPlayback() {
  situationStore.seekTime('2026-08-25 13:00:00')
  situationStore.playbackSpeed = 2
  situationStore.startPlayback()
  const target = situationStore.targets.find((t) => t.id === activeTargetId.value)
  if (target) {
    cesiumController.focusTarget(target, 650000)
  }
  ElMessage.success('已启动全时空动态演化推流播放！')
}

function closeHUD() {
  situationStore.toggleTemporalSlices(false)
  ElMessage.info('已退出三态时空切片对比模式')
}
</script>

<style scoped lang="scss">
.temporal-comparison-hud {
  position: absolute;
  top: 60px;
  left: 20px;
  width: 780px;
  max-width: calc(100vw - 480px);
  z-index: 20;
  padding: 14px 18px;
  background: rgba(10, 18, 32, 0.96);
  border: 1px solid rgba(0, 210, 255, 0.5);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 210, 255, 0.25);
  border-radius: 4px;
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hud-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 210, 255, 0.25);
  padding-bottom: 8px;

  .title-box {
    display: flex;
    align-items: center;
    gap: 10px;

    .hud-badge {
      font-size: 10px;
      font-weight: 700;
      color: #00d2ff;
      padding: 1px 6px;
      background: rgba(0, 210, 255, 0.15);
      border: 1px solid rgba(0, 210, 255, 0.4);
      border-radius: 2px;
      letter-spacing: 1px;
    }

    .hud-title {
      font-size: 15px;
      font-weight: 700;
      color: #f0f6fc;
      letter-spacing: 0.5px;
    }
  }

  .header-right-tools {
    display: flex;
    align-items: center;
    gap: 10px;

    .target-selector {
      width: 220px;
    }
  }
}

.metrics-summary-bar {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;

  .metric-item {
    background: rgba(14, 25, 43, 0.85);
    border: 1px solid rgba(0, 210, 255, 0.25);
    border-radius: 3px;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .m-label {
      font-size: 11px;
      color: #a2b7d4;
    }

    .m-val-group {
      display: flex;
      align-items: center;
      gap: 5px;
      font-family: var(--font-family-mono);
      font-size: 12px;

      .m-val {
        font-weight: 700;
        &.from { color: #00d2ff; }
        &.current { color: #52c41a; }
        &.to {
          color: #d3adf7;
          &.danger { color: #ff7875; }
          &.critical { color: #ff4d4f; }
        }
      }

      .m-arrow {
        color: #6e87ab;
        font-size: 10px;
      }
    }

    .m-delta {
      font-size: 11px;
      font-weight: 600;
      &.positive { color: #52c41a; }
      &.negative { color: #faad14; }
      &.critical { color: #ff4d4f; }
    }
  }
}

.matrix-table-container {
  overflow-x: auto;

  .matrix-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;

    th, td {
      padding: 8px 10px;
      border: 1px solid rgba(0, 210, 255, 0.2);
      text-align: left;
      line-height: 1.45;
    }

    th {
      background: rgba(14, 28, 48, 0.95);
      color: #a2b7d4;
      font-weight: 600;

      .badge-phase {
        display: block;
        font-size: 11px;
        font-weight: 700;
        margin-bottom: 2px;

        &.hist { color: #00d2ff; }
        &.pres { color: #52c41a; }
        &.fut { color: #d3adf7; }
      }

      .time-stamp {
        font-size: 10px;
        color: #6e87ab;
        font-family: var(--font-family-mono);
      }
    }

    td {
      background: rgba(10, 20, 36, 0.7);
      color: #f0f6fc;

      &.dim-title {
        color: #00d2ff;
        font-weight: 600;
        background: rgba(14, 28, 48, 0.85);
      }

      &.highlight-present {
        background: rgba(82, 196, 26, 0.08);
        border-color: rgba(82, 196, 26, 0.35);
      }

      &.highlight-future {
        background: rgba(179, 127, 235, 0.08);
        border-color: rgba(179, 127, 235, 0.35);
      }
    }
  }
}

.hud-action-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(0, 210, 255, 0.25);
  padding-top: 10px;

  .slice-jump-buttons {
    display: flex;
    align-items: center;
    gap: 8px;

    .jump-label {
      font-size: 12px;
      color: #a2b7d4;
    }
  }
}

/* 动效 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

@media (max-width: 1440px) {
  .temporal-comparison-hud {
    width: 680px;
    top: 50px;
    left: 10px;
  }
}
</style>
