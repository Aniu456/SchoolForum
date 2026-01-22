"use client"

import { studyResourcesApi, type CreateStudyResourceDto, type UpdateStudyResourceDto } from "@/api"
import { Button, Card, Input, Label, Textarea } from "@/components"
import { uploadApi } from "@/api/content/upload"
import { useAuthStore } from "@/store/useAuthStore"
import { useToast } from "@/utils/toast-hook"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Upload as UploadIcon } from "lucide-react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

const CATEGORIES = [
  { value: "computer", label: "计算机" },
  { value: "math", label: "数学" },
  { value: "english", label: "英语" },
  { value: "physics", label: "物理" },
  { value: "chemistry", label: "化学" },
  { value: "other", label: "其他" },
]

const TYPES = [
  { value: "note", label: "课堂笔记" },
  { value: "exam", label: "考试资料" },
  { value: "material", label: "学习材料" },
  { value: "other", label: "其他" },
]

export default function StudyResourceFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { showSuccess, showError } = useToast()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("computer")
  const [type, setType] = useState<"note" | "exam" | "material" | "other">("note")
  const [fileUrl, setFileUrl] = useState("")
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState<number>()
  const [thumbnail, setThumbnail] = useState("")
  const [tags, setTags] = useState("")
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)

  // 编辑模式时加载数据
  const { data: resource } = useQuery({
    queryKey: ["study-resource", id],
    queryFn: () => studyResourcesApi.findOne(id!),
    enabled: !!id,
  })

  // 加载资源数据到表单
  useState(() => {
    if (resource) {
      setTitle(resource.title)
      setDescription(resource.description)
      setCategory(resource.category)
      setType(resource.type)
      setFileUrl(resource.fileUrl)
      setFileName(resource.fileName)
      setFileSize(resource.fileSize)
      setThumbnail(resource.thumbnail || "")
      setTags(resource.tags?.join(", ") || "")
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      showError("请先登录")
      navigate("/login")
      return
    }

    // 验证
    if (!title.trim()) {
      showError("请输入资源标题")
      return
    }
    if (!description.trim()) {
      showError("请输入资源描述")
      return
    }
    if (!fileUrl.trim()) {
      showError("请上传文件")
      return
    }

    const tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag)

    const data: CreateStudyResourceDto | UpdateStudyResourceDto = {
      title: title.trim(),
      description: description.trim(),
      category,
      type,
      fileUrl: fileUrl.trim(),
      fileName: fileName.trim(),
      fileSize,
      thumbnail: thumbnail.trim() || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
    }

    try {
      if (id) {
        await studyResourcesApi.update(id, data)
        showSuccess("资源已更新")
      } else {
        await studyResourcesApi.create(data as CreateStudyResourceDto)
        showSuccess("资源已发布")
      }
      navigate(id ? `/study-resources/${id}` : "/study-resources")
    } catch {
      showError(id ? "更新失败" : "发布失败")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setIsUploadingFile(true)
    try {
      const result = await uploadApi.uploadImage(file, "study-resources")
      setFileUrl(result.url)
      setFileName(file.name)
      setFileSize(file.size)
      showSuccess("文件上传成功")
    } catch {
      showError("文件上传失败")
    } finally {
      setIsUploadingFile(false)
      e.target.value = ""
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingThumbnail(true)
    try {
      const result = await uploadApi.uploadImage(files[0], "study-resources")
      setThumbnail(result.url)
      showSuccess("缩略图上传成功")
    } catch {
      showError("缩略图上传失败")
    } finally {
      setIsUploadingThumbnail(false)
      e.target.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/study-resources")}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {id ? "编辑资源" : "上传资源"}
          </button>
        </div>
      </div>

      {/* 表单 */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {id ? "编辑学习资源" : "上传学习资源"}
            </h2>

            {/* 标题 */}
            <div className="space-y-2">
              <Label htmlFor="title">资源标题 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入资源标题（最多50字）"
                maxLength={50}
                required
              />
            </div>

            {/* 分类 */}
            <div className="space-y-2">
              <Label htmlFor="category">分类 *</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 类型 */}
            <div className="space-y-2">
              <Label htmlFor="type">资源类型 *</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">资源描述 *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请详细描述资源的内容、用途、适用范围等"
                rows={5}
                required
              />
            </div>

            {/* 文件上传 */}
            <div className="space-y-2">
              <Label>资源文件 *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploadingFile}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    isUploadingFile ? "opacity-50" : ""
                  }`}
                >
                  {isUploadingFile ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <UploadIcon className="h-10 w-10 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-600">
                    {fileName || "点击上传文件（PDF、图片、文档等）"}
                  </span>
                  {fileSize && (
                    <span className="text-xs text-gray-500">
                      {(fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </label>
                {fileUrl && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">文件已上传: {fileName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 缩略图上传 */}
            <div className="space-y-2">
              <Label>缩略图（可选）</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  disabled={isUploadingThumbnail}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label
                  htmlFor="thumbnail-upload"
                  className={`flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    isUploadingThumbnail ? "opacity-50" : ""
                  }`}
                >
                  {isUploadingThumbnail ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : thumbnail ? (
                    <img src={thumbnail} alt="缩略图" className="h-20 w-20 object-cover rounded" />
                  ) : (
                    <UploadIcon className="h-10 w-10 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-600">
                    {thumbnail ? "点击更换缩略图" : "点击上传缩略图"}
                  </span>
                </label>
              </div>
            </div>

            {/* 标签 */}
            <div className="space-y-2">
              <Label htmlFor="tags">标签</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="输入标签，用逗号分隔"
              />
              <p className="mt-1 text-xs text-gray-500">例如：高等数学, 期末复习, 重点笔记</p>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/study-resources")}
              >
                取消
              </Button>
              <Button type="submit" disabled={isUploadingFile || isUploadingThumbnail}>
                {id ? "保存修改" : "发布资源"}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  )
}
