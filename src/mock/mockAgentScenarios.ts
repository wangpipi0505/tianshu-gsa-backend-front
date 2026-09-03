/**
 * @file mockAgentScenarios.ts
 * @description 预置地球智能体多轮协作研判场景与全量态势操作受约束推理问答模型（纯中文，涵盖东南海峡与中东波斯湾双战区）
 */

import type { ChatMessage } from '@/types/agent'
import { MOCK_EVIDENCE_ITEMS } from '@/mock/mockIntelligence'

export const FEATURED_PROMPTS = [
  { icon: '🔮', label: '未来态势预测与推演', prompt: '请推演分析敌重点战机 (VIPER-01) 从历史机动到未来 30 分钟的演变过程与威胁走向。' },
  { icon: '🚢', label: '我方主力舰艇战备状态', prompt: '我想看一下我方舰艇的当前信息和状态。' },
  { icon: '🛡️', label: '中东波斯湾海空态势', prompt: '中东波斯湾与霍尔木兹海峡当前态势如何？' },
  { icon: '🌊', label: '南海菲律宾态势构建', prompt: '构建我国南海与菲律宾方向的态势场景：我方维权巡逻编队与外军舰机对峙。' }
]

export const CATEGORIZED_PROMPT_TEMPLATES = [
  {
    category: '🔮 未来预测与时空演化',
    items: [
      '请推演分析敌重点战机 (VIPER-01) 从历史机动到未来 30 分钟的演变过程与威胁走向。',
      '展示 VIPER-01 战机未来突防航线的两种可能分支（低空规避 vs 高空压制）。',
      '对比历史、当前与未来三态时空切片（T-30min / T0 / T+30min）。',
      '开启全过程 4D 时空态势动态演变推流回放（从历史13:00到未来16:30）。'
    ]
  },
  {
    category: '战备与重点实体检索',
    items: [
      '我想看一下我方舰艇的当前信息和状态。',
      '我想查看中东我方护航编队焦作舰当前状态。',
      '我想看一下敌方重点突防战机的当前信息和状态。'
    ]
  },
  {
    category: '战区态势与红黄蓝包络',
    items: [
      '中东波斯湾与霍尔木兹海峡当前态势如何？',
      '加载海峡东侧红黄蓝三色战区包络与防空拦截杀伤区。'
    ]
  },
  {
    category: '战术关系与雷达扫描锥',
    items: [
      '分析目标之间的战术关系（伴飞？结队？打击？预警指挥？）并在三维地球上标绘。',
      '查看各实体的雷达探测照射范围及传感器覆盖锥（预警机/驱逐舰/地导/战机）。'
    ]
  },
  {
    category: '气象补偿与时空推演',
    items: [
      '分析4级海况与雨雾气象对多源探测的影响，并进行环境误差融合补偿。',
      '针对重点目标发起低空超音速突防推演，并在地球上注入推演假设航线。'
    ]
  },
  {
    category: '🌊 南海与菲律宾方向',
    items: [
      '构建我国南海与菲律宾方向的态势场景：我方维权巡逻编队与外军舰机对峙。',
      '查看南海与菲律宾方向的相关态势目标。'
    ]
  },
  {
    category: '🕐 单态切片与历史复盘',
    items: [
      '复盘 VIPER-01 战机的历史航迹，只需要看历史观测切片。',
      '调取敌重点突防战机的历史观测阶段切片进行复盘。'
    ]
  },
  {
    category: '态势要素管理',
    items: [
      '清空地图上的所有态势。'
    ]
  },
  {
    category: '🧩 态势场景构建',
    items: [
      '在海峡东侧构建一个我方空中巡逻阵位目标'
    ]
  }
]

export const PRESET_PROMPTS = FEATURED_PROMPTS.map((p) => p.prompt)

