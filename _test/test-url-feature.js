#!/usr/bin/env node

/**
 * 测试URL功能
 */

import { articleApi } from '../dist/api/articles.js';
import { buildArticleUrl } from '../dist/utils/url-builder.js';

async function testUrlFeature() {
  console.log('🔗 测试URL功能...\n');

  try {
    // 测试 URL 构建函数
    console.log('📋 测试URL构建函数:');
    const testId = '7514707341380796443';
    const testUrl = buildArticleUrl(testId);
    console.log(`- 文章ID: ${testId}`);
    console.log(`- 生成URL: ${testUrl}`);
    console.log(`- 预期格式: https://juejin.cn/post/${testId}`);
    console.log(`- 格式正确: ${testUrl === `https://juejin.cn/post/${testId}` ? '✅' : '❌'}\n`);

    // 测试获取文章列表并验证URL
    console.log('📚 测试文章列表URL:');
    const articles = await articleApi.getArticleList({ limit: 3 });
    
    if (articles.articles.length > 0) {
      const firstArticle = articles.articles[0];
      const articleId = firstArticle.article_info?.article_id;
      
      if (articleId) {
        const generatedUrl = buildArticleUrl(articleId);
        console.log(`- 第一篇文章: ${firstArticle.article_info?.title || '无标题'}`);
        console.log(`- 文章ID: ${articleId}`);
        console.log(`- 生成URL: ${generatedUrl}`);
        console.log(`- 可访问性: 点击链接应该能跳转到掘金文章页面`);
        console.log(`- URL格式: ${generatedUrl.startsWith('https://juejin.cn/post/') ? '✅' : '❌'}`);
      } else {
        console.log('❌ 文章ID为空，无法生成URL');
      }
    } else {
      console.log('❌ 没有获取到文章数据');
    }

    // 测试边界情况
    console.log('\n🧪 测试边界情况:');
    console.log(`- 空ID: "${buildArticleUrl('')}" (应该返回空字符串)`);
    console.log(`- null ID: "${buildArticleUrl(null)}" (应该返回空字符串)`);
    console.log(`- undefined ID: "${buildArticleUrl(undefined)}" (应该返回空字符串)`);

    console.log('\n🎉 URL功能测试完成！');
    
    // 显示使用示例
    console.log('\n📖 使用示例:');
    console.log('当AI助手返回文章列表时，每篇文章现在都会包含一个"url"字段：');
    console.log(JSON.stringify({
      "id": "7514707341380796443",
      "title": "示例文章标题",
      "author": "示例作者",
      "url": "https://juejin.cn/post/7514707341380796443",
      "stats": {
        "views": 1000,
        "likes": 50
      }
    }, null, 2));

    console.log('\n✨ 用户可以直接点击URL链接跳转到掘金文章页面！');
    
    // 正常退出
    process.exit(0);
    
  } catch (error) {
    console.error('❌ URL功能测试失败:', error);
    console.error('\n🔧 可能的原因:');
    console.error('1. 网络连接问题');
    console.error('2. API调用失败');
    console.error('3. 构建出错');
  }
}

// 运行测试
testUrlFeature().catch(error => {
  console.error('💥 测试脚本运行失败:', error);
  process.exit(1);
});
