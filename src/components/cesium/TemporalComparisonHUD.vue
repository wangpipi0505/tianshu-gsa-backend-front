<template>
  <transition name="slide-fade">
    <div v-if="situationStore.showTemporalSlices" class="temporal-comparison-hud tactical-panel">
      <!-- 头部控制条：标题 + 目标切换 + 关闭 -->
      <div class="hud-header">
        <div class="title-box">
          <span class="hud-badge">4D TEMPORAL SLICE</span>
          <h3 class="hud-title">📐 时空三态切片对比</h3>
        </div>

        <div class="header-right-tools">
          <el-select
            v-model="selectedTargetIdProxy"
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

      <!-- 用法引导（可关闭） -->
      <div v-if="guideVisible" class="hud-guide-bar">
        <el-icon><InfoFilled /></el-icon>
        <span>
          三态 = 同一目标在<b>历史 / 当前 / 未来</b>三个时间切面的快照同屏对比：
          ① 用下方「切面图层」开关分别显示/隐藏三个切面；
          ② 点击切片卡或地球上的彩色切片点，相机会斜视飞达并展开详情；
          ③ 拖动底部时间轴，所处时相的切片自动点亮，即可看到目标如何"走到未来"。
        </span>
        <el-button link size="small" class="guide-close" @click="guideVisible = false">知道了</el-button>
      </div>

      <!-- 三态图层独立显隐开关 (历史/现在/未来三个时间切面) -->
      <div class="layer-switch-bar">
        <span class="bar-label">切面图层:</span>
        <div
          v-for="phase in PHASES"
          :key="phase"
          class="layer-switch"
          :class="[phase, { on: situationStore.sliceLayers[phase] }]"
          @click="situationStore.setSliceLayer(phase, !situationStore.sliceLayers[phase])"
        >
          <span class="dot"></span>
          <span>{{ PHASE_META[phase].icon }} {{ PHASE_META[phase].short }}</span>
        </div>
        <span class="bar-hint">点击地球上的切片点可展开详情</span>
      </div>

      <template v-if="activeTarget">
        <!-- 演变趋势关键指标摘要卡片 (实时计算自所选目标的时空切片) -->
        <div class="metrics-summary-bar">
          <div class="metric-item">
            <span class="m-label">机动航速演变</span>
            <div class="m-val-group">
              <span class="m-val from">{{ speedMetric.from }} 节</span>
              <span class="m-arrow">➔</span>
              <span class="m-val current">{{ speedMetric.mid }} 节</span>
              <span class="m-arrow">➔</span>
              <span class="m-val to">{{ speedMetric.to }} 节</span>
            </div>
            <span class="m-delta" :class="speedMetric.tone">{{ speedMetric.delta }}</span>
          </div>

          <div class="metric-item">
            <span class="m-label">高度演变</span>
            <div class="m-val-group">
              <template v-if="!altitudeMetric.isSurface">
                <span class="m-val from">{{ altitudeMetric.from }}</span>
                <span class="m-arrow">➔</span>
                <span class="m-val current">{{ altitudeMetric.mid }}</span>
                <span class="m-arrow">➔</span>
                <span class="m-val to" :class="{ danger: altitudeMetric.descending }">{{ altitudeMetric.to }}</span>
              </template>
              <span v-else class="m-val current">水面航渡 (高程恒定)</span>
            </div>
            <span class="m-delta" :class="altitudeMetric.tone">{{ altitudeMetric.delta }}</span>
          </div>

          <div class="metric-item">
            <span class="m-label">切片时间跨度</span>
            <div class="m-val-group">
              <span class="m-val from">{{ spanMetric.start }}</span>
              <span class="m-arrow">➔</span>
              <span class="m-val to">{{ spanMetric.end }}</span>
            </div>
            <span class="m-delta neutral">共 {{ slices.length }} 个时空切片</span>
          </div>
        </div>

        <!-- 三态切片对比列 (每列一个时相，点击切片卡联动地球高亮与飞行) -->
        <div class="phase-columns">
          <div v-for="phase in PHASES" :key="phase" class="phase-col">
            <div class="col-head" :class="phase">
              <span class="badge">{{ PHASE_META[phase].icon }} {{ PHASE_META[phase].label }}</span>
              <span class="time-range">{{ phaseTimeRange[phase] }}</span>
            </div>

            <div
              v-for="card in slicesByPhase[phase]"
              :key="card.index"
              class="slice-card"
              :class="{ active: isActiveCard(card) }"
              @click="onSliceClick(card)"
            >
              <div class="row-main">
                <span class="s-time">{{ card.slice.time }}</span>
                <span class="s-label">{{ card.slice.label }}</span>
              </div>
              <div class="row-sub">
                <span>{{ formatLatLon(card.slice) }}</span>
                <span>高程 {{ formatAlt(card.slice.altitude) }} | {{ card.slice.speedKnots }}节</span>
              </div>
              <div class="row-remark">{{ card.slice.remark }}</div>
            </div>

            <div v-if="!slicesByPhase[phase].length" class="col-empty">该切面暂无切片</div>
          </div>
        </div>
      </template>
      <div v-else class="hud-empty">当前无目标携带时空切片数据</div>

      <!-- 底部时空联动操作栏 -->
      <div v-if="activeTarget" class="hud-action-footer">
        <div class="slice-jump-buttons">
          <span class="jump-label">📍 切面视角直达:</span>
          <el-button
            v-for="phase in PHASES"
            :key="phase"
            size="small"
            :disabled="!slicesByPhase[phase].length"
            @click="focusPhase(phase)"
          >
            <span>
              {{ PHASE_META[phase].icon }} {{ PHASE_META[phase].short }}{{ slicesByPhase[phase].length ? ` (${slicesByPhase[phase][0].slice.time})` : '' }}
            </span>
          </el-button>
        </div>

        <div class="playback-controls">
          <el-button
            size="small"
            type="primary"
            @click="startEvolutionPlayback"
          >
            <el-icon><VideoPlay /></el-icon>
            <span>▶ 全时空演变推流</span>
          </el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSituationStore } from '@/stores/situationStore'
