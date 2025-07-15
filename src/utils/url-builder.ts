/**
 * 掘金URL构建工具
 * 用于生成掘金文章、沸点和用户的可访问URL
 */

/**
 * 掘金URL常量
 */
const JUEJIN_URLS = {
  BASE: 'https://juejin.cn',
  ARTICLE: 'https://juejin.cn/post'
} as const;

/**
 * 构建文章URL
 * @param articleId 文章ID
 * @returns 完整的文章URL
 */
export function buildArticleUrl(articleId: string): string {
  if (!articleId) {
    return '';
  }
  return `${JUEJIN_URLS.ARTICLE}/${articleId}`;
}

