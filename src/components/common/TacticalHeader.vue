<template>
  <header class="tactical-header">
    <!-- 左侧系统标识与状态 -->
    <div class="header-left">
      <div class="logo-box">
        <el-icon class="logo-icon"><Platform /></el-icon>
        <div class="title-group">
          <div class="main-title">数字地球与智能态势显示系统</div>
          <div class="sub-title">智能情报态势显示工作台</div>
        </div>
      </div>
    </div>

    <!-- 中间主业务导航 -->
    <nav class="header-nav">
      <router-link to="/workbench" class="nav-item" active-class="active">
        <el-icon><Compass /></el-icon>
        <span>三维态势主工作台</span>
      </router-link>
      <router-link v-if="identityStore.canDo('fusion')" to="/fusion" class="nav-item" active-class="active">
        <el-icon><Connection /></el-icon>
        <span>多源时空数据融合</span>
      </router-link>
      <router-link to="/analytics" class="nav-item" active-class="active">
        <el-icon><DataAnalysis /></el-icon>
        <span>多维统计研判</span>
      </router-link>
      <router-link to="/ontology" class="nav-item" active-class="active">
        <el-icon><Share /></el-icon>
        <span>领域本体知识图谱</span>
      </router-link>
    </nav>

    <!-- 右侧时钟与研判助手入口 -->
    <div class="header-right">
      <div class="clock-box">
        <div class="bjt-time">北京时间: {{ bjtTime }}</div>
        <div class="utc-time">世界时: {{ utcTime }}</div>
      </div>

      <el-button size="small" type="primary" plain @click="emit('toggle-agent')">
        <el-icon><ChatDotRound /></el-icon>
        <span>研判助手</span>
      </el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useIdentityStore } from '@/stores/identityStore'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import {
  Platform,
  Compass,
  Connection,
  DataAnalysis,
  Share,
  ChatDotRound
} from '@element-plus/icons-vue'

dayjs.extend(utc)

const emit = defineEmits(['toggle-agent'])
const identityStore = useIdentityStore()

const bjtTime = ref('')
const utcTime = ref('')
let timer: any = null

function updateClock() {
  const now = dayjs()
  bjtTime.value = now.format('HH:mm:ss')
  utcTime.value = now.utc().format('HH:mm:ss')
}

onMounted(() => {
  updateClock()
  timer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped lang="scss">
.tactical-header {
  height: 56px;
  background: linear-gradient(180deg, rgba(14, 25, 43, 0.98) 0%, rgba(9, 16, 29, 0.96) 100%);
  border-bottom: 1px solid rgba(0, 210, 255, 0.35);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  z-index: 100;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 18px;

  .logo-box {
    display: flex;
    align-items: center;
    gap: 12px;

    .logo-icon {
      font-size: 26px;
      color: #00d2ff;
      filter: drop-shadow(0 0 8px rgba(0, 210, 255, 0.65));
    }

    .title-group {
      .main-title {
        font-size: 17px;
        font-weight: 700;
        letter-spacing: 0.8px;
        background: linear-gradient(90deg, #ffffff 0%, #00d2ff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .sub-title {
        font-size: 11px;
        color: #6e87ab;
        letter-spacing: 0.5px;
      }
    }
  }
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 8px;

  .nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    color: #a2b7d4;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    border-radius: 3px;
    border: 1px solid transparent;
    transition: all 0.2s ease;

    &:hover {
      color: #00d2ff;
      background: rgba(0, 210, 255, 0.12);
    }

    &.active {
      color: #00d2ff;
      background: rgba(0, 210, 255, 0.2);
      border-color: rgba(0, 210, 255, 0.45);
      box-shadow: 0 0 12px rgba(0, 210, 255, 0.35) inset;
      font-weight: 600;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;

  .clock-box {
    text-align: right;
    font-family: var(--font-family-mono);
    line-height: 1.3;

    .bjt-time {
      color: #00d2ff;
      font-size: 13px;
      font-weight: 700;
    }
    .utc-time {
      color: #6e87ab;
      font-size: 11px;
    }
  }
}

@media (max-width: 1440px) {
  .tactical-header {
    padding: 0 10px;
  }

  .header-left {
    gap: 10px;
    .title-group .main-title {
      font-size: 15px;
    }
  }

  .header-nav {
    gap: 4px;
    .nav-item {
      padding: 6px 10px;
      font-size: 13px;
      gap: 5px;
    }
  }

  .header-right {
    gap: 10px;
    .scene-badge .scene-name {
      max-width: 120px;
    }
  }
}

@media (max-width: 1200px) {
  .header-left .title-group .sub-title {
    display: none;
  }
  .header-right .clock-box .utc-time {
    display: none;
  }
}
</style>