import { cesiumController } from '@/utils/cesiumHelper'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, VideoPlay, InfoFilled } from '@element-plus/icons-vue'
import type { TemporalPhase, TemporalSlice } from '@/types/situation'

const situationStore = useSituationStore()
const guideVisible = ref(true)

const PHASES: TemporalPhase[] = ['history', 'present', 'future']
const PHASE_META: Record<TemporalPhase, { icon: string; label: string; short: string }> = {
  history: { icon: '⏱️', label: '历史观测 (T-N)', short: '历史' },
  present: { icon: '🟢', label: '当前基准 (T0)', short: '当前' },
  future: { icon: '🔮', label: '未来推演 (T+N)', short: '未来' }
}

interface SliceCard {
  slice: TemporalSlice
  index: number
}

const targetsWithSlices = computed(() => situationStore.targets.filter((t) => t.temporalSlices?.length))
const activeTarget = computed(() => situationStore.targets.find((t) => t.id === situationStore.activeSliceTargetId) || null)
const slices = computed<TemporalSlice[]>(() => activeTarget.value?.temporalSlices ?? [])

const slicesByPhase = computed<Record<TemporalPhase, SliceCard[]>>(() => {
  const map: Record<TemporalPhase, SliceCard[]> = { history: [], present: [], future: [] }
  slices.value.forEach((slice, index) => map[slice.phase].push({ slice, index }))
  return map
})

const phaseTimeRange = computed<Record<TemporalPhase, string>>(() => {
  const result = {} as Record<TemporalPhase, string>
  PHASES.forEach((phase) => {
    const cards = slicesByPhase.value[phase]
    result[phase] = cards.length
      ? cards.length > 1
        ? `${cards[0].slice.time} ~ ${cards[cards.length - 1].slice.time}`
        : cards[0].slice.time
      : '--'
  })
  return result
})

// 目标选择器 v-model 代理至 store (地球上点击切片也会同步此处)
const selectedTargetIdProxy = computed<string>({
  get: () => situationStore.activeSliceTargetId,
  set: (val) => {
    situationStore.activeSliceTargetId = val
  }
})

function onTargetChange(id: string) {
  situationStore.activeSliceKey = null
  const target = situationStore.targets.find((t) => t.id === id)
  if (target) {
    cesiumController.focusTarget(target, 600000)
    ElMessage.info(`已切换至【${target.codeName}】时空切片对比`)
  }
}

