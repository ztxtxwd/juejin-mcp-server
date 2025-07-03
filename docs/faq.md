# 常见问题解答 (FAQ)

## 🤔 基础问题

### Q1: 什么是掘金MCP服务器？
**A**: 这是一个基于Model Context Protocol (MCP)的服务器，为AI助手提供掘金平台的智能内容分析、推荐和趋势洞察能力。它包含34个专业工具，支持文章获取、质量分析、趋势预测等功能。

### Q2: 支持哪些AI客户端？
**A**: 支持所有兼容MCP协议的客户端，包括：
- ✅ Cursor IDE（推荐）
- ✅ Claude Desktop
- ✅ 其他支持MCP的AI客户端

### Q3: 需要付费吗？
**A**: 完全免费！这是一个开源项目，使用MIT许可证。您可以免费使用所有功能。

### Q4: 需要掘金账号吗？
**A**: 
- **基础功能**：不需要，可以直接使用
- **高级功能**：需要掘金Cookie来解锁点赞、收藏等交互功能

## 🚀 安装和配置

### Q5: 如何快速开始？
**A**: 只需要一行命令：
```bash
npx juejin-mcp-server
```
然后在MCP客户端中配置即可使用。

### Q6: 安装失败怎么办？
**A**: 常见解决方案：
```bash
# 检查Node.js版本（需要 >= 18.0.0）
node --version

# 清理npm缓存
npm cache clean --force

# 重新尝试
npx juejin-mcp-server
```

### Q7: 如何配置Cursor IDE？
**A**: 在Cursor设置中添加：
```json
{
  "mcpServers": {
    "juejin-mcp": {
      "command": "npx",
      "args": ["juejin-mcp-server"]
    }
  }
}
```

### Q8: 配置后没有反应怎么办？
**A**: 
1. 检查JSON配置语法是否正确
2. 重启AI客户端
3. 手动测试服务器：`npx juejin-mcp-server --health`

## 🛠️ 功能使用

### Q9: 有哪些主要工具？
**A**: 34个工具分为6大类：
- **文章工具** (7个)：获取、搜索、质量分析
- **沸点工具** (5个)：获取、话题分析
- **分析工具** (9个)：趋势分析、内容洞察
- **推荐工具** (7个)：智能推荐、个性化服务
- **用户工具** (6个)：用户交互、授权管理
- **性能工具** (5个)：系统监控、性能优化

### Q10: 推荐新手使用哪些工具？
**A**: 新手推荐：
- `get_articles` - 获取文章列表
- `get_simple_recommendations` - 简化版推荐
- `get_simple_trends` - 简化版趋势分析
- `analyze_article_quality` - 文章质量分析

### Q11: 如何获取高质量的文章？
**A**: 使用以下AI指令：
```text
"帮我找5篇高质量的前端技术文章"
```
系统会自动调用相关工具并进行质量筛选。

### Q12: 支持哪些技术领域？
**A**: 支持掘金平台的所有技术分类：
- 前端开发（JavaScript、Vue、React等）
- 后端开发（Java、Python、Go等）
- 移动开发（Android、iOS、Flutter等）
- 人工智能、大数据、云计算等

## 🔐 授权和安全

### Q13: 如何启用授权功能？
**A**: 
1. 登录掘金网站获取Cookie
2. 在MCP配置中添加：
```json
{
  "env": {
    "JUEJIN_ENABLE_AUTH": "true",
    "JUEJIN_COOKIE": "your_cookie_here"
  }
}
```

### Q14: Cookie安全吗？
**A**: 
- ✅ Cookie仅在本地使用，不会上传到第三方
- ✅ 仅用于授权功能，不会存储或泄露
- ✅ 建议定期更新Cookie

### Q15: 授权功能有什么用？
**A**: 解锁高级交互功能：
- 点赞文章和沸点
- 收藏优质内容
- 关注感兴趣的用户
- 获取个人用户信息

## ⚡ 性能和优化

