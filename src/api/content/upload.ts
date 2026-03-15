import apiClient from "../core/client"

export interface UploadResponse {
  filename: string
  url: string
}

export interface MultiUploadResponse {
  filenames: string[]
  urls: string[]
}

export interface DocumentUploadResponse {
  filename: string
  originalName: string
  url: string
}

type UploadPayload<T> = T | { data: T } | { success: boolean; data: T }

const unwrapUploadData = <T>(payload: UploadPayload<T>): T => {
  if (payload && typeof payload === "object") {
    if ("data" in payload && payload.data) {
      return payload.data as T
    }
  }
  return payload as T
}

/**
 * 修正后端返回的图片 URL：
 * 后端有时会把自身地址硬编码为错误的端口（如 3000），
 * 统一替换成实际配置的 API baseURL 的 origin。
 */
const normalizeUrl = (url: string): string => {
  if (!url) return url
  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:30000"
    const apiOrigin = new URL(apiBase).origin   // e.g. http://127.0.0.1:30000
    const parsed = new URL(url)
    // 如果 host 不一致（端口或域名错误），把 origin 替换成正确的
    if (parsed.origin !== apiOrigin) {
      return apiOrigin + parsed.pathname + parsed.search + parsed.hash
    }
  } catch {
    // url 不是合法绝对地址，原样返回
  }
  return url
}

const postFormData = async <T>(url: string, formData: FormData): Promise<T> => {
  const response = await apiClient.post<UploadPayload<T>>(url, formData, {
    // 确保使用 multipart/form-data，后端才能正确解析文件
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return unwrapUploadData<T>(response.data)
}

export const uploadApi = {
  uploadAvatar: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    const data = await postFormData<UploadResponse>("/upload/avatar", formData)
    return {
      filename: data?.filename ?? "",
      url: normalizeUrl(data?.url ?? ""),
    }
  },

  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    const data = await postFormData<UploadResponse>("/upload/image", formData)
    return {
      filename: data?.filename ?? "",
      url: normalizeUrl(data?.url ?? ""),
    }
  },

  uploadImages: async (files: File[]): Promise<MultiUploadResponse> => {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))
    const data = await postFormData<MultiUploadResponse>("/upload/images", formData)
    return {
      filenames: data?.filenames ?? [],
      urls: (data?.urls ?? []).map(normalizeUrl),
    }
  },

  uploadDocument: async (file: File): Promise<DocumentUploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    const data = await postFormData<DocumentUploadResponse>("/upload/document", formData)
    return {
      filename: data?.filename ?? "",
      originalName: data?.originalName ?? "",
      url: normalizeUrl(data?.url ?? ""),
    }
  },
}