// ---- 演变趋势指标 (全部计算自切片数据，无硬编码剧本) ----
const speedMetric = computed(() => {
  const list = slices.value
  if (!list.length) return { from: '--', mid: '--', to: '--', delta: '暂无切片', tone: 'neutral' }
  const presentSlice = list.find((s) => s.phase === 'present')
  const from = list[0].speedKnots
  const mid = presentSlice?.speedKnots ?? list[0].speedKnots
  const to = list[list.length - 1].speedKnots
  const pct = from > 0 ? Math.round(((to - from) / from) * 1000) / 10 : 0
  return {
    from: String(from),
    mid: String(mid),
    to: String(to),
    delta: `${pct >= 0 ? '加速' : '减速'} ${Math.abs(pct)}%`,
    tone: pct > 1 ? 'positive' : pct < -1 ? 'negative' : 'neutral'
  }
})

const altitudeMetric = computed(() => {
  const list = slices.value
  if (!list.length) {
    return { isSurface: false, from: '--', mid: '--', to: '--', delta: '暂无切片', tone: 'neutral', descending: false }
  }
  if (list.every((s) => s.altitude < 1)) {
    return { isSurface: true, from: '0', mid: '0', to: '0', delta: '水面航渡，无高程变化', tone: 'neutral', descending: false }
  }
  const presentSlice = list.find((s) => s.phase === 'present')
  const from = list[0].altitude
  const mid = presentSlice?.altitude ?? list[0].altitude
  const to = list[list.length - 1].altitude
  const deltaM = to - from
  return {
    isSurface: false,
    from: formatAlt(from),
    mid: formatAlt(mid),
    to: formatAlt(to),
    delta: `${deltaM >= 0 ? '爬升' : '俯冲'} ${Math.abs(deltaM)} m`,
    tone: deltaM < -500 ? 'critical' : deltaM > 500 ? 'positive' : 'neutral',
    descending: deltaM < 0
  }
})

const spanMetric = computed(() => {
  const list = slices.value
  if (!list.length) return { start: '--', end: '--' }
  return { start: list[0].time, end: list[list.length - 1].time }
})

// ---- 联动交互 ----
function isActiveCard(card: SliceCard) {
  const key = situationStore.activeSliceKey
  return !!key && key.targetId === situationStore.activeSliceTargetId && key.index === card.index
}

function onSliceClick(card: SliceCard) {
  if (!activeTarget.value) return
  situationStore.selectTemporalSlice(activeTarget.value.id, card.index)
  situationStore.seekTime(situationStore.getSliceFullTime(card.slice))
  // 斜视飞行 (pitch -45°)，让高度落差垂线可见
  cesiumController.flyToLocation(card.slice.longitude, card.slice.latitude, 450000, 0, -45)
}

function focusPhase(phase: TemporalPhase) {
  const card = slicesByPhase.value[phase][0]
  if (card) onSliceClick(card)
}

function startEvolutionPlayback() {
  situationStore.seekTime(situationStore.timelineRange[0])
  situationStore.playbackSpeed = 2
  situationStore.startPlayback()
  if (activeTarget.value) {
    cesiumController.focusTarget(activeTarget.value, 650000)
  }
  ElMessage.success('已启动全时空动态演化推流播放！')
}

function closeHUD() {
  situationStore.toggleTemporalSlices(false)
  ElMessage.info('已退出三态时空切片对比模式')
}

function formatLatLon(slice: TemporalSlice) {
  return `${slice.longitude.toFixed(2)}°E, ${slice.latitude.toFixed(2)}°N`
}