export const MOCK_AGENT_SCENARIOS: Record<string, ChatMessage[]> = {
  default: [
    {
      id: 'MSG-INIT-01',
      sender: 'agent',
      content: '您好！我是**智能态势研判助手**，已实时接入全球三维数字地球与全量态势要素库（覆盖东南海峡与中东战区）。\n\n支持通过自然语言进行**战区研判、战备检索、雷达投射、战术关系标绘与推演上图**。您可以直接在下方输入研判指令，或通过上方模板快速发起问答。',
      timestamp: '2026-08-25 15:20:00'
    }
  ],

  // 场景：查看中东我方护航编队焦作舰当前状态
  scenario_inspect_mideast_convoy: [
    {
      id: 'MSG-USER-ME-CONVOY',
      sender: 'user',
      content: '我想查看中东我方护航编队焦作舰当前状态。',
      timestamp: '2026-08-25 15:20:20'
    },
    {
      id: 'MSG-AGENT-ME-CONVOY',
      sender: 'agent',
      content: '已为您定位并检索【中东·我方052D型护航驱逐舰】(PLAN-DDG-163 焦作舰) 的全维态势与战备状态：\n\n- **时空坐标**：东经 57.85°E，北纬 24.85°N (阿曼湾开阔深水区，霍尔木兹海峡东南外海)；\n- **机动航向与航速**：航向 315°，航速 20 节，高程 0 米；\n- **战备任务**：一级战备 (远海护航与对空防御)，正组织 6 艘国际商船编队安全过峡；\n- **传感器状态**：346A相控阵雷达全功率对空监视开机，260km 防空穹顶已覆盖海峡东部外海；\n- **数据链路**：全域卫通宽带战术数据链在线互联 (信噪比 +26dB)。\n\n您可以点击下方【态势上图】卡片，系统将平滑跳转至**中东阿曼湾战术视窗（高度 650 公里，正俯瞰）**，并在焦作舰旁自动展开高精度态势悬浮详细标牌。',
      timestamp: '2026-08-25 15:20:28',
      intentUnderstanding: {
        rawPrompt: '我想查看中东我方护航编队焦作舰当前状态。',
        intentCategory: 'view_situation',
        intentTitle: '中东远海护航编队驱逐舰态势与战备状态检索及三维适中视窗特写',
        targetScope: ['Target-ME-001 (焦作舰)'],
        spatialScope: '阿曼湾 / 霍尔木兹海峡外海',
        timeScope: '实时动态',
        actionSequence: ['抽取焦作舰时空位置与雷达战备指标', '相机视角平滑飞向中东目标 (保持650km正俯瞰)', '在目标旁弹出悬浮详细信息卡片'],
        confidence: 0.99,
        isConfirmed: true
      },
      ragSteps: [
        {
          id: 'RAG-ME-1',
          ragType: 'characteristic_rag',
          ragTypeName: '远海护航编队战备日志与北斗报文检索',
          query: 'PLAN-DDG-163 焦作舰 阿曼湾护航 + 346A雷达260km + 6艘商船',
          hitCount: 2,
          hits: [
            { title: '第46批护航编队实时日志', content: '焦作舰在阿曼湾组织商船过峡，防空警戒等级一级', score: 0.99 }
          ]
        }
      ],
      reasoningTraces: [
        {
          stepNumber: 1,
          phaseName: '中东态势提取',
          inference: '目标位于阿曼湾安全水域，346A雷达对空探测穹顶有效掩护商船编队。',
          verifiedFact: '卫通数据链与海事AIS双重校验吻合 (证据 E-ME-001)',
          evidenceRefs: ['E-ME-001']
        }
      ],
      evidenceChain: MOCK_EVIDENCE_ITEMS.filter((e) => e.id.includes('ME')),
      actionCards: [
        {
          id: 'ACT-ME-SHIP-01',
          actionType: 'focus_mideast_convoy',
          title: '焦作舰态势上图并展开详细信息标牌',
          description: '相机平滑跳转至中东阿曼湾视窗 (650km正俯瞰)，并在焦作舰旁展开悬浮详细卡片',
          previewPayload: { theater: 'mideast', targetId: 'Target-ME-001' },
          executed: false,
          reversible: true,
          basisExplanation: '基于远海护航编队实时战备数据'
        }
      ]
    }
  ],

  // 场景：中东波斯湾与霍尔木兹海峡当前态势
  scenario_mideast_situation: [
    {
      id: 'MSG-USER-ME-ALL',
      sender: 'user',
      content: '中东波斯湾与霍尔木兹海峡当前态势如何？',
      timestamp: '2026-08-25 15:20:35'
    },
    {
      id: 'MSG-AGENT-ME-ALL',
      sender: 'agent',
      content: '当前**中东波斯湾与霍尔木兹海峡海空安全态势**总体处于高警戒战备对抗状态：\n\n1. **【我方护航编队】**：052D型焦作舰 (PLAN-DDG-163) 位于阿曼湾外海，建立 260km 防空穹顶，组织国际商船编队安全过峡；\n2. **【外军海空活动】**：波斯湾上空外军隐身突防战机 (FALCON-01) 在伴随电子战机 (RAVEN-03) 掩护下沿 135° 航向逼近海峡，南部高空 HAWKEYE-07 预警机提供 420km 空情引导；\n3. **【海峡要塞防空】**：霍尔木兹海峡北岸沿海山地阵位部署重型相控阵防空导弹阵地，构建海峡咽喉 280km 立体封锁包络；\n4. **【战区定界】**：已加载【红区】海峡重型防空杀伤圈、【黄区】波斯湾战术管制定界区与【蓝区】阿曼湾护航安全走廊。\n\n点击下方【态势上图】卡片可将三维地球视角平滑切换至中东战区全景视窗并点亮全量要素。',
      timestamp: '2026-08-25 15:20:45',
      intentUnderstanding: {
        rawPrompt: '中东波斯湾与霍尔木兹海峡当前态势如何？',
        intentCategory: 'thematic_analysis',
        intentTitle: '中东波斯湾与霍尔木兹海峡海空全域态势综合研判与全景上图',
        targetScope: ['Target-ME-001', 'Target-ME-002', 'Target-ME-003', 'Target-ME-004', 'Target-ME-005'],
        spatialScope: '波斯湾 / 霍尔木兹海峡 / 阿曼湾',
        timeScope: '实时动态',
        actionSequence: ['抽取中东双边海空作战实体', '渲染中东红黄蓝三大战区包络与雷达扫描锥', '相机视角平滑飞往中东海峡全景视窗 (1150km)'],
        confidence: 0.98,
        isConfirmed: true
      },
      ragSteps: [],
      reasoningTraces: [],
      evidenceChain: MOCK_EVIDENCE_ITEMS.filter((e) => e.id.includes('ME')),
      actionCards: [
        {
          id: 'ACT-ME-ALL-01',
          actionType: 'focus_mideast_all',
          title: '中东波斯湾与霍尔木兹海峡全域态势上图',
          description: '相机以正俯瞰视角 (1150km) 切换至中东战区，呈现焦作舰护航、突防机群与要塞防空全貌',
          previewPayload: { theater: 'mideast', center: [55.5, 26.0] },
          executed: false,
          reversible: true,
          basisExplanation: '基于中东波斯湾全量态势要素与战区管制定界'
        }
      ]
    }
  ],

  // 场景：清空地图上的所有态势
  scenario_clear_situations: [
    {
      id: 'MSG-USER-CLEAR',
      sender: 'user',
      content: '清空地图上的所有态势。',
      timestamp: '2026-08-25 15:20:10'
    },
    {
      id: 'MSG-AGENT-CLEAR',
      sender: 'agent',
      content: '已为您生成**全量态势要素与图层清空方案**：\n\n系统将自动隐藏三维地球上的全部态势事实、作战实体、战区研判专题包络、战场气象环境与推演标绘图层，关闭所有打开的悬浮标牌，并将视窗复位至全局全貌视角。',
      timestamp: '2026-08-25 15:20:16',
      intentUnderstanding: {
        rawPrompt: '清空地图上的所有态势。',
        intentCategory: 'view_situation',
        intentTitle: '三维数字地球全量态势要素与图层一键清空',
        targetScope: ['全部要素图层'],
        spatialScope: '全球视窗',
        timeScope: '实时',
        actionSequence: ['关闭要素图层', '清空所有悬浮标牌', '清除临时标绘', '复位全局视角'],
        confidence: 0.99,
        isConfirmed: true
      },
      ragSteps: [],
      reasoningTraces: [],
      evidenceChain: [],
      actionCards: [
        {
          id: 'ACT-CLEAR-01',
          actionType: 'clear_all_situations',
          title: '一键清空三维地图全部态势要素',
          description: '关闭全部态势实体、战区包络与气象图层，清空全部标牌并复位全局全貌',
          previewPayload: { clearAll: true },
          executed: false,
          reversible: true,
          basisExplanation: '基于态势视窗重置与清屏指令'
        }
      ]
    }
  ],

  // 场景 0：查看我方舰艇当前信息与状态 (东南海峡长沙舰)
  scenario_inspect_warship: [
    {
      id: 'MSG-USER-SHIP',
      sender: 'user',
      content: '我想看一下我方舰艇的当前信息和状态。',
      timestamp: '2026-08-25 15:20:30'
    },
    {
      id: 'MSG-AGENT-SHIP',
      sender: 'agent',
      content: '已为您定位并检索【东南海峡·我方052D型驱逐舰】(PLAN-DDG-173 长沙舰) 的全维态势与战备状态：\n\n- **时空坐标**：东经 119.55°E，北纬 24.15°N (台湾海峡深水开阔海域)；\n- **机动航向与航速**：航向 45°，航速 22 节，高程 0 米；\n- **战备任务**：一级战备对空拦截警戒，执行海峡重点水道巡弋与区域防空掩护；\n- **传感器状态**：346A相控阵雷达全功率开机，260km对空防空穹顶已建立；\n- **数据链路**：全域宽带战术数据链在线互联 (信噪比 +28dB)。\n\n点击下方【态势上图】卡片，系统将平滑跳转至**适中战术全景视窗（高度约650公里）**，并在长沙舰旁边自动展开高精度态势悬浮详细标牌。',
      timestamp: '2026-08-25 15:20:38',
      intentUnderstanding: {
        rawPrompt: '我想看一下我方舰艇的当前信息和状态。',
        intentCategory: 'view_situation',
        intentTitle: '我方水面驱逐舰态势与战备状态检索及三维适中视窗特写',
        targetScope: ['Target-003 (我方052D型驱逐舰)'],
        spatialScope: '海峡水面阵位',
        timeScope: '实时动态',
        actionSequence: ['抽取舰艇时空位置与雷达战备指标', '相机视角平滑飞向目标 (保持650km正俯瞰)', '在三维视窗目标旁边弹出悬浮详细信息卡片'],
        confidence: 0.99,
        isConfirmed: true
      },
      ragSteps: [
        {
          id: 'RAG-SHIP-1',
          ragType: 'characteristic_rag',
          ragTypeName: '水面作战舰艇态势与战备指标检索',
          query: 'Target-003 052D驱逐舰 时空坐标 + 航速22节 + 346A雷达',
          hitCount: 3,
          hits: [
            { title: '水面编队实时航海日志', content: 'PLAN-DDG-173 航向45度，处于一级战备拦截状态', score: 0.99 }
          ]
        }
      ],
      reasoningTraces: [
        {
          stepNumber: 1,
          phaseName: '水面态势提取',
          inference: '目标位于海峡水域中心深水区，346A雷达对空探测穹顶有效覆盖海峡空域。',
          verifiedFact: '海事 AIS 与海军数据链双重校验吻合 (证据 E003)',
          evidenceRefs: ['E003']
        }
      ],
      evidenceChain: MOCK_EVIDENCE_ITEMS.slice(2, 3),
      actionCards: [
        {
          id: 'ACT-SHIP-01',
          actionType: 'focus_warship',
          title: '长沙舰态势上图并展开详细信息标牌',
          description: '相机平滑跳转至适中战术全景高度 (650km)，并在舰艇实体旁边展开悬浮详细卡片',
          previewPayload: { theater: 'taiwan', targetId: 'Target-003' },
          executed: false,
          reversible: true,
          basisExplanation: '基于水面舰艇实时战备数据'
        }
      ]
    }
  ],

  // 场景 0-B：查看敌方重点突防战机当前信息与状态
  scenario_inspect_fighter: [
    {
      id: 'MSG-USER-FIGHTER',
      sender: 'user',
      content: '我想看一下敌方重点突防战机的当前信息和状态。',
      timestamp: '2026-08-25 15:20:45'
    },
    {
      id: 'MSG-AGENT-FIGHTER',
      sender: 'agent',
      content: '已为您定位并检索【敌方重点突防战机】(VIPER-01)：\n\n- **时空坐标**：东经 122.85°E，北纬 24.65°N；\n- **高度与航速**：高度 8500 米，航速 520 节，航向 82°；\n- **战备状态**：高威胁突防攻击战位，在预警机引导下逼近；\n- **高维物理特性**：机长 19.2m，双垂尾，隐身涂层置信度 96%，RCS 均值 2.8㎡。\n\n点击下方【态势上图】卡片可平滑跳转至适中战术高度视窗，并在战机旁边自动展开高精度态势悬浮标牌。',
      timestamp: '2026-08-25 15:20:52',
      intentUnderstanding: {
        rawPrompt: '我想看一下敌方重点突防战机的当前信息和状态。',
        intentCategory: 'view_situation',
        intentTitle: '重点空中战机态势与高维特性检索及适中视窗特写',
        targetScope: ['Target-001 (突防战机)'],
        spatialScope: '海峡东部空域',
        timeScope: '实时动态',
        actionSequence: ['抽取战机高维特性与时空轨迹', '相机视角平滑飞向目标 (保持650km高度)', '在实体旁弹出详细信息卡片'],
        confidence: 0.98,
        isConfirmed: true
      },
      ragSteps: [],
      reasoningTraces: [],
      evidenceChain: MOCK_EVIDENCE_ITEMS.slice(0, 2),
      actionCards: [
        {
          id: 'ACT-FIGHTER-01',
          actionType: 'focus_fighter',
          title: '敌方战机态势上图并展开详细信息标牌',
          description: '相机平滑跳转至适中高度 (650km)，并在战机实体旁展开详细悬浮卡片',
          previewPayload: { theater: 'taiwan', targetId: 'Target-001' },
          executed: false,
          reversible: true,
          basisExplanation: '基于空中目标实时航迹与光学雷达特征'
        }
      ]
    }
  ],

  // 场景 1：目标间战术关系研判（伴飞、结队、打击、指挥）
  scenario_target_relations: [
    {
      id: 'MSG-USER-REL',
      sender: 'user',
      content: '分析目标之间的战术关系（伴飞？结队？打击？预警指挥？）并在三维地球上标绘。',
      timestamp: '2026-08-25 15:21:05'
    },
    {
      id: 'MSG-AGENT-REL',
      sender: 'agent',
      content: '基于领域本体协同拓扑与高精时空测距分析，系统已精准解析当前海空实体间的战术语义关系：\n\n1. **【战术伴飞护航】**：东南海峡 Target-005（伴飞电子战机）与 Target-001 保持 24.5km 近距编队，中东波斯湾 RAVEN-03 与 FALCON-01 保持 28.5km 伴飞；\n2. **【预警指挥引导】**：预警机在后方通过 16号战术数据链/JTIDS 持续向突防机群推流；\n3. **【超视距反舰威胁】**：突防机对水面驱逐舰阵位构成防区外反舰发射威胁；\n4. **【海空防空拦截】**：052D型驱逐舰与沿岸重型防空阵地构建多层防空截击网络。\n\n点击下方【态势上图】卡片可在三维地球上点亮全部战术关系动态彩色虚线与中文字幕标牌。',
      timestamp: '2026-08-25 15:21:12',
      intentUnderstanding: {
        rawPrompt: '分析目标之间的战术关系（伴飞？结队？打击？预警指挥？）并在三维地球上标绘。',
        intentCategory: 'view_situation',
        intentTitle: '目标战术语义关系（伴飞/打击/指挥）综合提取与自适应上图',
        targetScope: ['全部作战实体'],
        spatialScope: '全球重点海空域',
        timeScope: '实时动态关系网',
        actionSequence: [
          '抽取实体对空间相对距离与速度矢量交角',
          '基于领域本体战术规则推导伴飞护航与数据链引导链路',
          '在三维地球上渲染动态虚线与战术含义标牌'
        ],
        confidence: 0.98,
        isConfirmed: true
      },
      ragSteps: [],
      reasoningTraces: [],
      evidenceChain: MOCK_EVIDENCE_ITEMS,
      actionCards: [
        {
          id: 'ACT-REL-01',
          actionType: 'highlight_relations',
          title: '战术关系连线与含义标牌态势上图',
          description: '在三维视窗中点亮【伴飞护航】、【预警指挥】、【反舰打击】与【地导拦截】彩色动态虚线',
          previewPayload: { theater: 'taiwan' },
          executed: false,
          reversible: true,
          basisExplanation: '基于领域本体战术关系规则'
        }
      ]
    }
  ],

  // 场景 2：雷达探测照射范围与传感器覆盖锥
  scenario_radar_coverage: [
    {
      id: 'MSG-USER-RADAR',
      sender: 'user',
      content: '查看各实体的雷达探测照射范围及传感器覆盖锥（预警机/驱逐舰/地导/战机）。',
      timestamp: '2026-08-25 15:22:10'
    },
    {
      id: 'MSG-AGENT-RADAR',
      sender: 'agent',
      content: '已提取当前海空各作战实体的雷达传感器战技术参数：\n\n- **预警指挥机**：S/L双波段有源相控阵雷达，最大探测半径 **420-450公里**（360°全向立体扫描球）；\n- **我方052D驱逐舰 (长沙舰/焦作舰)**：346A型海之星相控阵雷达，对空预警半径 **260公里**；\n- **沿海防空阵地**：相控阵制导雷达，有效拦截扇面 **280公里**；\n- **突防战机**：机载有源相控阵火控雷达，前向 120° 探测距离 **180公里**。\n\n点击下方【态势上图】卡片可在三维地球投射全部半透明立体扫描球、穹顶与雷达锥。',
      timestamp: '2026-08-25 15:22:18',
      intentUnderstanding: {
        rawPrompt: '查看各实体的雷达探测照射范围及传感器覆盖锥（预警机/驱逐舰/地导/战机）。',
        intentCategory: 'thematic_analysis',
        intentTitle: '多平台传感器雷达探测与照射立体包络渲染',
        targetScope: ['全量雷达载荷目标'],
        spatialScope: '全域雷达网',
        timeScope: '当前视距包络',
        actionSequence: ['加载雷达方程', '生成半透明三维雷达扫描球与立体锥体'],
        confidence: 0.99,
        isConfirmed: true
      },
      ragSteps: [],
      reasoningTraces: [],
      evidenceChain: MOCK_EVIDENCE_ITEMS,
      actionCards: [
        {
          id: 'ACT-RADAR-01',
          actionType: 'toggle_radar_cones',
          title: '各实体雷达扫描锥与探测穹顶态势上图',
          description: '点亮预警机扫描球、驱逐舰 260km 对空穹顶与战机前向雷达锥',
          previewPayload: { showRadar: true, theater: 'taiwan' },
          executed: false,
          reversible: true,
          basisExplanation: '基于雷达传感器三维视距曲率模型'
        }
      ]
    }
  ],

  // 场景 3：红黄蓝三色战区包络与防空拦截区
  scenario_thematic_regions: [
    {
      id: 'MSG-USER-REG',
      sender: 'user',
      content: '加载海峡东侧红黄蓝三色战区包络与防空拦截杀伤区。',
      timestamp: '2026-08-25 15:22:50'
    },
    {
      id: 'MSG-AGENT-REG',
      sender: 'agent',
      content: '已加载三维立体战区管制与拦截包络数据：\n\n1. **【红区】沿海重型防空拦截与威胁杀伤区**：我方防空火力杀伤包络（高程 0-25000米）；\n2. **【黄区】海空管制定界与巡逻走廊**：预警指挥机战术管制空域（高程 5000-15000米）；\n3. **【蓝区】我方水面驱逐舰防空协同与安全护航区**：052D驱逐舰重点防空监视与护航走廊（高程 0-12000米）。\n\n点击下方【态势上图】卡片可在三维地球上渲染红黄蓝三大战区三维包络体。',
      timestamp: '2026-08-25 15:22:58',
      intentUnderstanding: {
        rawPrompt: '加载海峡东侧红黄蓝三色战区包络与防空拦截杀伤区。',
        intentCategory: 'thematic_analysis',
        intentTitle: '三维防空拦截杀伤区与战区包络多边形受控上图',
        targetScope: ['REG-001', 'REG-002', 'REG-003', 'REG-ME-001', 'REG-ME-002', 'REG-ME-003'],
        spatialScope: '立体战区',
        timeScope: '当前战区部署',
        actionSequence: ['加载战区多边形坐标', '拉伸生成三维立体包络体', '生成战区名称中文字幕标牌'],
        confidence: 0.98,
        isConfirmed: true
      },
      ragSteps: [],
      reasoningTraces: [],
      evidenceChain: MOCK_EVIDENCE_ITEMS,
      actionCards: [
        {
          id: 'ACT-REG-01',
          actionType: 'toggle_thematic_layer',
          title: '红黄蓝三色战区包络与防空拦截区态势上图',
          description: '点亮红区防空杀伤圈、黄区巡逻定界空域与蓝区水面协同区',
          previewPayload: { showRegions: true, theater: 'taiwan' },
          executed: false,
          reversible: true,
          basisExplanation: '基于防空火力与战术管制定界方案'
        }
      ]
    }
  ],

  // 场景 4：战场气象海况分析与误差补偿
  scenario_environment_compensation: [
    {
      id: 'MSG-USER-ENV',
      sender: 'user',
      content: '分析4级海况与雨雾气象对多源探测的影响，并进行环境误差融合补偿。',
      timestamp: '2026-08-25 15:23:05'
    },
    {
      id: 'MSG-AGENT-ENV',
      sender: 'agent',
      content: '环境态势监测显示：当前海区处于 **4级海况**（中度碎浪，浪高 2.5 米，风速 26 节），伴随 **中度降水与低空海雾**（能见度降至 8.5 公里）。\n\n**环境影响评估与补偿**：\n1. **光学卫星遥感**：穿透衰减达 **46%**，导致光学几何测高产生 1200 米估算偏差；\n2. **多源融合补偿策略**：自动提高对空雷达测高权重至 88%，对光学载荷执行动态去雾反演与气象偏差修正。',
      timestamp: '2026-08-25 15:23:14',
      intentUnderstanding: {
        rawPrompt: '分析4级海况与雨雾气象对多源探测的影响，并进行环境误差融合补偿。',
        intentCategory: 'data_fusion',
        intentTitle: '战场气象与海洋水文环境对多源探测影响分析及误差自适应补偿',
        targetScope: ['战场海洋气象环境'],
        spatialScope: '重点海区',
        timeScope: '实时气象场',
        actionSequence: ['加载降水雨雾与 4级海况粒子渲染', '执行自适应多源融合权重误差补偿'],
        confidence: 0.97,
        isConfirmed: true
      },
      ragSteps: [],
      reasoningTraces: [],
      evidenceChain: MOCK_EVIDENCE_ITEMS,
      actionCards: [
        {
          id: 'ACT-ENV-01',
          actionType: 'apply_weather_compensation',
          title: '开启气象图层并执行多源融合误差补偿',
          description: '在三维地球渲染降水海雾效果，消除环境引起的 1200米光学测高偏差',
          previewPayload: { compensate: true, theater: 'taiwan' },
          executed: false,
          reversible: true,
          basisExplanation: '基于大气水文电磁衰减修正算法'
        }
      ]
    }
  ],

  // 场景 5：时间轴全过程 4D 动态回放
  scenario_temporal_playback: [
    {
      id: 'MSG-USER-TIME',
      sender: 'user',
      content: '按时间轴全过程动态复盘近两小时海空编队时空机动演变。',
      timestamp: '2026-08-25 15:24:00'
    },
    {
      id: 'MSG-AGENT-TIME',
      sender: 'agent',
      content: '已为您装载近 150 分钟（13:00 - 15:30）全量时序航迹数据！\n\n系统支持 **1x / 2x / 4x / 8x 倍速平滑时空插值回放**，两大战区目标经纬度、高程、速度与战术关系将沿真实时空轨迹同步演变。',
      timestamp: '2026-08-25 15:24:08',
      intentUnderstanding: {
        rawPrompt: '按时间轴全过程动态复盘近两小时海空编队时空机动演变。',
        intentCategory: 'view_situation',
        intentTitle: '海空战备态势 4D 时空动态推流与全过程复盘',
        targetScope: ['全量海空作战实体'],
        spatialScope: '全球重点海空域',
        timeScope: '13:00:00 ~ 15:30:00 (150分钟)',
        actionSequence: ['时序数据对齐与秒级插值', '重置时间轴至 13:00 起点', '启动 4D 动态推流播放引擎'],
        confidence: 0.99,
        isConfirmed: true
      },
      ragSteps: [],
      reasoningTraces: [],
      evidenceChain: MOCK_EVIDENCE_ITEMS,
      actionCards: [
        {
          id: 'ACT-TIME-01',
          actionType: 'start_temporal_playback',
          title: '启动 4D 动态时空轨迹连续回放',
          description: '时间轴重置至 13:00 起点并开启 2倍速连续动态推流展示',
          previewPayload: { speed: 2 },
          executed: false,
          reversible: true,
          basisExplanation: '基于 4D 时空高精度插值播放引擎'
        }
      ]
    }
  ],

  // 场景 6：低空超音速突防推演假设航线注入
  scenario_simulation_deduction: [
    {
      id: 'MSG-USER-SIM',
      sender: 'user',
      content: '针对重点目标发起低空超音速突防推演，并在地球上注入推演假设航线。',
      timestamp: '2026-08-25 15:24:45'
    },
    {
      id: 'MSG-AGENT-SIM',
      sender: 'agent',
      content: '已调用海空低空突防算法推演模型。系统可将**【推演假设航线】（紫色虚线）**动态注入三维地球进行红蓝同场比对，且打上推演隔离标识，不污染真实事实。',
      timestamp: '2026-08-25 15:24:55',
      intentUnderstanding: {
        rawPrompt: '针对重点目标发起低空超音速突防推演，并在地球上注入推演假设航线。',
        intentCategory: 'simulation_deduction',
        intentTitle: '低空超音速突防机动假设推演与三维同场比对',
        targetScope: ['Target-001 (突防战机)'],
        spatialScope: '突防突击走廊',
        timeScope: '未来 15 分钟',
        actionSequence: ['加载海空突防动力学模型', '生成假设航迹 SIM-HYPO-001', '注入三维地球'],
        confidence: 0.96,
        isConfirmed: true
      },
      ragSteps: [],
      reasoningTraces: [],
      evidenceChain: MOCK_EVIDENCE_ITEMS.slice(0, 2),
      actionCards: [
        {
          id: 'ACT-SIM-01',
          actionType: 'run_simulation',
          title: '注入【推演假设】突防航线至三维地球',
          description: '在三维视窗中渲染紫色虚线假设航迹，并与真实态势事实同场比对',
          previewPayload: { simId: 'SIM-HYPO-001', theater: 'taiwan' },
          executed: false,
          reversible: true,
          basisExplanation: '基于低空超音速突防推演动力学模型'
        }
      ]
    }
  ],

  // 场景 7：未来态势预测与历史时空演化全过程推演
  scenario_future_evolution_viper: [
    {
      id: 'MSG-USER-FUT-01',
      sender: 'user',
      content: '请推演分析敌重点战机 (VIPER-01) 从历史机动到未来 30 分钟的演变过程与威胁走向。',
      timestamp: '2026-08-25 15:30:10'
    },
    {
      id: 'MSG-AGENT-FUT-01',
      sender: 'agent',
      content: '已完成敌重点突防战机 **VIPER-01** 的**【历史 ➔ 当前 ➔ 未来】全时空态势演变关联推演**：\n\n1. **⏱️ 历史溯源 (13:00~15:30)**：自 13:00 起以 520 节巡航，14:30 建立战术突防走廊，15:00 出现异常徘徊；\n2. **📍 当前基准 ($T_0$ 15:30)**：处于东经 122.60°、北纬 24.85°，高度 8500 米，转入向我沿海突防战位；\n3. **🔮 未来 30~60 分钟推演预测 ($T+N$)**：动力学模型预测其将在 15:45 急剧俯冲至 300 米掠海超音速突防，并于 16:00 逼近我方驱逐舰 346A 相控阵雷达防空火网拦截交汇界。\n\n您可通过下方动作卡片一键将未来预测光轨上图，或启动全时空动态演化推流！',
      timestamp: '2026-08-25 15:30:18',
      intentUnderstanding: {
        rawPrompt: '请推演分析敌重点战机 (VIPER-01) 从历史机动到未来 30 分钟的演变过程与威胁走向。',
        intentCategory: 'do_analysis',
        intentTitle: '敌重点战机时空演化历史溯源与未来机动推演',
        targetScope: ['Target-001 (VIPER-01 突防战机)'],
        spatialScope: '海峡东北空域 ➔ 澎湖西南突防走廊',
        timeScope: '13:00:00 (历史) ~ 15:30:00 (当前) ~ 16:30:00 (未来预测)',
        actionSequence: ['历史航迹动力学回溯', '提取当前雷达与航向基准', '生成未来外推预测光轨与交汇点'],
        confidence: 0.98,
        isConfirmed: true
      },
      ragSteps: [],
      reasoningTraces: [],
      evidenceChain: MOCK_EVIDENCE_ITEMS.slice(0, 3),
      actionCards: [
        {
          id: 'ACT-FUT-01',
          actionType: 'inject_future_prediction_tracks',
          title: '🔮 注入未来预测光轨与威胁外推点',
          description: '在三维地球上点亮紫色发光未来航迹带与 T+30m、T+60m 预期交汇到达点',
          previewPayload: { targetId: 'Target-001' },
          executed: false,
          reversible: true,
          basisExplanation: '基于 4D 时空外推预测动力学模型与雷达观测约束'
        },
        {
          id: 'ACT-FUT-02',
          actionType: 'start_temporal_evolution_playback',
          title: '▶ 启动 4D 时空全域演变推流回放',
          description: '相机自动聚焦战区，时间轴从 13:00 历史起点平滑推流播放至 16:30 未来终点',
          previewPayload: { speed: 2 },
          executed: false,
          reversible: true,
          basisExplanation: '基于 13:00~16:30 全时段连续时空插值引擎'
        }
      ]
    }
  ],

  // 场景 8：未来多分支战术推演假说比对
  scenario_future_branches_viper: [
    {
      id: 'MSG-USER-BRANCH-01',
      sender: 'user',
      content: '展示 VIPER-01 战机未来突防航线的两种可能分支（低空规避 vs 高空压制）。',
      timestamp: '2026-08-25 15:30:35'
    },
    {
      id: 'MSG-AGENT-BRANCH-01',
      sender: 'agent',
      content: '已加载 VIPER-01 战机未来机动意图的**多分支推演假说模型 (Multi-Branch Hypotheses)**：\n\n- **【分支A · 低空超音速掠海突防】(置信度 78%)**：俯冲至高度 300m，航速 680 节，企图利用地球曲率盲区规避；拦截窗口持续约 4.2 分钟；\n- **【分支B · 爬升转向电磁压制】(置信度 22%)**：爬升至 11000m 高空，伴随电子战机对我方预警雷达副瓣实施大功率压制。\n\n您可一键在三维地球上同屏对比两条推演假说航线！',
      timestamp: '2026-08-25 15:30:42',
      intentUnderstanding: {
        rawPrompt: '展示 VIPER-01 战机未来突防航线的两种可能分支（低空规避 vs 高空压制）。',
        intentCategory: 'do_simulation',
        intentTitle: '低空超音速突防 vs 高空电磁压制多分支推演比对',
        targetScope: ['Target-001 (VIPER-01 突防战机)'],
        spatialScope: '海峡重点空域',
        timeScope: '未来 15:30 ~ 16:30',
        actionSequence: ['加载多分支假说动力学模型', '计算杀伤覆盖与拦截概率', '三维地球同场呈现'],
        confidence: 0.97,
        isConfirmed: true
      },
      ragSteps: [],
      reasoningTraces: [],
      evidenceChain: MOCK_EVIDENCE_ITEMS.slice(0, 2),
      actionCards: [
        {
          id: 'ACT-BRANCH-01',
          actionType: 'compare_future_branches',
          title: '🔮 三维地球同场呈现未来多分支推演假说',
          description: '同时绘制分支A（紫色虚线 78%）与分支B（橙色虚线 22%）假说航迹与战术意图标牌',
          previewPayload: { targetId: 'Target-001' },
          executed: false,
          reversible: true,
          basisExplanation: '基于贝叶斯多意图假设推演网络与防空火力边界计算'
        }
      ]
    }
  ],

  // 场景 9：历史-当前-未来三态时空切片同屏对比
  scenario_temporal_slices: [
    {
      id: 'MSG-USER-SLICE-01',
      sender: 'user',
      content: '对比历史、当前与未来三态时空切片（T-30min / T0 / T+30min）。',
      timestamp: '2026-08-25 15:30:50'
    },
    {
      id: 'MSG-AGENT-SLICE-01',
      sender: 'agent',
      content: '已提取重点作战实体的 **4D 时空三态切片 (Temporal Multi-Slice)**：\n\n- **⏱️ 历史切片 (14:30 / 15:00)**：巡航集结与异常徘徊状态；\n- **🟢 当前基准 ($T_0$ 15:30)**：实时位置、战备等级与 346A 相控阵雷达波束；\n- **🔮 未来切片 (16:00 / 16:30)**：超低空拦截阵位与脱离航向。\n\n已为您准备好【三态时空切片同屏对比】动作卡片，可在三维地球上同时投影！',
      timestamp: '2026-08-25 15:30:58',
      intentUnderstanding: {
        rawPrompt: '对比历史、当前与未来三态时空切片（T-30min / T0 / T+30min）。',
        intentCategory: 'view_situation',
        intentTitle: '历史观测、当前基准与未来预测三态时空切片同屏对比',
        targetScope: ['全量重点作战实体'],
        spatialScope: '海峡全域战场',
        timeScope: '14:00:00 ➔ 15:30:00 ➔ 16:30:00',
        actionSequence: ['离散化时空切片采样', '生成各时段幽灵标牌与航速矢量', '三维地球同屏投影'],
        confidence: 0.99,
        isConfirmed: true
      },
      ragSteps: [],
      reasoningTraces: [],
      evidenceChain: MOCK_EVIDENCE_ITEMS,
      actionCards: [
        {
          id: 'ACT-SLICE-01',
          actionType: 'compare_temporal_slices',
          title: '📐 开启三态时空切片同屏对比',
          description: '在三维地球上同时投影历史、当前与未来多时段幽灵标牌与速度矢量',
          previewPayload: { targetId: 'Target-001', slicePhases: ['history', 'present', 'future'] },
          executed: false,
          reversible: true,
          basisExplanation: '基于 4D 时空切片采样与幽灵标牌投影技术'
        }
      ]
    }
  ],

  // 场景 10：历史航迹单态复盘 (仅点亮历史切面图层)
  scenario_history_review: [
    {
      id: 'MSG-USER-HIST-01',
      sender: 'user',
      content: '复盘 VIPER-01 战机的历史航迹，只需要看历史观测切片。',
      timestamp: '2026-08-25 15:32:10'
    },
    {
      id: 'MSG-AGENT-HIST-01',
      sender: 'agent',
      content: '已提取【敌方重点突防战机】(VIPER-01) 的 **历史观测单态切片**：\n\n- **⏱️ 14:00 历史巡航**：双机编队巡航集结，保持雷达静默；\n- **⏱️ 15:00 历史徘徊**：空域异常徘徊，疑似建立打击航线。\n\n已为您准备【历史单态切片上图】动作卡片，上图后将**仅点亮历史切面图层**（当前与未来切面保持隐藏），便于专注复盘目标历史机动轨迹；您也可在对比面板中随时叠加其他切面。',
      timestamp: '2026-08-25 15:32:18',
      intentUnderstanding: {
        rawPrompt: '复盘 VIPER-01 战机的历史航迹，只需要看历史观测切片。',
        intentCategory: 'view_situation',
        intentTitle: '历史观测单态切片复盘 (仅点亮历史切面图层)',
        targetScope: ['Target-001 (VIPER-01)'],
        spatialScope: '东南海峡以东空域',
        timeScope: '历史观测区间 (14:00 ~ 15:00)',
        actionSequence: ['抽取目标历史航迹切片', '仅开启历史切面图层 (关闭当前/未来切面)', '三维地球投影历史切片并聚焦'],
        confidence: 0.97,
        isConfirmed: true
      },
      ragSteps: [
        {
          id: 'RAG-HIST-1',
          ragType: 'characteristic_rag',
          ragTypeName: '历史航迹与观测日志检索',
          query: 'VIPER-01 历史航迹 14:00-15:00 机动特征',
          hitCount: 1,
          hits: [
            { title: '历史航迹观测记录', content: 'VIPER-01 双机编队巡航集结后转为空域异常徘徊', score: 0.96 }
          ]
        }
      ],
      reasoningTraces: [
        {
          stepNumber: 1,
          phaseName: '历史切片提取',
          inference: '目标历史阶段先集结后徘徊，机动模式由巡航转为待战。',
          verifiedFact: '历史航迹采样与预警机雷达复观一致 (证据 E001)',
          evidenceRefs: ['E001']
        }
      ],
      evidenceChain: MOCK_EVIDENCE_ITEMS.slice(0, 1),
      actionCards: [
        {
          id: 'ACT-HIST-01',
          actionType: 'compare_temporal_slices',
          title: '⏱️ 历史单态切片上图 (仅历史切面)',
          description: '仅点亮历史观测切面图层，隐藏当前与未来切面，聚焦复盘目标历史机动航迹',
          previewPayload: { targetId: 'Target-001', slicePhases: ['history'] },
          executed: false,
          reversible: true,
          basisExplanation: '基于历史航迹采样与单态切片检索结论'
        }
      ]
    }
  ],

  // 场景 11：南海与菲律宾方向态势场景构建（智能助手构建模板）
  scenario_scs_construct: [
    {
      id: 'MSG-USER-SCS-01',
      sender: 'user',
      content: '构建我国南海与菲律宾方向的态势场景：我方维权巡逻编队与外军舰机对峙。',
      timestamp: '2026-08-25 15:35:10'
    },
    {
      id: 'MSG-AGENT-SCS-01',
      sender: 'agent',
      content: `已解析您的**态势场景构建**意图（南海与菲律宾方向）：

- **构建对象一**：🚢 我方南海维权巡逻编队（116.2°E, 14.8°N，航向 160°）；
- **构建对象二**：🚢 外军导弹驱逐舰（118.6°E, 13.5°N，向西逼近）；

两张构建草稿卡已就绪，确认后目标将写入**场景工作内容层**并上图，可与既有态势同场研判。`,
      timestamp: '2026-08-25 15:35:18',
      intentUnderstanding: {
        rawPrompt: '构建我国南海与菲律宾方向的态势场景：我方维权巡逻编队与外军舰机对峙。',
        intentCategory: 'build_scene',
        intentTitle: '南海与菲律宾方向态势场景构建（双目标对峙）',
        targetScope: ['我方南海维权巡逻编队', '外军导弹驱逐舰'],
        spatialScope: '南海海域 / 菲律宾以西',
        timeScope: '实时构建',
        actionSequence: ['解析构建意图与对象', '生成两张构建草稿卡', '确认后写入场景工作内容层并上图'],
        confidence: 0.97,
        isConfirmed: true
      },
      ragSteps: [],
      reasoningTraces: [],
      evidenceChain: [],
      actionCards: [
        {
          id: 'ACT-SCS-ALL',
          actionType: 'construct_target',
          title: '🌊 构建南海对峙态势场景（双目标）',
          description: '一次性上图构建南海对峙场景：我方巡逻编队与外军驱逐舰双目标同时写入工作内容层',
          previewPayload: {
            targets: [
              { name: '我方南海维权巡逻编队', objectType: 'warship', affiliation: 'friend', longitude: 116.2, latitude: 14.8, altitude: 0, speedKnots: 18 },
              { name: '外军导弹驱逐舰', objectType: 'warship', affiliation: 'foe', longitude: 118.6, latitude: 13.5, altitude: 0, speedKnots: 22 }
            ],
            remark: '南海对峙态势场景（智能助手构建）'
          },
          executed: false,
          reversible: true,
          basisExplanation: '基于南海与菲律宾方向态势场景构建意图'
        }
      ]
    }
  ],

  // 场景 12：未识别意图兜底 (能力清单引导，避免答非所问)
  scenario_fallback: [
    {
      id: 'MSG-USER-FALLBACK',
      sender: 'user',
      content: '(未识别指令)',
      timestamp: ''
    },
    {
      id: 'MSG-AGENT-FALLBACK',
      sender: 'agent',
      content: `暂未能精确匹配该指令对应的研判场景。当前智能研判助手支持以下几类能力：

- **重点实体检索**：如"我想看一下我方舰艇的当前信息和状态"、"查看敌方重点突防战机"；
- **三态切片与历史复盘**：如"对比历史、当前与未来三态时空切片"、"复盘 VIPER-01 的历史航迹"；
- **战区态势与包络**：如"中东波斯湾与霍尔木兹海峡当前态势如何？"、"加载红黄蓝三色战区包络"；
- **战术关系与雷达覆盖**：如"分析目标之间的战术关系并在三维地球上标绘"、"查看各实体的雷达探测覆盖锥"；
- **推演与回放**：如"开启全过程 4D 时空态势动态演变推流回放"、"针对重点目标发起低空超音速突防推演"。

请尝试换一种表述，或点击上方【指令模板】直接发起研判。`,
      timestamp: '',
      intentUnderstanding: {
        rawPrompt: '(未识别指令)',
        intentCategory: 'ask_knowledge',
        intentTitle: '意图未精确匹配，返回能力清单引导',
        targetScope: [],
        spatialScope: '当前场景全域',
        timeScope: '实时',
        actionSequence: ['意图匹配失败', '返回能力清单引导用户改写指令'],
        confidence: 0.3,
        isConfirmed: false
      }
    }
  ],

  scenario_construct_patrol: [
    {
      id: 'MSG-USER-CONSTRUCT',
      sender: 'user',
      content: '在海峡东侧构建一个我方空中巡逻阵位目标',
      timestamp: '2026-08-25 15:40:00'
    },
    {
      id: 'MSG-AGENT-CONSTRUCT',
      sender: 'agent',
      content: '已理解构建意图：在海峡东侧放置一个**我方空中巡逻阵位**，作为假设性工作内容上图，不进入融合事实层。',
      timestamp: '2026-08-25 15:40:02',
      intentUnderstanding: {
        rawPrompt: '在海峡东侧构建一个我方空中巡逻阵位目标',
        intentCategory: 'build_scene',
        intentTitle: '构建我方空中巡逻阵位',
        targetScope: ['拟构建空中目标'],
        spatialScope: '海峡东侧 (东经 122.40°，北纬 24.80°)',
        timeScope: '当前研判时点',
        actionSequence: ['解析构建意图', '生成构建草稿', '确认后态势上图'],
        confidence: 0.96,
        isConfirmed: true
      },
      actionCards: [
        {
          id: 'ACT-CONSTRUCT-PATROL',
          actionType: 'construct_target',
          title: '🧩 构建目标：海峡东侧巡逻阵位',
          description: '空中目标 / 东经 122.4000°，北纬 24.8000° / 高度 6000 米',
          previewPayload: {
            name: '海峡东侧巡逻阵位',
            objectType: 'aircraft',
            affiliation: 'friend',
            longitude: 122.4,
            latitude: 24.8,
            altitude: 6000,
            speedKnots: 420,
            remark: '在海峡东侧构建一个我方空中巡逻阵位',
            produceMode: 'agent'
          },
          executed: false,
          reversible: true,
          basisExplanation: '依据自然语言构建意图生成的假设性工作内容草稿'
        }
      ]
    }
  ]
}
