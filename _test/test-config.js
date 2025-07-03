/**
 * 测试配置文件
 * 统一管理测试相关的配置和常量
 */

export const TEST_CONFIG = {
  // API测试配置
  api: {
    timeout: 10000,
    retryAttempts: 3,
    maxConcurrentRequests: 5,
    testDataLimits: {
      articles: 5,
      pins: 5,
      recommendations: 3
    }
  },

  // 测试数据
  testData: {
    keywords: ['JavaScript', 'React', 'Vue', 'TypeScript', 'Node.js'],
    categories: ['前端', '后端', 'Android', 'iOS', 'AI'],
    userInterests: ['前端开发', 'React', 'Vue.js', 'TypeScript'],
    sampleArticleIds: [
      '7124564780068634632',
      '7113746508096208909',
      '7113743857841340447'
    ],
    sampleUserIds: [
      '1556564194374926',
      '61228381386487',
      '2612095355996743'
    ]
  },

  // 性能基准
  performance: {
    maxResponseTime: 5000, // 5秒
    maxConcurrentTime: 10000, // 10秒
    minSuccessRate: 80, // 80%
    cacheHitRateThreshold: 50 // 50%
  },

  // 测试环境
  environment: {
    skipAuthTests: !process.env.JUEJIN_COOKIE,
    enablePerformanceTests: true,
    enableStressTests: false,
    logLevel: process.env.TEST_LOG_LEVEL || 'info'
  },

  // 错误处理
  errorHandling: {
    continueOnFailure: true,
    maxFailuresBeforeStop: 10,
    retryFailedTests: false
  }
};

/**
 * 测试工具分类
 */
export const TOOL_CATEGORIES = {
  article: [
    'get_articles',
    'search_articles', 
    'get_article_recommendations',
    'analyze_article_quality',
    'get_trending_articles'
  ],
  pin: [
    'get_pins',
    'search_pins',
    'get_pin_recommendations', 
    'analyze_pin_trends',
    'get_hot_topics'
  ],
  analytics: [
    'analyze_content_trends',
    'compare_content_performance',
    'get_trend_analysis',
    'analyze_user_behavior',
    'get_content_insights',
    'generate_analytics_report'
  ],
  recommendation: [
    'get_recommendations',
    'get_user_recommendations',
    'generate_user_report',
    'update_recommendations',
    'get_trending_recommendations'
  ],
  performance: [
    'get_performance_stats',
    'get_cache_stats',
    'get_system_health',
    'optimize_performance',
    'run_performance_benchmark'
  ],
  auth: [
    'check_auth_status',
    'like_article',
    'like_pin',
    'collect_article',
    'follow_user',
    'get_user_profile'
  ]
};

/**
 * 测试用例模板
 */
export const TEST_CASES = {
  // 基础功能测试
  basic: {
    'get_articles': {
      args: { limit: 5, sort_type: 200 },
      expectedFields: ['articles', 'total_count', 'has_more'],
      minResults: 1
    },
    'search_articles': {
      args: { keyword: 'JavaScript', limit: 3 },
      expectedFields: ['articles', 'total_count'],
      minResults: 0 // 搜索可能无结果
    },
    'get_pins': {
      args: { limit: 5 },
      expectedFields: ['pins', 'total_count', 'has_more'],
      minResults: 1
    }
  },

  // 性能测试
  performance: {
    'concurrent_requests': {
      requests: [
        { tool: 'get_articles', args: { limit: 5 } },
        { tool: 'get_pins', args: { limit: 5 } },
        { tool: 'get_trending_articles', args: { limit: 3 } }
      ],
      maxTime: 10000
    },
    'large_data_request': {
      tool: 'get_articles',
      args: { limit: 50 },
      maxTime: 8000
    }
  },

  // 错误处理测试
  errorHandling: {
    'invalid_parameters': [
      { tool: 'get_articles', args: { limit: -1 } },
      { tool: 'search_articles', args: { keyword: '' } },
      { tool: 'get_pins', args: { limit: 1000 } }
    ],
    'missing_parameters': [
      { tool: 'search_articles', args: {} },
      { tool: 'analyze_article_quality', args: {} }
    ]
  }
};

/**
 * 获取测试配置
 */
export function getTestConfig() {
  return {
    ...TEST_CONFIG,
    // 运行时配置覆盖
    api: {
      ...TEST_CONFIG.api,
      timeout: parseInt(process.env.TEST_TIMEOUT) || TEST_CONFIG.api.timeout
    },
    environment: {
      ...TEST_CONFIG.environment,
      skipAuthTests: !process.env.JUEJIN_COOKIE || process.env.SKIP_AUTH_TESTS === 'true'
    }
  };
}

/**
 * 获取工具分类
 */
export function getToolsByCategory(category) {
  return TOOL_CATEGORIES[category] || [];
}

/**
 * 获取所有工具
 */
export function getAllTools() {
  return Object.values(TOOL_CATEGORIES).flat();
}

/**
 * 检查是否应该跳过测试
 */
export function shouldSkipTest(toolName, reason = '') {
  const config = getTestConfig();
  
  // 跳过授权测试
  if (config.environment.skipAuthTests && TOOL_CATEGORIES.auth.includes(toolName)) {
    return { skip: true, reason: '未配置授权Cookie' };
  }

  // 跳过性能测试
  if (!config.environment.enablePerformanceTests && TOOL_CATEGORIES.performance.includes(toolName)) {
    return { skip: true, reason: '性能测试已禁用' };
  }

  // 自定义跳过原因
  if (reason) {
    return { skip: true, reason };
  }

  return { skip: false };
}

/**
 * 格式化测试结果
 */
export function formatTestResult(result, duration = 0) {
  return {
    timestamp: new Date().toISOString(),
    duration: `${duration}ms`,
    success: !result.isError,
    data: result.content?.[0]?.text?.substring(0, 200) + '...',
    error: result.isError ? result.content?.[0]?.text : null
  };
}

/**
 * 生成测试报告
 */
export function generateTestReport(results) {
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;
  const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return {
    summary: {
      total,
      passed,
      failed,
      successRate: `${successRate}%`,
      timestamp: new Date().toISOString()
    },
    details: results,
    recommendations: generateRecommendations(results)
  };
}

/**
 * 生成测试建议
 */
function generateRecommendations(results) {
  const recommendations = [];
  const failedTests = results.filter(r => !r.success);

  if (failedTests.length === 0) {
    recommendations.push('🎉 所有测试通过！系统运行正常。');
  } else {
    recommendations.push('🔧 以下是改进建议：');
    
    if (failedTests.some(t => t.error?.includes('timeout'))) {
      recommendations.push('• 检查网络连接和API响应时间');
    }
    
    if (failedTests.some(t => t.error?.includes('unauthorized'))) {
      recommendations.push('• 验证授权配置和Cookie有效性');
    }
    
    if (failedTests.some(t => t.error?.includes('rate limit'))) {
      recommendations.push('• 降低请求频率，避免触发限流');
    }
    
    recommendations.push('• 查看详细错误信息进行针对性修复');
  }

  return recommendations;
}
