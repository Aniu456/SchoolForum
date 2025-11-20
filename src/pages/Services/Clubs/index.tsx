/**
 * 社团招新 - 列表页
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clubsApi } from '@/api';
import type { ClubType, RecruitmentQueryParams } from '@/types';

const CLUB_TYPES: { value: ClubType; label: string; icon: string }[] = [
  { value: 'ACADEMIC', label: '学术科研', icon: '🔬' },
  { value: 'SPORTS', label: '体育运动', icon: '⚽' },
  { value: 'ARTS', label: '文艺表演', icon: '🎭' },
  { value: 'TECHNOLOGY', label: '科技创新', icon: '💻' },
  { value: 'VOLUNTEER', label: '志愿公益', icon: '❤️' },
  { value: 'ENTREPRENEURSHIP', label: '创业实践', icon: '💼' },
  { value: 'CULTURE', label: '文化交流', icon: '🌍' },
  { value: 'OTHER', label: '其他', icon: '📦' },
];

export default function ClubsPage() {
  const [params, setParams] = useState<RecruitmentQueryParams>({
    page: 1,
    limit: 20,
    status: 'OPEN',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['clubs', 'recruitments', params],
    queryFn: () => clubsApi.getRecruitments(params),
  });

  const recruitments = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">🎭 社团招新</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">发现有趣的社团，结识志同道合的朋友</p>
        </div>
        <Link to="/clubs/new" className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          发布招新
        </Link>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setParams({ ...params, clubType: undefined })}
          className={`whitespace-nowrap rounded-full px-4 py-2 ${!params.clubType ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
          全部
        </button>
        {CLUB_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setParams({ ...params, clubType: type.value })}
            className={`whitespace-nowrap rounded-full px-4 py-2 ${params.clubType === type.value ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
            {type.icon} {type.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12">加载中...</div>
      ) : recruitments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无招新信息</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recruitments.map((recruitment) => (
            <Link
              key={recruitment.id}
              to={`/clubs/recruitments/${recruitment.id}`}
              className="rounded-lg border bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-900">
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                {recruitment.title}
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400 line-clamp-3">
                {recruitment.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>👁️ {recruitment.viewCount}</span>
                <span>📝 {recruitment.applicationCount} 人申请</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

