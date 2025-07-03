# 性能工具文档

## ⚡ 性能工具概览

性能工具提供5个专业工具，用于系统监控、性能优化和健康检查。这些工具帮助开发者和运维人员监控MCP服务器的运行状态，优化性能表现。

## 🛠️ 工具列表

### 1. get_performance_stats - 性能统计信息

**功能描述**: 获取MCP服务器的详细性能统计数据

**参数说明**:
- `include_history` (boolean, 可选): 是否包含历史数据，默认false
- `time_range` (number, 可选): 历史数据时间范围(分钟)，默认60
- `metrics` (array, 可选): 指定要获取的指标

**使用示例**:
```json
{
  "tool": "get_performance_stats",
  "arguments": {
    "include_history": true,
    "time_range": 120,
    "metrics": ["response_time", "memory_usage", "api_calls"]
  }
}
```

**返回格式**:
```json
{
  "timestamp": "2025-07-03T16:00:00Z",
  "uptime": "2d 14h 32m",
  "performance": {
    "response_time": {
      "avg": 245,
      "min": 89,
      "max": 1250,
      "p95": 450,
      "p99": 890
    },
    "memory_usage": {
      "used": 34.5,
      "total": 512,
      "percentage": 6.7,
      "peak": 45.2
    },
    "cpu_usage": {
      "current": 12.3,
      "avg": 8.7,
      "peak": 34.5
    },
    "api_calls": {
      "total": 15420,
      "success": 15234,
      "failed": 186,
      "success_rate": 98.8
    }
  },
  "network": {
    "requests_per_minute": 23.4,
    "bandwidth_usage": "1.2 MB/min",
    "connection_pool": {
      "active": 5,
      "idle": 15,
      "max": 50
    }
  },
  "history": [
    {
      "timestamp": "2025-07-03T15:55:00Z",
      "response_time": 234,
      "memory_usage": 33.8,
      "cpu_usage": 11.2
    }
  ]
}
```

### 2. get_cache_stats - 缓存使用情况

**功能描述**: 获取缓存系统的使用统计和性能数据

**参数说明**:
- `cache_type` (string, 可选): 缓存类型，"memory"、"redis"、"all"，默认"all"
- `include_keys` (boolean, 可选): 是否包含缓存键信息，默认false
- `detailed` (boolean, 可选): 是否返回详细信息，默认false

**使用示例**:
```json
{
  "tool": "get_cache_stats",
  "arguments": {
    "cache_type": "all",
    "include_keys": true,
    "detailed": true
  }
}
```

**返回格式**:
```json
{
  "cache_stats": {
    "memory_cache": {
      "total_keys": 1250,
      "used_memory": "12.5 MB",
      "hit_rate": 87.3,
      "miss_rate": 12.7,
      "evictions": 45,
      "expires": 234
    },
    "api_cache": {
      "total_entries": 890,
      "cache_size": "8.9 MB",
      "hit_rate": 92.1,
      "avg_ttl": 285,
      "oldest_entry": "2025-07-03T14:30:00Z"
    }
  },
  "performance": {
    "cache_lookup_time": 2.3,
    "cache_write_time": 1.8,
    "cache_efficiency": 89.5
  },
  "top_cached_apis": [
    {
      "endpoint": "/api/articles",
      "hit_count": 456,
      "hit_rate": 94.2
    },
    {
      "endpoint": "/api/pins",
      "hit_count": 234,
      "hit_rate": 89.7
    }
  ],
  "cache_keys": [
    {
      "key": "articles:frontend:page1",
      "size": "2.3 KB",
      "ttl": 245,
      "hits": 23
    }
  ]
}
```

### 3. get_system_health - 系统健康检查

**功能描述**: 执行全面的系统健康检查，检测潜在问题

**参数说明**:
- `check_level` (string, 可选): 检查级别，"basic"、"standard"、"comprehensive"，默认"standard"
- `include_recommendations` (boolean, 可选): 是否包含优化建议，默认true
- `check_external` (boolean, 可选): 是否检查外部依赖，默认true

**使用示例**:
```json
{
  "tool": "get_system_health",
  "arguments": {
    "check_level": "comprehensive",
    "include_recommendations": true,
    "check_external": true
  }
}
```

**返回格式**:
```json
{
  "overall_health": "good",
  "health_score": 87.5,
  "checks": {
    "system_resources": {
      "status": "healthy",
      "memory": "good",
      "cpu": "good",
      "disk": "good"
    },
    "api_connectivity": {
      "status": "healthy",
      "juejin_api": "online",
      "response_time": 156,
      "success_rate": 99.2
    },
    "cache_system": {
      "status": "healthy",
      "hit_rate": 87.3,
      "memory_usage": "normal"
    },
    "error_rates": {
      "status": "good",
      "error_rate": 1.2,
      "critical_errors": 0
    }
  },
  "warnings": [
    {
      "type": "performance",
      "message": "API响应时间偶尔超过500ms",
      "severity": "low",
      "recommendation": "考虑增加缓存时间"
    }
  ],
  "recommendations": [
    "定期清理过期缓存以优化内存使用",
    "监控API调用频率，避免达到限制",
    "考虑启用请求压缩以减少网络传输"
  ],
  "last_check": "2025-07-03T16:05:00Z"
}
```

### 4. optimize_performance - 性能优化

**功能描述**: 执行自动性能优化操作

