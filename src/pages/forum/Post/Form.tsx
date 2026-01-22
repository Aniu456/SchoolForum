"use client"

import { uploadApi } from "@/api"
import { Button, LoadingState, RichTextEditor } from "@/components"
import { UPLOAD_CONFIG } from "@/config/constants"
import { useDraft } from "@/hooks/useDraft"
import { useCreatePost, usePost, useUpdatePost } from "@/hooks/usePosts"
import { useAuthStore } from "@/store/useAuthStore"
import type { CreatePostRequest } from "@/types"
import { addActivity } from "@/utils/activity"
import { useToast } from "@/utils/toast-hook"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"

export default function PostFormPage() {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const { showSuccess, showError } = useToast()
  const { user } = useAuthStore()

  // 判断是编辑还是新建
  const postId = params.id
  const isEdit = !!postId
  const draftId = searchParams.get("draft")

  const { data: post, isLoading: postLoading } = usePost(postId || "")
  const createPostMutation = useCreatePost()
  const updatePostMutation = useUpdatePost()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [imageUrls, setImageUrls] = useState("") // 支持多张图片，用逗号分隔
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { saveDraft, getDraft, deleteDraft } = useDraft()
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId)

  // 解析图片URL列表
  const parseImageUrls = (input: string): string[] => {
    return input
      .split(/[,\n]/)
      .map((url) => url.trim())
      .filter((url) => url && /^https?:\/\/.+/i.test(url))
  }

  const imageList = parseImageUrls(imageUrls)

  // 自动保存草稿（防抖）
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedStateRef = useRef({ title: "", content: "", tags: "", imageUrls: "" })

  const autoSaveDraft = useCallback(() => {
    // 只有当内容真正变化时才保存
    const currentState = { title, content, tags, imageUrls }
    const hasChanged =
      currentState.title !== lastSavedStateRef.current.title ||
      currentState.content !== lastSavedStateRef.current.content ||
      currentState.tags !== lastSavedStateRef.current.tags ||
      currentState.imageUrls !== lastSavedStateRef.current.imageUrls

    if (!hasChanged && (title || content || tags || imageUrls)) {
      return // 内容没有变化，不需要保存
    }

    const tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag)

    const validImages = parseImageUrls(imageUrls)
    const draftData = {
      id: currentDraftId || undefined,
      title: title.trim() || undefined,
      content: content.trim() || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      images: validImages.length > 0 ? validImages : undefined,
    }

    try {
      saveDraft(draftData)
      lastSavedStateRef.current = currentState
      // 不显示提示，避免打扰用户
    } catch (error) {
      console.error("自动保存草稿失败:", error)
    }
  }, [title, content, tags, imageUrls, currentDraftId, saveDraft])

  // 监听输入变化，自动保存草稿（30秒防抖）
  useEffect(() => {
    // 只在新建模式且有内容时才自动保存
    if (isEdit) return // 编辑模式不自动保存

    const hasContent = title.trim() || content.trim() || tags.trim() || imageUrls.trim()
    if (!hasContent) return

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveDraft()
    }, 30000) // 30秒后自动保存

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [autoSaveDraft, isEdit, title, content, tags, imageUrls])

  // 页面卸载前保存草稿
  useEffect(() => {
    return () => {
      // 如果有内容变化，立即保存一次
      const hasContent = title.trim() || content.trim() || tags.trim() || imageUrls.trim()
      if (hasContent && !isEdit) {
        autoSaveDraft()
      }
    }
  }, [autoSaveDraft, isEdit, title, content, tags, imageUrls])

  // 加载草稿或帖子数据
  useEffect(() => {
    const loadDraft = async () => {
      if (draftId) {
        try {
          const draft = getDraft(draftId)
          if (draft) {
            setTitle(draft.title || "")
            setContent(draft.content || "")
            setTags(draft.tags?.join(", ") || "")
            setImageUrls(draft.images?.join(", ") || "")
            setCurrentDraftId(draftId)
          } else {
            showError("草稿不存在或已失效")
          }
        } catch (error) {
          console.error("加载草稿失败:", error)
          showError("加载草稿失败")
        }
      } else if (post && isEdit) {
        setTitle(post.title)
        setContent(post.content)
        setTags(post.tags?.join(", ") || "")
        setImageUrls(post.images?.join(", ") || "")
      }
    }
    loadDraft()
  }, [draftId, post, isEdit, showError, getDraft])

  // 从 URL 参数中获取预填标签（如从二手市场/学习资源页面跳转过来）
  useEffect(() => {
    const tagsParam = searchParams.get("tags")
    if (tagsParam && !isEdit && !draftId) {
      // 如果已有标签，合并到一起
      setTags((prev) => {
        const existingTags = prev.trim() ? prev.split(",").map(t => t.trim()) : []
        const newTags = tagsParam.split(",").map(t => t.trim())
        const allTags = [...new Set([...existingTags, ...newTags])]
        return allTags.join(", ")
      })
    }
  }, [searchParams, isEdit, draftId])

  if (!user) {
    navigate("/login")
    return null
  }

  // 检查用户权限
  if (user.isBanned) {
    showError("您的账号已被封禁，无法发帖")
    navigate("/")
    return null
  }

  if (!user.canPost) {
    showError("您暂无发帖权限")
    navigate("/")
    return null
  }

  if (!user.isActive) {
    showError("您的账号未激活，无法发帖")
    navigate("/")
    return null
  }

  if (isEdit && postLoading) {
    return <LoadingState message="加载中..." />
  }

  const isValidImageFile = (file: File, maxSize: number) => {
    if (!UPLOAD_CONFIG.image.allowedTypes.some((type) => type === file.type)) {
      showError("只支持 JPG、PNG、GIF、WebP 格式")
      return false
    }
    if (file.size > maxSize) {
      showError(`单张图片不能超过 ${Math.round(maxSize / (1024 * 1024))}MB`)
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      showError("请输入标题")
      return
    }

    if (!content.trim()) {
      showError("请输入内容")
      return
    }

    // 验证所有图片URL
    const validImages = parseImageUrls(imageUrls)
    if (imageUrls.trim() && validImages.length === 0) {
      showError("图片 URL 格式不正确，请使用 http(s) 的链接")
      return
    }

    setIsSubmitting(true)

    try {
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)

      const postData: CreatePostRequest = {
        title: title.trim(),
        content: content.trim(),
        images: validImages.length > 0 ? validImages : undefined,
        tags: tagsArray,
      }

      if (isEdit && postId) {
        await updatePostMutation.mutateAsync({
          id: postId,
          updates: postData,
        })
        showSuccess("帖子更新成功！")
      } else {
        await createPostMutation.mutateAsync(postData)

        // 记录活动
        addActivity({
          userId: user.id,
          type: "post",
          targetId: "new_post",
          targetTitle: title.trim(),
        })

        // 删除草稿（如果有）
        if (currentDraftId) {
          deleteDraft(currentDraftId)
        }

        showSuccess("帖子发布成功！")
      }

      navigate(isEdit ? `/posts/${postId}` : "/")
    } catch {
      showError(isEdit ? "更新失败，请重试" : "发布失败，请重试")
      setIsSubmitting(false)
    }
  }

  const handleUploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // 验证所有文件
    for (const file of Array.from(files)) {
      if (!isValidImageFile(file, UPLOAD_CONFIG.image.maxSize)) {
        event.target.value = ""
        return
      }
    }

    setIsUploadingImage(true)
    try {
      const uploadedUrls: string[] = []
      for (const file of Array.from(files)) {
        const res = await uploadApi.uploadImage(file)
        const url = res.url?.trim()
        if (url) {
          uploadedUrls.push(url)
        }
      }
      if (uploadedUrls.length > 0) {
        // 追加到现有的图片URL
        const currentUrls = parseImageUrls(imageUrls)
        const newUrls = [...currentUrls, ...uploadedUrls]
        setImageUrls(newUrls.join(", "))
        showSuccess(`已上传 ${uploadedUrls.length} 张图片`)
      } else {
        showError("上传成功但未返回 URL")
      }
    } catch {
      showError("图片上传失败，请重试")
    } finally {
      setIsUploadingImage(false)
      event.target.value = ""
    }
  }

  const removeImage = (index: number) => {
    const currentUrls = parseImageUrls(imageUrls)
    currentUrls.splice(index, 1)
    setImageUrls(currentUrls.join(", "))
  }

  const handleUploadEditorImage = async (file: File) => {
    if (!isValidImageFile(file, UPLOAD_CONFIG.image.maxSize)) {
      return ""
    }
    try {
      const res = await uploadApi.uploadImage(file)
      const url = res.url?.trim()
      if (!url) {
        showError("上传成功但未返回 URL")
        return ""
      }
      showSuccess("图片已上传")
      return url
    } catch {
      showError("图片上传失败，请重试")
      return ""
    }
  }

  const handleSaveDraft = async () => {
    try {
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)

      const validImages = parseImageUrls(imageUrls)
      const draftData = {
        id: currentDraftId || undefined,
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        images: validImages.length > 0 ? validImages : undefined,
      }

      const savedDraft = saveDraft(draftData)
      setCurrentDraftId(savedDraft.id)
      showSuccess("草稿已保存到本地")
    } catch (error) {
      console.error("保存草稿失败:", error)
      showError("保存草稿失败，请重试")
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{isEdit ? "编辑帖子" : "发布新帖子"}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{isEdit ? "更新你的帖子内容" : "分享你的想法和见解"}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 标题 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="请输入帖子标题"
            maxLength={100}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{title.length}/100</p>
        </div>

        {/* 内容 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            内容 <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            onUploadImage={handleUploadEditorImage}
            placeholder="写下你的想法..."
            className="mt-2 min-h-[400px]"
          />
        </div>

        {/* 标签 */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            标签
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="输入标签，用逗号分隔"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">例如：技术, 分享, 经验</p>
        </div>

        {/* 图片 */}
        <div>
          <label htmlFor="imageUrls" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            图片 URL（支持多张，用逗号分隔）
          </label>
          <textarea
            id="imageUrls"
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
            rows={2}
          />
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
              <input type="file" accept="image/*" multiple onChange={handleUploadImages} className="hidden" />
              <span>{isUploadingImage ? "上传中..." : "选择本地图片上传"}</span>
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">支持 http/https 图片链接，可上传多张图片</span>
          </div>
          {/* 图片预览 */}
          {imageList.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {imageList.map((url, index) => (
                <div key={index} className="group relative">
                  <img
                    src={url}
                    alt={`图片 ${index + 1}`}
                    className="h-20 w-28 rounded-lg border border-gray-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-800">
          {!isEdit && (
            <Button type="button" variant="outline" onClick={handleSaveDraft}>
              保存草稿
            </Button>
          )}
          <div className={`flex gap-4 ${isEdit ? "w-full justify-end" : ""}`}>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting} variant="primary">
              {isSubmitting ? (isEdit ? "更新中..." : "发布中...") : isEdit ? "更新帖子" : "发布帖子"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
