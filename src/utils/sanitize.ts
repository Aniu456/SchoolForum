import DOMPurify from "dompurify"

/**
 * HTML内容净化工具
 * 使用DOMPurify防止XSS攻击
 */

// 配置DOMPurify
const config = {
  // 允许的标签
  ALLOWED_TAGS: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "del",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "a",
    "img",
    "span",
    "div",
  ],

  // 允许的属性
  ALLOWED_ATTR: ["href", "title", "alt", "src", "width", "height", "class", "id", "style"],

  // 允许的协议
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,

  // 移除所有脚本
  FORBID_TAGS: ["script", "style", "meta", "link", "iframe", "object", "embed"],

  // 移除危险属性
  FORBID_ATTR: ["onclick", "onload", "onerror", "onmouseover", "onmouseout", "onfocus", "onblur"],

  // 保持空白字符
  KEEP_CONTENT: true,

  // 返回DOM字符串而不是DOM对象
  RETURN_DOM: false,

  // 返回可信的HTML
  RETURN_DOM_FRAGMENT: false,

  // 返回DOM导入的文档
  RETURN_DOM_IMPORT: false,
}

/**
 * 净化HTML内容
 * @param dirty - 需要净化的HTML字符串
 * @returns 净化后的安全HTML字符串
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof dirty !== "string") {
    return ""
  }

  return DOMPurify.sanitize(dirty, config)
}

/**
 * 净化并截取文本内容
 * @param dirty - 需要净化的HTML字符串
 * @param maxLength - 最大长度
 * @returns 净化并截取后的纯文本
 */
export function sanitizeText(dirty: string, maxLength?: number): string {
  const clean = sanitizeHtml(dirty)
  const text = clean.replace(/<[^>]*>/g, "") // 移除所有HTML标签

  if (maxLength && text.length > maxLength) {
    return text.substring(0, maxLength) + "..."
  }

  return text
}

/**
 * 检查内容是否安全
 * @param content - 需要检查的内容
 * @returns 是否安全
 */
export function isSafeContent(content: string): boolean {
  const sanitized = sanitizeHtml(content)
  return sanitized === content
}

/**
 * 净化用户输入的纯文本
 * @param input - 用户输入
 * @returns 净化后的文本
 */
export function sanitizeUserInput(input: string): string {
  if (typeof input !== "string") {
    return ""
  }

  // 对于纯文本输入，只转义HTML特殊字符
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

// 默认导出
export default sanitizeHtml
