# 文章工具文档

## 📝 文章工具概览

文章工具是掘金MCP服务器的核心功能之一，提供7个专业工具用于文章获取、搜索、质量分析和推荐。

## 🛠️ 工具列表

### 1. get_articles - 获取文章列表

**功能描述**: 获取掘金平台的技术文章列表，支持分类筛选和排序

**参数说明**:
- `limit` (number, 可选): 返回文章数量，默认10，最大100
- `category_id` (string, 可选): 分类ID，如"6809637767543259144"(前端)
- `sort_type` (string, 可选): 排序方式，"newest"(最新)、"hottest"(最热)
- `include_quality_score` (boolean, 可选): 是否包含质量评分

**使用示例**:
```json
{
  "tool": "get_articles",
  "arguments": {
    "limit": 5,
    "category_id": "6809637767543259144",
    "sort_type": "hottest",
    "include_quality_score": true
  }
}
```

**返回格式**:
```json
{
  "articles": [
    {
      "article_id": "7234567890123456789",
      "title": "Vue 3.0 新特性详解",
      "author": "技术专家",
      "view_count": 1500,
      "digg_count": 89,
      "comment_count": 23,
      "collect_count": 156,
      "quality_score": 85.6,
      "tags": ["Vue", "前端", "JavaScript"],
      "brief_content": "文章摘要...",
      "ctime": "2025-07-03T10:00:00Z"
    }
  ],
  "total": 1000,
  "has_more": true
}
```

### 2. search_articles - 搜索文章

**功能描述**: 根据关键词搜索相关的技术文章

**参数说明**:
- `keyword` (string, 必需): 搜索关键词
- `limit` (number, 可选): 返回结果数量，默认10
- `sort_type` (string, 可选): 排序方式，"relevance"(相关性)、"newest"(最新)

**使用示例**:
```json
{
  "tool": "search_articles",
  "arguments": {
    "keyword": "React Hooks",
    "limit": 10,
    "sort_type": "relevance"
  }
}
```

### 3. get_article_recommendations - 文章推荐

**功能描述**: 基于用户兴趣和行为的个性化文章推荐

**参数说明**:
- `interests` (array, 可选): 兴趣标签数组，如["前端", "Vue", "React"]
- `limit` (number, 可选): 推荐数量，默认5
- `exclude_read` (boolean, 可选): 是否排除已读文章

**使用示例**:
```json
{
  "tool": "get_article_recommendations",
  "arguments": {
    "interests": ["前端", "TypeScript", "性能优化"],
    "limit": 8,
    "exclude_read": true
  }
}
```

### 4. analyze_article_quality - 文章质量分析

**功能描述**: 对指定文章进行多维度质量分析和评估

**参数说明**:
- `article_id` (string, 必需): 文章ID
- `include_predictions` (boolean, 可选): 是否包含预测分析
- `analysis_depth` (string, 可选): 分析深度，"basic"、"detailed"、"comprehensive"

**使用示例**:
```json
{
  "tool": "analyze_article_quality",
  "arguments": {
    "article_id": "7234567890123456789",
    "include_predictions": true,
    "analysis_depth": "comprehensive"
  }
}
```

**返回格式**:
```json
{
  "article_id": "7234567890123456789",
  "quality_score": 85.6,
  "analysis": {
    "content_quality": 88,
    "technical_depth": 82,
    "readability": 90,
    "engagement": 85,
    "originality": 87
  },
  "predictions": {
    "potential_views": 2500,
    "expected_engagement": "high",
    "trending_probability": 0.75
  },
  "recommendations": [
    "内容结构清晰，技术深度适中",
    "建议增加更多实际案例",
    "代码示例质量较高"
  ]
}
```

### 5. get_trending_articles - 热门文章

**功能描述**: 获取当前热门和趋势文章

**参数说明**:
- `time_range` (number, 可选): 时间范围(小时)，默认24
- `limit` (number, 可选): 返回数量，默认10
- `category` (string, 可选): 分类筛选

**使用示例**:
```json
{
  "tool": "get_trending_articles",
  "arguments": {
    "time_range": 48,
    "limit": 15,
    "category": "前端"
  }
}
```

### 6. get_simple_trends - 简化版趋势分析

**功能描述**: 提供简化的文章趋势分析，适合快速了解热点

**参数说明**:
- `time_range` (number, 可选): 分析时间范围(小时)，默认24
- `categories` (array, 可选): 关注的分类
- `include_keywords` (boolean, 可选): 是否包含关键词分析

**使用示例**:
```json
{
  "tool": "get_simple_trends",
  "arguments": {
    "time_range": 72,
    "categories": ["前端", "后端", "移动开发"],
    "include_keywords": true
  }
}
```

### 7. get_latest_articles - 最新文章

**功能描述**: 获取最新发布的技术文章

**参数说明**:
- `limit` (number, 可选): 返回数量，默认10
- `category_filter` (array, 可选): 分类过滤
- `min_quality_score` (number, 可选): 最低质量分数

**使用示例**:
```json
{
  "tool": "get_latest_articles",
  "arguments": {
    "limit": 20,
    "category_filter": ["前端", "全栈"],
    "min_quality_score": 70
  }
}
```

## 💡 使用建议

### 新手推荐
1. **从基础开始**: 使用`get_articles`了解基本功能
2. **搜索实践**: 用`search_articles`查找感兴趣的内容
3. **质量评估**: 用`analyze_article_quality`学习判断文章质量

### 进阶使用
1. **个性化推荐**: 配置`get_article_recommendations`获得精准推荐
2. **趋势跟踪**: 结合`get_trending_articles`和`get_simple_trends`
3. **质量筛选**: 设置合适的质量分数阈值

### 最佳实践
1. **合理设置limit**: 避免一次获取过多数据
2. **利用缓存**: 相同参数的请求会被缓存
3. **组合使用**: 结合多个工具实现复杂需求

## 🔧 故障排除

### 常见问题
1. **返回结果为空**: 检查分类ID和搜索关键词
2. **质量分析失败**: 确认文章ID的有效性
3. **推荐不准确**: 调整兴趣标签和参数

### 性能优化
1. **批量处理**: 一次请求获取多篇文章
2. **缓存利用**: 避免重复请求相同内容
3. **参数优化**: 根据需求调整limit和分析深度

---

**通过文章工具，让AI助手具备专业的技术内容分析能力！** 📝✨

*最后更新: 2025-07-03*
