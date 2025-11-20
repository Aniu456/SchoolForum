/**
 * 社团招新类型定义
 */

// 社团类型
export type ClubType = 
  | 'ACADEMIC'        // 学术科研
  | 'SPORTS'          // 体育运动
  | 'ARTS'            // 文艺表演
  | 'TECHNOLOGY'      // 科技创新
  | 'VOLUNTEER'       // 志愿公益
  | 'ENTREPRENEURSHIP' // 创业实践
  | 'CULTURE'         // 文化交流
  | 'OTHER';          // 其他

// 招新状态
export type RecruitmentStatus = 'OPEN' | 'CLOSED' | 'ENDED';

/**
 * 社团信息
 */
export interface Club {
  id: string;
  name: string;
  description: string;
  type: ClubType;
  logo?: string;
  coverImage?: string;
  foundedAt?: string;
  memberCount: number;
  contactInfo?: {
    email?: string;
    phone?: string;
    wechat?: string;
    qq?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * 社团招新信息
 */
export interface ClubRecruitment {
  id: string;
  clubId: string;
  club?: Club;
  title: string;
  description: string;
  requirements?: string;
  benefits?: string;
  positions: string[];
  recruitCount?: number;
  deadline?: string;
  status: RecruitmentStatus;
  contactInfo: {
    name: string;
    phone?: string;
    wechat?: string;
    qq?: string;
    email?: string;
  };
  images?: string[];
  viewCount: number;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建招新请求
 */
export interface CreateRecruitmentRequest {
  clubId?: string;
  clubName?: string;
  clubType?: ClubType;
  title: string;
  description: string;
  requirements?: string;
  benefits?: string;
  positions: string[];
  recruitCount?: number;
  deadline?: string;
  contactInfo: {
    name: string;
    phone?: string;
    wechat?: string;
    qq?: string;
    email?: string;
  };
  images?: string[];
}

/**
 * 更新招新请求
 */
export interface UpdateRecruitmentRequest {
  title?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  positions?: string[];
  recruitCount?: number;
  deadline?: string;
  status?: RecruitmentStatus;
  contactInfo?: {
    name?: string;
    phone?: string;
    wechat?: string;
    qq?: string;
    email?: string;
  };
  images?: string[];
}

/**
 * 招新查询参数
 */
export interface RecruitmentQueryParams {
  page?: number;
  limit?: number;
  clubType?: ClubType;
  status?: RecruitmentStatus;
  sortBy?: 'createdAt' | 'viewCount' | 'deadline';
  order?: 'asc' | 'desc';
  q?: string;
}

