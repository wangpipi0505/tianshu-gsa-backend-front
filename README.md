# “天枢”全球三维数字地球与全维智能态势研判系统 (TianShu-GSA)

> **TianShu-GSA**: *Global Multi-Domain Situation Display & Intelligent Assessment Platform*
> Vue 3 + TypeScript + Pinia + Cesium + Element Plus。

本仓库是**独立前端仓**（`tianshu-gsa-backend-front`），不要再 `cd front`。

## 两种跑法

```bash
npm install
```

| 模式 | 命令 | 说明 |
| --- | --- | --- |
| 接后端 | `npm run dev` | 默认 `VITE_USE_MOCK=false`，Vite 把 `/api` 代理到 `127.0.0.1:18086` |
| 纯前端原型 | `npm run dev:mock` | 不访问后端，使用 `src/mock/*` |

后端挂了会自动回退同一套 mock，并提示，不会空屏。**不要删除 `src/mock`。**

接库时，启动会向 `/api/gsa/v1/auth/demo-token` 换本地 JWT；若门户已注入令牌，可设 `VITE_PORTAL_TOKEN`。

## 其它命令

```bash
npm run build
npm run export-seed      # 从 mock 导出后端种子
npm run check-seed-sync  # 检查 mock 与后端 seed 的稳定主键是否对齐
```

## 技术栈

Vue 3、Pinia、Cesium、Element Plus、ECharts、Vite 5、axios。
