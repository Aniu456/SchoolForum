/**
 * 二手交易市场 - 列表页（UniMarket 风格）
 * 依照提供的设计稿重塑列表、筛选与卡片样式。
 */
import { marketplaceApi, messageApi, studyResourceApi } from "@/api"
import type { ResourceQueryParams, ResourceType, StudyResource } from "@/api/services/studyResource"
import { Avatar } from "@/components"
import { useAuthStore } from "@/store/useAuthStore"
import type { ItemCondition, MarketplaceItem, MarketplaceQueryParams } from "@/types"
import { formatNumber, formatTime } from "@/utils/format"
import { useToast } from "@/utils/toast-hook"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, BookOpen, Download, Eye, MessageCircle, Search, Share, Tag, X } from "lucide-react"
import type { JSX } from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

const MAIN_TABS = [
  { key: "secondhand", label: "二手交易" },
  { key: "study", label: "学习资源" },
] as const

const CONDITIONS: Record<ItemCondition, { label: string; className: string }> = {
  NEW: { label: "全新", className: "bg-sky-100 text-sky-700" },
  LIKE_NEW: { label: "几乎全新", className: "bg-emerald-100 text-emerald-700" },
  GOOD: { label: "良好", className: "bg-blue-100 text-blue-700" },
  FAIR: { label: "一般", className: "bg-amber-100 text-amber-700" },
  POOR: { label: "较差", className: "bg-orange-100 text-orange-700" },
}

// 品类文案映射：优先使用中文名称，未匹配时回退为后端原值
const CATEGORY_LABELS: Record<string, string> = {
  ELECTRONICS: "数码",
  BOOKS: "书籍",
  CLOTHING: "服饰",
  SPORTS: "运动",
  FURNITURE: "家居",
  STATIONERY: "文具",
  DAILY: "生活",
  OTHER: "其他",
}

const RESOURCE_TYPE_META: Record<ResourceType | string, { className: string; badgeClass: string; icon: JSX.Element }> =
  {
    DOCUMENT: {
      className: "bg-amber-50 text-amber-600",
      badgeClass: "bg-amber-100 text-amber-700",
      icon: <BookOpen className="h-5 w-5" />,
    },
    VIDEO: {
      className: "bg-rose-50 text-rose-600",
      badgeClass: "bg-rose-100 text-rose-700",
      icon: <MessageCircle className="h-5 w-5 rotate-90" />,
    },
    CODE: {
      className: "bg-indigo-50 text-indigo-600",
      badgeClass: "bg-indigo-100 text-indigo-700",
      icon: <Tag className="h-5 w-5" />,
    },
    LINK: {
      className: "bg-sky-50 text-sky-600",
      badgeClass: "bg-sky-100 text-sky-700",
      icon: <ArrowRight className="h-5 w-5" />,
    },
    OTHER: {
      className: "bg-gray-50 text-gray-600",
      badgeClass: "bg-gray-100 text-gray-700",
      icon: <BookOpen className="h-5 w-5" />,
    },
  }

type MainTab = (typeof MAIN_TABS)[number]["key"]

