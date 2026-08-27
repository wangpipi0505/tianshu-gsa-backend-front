/** 纯前端原型开关。true 时不访问后端，全部使用 src/mock。 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function cloneMock<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
