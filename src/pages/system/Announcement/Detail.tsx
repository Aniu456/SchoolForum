import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { announcementApi, AnnouncementPriority } from '@/api/content/announcement';
import { Loading, Button } from '@/components';

export default function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['announcement', id],
    queryFn: () => announcementApi.getAnnouncement(id!),
    enabled: !!id,
  });

  const announcement = data?.data;

  const getPriorityStyle = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'LOW':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPriorityLabel = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'URGENT':
        return '紧急';
      case 'HIGH':
        return '重要';
      case 'NORMAL':
        return '普通';
      case 'LOW':
        return '一般';
      default:
        return '公告';
    }
  };

  if (isLoading) return <Loading />;

  if (!announcement) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">公告不存在</h2>
          <Button onClick={() => navigate('/')} className="mt-4">
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* 返回按钮 */}
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          ← 返回
        </Button>

        {/* 公告卡片 */}
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
          {/* 优先级标签 */}
          <div className="mb-4">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getPriorityStyle(announcement.priority)}`}
            >
              📢 {getPriorityLabel(announcement.priority)}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {announcement.title}
          </h1>

          {/* 元信息 */}
          <div className="mb-8 flex items-center gap-4 border-b border-gray-200 pb-4 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {announcement.author.avatar && (
                <img
                  src={announcement.author.avatar}
                  alt={announcement.author.nickname}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {announcement.author.nickname}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  @{announcement.author.username}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              发布于 {new Date(announcement.createdAt).toLocaleString()}
            </div>
          </div>

          {/* 正文内容 */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {announcement.content}
            </div>
          </div>

          {/* 更新时间 */}
          {announcement.updatedAt !== announcement.createdAt && (
            <div className="mt-8 border-t border-gray-200 pt-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-500">
              最后更新于 {new Date(announcement.updatedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
