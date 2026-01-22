/**
 * 验证码相关类型定义
 */

// ============================================
// 验证码类型
// ============================================

/**
 * 验证码类型枚举
 */
export type VerificationCodeType = "REGISTER" | "RESET_PASSWORD" | "CHANGE_EMAIL"

/**
 * 验证码
 */
export interface VerificationCode {
  id: string
  userId?: string // 可为空（注册时还没有用户ID）
  email: string
  code: string
  type: VerificationCodeType
  isUsed: boolean
  expiresAt: string
  createdAt: string
  user?: {
    id: string
    username: string
    email: string
  }
}

// ============================================
// 请求 DTO 类型
// ============================================

/**
 * 发送验证码请求
 */
export interface SendVerificationCodeRequest {
  email: string
  type: VerificationCodeType
}

/**
 * 验证验证码请求
 */
export interface VerifyCodeRequest {
  email: string
  code: string
  type: VerificationCodeType
}

/**
 * 验证码响应
 */
export interface VerificationCodeResponse {
  valid: boolean
  message?: string
  temporaryToken?: string // 用于重置密码等操作的临时令牌
}