### Q16: 响应速度如何？
**A**: 性能表现：
- 平均响应时间：200-500ms
- 推荐准确率：82-84%
- 内存占用：~35MB
- 支持5个并发请求

### Q17: 如何提升性能？
**A**: 优化建议：
- 使用简化版工具（`get_simple_*`）
- 合理设置limit参数（5-20）
- 利用缓存机制
- 避免频繁重复请求

### Q18: 工具调用超时怎么办？
**A**: 
1. 减少limit参数值
2. 使用简化版工具
3. 检查网络连接
4. 增加超时时间配置

## 🔧 故障排除

### Q19: 工具调用失败怎么办？
**A**: 排查步骤：
1. 检查网络连接：`ping api.juejin.cn`
2. 测试服务器：`npx juejin-mcp-server --health`
3. 查看错误信息
4. 参考[故障排除指南](./usage/troubleshooting.md)

### Q20: 返回空结果怎么办？
**A**: 可能原因：
- 参数设置不当（如limit=0）
- API临时不可用
- 网络连接问题
- 搜索关键词无结果

### Q21: 如何调试问题？
**A**: 调试技巧：
```bash
# 启用调试模式
{
  "env": {
    "DEBUG": "true",
    "JUEJIN_LOG_LEVEL": "debug"
  }
}

# 逐步测试
npx juejin-mcp-server --test get_articles
```

## 📚 学习和使用

### Q22: 如何学习使用？
**A**: 学习路径：
1. 阅读[快速上手指南](./quick-start.md)
2. 查看[使用场景](./usage/scenarios.md)
3. 学习[最佳实践](./usage/best-practices.md)
4. 参考[工具文档](./tools/README.md)

### Q23: 有使用示例吗？
**A**: 丰富的使用示例：
- [使用场景指南](./usage/scenarios.md) - 10个典型场景
- [最佳实践](./usage/best-practices.md) - 推荐使用方式
- [工具文档](./tools/README.md) - 每个工具的详细示例

### Q24: 如何写好AI指令？
**A**: 有效指令格式：
```text
"帮我[动作][数量][类型][条件]"

✅ 好的示例：
"帮我找5篇高质量的React技术文章"
"分析最近一周的前端技术趋势"

❌ 避免：
"找些文章"
"看看趋势"
```

## 🤝 社区和贡献

### Q25: 如何报告问题？
**A**: 
1. 搜索[现有Issues](https://github.com/h7ml/juejin-mcp-server/issues)
2. 如果没有相关问题，[创建新Issue](https://github.com/h7ml/juejin-mcp-server/issues/new)
3. 提供详细的错误信息和重现步骤

### Q26: 如何贡献代码？
**A**: 
1. Fork项目
2. 创建功能分支
3. 提交代码和测试
4. 发起Pull Request
5. 参考[贡献指南](../CONTRIBUTING.md)

### Q27: 如何获取帮助？
**A**: 多种方式：
- 📖 查看[完整文档](./README.md)
- 🐛 [GitHub Issues](https://github.com/h7ml/juejin-mcp-server/issues)
- 💬 [GitHub Discussions](https://github.com/h7ml/juejin-mcp-server/discussions)
- 🔧 运行诊断：`npx juejin-mcp-server --health`

## 🔮 未来发展

### Q28: 会添加新功能吗？
**A**: 是的！计划中的功能：
- 更多内容平台支持
- 增强的分析算法
- Web UI界面
- 更多AI客户端支持

### Q29: 如何跟踪更新？
**A**: 
- ⭐ Star项目获取更新通知
- 📦 关注[NPM包](https://www.npmjs.com/package/juejin-mcp-server)
- 📋 查看[更新日志](../CHANGELOG.md)

### Q30: 可以商业使用吗？
**A**: 可以！项目使用MIT许可证，支持商业使用。但请遵守：
- 保留原始许可证声明
- 尊重掘金平台的使用条款
- 合理使用API，避免滥用

---

**还有其他问题？欢迎在[GitHub Discussions](https://github.com/h7ml/juejin-mcp-server/discussions)中提问！** 💬
