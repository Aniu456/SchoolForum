/**
 * 二手交易市场 - 列表页
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { marketplaceApi, studyResourceApi } from '@/api';
import type { ItemCategory, ItemCondition, MarketplaceQueryParams } from '@/types';

const MAIN_TABS: { key: 'secondhand' | 'study'; label: string; category?: ItemCategory }[] = [
  { key: 'secondhand', label: '二手交易' },
  { key: 'study', label: '学习资源' },
];

const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: 'NEW', label: '全新' },
  { value: 'LIKE_NEW', label: '几乎全新' },
  { value: 'GOOD', label: '良好' },
  { value: 'FAIR', label: '一般' },
  { value: 'POOR', label: '较差' },
];

export default function MarketplacePage() {
  const [mainTab, setMainTab] = useState(MAIN_TABS[0]);
  const [params, setParams] = useState<MarketplaceQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    order: 'desc',
  });

  const { data: secondhandData, isLoading: secondhandLoading } = useQuery({
    queryKey: ['marketplace', 'items', params],
    queryFn: () => marketplaceApi.getMarketplaceItems(params),
    enabled: mainTab.key === 'secondhand',
  });

  const { data: studyData, isLoading: studyLoading } = useQuery({
    queryKey: ['study-resources', mainTab.key, params.page],
    queryFn: () => studyResourceApi.getList({ page: params.page, limit: params.limit }),
    enabled: mainTab.key === 'study',
  });

  // 防御性处理：确保 items 总是数组
  const items = secondhandData
    ? Array.isArray(secondhandData.data)
      ? secondhandData.data
      : Array.isArray(secondhandData)
        ? secondhandData
        : []
    : [];
  const studyList: any[] = Array.isArray((studyData as any)?.data)
    ? (studyData as any).data
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">🛒 交易平台</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">二手交易 / 学习资源，一站式浏览与发布</p>
          </div>
          <Link
            to="/marketplace/new"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
            发布商品
          </Link>
        </div>
        <div className="flex gap-3">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setMainTab(tab);
                setParams((prev) => ({
                  ...prev,
                  category: tab.category,
                  page: 1,
                }));
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mainTab.key === tab.key
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-gray-700 hover:bg-blue-50 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
                }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 筛选栏：仅二手交易时展示 */}
      {mainTab.key === 'secondhand' && (
        <div className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>筛选：</span>
              {CONDITIONS.map((cond) => (
                <button
                  key={cond.value}
                  onClick={() =>
                    setParams((prev) => ({
                      ...prev,
                      condition: prev.condition === cond.value ? undefined : cond.value,
                      page: 1,
                    }))
                  }
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${params.condition === cond.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-blue-900/40 dark:hover:text-blue-200'
                    }`}>
                  {cond.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>排序：</span>
              <button
                onClick={() =>
                  setParams((prev) => ({
                    ...prev,
                    sortBy: 'createdAt',
                    order: 'desc',
                    page: 1,
                  }))
                }
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${params.sortBy === 'createdAt'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-blue-900/40 dark:hover:text-blue-200'
                  }`}>
                最新
              </button>
              <button
                onClick={() =>
                  setParams((prev) => ({
                    ...prev,
                    sortBy: 'viewCount',
                    order: prev.order === 'desc' ? 'asc' : 'desc',
                    page: 1,
                  }))
                }
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${params.sortBy === 'viewCount'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-blue-900/40 dark:hover:text-blue-200'
                  }`}>
                热度{params.sortBy === 'viewCount' ? (params.order === 'desc' ? ' ↓' : ' ↑') : ''}
              </button>
              <button
                onClick={() =>
                  setParams((prev) => ({
                    ...prev,
                    sortBy: 'price',
                    order: prev.order === 'desc' ? 'asc' : 'desc',
                    page: 1,
                  }))
                }
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${params.sortBy === 'price'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-blue-900/40 dark:hover:text-blue-200'
                  }`}>
                价格{params.sortBy === 'price' ? (params.order === 'desc' ? ' ↓' : ' ↑') : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 列表区域 */}
      {mainTab.key === 'secondhand' ? (
        secondhandLoading ? (
          <div className="py-12 text-center">加载中...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-500">暂无商品</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/marketplace/${item.id}`}
                className="group rounded-lg border bg-white p-4 shadow transition-shadow hover:shadow-lg dark:bg-gray-900">
                <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-gray-100">
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                </div>
                <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900 dark:text-gray-100">
                  {item.title}
                </h3>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl font-bold text-red-600">¥{item.price}</span>
                  {item.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">¥{item.originalPrice}</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{CONDITIONS.find((c) => c.value === item.condition)?.label}</span>
                  <span> {item.viewCount}</span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : studyLoading ? (
        <div className="py-12 text-center">加载中...</div>
      ) : studyList.length === 0 ? (
        <div className="py-12 text-center text-gray-500">暂无学习资源</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {studyList.map((res) => (
            <Link
              key={res.id}
              to={`/study-resources/${res.id}`}
              className="rounded-lg border bg-white p-4 shadow transition hover:-translate-y-1 hover:shadow-md dark:bg-gray-900"
            >
              <div className="mb-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-200">
                {res.type || '资源'}
              </div>
              <h3 className="mb-1 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{res.title}</h3>
              <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{res.description}</p>
              <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                <span>{res.category || '通用'}</span>
                <span>{res.viewCount ? ` ${res.viewCount}` : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
