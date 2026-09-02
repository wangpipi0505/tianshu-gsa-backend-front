/** 纯前端原型开关。true 时不访问后端，全部使用 src/mock。 */
export let USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/**
 * 后端不可用整体回退后调用：把运行时开关也翻转为 mock，
 * 避免出现"数据已回退、请求仍打后端"的半 mock 状态。
 * 依赖 ES Module live binding，所有 import USE_MOCK 的消费方立即生效。
 */
export function enableMockFallback() {
  USE_MOCK = true
}

export function cloneMock<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
