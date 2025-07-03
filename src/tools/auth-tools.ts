import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getConfig, isAuthEnabled } from '../utils/config.js';
import { apiClient } from '../api/base.js';

/**
 * 授权相关MCP工具
 * 需要用户登录状态的操作
 */
export const authTools: Tool[] = [
  {
    name: 'like_article',
    description: '点赞文章（需要授权）',
    inputSchema: {
      type: 'object',
      properties: {
        article_id: {
          type: 'string',
          description: '文章ID',
        },
      },
      required: ['article_id'],
    },
  },
  {
    name: 'like_pin',
    description: '点赞沸点（需要授权）',
    inputSchema: {
      type: 'object',
      properties: {
        pin_id: {
          type: 'string',
          description: '沸点ID',
        },
      },
      required: ['pin_id'],
    },
  },
  {
    name: 'collect_article',
    description: '收藏文章（需要授权）',
    inputSchema: {
      type: 'object',
      properties: {
        article_id: {
          type: 'string',
          description: '文章ID',
        },
      },
      required: ['article_id'],
    },
  },
  {
    name: 'follow_user',
    description: '关注用户（需要授权）',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: '用户ID',
        },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'get_user_profile',
    description: '获取当前用户信息（需要授权）',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'check_auth_status',
    description: '检查授权状态',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * 授权工具处理器
 */
export class AuthToolHandler {
  private config = getConfig();

  /**
   * 检查授权状态
   */
  async handleCheckAuthStatus(_args: any) {
    try {
      const authEnabled = isAuthEnabled(this.config);
      const hasCookie = !!this.config.auth.cookie;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                auth_enabled: authEnabled,
                has_cookie: hasCookie,
                auth_features_available: authEnabled,
                message: authEnabled
                  ? '授权已启用，可以使用需要登录的功能'
                  : '授权未启用，仅可使用公开API功能',
                available_auth_tools: authEnabled
                  ? [
                      'like_article',
                      'like_pin',
                      'collect_article',
                      'follow_user',
                      'get_user_profile',
                    ]
                  : [],
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `检查授权状态失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 点赞文章
   */
  async handleLikeArticle(args: any) {
    if (!isAuthEnabled(this.config)) {
      return this.authRequiredResponse();
    }

    try {
      const { article_id } = args;

      const response = await apiClient.post('/interact_api/v1/digg/save', {
        item_id: article_id,
        item_type: 2, // 文章类型
        client_type: 2608,
      });

      return {
        content: [
          {
            type: 'text',
            text: `文章点赞${response.err_no === 0 ? '成功' : '失败'}: ${response.err_msg}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `点赞文章失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 点赞沸点
   */
  async handleLikePin(args: any) {
    if (!isAuthEnabled(this.config)) {
      return this.authRequiredResponse();
    }

    try {
      const { pin_id } = args;

      const response = await apiClient.post('/interact_api/v1/digg/save', {
        item_id: pin_id,
        item_type: 4, // 沸点类型
        client_type: 2608,
      });

      return {
        content: [
          {
            type: 'text',
            text: `沸点点赞${response.err_no === 0 ? '成功' : '失败'}: ${response.err_msg}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `点赞沸点失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 收藏文章
   */
  async handleCollectArticle(args: any) {
    if (!isAuthEnabled(this.config)) {
      return this.authRequiredResponse();
    }

    try {
      const { article_id } = args;

      const response = await apiClient.post('/interact_api/v1/collectionSet/addArticle', {
        article_id,
      });

      return {
        content: [
          {
            type: 'text',
            text: `文章收藏${response.err_no === 0 ? '成功' : '失败'}: ${response.err_msg}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `收藏文章失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 关注用户
   */
  async handleFollowUser(args: any) {
    if (!isAuthEnabled(this.config)) {
      return this.authRequiredResponse();
    }

    try {
      const { user_id } = args;

      const response = await apiClient.post('/interact_api/v1/follow/save', {
        id: user_id,
        type: 1, // 用户类型
      });

      return {
        content: [
          {
            type: 'text',
            text: `用户关注${response.err_no === 0 ? '成功' : '失败'}: ${response.err_msg}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `关注用户失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 获取当前用户信息
   */
  async handleGetUserProfile(_args: any) {
    if (!isAuthEnabled(this.config)) {
      return this.authRequiredResponse();
    }

    try {
      const response = await apiClient.get('/user_api/v1/user/get');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                user_info: response.data,
                message: '用户信息获取成功',
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取用户信息失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 授权要求响应
   */
  private authRequiredResponse() {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: '此功能需要授权',
              message: '请设置JUEJIN_COOKIE环境变量并启用授权功能',
              instructions: [
                '1. 登录掘金网站',
                '2. 打开浏览器开发者工具',
                '3. 在Network标签页中找到任意请求',
                '4. 复制Cookie头的值',
                '5. 设置环境变量JUEJIN_COOKIE',
                '6. 设置JUEJIN_ENABLE_AUTH=true',
              ],
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
}

// 导出工具处理器实例
export const authToolHandler = new AuthToolHandler();
