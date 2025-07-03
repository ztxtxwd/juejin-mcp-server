# 分析工具文档

## 📊 分析工具概览

分析工具是掘金MCP服务器的智能核心，提供9个专业工具用于深度内容分析、趋势预测和数据洞察。这些工具使用AI算法进行智能分析，为用户提供有价值的数据洞察。

## 🛠️ 工具列表

### 1. get_simple_trends - 简化版趋势分析 🔥

**功能描述**: 提供简化的趋势分析，适合快速了解技术热点和发展方向

**参数说明**:
- `time_range` (number, 可选): 分析时间范围(小时)，默认24
- `categories` (array, 可选): 关注的分类，如["前端", "后端"]
- `include_keywords` (boolean, 可选): 是否包含关键词分析
- `limit` (number, 可选): 返回趋势数量，默认10

**使用示例**:
```json
{
  "tool": "get_simple_trends",
  "arguments": {
    "time_range": 72,
    "categories": ["前端", "AI", "移动开发"],
    "include_keywords": true,
    "limit": 15
  }
}
```

**返回格式**:
```json
{
  "analysis_period": "72小时",
  "trends": [
    {
      "category": "前端",
      "heat_score": 89.5,
      "growth_rate": 15.3,
      "hot_keywords": ["Vue 3", "TypeScript", "Vite"],
      "article_count": 234,
      "pin_count": 156
    }
  ],
  "top_keywords": [
    {
      "keyword": "ChatGPT",
      "mentions": 89,
      "growth": 45.2,
      "sentiment": "positive"
    }
  ],
  "insights": [
    "AI相关技术讨论热度持续上升",
    "前端框架Vue 3采用率快速增长",
    "TypeScript在企业级项目中应用广泛"
  ]
}
```

### 2. analyze_content_trends - 深度内容趋势分析

**功能描述**: 对内容进行深度趋势分析，包括多维度数据挖掘

**参数说明**:
- `time_range` (number, 可选): 分析时间范围(小时)，默认168(7天)
- `categories` (array, 可选): 分析的分类
- `keywords` (array, 可选): 关注的关键词
- `analysis_depth` (string, 可选): 分析深度，"basic"、"detailed"、"comprehensive"

**使用示例**:
```json
{
  "tool": "analyze_content_trends",
  "arguments": {
    "time_range": 336,
    "categories": ["前端", "后端", "AI"],
    "keywords": ["React", "Vue", "Node.js", "Python"],
    "analysis_depth": "comprehensive"
  }
}
```

### 3. get_trending_articles - 热门文章趋势

**功能描述**: 分析和获取当前热门文章的趋势数据

**参数说明**:
- `time_range` (number, 可选): 时间范围(小时)，默认24
- `limit` (number, 可选): 返回数量，默认20
- `category` (string, 可选): 分类筛选
- `include_analysis` (boolean, 可选): 是否包含趋势分析

**使用示例**:
```json
{
  "tool": "get_trending_articles",
  "arguments": {
    "time_range": 48,
    "limit": 25,
    "category": "前端",
    "include_analysis": true
  }
}
```

### 4. analyze_pin_trends - 沸点趋势统计

**功能描述**: 分析沸点动态的趋势和热度变化

**参数说明**:
- `time_range` (number, 可选): 分析时间范围(小时)，默认24
- `topic_filter` (array, 可选): 话题筛选
- `include_sentiment` (boolean, 可选): 是否包含情感分析
- `group_by` (string, 可选): 分组方式

**使用示例**:
```json
{
  "tool": "analyze_pin_trends",
  "arguments": {
    "time_range": 72,
    "topic_filter": ["Vue.js", "React", "Angular"],
    "include_sentiment": true,
    "group_by": "topic"
  }
}
```

### 5. get_trend_analysis - 综合趋势报告

**功能描述**: 生成综合的趋势分析报告，包含多个维度的数据

**参数说明**:
- `report_type` (string, 可选): 报告类型，"daily"、"weekly"、"monthly"
- `categories` (array, 可选): 分析的分类
- `include_predictions` (boolean, 可选): 是否包含预测分析
- `detail_level` (string, 可选): 详细程度，"summary"、"detailed"、"comprehensive"

**使用示例**:
```json
{
  "tool": "get_trend_analysis",
  "arguments": {
    "report_type": "weekly",
    "categories": ["前端", "后端", "移动开发", "AI"],
    "include_predictions": true,
    "detail_level": "comprehensive"
  }
}
```

