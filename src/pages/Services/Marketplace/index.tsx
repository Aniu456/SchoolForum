/**
 * 二手交易市场 - 列表页
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { marketplaceApi } from '@/api';
import type { ItemCategory, ItemCondition, MarketplaceQueryParams } from '@/types';

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'ELECTRONICS', label: '电子产品' },
  { value: 'BOOKS', label: '书籍教材' },
  { value: 'CLOTHING', label: '服装配饰' },
  { value: 'SPORTS', label: '运动器材' },
  { value: 'FURNITURE', label: '家具用品' },
  { value: 'STATIONERY', label: '文具用品' },
  { value: 'DAILY', label: '日用品' },
  { value: 'OTHER', label: '其他' },
];

const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: 'NEW', label: '全新' },
  { value: 'LIKE_NEW', label: '几乎全新' },
  { value: 'GOOD', label: '良好' },
  { value: 'FAIR', label: '一般' },
  { value: 'POOR', label: '较差' },
];

export default function MarketplacePage() {
  const [params, setParams] = useState<MarketplaceQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    order: 'desc',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace', params],
    queryFn: () => marketplaceApi.getMarketplaceItems(params),
  });

  const items = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">🛒 二手交易</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">校园闲置物品交易平台</p>
        </div>
        <Link
          to="/marketplace/new"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          发布商品
        </Link>
      </div>

      {/* 筛选栏 */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <select
            className="rounded-lg border p-2"
            value={params.category || ''}
            onChange={(e) => setParams({ ...params, category: e.target.value as ItemCategory || undefined })}>
            <option value="">全部分类</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            className="rounded-lg border p-2"
            value={params.condition || ''}
            onChange={(e) => setParams({ ...params, condition: e.target.value as ItemCondition || undefined })}>
            <option value="">全部成色</option>
            {CONDITIONS.map((cond) => (
              <option key={cond.value} value={cond.value}>{cond.label}</option>
            ))}
          </select>

          <select
            className="rounded-lg border p-2"
            value={params.sortBy || 'createdAt'}
            onChange={(e) => setParams({ ...params, sortBy: e.target.value as any })}>
            <option value="createdAt">最新发布</option>
            <option value="price">价格</option>
            <option value="viewCount">浏览量</option>
          </select>

          <select
            className="rounded-lg border p-2"
            value={params.order || 'desc'}
            onChange={(e) => setParams({ ...params, order: e.target.value as 'asc' | 'desc' })}>
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </div>
      </div>

      {/* 商品列表 */}
      {isLoading ? (
        <div className="text-center py-12">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无商品</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/marketplace/${item.id}`}
              className="group rounded-lg border bg-white p-4 shadow transition-shadow hover:shadow-lg dark:bg-gray-900">
              {/* 商品图片 */}
              <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-gray-100">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
              </div>

              {/* 商品信息 */}
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                {item.title}
              </h3>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600">¥{item.price}</span>
                {item.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">¥{item.originalPrice}</span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{CONDITIONS.find(c => c.value === item.condition)?.label}</span>
                <span>👁️ {item.viewCount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

