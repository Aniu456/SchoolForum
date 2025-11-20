/**
 * 失物招领 - 列表页
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { lostfoundApi } from '@/api';
import type { LostFoundType, LostFoundCategory, LostFoundQueryParams } from '@/types';

const CATEGORIES: { value: LostFoundCategory; label: string; icon: string }[] = [
  { value: 'ELECTRONICS', label: '电子产品', icon: '📱' },
  { value: 'DOCUMENTS', label: '证件文件', icon: '📄' },
  { value: 'KEYS', label: '钥匙', icon: '🔑' },
  { value: 'CARDS', label: '卡类', icon: '💳' },
  { value: 'BAGS', label: '包类', icon: '🎒' },
  { value: 'CLOTHING', label: '衣物', icon: '👕' },
  { value: 'BOOKS', label: '书籍', icon: '📚' },
  { value: 'ACCESSORIES', label: '配饰', icon: '⌚' },
  { value: 'OTHER', label: '其他', icon: '📦' },
];

export default function LostFoundPage() {
  const [activeTab, setActiveTab] = useState<LostFoundType>('LOST');
  const [params, setParams] = useState<LostFoundQueryParams>({
    page: 1,
    limit: 20,
    type: 'LOST',
    status: 'OPEN',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['lostfound', params],
    queryFn: () => lostfoundApi.getLostFoundItems(params),
  });

  const items = data?.data || [];

  const handleTabChange = (type: LostFoundType) => {
    setActiveTab(type);
    setParams({ ...params, type });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">🔍 失物招领</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">帮助失主找回失物</p>
        </div>
        <Link to="/lostfound/new" className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          发布信息
        </Link>
      </div>

      {/* 标签页 */}
      <div className="mb-6 flex gap-4 border-b">
        <button
          onClick={() => handleTabChange('LOST')}
          className={`pb-3 px-4 font-semibold ${activeTab === 'LOST' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          😢 我丢失了
        </button>
        <button
          onClick={() => handleTabChange('FOUND')}
          className={`pb-3 px-4 font-semibold ${activeTab === 'FOUND' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          😊 我捡到了
        </button>
      </div>

      {/* 分类筛选 */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setParams({ ...params, category: undefined })}
          className={`whitespace-nowrap rounded-full px-4 py-2 ${!params.category ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
          全部
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setParams({ ...params, category: cat.value })}
            className={`whitespace-nowrap rounded-full px-4 py-2 ${params.category === cat.value ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="text-center py-12">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无信息</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const catInfo = CATEGORIES.find(c => c.value === item.category);
            return (
              <Link
                key={item.id}
                to={`/lostfound/${item.id}`}
                className="block rounded-lg border bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-900">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{catInfo?.icon || '📦'}</div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${item.type === 'LOST' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {item.type === 'LOST' ? '寻物' : '招领'}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {item.title}
                      </h3>
                    </div>
                    <p className="mb-3 text-gray-600 dark:text-gray-400 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📍 {item.location}</span>
                      <span>📅 {new Date(item.lostOrFoundDate).toLocaleDateString()}</span>
                      <span>👁️ {item.viewCount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

