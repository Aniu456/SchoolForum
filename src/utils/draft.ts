/**
 * 草稿管理工具
 */

export interface Draft {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  tags?: string[];
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

const DRAFTS_KEY = 'forum_drafts';

/**
 * 保存草稿
 */
export function saveDraft(draft: Draft): void {
  const drafts = getAllDrafts();
  const existingIndex = drafts.findIndex((d) => d.id === draft.id);

  const updatedDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    drafts[existingIndex] = updatedDraft;
  } else {
    drafts.push(updatedDraft);
  }

  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

/**
 * 获取单个草稿
 */
export function getDraft(id: string): Draft | null {
  const drafts = getAllDrafts();
  return drafts.find((d) => d.id === id) || null;
}

/**
 * 获取所有草稿
 */
export function getAllDrafts(): Draft[] {
  try {
    const data = localStorage.getItem(DRAFTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load drafts:', error);
    return [];
  }
}

/**
 * 删除草稿
 */
export function deleteDraft(id: string): void {
  const drafts = getAllDrafts();
  const filtered = drafts.filter((d) => d.id !== id);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
}

/**
 * 清空所有草稿
 */
export function clearAllDrafts(): void {
  localStorage.removeItem(DRAFTS_KEY);
}

/**
 * 创建新草稿
 */
export function createDraft(data: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>): Draft {
  const now = new Date().toISOString();
  const draft: Draft = {
    ...data,
    id: `draft_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    createdAt: now,
    updatedAt: now,
  };

  saveDraft(draft);
  return draft;
}
