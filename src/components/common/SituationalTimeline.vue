<template>
  <div class="situational-timeline tactical-panel">
    <div class="timeline-controls">
      <!-- 播放控制区 -->
      <div class="playback-btn-group">
        <el-button size="small" circle @click="stepBackward" title="后退10分钟">
          <el-icon><DArrowLeft /></el-icon>
        </el-button>

        <el-button
          size="small"
          type="primary"
          circle
          :icon="situationStore.isPlaying ? VideoPause : VideoPlay"
          :title="situationStore.isPlaying ? '暂停回放' : '开始4D动态时空全域演变推流'"
          @click="situationStore.togglePlay"
        />

        <el-button size="small" circle @click="stepForward" title="前进10分钟">
          <el-icon><DArrowRight /></el-icon>
        </el-button>

        <el-select
          v-model="situationStore.playbackSpeed"
          size="small"
          style="width: 88px; margin-left: 4px"
          @change="(v: number) => situationStore.setSpeed(v)"
        >
          <el-option :value="1" label="1x 正常" />
          <el-option :value="2" label="2x 快速" />
          <el-option :value="4" label="4x 高速" />
          <el-option :value="8" label="8x 极速" />
        </el-select>
      </div>

      <!-- 当前研判时点与时空阶段徽章 -->
      <div class="time-readout">
        <span class="label">4D时空演变时点:</span>
        <span class="value">{{ situationStore.currentPlaybackTime }}</span>

        <!-- 时空演进阶段状态标签 -->
        <span :class="['phase-tag', situationStore.currentTemporalPhase]">
          <span v-if="situationStore.currentTemporalPhase === 'history'">⏱️ 历史观测回放 (T-N)</span>
          <span v-else-if="situationStore.currentTemporalPhase === 'present'">🟢 当前事实基准 (T0)</span>
          <span v-else>🔮 未来推演预测 (T+N)</span>
        </span>

        <!-- 战场气象环境实时态势徽章 -->
        <div class="weather-badge">
          <span class="w-icon">🌧️</span>
          <span class="w-text">{{ situationStore.environment.weatherName }} | 能见度 {{ situationStore.environment.visibilityKm }}km</span>
        </div>
      </div>

      <!-- 时空研判模式与快捷跳转按钮 -->
      <div class="right-actions">
        <!-- 四大时空联动模式按钮 -->
        <div class="temporal-mode-buttons">
          <el-button
            size="small"
            :type="situationStore.showTemporalSlices ? 'primary' : 'default'"
            :plain="!situationStore.showTemporalSlices"
            @click="onToggleTemporalSlices"
            title="在三维地球上同时打亮历史T-30、当前T0与未来T+30切片点位并展开对比透视面板"
          >
            <span>📐 三态切片对比</span>
          </el-button>

          <el-button
            size="small"
            :type="situationStore.showFutureBranches ? 'warning' : 'default'"
            :plain="!situationStore.showFutureBranches"
            @click="onToggleFutureBranches"
            title="展示敌重点目标低空突防 vs 爬升压制的多分支未来推演假说"
          >
            <span>🔮 未来多分支推演</span>
          </el-button>
        </div>

        <div class="divider"></div>

        <el-button size="small" plain @click="jumpToStart" title="跳至历史观测起点 13:00">
          <span>历史 13:00</span>
        </el-button>
        <el-button size="small" type="success" plain @click="jumpToNow" title="跳至当前事实基准点 15:30">
          <el-icon><Timer /></el-icon>
          <span>基准 15:30</span>
        </el-button>
        <el-button size="small" type="primary" plain @click="jumpToFutureEnd" title="跳至未来推演终点 16:30">
          <span>未来 16:30</span>
        </el-button>
      </div>
    </div>

    <!-- 三段式 4D 时空演变全景滑轨 (历史 13:00~15:30 ➔ 基准 15:30 ➔ 未来 15:30~16:30) -->
    <div class="timeline-slider-box">
      <div class="time-boundary start">13:00 [历史起点]</div>
      <div class="slider-wrapper">
        <!-- 三段式时空底色背景指示 -->
        <div class="temporal-zone-background">
          <div class="zone history-zone" title="历史观测事实区间 (13:00 ~ 15:30)">
            <span class="zone-text">历史观测区间 (Past Facts)</span>
          </div>
          <div class="zone present-anchor" title="当前态势基准锚点 T0 (15:30:00)">
            <div class="anchor-pin"></div>
            <span class="anchor-tag">T0 当前基准</span>
          </div>
          <div class="zone future-zone" title="未来推演与多分支预测区间 (15:30 ~ 16:30)">
            <span class="zone-text">未来预测推演 (Future Prediction)</span>
          </div>
        </div>

        <!-- 历史/未来态势事件与高频活动密度条 -->
        <div class="density-bars">
          <div class="bar history" style="left: 12%; height: 40%"></div>
          <div class="bar history" style="left: 28%; height: 60%"></div>
          <div class="bar history" style="left: 48%; height: 85%"></div>
          <div class="bar present" style="left: 71.4%; height: 100%"></div>
          <div class="bar future" style="left: 82%; height: 75%"></div>
          <div class="bar future" style="left: 94%; height: 90%"></div>
        </div>

        <el-slider
          v-model="computedSliderPos"
          :min="0"
          :max="100"
          :step="0.5"
          :format-tooltip="formatTooltip"
          @input="onSliderInput"
        />
      </div>
      <div class="time-boundary end">16:30 [未来终点]</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSituationStore } from '@/stores/situationStore'
