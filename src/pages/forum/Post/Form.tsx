'use client';

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCreatePost, useUpdatePost, usePost } from '@/hooks/usePosts';
import { useToast } from '@/utils/toast-hook';
import { useAuthStore } from '@/store/useAuthStore';
import { LoadingState, RichTextEditor, Button } from '@/components';
import { saveDraft, deleteDraft, getDraft } from '@/utils/draft';
import { addActivity } from '@/utils/activity';
import type { CreatePostRequest } from '@/types';

export default function PostFormPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();
  const { user } = useAuthStore();

  // 判断是编辑还是新建
  const postId = params.id;
  const isEdit = !!postId;
  const draftId = searchParams.get('draft');

  const { data: post, isLoading: postLoading } = usePost(postId || '');
  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePost();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载草稿或帖子数据
  useEffect(() => {
    if (draftId) {
      const draft = getDraft(draftId);
      if (draft) {
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setCategory(draft.categoryId || '');
        setTags(draft.tags?.join(', ') || '');
        setCoverImage(draft.coverImage || '');
      }
    } else if (post && isEdit) {
      setTitle(post.title);
      setContent(post.content);
      setCategory(post.categoryId || '');
      setTags(post.tags?.join(', ') || '');
    }
  }, [draftId, post, isEdit]);

  if (!user) {
    navigate('/login');
    return null;
  }

  if (isEdit && postLoading) {
    return <LoadingState message="加载中..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showError('请输入标题');
      return;
    }

    if (!content.trim()) {
      showError('请输入内容');
      return;
    }

    setIsSubmitting(true);

    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const postData: CreatePostRequest = {
        title: title.trim(),
        content: content.trim(),
        tags: tagsArray,
      };

      if (isEdit && postId) {
        await updatePostMutation.mutateAsync({
          id: postId,
          updates: postData,
        });
        showSuccess('帖子更新成功！');
      } else {
        await createPostMutation.mutateAsync(postData);

        // 记录活动
        addActivity({
          userId: user.id,
          type: 'post',
          targetId: 'new_post',
          targetTitle: title.trim(),
        });

        // 删除草稿（如果有）
        if (draftId) {
          deleteDraft(draftId);
        }

        showSuccess('帖子发布成功！');
      }

      navigate(isEdit ? `/posts/${postId}` : '/');
    } catch {
      showError(isEdit ? '更新失败，请重试' : '发布失败，请重试');
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    const draft = {
      id: draftId || `draft_${Date.now()}`,
      title,
      content,
      categoryId: category,
      tags: tags.split(',').map((tag) => tag.trim()).filter((tag) => tag),
      coverImage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveDraft(draft);
    showSuccess('草稿已保存');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? '编辑帖子' : '发布新帖子'}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {isEdit ? '更新你的帖子内容' : '分享你的想法和见解'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 标题 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="请输入帖子标题"
            maxLength={100}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{title.length}/100</p>
        </div>

        {/* 内容 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            内容 <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="写下你的想法..."
            className="mt-2 min-h-[400px]"
          />
        </div>

        {/* 标签 */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            标签
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="输入标签，用逗号分隔"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">例如：技术, 分享, 经验</p>
        </div>

        {/* 封面图片 */}
        <div>
          <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            封面图片 URL
          </label>
          <input
            type="url"
            id="coverImage"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-800">
          {!isEdit && (
            <Button type="button" variant="outline" onClick={handleSaveDraft}>
              保存草稿
            </Button>
          )}
          <div className={`flex gap-4 ${isEdit ? 'w-full justify-end' : ''}`}>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting} variant="primary">
              {isSubmitting ? (isEdit ? '更新中...' : '发布中...') : (isEdit ? '更新帖子' : '发布帖子')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

