#!/usr/bin/env node

/**
 * 调试掘金API数据结构
 */

import { articleApi } from '../dist/api/articles.js';

async function debugAPI() {
  console.log('🔍 开始调试掘金API数据结构...\n');

  try {
    // 测试获取文章列表
    console.log('📄 测试获取文章列表...');
    const articles = await articleApi.getArticleList({ limit: 5 });

    console.log('✅ API响应结构:');
    console.log(`- 文章数量: ${articles.articles.length}`);
    console.log(`- 游标: ${articles.cursor}`);
    console.log(`- 是否有更多: ${articles.has_more}`);

    if (articles.articles.length > 0) {
      const firstArticle = articles.articles[0];
      console.log('\n📋 第一篇文章数据结构:');
      console.log(`- item_type: ${firstArticle.item_type}`);
      console.log(`- 是否有article_info: ${!!firstArticle.article_info}`);
      console.log(`- 是否有author_user_info: ${!!firstArticle.author_user_info}`);

      if (firstArticle.article_info) {
        console.log(`- 文章ID: ${firstArticle.article_info.article_id || 'N/A'}`);
        console.log(`- 标题: ${firstArticle.article_info.title || 'N/A'}`);
        console.log(`- 阅读量: ${firstArticle.article_info.view_count || 0}`);
        console.log(`- 点赞量: ${firstArticle.article_info.digg_count || 0}`);
      }

      if (firstArticle.author_user_info) {
        console.log(`- 作者: ${firstArticle.author_user_info.user_name || 'N/A'}`);
        console.log(`- 粉丝数: ${firstArticle.author_user_info.follower_count || 0}`);
      }

      console.log('\n🔍 完整数据结构预览:');
      console.log(JSON.stringify(firstArticle, null, 2).substring(0, 500) + '...');
    }

    // 测试搜索功能
    console.log('\n🔍 测试搜索功能...');
    const searchResults = await articleApi.searchArticles('React', 3);
    console.log(`✅ 搜索结果数量: ${searchResults.articles.length}`);

    if (searchResults.articles.length > 0) {
      const firstResult = searchResults.articles[0];
      console.log(`- 第一个结果标题: ${firstResult.article_info?.title || 'N/A'}`);
    }

    // 测试热门文章
    console.log('\n🔥 测试热门文章...');
    const hotArticles = await articleApi.getHotArticles(7, 3);
    console.log(`✅ 热门文章数量: ${hotArticles.articles.length}`);

    if (hotArticles.articles.length > 0) {
      const firstHot = hotArticles.articles[0];
      console.log(`- 第一篇热门文章: ${firstHot.article_info?.title || 'N/A'}`);
      console.log(`- 热度指数: ${firstHot.article_info?.hot_index || 0}`);
    }

    console.log('\n🎉 API调试完成！所有接口正常工作。');
    process.exit(0);

  } catch (error) {
    console.error('❌ API调试失败:', error);
    console.error('\n🔧 可能的原因:');
    console.error('1. 网络连接问题');
    console.error('2. 掘金API结构变化');
    console.error('3. 请求频率限制');
    console.error('4. 数据结构不匹配');

    if (error.response) {
      console.error('\n📡 HTTP响应信息:');
      console.error(`- 状态码: ${error.response.status}`);
      console.error(`- 响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// 运行调试
debugAPI().catch(error => {
  console.error('💥 调试脚本运行失败:', error);
  process.exit(1);
});