**参数说明**:
- `optimization_type` (string, 可选): 优化类型，"cache"、"memory"、"network"、"all"，默认"all"
- `aggressive` (boolean, 可选): 是否执行激进优化，默认false
- `dry_run` (boolean, 可选): 是否只模拟不实际执行，默认false

**使用示例**:
```json
{
  "tool": "optimize_performance",
  "arguments": {
    "optimization_type": "cache",
    "aggressive": false,
    "dry_run": false
  }
}
```

**返回格式**:
```json
{
  "optimization_results": {
    "cache_optimization": {
      "expired_entries_removed": 45,
      "memory_freed": "2.3 MB",
      "hit_rate_improvement": 3.2
    },
    "memory_optimization": {
      "garbage_collected": true,
      "memory_freed": "1.8 MB",
      "fragmentation_reduced": 12.5
    },
    "network_optimization": {
      "connection_pool_optimized": true,
      "idle_connections_closed": 8,
      "keep_alive_enabled": true
    }
  },
  "performance_improvement": {
    "response_time_reduction": "15%",
    "memory_usage_reduction": "8%",
    "cache_efficiency_increase": "5%"
  },
  "actions_taken": [
    "清理了45个过期缓存条目",
    "执行了内存垃圾回收",
    "优化了网络连接池配置",
    "启用了HTTP Keep-Alive"
  ],
  "next_optimization": "2025-07-03T18:00:00Z"
}
```

### 5. run_performance_benchmark - 性能基准测试

**功能描述**: 运行性能基准测试，评估系统性能表现

**参数说明**:
- `test_type` (string, 可选): 测试类型，"api"、"cache"、"memory"、"comprehensive"，默认"api"
- `duration` (number, 可选): 测试持续时间(秒)，默认60
- `concurrency` (number, 可选): 并发数，默认5
- `include_comparison` (boolean, 可选): 是否包含历史对比，默认true

**使用示例**:
```json
{
  "tool": "run_performance_benchmark",
  "arguments": {
    "test_type": "comprehensive",
    "duration": 120,
    "concurrency": 10,
    "include_comparison": true
  }
}
```

**返回格式**:
```json
{
  "benchmark_results": {
    "test_duration": 120,
    "total_requests": 2340,
    "requests_per_second": 19.5,
    "response_times": {
      "avg": 234,
      "min": 89,
      "max": 1250,
      "p50": 210,
      "p95": 450,
      "p99": 890
    },
    "success_rate": 99.1,
    "error_rate": 0.9,
    "throughput": "2.3 MB/s"
  },
  "api_performance": {
    "get_articles": {
      "avg_response_time": 245,
      "success_rate": 99.5,
      "requests": 456
    },
    "search_articles": {
      "avg_response_time": 312,
      "success_rate": 98.8,
      "requests": 234
    }
  },
  "cache_performance": {
    "hit_rate": 89.3,
    "lookup_time": 2.1,
    "write_time": 1.8
  },
  "comparison": {
    "vs_last_week": {
      "response_time": "+5%",
      "throughput": "-2%",
      "success_rate": "+0.3%"
    },
    "vs_baseline": {
      "response_time": "+12%",
      "throughput": "-8%",
      "success_rate": "+1.2%"
    }
  },
  "recommendations": [
    "考虑增加API缓存时间以提升性能",
    "监控内存使用，避免内存泄漏",
    "优化数据库查询以减少响应时间"
  ]
}
```

## 📊 性能指标说明

### 响应时间指标
- **平均响应时间**: 所有请求的平均处理时间
- **P95响应时间**: 95%的请求在此时间内完成
- **P99响应时间**: 99%的请求在此时间内完成

### 内存使用指标
- **已用内存**: 当前使用的内存量
- **内存使用率**: 内存使用百分比
- **峰值内存**: 历史最高内存使用量

### 缓存性能指标
- **命中率**: 缓存命中的百分比
- **未命中率**: 缓存未命中的百分比
- **缓存效率**: 综合缓存性能评分

## 💡 使用建议

### 定期监控
1. **每日检查**: 使用`get_system_health`进行日常健康检查
2. **性能统计**: 定期查看`get_performance_stats`了解系统状态
3. **缓存监控**: 监控缓存使用情况，及时清理

### 性能优化
1. **自动优化**: 定期运行`optimize_performance`自动优化
2. **基准测试**: 定期进行性能基准测试
3. **问题诊断**: 根据监控数据诊断性能问题

### 预防性维护
1. **阈值监控**: 设置性能阈值，及时预警
2. **容量规划**: 根据使用趋势规划资源
3. **故障预防**: 主动发现和解决潜在问题

## 🎯 应用场景

### 开发环境
- 监控开发过程中的性能变化
- 优化代码和配置
- 进行性能测试和调优

### 生产环境
- 实时监控系统健康状态
- 自动化性能优化
- 故障预警和快速响应

### 运维管理
- 生成性能报告
- 容量规划和资源优化
- 系统维护和升级决策

## 🔧 故障排除

### 性能问题诊断
1. **响应慢**: 检查API响应时间和缓存命中率
2. **内存泄漏**: 监控内存使用趋势
3. **高错误率**: 分析错误日志和网络连接

### 优化建议
1. **缓存优化**: 调整缓存策略和TTL
2. **内存管理**: 定期清理和垃圾回收
3. **网络优化**: 优化连接池和请求压缩

---

**通过性能工具，确保MCP服务器的最佳运行状态！** ⚡📈

*最后更新: 2025-07-03*
