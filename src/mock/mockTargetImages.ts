/**
 * @file mockTargetImages.ts
 * @description 作战装备高精度战术蓝图矢量图像（100%本地嵌入，零网络依赖，支持即时高清渲染）
 */

// 1. 我方052D型导弹驱逐舰 (PLAN-DDG-173) 战术蓝图
export const SVG_WARSHIP_052D = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#071426"/>
      <stop offset="50%" stop-color="#0b223d"/>
      <stop offset="100%" stop-color="#050e1c"/>
    </linearGradient>
    <linearGradient id="hullGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#00d2ff"/>
      <stop offset="100%" stop-color="#005580"/>
    </linearGradient>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 210, 255, 0.12)" stroke-width="0.8"/>
    </pattern>
  </defs>

  <!-- 背景与战术网格 -->
  <rect width="600" height="240" fill="url(#bgGrad)"/>
  <rect width="600" height="240" fill="url(#grid)"/>

  <!-- 052D 驱逐舰舰体主轮廓 (正侧视战术剪影) -->
  <!-- 水位线 -->
  <line x1="30" y1="180" x2="570" y2="180" stroke="#00ffff" stroke-width="1.5" stroke-dasharray="6,3" opacity="0.6"/>

  <!-- 主舰体 -->
  <path d="M 45 180 L 70 135 L 210 135 L 230 110 L 310 110 L 340 135 L 530 145 L 555 180 Z" fill="rgba(0, 210, 255, 0.18)" stroke="#00d2ff" stroke-width="2"/>
  <!-- 水下球鼻艏 -->
  <path d="M 45 180 Q 55 195 75 190 L 535 185 L 555 180 Z" fill="rgba(0, 100, 160, 0.35)" stroke="#0088cc" stroke-width="1"/>

  <!-- 346A 相控阵雷达综合主桅塔 -->
  <path d="M 230 110 L 245 60 L 295 60 L 310 110 Z" fill="rgba(0, 210, 255, 0.35)" stroke="#00ffff" stroke-width="2"/>
  <!-- 346A 相控阵雷达阵面 (发光正方形) -->
  <rect x="252" y="70" width="36" height="30" rx="3" fill="#00ffff" fill-opacity="0.4" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="270" cy="85" r="8" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="3,2"/>

  <!-- 前甲板 130mm 隐身舰炮 -->
  <path d="M 110 135 L 125 120 L 145 120 L 150 135 Z" fill="#00d2ff" stroke="#ffffff" stroke-width="1.2"/>
  <line x1="85" y1="124" x2="125" y2="124" stroke="#ffffff" stroke-width="2.5"/>

  <!-- 前部 32 单元垂直发射系统 (VLS) -->
  <rect x="160" y="130" width="45" height="5" fill="#faad14" stroke="#ffd666" stroke-width="1"/>
  <line x1="175" y1="130" x2="175" y2="135" stroke="#000" stroke-width="1"/>
  <line x1="190" y1="130" x2="190" y2="135" stroke="#000" stroke-width="1"/>

  <!-- 后部 32 单元通用垂直发射系统 -->
  <rect x="375" y="138" width="45" height="5" fill="#faad14" stroke="#ffd666" stroke-width="1"/>

  <!-- 后部直升机库与红旗-10 近防导弹 -->
  <path d="M 430 140 L 440 120 L 490 120 L 500 142 Z" fill="rgba(0, 210, 255, 0.25)" stroke="#00d2ff" stroke-width="1.5"/>
  <rect x="450" y="112" width="16" height="8" rx="2" fill="#ff4d4f" stroke="#ffffff" stroke-width="1"/>

  <!-- 战术标定文字与指标 -->
  <text x="35" y="32" fill="#00ffff" font-family="monospace" font-size="14" font-weight="bold">PLAN-DDG-173 (052D型导弹驱逐舰)</text>
  <text x="35" y="50" fill="#bad3f2" font-family="monospace" font-size="11">● 346A海之星四面相控阵雷达 | 64单元通用VLS | 排水量: 7500T</text>

  <!-- 动态指示框 -->
  <circle cx="270" cy="85" r="18" fill="none" stroke="#00d2ff" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="288" y1="85" x2="430" y2="50" stroke="#00ffff" stroke-width="1"/>
  <text x="435" y="54" fill="#00ffff" font-family="monospace" font-size="10">346A相控阵阵面 (260km)</text>

  <circle cx="130" cy="125" r="10" fill="none" stroke="#faad14" stroke-width="1"/>
  <line x1="130" y1="115" x2="130" y2="85" stroke="#faad14" stroke-width="1"/>
  <text x="105" y="80" fill="#faad14" font-family="monospace" font-size="10">H/PJ-45A 130mm舰炮</text>