function formatAlt(altitude: number) {
  return altitude >= 1000 ? `${(altitude / 1000).toFixed(1)}km` : `${altitude}m`
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
  padding: 12px 16px;
  background: rgba(10, 18, 32, 0.96);
  border: 1px solid rgba(0, 210, 255, 0.5);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 210, 255, 0.25);
  border-radius: 4px;
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.hud-guide-bar {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  font-size: 11px;
  line-height: 1.6;
  color: #bad3f2;
  background: rgba(0, 210, 255, 0.08);
  border: 1px dashed rgba(0, 210, 255, 0.35);
  border-radius: 4px;

  :deep(.el-icon) { color: #00d2ff; margin-top: 2px; flex-shrink: 0; }

  b { color: #00d2ff; }

  .guide-close {
    flex-shrink: 0;
    color: #6e87ab;
    &:hover { color: #00d2ff; }
  }
}

.layer-switch-bar {
  display: flex;
  align-items: center;
  gap: 8px;

  .bar-label {
    font-size: 11px;
    color: #a2b7d4;
  }

  .layer-switch {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    font-size: 11px;
    color: #6e87ab;
    border: 1px solid rgba(110, 135, 171, 0.35);
    border-radius: 3px;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.4;
    }

    &.history.on {
      color: #00d2ff;
      border-color: rgba(0, 210, 255, 0.6);
      background: rgba(0, 210, 255, 0.12);
      .dot { opacity: 1; box-shadow: 0 0 6px #00d2ff; }
    }

    &.present.on {
      color: #52c41a;
      border-color: rgba(82, 196, 26, 0.6);
      background: rgba(82, 196, 26, 0.12);
      .dot { opacity: 1; box-shadow: 0 0 6px #52c41a; }
    }

    &.future.on {
      color: #d3adf7;
      border-color: rgba(211, 173, 247, 0.6);
      background: rgba(211, 173, 247, 0.12);
      .dot { opacity: 1; box-shadow: 0 0 6px #d3adf7; }
    }
  }

  .bar-hint {
    margin-left: auto;
    font-size: 10px;
    color: #4a5f7d;
  }
}

.metrics-summary-bar {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;

  .metric-item {
    background: rgba(14, 25, 43, 0.85);
    border: 1px solid rgba(0, 210, 255, 0.25);
    border-radius: 3px;
    padding: 7px 10px;
    display: flex;
    flex-direction: column;
    gap: 3px;

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
      &.neutral { color: #6e87ab; }
    }
  }
}

.phase-columns {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;

  .phase-col {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;

    .col-head {
      display: flex;
      flex-direction: column;
      gap: 1px;
      padding: 6px 9px;
      border-radius: 3px;
      background: rgba(14, 28, 48, 0.95);
      border: 1px solid transparent;

      .badge {
        font-size: 11px;
        font-weight: 700;
      }

      .time-range {
        font-size: 10px;
        color: #6e87ab;
        font-family: var(--font-family-mono);
      }

      &.history {
        border-color: rgba(0, 210, 255, 0.4);
        .badge { color: #00d2ff; }
      }

      &.present {
        border-color: rgba(82, 196, 26, 0.4);
        .badge { color: #52c41a; }
      }

      &.future {
        border-color: rgba(211, 173, 247, 0.4);
        .badge { color: #d3adf7; }
      }
    }

    .slice-card {
      padding: 6px 9px;
      border-radius: 3px;
      background: rgba(10, 20, 36, 0.7);
      border: 1px solid rgba(0, 210, 255, 0.18);
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        border-color: rgba(0, 210, 255, 0.55);
        background: rgba(16, 32, 56, 0.85);
      }

      &.active {
        border-color: #00d2ff;
        background: rgba(0, 210, 255, 0.12);
        box-shadow: 0 0 10px rgba(0, 210, 255, 0.35);
      }

      .row-main {
        display: flex;
        align-items: baseline;
        gap: 6px;

        .s-time {
          font-family: var(--font-family-mono);
          font-size: 12px;
          font-weight: 700;
          color: #f0f6fc;
        }

        .s-label {
          font-size: 11px;
          color: #a2b7d4;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .row-sub {
        display: flex;
        justify-content: space-between;
        gap: 6px;
        margin-top: 2px;
        font-size: 10px;
        color: #6e87ab;
        font-family: var(--font-family-mono);
      }

      .row-remark {
        margin-top: 3px;
        font-size: 10px;
        line-height: 1.4;
        color: #8ba3c2;
      }
    }

    .col-empty {
      padding: 10px 9px;
      font-size: 10px;
      color: #4a5f7d;
      text-align: center;
      border: 1px dashed rgba(110, 135, 171, 0.3);
      border-radius: 3px;
    }
  }
}

.hud-empty {
  padding: 24px;
  text-align: center;
  font-size: 12px;
  color: #6e87ab;
}

.hud-action-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(0, 210, 255, 0.25);
  padding-top: 8px;

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
