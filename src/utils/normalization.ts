/**
 * API 响应数据规范化工具
 * 处理不同后端返回格式的统一转换
 */

export interface NormalizedList<T = any> {
  list: T[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

/**
 * 规范化列表响应数据
 * 处理多种可能的响应格式：
 * - { data: { data: [...], meta: {...} } }
 * - { data: [...], meta: {...} }
 * - { list: [...], pagination: {...} }
 */
export function normalizeList<T = any>(payload: any): NormalizedList<T> {
  if (!payload) {
    return { list: [] }
  }

  // 处理嵌套的 data.data 格式
  if (payload.data?.data && Array.isArray(payload.data.data)) {
    return {
      list: payload.data.data as T[],
      meta: payload.data.meta || payload.data.pagination,
    }
  }

  // 处理 data 是数组格式
  if (payload.data && Array.isArray(payload.data)) {
    return {
      list: payload.data as T[],
      meta: payload.meta || payload.pagination,
    }
  }

  // 处理直接是数组格式
  if (Array.isArray(payload)) {
    return { list: payload as T[] }
  }

  // 处理标准响应格式
  if (payload.list && Array.isArray(payload.list)) {
    return {
      list: payload.list as T[],
      meta: payload.meta || payload.pagination,
    }
  }

  return { list: [] }
}

/**
 * 规范化分页元数据
 */
export function normalizeMeta(payload: any) {
  return normalizeList(payload).meta
}