import { cesiumController } from '@/utils/cesiumHelper'
import { ElMessage } from 'element-plus'
import {
  VideoPlay,
  VideoPause,
  DArrowLeft,
  DArrowRight,
  Timer
} from '@element-plus/icons-vue'

const situationStore = useSituationStore()

// 总时长 210 分钟 (13:00 到 16:30)，15:30 位于 150/210 ≈ 71.43%
const TOTAL_MINUTES = 210
const START_HOUR = 13
const START_MIN = 0

const computedSliderPos = computed({
  get: () => {
    const curMs = new Date(situationStore.currentPlaybackTime).getTime()
    const startMs = new Date('2026-08-25 13:00:00').getTime()
    const totalMs = TOTAL_MINUTES * 60 * 1000
    const pos = Math.max(0, Math.min(100, ((curMs - startMs) / totalMs) * 100))
    return Math.round(pos * 10) / 10
  },
  set: (val: number) => {
    onSliderInput(val)
  }
})

function formatTooltip(val: number) {
  const totalPassedMins = (val / 100) * TOTAL_MINUTES
  const hour = START_HOUR + Math.floor((START_MIN + totalPassedMins) / 60)
  const min = Math.floor((START_MIN + totalPassedMins) % 60)
  const pad = (n: number) => (n < 10 ? `0${n}` : n)
  const timeStr = `${pad(hour)}:${pad(min)}:00`
  if (hour < 15 || (hour === 15 && min < 30)) {
    return `[历史观测] ${timeStr}`
  } else if (hour === 15 && min === 30) {
    return `[当前基准] ${timeStr}`
  } else {
    return `[未来推演] ${timeStr}`
  }
}

function onSliderInput(val: number) {
  const totalPassedMins = (val / 100) * TOTAL_MINUTES
  const hour = START_HOUR + Math.floor((START_MIN + totalPassedMins) / 60)
  const min = Math.floor((START_MIN + totalPassedMins) % 60)
  const pad = (n: number) => (n < 10 ? `0${n}` : n)
  const timeStr = `2026-08-25 ${pad(hour)}:${pad(min)}:00`
  situationStore.seekTime(timeStr)
}

function stepBackward() {
  const curMs = new Date(situationStore.currentPlaybackTime).getTime()
  const nextMs = Math.max(new Date('2026-08-25 13:00:00').getTime(), curMs - 10 * 60 * 1000)
  const d = new Date(nextMs)
  const pad = (n: number) => (n < 10 ? `0${n}` : n)
  situationStore.seekTime(`2026-08-25 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`)
}

function stepForward() {
  const curMs = new Date(situationStore.currentPlaybackTime).getTime()
  const nextMs = Math.min(new Date('2026-08-25 16:30:00').getTime(), curMs + 10 * 60 * 1000)
  const d = new Date(nextMs)
  const pad = (n: number) => (n < 10 ? `0${n}` : n)
  situationStore.seekTime(`2026-08-25 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`)
}

function jumpToStart() {
  situationStore.seekTime('2026-08-25 13:00:00')
}

function jumpToNow() {
  situationStore.seekTime('2026-08-25 15:30:00')
}

function jumpToFutureEnd() {
  situationStore.seekTime('2026-08-25 16:30:00')
}

function onToggleTemporalSlices() {
  situationStore.toggleTemporalSlices()
  if (situationStore.showTemporalSlices) {
    const target = situationStore.targets.find((t) => t.id === 'Target-001')
    if (target) {
      cesiumController.focusTarget(target, 550000)
    }
    ElMessage.success('已开启三态时空切片对比！已展开全景对比透视面板并定位至海峡空域')
  } else {
    ElMessage.info('已关闭三态时空切片对比模式')
  }
}

function onToggleFutureBranches() {
  situationStore.toggleFutureBranches()
  if (situationStore.showFutureBranches) {
    const target = situationStore.targets.find((t) => t.id === 'Target-001')
    if (target) {
      cesiumController.focusTarget(target, 550000)
    }
    ElMessage.success('已开启未来多分支推演比对！已同屏绘制分支A（掠海突防）与分支B（高空压制）')
  } else {
    ElMessage.info('已关闭未来多分支推演模式')
  }
}
</script>

