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
      url: data?.url ?? "",
    }
  },

  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    const data = await postFormData<UploadResponse>("/upload/image", formData)
    return {
      filename: data?.filename ?? "",
      url: data?.url ?? "",
    }
  },

  uploadImages: async (files: File[]): Promise<MultiUploadResponse> => {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))
    const data = await postFormData<MultiUploadResponse>("/upload/images", formData)
    return {
      filenames: data?.filenames ?? [],
      urls: data?.urls ?? [],
    }
  },

  uploadDocument: async (file: File): Promise<DocumentUploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    const data = await postFormData<DocumentUploadResponse>("/upload/document", formData)
    return {
      filename: data?.filename ?? "",
      originalName: data?.originalName ?? "",
      url: data?.url ?? "",
    }
  },
}
