"use client"

import { secondhandApi, type CreateSecondhandDto } from "@/api"
import { Button, Card, Input, Label, Textarea } from "@/components"
import { uploadApi } from "@/api/content/upload"
import { useAuthStore } from "@/store/useAuthStore"
import { useToast } from "@/utils/toast-hook"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useState } from "react"

const CATEGORIES = [
  { value: "digital", label: "数码产品" },
  { value: "books", label: "图书资料" },
  { value: "dorm", label: "宿舍用品" },
  { value: "sports", label: "运动器材" },
  { value: "other", label: "其他" },
]

const CONDITIONS = [
  { value: "new", label: "全新" },
  { value: "like_new", label: "九成新" },
  { value: "good", label: "八成新" },
  { value: "fair", label: "七成新及以下" },
]

export default function SecondhandFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { showSuccess, showError } = useToast()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("digital")
  const [condition, setCondition] = useState<"new" | "like_new" | "good" | "fair">("good")
  const [location, setLocation] = useState("")
  const [contactInfo, setContactInfo] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // 编辑模式时加载数据
  // TODO: 实现编辑模式的数据加载

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      showError("请先登录")
      navigate("/login")
      return
    }

    // 验证
    if (!title.trim()) {
      showError("请输入商品标题")
      return
    }
    if (!description.trim()) {
      showError("请输入商品描述")
      return
    }
    if (!price || Number(price) <= 0) {
      showError("请输入有效的价格")
      return
    }
    if (!contactInfo.trim()) {
      showError("请输入联系方式")
      return
    }

    const data: CreateSecondhandDto = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      condition,
      location: location.trim() || undefined,
      contactInfo: contactInfo.trim(),
      images,
    }

    try {
      if (id) {
        await secondhandApi.update(id, data)
        showSuccess("商品已更新")
      } else {
        await secondhandApi.create(data)
        showSuccess("商品已发布")
      }
      navigate(`/marketplace/${id || ""}`)
    } catch {
      showError(id ? "更新失败" : "发布失败")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map((file) =>
        uploadApi.uploadImage(file, "marketplace")
      )

      const results = await Promise.all(uploadPromises)
      const newUrls = results.map((r) => r.url)
      setImages([...images, ...newUrls])
      showSuccess(`成功上传 ${newUrls.length} 张图片`)
    } catch {
      showError("图片上传失败")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/marketplace")}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {id ? "编辑商品" : "发布商品"}
          </button>
        </div>
      </div>

      {/* 表单 */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {id ? "编辑商品" : "发布新商品"}
            </h2>

            {/* 标题 */}
            <div className="space-y-2">
              <Label htmlFor="title">商品标题 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入商品标题（最多50字）"
                maxLength={50}
                required
              />
            </div>

            {/* 价格 */}
            <div className="space-y-2">
              <Label htmlFor="price">价格 (元) *</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
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

            {/* 成色 */}
            <div className="space-y-2">
              <Label htmlFor="condition">成色 *</Label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">商品描述 *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请详细描述商品的品牌、型号、购买时间、使用情况等"
                rows={5}
                required
              />
            </div>

            {/* 位置 */}
            <div className="space-y-2">
              <Label htmlFor="location">交易位置</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="如：东区食堂、图书馆等"
              />
            </div>

            {/* 联系方式 */}
            <div className="space-y-2">
              <Label htmlFor="contact">联系方式 *</Label>
              <Input
                id="contact"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="请输入微信号或QQ号"
                required
              />
            </div>

            {/* 图片上传 */}
            <div className="space-y-2">
              <Label>商品图片</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    isUploading ? "opacity-50" : ""
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <svg
                        className="h-10 w-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m0 0h16M12 8h.01"
                        />
                      </svg>
                      <span className="text-sm text-gray-600">
                        点击上传图片（最多5张）
                      </span>
                    </>
                  )}
                </label>

                {/* 已上传图片预览 */}
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`上传图片${index + 1}`}
                          className="h-20 w-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute right-1 top-1 rounded-full bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/marketplace")}
              >
                取消
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "提交中..." : id ? "保存修改" : "发布商品"}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  )
}
