# Phase 3 v4.0 Final DevOps Checklist

## 环境准备 (Week 1)

### 1. 数据库备份 ✅
- [x] 备份当前数据库
  ```bash
  cp backend/prisma/dev.db backend/prisma/dev.db.backup.phase3.20260214
  ```

### 2. 环境验证
- [ ] 验证 Redis 连接
  ```bash
  docker ps | grep redis
  redis-cli ping
  ```

- [ ] 验证后端服务
  ```bash
  curl http://localhost:3010/api/health
  ```

- [ ] 验证前端服务
  ```bash
  curl http://localhost:5173
  ```

### 3. CI/CD 流水线更新
- [ ] 移除 AI 相关步骤
- [ ] 更新 GitHub Actions workflow
- [ ] 测试流水线

### 4. 监控配置更新
- [ ] 移除 AI 相关指标
- [ ] 移除 AI 成本告警
- [ ] 更新 Grafana 仪表板

## 数据库迁移准备

### 1. 新表设计
- [ ] GrowthRecord 表
- [ ] Milestone 表  
- [ ] Comment 表

### 2. 表扩展
- [ ] Album 表（访问密码字段）
- [ ] SharedAlbum 表

### 3. Migration 创建
- [ ] 创建 Prisma migration
- [ ] 测试 migration
- [ ] 文档化变更

## 部署准备

### 1. Docker 配置
- [ ] 更新 docker-compose.yml
- [ ] 移除 AI 相关服务

### 2. 环境变量
- [ ] 更新 .env.example
- [ ] 更新生产环境配置

### 3. 文档更新
- [ ] 更新部署文档
- [ ] 更新监控文档
- [ ] 更新故障排查指南

## 测试准备

### 1. 性能测试
- [ ] 配置 k6 测试环境
- [ ] 编写测试脚本

### 2. 安全测试
- [ ] COPPA 合规测试计划
- [ ] XSS 防护测试计划
- [ ] 访问密码测试计划

## 完成标准

- [ ] 所有环境验证通过
- [ ] CI/CD 流水线测试通过
- [ ] 监控配置更新完成
- [ ] 数据库迁移准备就绪
- [ ] 测试环境准备完成

---

**准备时间**: Week 1 (Feb 17-21)
**负责人**: DevOps Team
**状态**: 进行中
