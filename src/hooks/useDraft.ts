import { useState, useEffect, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { draftApi, type PostDraft as ServerPostDraft, type CreatePostDraftDto } from "@/api"
import { useToast } from "@/utils/toast-hook"

/**
 * 本地草稿类型（与后端API保持一致）
 */
export interface PostDraft {
  id: string
  title: string
  content: string
  images: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

const LOCAL_STORAGE_KEY = "forum_drafts_local"

/**
 * 草稿Hook - 同时支持本地存储和后端API
 *
 * 功能：
 * 1. 本地草稿 - 使用localStorage，即时保存，离线可用
 * 2. 云端草稿 - 同步到后端，跨设备访问
 * 3. 自动同步 - 本地草稿可以同步到云端
 */
export function useDraft() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  // 本地草稿状态
  const [localDrafts, setLocalDrafts] = useState<PostDraft[]>([])

  // 加载本地草稿
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        setLocalDrafts(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Failed to load local drafts:", e)
    }
  }, [])

  // 持久化本地草稿
  const persistLocalDrafts = useCallback((drafts: PostDraft[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts))
      setLocalDrafts(drafts)
    } catch (e) {
      console.error("Failed to save local drafts:", e)
    }
  }, [])

  // 获取云端草稿列表
  const { data: cloudDraftsData, isLoading: isLoadingCloud, refetch: refetchCloudDrafts } = useQuery({
    queryKey: ["drafts"],
    queryFn: () => draftApi.getDrafts(1, 20),
    staleTime: 1000 * 60 * 5, // 5分钟
  })

  const cloudDrafts = cloudDraftsData?.data || []

  // 创建/更新云端草稿
  const saveCloudDraftMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: CreatePostDraftDto }) => {
      if (id) {
        return await draftApi.updateDraft(id, data)
      }
      return await draftApi.createOrUpdateDraft(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
    },
  })

  // 删除云端草稿
  const deleteCloudDraftMutation = useMutation({
    mutationFn: async (id: string) => {
      await draftApi.deleteDraft(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      showSuccess("草稿已删除")
    },
    onError: () => {
      showError("删除草稿失败")
    },
  })

  // 发布草稿
  const publishDraftMutation = useMutation({
    mutationFn: async (id: string) => {
      return await draftApi.publishDraft(id)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      showSuccess(`发布成功！帖子ID: ${data.postId}`)
    },
    onError: () => {
      showError("发布失败，请重试")
    },
  })

  /**
   * 保存本地草稿（即时保存到localStorage）
   */
  const saveLocalDraft = useCallback(
    (data: Omit<PostDraft, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
      const now = new Date().toISOString()
      let newDrafts = [...localDrafts]
      let savedDraft: PostDraft

      if (data.id) {
        // 更新现有草稿
        const index = newDrafts.findIndex((d) => d.id === data.id)
        if (index !== -1) {
          savedDraft = { ...newDrafts[index], ...data, updatedAt: now }
          newDrafts[index] = savedDraft
        } else {
          savedDraft = { id: data.id, ...data, createdAt: now, updatedAt: now }
          newDrafts.unshift(savedDraft)
        }
      } else {
        // 创建新草稿
        const newId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        savedDraft = {
          id: newId,
          title: data.title || "",
          content: data.content || "",
          images: data.images || [],
          tags: data.tags || [],
          createdAt: now,
          updatedAt: now,
        }
        newDrafts.unshift(savedDraft)
      }

      // 只保留最近20条本地草稿
      if (newDrafts.length > 20) {
        newDrafts = newDrafts.slice(0, 20)
      }

      persistLocalDrafts(newDrafts)
      return savedDraft
    },
    [localDrafts, persistLocalDrafts]
  )

  /**
   * 删除本地草稿
   */
  const deleteLocalDraft = useCallback(
    (id: string) => {
      const filtered = localDrafts.filter((d) => d.id !== id)
      persistLocalDrafts(filtered)
    },
    [localDrafts, persistLocalDrafts]
  )

  /**
   * 同步本地草稿到云端
   */
  const syncToCloud = useCallback(
    async (localDraft: PostDraft) => {
      const data: CreatePostDraftDto = {
        title: localDraft.title || undefined,
        content: localDraft.content || undefined,
        images: localDraft.images,
        tags: localDraft.tags,
      }

      try {
        const cloudDraft = await saveCloudDraftMutation.mutateAsync({ data })
        // 同步成功后，删除本地草稿，保留云端草稿
        deleteLocalDraft(localDraft.id)
        showSuccess("草稿已同步到云端")
        return cloudDraft
      } catch (error) {
        showError("同步到云端失败")
        throw error
      }
    },
    [saveCloudDraftMutation, deleteLocalDraft]
  )

  /**
   * 保存草稿（智能保存：先本地，可选云端）
   */
  const saveDraft = useCallback(
    async (
      data: Omit<PostDraft, "id" | "createdAt" | "updatedAt"> & { id?: string },
      options?: { syncToCloud?: boolean }
    ) => {
      // 先保存到本地（即时）
      const localDraft = saveLocalDraft(data)

      // 如果需要同步到云端
      if (options?.syncToCloud) {
        await syncToCloud(localDraft)
      }

      return localDraft
    },
    [saveLocalDraft, syncToCloud]
  )

  /**
   * 获取本地草稿
   */
  const getLocalDraft = useCallback(
    (id: string): PostDraft | undefined => {
      return localDrafts.find((d) => d.id === id)
    },
    [localDrafts]
  )

  /**
   * 获取云端草稿
   */
  const getCloudDraft = useCallback(
    (id: string): ServerPostDraft | undefined => {
      return cloudDrafts.find((d) => d.id === id)
    },
    [cloudDrafts]
  )

  /**
   * 获取草稿（优先本地，其次云端）
   */
  const getDraft = useCallback(
    (id: string): PostDraft | ServerPostDraft | undefined => {
      return getLocalDraft(id) || getCloudDraft(id)
    },
    [getLocalDraft, getCloudDraft]
  )

  /**
   * 删除草稿（本地或云端）
   */
  const deleteDraft = useCallback(
    async (id: string) => {
      // 判断是本地还是云端草稿
      if (id.startsWith("local_")) {
        deleteLocalDraft(id)
      } else {
        await deleteCloudDraftMutation.mutateAsync(id)
      }
    },
    [deleteLocalDraft, deleteCloudDraftMutation]
  )

  /**
   * 发布草稿
   */
  const publishDraft = useCallback(
    async (id: string) => {
      // 如果是本地草稿，先同步到云端再发布
      if (id.startsWith("local_")) {
        const localDraft = getLocalDraft(id)
        if (localDraft) {
          const cloudDraft = await syncToCloud(localDraft)
          if (cloudDraft) {
            await publishDraftMutation.mutateAsync(cloudDraft.id)
          }
        }
      } else {
        await publishDraftMutation.mutateAsync(id)
      }
    },
    [getLocalDraft, syncToCloud, publishDraftMutation]
  )

  /**
   * 获取所有草稿（本地+云端）
   */
  const getAllDrafts = useCallback((): PostDraft[] => {
    // 合并本地和云端草稿，去重（云端优先）
    const allDrafts = [...localDrafts]

    cloudDrafts.forEach((cloud) => {
      if (!allDrafts.find((local) => local.id === cloud.id)) {
        allDrafts.push(cloud as PostDraft)
      }
    })

    // 按更新时间排序
    return allDrafts.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }, [localDrafts, cloudDrafts])

  return {
    // 数据
    localDrafts,
    cloudDrafts,
    isLoadingCloud,
    allDrafts: getAllDrafts(),

    // 操作
    saveDraft,
    deleteDraft,
    getDraft,
    getLocalDraft,
    getCloudDraft,
    syncToCloud,
    publishDraft,
    refetchCloudDrafts,
  }
}
