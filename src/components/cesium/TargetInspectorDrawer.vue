<template>
  <el-drawer
    v-model="visible"
    :title="`目标全维特性与综合研判 | ${target?.codeName || '未知目标'}`"
    :size="drawerSize"
    direction="rtl"
    :destroy-on-close="false"
  >
    <!-- 未选中目标时的引导态，避免打开空抽屉断头路 -->
    <div v-if="!target" class="empty-hint">
      <div class="hint-icon">🎯</div>
      <div class="hint-title">尚未选中研判目标</div>
      <div class="hint-desc">请先在三维地球中点击目标实体打开标牌，或通过工具栏选择目标后，再进行全维特性研判。</div>
    </div>

    <div v-else class="inspector-container">
      <!-- 目标顶部摘要卡片 -->
      <div class="target-summary-card tactical-panel">
        <div class="summary-header">
          <div class="name-badge">
            <span class="codename">{{ target.codeName }}</span>
            <span class="callsign">({{ target.callsign }})</span>
          </div>
          <span :class="['affiliation-tag', target.affiliation]">
            {{ getAffiliationBadge(target.affiliation).label }}
          </span>
        </div>

        <div class="summary-grid">
          <div class="grid-item">
            <span class="k">目标类型:</span>
            <span class="v">{{ getTargetTypeMeta(target.type).label }}</span>
          </div>
          <div class="grid-item">
            <span class="k">识别置信度:</span>
            <span class="v text-cyan">{{ identificationConfidence }}</span>
          </div>
          <div class="grid-item">
            <span class="k">实时位置:</span>
            <span class="v">{{ formatCoordinates(target.longitude, target.latitude, target.altitude) }}</span>
          </div>
          <div class="grid-item">
            <span class="k">航速与航向:</span>
            <span class="v">{{ speedHeading }}</span>
          </div>
        </div>

        <!-- 聚焦飞往按钮 -->
        <div class="summary-actions">
          <el-button size="small" type="primary" @click="focusTarget">
            <el-icon><Aim /></el-icon>
            <span>三维视窗聚焦</span>
          </el-button>
          <el-button size="small" plain @click="onAskAgent">
            <el-icon><ChatDotRound /></el-icon>
            <span>发送至智能研判</span>
          </el-button>
          <el-button
            v-if="target"
            size="small"
            :type="isWatched ? 'warning' : 'default'"
            @click="toggleWatch"
          >
            {{ isWatched ? '已关注' : '加入关注' }}
          </el-button>
        </div>
      </div>

      <!-- 5大深钻选项卡 -->
      <el-tabs v-model="activeTab" type="card" class="inspector-tabs">
        <!-- 选项卡 1: 基本态势 -->
        <el-tab-pane label="基本态势" name="basic">
          <div class="tab-scroll-box">
            <div class="section-title">时空状态与航迹信息</div>
            <div class="detail-row">
              <span class="label">首次发现时间:</span>
              <span class="val">{{ firstSeenTime }}</span>
            </div>
            <div class="detail-row">
              <span class="label">最后更新时间:</span>
              <span class="val">{{ lastSeenTime }}</span>
            </div>
            <div class="detail-row">
              <span class="label">观测数据集来源:</span>
              <span class="val text-cyan">{{ dataSources }}</span>
            </div>

            <!-- 多源冲突观测记录 (保留多源观测) -->
            <div v-if="target.conflicts && target.conflicts.length" class="conflict-card">
              <div class="conflict-header">
                <el-icon class="text-amber"><Warning /></el-icon>
                <span>多源冲突保留记录 (未直接覆盖事实)</span>
              </div>
              <div v-for="(conf, idx) in target.conflicts" :key="idx" class="conflict-item">
                <div class="obs-src">{{ conf.field }} [{{ conf.resolutionStatus === 'resolved' ? '已自适应融合' : '未决冲突' }}]</div>
                <div v-for="(obs, oIdx) in conf.observations" :key="oIdx" class="obs-content">
                  ● {{ obs.source }}: {{ obs.value }} (置信度: {{ (obs.confidence * 100).toFixed(0) }}%)
                </div>
              </div>
            </div>

            <!-- 航迹点序列 -->
            <div class="section-title" style="margin-top: 16px">时空采样航迹点 ({{ target.tracks?.length || 0 }} 点)</div>
            <el-table :data="target.tracks || []" size="small" max-height="220">
              <el-table-column prop="timestamp" label="时点" width="140" />
              <el-table-column label="经度/纬度/高度">
                <template #default="{ row }">
                  东经 {{ row.longitude.toFixed(2) }}°, 北纬 {{ row.latitude.toFixed(2) }}°, {{ row.altitude }}米
                </template>
              </el-table-column>
              <el-table-column prop="speedKnots" label="航速" width="80">
                <template #default="{ row }">{{ row.speedKnots }} 节</template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 选项卡 2: 光学与雷达高维特性 -->
        <el-tab-pane label="目标高维特性" name="characteristic">
          <div class="tab-scroll-box">
            <template v-if="target.opticalFeatures || target.radarFeatures">
              <!-- 光学特性 -->
              <div v-if="target.opticalFeatures" class="char-block">
                <div class="char-header optical">
                  <span class="tag">光电特征</span>
                  <span class="title">光学物理特性与图像识别</span>
                </div>
                <div class="char-grid">
                  <div class="c-item">
                    <span class="k">几何外形尺寸:</span>
                    <span class="v">长 {{ target.opticalFeatures.lengthMeters }} 米 × 翼展 {{ target.opticalFeatures.wingspanMeters }} 米</span>
                  </div>
                  <div class="c-item">
                    <span class="k">双垂尾/尾翼:</span>
                    <span class="v text-cyan">{{ target.opticalFeatures.hasDualTail ? '具备倾斜双垂尾' : '常规单垂尾/无尾' }}</span>
                  </div>
                  <div class="c-item">
                    <span class="k">红外热斑检测:</span>
                    <span class="v text-amber">{{ opticalHotspotText }}</span>
                  </div>
                  <div class="c-item">
                    <span class="k">低可探测涂层:</span>
                    <span class="v text-cyan">{{ stealthCoatingText }}</span>
                  </div>
                  <div class="c-item full">
                    <span class="k">光学识别置信度:</span>
                    <span class="v text-green font-mono">{{ opticalConfidenceText }}</span>
                  </div>
                </div>
              </div>

              <!-- 雷达特性 -->
              <div v-if="target.radarFeatures" class="char-block" style="margin-top: 14px">
                <div class="char-header radar">
                  <span class="tag">雷达特征</span>
                  <span class="title">雷达电磁与散射截面特征</span>
                </div>
                <div class="char-grid">
                  <div class="c-item">
                    <span class="k">散射截面均值:</span>
                    <span class="v text-cyan font-mono">{{ target.radarFeatures.rcsMeanSqMeters }} ㎡ (RCS)</span>
                  </div>
                  <div class="c-item">
                    <span class="k">多普勒频移:</span>
                    <span class="v font-mono">{{ target.radarFeatures.dopplerShiftHz }} Hz</span>
                  </div>
                  <div class="c-item full">
                    <span class="k">探测工作频段:</span>
                    <span class="v text-cyan">{{ target.radarFeatures.frequencyBand }}</span>
                  </div>
                  <div class="c-item">
                    <span class="k">脉冲宽度/重频:</span>
                    <span class="v font-mono">{{ pulseText }}</span>
                  </div>
                  <div class="c-item">
                    <span class="k">信号调制类型:</span>
                    <span class="v text-cyan">{{ target.radarFeatures.modulationType || '暂无观测记录' }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="char-empty">
              该目标暂未提取到光学/雷达高维特性数据，特征提取完成后将自动呈现。
            </div>
          </div>
        </el-tab-pane>

        <!-- 选项卡 3: 可信证据链溯源 -->
        <el-tab-pane label="证据链溯源" name="evidence">
          <div class="tab-scroll-box">
            <div class="evidence-intro">
              依据领域本体受约束推理，研判结论由以下可信证据链条直接溯源至数据中台原始观测记录：
            </div>

            <div v-if="!evidenceList.length" class="char-empty">该目标暂无关联证据记录。</div>

            <div v-for="evi in evidenceList" :key="evi.id" class="evidence-card tactical-panel">
              <div class="evi-header">
                <span class="evi-code">【{{ evi.id }}】</span>
                <span class="evi-title">{{ evi.title }}</span>
                <el-tag size="small" type="success">{{ ((evi.confidenceScore ?? 0) * 100).toFixed(0) }}% 置信度</el-tag>
              </div>
              <div class="evi-summary">{{ evi.payloadSummary }}</div>
              <div class="evi-source">
                <span>数据来源: {{ evi.sourceType }}</span>
                <span class="raw-ref">数据集版本: {{ evi.datasetVersion }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 选项卡 4: 特性基线对照 -->
        <el-tab-pane label="特性基线对照" name="historical">
          <div class="tab-scroll-box">
            <div class="evidence-intro">
              以下为目标特性知识库中的历史基线记录，供与当前目标特性进行人工比对参考：
            </div>
            <div v-for="item in HISTORICAL_SIMILAR_TARGETS" :key="item.targetCode" class="hist-card">
              <div class="hist-header">
                <span class="hist-name">{{ item.targetName }}</span>
                <span class="hist-score">{{ (item.similarityScore * 100).toFixed(1) }}% 特征吻合</span>
              </div>
              <div class="hist-desc">{{ item.description }}</div>
              <div class="hist-tags">
                <span v-for="(m, i) in item.keyMatches" :key="i" class="match-tag">{{ m }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 选项卡 5: 关联与事件 -->
        <el-tab-pane label="关联与事件" name="relations">
          <div class="tab-scroll-box">
            <div class="section-title">关联态势事件 ({{ targetEvents.length }})</div>
            <div v-if="!targetEvents.length" class="char-empty">暂无关联态势事件。</div>
            <div v-for="e in targetEvents" :key="e.id" class="event-item">
              <div class="e-name text-red">{{ e.eventName }}</div>
              <div class="e-desc">{{ e.description }}</div>
              <div class="e-time">{{ e.timestamp }}</div>
            </div>

            <div class="section-title" style="margin-top: 16px">协同指挥与威胁关系 ({{ targetRelations.length }})</div>
            <div v-if="!targetRelations.length" class="char-empty">暂无协同与威胁关系记录。</div>
            <div v-for="r in targetRelations" :key="r.id" class="relation-item">
              <div class="r-name text-cyan">{{ r.relationName }}</div>
              <div class="r-sem">{{ r.description }}</div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSituationStore } from '@/stores/situationStore'
import { useSceneStore } from '@/stores/sceneStore'
import { cesiumController } from '@/utils/cesiumHelper'
import { ElMessage } from 'element-plus'
import {
  formatCoordinates,
  formatSpeed,
  getAffiliationBadge,
  getTargetTypeMeta
} from '@/utils/formatters'
import { HISTORICAL_SIMILAR_TARGETS } from '@/mock/mockIntelligence'
import {
  Aim,
  ChatDotRound,
  Warning
} from '@element-plus/icons-vue'

const emit = defineEmits(['ask-agent'])
const situationStore = useSituationStore()
const sceneStore = useSceneStore()

const visible = ref(false)
const activeTab = ref('characteristic')

const drawerSize = computed(() => {
  if (typeof window !== 'undefined' && window.innerWidth < 1440) {
    return '420px'
  }
  return '540px'
})

const target = computed(() => situationStore.selectedTarget)
const isWatched = computed(() => !!target.value && situationStore.watchedTargetIds.includes(target.value.id))

function toggleWatch() {
  if (target.value) situationStore.toggleWatchTarget(target.value.id)
}

const evidenceList = computed(() => situationStore.selectedTargetEvidences)
const targetEvents = computed(() => situationStore.selectedTargetEvents)
const targetRelations = computed(() => situationStore.selectedTargetRelations)

// 切换目标时回到默认页签，避免停留在上一目标的高维特性页签看到空白
watch(() => target.value?.id, () => {
  activeTab.value = 'characteristic'
})

// ---- 全部派生自真实证据/航迹数据，缺失时明示"暂无"，不以兜底值伪装事实 ----
const identificationConfidence = computed(() => {
  const evs = evidenceList.value
  if (!evs.length) return '暂无证据支撑'
  const avg = evs.reduce((s, e) => s + (e.confidenceScore ?? 0), 0) / evs.length
  return `${(avg * 100).toFixed(0)}% (证据链均值)`
})

const firstSeenTime = computed(() => target.value?.tracks?.[0]?.timestamp || '暂无航迹记录')
const lastSeenTime = computed(() => {
  const tracks = target.value?.tracks
  return tracks?.length ? tracks[tracks.length - 1].timestamp : '暂无航迹记录'
})

const dataSources = computed(() => {
  const names = evidenceList.value
    .map((e) => e.sourceDatasetName || e.sourceDatasetId)
    .filter((n): n is string => !!n)
  return Array.from(new Set(names)).join('、') || '暂无关联数据集'
})

const speedHeading = computed(() => {
  const t = target.value
  if (!t) return '--'
  const mach = t.type === 'aircraft' ? ` (${formatSpeed(t.speedKnots)?.mach})` : ''
  return `${t.speedKnots} 节${mach} / ${t.headingDeg}°`
})

const opticalHotspotText = computed(() => {
  const count = target.value?.opticalFeatures?.infraredHotspotCount
  return count !== undefined ? `${count} 处主发动机喷口热斑` : '暂无检测记录'
})

const stealthCoatingText = computed(() => {
  const detected = target.value?.opticalFeatures?.stealthCoatingDetected
  if (detected === true) return '检测到吸波复合涂层'
  if (detected === false) return '未检测到吸波涂层'
  return '暂无探测记录'
})

const opticalConfidenceText = computed(() => {
  const confidence = target.value?.opticalFeatures?.confidence
  return confidence !== undefined ? `${(confidence * 100).toFixed(0)}% (几何匹配)` : '暂无'
})

const pulseText = computed(() => {
  const rf = target.value?.radarFeatures
  if (!rf) return '--'
  const pw = rf.pulseWidthUs !== undefined ? `${rf.pulseWidthUs} μs` : '未观测'
  const pri = rf.priUs !== undefined ? `${rf.priUs} μs` : '未观测'
  return `${pw} / ${pri}`
})

function focusTarget() {
  if (target.value) {
    sceneStore.showTargetAndFeatures(target.value.id)
    situationStore.openTargetPopup(target.value.id)
    cesiumController.focusTarget(target.value, 650000)
  }
}

function onAskAgent() {
  if (!target.value) return
  emit('ask-agent', `深度研判目标 ${target.value.codeName} 的目标特性、活动规律与威胁程度`)
  ElMessage.success('研判指令已发送至智能业务助手')
}

defineExpose({
  open: (targetId?: string) => {
    if (targetId) {
      situationStore.selectTarget(targetId)
    }
    visible.value = true
  }
})
</script>

<style scoped lang="scss">
.empty-hint {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 0 24px;

  .hint-icon { font-size: 40px; }
  .hint-title { font-size: 15px; font-weight: 700; color: #f0f6fc; }
  .hint-desc { font-size: 12px; color: #6e87ab; line-height: 1.6; }
}

.char-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #4a5f7d;
  border: 1px dashed rgba(110, 135, 171, 0.3);
  border-radius: 4px;
}

.inspector-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  max-height: calc(100vh - 85px);
  overflow: hidden;
}

.target-summary-card {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .name-badge {
      display: flex;
      align-items: baseline;
      gap: 6px;

      .codename {
        font-size: 16px;
        font-weight: 700;
        color: #f0f6fc;
      }
      .callsign {
        font-size: 12px;
        color: #6e87ab;
        font-family: var(--font-family-mono);
      }
    }

    .affiliation-tag {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 3px;
      font-weight: 600;

      &.foe {
        background: rgba(255, 77, 79, 0.2);
        color: #ff4d4f;
        border: 1px solid rgba(255, 77, 79, 0.4);
      }
      &.friend {
        background: rgba(0, 210, 255, 0.2);
        color: #00d2ff;
        border: 1px solid rgba(0, 210, 255, 0.4);
      }
      &.neutral {
        background: rgba(250, 173, 20, 0.2);
        color: #faad14;
        border: 1px solid rgba(250, 173, 20, 0.4);
      }
    }
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    background: rgba(0, 0, 0, 0.25);
    padding: 8px 10px;
    border-radius: 4px;

    .grid-item {
      display: flex;
      flex-direction: column;
      font-size: 12px;
      .k { color: #6e87ab; font-size: 11px; }
      .v { color: #f0f6fc; font-weight: 600; }
    }
  }

  .summary-actions {
    display: flex;
    gap: 8px;
  }
}

.inspector-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.el-tabs__header) {
    margin: 0 0 10px 0;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
  }

  :deep(.el-tab-pane) {
    height: 100%;
  }
}

.tab-scroll-box {
  height: 100%;
  overflow-y: auto;
  padding-right: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #00d2ff;
  border-left: 3px solid #00d2ff;
  padding-left: 6px;
  margin-bottom: 6px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  background: rgba(14, 25, 43, 0.5);
  border-radius: 3px;
  font-size: 12px;
  .label { color: #6e87ab; }
  .val { color: #bad3f2; font-family: var(--font-family-mono); }
}

.conflict-card {
  padding: 10px;
  background: rgba(250, 173, 20, 0.1);
  border: 1px solid rgba(250, 173, 20, 0.35);
  border-radius: 4px;
  margin: 6px 0;

  .conflict-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    color: #faad14;
    margin-bottom: 6px;
  }

  .conflict-item {
    font-size: 11px;
    line-height: 1.5;
    .obs-src { color: #ffd666; font-weight: 600; }
    .obs-content { color: #bad3f2; margin-left: 6px; }
  }
}

.char-block {
  background: rgba(14, 25, 43, 0.7);
  border: 1px solid rgba(0, 210, 255, 0.25);
  border-radius: 4px;
  padding: 10px;

  .char-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .tag {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 2px;
      background: rgba(0, 210, 255, 0.2);
      color: #00d2ff;
      font-weight: 700;
    }
    .title {
      font-size: 13px;
      font-weight: 700;
      color: #f0f6fc;
    }
  }

  .char-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;

    .c-item {
      font-size: 11px;
      display: flex;
      flex-direction: column;
      background: rgba(0, 0, 0, 0.2);
      padding: 4px 6px;
      border-radius: 3px;
      .k { color: #6e87ab; }
      .v { color: #bad3f2; font-weight: 600; }

      &.full {
        grid-column: 1 / -1;
      }
    }
  }
}

.evidence-intro {
  font-size: 12px;
  color: #6e87ab;
  line-height: 1.4;
  margin-bottom: 8px;
}

.evidence-card {
  padding: 10px;
  margin-bottom: 8px;

  .evi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;

    .evi-code { color: #52c41a; font-weight: 700; font-size: 12px; }
    .evi-title { font-weight: 600; font-size: 13px; color: #f0f6fc; flex: 1; margin-left: 6px; }
  }

  .evi-summary {
    font-size: 12px;
    color: #bad3f2;
    line-height: 1.4;
    margin-bottom: 6px;
  }

  .evi-source {
    font-size: 10px;
    color: #6e87ab;
    display: flex;
    justify-content: space-between;
  }
}

.hist-card {
  padding: 10px;
  background: rgba(14, 25, 43, 0.7);
  border: 1px solid rgba(0, 210, 255, 0.2);
  border-radius: 4px;
  margin-bottom: 8px;

  .hist-header {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 700;
    .hist-name { color: #f0f6fc; }
    .hist-score { color: #00d2ff; }
  }

  .hist-desc {
    font-size: 11px;
    color: #6e87ab;
    margin: 4px 0;
  }

  .hist-tags {
    display: flex;
    gap: 4px;
    .match-tag {
      font-size: 10px;
      padding: 1px 5px;
      background: rgba(0, 210, 255, 0.1);
      border: 1px solid rgba(0, 210, 255, 0.2);
      border-radius: 2px;
      color: #bad3f2;
    }
  }
}

.event-item, .relation-item {
  padding: 8px;
  background: rgba(14, 25, 43, 0.6);
  border-radius: 4px;
  margin-bottom: 6px;
  font-size: 12px;

  .e-name, .r-name { font-weight: 700; margin-bottom: 2px; }
  .e-desc, .r-sem { font-size: 11px; color: #bad3f2; line-height: 1.4; }
  .e-time { font-size: 10px; color: #6e87ab; margin-top: 4px; font-family: var(--font-family-mono); }
}
</style>
