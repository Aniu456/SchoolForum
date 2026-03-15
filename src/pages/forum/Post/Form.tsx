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

const TITLE_MAX = 100
const TAG_MAX = 10

export default function PostFormPage() {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const { showSuccess, showError } = useToast()
  const { user } = useAuthStore()

  const postId = params.id
  const isEdit = !!postId
  const draftId = searchParams.get("draft")

  const { data: post, isLoading: postLoading } = usePost(postId || "")
  const createPostMutation = useCreatePost()
  const updatePostMutation = useUpdatePost()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle")

  const { saveDraft, getDraft, deleteDraft } = useDraft()
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId)

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedStateRef = useRef({ title: "", content: "", tags: [] as string[], imageUrls: [] as string[] })
  const tagInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const autoSaveDraft = useCallback(() => {
    const hasChanged =
      title !== lastSavedStateRef.current.title ||
      content !== lastSavedStateRef.current.content ||
      JSON.stringify(tags) !== JSON.stringify(lastSavedStateRef.current.tags) ||
      JSON.stringify(imageUrls) !== JSON.stringify(lastSavedStateRef.current.imageUrls)

    if (!hasChanged) return

    const draftData = {
      id: currentDraftId || undefined,
      title: title.trim() || undefined,
      content: content.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      images: imageUrls.length > 0 ? imageUrls : undefined,
    }

    try {
      setAutoSaveStatus("saving")
      saveDraft(draftData)
      lastSavedStateRef.current = { title, content, tags, imageUrls }
      setAutoSaveStatus("saved")
      setTimeout(() => setAutoSaveStatus("idle"), 2000)
    } catch (error) {
      console.error("自动保存草稿失败:", error)
      setAutoSaveStatus("idle")
    }
  }, [title, content, tags, imageUrls, currentDraftId, saveDraft])

  useEffect(() => {
    if (isEdit) return
    const hasContent = title.trim() || content.trim() || tags.length > 0 || imageUrls.length > 0
    if (!hasContent) return

    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveDraft()
    }, 30000)

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    }
  }, [autoSaveDraft, isEdit, title, content, tags, imageUrls])

  useEffect(() => {
    return () => {
      const hasContent = title.trim() || content.trim() || tags.length > 0 || imageUrls.length > 0
      if (hasContent && !isEdit) autoSaveDraft()
    }
  }, [autoSaveDraft, isEdit, title, content, tags, imageUrls])

  // ── Load draft / post ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (draftId) {
        try {
          const draft = getDraft(draftId)
          if (draft) {
            setTitle(draft.title || "")
            setContent(draft.content || "")
            setTags(draft.tags || [])
            setImageUrls(draft.images || [])
            setCurrentDraftId(draftId)
          } else {
            showError("草稿不存在或已失效")
          }
        } catch {
          showError("加载草稿失败")
        }
      } else if (post && isEdit) {
        setTitle(post.title)
        setContent(post.content)
        setTags(post.tags || [])
        setImageUrls(post.images || [])
      }
    }
    load()
  }, [draftId, post, isEdit, showError, getDraft])

  useEffect(() => {
    const tagsParam = searchParams.get("tags")
    if (tagsParam && !isEdit && !draftId) {
      const newTags = tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
      setTags((prev) => [...new Set([...prev, ...newTags])].slice(0, TAG_MAX))
    }
  }, [searchParams, isEdit, draftId])

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!user) { navigate("/login"); return null }
  if (user.isBanned) { showError("您的账号已被封禁，无法发帖"); navigate("/"); return null }
  if (!user.canPost) { showError("您暂无发帖权限"); navigate("/"); return null }
  if (!user.isActive) { showError("您的账号未激活，无法发帖"); navigate("/"); return null }
  if (isEdit && postLoading) return <LoadingState message="加载中..." />

  // ── Image helpers ──────────────────────────────────────────────────────────
  const isValidImageFile = (file: File) => {
    if (!UPLOAD_CONFIG.image.allowedTypes.some((t) => t === file.type)) {
      showError("只支持 JPG、PNG、GIF、WebP 格式")
      return false
    }
    if (file.size > UPLOAD_CONFIG.image.maxSize) {
      showError(`单张图片不能超过 ${Math.round(UPLOAD_CONFIG.image.maxSize / (1024 * 1024))}MB`)
      return false
    }
    return true
  }

  const uploadFiles = async (files: File[]) => {
    const valid = files.filter(isValidImageFile)
    if (valid.length === 0) return

    setIsUploadingImage(true)
    try {
      const urls: string[] = []
      for (const file of valid) {
        const res = await uploadApi.uploadImage(file)
        const url = res.url?.trim()
        if (url) urls.push(url)
      }
      if (urls.length > 0) {
        setImageUrls((prev) => [...prev, ...urls])
        showSuccess(`已上传 ${urls.length} 张图片`)
      } else {
        showError("上传成功但未返回 URL")
      }
    } catch {
      showError("图片上传失败，请重试")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    await uploadFiles(files)
    e.target.value = ""
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
    if (files.length > 0) await uploadFiles(files)
  }

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUploadEditorImage = async (file: File): Promise<string> => {
    if (!isValidImageFile(file)) return ""
    try {
      const res = await uploadApi.uploadImage(file)
      const url = res.url?.trim()
      if (!url) { showError("上传成功但未返回 URL"); return "" }
      showSuccess("图片已上传")
      return url
    } catch {
      showError("图片上传失败，请重试")
      return ""
    }
  }

  // ── Tag helpers ────────────────────────────────────────────────────────────
  const addTag = (raw: string) => {
    const value = raw.trim().replace(/^#/, "")
    if (!value || tags.includes(value) || tags.length >= TAG_MAX) return
    setTags((prev) => [...prev, value])
    setTagInput("")
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Save draft ─────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    try {
      const draftData = {
        id: currentDraftId || undefined,
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      }
      const saved = await saveDraft(draftData)
      setCurrentDraftId(saved.id)
      showSuccess("草稿已保存到本地")
    } catch {
      showError("保存草稿失败，请重试")
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { showError("请输入标题"); return }
    if (!content.trim()) { showError("请输入内容"); return }

    setIsSubmitting(true)
    try {
      const postData: CreatePostRequest = {
        title: title.trim(),
        content: content.trim(),
        images: imageUrls.length > 0 ? imageUrls : undefined,
        tags,
      }

      if (isEdit && postId) {
        await updatePostMutation.mutateAsync({ id: postId, updates: postData })
        showSuccess("帖子更新成功！")
      } else {
        await createPostMutation.mutateAsync(postData)
        addActivity({ userId: user.id, type: "post", targetId: "new_post", targetTitle: title.trim() })
        if (currentDraftId) deleteDraft(currentDraftId)
        showSuccess("帖子发布成功！")
      }

      navigate(isEdit ? `/posts/${postId}` : "/")
    } catch {
      showError(isEdit ? "更新失败，请重试" : "发布失败，请重试")
      setIsSubmitting(false)
    }
  }

  const wordCount = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isEdit ? "编辑帖子" : "发布新帖子"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isEdit ? "修改你的帖子内容" : "分享你的想法、经验与见解"}
            </p>
          </div>

          {/* Auto-save indicator */}
          {!isEdit && (
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              {autoSaveStatus === "saving" && (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  <span>保存中…</span>
                </>
              )}
              {autoSaveStatus === "saved" && (
                <>
                  <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,8 6,12 14,4" />
                  </svg>
                  <span className="text-green-500">草稿已自动保存</span>
                </>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* ── Left / Main column ── */}
            <div className="space-y-5 lg:col-span-2">

              {/* Title */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">标题</span>
                </div>
                <div className="px-4 py-3">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent text-lg font-semibold text-gray-900 placeholder-gray-300 focus:outline-none dark:text-gray-100 dark:placeholder-gray-600"
                    placeholder="给你的帖子起个吸引人的标题…"
                    maxLength={TITLE_MAX}
                  />
                  <div className="mt-2 flex justify-end">
                    <span className={`text-xs tabular-nums ${title.length > TITLE_MAX * 0.9 ? "text-amber-500" : "text-gray-300 dark:text-gray-600"}`}>
                      {title.length} / {TITLE_MAX}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">正文</span>
                </div>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  onUploadImage={handleUploadEditorImage}
                  placeholder="写下你的想法…支持 Markdown 格式、图片插入"
                  className="min-h-[360px]"
                />
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 dark:border-gray-800">
                  <span className="text-xs text-gray-400 dark:text-gray-500">支持富文本格式</span>
                  <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">{wordCount} 字</span>
                </div>
              </div>

              {/* Cover images */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">封面图片</span>
                </div>
                <div className="p-4 space-y-4">
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors ${
                      isDragging
                        ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    {isUploadingImage ? (
                      <>
                        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">上传中…</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-8 w-8 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-blue-500">点击上传</span>
                          {" "}或拖拽图片到此处
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-600">JPG、PNG、GIF、WebP，最大 {Math.round(UPLOAD_CONFIG.image.maxSize / (1024 * 1024))}MB</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleUploadImages}
                    />
                  </div>

                  {/* Image previews */}
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="group relative aspect-square">
                          <img
                            src={url}
                            alt={`图片 ${index + 1}`}
                            className="h-full w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition-opacity hover:bg-red-600 group-hover:opacity-100"
                          >
                            <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
                            </svg>
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">封面</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right / Sidebar ── */}
            <div className="space-y-5">

              {/* Publish card */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">发布</span>
                </div>
                <div className="space-y-3 p-4">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="w-full justify-center"
                  >
                    {isSubmitting
                      ? (isEdit ? "更新中…" : "发布中…")
                      : (isEdit ? "更新帖子" : "立即发布")}
                  </Button>
                  {!isEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      className="w-full justify-center"
                    >
                      保存草稿
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="w-full justify-center text-gray-500"
                  >
                    取消
                  </Button>
                </div>
              </div>

              {/* Tags */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">标签</span>
                    <span className="text-xs text-gray-400 dark:text-gray-600">{tags.length} / {TAG_MAX}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {/* Tag chips */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(i)}
                            className="ml-0.5 rounded-full text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300"
                          >
                            <svg className="h-3 w-3" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tag input */}
                  {tags.length < TAG_MAX && (
                    <div
                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-gray-700 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-900/30"
                      onClick={() => tagInputRef.current?.focus()}
                    >
                      <span className="text-sm text-gray-400">#</span>
                      <input
                        ref={tagInputRef}
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
                        className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder-gray-600"
                        placeholder="输入标签后按 Enter 或逗号确认"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-600">按 Enter、逗号或空格添加，Backspace 删除</p>
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <h3 className="mb-2 text-xs font-semibold text-blue-700 dark:text-blue-400">发帖小贴士</h3>
                <ul className="space-y-1.5 text-xs text-blue-600/80 dark:text-blue-400/70">
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>标题简洁明了，突出核心内容</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>正文支持图片、链接、列表等富文本格式</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>合理使用标签，方便其他人搜索发现</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>草稿每 30 秒自动保存一次</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
