/**
 * 学习资源分享类型定义
 */

// 资源类型
export type ResourceType = 
  | 'COURSE_NOTES'    // 课程笔记
  | 'EXAM_MATERIALS'  // 考试资料
  | 'TEXTBOOK'        // 教材电子版
  | 'VIDEO'           // 视频教程
  | 'SOFTWARE'        // 软件工具
  | 'TEMPLATE'        // 模板文档
  | 'OTHER';          // 其他

// 资源状态
export type ResourceStatus = 'PUBLISHED' | 'PENDING' | 'REJECTED' | 'REMOVED';

// 学科分类
export type SubjectCategory = 
  | 'COMPUTER_SCIENCE'
  | 'MATHEMATICS'
  | 'PHYSICS'
  | 'CHEMISTRY'
  | 'BIOLOGY'
  | 'LITERATURE'
  | 'HISTORY'
  | 'ECONOMICS'
  | 'MANAGEMENT'
  | 'ENGINEERING'
  | 'ARTS'
  | 'LANGUAGE'
  | 'OTHER';

/**
 * 学习资源
 */
export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  subject: SubjectCategory;
  tags: string[];
  fileUrl?: string;
  fileSize?: number;
  fileName?: string;
  externalUrl?: string;
  coverImage?: string;
  status: ResourceStatus;
  isAnonymous: boolean;
  authorId: string;
  author?: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
  };
  downloadCount: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建资源请求
 */
export interface CreateResourceRequest {
  title: string;
  description: string;
  type: ResourceType;
  subject: SubjectCategory;
  tags?: string[];
  fileUrl?: string;
  externalUrl?: string;
  coverImage?: string;
  isAnonymous?: boolean;
}

/**
 * 更新资源请求
 */
export interface UpdateResourceRequest {
  title?: string;
  description?: string;
  type?: ResourceType;
  subject?: SubjectCategory;
  tags?: string[];
  fileUrl?: string;
  externalUrl?: string;
  coverImage?: string;
}

/**
 * 资源查询参数
 */
export interface ResourceQueryParams {
  page?: number;
  limit?: number;
  type?: ResourceType;
  subject?: SubjectCategory;
  tag?: string;
  status?: ResourceStatus;
  sortBy?: 'createdAt' | 'downloadCount' | 'likeCount';
  order?: 'asc' | 'desc';
  q?: string;
}

