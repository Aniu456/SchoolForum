/**
 * 内容审核管理页面
 * 注意：这是管理员功能，需要后端支持相应的审核 API
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi } from '@/api';
import { useToast } from '@/utils/toast-hook';
import { stripHtml } from '@/utils/helpers';
import type { Post, PostStatus } from '@/types';

export default function ModerationPage() {
  const [filter, setFilter] = useState<PostStatus>('PENDING');
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  // 获取待审核内容
  const { data, isLoading } = useQuery({
    queryKey: ['posts', 'moderation', filter],
    queryFn: () => postApi.getPosts({ status: filter, page: 1, limit: 50 } as any),
  });

  const posts = Array.isArray(data) ? data : data?.data || [];

  // 审核操作（需要后端支持）
  const approveMutation = useMutation({
    mutationFn: async (postId: string) => {
      // 这里需要调用后端的审核通过 API
      // 示例：await postApi.approvePost(postId);
      console.log('Approve post:', postId);
      throw new Error('需要后端实现审核 API');
    },
    onSuccess: () => {
      showSuccess('审核通过');
      queryClient.invalidateQueries({ queryKey: ['posts', 'moderation'] });
    },
    onError: () => {
      showError('操作失败');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (postId: string) => {
      // 这里需要调用后端的审核拒绝 API
      // 示例：await postApi.rejectPost(postId);
      console.log('Reject post:', postId);
      throw new Error('需要后端实现审核 API');
    },
    onSuccess: () => {
      showSuccess('已拒绝');
      queryClient.invalidateQueries({ queryKey: ['posts', 'moderation'] });
    },
    onError: () => {
      showError('操作失败');
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">🛡️ 内容审核</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">管理和审核用户发布的内容</p>
      </div>

      {/* 筛选标签 */}
      <div className="mb-6 flex gap-4 border-b">
        <button
          onClick={() => setFilter('PENDING')}
          className={`pb-3 px-4 font-semibold ${filter === 'PENDING' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          ⏳ 待审核
        </button>
        <button
          onClick={() => setFilter('PUBLISHED')}
          className={`pb-3 px-4 font-semibold ${filter === 'PUBLISHED' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          ✅ 已通过
        </button>
        <button
          onClick={() => setFilter('REJECTED')}
          className={`pb-3 px-4 font-semibold ${filter === 'REJECTED' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          ❌ 已拒绝
        </button>
      </div>

      {/* 内容列表 */}
      {isLoading ? (
        <div className="text-center py-12">加载中...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无内容</div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: Post) => (
            <div
              key={post.id}
              className="rounded-lg border bg-white p-6 shadow dark:bg-gray-900">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {post.title}
                  </h3>
                  <p className="mb-3 text-gray-600 dark:text-gray-400 line-clamp-3">
                    {stripHtml(post.content)}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>作者：{post.isAnonymous ? '匿名用户' : (post.author?.nickname || post.author?.username)}</span>
                    <span>发布时间：{new Date(post.createdAt).toLocaleString()}</span>
                    {post.status && (
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${
                        post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                        post.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        post.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {post.status === 'PUBLISHED' ? '已发布' :
                         post.status === 'PENDING' ? '待审核' :
                         post.status === 'REJECTED' ? '已拒绝' : '草稿'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 审核操作 */}
              {filter === 'PENDING' && (
                <div className="flex gap-3 border-t pt-4">
                  <button
                    onClick={() => approveMutation.mutate(post.id)}
                    disabled={approveMutation.isPending}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50">
                    ✅ 通过
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(post.id)}
                    disabled={rejectMutation.isPending}
                    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50">
                    ❌ 拒绝
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 说明 */}
      <div className="mt-8 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ <strong>注意：</strong>内容审核功能需要后端支持相应的审核 API。
          当前页面仅展示 UI，实际审核操作需要后端实现以下接口：
        </p>
        <ul className="mt-2 list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
          <li>POST /admin/posts/:id/approve - 审核通过</li>
          <li>POST /admin/posts/:id/reject - 审核拒绝</li>
          <li>GET /admin/posts?status=PENDING - 获取待审核内容</li>
        </ul>
      </div>
    </div>
  );
}