function MarketplaceCard({
  item,
  onClick,
}: {
  item: MarketplaceItem & { originalPrice?: number }
  onClick: (item: MarketplaceItem) => void
}) {
  const conditionMeta = CONDITIONS[item.condition] || {
    label: item.condition,
    className: "bg-slate-100 text-slate-600",
  }
  const sellerName = item.seller?.nickname || item.seller?.username || "匿名卖家"
  const categoryLabel = item.category ? CATEGORY_LABELS[item.category] ?? item.category : undefined

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-blue-50 bg-white text-left shadow-[0_10px_30px_-22px_rgba(37,99,235,0.65)] transition hover:-translate-y-1 hover:shadow-[0_15px_40px_-20px_rgba(37,99,235,0.55)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {item.images?.[0] ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-slate-400">📦</div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-lg font-semibold text-slate-900 group-hover:text-blue-700">{item.title}</h3>
        {categoryLabel && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
              #{categoryLabel}
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium shadow-sm ${conditionMeta.className}`}
          >
            {conditionMeta.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
            <Eye className="h-3.5 w-3.5" />
            {formatNumber(item.viewCount || 0)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {item.location && (
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4 text-slate-400" />
              {item.location}
            </span>
          )}
          <span className="text-slate-400">{formatTime(item.createdAt)}</span>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-slate-900">¥{item.price}</span>
          {item.originalPrice ? (
            <span className="text-sm text-slate-400 line-through">¥{item.originalPrice}</span>
          ) : null}
        </div>

        <div className="mt-auto flex items-center gap-3">
          <Avatar
            src={item.seller?.avatar}
            alt={sellerName}
            username={sellerName}
            seed={item.seller?.id}
            size={36}
            className="ring-1 ring-slate-100"
          />
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-900">{sellerName}</div>
            <div className="text-xs text-slate-500">发布于 {formatTime(item.createdAt)}</div>
          </div>
        </div>
      </div>
    </button>
  )
}

function ResourceCard({ resource, onClick }: { resource: StudyResource; onClick: (item: StudyResource) => void }) {
  const meta = RESOURCE_TYPE_META[resource.type] ||
    RESOURCE_TYPE_META.OTHER || {
      className: "bg-gray-50 text-gray-600",
      badgeClass: "bg-gray-100 text-gray-700",
      icon: <BookOpen className="h-5 w-5" />,
    }

  return (
    <button
      type="button"
      onClick={() => onClick(resource)}
      className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="mb-4 flex items-start justify-between">
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${meta.className}`}>{meta.icon}</span>
        <span className={`rounded-md px-3 py-1 text-[11px] font-semibold ${meta.badgeClass}`}>
          {resource.type || "资源"}
        </span>
      </div>
      <h3 className="mb-2 text-lg font-bold leading-tight text-slate-900 group-hover:text-slate-900">
        {resource.title}
      </h3>
      <p className="mb-4 line-clamp-2 text-sm text-slate-600">{resource.description}</p>

      <div className="mt-auto flex items-center justify-between text-xs font-medium text-slate-500">
        <span className="flex items-center gap-1">
          <Download className="h-4 w-4" />
          {formatNumber(resource.downloadCount || 0)}
        </span>
        <span className="flex items-center gap-1 text-slate-500">
          <Eye className="h-4 w-4 text-slate-400" />
          {formatNumber(resource.viewCount || 0)}
        </span>
        <span className="rounded-md bg-slate-50 px-2 py-1 text-slate-600">{resource.category || "通用"}</span>
      </div>
    </button>
  )
}

function TradingDetailOverlay({
  item,
  onClose,
  onContact,
  currentUserId,
}: {
  item: MarketplaceItem
  onClose: () => void
  onContact: (item: MarketplaceItem) => void
  currentUserId?: string
}) {
  if (!item) return null
  const conditionMeta = CONDITIONS[item.condition] || {
    label: item.condition,
    className: "bg-slate-100 text-slate-600",
  }
  const sellerName = item.seller?.nickname || item.seller?.username || "卖家"
  const sellerId = item.seller?.id || (item as any).sellerId
  const isOwner = currentUserId && sellerId ? currentUserId === sellerId : false

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow-sm backdrop-blur hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-0 md:grid-cols-[1.25fr_1fr]">
          <div className="bg-slate-50 p-6 md:p-10">
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm aspect-[5/4] md:aspect-[16/11] min-h-[320px] md:min-h-[440px]">
              {item.images?.[0] ? (
                <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex min-h-[280px] items-center justify-center text-5xl text-slate-300">📦</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">REF: #{item.id}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${conditionMeta.className}`}>
                {conditionMeta.label}
              </span>
            </div>

            <h2 className="text-3xl font-bold leading-tight text-slate-900">{item.title}</h2>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-slate-900">¥{item.price}</span>
              {(item as any).originalPrice ? (
                <span className="text-lg text-slate-400 line-through">¥{(item as any).originalPrice}</span>
              ) : null}
            </div>

            <div className="text-sm text-slate-500">
              {item.location ? `地点：${item.location}` : "线下/邮寄皆可"} · {formatTime(item.createdAt)}
            </div>

            <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700">
              {item.description || "这是一个优质的物品，如需了解更多细节，请联系卖家。"}
            </p>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <Avatar
                src={item.seller?.avatar}
                alt={sellerName}
                username={sellerName}
                seed={item.seller?.id}
                size={44}
              />
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{sellerName}</div>
                <div className="text-xs text-slate-500">发布于 {formatTime(item.createdAt)}</div>
              </div>
              <Link
                to={`/marketplace/${item.id}`}
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                查看详情
              </Link>
            </div>

            <div className="mt-auto flex flex-wrap gap-3">
              {isOwner ? (
                <Link
                  to={`/marketplace/${item.id}`}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
                >
                  查看详情
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onContact(item)}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
                >
                  联系卖家
                </button>
              )}
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <Share className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StudyDetailOverlay({ item, onClose }: { item: StudyResource; onClose: () => void }) {
  if (!item) return null
  const meta = RESOURCE_TYPE_META[item.type] || RESOURCE_TYPE_META.OTHER

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow-sm backdrop-blur hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-0 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center bg-slate-50 p-8">
            <div className={`mb-6 flex h-24 w-24 items-center justify-center rounded-3xl shadow-sm ${meta.className}`}>
              {meta.icon}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
            <p className="text-sm text-slate-500">
              {item.category} {item.tags?.length ? `/ ${item.tags.join(" / ")}` : ""}
            </p>
          </div>

          <div className="flex flex-col gap-4 p-6 md:p-8">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Resource</div>
            <h3 className="text-2xl font-bold text-slate-900">{item.title}</h3>
            <p className="leading-relaxed text-slate-700">
              {item.description || "优质学习资料，点击下载/查看获取更多信息。"}
            </p>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Eye className="h-4 w-4 text-slate-400" />
              {formatNumber(item.viewCount || 0)} ·
              <Download className="ml-2 h-4 w-4 text-slate-400" />
              {formatNumber(item.downloadCount || 0)}
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <Avatar
                src={item.uploader?.avatar}
                alt={item.uploader?.nickname || item.uploader?.username || "贡献者"}
                username={item.uploader?.nickname || item.uploader?.username}
                seed={item.uploader?.id}
                size={44}
              />
              <div className="flex-1">
                <div className="font-semibold text-slate-900">
                  {item.uploader?.nickname || item.uploader?.username || "贡献者"}
                </div>
                <div className="text-xs text-slate-500">发布于 {formatTime(item.createdAt)}</div>
              </div>
              <Link
                to={`/study-resources/${item.id}`}
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                查看详情
              </Link>
            </div>

            <div className="mt-auto flex flex-wrap gap-3">
              <Link
                to={`/study-resources/${item.id}`}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
              >
                立即查看
              </Link>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <Share className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const [mainTab, setMainTab] = useState<MainTab>("secondhand")
  const [marketParams, setMarketParams] = useState<MarketplaceQueryParams>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    order: "desc",
  })
  const [studyParams, setStudyParams] = useState<ResourceQueryParams>({ page: 1, limit: 20 })
  const [searchText, setSearchText] = useState("")
  const [activeItem, setActiveItem] = useState<MarketplaceItem | null>(null)
  const [activeResource, setActiveResource] = useState<StudyResource | null>(null)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { showError } = useToast()

  const { data: secondhandData, isLoading: secondhandLoading } = useQuery({
    queryKey: ["marketplace", "items", marketParams],
    queryFn: () => marketplaceApi.getMarketplaceItems(marketParams),
    enabled: mainTab === "secondhand",
  })

  const { data: studyData, isLoading: studyLoading } = useQuery({
    queryKey: ["study-resources", studyParams],
    queryFn: () => studyResourceApi.getList(studyParams),
    enabled: mainTab === "study",
  })

  const marketplaceItems = Array.isArray(secondhandData?.data) ? secondhandData.data : []
  const studyList = Array.isArray(studyData?.data) ? studyData.data : []
  const keyword = searchText.toLowerCase()
  const getMeta = (payload: any) => (payload as any)?.meta || (payload as any)?.data?.meta
  const calcTotalPages = (meta: any) =>
    meta?.totalPages || (meta?.total && meta?.limit ? Math.ceil(meta.total / meta.limit) : undefined)
  const marketMeta = getMeta(secondhandData || {})
  const studyMeta = getMeta(studyData || {})
  const filteredStudyList =
    mainTab === "study" && searchText
      ? studyList.filter(
          (item) =>
            (item.title?.toLowerCase() || "").includes(keyword) ||
            (item.description?.toLowerCase() || "").includes(keyword),
        )
      : studyList
  const activeMeta = mainTab === "secondhand" ? marketMeta : studyMeta
  const totalPages = calcTotalPages(activeMeta)
  const currentPage = mainTab === "secondhand" ? marketParams.page || 1 : studyParams.page || 1

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (mainTab === "secondhand") {
      setMarketParams((prev) => ({
        ...prev,
        q: searchText ? searchText : undefined,
        page: 1,
      }))
    }
  }

  const handleContactSeller = async (item: MarketplaceItem) => {
    const sellerId = item.seller?.id || (item as any).sellerId
    if (!sellerId) {
      showError("未找到卖家信息")
      return
    }
    if (!user) {
      showError("请先登录再联系卖家")
      navigate("/login")
      return
    }
    try {
      const conversation = await messageApi.getOrCreateConversation({ participantId: sellerId })
      navigate(`/messages/${conversation.id}`)
    } catch {
      showError("打开私信失败，请稍后重试")
    }
  }

  const renderSortControls = () => (
    <div className="flex items-center gap-2">
      {[
        { key: "createdAt", label: "最新" },
        { key: "viewCount", label: "热度" },
        {
          key: "price",
          label: `价格${marketParams.sortBy === "price" ? (marketParams.order === "desc" ? " ↓" : " ↑") : ""}`,
        },
      ].map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() =>
            setMarketParams((prev) => ({
              ...prev,
              sortBy: item.key as MarketplaceQueryParams["sortBy"],
              order:
                prev.sortBy === item.key
                  ? prev.order === "desc"
                    ? "asc"
                    : "desc"
                  : item.key === "createdAt"
                  ? "desc"
                  : "desc",
              page: 1,
            }))
          }
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            marketParams.sortBy === item.key
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )

  const renderMarketplaceList = () => {
    if (secondhandLoading) {
      return <div className="py-12 text-center text-slate-500">加载中...</div>
    }
    if (!marketplaceItems.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-500">
          暂无商品
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {marketplaceItems.map((item: any) => (
          <MarketplaceCard key={item.id} item={item} onClick={setActiveItem} />
        ))}
      </div>
    )
  }

  const renderStudyList = () => {
    if (studyLoading) {
      return <div className="py-12 text-center text-slate-500">加载中...</div>
    }
    if (!filteredStudyList.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-500">
          暂无学习资源
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {filteredStudyList.map((item) => (
          <ResourceCard key={item.id} resource={item} onClick={setActiveResource} />
        ))}
      </div>
    )
  }

  const renderPagination = () => {
    if (!totalPages || totalPages <= 1) return null
    const go = (page: number) => {
      if (page < 1 || page > totalPages) return
      if (mainTab === "secondhand") {
        setMarketParams((prev) => ({ ...prev, page }))
      } else {
        setStudyParams((prev) => ({ ...prev, page }))
      }
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    return (
      <div className="mt-8 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => go(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`h-10 rounded-lg px-3 text-sm font-semibold transition ${
            currentPage <= 1 ? "bg-slate-100 text-slate-400" : "bg-white text-slate-700 hover:bg-blue-50"
          }`}
        >
          上一页
        </button>
        <span className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => go(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`h-10 rounded-lg px-3 text-sm font-semibold transition ${
            currentPage >= totalPages ? "bg-slate-100 text-slate-400" : "bg-white text-slate-700 hover:bg-blue-50"
          }`}
        >
          下一页
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {/* 顶部导航 + 筛选合并卡片 */}
        <div className="mb-6 space-y-3 rounded-2xl border border-blue-50 bg-gradient-to-r from-white via-white to-[#eef3ff] p-4 shadow-sm shadow-blue-50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-1 ring-1 ring-blue-100">
              {MAIN_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setMainTab(tab.key)
                    setActiveItem(null)
                    setActiveResource(null)
                  }}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                    mainTab === tab.key
                      ? "bg-white text-blue-700 shadow-sm shadow-blue-100"
                      : "text-slate-600 hover:text-blue-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSearch}
              className="flex flex-1 min-w-[240px] items-center gap-3 rounded-full border border-blue-100 bg-white px-4 py-2 shadow-inner shadow-blue-50"
            >
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索商品、资源、用户..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </form>

            <div className="flex items-center gap-2">
              <Link
                to={mainTab === "secondhand" ? "/marketplace/new" : "/study-resources/new"}
                className="inline-flex h-10 items-center rounded-full bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
              >
                发布
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-blue-50 bg-white/80 px-3 py-3 shadow-inner shadow-blue-50">
            {mainTab === "secondhand" ? (
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(CONDITIONS).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setMarketParams((prev) => ({
                        ...prev,
                        condition: prev.condition === key ? undefined : (key as ItemCondition),
                        page: 1,
                      }))
                    }
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      marketParams.condition === key
                        ? `${meta.className} shadow-sm`
                        : "bg-blue-50 text-slate-600 hover:bg-blue-100"
                    }`}
                  >
                    {meta.label}
                  </button>
                ))}
                <div className="ml-auto">{renderSortControls()}</div>
              </div>
            ) : (
              <div className="px-1 py-1 text-sm text-slate-500">精选学习资源</div>
            )}
          </div>
        </div>

        {/* 列表 */}
        {mainTab === "secondhand" ? renderMarketplaceList() : renderStudyList()}
        {renderPagination()}
      </div>

      {activeItem && (
        <TradingDetailOverlay
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onContact={handleContactSeller}
          currentUserId={user?.id}
        />
      )}
      {activeResource && <StudyDetailOverlay item={activeResource} onClose={() => setActiveResource(null)} />}
    </div>
  )
}
