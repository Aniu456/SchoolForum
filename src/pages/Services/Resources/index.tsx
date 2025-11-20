/**
 * 学习资源分享 - 列表页
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { resourcesApi } from '@/api';
import type { ResourceType, SubjectCategory, ResourceQueryParams } from '@/types';

const RESOURCE_TYPES: { value: ResourceType; label: string; icon: string }[] = [
  { value: 'COURSE_NOTES', label: '课程笔记', icon: '📝' },
  { value: 'EXAM_MATERIALS', label: '考试资料', icon: '📚' },
  { value: 'TEXTBOOK', label: '教材电子版', icon: '📖' },
  { value: 'VIDEO', label: '视频教程', icon: '🎥' },
  { value: 'SOFTWARE', label: '软件工具', icon: '💻' },
  { value: 'TEMPLATE', label: '模板文档', icon: '📄' },
  { value: 'OTHER', label: '其他', icon: '📦' },
];

const SUBJECTS: { value: SubjectCategory; label: string }[] = [
  { value: 'COMPUTER_SCIENCE', label: '计算机' },
  { value: 'MATHEMATICS', label: '数学' },
  { value: 'PHYSICS', label: '物理' },
  { value: 'CHEMISTRY', label: '化学' },
  { value: 'BIOLOGY', label: '生物' },
  { value: 'LITERATURE', label: '文学' },
  { value: 'HISTORY', label: '历史' },
  { value: 'ECONOMICS', label: '经济' },
  { value: 'MANAGEMENT', label: '管理' },
  { value: 'ENGINEERING', label: '工程' },
  { value: 'ARTS', label: '艺术' },
  { value: 'LANGUAGE', label: '语言' },
  { value: 'OTHER', label: '其他' },
];

export default function ResourcesPage() {
  const [params, setParams] = useState<ResourceQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    order: 'desc',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['resources', params],
    queryFn: () => resourcesApi.getResources(params),
  });

  const resources = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">📚 学习资源</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">分享学习资料，共同进步</p>
        </div>
        <Link
          to="/resources/new"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          分享资源
        </Link>
      </div>

      {/* 筛选栏 */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <select
            className="rounded-lg border p-2"
            value={params.type || ''}
            onChange={(e) => setParams({ ...params, type: e.target.value as ResourceType || undefined })}>
            <option value="">全部类型</option>
            {RESOURCE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
            ))}
          </select>

          <select
            className="rounded-lg border p-2"
            value={params.subject || ''}
            onChange={(e) => setParams({ ...params, subject: e.target.value as SubjectCategory || undefined })}>
            <option value="">全部学科</option>
            {SUBJECTS.map((subject) => (
              <option key={subject.value} value={subject.value}>{subject.label}</option>
            ))}
          </select>

          <select
            className="rounded-lg border p-2"
            value={params.sortBy || 'createdAt'}
            onChange={(e) => setParams({ ...params, sortBy: e.target.value as any })}>
            <option value="createdAt">最新发布</option>
            <option value="downloadCount">下载量</option>
            <option value="likeCount">点赞数</option>
          </select>
        </div>
      </div>

      {/* 资源列表 */}
      {isLoading ? (
        <div className="text-center py-12">加载中...</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无资源</div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => {
            const typeInfo = RESOURCE_TYPES.find(t => t.value === resource.type);
            const subjectInfo = SUBJECTS.find(s => s.value === resource.subject);
            
            return (
              <Link
                key={resource.id}
                to={`/resources/${resource.id}`}
                className="block rounded-lg border bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-900">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{typeInfo?.icon || '📦'}</div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {resource.title}
                    </h3>
                    <p className="mb-3 text-gray-600 dark:text-gray-400 line-clamp-2">
                      {resource.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="rounded bg-blue-100 px-2 py-1 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {subjectInfo?.label}
                      </span>
                      <span>📥 {resource.downloadCount} 下载</span>
                      <span>👁️ {resource.viewCount} 浏览</span>
                      <span>👍 {resource.likeCount} 点赞</span>
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