<style scoped lang="scss">
.situational-timeline {
  height: 88px;
  padding: 8px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 10;
  background: rgba(10, 18, 32, 0.94);
}

.timeline-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .playback-btn-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .time-readout {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-family-mono);

    .label {
      font-size: 13px;
      color: #a2b7d4;
    }
    .value {
      font-size: 15px;
      font-weight: 700;
      color: #00d2ff;
      letter-spacing: 0.8px;
    }

    .phase-tag {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 3px;
      font-weight: 600;

      &.history {
        background: rgba(0, 210, 255, 0.18);
        color: #00d2ff;
        border: 1px solid rgba(0, 210, 255, 0.5);
      }
      &.present {
        background: rgba(82, 196, 26, 0.22);
        color: #52c41a;
        border: 1px solid rgba(82, 196, 26, 0.6);
        box-shadow: 0 0 8px rgba(82, 196, 26, 0.4);
      }
      &.future {
        background: rgba(179, 127, 235, 0.22);
        color: #d3adf7;
        border: 1px solid rgba(179, 127, 235, 0.6);
        box-shadow: 0 0 8px rgba(179, 127, 235, 0.35);
      }
    }

    .weather-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 8px;
      background: rgba(0, 210, 255, 0.1);
      border: 1px solid rgba(0, 210, 255, 0.25);
      border-radius: 3px;
      font-size: 11px;
      color: #bad3f2;
      font-family: var(--font-family-tactical);
    }
  }

  .right-actions {
    display: flex;
    align-items: center;
    gap: 8px;

    .temporal-mode-buttons {
      display: flex;
      gap: 6px;
    }

    .divider {
      width: 1px;
      height: 16px;
      background: rgba(0, 210, 255, 0.25);
      margin: 0 4px;
    }
  }
}

.timeline-slider-box {
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  margin-top: 2px;

  .time-boundary {
    font-size: 11px;
    color: #6e87ab;
    font-family: var(--font-family-mono);
    white-space: nowrap;

    &.start {
      color: #00d2ff;
    }
    &.end {
      color: #b37feb;
    }
  }

  .slider-wrapper {
    flex: 1;
    position: relative;

    /* 三段式时空底色标识带 */
    .temporal-zone-background {
      position: absolute;
      top: -6px;
      left: 0;
      right: 0;
      height: 20px;
      display: flex;
      pointer-events: none;
      border-radius: 3px;
      overflow: hidden;

      .history-zone {
        width: 71.43%;
        background: linear-gradient(90deg, rgba(0, 210, 255, 0.12) 0%, rgba(0, 210, 255, 0.22) 100%);
        border-right: 2px solid #52c41a;
        display: flex;
        align-items: center;
        padding-left: 8px;

        .zone-text {
          font-size: 10px;
          color: rgba(0, 210, 255, 0.7);
          letter-spacing: 0.5px;
        }
      }

      .present-anchor {
        position: absolute;
        left: 71.43%;
        top: -8px;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 5;

        .anchor-pin {
          width: 3px;
          height: 14px;
          background: #52c41a;
          box-shadow: 0 0 8px #52c41a;
        }

        .anchor-tag {
          font-size: 9px;
          color: #52c41a;
          font-weight: 700;
          white-space: nowrap;
          background: rgba(8, 16, 28, 0.95);
          padding: 0 3px;
          border-radius: 2px;
          border: 1px solid rgba(82, 196, 26, 0.6);
        }
      }

      .future-zone {
        width: 28.57%;
        background: linear-gradient(90deg, rgba(179, 127, 235, 0.22) 0%, rgba(179, 127, 235, 0.12) 100%);
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 8px;

        .zone-text {
          font-size: 10px;
          color: rgba(179, 127, 235, 0.85);
          letter-spacing: 0.5px;
        }
      }
    }

    .density-bars {
      position: absolute;
      top: -18px;
      left: 0;
      right: 0;
      height: 14px;
      pointer-events: none;

      .bar {
        position: absolute;
        bottom: 0;
        width: 4px;
        border-radius: 2px;

        &.history {
          background: rgba(0, 210, 255, 0.65);
        }
        &.present {
          background: #52c41a;
          box-shadow: 0 0 6px #52c41a;
        }
        &.future {
          background: #b37feb;
          box-shadow: 0 0 6px #b37feb;
        }
      }
    }
  }
}

@media (max-width: 1440px) {
  .situational-timeline {
    height: 82px;
    padding: 6px 12px;
  }

  .time-readout .weather-badge {
    display: none;
  }

  .right-actions .temporal-mode-buttons .el-button {
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>