</svg>
`)

// 2. 敌方重点突防战机 (VIPER-01) 战术蓝图
export const SVG_FIGHTER_VIPER = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#190d14"/>
      <stop offset="50%" stop-color="#26101c"/>
      <stop offset="100%" stop-color="#12060e"/>
    </linearGradient>
    <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 77, 79, 0.15)" stroke-width="0.8"/>
    </pattern>
  </defs>

  <rect width="600" height="240" fill="url(#bgGrad2)"/>
  <rect width="600" height="240" fill="url(#grid2)"/>

  <!-- 隐身制空战斗机俯视战术轮廓 -->
  <!-- 机头与雷达罩 -->
  <path d="M 520 120 L 450 100 L 320 90 L 220 30 L 170 35 L 210 90 L 150 92 L 110 50 L 80 52 L 105 105 L 75 110 L 65 120 L 75 130 L 105 135 L 80 188 L 110 190 L 150 148 L 210 150 L 170 205 L 220 210 L 320 150 L 450 140 Z" fill="rgba(255, 77, 79, 0.22)" stroke="#ff4d4f" stroke-width="2"/>

  <!-- 座舱盖 -->
  <ellipse cx="430" cy="120" rx="35" ry="10" fill="#faad14" fill-opacity="0.4" stroke="#ffd666" stroke-width="1.5"/>

  <!-- 双发矢量喷口与加力火焰 -->
  <rect x="55" y="108" width="16" height="8" rx="2" fill="#ff4d4f" stroke="#ffffff" stroke-width="1"/>
  <rect x="55" y="124" width="16" height="8" rx="2" fill="#ff4d4f" stroke="#ffffff" stroke-width="1"/>
  <path d="M 55 112 L 25 112 L 35 116 Z" fill="#faad14"/>
  <path d="M 55 128 L 25 128 L 35 124 Z" fill="#faad14"/>

  <!-- 棱形内埋弹舱 -->
  <rect x="260" y="112" width="65" height="16" rx="2" fill="none" stroke="#faad14" stroke-width="1.2" stroke-dasharray="4,2"/>

  <!-- 战术标定文字 -->
  <text x="35" y="32" fill="#ff4d4f" font-family="monospace" font-size="14" font-weight="bold">VIPER-01 (重点隐身突防战机)</text>
  <text x="35" y="50" fill="#ffccc7" font-family="monospace" font-size="11">● 机载AESA相控阵雷达 | 内埋反舰/空空弹舱 | RCS: 2.8㎡</text>

  <!-- 动态指示框 -->
  <circle cx="505" cy="120" r="14" fill="none" stroke="#ff4d4f" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="505" y1="106" x2="505" y2="70" stroke="#ff7875" stroke-width="1"/>
  <text x="440" y="65" fill="#ff7875" font-family="monospace" font-size="10">X波段有源相控阵 (180km)</text>

  <circle cx="290" cy="120" r="12" fill="none" stroke="#faad14" stroke-width="1"/>
  <line x1="290" y1="132" x2="290" y2="175" stroke="#faad14" stroke-width="1"/>
  <text x="260" y="190" fill="#faad14" font-family="monospace" font-size="10">隐身内埋武器弹舱</text>
</svg>
`)

