#!/usr/bin/env node

/**
 * 简化测试MCP功能
 */

import { articleApi } from '../dist/api/articles.js';

async function testSimpleMCP() {
  console.log('🚀 测试简化的MCP功能...\n');

  try {
    // 直接调用API获取文章
    const result = await articleApi.getArticleList({ limit: 5 });

    console.log('✅ API调用成功!');
    console.log(`📄 获取文章数量: ${result.articles.length}`);
    console.log(`🔄 游标: ${result.cursor}`);
    console.log(`📦 是否有更多: ${result.has_more}`);

    if (result.articles.length > 0) {
      console.log('\n📚 文章列表:');
      result.articles.forEach((article, index) => {
        const info = article.article_info;
        const author = article.author_user_info;

        console.log(`\n${index + 1}. ${info?.title || '无标题'}`);
        console.log(`   👤 作者: ${author?.user_name || '未知'}`);
        console.log(`   📊 数据: 👀${info?.view_count || 0} 👍${info?.digg_count || 0} 💬${info?.comment_count || 0}`);
        console.log(`   📅 发布: ${info?.rtime || '未知'}`);

        if (article.tags && article.tags.length > 0) {
          const tagNames = article.tags.map(tag => tag.tag_name).join(', ');
          console.log(`   🏷️ 标签: ${tagNames}`);
        }
      });

      // 模拟MCP返回格式
      const mcpResponse = {
        articles: result.articles.map(article => ({
          id: article.article_info?.article_id || '',
          title: article.article_info?.title || '无标题',
          brief: article.article_info?.brief_content || '',
          author: article.author_user_info?.user_name || '匿名用户',
          category: article.category?.category_name || '未分类',
          tags: (article.tags || []).map(tag => tag?.tag_name || ''),
          stats: {
            views: article.article_info?.view_count || 0,
            likes: article.article_info?.digg_count || 0,
            comments: article.article_info?.comment_count || 0,
            collects: article.article_info?.collect_count || 0,
          },
          publish_time: article.article_info?.rtime || '',
        })),
        total_count: result.articles.length,
        has_more: result.has_more,
        cursor: result.cursor,
      };

      console.log('\n🎯 MCP格式响应:');
      console.log(JSON.stringify(mcpResponse, null, 2));
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }

  process.exit(0);
}

// 运行测试
testSimpleMCP().catch(console.error); 
