import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { studyResourceApi } from '@/api';
import { Avatar, Badge, Button, EmptyState, LoadingState } from '@/components';
import { formatNumber, formatTime } from '@/utils/format';

const TYPE_LABELS: Record<string, string> = {
  DOCUMENT: '文档',
  VIDEO: '视频',
  LINK: '链接',
  CODE: '代码',
  OTHER: '其他',
};

export default function StudyResourceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['study-resource', id],
    queryFn: () => studyResourceApi.getDetail(id || ''),
    enabled: !!id,
  });

  if (!id) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState type="not-found" title="资源不存在" description="缺少资源 ID" showHomeButton />
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState message="加载资源中..." />;
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          type="error"
          title="加载失败"
          description="无法加载资源详情，请稍后重试"
          action={{ label: '重新加载', onClick: () => refetch() }}
          secondaryAction={{ label: '返回上一页', onClick: () => navigate(-1) }}
          showHomeButton
        />
      </div>
    );
  }

  const typeLabel = TYPE_LABELS[data.type] ?? data.type ?? '资源';
  const actionUrl = data.link || data.fileUrl;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Badge variant="success">{typeLabel}</Badge>
          {data.category && <Badge variant="primary">{data.category}</Badge>}
        </div>

        <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">{data.title}</h1>

        {data.tags?.length ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {data.tags.map((tag: string) => (
              <Badge key={tag} variant="default" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{data.description}</p>

        <div className="mt-6 grid gap-4 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
          <div>
            <span className="text-gray-500">浏览：</span>
            {formatNumber(data.viewCount || 0)}
          </div>
          <div>
            <span className="text-gray-500">下载：</span>
            {formatNumber(data.downloadCount || 0)}
          </div>
          <div>
            <span className="text-gray-500">发布：</span>
            {formatTime(data.createdAt)}
          </div>
          <div>
            <span className="text-gray-500">类型：</span>
            {typeLabel}
          </div>
        </div>

        {data.uploader && (
          <div className="mt-6 flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
            <Avatar
              src={data.uploader.avatar}
              alt={data.uploader.username}
              username={data.uploader.username}
              size={44}
              seed={data.uploader.id}
            />
            <div className="flex-1">
              <Link
                to={`/users/${data.uploader.id}`}
                className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
              >
                {data.uploader.nickname || data.uploader.username}
              </Link>
              <div className="text-xs text-gray-500 dark:text-gray-400">贡献者</div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {actionUrl && (
            <Button
              onClick={() => window.open(actionUrl, '_blank', 'noopener,noreferrer')}
              variant="primary"
            >
              查看 / 下载资源
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(-1)}>
            返回
          </Button>
        </div>
      </article>
    </div>
  );
}