// 3. 预警指挥机 (SENTINEL-09) 战术蓝图
export const SVG_AEW_SENTINEL = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141a0e"/>
      <stop offset="50%" stop-color="#1e2912"/>
      <stop offset="100%" stop-color="#0c1208"/>
    </linearGradient>
    <pattern id="grid3" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(250, 173, 20, 0.15)" stroke-width="0.8"/>
    </pattern>
  </defs>

  <rect width="600" height="240" fill="url(#bgGrad3)"/>
  <rect width="600" height="240" fill="url(#grid3)"/>

  <!-- 预警机背负式大圆盘相控阵 -->
  <ellipse cx="270" cy="75" rx="75" ry="18" fill="rgba(250, 173, 20, 0.45)" stroke="#faad14" stroke-width="2"/>
  <line x1="230" y1="85" x2="245" y2="120" stroke="#faad14" stroke-width="3"/>
  <line x1="310" y1="85" x2="295" y2="120" stroke="#faad14" stroke-width="3"/>

  <!-- 机身 -->
  <path d="M 510 135 Q 525 140 480 145 L 120 145 L 80 100 L 60 100 L 75 145 L 60 150 L 510 135 Z" fill="rgba(250, 173, 20, 0.22)" stroke="#faad14" stroke-width="1.8"/>
  <!-- 主机翼 -->
  <polygon points="340,140 280,40 230,42 270,140" fill="rgba(250, 173, 20, 0.3)" stroke="#faad14" stroke-width="1.2"/>

  <text x="35" y="32" fill="#faad14" font-family="monospace" font-size="14" font-weight="bold">SENTINEL-09 (预警指挥机)</text>
  <text x="35" y="50" fill="#ffe58f" font-family="monospace" font-size="11">● 背负式S/L双波段相控阵圆盘雷达 | 全向探测视距: 450km</text>
</svg>
`)

// 4. 我方沿海红旗-9B防空导弹阵地
export const SVG_SAM_HQ9B = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#091a18"/>
      <stop offset="50%" stop-color="#0f2b27"/>
      <stop offset="100%" stop-color="#061210"/>
    </linearGradient>
    <pattern id="grid4" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(82, 196, 26, 0.15)" stroke-width="0.8"/>
    </pattern>
  </defs>

  <rect width="600" height="240" fill="url(#bgGrad4)"/>
  <rect width="600" height="240" fill="url(#grid4)"/>

  <!-- 重型防空导弹发射车底盘 -->
  <rect x="120" y="150" width="340" height="35" rx="4" fill="rgba(82, 196, 26, 0.3)" stroke="#52c41a" stroke-width="2"/>
  <!-- 8x8 越野重型轮胎 -->
  <circle cx="150" cy="190" r="16" fill="#040811" stroke="#52c41a" stroke-width="2"/>
  <circle cx="195" cy="190" r="16" fill="#040811" stroke="#52c41a" stroke-width="2"/>
  <circle cx="380" cy="190" r="16" fill="#040811" stroke="#52c41a" stroke-width="2"/>
  <circle cx="425" cy="190" r="16" fill="#040811" stroke="#52c41a" stroke-width="2"/>

  <!-- 起竖状态的4联装圆筒导弹发射筒 (起竖角度 75°) -->
  <g transform="translate(300, 150) rotate(-70)">
    <rect x="0" y="-12" width="130" height="10" rx="3" fill="rgba(82, 196, 26, 0.5)" stroke="#52c41a" stroke-width="1.5"/>
    <rect x="0" y="2" width="130" height="10" rx="3" fill="rgba(82, 196, 26, 0.5)" stroke="#52c41a" stroke-width="1.5"/>
    <rect x="125" y="-14" width="12" height="28" rx="2" fill="#52c41a"/>
  </g>

  <text x="35" y="32" fill="#52c41a" font-family="monospace" font-size="14" font-weight="bold">HQ9B-BATTERY-04 (沿海地导拦截阵地)</text>
  <text x="35" y="50" fill="#d9f7be" font-family="monospace" font-size="11">● HT-233相控阵火控雷达 | 红旗-9B超视距拦截弹 (280km)</text>
</svg>
`)
