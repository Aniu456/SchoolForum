import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { studyResourceApi } from '@/api';
import { Card, Button, Loading, EmptyState } from '@/components';

export default function StudyResourcesPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['study-resources', { category, type, page }],
    queryFn: () =>
      studyResourceApi.getList({
        category: category || undefined,
        type: (type || undefined) as any,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <Loading />;

  const resources = data?.data || [];
  const meta: any = (data as any)?.meta;
  const totalPages = meta?.totalPages || (meta?.total && meta?.limit ? Math.ceil(meta.total / meta.limit) : 1);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">学习资源</h1>
        <Button onClick={() => navigate('/study-resources/new')}>
          + 发布资源
        </Button>
      </div>

      {/* 筛选 */}
      <div className="mb-6 flex gap-4">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded border px-4 py-2"
        >
          <option value="">所有分类</option>
          <option value="算法">算法</option>
          <option value="前端">前端</option>
          <option value="后端">后端</option>
          <option value="数据库">数据库</option>
        </select>

        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="rounded border px-4 py-2"
        >
          <option value="">所有类型</option>
          <option value="DOCUMENT">文档</option>
          <option value="VIDEO">视频</option>
          <option value="LINK">链接</option>
          <option value="CODE">代码</option>
          <option value="OTHER">其他</option>
        </select>
      </div>

      {resources.length === 0 ? (
        <EmptyState title="暂无学习资源" description="快去发布一条学习资源吧~" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className="cursor-pointer hover:shadow-lg"
              onClick={() => navigate(`/study-resources/${resource.id}`)}
            >
              <h3 className="mb-2 text-lg font-semibold">{resource.title}</h3>
              <p className="mb-4 text-sm text-gray-600">{resource.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{resource.category}</span>
                <span>{resource.viewCount} 浏览</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-gray-600">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </Button>
          <span>
            第 {page} / {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