### 6. analyze_content_quality - 通用内容质量评估

**功能描述**: 对各类内容进行质量评估和分析

**参数说明**:
- `content_type` (string, 必需): 内容类型，"article"、"pin"、"comment"
- `content_id` (string, 必需): 内容ID
- `analysis_metrics` (array, 可选): 分析指标
- `include_suggestions` (boolean, 可选): 是否包含改进建议

**使用示例**:
```json
{
  "tool": "analyze_content_quality",
  "arguments": {
    "content_type": "article",
    "content_id": "7234567890123456789",
    "analysis_metrics": ["readability", "technical_depth", "engagement"],
    "include_suggestions": true
  }
}
```

### 7. compare_content_performance - 内容表现对比分析

**功能描述**: 对比分析多个内容的表现和效果

**参数说明**:
- `content_ids` (array, 必需): 要对比的内容ID数组
- `metrics` (array, 可选): 对比指标
- `time_range` (number, 可选): 分析时间范围
- `include_insights` (boolean, 可选): 是否包含洞察分析

**使用示例**:
```json
{
  "tool": "compare_content_performance",
  "arguments": {
    "content_ids": ["7234567890123456789", "7234567890123456790"],
    "metrics": ["view_count", "engagement_rate", "quality_score"],
    "time_range": 168,
    "include_insights": true
  }
}
```

### 8. get_content_insights - 内容洞察分析

**功能描述**: 深度分析内容数据，提供有价值的洞察和建议

**参数说明**:
- `analysis_scope` (string, 可选): 分析范围，"category"、"author"、"topic"、"global"
- `scope_value` (string, 可选): 范围值，如分类名称或作者ID
- `time_range` (number, 可选): 分析时间范围(小时)
- `insight_types` (array, 可选): 洞察类型

**使用示例**:
```json
{
  "tool": "get_content_insights",
  "arguments": {
    "analysis_scope": "category",
    "scope_value": "前端",
    "time_range": 720,
    "insight_types": ["trend", "quality", "engagement", "prediction"]
  }
}
```

### 9. generate_analytics_report - 生成分析报告

**功能描述**: 生成综合的数据分析报告，包含图表和详细分析

**参数说明**:
- `report_type` (string, 必需): 报告类型，"trend"、"quality"、"performance"、"comprehensive"
- `time_period` (string, 可选): 时间周期，"daily"、"weekly"、"monthly"
- `categories` (array, 可选): 包含的分类
- `include_charts` (boolean, 可选): 是否包含图表数据
- `export_format` (string, 可选): 导出格式，"json"、"markdown"

**使用示例**:
```json
{
  "tool": "generate_analytics_report",
  "arguments": {
    "report_type": "comprehensive",
    "time_period": "weekly",
    "categories": ["前端", "后端", "AI"],
    "include_charts": true,
    "export_format": "markdown"
  }
}
```

## 💡 使用建议

### 新手入门
1. **从简化版开始**: 使用`get_simple_trends`快速了解趋势
2. **单一分析**: 先分析单个内容或分类
3. **基础报告**: 生成简单的分析报告

### 进阶分析
1. **深度分析**: 使用`analyze_content_trends`进行深度挖掘
2. **对比分析**: 通过`compare_content_performance`对比效果
3. **综合报告**: 生成全面的分析报告

### 专业应用
1. **预测分析**: 利用AI预测功能预判趋势
2. **多维分析**: 结合多个工具进行立体分析
3. **定制报告**: 根据需求定制专业报告

## 🎯 应用场景

### 内容策略
- 分析热门内容特征，指导内容创作
- 预测内容趋势，提前布局
- 优化内容质量，提升影响力

### 技术决策
- 分析技术趋势，辅助技术选型
- 了解社区反馈，评估技术成熟度
- 预测技术发展，制定学习计划

### 市场研究
- 分析行业动态，把握市场机会
- 监控竞品表现，制定竞争策略
- 预测市场趋势，指导产品规划

## 🔧 故障排除

### 常见问题
1. **分析结果不准确**: 调整时间范围和样本大小
2. **数据不完整**: 检查分析参数和权限设置
3. **报告生成失败**: 确认报告类型和格式支持

### 性能优化
1. **合理设置时间范围**: 避免分析过大的数据集
2. **选择合适的分析深度**: 根据需求选择分析级别
3. **利用缓存**: 相同分析会被缓存加速

---

**通过分析工具，获得深度的数据洞察和智能预测！** 📊🧠

*最后更新: 2025-07-03*
